import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateCEODashboard } from '../../../utils/dashboardIntelligence';
import { KPICard, Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';
import TrendCurve from '../ui/TrendCurve';
import RecordExpenseModal from '../ceo/RecordExpenseModal';

export default function CEOCommandCenter({
    token,
    user,
    refreshTrigger,
    onRefresh,
    onOpenBooking,
    onOpenLead: _onOpenLead,
    onOpenQuote: _onOpenQuote,
    onAddLead: _onAddLead,
    onLogout: _onLogout
}) {
    const [dashData, setDashData] = useState(null);
    const [rawBookings, setRawBookings] = useState([]);
    const [rawPayments, setRawPayments] = useState([]);
    const [rawExpenses, setRawExpenses] = useState([]);
    const [rawVendors, setRawVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setAccessDenied(false);
        try {
            const res = await crmApi.fetchCEODashboard(token);
            if (res.success) {
                const bList = res.bookings || [];
                const cpList = res.customerPayments || [];
                const vpList = res.vendorPayments || [];
                const expList = res.expenses || [];
                const vList = res.vendors || [];

                setRawBookings(bList);
                setRawPayments(cpList);
                setRawExpenses(expList);
                setRawVendors(vList);

                const computed = calculateCEODashboard({
                    bookings: bList,
                    customerPayments: cpList,
                    vendorPayments: vpList,
                    expenses: expList,
                    quotes: res.quotes || [],
                    leads: res.leads || [],
                    vendors: vList
                });
                setDashData(computed);
            }
        } catch (err) {
            if (err.message?.includes('403') || err.message?.includes('Forbidden') || err.message?.includes('Access denied')) {
                setAccessDenied(true);
            } else {
                console.error('Failed to load CEO Dashboard:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshTrigger]);

    // Secondary Operational Metrics Calculation
    const operationalMetrics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let upcomingCount = 0;
        let inProgressCount = 0;
        let servicesPendingCount = 0;
        let paymentsDueCount = 0;

        rawBookings.forEach((b) => {
            if (b.bookingStatus === 'CANCELLED') return;

            if (b.bookingStatus === 'IN_PROGRESS' || b.bookingStatus === 'TRIP_STARTED') {
                inProgressCount++;
            } else if (b.bookingStatus !== 'COMPLETED') {
                const tDateStr = b.travelDetails?.travelDate;
                if (!tDateStr) {
                    upcomingCount++;
                } else {
                    const tDate = new Date(tDateStr);
                    if (!isNaN(tDate.getTime()) && tDate >= today) {
                        upcomingCount++;
                    }
                }
            }

            // Customer due
            const due = b.customerPaymentSummary?.customerDue ?? 0;
            if (due > 0) paymentsDueCount++;

            // Services readiness / assignment pending
            const svcs = b.services || b.servicesList || [];
            svcs.forEach((s) => {
                if (s.commercialModel !== 'CUSTOMER_DIRECT' && !s.isAssigned && s.readinessStatus !== 'READY') {
                    servicesPendingCount++;
                }
            });
        });

        const activeResourcesCount = rawVendors.filter(
            (v) => v.status === 'ACTIVE' || v.availabilityStatus === 'Active'
        ).length;

        return {
            upcomingTrips: upcomingCount,
            tripsInProgress: inProgressCount,
            servicesPending: servicesPendingCount,
            paymentsDue: paymentsDueCount,
            activeResources: activeResourcesCount
        };
    }, [rawBookings, rawVendors]);

    // Clean Chronological Recent Activity Feed
    const recentActivity = useMemo(() => {
        const events = [];

        // Recent Bookings
        rawBookings.slice(0, 5).forEach((b) => {
            events.push({
                id: `bkg_${b._id}`,
                type: 'BOOKING',
                title: `Booking Confirmed: ${b.bookingNumber}`,
                subtitle: `${b.customerDetails?.name || 'Guest'} · ₹${(b.customerPaymentSummary?.packagePrice ?? b.packageDetails?.finalCustomerPrice ?? 0).toLocaleString('en-IN')}`,
                time: b.createdAt || b.bookingDate || new Date().toISOString(),
                badge: <Badge variant="blue">Booking</Badge>,
                bookingObj: b
            });
        });

        // Recent Customer Payments
        rawPayments.slice(0, 5).forEach((p, idx) => {
            events.push({
                id: `pay_${idx}`,
                type: 'PAYMENT',
                title: `Payment Received: ₹${(Number(p.amount) || 0).toLocaleString('en-IN')}`,
                subtitle: `Via ${p.paymentMethod || 'Online'} · Ref: ${p.referenceNumber || 'Verified'}`,
                time: p.paymentDate || p.createdAt || new Date().toISOString(),
                badge: <Badge variant="success">Collection</Badge>
            });
        });

        // Recent Expenses
        rawExpenses.slice(0, 5).forEach((e) => {
            events.push({
                id: `exp_${e._id || e.expenseId}`,
                type: 'EXPENSE',
                title: `Expense Logged: ₹${(Number(e.amount) || 0).toLocaleString('en-IN')}`,
                subtitle: `${e.description || e.expenseCategory} (${e.expenseCategory})`,
                time: e.expenseDate || e.createdAt || new Date().toISOString(),
                badge: <Badge variant="danger">Expense</Badge>
            });
        });

        // Sort latest first
        return events
            .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
            .slice(0, 6);
    }, [rawBookings, rawPayments, rawExpenses]);

    // Real Trend Curve Trajectories (Chronological)
    const trendIntelligence = useMemo(() => {
        // Group payments by date
        const payMap = {};
        rawPayments.forEach((p) => {
            const d = p.paymentDate || p.createdAt;
            if (!d) return;
            const key = new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            payMap[key] = (payMap[key] || 0) + (Number(p.amount) || 0);
        });
        const payDates = Object.keys(payMap).slice(-7);
        const collectionsSeries = payDates.map((k) => ({ label: k, value: payMap[k] }));

        // Group bookings by date
        const bkgMap = {};
        rawBookings.forEach((b) => {
            const d = b.createdAt || b.bookingDate;
            if (!d) return;
            const key = new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            bkgMap[key] = (bkgMap[key] || 0) + 1;
        });
        const bkgDates = Object.keys(bkgMap).slice(-7);
        const bookingsSeries = bkgDates.map((k) => ({ label: k, value: bkgMap[k] }));

        return {
            collectionsSeries,
            bookingsSeries
        };
    }, [rawPayments, rawBookings]);

    if (accessDenied || user?.role !== 'CEO') {
        return (
            <div className="bg-red-50 border border-red-200 p-8 rounded-2xl text-center space-y-3 max-w-lg mx-auto my-12 shadow-sm">
                <span className="text-3xl block">🔒</span>
                <h3 className="text-lg font-bold text-red-900">403 Forbidden — CEO Access Required</h3>
                <p className="text-xs text-red-700 font-medium leading-relaxed">
                    This executive command center contains financial revenue, profit margins, and net cash flow algorithms. Access is strictly restricted to CEO / Owner accounts.
                </p>
            </div>
        );
    }

    const totalBookings = dashData?.totalBookings ?? rawBookings.length;
    const bookingValue = Number(dashData?.totalRevenue) || 0;
    const collections = Number(dashData?.customerCashCollected) || 0;
    const customerDue = Number(dashData?.customerOutstanding) || 0;
    const vendorPayable = Number(dashData?.vendorOutstanding) || 0;
    const expectedProfit = Number(dashData?.expectedProfit) || 0;
    const realizedProfit = dashData?.realizedProfit;

    return (
        <div className="space-y-6">
            {/* WORKSPACE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Business Overview</span>
                        <Badge variant="blue">CEO Command Center</Badge>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Monitor bookings, collections, resources and profitability
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsExpenseModalOpen(true)}
                    >
                        + Record Expense
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={loading}
                        disabled={loading}
                        onClick={() => {
                            loadData();
                            if (onRefresh) onRefresh();
                        }}
                    >
                        🔄 Refresh Intelligence
                    </Button>
                </div>
            </div>

            {/* QUICK DECISION STRIP ("Business Kaisa Chal Raha Hai?") */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 rounded-2xl shadow-sm space-y-3 border border-blue-800">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-700/50 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>Executive Pulse — Instant Business Answers</span>
                    </span>
                    <span className="text-[11px] text-blue-200">
                        Liquid Cash: <strong className="text-emerald-300">₹{(Number(dashData?.netCashPosition) || 0).toLocaleString('en-IN')}</strong>
                    </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                        <span className="text-[10px] text-blue-300 block">Kitna Paisa Aaya?</span>
                        <span className="text-sm font-bold text-emerald-300">₹{collections.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-blue-300 block">Kitna Lena Hai?</span>
                        <span className="text-sm font-bold text-amber-300">₹{customerDue.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-blue-300 block">Kitna Dena Hai?</span>
                        <span className="text-sm font-bold text-rose-300">₹{vendorPayable.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-blue-300 block">Kitna Profit Hai?</span>
                        <span className="text-sm font-bold text-white">₹{expectedProfit.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                        <span className="text-[10px] text-blue-300 block">Pending Services?</span>
                        <span className="text-sm font-bold text-yellow-300">{operationalMetrics.servicesPending} Items</span>
                    </div>
                </div>
            </div>

            {/* TOP-LEVEL 6 KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Total Bookings */}
                <KPICard
                    title="Total Bookings"
                    value={totalBookings}
                    subtext={`${operationalMetrics.upcomingTrips} upcoming, ${operationalMetrics.tripsInProgress} active`}
                    variant="default"
                />

                {/* 2. Booking Value */}
                <KPICard
                    title="Booking Value"
                    value={`₹${bookingValue.toLocaleString('en-IN')}`}
                    subtext="Total package revenue"
                    variant="default"
                />

                {/* 3. Collections */}
                <KPICard
                    title="Collections"
                    value={`₹${collections.toLocaleString('en-IN')}`}
                    subtext="Cash in hand inflow"
                    variant="success"
                />

                {/* 4. Customer Due */}
                <KPICard
                    title="Customer Due"
                    value={`₹${customerDue.toLocaleString('en-IN')}`}
                    subtext="Pending receivables"
                    variant={customerDue > 0 ? 'warning' : 'default'}
                />

                {/* 5. Vendor Payable */}
                <KPICard
                    title="Vendor Payable"
                    value={`₹${vendorPayable.toLocaleString('en-IN')}`}
                    subtext="Pending disbursements"
                    variant={vendorPayable > 0 ? 'danger' : 'default'}
                />

                {/* 6. Profit */}
                <KPICard
                    title="Expected Profit"
                    value={`₹${expectedProfit.toLocaleString('en-IN')}`}
                    subtext={realizedProfit != null ? `Realized: ₹${Number(realizedProfit).toLocaleString('en-IN')}` : 'Realized: Pending'}
                    variant="accent"
                />
            </div>

            {/* CEO VISUAL INTELLIGENCE TREND CURVES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TrendCurve
                    title="Cash Inflow & Collections Curve"
                    subtitle="Real-time verified traveler payments recorded"
                    data={trendIntelligence.collectionsSeries}
                    formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                    period="Recent Timeline"
                />
                <TrendCurve
                    title="Booking Velocity Trajectory"
                    subtitle="Chronological traveler booking confirmations"
                    data={trendIntelligence.bookingsSeries}
                    formatter={(v) => `${v} Bookings`}
                    period="Recent Timeline"
                />
            </div>

            {/* SECONDARY 5 OPERATIONAL CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Upcoming Trips */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Upcoming Trips</span>
                    <div className="text-xl font-bold text-gray-900">{operationalMetrics.upcomingTrips}</div>
                    <span className="text-[11px] text-gray-500">Next 30 days departure</span>
                </div>

                {/* 2. Trips In Progress */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Trips In Progress</span>
                    <div className="text-xl font-bold text-blue-700">{operationalMetrics.tripsInProgress}</div>
                    <span className="text-[11px] text-gray-500">Active traveler journeys</span>
                </div>

                {/* 3. Services Pending */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Services Pending</span>
                    <div className={`text-xl font-bold ${operationalMetrics.servicesPending > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
                        {operationalMetrics.servicesPending}
                    </div>
                    <span className="text-[11px] text-gray-500">Awaiting vendor assignment</span>
                </div>

                {/* 4. Payments Due */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payments Due</span>
                    <div className={`text-xl font-bold ${operationalMetrics.paymentsDue > 0 ? 'text-rose-700' : 'text-gray-900'}`}>
                        {operationalMetrics.paymentsDue}
                    </div>
                    <span className="text-[11px] text-gray-500">Bookings with balance &gt; ₹0</span>
                </div>

                {/* 5. Active Resources */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Resources</span>
                    <div className="text-xl font-bold text-emerald-700">{operationalMetrics.activeResources}</div>
                    <span className="text-[11px] text-gray-500">Verified vendors &amp; partners</span>
                </div>
            </div>

            {/* SPLIT GRID: RECENT ACTIVITY & OPERATIONAL RADAR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. RECENT ACTIVITY SECTION */}
                <Card>
                    <CardHeader
                        title="Recent Business Activity"
                        subtitle="Chronological stream of bookings, collections and expenses"
                    />
                    <div className="p-4 space-y-3">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-6 text-xs text-gray-400 italic">
                                No recent activity recorded.
                            </div>
                        ) : (
                            recentActivity.map((act) => (
                                <div
                                    key={act.id}
                                    onClick={() => act.bookingObj && onOpenBooking && onOpenBooking(act.bookingObj)}
                                    className={`flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs hover:bg-gray-100 transition-colors ${act.bookingObj ? 'cursor-pointer' : ''}`}
                                >
                                    <div className="space-y-0.5">
                                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                                            <span>{act.title}</span>
                                        </div>
                                        <div className="text-[11px] text-gray-500">{act.subtitle}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {act.badge}
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(act.time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* 2. OPERATIONAL RISK RADAR */}
                <Card>
                    <CardHeader
                        title="Operational Risk Radar"
                        subtitle="Exceptions requiring immediate executive intervention"
                    />
                    <div className="p-4 space-y-3">
                        {dashData?.operationalRiskRadar && dashData.operationalRiskRadar.length > 0 ? (
                            dashData.operationalRiskRadar.slice(0, 4).map((risk, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                                        risk.severity === 'HIGH' || risk.severity === 'CRITICAL'
                                            ? 'bg-red-50 border-red-200 text-red-900'
                                            : risk.severity === 'MEDIUM'
                                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                                : 'bg-blue-50 border-blue-200 text-blue-900'
                                    }`}
                                >
                                    <div>
                                        <span className="font-bold block">{risk.title || risk.message || 'Operational Alert'}</span>
                                        <span className="text-[11px] opacity-80">{risk.recommendation || risk.details || 'Review pending actions.'}</span>
                                    </div>
                                    <Badge variant={risk.severity === 'HIGH' || risk.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                                        {risk.severity || 'ALERT'}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                                ✨ All systems optimal. No critical operational delays or collection risks detected.
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* RECORD EXPENSE MODAL */}
            <RecordExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                token={token}
                bookings={rawBookings}
                onExpenseSaved={() => {
                    loadData();
                    if (onRefresh) onRefresh();
                }}
            />
        </div>
    );
}

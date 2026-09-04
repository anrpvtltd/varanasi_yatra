import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateCEODashboard } from '../../../utils/dashboardIntelligence';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';

export default function CEOReportsWorkspace({
    token,
    user: _user,
    refreshTrigger,
    onRefresh
}) {
    const [dashData, setDashData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [_expenses, setExpenses] = useState([]);
    const [vendorPayments, setVendorPayments] = useState([]);
    const [customerPayments, setCustomerPayments] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeReportTab, setActiveReportTab] = useState('BOOKINGS'); // 'BOOKINGS', 'REVENUE', 'COLLECTIONS', 'DUES', 'PAYABLES', 'PROFIT', 'RESOURCES'

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [dashRes, expRes, vendRes] = await Promise.all([
                crmApi.fetchCEODashboard(token),
                crmApi.fetchExpenses(token),
                crmApi.fetchVendors(token)
            ]);

            if (dashRes.success) {
                const bList = dashRes.bookings || [];
                const cPayList = dashRes.customerPayments || [];
                const vPayList = dashRes.vendorPayments || [];
                const expList = expRes.success ? (expRes.expenses || []) : (dashRes.expenses || []);
                const vList = vendRes.success ? (vendRes.vendors || []) : (dashRes.vendors || []);

                setBookings(bList);
                setCustomerPayments(cPayList);
                setVendorPayments(vPayList);
                setExpenses(expList);
                setVendors(vList);

                const computed = calculateCEODashboard({
                    bookings: bList,
                    customerPayments: cPayList,
                    vendorPayments: vPayList,
                    expenses: expList,
                    quotes: dashRes.quotes || [],
                    leads: dashRes.leads || [],
                    vendors: vList
                });
                setDashData(computed);
            }
        } catch (err) {
            console.error('Failed to load CEO Reports data:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshTrigger]);

    // 1. Booking Summary
    const bookingSummary = useMemo(() => {
        const total = bookings.length;
        const confirmed = bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length;
        const preparing = bookings.filter((b) => b.bookingStatus === 'PREPARING').length;
        const inProgress = bookings.filter((b) => b.bookingStatus === 'IN_PROGRESS' || b.bookingStatus === 'TRIP_STARTED').length;
        const completed = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
        const cancelled = bookings.filter((b) => b.bookingStatus === 'CANCELLED').length;
        const conversionRate = total > 0 ? Math.round(((completed + inProgress + confirmed) / total) * 100) : 0;

        return { total, confirmed, preparing, inProgress, completed, cancelled, conversionRate };
    }, [bookings]);

    // 2. Collection Methods Breakdown
    const collectionsBreakdown = useMemo(() => {
        const methods = { CASH: 0, UPI: 0, BANK_TRANSFER: 0, CARD: 0, OTHER: 0 };
        customerPayments.forEach((p) => {
            const m = (p.paymentMethod || 'OTHER').toUpperCase();
            const amt = Number(p.amount) || 0;
            if (methods[m] !== undefined) methods[m] += amt;
            else methods.OTHER += amt;
        });
        const total = Object.values(methods).reduce((a, b) => a + b, 0);
        return { methods, total };
    }, [customerPayments]);

    // 3. Customer Dues Grouped
    const customerDuesReport = useMemo(() => {
        return bookings
            .filter((b) => b.bookingStatus !== 'CANCELLED' && (b.customerPaymentSummary?.customerDue || 0) > 0)
            .map((b) => ({
                bookingId: b._id,
                bookingNumber: b.bookingNumber,
                customerName: b.customerDetails?.name || 'Guest',
                phone: b.customerDetails?.phone || b.customerDetails?.mobile || 'N/A',
                packagePrice: b.customerPaymentSummary?.packagePrice ?? b.packageDetails?.finalCustomerPrice ?? 0,
                paid: b.customerPaymentSummary?.totalPaid ?? 0,
                due: b.customerPaymentSummary?.customerDue ?? 0,
                travelDate: b.travelDetails?.travelDate || 'N/A'
            }))
            .sort((a, b) => b.due - a.due);
    }, [bookings]);

    // 4. Vendor Payables Grouped
    const vendorPayablesReport = useMemo(() => {
        const vendorMap = {};
        bookings.forEach((b) => {
            if (b.bookingStatus === 'CANCELLED') return;
            if (Array.isArray(b.vendorAssignments)) {
                b.vendorAssignments.forEach((va) => {
                    const vId = va.vendorId || 'unassigned';
                    const vObj = vendors.find((v) => v._id === vId);
                    const vName = vObj?.businessName || vObj?.name || va.vendorName || 'Unassigned Partner';
                    const cat = va.serviceCategory || vObj?.category || 'OTHER';
                    const planned = Number(va.plannedCost) || 0;

                    const paid = (vendorPayments || [])
                        .filter((vp) => vp.bookingId === b._id && vp.vendorId === vId)
                        .reduce((sum, vp) => sum + (Number(vp.amount) || 0), 0);

                    const due = Math.max(0, planned - paid);

                    if (!vendorMap[vId]) {
                        vendorMap[vId] = { vendorName: vName, category: cat, totalPlanned: 0, totalPaid: 0, totalDue: 0, bookingCount: 0 };
                    }
                    vendorMap[vId].totalPlanned += planned;
                    vendorMap[vId].totalPaid += paid;
                    vendorMap[vId].totalDue += due;
                    vendorMap[vId].bookingCount += 1;
                });
            }
        });
        return Object.values(vendorMap).filter((v) => v.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue);
    }, [bookings, vendors, vendorPayments]);

    return (
        <div className="space-y-6">
            {/* WORKSPACE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Executive Reports</span>
                        <Badge variant="blue">Decision Intelligence</Badge>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Executive summaries and business performance intelligence
                    </p>
                </div>

                <div className="flex items-center gap-2">
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
                        🔄 Refresh Reports
                    </Button>
                </div>
            </div>

            {/* REPORT TABS NAVIGATION */}
            <div className="flex border-b border-gray-200 text-xs font-semibold overflow-x-auto gap-1">
                {[
                    { id: 'BOOKINGS', label: 'Booking Summary' },
                    { id: 'REVENUE', label: 'Revenue Summary' },
                    { id: 'COLLECTIONS', label: 'Collections Summary' },
                    { id: 'DUES', label: `Customer Dues (${customerDuesReport.length})` },
                    { id: 'PAYABLES', label: `Vendor Payables (${vendorPayablesReport.length})` },
                    { id: 'PROFIT', label: 'Profit & Margins' },
                    { id: 'RESOURCES', label: `Resource Usage (${vendors.length})` }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveReportTab(tab.id)}
                        className={`px-3.5 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                            activeReportTab === tab.id
                                ? 'border-blue-600 text-blue-600 font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* REPORT 1: BOOKING SUMMARY */}
            {activeReportTab === 'BOOKINGS' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                        <div className="p-3.5 bg-white border border-gray-200 rounded-xl">
                            <span className="text-gray-400 block text-[10px] font-bold uppercase">Total Bookings</span>
                            <span className="text-lg font-bold text-gray-900">{bookingSummary.total}</span>
                        </div>
                        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                            <span className="text-blue-700 block text-[10px] font-bold uppercase">Confirmed</span>
                            <span className="text-lg font-bold text-blue-900">{bookingSummary.confirmed}</span>
                        </div>
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <span className="text-amber-700 block text-[10px] font-bold uppercase">Preparing</span>
                            <span className="text-lg font-bold text-amber-900">{bookingSummary.preparing}</span>
                        </div>
                        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                            <span className="text-purple-700 block text-[10px] font-bold uppercase">In Progress</span>
                            <span className="text-lg font-bold text-purple-900">{bookingSummary.inProgress}</span>
                        </div>
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <span className="text-emerald-700 block text-[10px] font-bold uppercase">Completed</span>
                            <span className="text-lg font-bold text-emerald-900">{bookingSummary.completed}</span>
                        </div>
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                            <span className="text-rose-700 block text-[10px] font-bold uppercase">Cancelled</span>
                            <span className="text-lg font-bold text-rose-900">{bookingSummary.cancelled}</span>
                        </div>
                        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                            <span className="text-gray-600 block text-[10px] font-bold uppercase">Execution Rate</span>
                            <span className="text-lg font-bold text-gray-900">{bookingSummary.conversionRate}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT 2: REVENUE SUMMARY */}
            {activeReportTab === 'REVENUE' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Total Accrual Revenue</span>
                            <div className="text-xl font-bold text-gray-900">₹{(dashData?.totalRevenue || 0).toLocaleString('en-IN')}</div>
                            <p className="text-[11px] text-gray-500">Gross customer package booking value</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Commission Income</span>
                            <div className="text-xl font-bold text-blue-700">₹{(dashData?.commissionIncome || 0).toLocaleString('en-IN')}</div>
                            <p className="text-[11px] text-gray-500">Shopping partner commissions (zero package cost)</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Pass-Through Receipts</span>
                            <div className="text-xl font-bold text-purple-700">₹{(dashData?.passThroughTotal || 0).toLocaleString('en-IN')}</div>
                            <p className="text-[11px] text-gray-500">Exact VIP pass/ticket cost (0% company margin)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT 3: COLLECTIONS SUMMARY */}
            {activeReportTab === 'COLLECTIONS' && (
                <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                            <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Cash Collected</span>
                            <div className="text-xl font-bold text-emerald-900">₹{collectionsBreakdown.total.toLocaleString('en-IN')}</div>
                        </div>
                        <Badge variant="success">Inflow Verified</Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        {Object.entries(collectionsBreakdown.methods).map(([method, amt]) => (
                            <div key={method} className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold uppercase text-gray-400">{method}</span>
                                <div className="font-bold text-gray-900 text-sm">₹{amt.toLocaleString('en-IN')}</div>
                                <div className="text-[10px] text-gray-500">
                                    {collectionsBreakdown.total > 0 ? Math.round((amt / collectionsBreakdown.total) * 100) : 0}% of collections
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REPORT 4: CUSTOMER DUES REPORT */}
            {activeReportTab === 'DUES' && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span>Outstanding receivables awaiting payment collection from travelers.</span>
                        <strong className="text-amber-800">
                            Total Due: ₹{(dashData?.customerOutstanding || 0).toLocaleString('en-IN')}
                        </strong>
                    </div>

                    <TableContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booking</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Travel Date</TableHead>
                                    <TableHead align="right">Package Value</TableHead>
                                    <TableHead align="right">Paid</TableHead>
                                    <TableHead align="right">Outstanding Due</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerDuesReport.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-xs text-gray-400">
                                            No outstanding customer balances! All confirmed bookings are fully settled.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customerDuesReport.map((b) => (
                                        <TableRow key={b.bookingId}>
                                            <TableCell>
                                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                                                    {b.bookingNumber}
                                                </span>
                                            </TableCell>
                                            <TableCell><span className="font-semibold text-gray-900">{b.customerName}</span></TableCell>
                                            <TableCell><span className="font-mono text-xs text-gray-500">{b.phone}</span></TableCell>
                                            <TableCell><span className="text-gray-700 text-xs">{b.travelDate}</span></TableCell>
                                            <TableCell align="right"><span className="text-gray-900 font-semibold">₹{b.packagePrice.toLocaleString('en-IN')}</span></TableCell>
                                            <TableCell align="right"><span className="text-emerald-700 font-semibold">₹{b.paid.toLocaleString('en-IN')}</span></TableCell>
                                            <TableCell align="right"><span className="text-amber-700 font-bold">₹{b.due.toLocaleString('en-IN')}</span></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* REPORT 5: VENDOR PAYABLES REPORT */}
            {activeReportTab === 'PAYABLES' && (
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span>Outstanding vendor and resource liabilities by partner.</span>
                        <strong className="text-rose-800">
                            Total Payable: ₹{(dashData?.vendorOutstanding || 0).toLocaleString('en-IN')}
                        </strong>
                    </div>

                    <TableContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Partner Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead align="center">Bookings</TableHead>
                                    <TableHead align="right">Total Incurred Cost</TableHead>
                                    <TableHead align="right">Total Disbursed</TableHead>
                                    <TableHead align="right">Outstanding Payable</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendorPayablesReport.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-xs text-gray-400">
                                            No pending vendor payables! All partner dues are settled.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    vendorPayablesReport.map((vp, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell><span className="font-semibold text-gray-900">{vp.vendorName}</span></TableCell>
                                            <TableCell><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">{vp.category}</span></TableCell>
                                            <TableCell align="center"><span className="text-xs text-gray-700">{vp.bookingCount}</span></TableCell>
                                            <TableCell align="right"><span className="text-gray-900 font-semibold">₹{vp.totalPlanned.toLocaleString('en-IN')}</span></TableCell>
                                            <TableCell align="right"><span className="text-gray-700 font-semibold">₹{vp.totalPaid.toLocaleString('en-IN')}</span></TableCell>
                                            <TableCell align="right"><span className="text-rose-700 font-bold">₹{vp.totalDue.toLocaleString('en-IN')}</span></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* REPORT 6: PROFIT & MARGINS */}
            {activeReportTab === 'PROFIT' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Expected Gross Profit</span>
                            <div className="text-xl font-bold text-emerald-800">₹{(dashData?.expectedProfit || 0).toLocaleString('en-IN')}</div>
                            <p className="text-[11px] text-gray-500">Revenue - Planned Vendor Cost + Commission - Expenses</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Realized Profit</span>
                            <div className="text-xl font-bold text-blue-900">
                                {dashData?.realizedProfit != null ? `₹${Number(dashData.realizedProfit).toLocaleString('en-IN')}` : 'Pending Completion'}
                            </div>
                            <p className="text-[11px] text-gray-500">Calculated strictly on completed trips with verified actual costs</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400">Operational Expenses</span>
                            <div className="text-xl font-bold text-rose-700">₹{(dashData?.businessExpenses || 0).toLocaleString('en-IN')}</div>
                            <p className="text-[11px] text-gray-500">Tolls, parking, fuel, staff allowances</p>
                        </div>
                    </div>
                </div>
            )}

            {/* REPORT 7: RESOURCE USAGE */}
            {activeReportTab === 'RESOURCES' && (
                <div className="space-y-3">
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        Operational directory and reliability audit of approved resource inventory.
                    </div>

                    <TableContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Resource / Partner</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Commercial Model</TableHead>
                                    <TableHead align="center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendors.map((v) => (
                                    <TableRow key={v._id}>
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">{v.businessName || v.name}</div>
                                            <div className="text-[11px] text-gray-500 font-mono">{v.phone || v.mobile || 'No contact'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-100">
                                                {v.category}
                                            </span>
                                        </TableCell>
                                        <TableCell><span className="text-xs text-gray-700">{v.city || v.location || 'Varanasi'}</span></TableCell>
                                        <TableCell><span className="text-xs font-semibold text-gray-800">{v.commercialModel || 'SELLING_PRICE'}</span></TableCell>
                                        <TableCell align="center">
                                            <Badge variant={v.status === 'ACTIVE' || v.availabilityStatus === 'Active' ? 'success' : 'default'}>
                                                {v.status || v.availabilityStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}
        </div>
    );
}

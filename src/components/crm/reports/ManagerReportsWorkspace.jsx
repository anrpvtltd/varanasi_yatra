import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { Card, CardHeader, KPICard } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import { DashboardSkeleton } from '../ui/Skeleton';

export default function ManagerReportsWorkspace({ token, user: _user, onOpenDocumentCenter, onOpenBooking }) {
    const [leads, setLeads] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [_reportFilter, _setReportFilter] = useState('ALL'); // 'ALL' | 'PIPELINE' | 'TRIPS' | 'COLLECTIONS'

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await crmApi.fetchManagerDashboard(token);
            if (res.success) {
                setLeads(res.leads || []);
                setBookings(res.bookings || []);
                setQuotes(res.quotes || []);
            }
        } catch (err) {
            console.error('Failed to load Manager Reports data:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Operational Analytics Aggregation
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        // 1. Follow-ups
        const followups = leads.filter(l => l.status === 'Follow-up' || l.status === 'New' || l.status === 'In-Progress');
        
        // 2. Pending Quotes
        const pendingQuotes = quotes.filter(q => q.status === 'SENT' || q.status === 'DRAFT' || !q.status);

        // 3. Upcoming Trips within 7 days
        const upcoming7Days = bookings.filter(b => {
            if (b.bookingStatus === 'COMPLETED' || b.bookingStatus === 'CANCELLED') return false;
            const tDateStr = b.travelDetails?.travelDate || b.travelDate;
            if (!tDateStr) return false;
            const tDate = new Date(tDateStr);
            return !isNaN(tDate.getTime()) && tDate >= today && tDate <= in7Days;
        });

        // 4. Payment dues
        let totalDues = 0;
        let dueBookingsCount = 0;
        bookings.forEach(b => {
            const due = Number(b.customerPaymentSummary?.customerDue ?? (Math.max(0, (b.packageDetails?.finalCustomerPrice || 0) - (b.advanceAmount || 0))));
            if (due > 0) {
                totalDues += due;
                dueBookingsCount++;
            }
        });

        return {
            followupsCount: followups.length,
            pendingQuotesCount: pendingQuotes.length,
            upcomingTripsCount: upcoming7Days.length,
            upcomingTripsList: upcoming7Days,
            totalDues,
            dueBookingsCount,
            conversionRate: leads.length > 0 ? Math.round((bookings.length / leads.length) * 100) : 0
        };
    }, [leads, bookings, quotes]);

    if (loading && leads.length === 0) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6 text-left select-none">
            {/* Header */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif flex items-center space-x-2">
                        <span>📊</span>
                        <span>Manager Operational Reports</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Actionable intelligence on lead conversion, departure logistics, payment aging and quote follow-ups
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {onOpenDocumentCenter && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onOpenDocumentCenter}
                            icon={<span>📄</span>}
                        >
                            Open Document Center
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            {/* 4 Core Operational Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    label="Action Due Leads"
                    value={stats.followupsCount}
                    subtitle="Requires contact / follow-up"
                    variant={stats.followupsCount > 0 ? 'warning' : 'default'}
                />
                <KPICard
                    label="Pending Quotes"
                    value={stats.pendingQuotesCount}
                    subtitle="Awaiting client response"
                    variant="default"
                />
                <KPICard
                    label="Departures (7 Days)"
                    value={stats.upcomingTripsCount}
                    subtitle="Immediate trip preparation"
                    variant="blue"
                />
                <KPICard
                    label="Receivables Due"
                    value={`₹${stats.totalDues.toLocaleString('en-IN')}`}
                    subtitle={`${stats.dueBookingsCount} booking balances`}
                    variant={stats.totalDues > 0 ? 'danger' : 'success'}
                />
            </div>

            {/* Operational Reports Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* 1. Trip Departures & Logistics Readiness */}
                <Card padding="p-5" className="space-y-4">
                    <CardHeader
                        title="Immediate Trip Departures (Next 7 Days)"
                        subtitle={`${stats.upcomingTripsCount} groups traveling this week`}
                    />
                    {stats.upcomingTripsList.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            No immediate trip departures scheduled in the next 7 days.
                        </div>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Pax</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.upcomingTripsList.map((b) => (
                                        <TableRow key={b._id}>
                                            <TableCell>
                                                <span className="font-bold text-slate-900 text-xs block">
                                                    {b.customerDetails?.name || b.name || 'Guest'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {b.bookingNumber}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-semibold text-slate-700">
                                                    {b.travelDetails?.travelDate || b.travelDate}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs">
                                                    {b.travelDetails?.travelers || 2} Persons
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={b.bookingStatus || 'CONFIRMED'} entity="BOOKING" size="sm" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {onOpenBooking && (
                                                    <Button size="sm" variant="secondary" onClick={() => onOpenBooking(b)}>
                                                        Inspect
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Card>

                {/* 2. Pipeline Conversion & Performance Summary */}
                <Card padding="p-5" className="space-y-4">
                    <CardHeader
                        title="Pipeline Conversion Performance"
                        subtitle="Inquiry to Confirmed Booking Efficiency"
                    />

                    <div className="space-y-4 text-xs">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 block">Lead Conversion Rate</span>
                                <span className="text-2xl font-extrabold text-blue-700">
                                    {stats.conversionRate}%
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 block">Total Pipeline</span>
                                <span className="text-sm font-bold text-slate-800">
                                    {leads.length} Leads → {bookings.length} Bookings
                                </span>
                            </div>
                        </div>

                        {/* Conversion Funnel Breakdown */}
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span>1. Inquiries Received</span>
                                <span className="font-bold">{leads.length}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full w-full" />
                            </div>

                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 pt-1">
                                <span>2. Custom Quotes Built</span>
                                <span className="font-bold">{quotes.length}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round((quotes.length / Math.max(1, leads.length)) * 100))}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 pt-1">
                                <span>3. Confirmed Bookings</span>
                                <span className="font-bold">{bookings.length}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${Math.min(100, stats.conversionRate)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

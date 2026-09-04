import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateCEODashboard } from '../../../utils/dashboardIntelligence';
import { KPICard } from '../ui/Card';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableEmpty } from '../ui/Table';
import { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';
import { SearchInput, Select } from '../ui/Input';
import RecordExpenseModal from './RecordExpenseModal';
import RecordVendorPaymentModal from './RecordVendorPaymentModal';
import CEOBookingDrawer from './CEOBookingDrawer';

export default function CEOFinancialWorkspace({
    token,
    user,
    refreshTrigger,
    onRefresh,
    onOpenBooking
}) {
    const [dashData, setDashData] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [vendorPayments, setVendorPayments] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);

    // Active sub-tab
    const [activeTab, setActiveTab] = useState('TABLE'); // 'TABLE', 'VENDOR_PAYABLE', 'EXPENSES'

    // Table filters
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingStatusFilter, setBookingStatusFilter] = useState('ALL');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
    const [dateRangeFilter, setDateRangeFilter] = useState('ALL'); // 'ALL', 'THIS_MONTH', 'LAST_MONTH'

    // Modals & Drawers
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [vendorPayoutItem, setVendorPayoutItem] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadAllFinancialData = useCallback(async () => {
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
                setExpenses(expList);
                setVendorPayments(vPayList);
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
            console.error('Failed to load CEO Financials:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadAllFinancialData();
    }, [loadAllFinancialData, refreshTrigger]);

    // Financial calculations
    const summary = useMemo(() => {
        const totalRev = Number(dashData?.totalRevenue) || 0;
        const totalCol = Number(dashData?.customerCashCollected) || 0;
        const custDue = Number(dashData?.customerOutstanding) || 0;
        const vendCost = Number(dashData?.plannedVendorCost) || 0;
        const vendPaid = Number(dashData?.vendorPaymentsMade) || 0;
        const vendPayable = Number(dashData?.vendorOutstanding) || 0;
        const totalExp = Number(dashData?.businessExpenses) || 0;
        const expProfit = Number(dashData?.expectedProfit) || 0;
        const realProfit = dashData?.realizedProfit;
        const netCash = Number(dashData?.netCashPosition) || 0;
        const commInc = Number(dashData?.commissionIncome) || 0;
        const passThrough = Number(dashData?.passThroughTotal) || 0;

        return {
            totalRev,
            totalCol,
            custDue,
            vendCost,
            vendPaid,
            vendPayable,
            totalExp,
            expProfit,
            realProfit,
            netCash,
            commInc,
            passThrough
        };
    }, [dashData]);

    // Filtered Bookings for the Financial Table
    const filteredTableBookings = useMemo(() => {
        return bookings.filter((b) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const bNum = (b.bookingNumber || '').toLowerCase();
                const cName = (b.customerDetails?.name || '').toLowerCase();
                const match = bNum.includes(q) || cName.includes(q);
                if (!match) return false;
            }

            if (bookingStatusFilter !== 'ALL' && b.bookingStatus !== bookingStatusFilter) {
                return false;
            }

            if (paymentStatusFilter !== 'ALL') {
                const pStatus = b.customerPaymentSummary?.paymentStatus || 'UNPAID';
                if (pStatus !== paymentStatusFilter) return false;
            }

            if (dateRangeFilter === 'THIS_MONTH') {
                const now = new Date();
                const bDate = new Date(b.createdAt || b.bookingDate || b.travelDetails?.travelDate || 0);
                if (bDate.getMonth() !== now.getMonth() || bDate.getFullYear() !== now.getFullYear()) {
                    return false;
                }
            }

            return true;
        });
    }, [bookings, searchQuery, bookingStatusFilter, paymentStatusFilter, dateRangeFilter]);

    // Vendor Payables List (Aggregated per vendor assignment)
    const vendorPayablesList = useMemo(() => {
        const list = [];
        bookings.forEach((b) => {
            if (b.bookingStatus === 'CANCELLED') return;

            // Check vendorAssignments
            if (Array.isArray(b.vendorAssignments) && b.vendorAssignments.length > 0) {
                b.vendorAssignments.forEach((va) => {
                    const pCost = Number(va.plannedCost) || 0;
                    const aCost = Number(va.actualCost) || pCost;
                    // Look up payments made to this vendor for this booking
                    const paidToThisVendor = (vendorPayments || [])
                        .filter((vp) => vp.bookingId === b._id && vp.vendorId === va.vendorId)
                        .reduce((sum, vp) => sum + (Number(vp.amount) || 0), 0);

                    const due = Math.max(0, aCost - paidToThisVendor);
                    const status = due === 0 ? 'PAID' : paidToThisVendor > 0 ? 'PARTIAL' : 'UNPAID';

                    const vObj = vendors.find((v) => v._id === va.vendorId);

                    list.push({
                        id: `${b._id}_${va.vendorId || Math.random()}`,
                        vendorId: va.vendorId,
                        vendorName: vObj?.businessName || vObj?.name || va.vendorName || 'Assigned Partner',
                        bookingId: b._id,
                        bookingNumber: b.bookingNumber,
                        customerName: b.customerDetails?.name || 'Guest',
                        serviceName: va.serviceCategory || va.serviceName || 'Package Service',
                        plannedCost: aCost,
                        paidAmount: paidToThisVendor,
                        dueAmount: due,
                        status
                    });
                });
            } else if (b.vendorPaymentSummary && b.vendorPaymentSummary.plannedVendorCost > 0) {
                // Fallback aggregated summary
                const pCost = b.vendorPaymentSummary.plannedVendorCost || 0;
                const paid = b.vendorPaymentSummary.totalPaidToVendors || 0;
                const due = b.vendorPaymentSummary.vendorDue ?? Math.max(0, pCost - paid);
                const status = due === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';

                list.push({
                    id: `${b._id}_aggregate`,
                    vendorId: null,
                    vendorName: 'Multiple Package Vendors',
                    bookingId: b._id,
                    bookingNumber: b.bookingNumber,
                    customerName: b.customerDetails?.name || 'Guest',
                    serviceName: 'Aggregated Tour Services',
                    plannedCost: pCost,
                    paidAmount: paid,
                    dueAmount: due,
                    status
                });
            }
        });
        return list;
    }, [bookings, vendorPayments, vendors]);

    const handleOpenBookingDetails = (b) => {
        if (typeof onOpenBooking === 'function') {
            onOpenBooking(b);
        } else {
            setSelectedBooking(b);
            setIsDrawerOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* WORKSPACE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Financials</span>
                        <Badge variant="blue">Executive Financial Command</Badge>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Track revenue, collections, costs, payables and profitability
                    </p>
                </div>

                <div className="flex items-center gap-2">
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
                        onClick={() => {
                            loadAllFinancialData();
                            if (onRefresh) onRefresh();
                        }}
                    >
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            {/* TOP 6 KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Total Revenue */}
                <KPICard
                    title="Total Revenue"
                    value={`₹${summary.totalRev.toLocaleString('en-IN')}`}
                    subtext="Accrual Package Revenue"
                    variant="default"
                />

                {/* 2. Total Collected */}
                <KPICard
                    title="Total Collected"
                    value={`₹${summary.totalCol.toLocaleString('en-IN')}`}
                    subtext="Cash in hand inflow"
                    variant="success"
                />

                {/* 3. Customer Due */}
                <KPICard
                    title="Customer Due"
                    value={`₹${summary.custDue.toLocaleString('en-IN')}`}
                    subtext="Pending receivables"
                    variant={summary.custDue > 0 ? 'warning' : 'default'}
                />

                {/* 4. Vendor Payable */}
                <KPICard
                    title="Vendor Payable"
                    value={`₹${summary.vendPayable.toLocaleString('en-IN')}`}
                    subtext="Pending disbursements"
                    variant={summary.vendPayable > 0 ? 'danger' : 'default'}
                />

                {/* 5. Total Expenses */}
                <KPICard
                    title="Total Expenses"
                    value={`₹${summary.totalExp.toLocaleString('en-IN')}`}
                    subtext="Operational expenses"
                    variant="default"
                />

                {/* 6. Net Profit */}
                <KPICard
                    title="Expected Profit"
                    value={`₹${summary.expProfit.toLocaleString('en-IN')}`}
                    subtext={
                        summary.realProfit != null
                            ? `Realized: ₹${Number(summary.realProfit).toLocaleString('en-IN')}`
                            : 'Realized: Pending Settlement'
                    }
                    variant="accent"
                />
            </div>

            {/* 5 DECISION-ORIENTED FINANCIAL SUMMARIES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Revenue Summary */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Revenue Summary</span>
                    <div className="font-bold text-gray-900 text-sm">₹{summary.totalRev.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-gray-500">
                        Package: ₹{(summary.totalRev - summary.commInc).toLocaleString('en-IN')} · Comm: ₹{summary.commInc.toLocaleString('en-IN')}
                    </div>
                </div>

                {/* 2. Cost Summary */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Cost Summary</span>
                    <div className="font-bold text-purple-800 text-sm">₹{summary.vendCost.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-gray-500">
                        Vendor Disbursed: ₹{summary.vendPaid.toLocaleString('en-IN')}
                    </div>
                </div>

                {/* 3. Collections Summary */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Collections Summary</span>
                    <div className="font-bold text-emerald-700 text-sm">₹{summary.totalCol.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-gray-500">
                        Liquid Net Cash: <strong className="text-emerald-800">₹{summary.netCash.toLocaleString('en-IN')}</strong>
                    </div>
                </div>

                {/* 4. Outstanding Summary */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Outstanding Summary</span>
                    <div className="font-bold text-amber-700 text-sm">₹{summary.custDue.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-gray-500">
                        Net Outstanding Gap: ₹{(summary.custDue - summary.vendPayable).toLocaleString('en-IN')}
                    </div>
                </div>

                {/* 5. Profitability Summary */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Profitability Summary</span>
                    <div className="font-bold text-blue-900 text-sm">
                        {summary.totalRev > 0 ? Math.round((summary.expProfit / summary.totalRev) * 100) : 0}% Margin
                    </div>
                    <div className="text-[11px] text-gray-500">
                        Pass-Through: ₹{summary.passThrough.toLocaleString('en-IN')} (0% margin)
                    </div>
                </div>
            </div>

            {/* SUB-TABS NAVIGATION */}
            <div className="flex border-b border-gray-200 text-xs font-semibold gap-2">
                {[
                    { id: 'TABLE', label: `Financial Table (${filteredTableBookings.length})` },
                    { id: 'VENDOR_PAYABLE', label: `Vendor Payables (${vendorPayablesList.length})` },
                    { id: 'EXPENSES', label: `Expenses Log (${expenses.length})` }
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                            activeTab === t.id
                                ? 'border-blue-600 text-blue-600 font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* SUB-VIEW 1: DETAILED FINANCIAL TABLE */}
            {activeTab === 'TABLE' && (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                        <div className="w-full sm:w-72">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClear={() => setSearchQuery('')}
                                placeholder="Search by booking or customer..."
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={bookingStatusFilter}
                                onChange={(e) => setBookingStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Booking Statuses</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="PREPARING">Preparing</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </Select>

                            <Select
                                value={paymentStatusFilter}
                                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            >
                                <option value="ALL">All Payment Statuses</option>
                                <option value="PAID">Paid</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="UNPAID">Unpaid</option>
                            </Select>

                            <Select
                                value={dateRangeFilter}
                                onChange={(e) => setDateRangeFilter(e.target.value)}
                            >
                                <option value="ALL">All Dates</option>
                                <option value="THIS_MONTH">This Month</option>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <TableContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booking</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead align="right">Booking Value</TableHead>
                                    <TableHead align="right">Collected</TableHead>
                                    <TableHead align="right">Customer Due</TableHead>
                                    <TableHead align="right">Vendor Cost</TableHead>
                                    <TableHead align="right">Vendor Paid</TableHead>
                                    <TableHead align="right">Vendor Payable</TableHead>
                                    <TableHead align="right">Expenses</TableHead>
                                    <TableHead align="right">Profit</TableHead>
                                    <TableHead align="center">Payment Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-12 text-center text-xs text-gray-400">
                                            Loading financial ledger entries...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTableBookings.length === 0 ? (
                                    <TableEmpty colSpan={11} message="No financial records found matching the filters." />
                                ) : (
                                    filteredTableBookings.map((b) => {
                                        const cust = b.customerDetails || {};
                                        const pkgPrice = b.customerPaymentSummary?.packagePrice ?? b.packageDetails?.finalCustomerPrice ?? 0;
                                        const collected = b.customerPaymentSummary?.totalPaid ?? 0;
                                        const due = b.customerPaymentSummary?.customerDue ?? Math.max(0, pkgPrice - collected);

                                        const vCost = b.vendorPaymentSummary?.plannedVendorCost ?? 0;
                                        const vPaid = b.vendorPaymentSummary?.totalPaidToVendors ?? 0;
                                        const vPayable = b.vendorPaymentSummary?.vendorDue ?? Math.max(0, vCost - vPaid);

                                        // Booking expenses
                                        const bExpenses = (expenses || [])
                                            .filter((e) => e.bookingId === b._id)
                                            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

                                        const comm = b.profitSummary?.commissionIncome ?? 0;
                                        const profit = pkgPrice - vCost + comm - bExpenses;

                                        return (
                                            <TableRow
                                                key={b._id}
                                                hover
                                                className="cursor-pointer"
                                                onClick={() => handleOpenBookingDetails(b)}
                                            >
                                                <TableCell>
                                                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                                                        {b.bookingNumber}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-gray-900">{cust.name || 'Guest'}</div>
                                                    <div className="text-[11px] text-gray-500 font-mono">{cust.phone || cust.mobile || 'No phone'}</div>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="font-bold text-gray-900">₹{pkgPrice.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="font-semibold text-emerald-700">₹{collected.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className={`font-bold ${due > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                                                        ₹{due.toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="font-semibold text-purple-800">₹{vCost.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="font-semibold text-gray-700">₹{vPaid.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className={`font-semibold ${vPayable > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                                                        ₹{vPayable.toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="text-gray-600">₹{bExpenses.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="font-bold text-emerald-800">₹{profit.toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Badge variant={b.customerPaymentSummary?.paymentStatus === 'PAID' ? 'success' : b.customerPaymentSummary?.paymentStatus === 'PARTIAL' ? 'warning' : 'danger'}>
                                                        {b.customerPaymentSummary?.paymentStatus || 'UNPAID'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* SUB-VIEW 2: VENDOR PAYABLE TRACKER */}
            {activeTab === 'VENDOR_PAYABLE' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                        <span className="text-gray-600">
                            Operational payable tracker across active bookings and service assignments.
                        </span>
                        <div className="text-gray-700 font-bold">
                            Total Outstanding Due: <strong className="text-rose-700">₹{summary.vendPayable.toLocaleString('en-IN')}</strong>
                        </div>
                    </div>

                    <TableContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor / Partner</TableHead>
                                    <TableHead>Booking</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead align="right">Vendor Cost</TableHead>
                                    <TableHead align="right">Paid</TableHead>
                                    <TableHead align="right">Due</TableHead>
                                    <TableHead align="center">Status</TableHead>
                                    <TableHead align="center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendorPayablesList.length === 0 ? (
                                    <TableEmpty colSpan={8} message="No vendor payables found." />
                                ) : (
                                    vendorPayablesList.map((vp) => (
                                        <TableRow key={vp.id}>
                                            <TableCell>
                                                <div className="font-semibold text-gray-900">{vp.vendorName}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                    {vp.bookingNumber}
                                                </span>
                                                <span className="text-[11px] text-gray-500 block">{vp.customerName}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-gray-700 text-xs">{vp.serviceName}</span>
                                            </TableCell>
                                            <TableCell align="right">
                                                <span className="font-semibold text-gray-900">₹{vp.plannedCost.toLocaleString('en-IN')}</span>
                                            </TableCell>
                                            <TableCell align="right">
                                                <span className="font-semibold text-gray-700">₹{vp.paidAmount.toLocaleString('en-IN')}</span>
                                            </TableCell>
                                            <TableCell align="right">
                                                <span className={`font-bold ${vp.dueAmount > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                                                    ₹{vp.dueAmount.toLocaleString('en-IN')}
                                                </span>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Badge variant={vp.status === 'PAID' ? 'success' : vp.status === 'PARTIAL' ? 'warning' : 'danger'}>
                                                    {vp.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell align="center">
                                                {vp.dueAmount > 0 && vp.vendorId ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="xs"
                                                        onClick={() => setVendorPayoutItem(vp)}
                                                    >
                                                        Disburse Payout →
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Settled</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* SUB-VIEW 3: EXPENSES LOG */}
            {activeTab === 'EXPENSES' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                        <span className="text-gray-600">
                            Operational business expenses affecting company profitability.
                        </span>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsExpenseModalOpen(true)}
                        >
                            + Record Business Expense
                        </Button>
                    </div>

                    <TableContainer>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Expense Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Booking</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead align="right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.length === 0 ? (
                                    <TableEmpty colSpan={6} message="No business expenses logged yet." />
                                ) : (
                                    expenses.map((exp) => {
                                        const linkedBooking = bookings.find((b) => b._id === exp.bookingId);
                                        return (
                                            <TableRow key={exp._id || exp.expenseId}>
                                                <TableCell>
                                                    <div className="font-semibold text-gray-900">{exp.description || 'Expense Entry'}</div>
                                                    {exp.notes && <div className="text-[11px] text-gray-400">{exp.notes}</div>}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] font-bold">
                                                        {exp.expenseCategory}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-gray-700 text-xs">{exp.expenseDate || 'Date N/A'}</span>
                                                </TableCell>
                                                <TableCell>
                                                    {linkedBooking ? (
                                                        <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                            {linkedBooking.bookingNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">General Ops</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-gray-700 text-xs">{exp.paymentMethod || 'UPI'}</span>
                                                    {exp.referenceNumber && (
                                                        <span className="text-[10px] text-gray-400 block font-mono">Ref: {exp.referenceNumber}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <span className="font-bold text-rose-700 text-xs">
                                                        -₹{(exp.amount || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            )}

            {/* RECORD EXPENSE MODAL */}
            <RecordExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                token={token}
                bookings={bookings}
                onExpenseSaved={() => {
                    loadAllFinancialData();
                    if (onRefresh) onRefresh();
                }}
            />

            {/* RECORD VENDOR PAYOUT MODAL */}
            <RecordVendorPaymentModal
                isOpen={Boolean(vendorPayoutItem)}
                onClose={() => setVendorPayoutItem(null)}
                token={token}
                item={vendorPayoutItem}
                onPaymentSaved={() => {
                    loadAllFinancialData();
                    if (onRefresh) onRefresh();
                }}
            />

            {/* CEO BOOKING DETAILS DRAWER */}
            <CEOBookingDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedBooking(null);
                }}
                booking={selectedBooking}
                token={token}
                user={user}
                onBookingUpdated={loadAllFinancialData}
                onRecordExpense={loadAllFinancialData}
            />
        </div>
    );
}

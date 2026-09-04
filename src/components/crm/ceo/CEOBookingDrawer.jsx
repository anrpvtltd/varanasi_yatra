import React, { useState, useEffect, useCallback } from 'react';
import Drawer from '../ui/Drawer';
import StatusBadge, { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';
import { crmApi } from '../../../services/crmApi';
import RecordExpenseModal from './RecordExpenseModal';

export default function CEOBookingDrawer({
    isOpen,
    onClose,
    booking,
    token,
    user,
    onBookingUpdated,
    onRecordExpense
}) {
    const [profitData, setProfitData] = useState(null);
    const [loadingProfit, setLoadingProfit] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('OVERVIEW'); // 'OVERVIEW', 'FINANCIALS', 'SERVICES', 'EXPENSES'

    const isCEO = user?.role === 'CEO';

    const loadProfitDetails = useCallback(async () => {
        if (!booking?._id || !token || !isCEO) return;
        setLoadingProfit(true);
        try {
            const res = await crmApi.fetchBookingProfit(token, booking._id);
            if (res.success) {
                setProfitData(res);
            }
        } catch (err) {
            console.error('Failed to load booking profit details:', err);
        } finally {
            setLoadingProfit(false);
        }
    }, [booking?._id, token, isCEO]);

    useEffect(() => {
        if (isOpen && booking?._id) {
            loadProfitDetails();
        } else {
            setProfitData(null);
        }
    }, [isOpen, booking?._id, loadProfitDetails]);

    if (!isOpen || !booking) return null;

    const customer = booking.customerDetails || {};
    const trip = booking.travelDetails || {};
    const packageSummary = booking.packageDetails || {};
    const custPayment = booking.customerPaymentSummary || {};
    const vendorPayment = booking.vendorPaymentSummary || {};
    const services = booking.services || booking.servicesList || [];
    const expenses = profitData?.expenses || [];

    // Financial semantics
    const packagePrice = custPayment.packagePrice ?? packageSummary.finalCustomerPrice ?? 0;
    const customerPaid = custPayment.totalPaid ?? 0;
    const customerDue = custPayment.customerDue ?? Math.max(0, packagePrice - customerPaid);
    const paymentStatus = custPayment.paymentStatus || (customerPaid >= packagePrice ? 'PAID' : customerPaid > 0 ? 'PARTIAL' : 'UNPAID');

    // Vendor financials
    const plannedVendorCost = vendorPayment.plannedVendorCost ?? 0;
    const actualVendorCost = vendorPayment.actualVendorCost ?? 0;
    const vendorPaid = vendorPayment.totalPaidToVendors ?? 0;
    const vendorDue = vendorPayment.vendorDue ?? Math.max(0, plannedVendorCost - vendorPaid);

    // Business expenses & profit
    const bookingExpensesTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const commissionIncome = profitData?.profitSummary?.commissionIncome ?? booking.profitSummary?.commissionIncome ?? 0;

    // Expected & Realized Profit
    const expectedProfit = profitData?.profitSummary?.expectedProfit ?? (packagePrice - plannedVendorCost + commissionIncome - bookingExpensesTotal);
    const actualProfit = profitData?.profitSummary?.actualProfit ?? (booking.bookingStatus === 'COMPLETED' && actualVendorCost > 0 ? (customerPaid - actualVendorCost + commissionIncome - bookingExpensesTotal) : null);
    const profitMargin = packagePrice > 0 ? Math.round((expectedProfit / packagePrice) * 100) : 0;

    return (
        <>
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                title={
                    <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-bold">{booking.bookingNumber}</span>
                        <StatusBadge status={booking.bookingStatus || 'CONFIRMED'} size="sm" />
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            CEO Audit
                        </span>
                    </div>
                }
                subtitle={`${customer.name || 'Guest'} · ${trip.adults || 2} Travelers · ${trip.durationNights ? `${trip.durationNights}N/${trip.durationDays || trip.durationNights + 1}D` : 'Varanasi'}${loadingProfit ? ' · Loading Financials...' : ''}`}
                width="640px"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Status:</span>
                            <span className="font-semibold text-gray-800">{booking.bookingStatus}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsExpenseModalOpen(true)}
                            >
                                + Add Expense
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-5">
                    {/* SUB-TABS NAVIGATION */}
                    <div className="flex border-b border-gray-200 text-xs font-semibold">
                        {[
                            { id: 'OVERVIEW', label: 'Executive Summary' },
                            { id: 'FINANCIALS', label: 'Financial Audit' },
                            { id: 'SERVICES', label: 'Services & Vendors' },
                            { id: 'EXPENSES', label: `Expenses (${expenses.length})` }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`px-4 py-2.5 border-b-2 transition-colors cursor-pointer ${
                                    activeSubTab === tab.id
                                        ? 'border-blue-600 text-blue-600 font-bold'
                                        : 'border-transparent text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB 1: EXECUTIVE SUMMARY */}
                    {activeSubTab === 'OVERVIEW' && (
                        <div className="space-y-5">
                            {/* TOP FINANCIAL SPLIT HIGHLIGHT */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Customer Financials Pill */}
                                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                                    <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                                        Customer Financials
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        ₹{packagePrice.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-emerald-700 font-medium">Paid: ₹{customerPaid.toLocaleString('en-IN')}</span>
                                        <span className={`font-bold ${customerDue > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                                            Due: ₹{customerDue.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>

                                {/* Internal Business Financials Pill (CEO ONLY) */}
                                <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                                    <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Internal Business (CEO)</span>
                                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">Confidential</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-900">
                                        Profit: ₹{expectedProfit.toLocaleString('en-IN')}
                                    </div>
                                    <div className="flex items-center justify-between text-xs mt-1">
                                        <span className="text-purple-700 font-medium">Cost: ₹{plannedVendorCost.toLocaleString('en-IN')}</span>
                                        <span className="text-blue-700 font-bold">Margin: {profitMargin}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* CUSTOMER & TRIP OVERVIEW */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Customer & Travel Details
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">Customer</span>
                                        <span className="font-semibold text-gray-900">{customer.name || 'Guest'}</span>
                                        <span className="text-gray-500 block text-[11px]">{customer.phone || customer.mobile || 'No Phone'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">Travel Dates</span>
                                        <span className="font-semibold text-gray-900">{trip.travelDate || 'Not specified'}</span>
                                        <span className="text-gray-500 block text-[11px]">{trip.durationNights || 3} Nights / {trip.durationDays || 4} Days</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">Travelers</span>
                                        <span className="font-semibold text-gray-900">{trip.adults || 2} Adults{trip.kids ? `, ${trip.kids} Kids` : ''}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-[11px]">Pickup / Destination</span>
                                        <span className="font-semibold text-gray-900">{trip.pickupPoint || 'Varanasi Junction'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* OPERATIONAL READINESS & SERVICES SUMMARY */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Services Readiness & Vendor Status
                                </h4>
                                <div className="space-y-2">
                                    {services.length === 0 ? (
                                        <div className="text-xs text-gray-500 italic">No individual services configured.</div>
                                    ) : (
                                        services.map((svc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg text-xs">
                                                <div>
                                                    <span className="font-semibold text-gray-800">{svc.serviceName || svc.name || 'Service Item'}</span>
                                                    <span className="text-[11px] text-gray-500 block">
                                                        Model: <strong className="text-blue-700">{svc.commercialModel || 'SELLING_PRICE'}</strong> · Qty: {svc.quantity || 1}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-gray-900 block">
                                                        {svc.commercialModel === 'CUSTOMER_DIRECT' || svc.commercialModel === 'COMMISSION'
                                                            ? 'Direct / ₹0'
                                                            : `Cost: ₹${(svc.negotiatedVendorCost || svc.referenceCost || svc.vendorCostSnapshot || 0).toLocaleString('en-IN')}`
                                                        }
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                        svc.readinessStatus === 'READY' || svc.isAssigned
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {svc.readinessStatus || (svc.isAssigned ? 'ASSIGNED' : 'PENDING')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* INTERNAL NOTES */}
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                                <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                                    Operational Notes
                                </h4>
                                <p className="text-gray-600 bg-white p-2.5 rounded border border-gray-200">
                                    {booking.notes || 'No general notes recorded for this booking.'}
                                </p>
                                {booking.metadata?.ceoOnlyNotes && (
                                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900">
                                        <span className="font-bold block text-[10px] uppercase text-amber-800">🔒 Confidential CEO Notes</span>
                                        <p className="mt-0.5">{booking.metadata.ceoOnlyNotes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: FINANCIAL AUDIT (STRICT SEPARATION) */}
                    {activeSubTab === 'FINANCIALS' && (
                        <div className="space-y-5">
                            {/* 1. CUSTOMER FINANCIALS */}
                            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                                        1. Customer Financials
                                    </h4>
                                    <Badge variant={paymentStatus === 'PAID' ? 'success' : paymentStatus === 'PARTIAL' ? 'warning' : 'danger'}>
                                        {paymentStatus}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <span className="text-[11px] text-gray-500 block">Package Price</span>
                                        <span className="text-base font-bold text-gray-900">₹{packagePrice.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                                        <span className="text-[11px] text-emerald-700 block font-medium">Customer Paid</span>
                                        <span className="text-base font-bold text-emerald-700">₹{customerPaid.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="p-2.5 bg-amber-50 rounded-lg">
                                        <span className="text-[11px] text-amber-700 block font-medium">Customer Due</span>
                                        <span className="text-base font-bold text-amber-800">₹{customerDue.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Payment records */}
                                {custPayment.payments && custPayment.payments.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <span className="text-[11px] font-bold text-gray-700 block mb-2">Customer Payment Transactions</span>
                                        <div className="space-y-1.5">
                                            {custPayment.payments.map((p, pIdx) => (
                                                <div key={pIdx} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded border border-gray-100">
                                                    <div>
                                                        <span className="font-semibold text-gray-800">{p.paymentMethod || 'Payment'}</span>
                                                        <span className="text-[11px] text-gray-500 block">Ref: {p.referenceNumber || 'N/A'} · {p.paymentDate || 'Date N/A'}</span>
                                                    </div>
                                                    <span className="font-bold text-emerald-700">+₹{(p.amount || 0).toLocaleString('en-IN')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. INTERNAL BUSINESS FINANCIALS (CEO ONLY) */}
                            <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                                    <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>2. Internal Business Financials</span>
                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">CEO Only</span>
                                    </h4>
                                    <span className="text-xs font-semibold text-gray-500">Commercial Audit</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div className="p-2.5 bg-purple-50 rounded-lg">
                                        <span className="text-[11px] text-purple-700 block font-medium">Planned Vendor Cost</span>
                                        <span className="text-base font-bold text-purple-900">₹{plannedVendorCost.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <span className="text-[11px] text-gray-600 block">Vendor Paid</span>
                                        <span className="text-base font-bold text-gray-800">₹{vendorPaid.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="p-2.5 bg-rose-50 rounded-lg">
                                        <span className="text-[11px] text-rose-700 block font-medium">Vendor Payable / Due</span>
                                        <span className="text-base font-bold text-rose-700">₹{vendorDue.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Additional details: Expenses & Commission */}
                                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex justify-between items-center">
                                        <div>
                                            <span className="text-[11px] text-stone-500 block">Booking Expenses</span>
                                            <span className="font-bold text-stone-800">₹{bookingExpensesTotal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <Button size="xs" variant="secondary" onClick={() => setIsExpenseModalOpen(true)}>
                                            + Add
                                        </Button>
                                    </div>
                                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                                        <span className="text-[11px] text-stone-500 block">Commission Income</span>
                                        <span className="font-bold text-stone-800">₹{commissionIncome.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* 3. PROFIT & MARGIN RECONCILIATION */}
                                <div className="p-3 bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl space-y-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-800">Expected Gross Profit:</span>
                                        <span className="text-base font-extrabold text-emerald-800">
                                            ₹{expectedProfit.toLocaleString('en-IN')}
                                            <span className="text-xs text-gray-600 font-normal ml-1">({profitMargin}%)</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-600 border-t border-emerald-100 pt-1.5">
                                        <span>Formula:</span>
                                        <span className="font-mono text-[11px] text-gray-700">Revenue (₹{packagePrice.toLocaleString()}) - Vendor Cost (₹{plannedVendorCost.toLocaleString()}) - Expenses (₹{bookingExpensesTotal.toLocaleString()})</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-1">
                                        <span className="text-gray-700 font-medium">Realized Profit Status:</span>
                                        <span className="font-semibold text-gray-900">
                                            {actualProfit != null ? `₹${Number(actualProfit).toLocaleString('en-IN')} (Settled)` : 'Pending Trip Completion'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SERVICES & VENDORS BREAKDOWN */}
                    {activeSubTab === 'SERVICES' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Service Level Commercial Models
                                </h4>
                                <span className="text-[11px] text-gray-500">Commercial Rule Enforcement</span>
                            </div>

                            {services.map((s, idx) => {
                                const model = s.commercialModel || 'SELLING_PRICE';
                                const unitCost = Number(s.negotiatedVendorCost || s.referenceCost || s.vendorCostSnapshot || 0);
                                const qty = Number(s.quantity) || 1;
                                const totalCost = unitCost * qty;
                                const sellingPrice = Number(s.customerSellingPrice || 0) * qty;

                                return (
                                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 text-xs">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-gray-900 block">{s.serviceName || s.name || `Service #${idx + 1}`}</span>
                                                <span className="text-[11px] text-gray-500">{s.category || 'General'} · Qty: {qty}</span>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                                {model}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded text-[11px]">
                                            <div>
                                                <span className="text-gray-500 block">Package Price:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {model === 'CUSTOMER_DIRECT' || model === 'COMMISSION' ? 'Direct (₹0)' : `₹${sellingPrice.toLocaleString('en-IN')}`}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Vendor Cost:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {model === 'CUSTOMER_DIRECT' || model === 'COMMISSION'
                                                        ? 'Direct (₹0)'
                                                        : model === 'PASS_THROUGH'
                                                            ? `₹${totalCost.toLocaleString('en-IN')} (Pass-through)`
                                                            : `₹${totalCost.toLocaleString('en-IN')}`
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Contribution / Profit:</span>
                                                <span className="font-bold text-emerald-700">
                                                    {model === 'PASS_THROUGH'
                                                        ? '₹0 (0% margin)'
                                                        : model === 'CUSTOMER_DIRECT'
                                                            ? 'N/A'
                                                            : model === 'COMMISSION'
                                                                ? `+₹${(s.commissionAmount || 0).toLocaleString('en-IN')} (Comm)`
                                                                : `₹${(sellingPrice - totalCost).toLocaleString('en-IN')}`
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {model === 'PASS_THROUGH' && (
                                            <div className="text-[10px] text-sky-800 bg-sky-50 p-1.5 rounded border border-sky-100">
                                                ℹ️ Pass-Through: Ticket/pass amount collected at cost with 0% margin. Not counted towards profit.
                                            </div>
                                        )}
                                        {model === 'CUSTOMER_DIRECT' && (
                                            <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-100">
                                                ℹ️ Customer Direct: Service fee paid directly by customer to priest/pandit. Package cost is ₹0.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* TAB 4: EXPENSES LINKED TO BOOKING */}
                    {activeSubTab === 'EXPENSES' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Booking Operational Expenses
                                </h4>
                                <Button size="xs" variant="primary" onClick={() => setIsExpenseModalOpen(true)}>
                                    + Add Expense
                                </Button>
                            </div>

                            {expenses.length === 0 ? (
                                <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-500">
                                    No operational expenses logged for this booking yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {expenses.map((e, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl text-xs">
                                            <div>
                                                <span className="font-semibold text-gray-900 block">{e.description || e.expenseCategory}</span>
                                                <span className="text-[11px] text-gray-500">
                                                    Category: <strong>{e.expenseCategory}</strong> · Date: {e.expenseDate}
                                                </span>
                                                {e.notes && <span className="text-[11px] text-gray-400 block mt-0.5">{e.notes}</span>}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-rose-700 block">-₹{(e.amount || 0).toLocaleString('en-IN')}</span>
                                                <span className="text-[10px] text-gray-500">{e.paymentMethod || 'Paid'}</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs">
                                        <span>Total Booking Expenses:</span>
                                        <span className="text-rose-700">₹{bookingExpensesTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Drawer>

            {/* EXPENSE RECORDING MODAL */}
            <RecordExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                token={token}
                bookings={[booking]}
                preselectedBookingId={booking._id}
                onExpenseSaved={() => {
                    loadProfitDetails();
                    if (onRecordExpense) onRecordExpense();
                    if (onBookingUpdated) onBookingUpdated();
                }}
            />
        </>
    );
}

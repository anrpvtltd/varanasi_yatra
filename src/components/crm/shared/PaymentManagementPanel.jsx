import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';

export default function PaymentManagementPanel({
    booking,
    token,
    user,
    onBookingUpdated
}) {
    const [activeSubTab, setActiveSubTab] = useState('CUSTOMER');
    const [financialSummary, setFinancialSummary] = useState(null);
    const [customerPayments, setCustomerPayments] = useState([]);
    const [vendorPayments, setVendorPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);

    // Customer Payment Form state
    const [custAmount, setCustAmount] = useState('');
    const [custMethod, setCustMethod] = useState('UPI');
    const [custDate, setCustDate] = useState(new Date().toISOString().split('T')[0]);
    const [custRef, setCustRef] = useState('');
    const [custNotes, setCustNotes] = useState('');
    const [isSubmittingCust, setIsSubmittingCust] = useState(false);
    const [showAddCustModal, setShowAddCustModal] = useState(false);

    // Vendor Payment Form state
    const [selectedVendorAssignment, setSelectedVendorAssignment] = useState(null);
    const [vendAmount, setVendAmount] = useState('');
    const [vendMethod, setVendMethod] = useState('BANK_TRANSFER');
    const [vendDate, setVendDate] = useState(new Date().toISOString().split('T')[0]);
    const [vendRef, setVendRef] = useState('');
    const [vendNotes, setVendNotes] = useState('');
    const [isSubmittingVend, setIsSubmittingVend] = useState(false);
    const [showAddVendModal, setShowAddVendModal] = useState(false);

    // Expense Form state
    const [expCategory, setExpCategory] = useState('MARKETING');
    const [expAmount, setExpAmount] = useState('');
    const [expDesc, setExpDesc] = useState('');
    const [showAddExpModal, setShowAddExpModal] = useState(false);
    const [isSubmittingExp, setIsSubmittingExp] = useState(false);

    const loadData = useCallback(async () => {
        if (!booking || !token) return;
        setLoading(true);
        try {
            const summaryRes = await crmApi.fetchFinancialSummary(token, booking._id);
            if (summaryRes.success) {
                setFinancialSummary(summaryRes);
                setCustomerPayments(summaryRes.customerPayments || []);
                setVendorPayments(summaryRes.vendorPayments || []);
                setExpenses(summaryRes.expenses || []);
            }
        } catch (err) {
            console.error('Failed to load financial summary:', err);
        } finally {
            setLoading(false);
        }
    }, [booking, token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRecordCustomerPayment = async (e) => {
        e.preventDefault();
        if (!custAmount || Number(custAmount) <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }

        setIsSubmittingCust(true);
        try {
            const res = await crmApi.recordCustomerPayment(token, {
                bookingId: booking._id,
                amount: Number(custAmount),
                paymentMethod: custMethod,
                paymentDate: custDate,
                referenceNumber: custRef,
                notes: custNotes
            });

            if (res.success) {
                setCustAmount('');
                setCustRef('');
                setCustNotes('');
                setShowAddCustModal(false);
                loadData();
                if (onBookingUpdated) onBookingUpdated();
            }
        } catch (err) {
            alert('Failed to record customer payment: ' + err.message);
        } finally {
            setIsSubmittingCust(false);
        }
    };

    const handleRecordVendorPayment = async (e) => {
        e.preventDefault();
        if (!selectedVendorAssignment || !vendAmount || Number(vendAmount) <= 0) {
            alert('Please select a vendor and enter a valid positive amount.');
            return;
        }

        setIsSubmittingVend(true);
        try {
            const res = await crmApi.recordVendorPayment(token, {
                bookingId: booking._id,
                vendorId: selectedVendorAssignment.vendorId || selectedVendorAssignment.plannedVendorId || 'v_custom',
                vendorNameSnapshot: selectedVendorAssignment.vendorName || selectedVendorAssignment.plannedVendorName || 'Vendor',
                serviceCategory: selectedVendorAssignment.serviceCategory || 'OTHER',
                amount: Number(vendAmount),
                paymentMethod: vendMethod,
                paymentDate: vendDate,
                referenceNumber: vendRef,
                notes: vendNotes
            });

            if (res.success) {
                setVendAmount('');
                setVendRef('');
                setVendNotes('');
                setShowAddVendModal(false);
                loadData();
                if (onBookingUpdated) onBookingUpdated();
            }
        } catch (err) {
            alert('Failed to record vendor payment: ' + err.message);
        } finally {
            setIsSubmittingVend(false);
        }
    };

    const handleRecordExpense = async (e) => {
        e.preventDefault();
        if (!expAmount || Number(expAmount) <= 0) {
            alert('Please enter a valid expense amount.');
            return;
        }

        setIsSubmittingExp(true);
        try {
            const res = await crmApi.recordExpense(token, {
                bookingId: booking._id,
                expenseCategory: expCategory,
                description: expDesc,
                amount: Number(expAmount),
                expenseDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'UPI'
            });

            if (res.success) {
                setExpAmount('');
                setExpDesc('');
                setShowAddExpModal(false);
                loadData();
                if (onBookingUpdated) onBookingUpdated();
            }
        } catch (err) {
            alert('Failed to record expense: ' + err.message);
        } finally {
            setIsSubmittingExp(false);
        }
    };

    const custSum = financialSummary?.customerPaymentSummary || booking.customerPaymentSummary || {};
    const vendSum = financialSummary?.vendorPaymentSummary || booking.vendorPaymentSummary || {};
    const profitSum = financialSummary?.profitSummary || {};
    const cashPos = financialSummary?.cashPosition || {};

    const isCEO = user?.role === 'CEO';

    return (
        <div className="space-y-4 text-xs">

            {/* SUB-TABS BAR */}
            <div className="flex border-b border-stone-200 space-x-1">
                <button
                    type="button"
                    onClick={() => setActiveSubTab('CUSTOMER')}
                    className={`px-4 py-2 font-bold text-xs border-b-2 transition ${
                        activeSubTab === 'CUSTOMER'
                            ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                            : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                >
                    💳 Customer Payments
                </button>

                {isCEO && (
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('VENDOR')}
                        className={`px-4 py-2 font-bold text-xs border-b-2 transition ${
                            activeSubTab === 'VENDOR'
                                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        🏨 Vendor Payments (CEO Only)
                    </button>
                )}

                {isCEO && (
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('SUMMARY')}
                        className={`px-4 py-2 font-bold text-xs border-b-2 transition ${
                            activeSubTab === 'SUMMARY'
                                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                                : 'border-transparent text-stone-500 hover:text-stone-800'
                        }`}
                    >
                        📊 Real Profit & Cash Flow (CEO Only)
                    </button>
                )}
            </div>

            {loading ? (
                <div className="py-8 text-center text-stone-400 font-bold animate-pulse">Loading Financial Ledger...</div>
            ) : (
                <>
                    {/* TAB 1: CUSTOMER PAYMENTS */}
                    {activeSubTab === 'CUSTOMER' && (
                        <div className="space-y-4">
                            {/* KPI HEADER CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-stone-400 uppercase block">Package Price</span>
                                    <span className="text-base font-extrabold text-stone-900">₹{(custSum.packagePrice || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Total Received</span>
                                    <span className="text-base font-extrabold text-emerald-900">₹{(custSum.totalPaid || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-amber-700 uppercase block">Customer Due</span>
                                    <span className="text-base font-extrabold text-amber-900">₹{(custSum.customerDue || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-stone-900 text-white p-3 rounded-2xl flex flex-col justify-between">
                                    <span className="text-[10px] font-extrabold text-amber-400 uppercase block">Payment Status</span>
                                    <span className="text-sm font-extrabold tracking-wider">{custSum.paymentStatus || 'UNPAID'}</span>
                                </div>
                            </div>

                            {/* ACTION & PAYMENT HISTORY LIST */}
                            <div className="flex justify-between items-center pt-2">
                                <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px]">Payment Transaction History ({customerPayments.length})</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCustModal(true)}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase"
                                >
                                    + Record Customer Payment
                                </button>
                            </div>

                            {customerPayments.length === 0 ? (
                                <div className="bg-stone-50 border border-dashed border-stone-200 p-6 rounded-2xl text-center text-stone-400 font-bold">
                                    No customer payments recorded yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {customerPayments.map((p) => (
                                        <div key={p._id || p.paymentId} className="bg-white border border-stone-200 p-3 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-stone-900">₹{p.amount?.toLocaleString('en-IN')} via <span className="text-amber-700">{p.paymentMethod}</span></div>
                                                <div className="text-[10px] text-stone-400">Date: {p.paymentDate} · Ref: {p.referenceNumber || 'N/A'}</div>
                                                {p.notes && <div className="text-[10px] text-stone-600 mt-0.5">{p.notes}</div>}
                                            </div>
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">COMPLETED</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ADD CUSTOMER PAYMENT MODAL */}
                            {showAddCustModal && (
                                <div className="fixed inset-0 bg-stone-950/70 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-4 border border-stone-200 shadow-2xl">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <h3 className="font-extrabold text-sm text-stone-900 uppercase">Record Customer Payment</h3>
                                            <button onClick={() => setShowAddCustModal(false)} className="text-stone-400 hover:text-stone-800 font-bold">✕</button>
                                        </div>

                                        <form onSubmit={handleRecordCustomerPayment} className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Amount (₹) *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    value={custAmount}
                                                    onChange={(e) => setCustAmount(e.target.value)}
                                                    placeholder="e.g. 10000"
                                                    className="w-full bg-white border border-stone-300 font-extrabold text-stone-900 px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Payment Method</label>
                                                    <select
                                                        value={custMethod}
                                                        onChange={(e) => setCustMethod(e.target.value)}
                                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2 py-2 text-xs"
                                                    >
                                                        <option value="UPI">UPI</option>
                                                        <option value="CASH">CASH</option>
                                                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                                        <option value="CARD">CARD</option>
                                                        <option value="OTHER">OTHER</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={custDate}
                                                        onChange={(e) => setCustDate(e.target.value)}
                                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2 py-2 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Reference / UTR Number</label>
                                                <input
                                                    type="text"
                                                    value={custRef}
                                                    onChange={(e) => setCustRef(e.target.value)}
                                                    placeholder="e.g. UPI/123456789"
                                                    className="w-full bg-white border border-stone-300 font-medium px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Notes</label>
                                                <input
                                                    type="text"
                                                    value={custNotes}
                                                    onChange={(e) => setCustNotes(e.target.value)}
                                                    placeholder="Optional notes"
                                                    className="w-full bg-white border border-stone-300 font-medium px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-2">
                                                <button type="button" onClick={() => setShowAddCustModal(false)} className="px-3 py-1.5 bg-stone-200 font-bold rounded-xl uppercase text-xs">Cancel</button>
                                                <button type="submit" disabled={isSubmittingCust} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl uppercase text-xs">Save Payment</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: VENDOR PAYMENTS (CEO ONLY) */}
                    {activeSubTab === 'VENDOR' && isCEO && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-stone-400 uppercase block">Planned Vendor Cost</span>
                                    <span className="text-base font-extrabold text-stone-900">₹{(vendSum.plannedVendorCost || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-stone-400 uppercase block">Actual Vendor Cost</span>
                                    <span className="text-base font-extrabold text-amber-900">₹{(vendSum.actualVendorCost || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Total Paid to Vendors</span>
                                    <span className="text-base font-extrabold text-emerald-900">₹{(vendSum.totalPaidToVendors || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                                    <span className="text-[10px] font-extrabold text-rose-700 uppercase block">Vendor Due Outstanding</span>
                                    <span className="text-base font-extrabold text-rose-900">₹{(vendSum.vendorDue || 0).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* VENDOR ASSIGNMENTS & PAYMENTS LIST */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px]">Vendor Line Items & Payables</h4>
                                </div>

                                <div className="space-y-2">
                                    {(booking.vendorAssignments || []).map((va, idx) => (
                                        <div key={idx} className="bg-white border border-stone-200 p-3 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-extrabold text-stone-900">{va.serviceCategory}: {va.vendorName || va.plannedVendorName || 'Assigned Vendor'}</div>
                                                <div className="text-[10px] text-stone-400">Planned Cost: ₹{(va.plannedCost || 0).toLocaleString('en-IN')} | Actual Cost: ₹{(va.actualCost || va.plannedCost || 0).toLocaleString('en-IN')}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedVendorAssignment(va); setShowAddVendModal(true); }}
                                                className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg text-xs uppercase"
                                            >
                                                Record Vendor Payment
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* VENDOR TRANSACTION HISTORY */}
                            {vendorPayments.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-stone-200">
                                    <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px]">Vendor Disbursal History ({vendorPayments.length})</h4>
                                    <div className="space-y-2">
                                        {vendorPayments.map((vp) => (
                                            <div key={vp._id || vp.paymentId} className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-stone-900">₹{vp.amount?.toLocaleString('en-IN')} paid to <span className="text-amber-800 font-extrabold">{vp.vendorNameSnapshot}</span></div>
                                                    <div className="text-[10px] text-stone-400">Date: {vp.paymentDate} · Method: {vp.paymentMethod} · Ref: {vp.referenceNumber || 'N/A'}</div>
                                                </div>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">PAID OUT</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}


                            {/* RECORD VENDOR PAYMENT MODAL */}
                            {showAddVendModal && (
                                <div className="fixed inset-0 bg-stone-950/70 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-4 border border-stone-200 shadow-2xl">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <h3 className="font-extrabold text-sm text-stone-900 uppercase">Record Vendor Payment</h3>
                                            <button onClick={() => setShowAddVendModal(false)} className="text-stone-400 hover:text-stone-800 font-bold">✕</button>
                                        </div>

                                        <form onSubmit={handleRecordVendorPayment} className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Vendor Target</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={`${selectedVendorAssignment?.serviceCategory}: ${selectedVendorAssignment?.vendorName || selectedVendorAssignment?.plannedVendorName}`}
                                                    className="w-full bg-stone-100 border border-stone-300 font-bold text-stone-800 px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Payment Amount (₹) *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    value={vendAmount}
                                                    onChange={(e) => setVendAmount(e.target.value)}
                                                    placeholder="e.g. 5000"
                                                    className="w-full bg-white border border-stone-300 font-extrabold text-stone-900 px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Method</label>
                                                    <select
                                                        value={vendMethod}
                                                        onChange={(e) => setVendMethod(e.target.value)}
                                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2 py-2 text-xs"
                                                    >
                                                        <option value="BANK_TRANSFER">BANK TRANSFER</option>
                                                        <option value="UPI">UPI</option>
                                                        <option value="CASH">CASH</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={vendDate}
                                                        onChange={(e) => setVendDate(e.target.value)}
                                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2 py-2 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Reference Number</label>
                                                <input
                                                    type="text"
                                                    value={vendRef}
                                                    onChange={(e) => setVendRef(e.target.value)}
                                                    placeholder="e.g. NEFT/123456"
                                                    className="w-full bg-white border border-stone-300 font-medium px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-2">
                                                <button type="button" onClick={() => setShowAddVendModal(false)} className="px-3 py-1.5 bg-stone-200 font-bold rounded-xl uppercase text-xs">Cancel</button>
                                                <button type="submit" disabled={isSubmittingVend} className="px-4 py-1.5 bg-stone-900 text-white font-bold rounded-xl uppercase text-xs">Save Vendor Payment</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: REAL PROFIT & CASH FLOW (CEO ONLY) */}
                    {activeSubTab === 'SUMMARY' && isCEO && (
                        <div className="space-y-4">
                            <div className="bg-stone-900 text-white p-5 rounded-3xl space-y-4 shadow-xl border border-amber-500/30">
                                <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                                    <h3 className="font-serif font-extrabold text-sm text-amber-400 uppercase tracking-widest">
                                        👑 Executive Financial & Cash Flow Command Summary
                                    </h3>
                                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase">
                                        Status: {profitSum.profitStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                    <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
                                        <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">Expected Profit</span>
                                        <span className="text-lg font-extrabold text-white">₹{(profitSum.expectedProfit || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
                                        <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">Actual Profit Realized</span>
                                        <span className={`text-lg font-extrabold ${profitSum.actualProfit < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            ₹{(profitSum.actualProfit || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700">
                                        <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">Net Cash Position</span>
                                        <span className="text-lg font-extrabold text-amber-400">₹{(cashPos.currentNetCash || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                                    <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">Net Cash Flow Formula Breakdown</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-extrabold">
                                        <div>Revenue Received: <span className="text-emerald-400">+₹{(cashPos.moneyReceived || 0).toLocaleString('en-IN')}</span></div>
                                        <div>Commission Income: <span className="text-amber-400">+₹{(cashPos.commissionIncome || 0).toLocaleString('en-IN')}</span></div>
                                        <div>Vendor Paid Out: <span className="text-rose-400">-₹{(cashPos.vendorPaid || 0).toLocaleString('en-IN')}</span></div>
                                        <div>Business Expense: <span className="text-rose-400">-₹{(cashPos.expensesPaid || 0).toLocaleString('en-IN')}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* BUSINESS EXPENSES SECTION */}
                            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px]">Booking Overhead & Business Expenses ({expenses.length})</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddExpModal(true)}
                                        className="px-3 py-1 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs uppercase"
                                    >
                                        + Record Expense
                                    </button>
                                </div>

                                {expenses.length === 0 ? (
                                    <div className="text-stone-400 font-bold text-center py-3">No specific overhead expenses logged.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {expenses.map((exp) => (
                                            <div key={exp._id || exp.expenseId} className="bg-white border border-stone-200 p-2.5 rounded-xl flex justify-between items-center">
                                                <div>
                                                    <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] uppercase mr-2">{exp.expenseCategory}</span>
                                                    <span className="font-bold text-stone-900">{exp.description || 'General Expense'}</span>
                                                </div>
                                                <span className="font-extrabold text-stone-900">₹{exp.amount?.toLocaleString('en-IN')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RECORD EXPENSE MODAL */}
                            {showAddExpModal && (
                                <div className="fixed inset-0 bg-stone-950/70 z-50 flex items-center justify-center p-4">
                                    <div className="bg-white rounded-3xl p-5 w-full max-w-md space-y-4 border border-stone-200 shadow-2xl">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <h3 className="font-extrabold text-sm text-stone-900 uppercase">Record Business Expense</h3>
                                            <button onClick={() => setShowAddExpModal(false)} className="text-stone-400 hover:text-stone-800 font-bold">✕</button>
                                        </div>

                                        <form onSubmit={handleRecordExpense} className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Expense Category</label>
                                                <select
                                                    value={expCategory}
                                                    onChange={(e) => setExpCategory(e.target.value)}
                                                    className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2 py-2 text-xs"
                                                >
                                                    <option value="MARKETING">MARKETING</option>
                                                    <option value="OFFICE">OFFICE</option>
                                                    <option value="TRAVEL">TRAVEL</option>
                                                    <option value="STAFF">STAFF</option>
                                                    <option value="COMMISSION">COMMISSION</option>
                                                    <option value="REFUND">REFUND</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Amount (₹) *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    value={expAmount}
                                                    onChange={(e) => setExpAmount(e.target.value)}
                                                    placeholder="e.g. 500"
                                                    className="w-full bg-white border border-stone-300 font-extrabold text-stone-900 px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Description / Notes</label>
                                                <input
                                                    type="text"
                                                    value={expDesc}
                                                    onChange={(e) => setExpDesc(e.target.value)}
                                                    placeholder="e.g. Pandit tip / VIP pass extra charge"
                                                    className="w-full bg-white border border-stone-300 font-medium px-3 py-2 rounded-xl text-xs"
                                                />
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-2">
                                                <button type="button" onClick={() => setShowAddExpModal(false)} className="px-3 py-1.5 bg-stone-200 font-bold rounded-xl uppercase text-xs">Cancel</button>
                                                <button type="submit" disabled={isSubmittingExp} className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-xl uppercase text-xs">Save Expense</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

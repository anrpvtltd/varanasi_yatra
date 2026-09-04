import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { EmptyState } from '../ui/FeedbackStates';
import { TableSkeleton } from '../ui/Skeleton';

export default function PaymentHistoryDrawer({
    isOpen = false,
    onClose,
    record,
    token,
    onRecordNewPayment
}) {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const customerName = record?.name || record?.customerDetails?.name || 'Customer';
    const bookingNumber = record?.bookingNumber || record?._id || 'Booking';
    const bookingId = record?.bookingId || record?._id;

    const packagePrice = Number(
        record?.packagePrice ||
        record?.packageDetails?.finalCustomerPrice ||
        record?.customerPaymentSummary?.packagePrice ||
        record?.totalAmount ||
        0
    );

    const totalPaid = Number(
        record?.totalPaid !== undefined && record?.totalPaid > 0
            ? record.totalPaid
            : (record?.customerPaymentSummary?.totalPaid !== undefined && record?.customerPaymentSummary?.totalPaid > 0
                ? record.customerPaymentSummary.totalPaid
                : (Number(record?.advanceAmount) || Number(record?.advancePaid) || 0))
    );

    const remainingDue = Number(
        record?.remainingDue !== undefined
            ? record.remainingDue
            : (record?.customerPaymentSummary?.customerDue !== undefined && packagePrice > 0
                ? record.customerPaymentSummary.customerDue
                : Math.max(0, packagePrice - totalPaid))
    );

    const paymentStatus = record?.paymentStatus ||
        record?.customerPaymentSummary?.paymentStatus ||
        (totalPaid === 0 ? 'UNPAID' : (totalPaid >= packagePrice && packagePrice > 0 ? 'PAID' : 'PARTIAL'));

    const loadHistory = useCallback(async () => {
        if (!isOpen || !bookingId || !token) return;
        setLoading(true);
        setError('');
        try {
            const res = await crmApi.fetchCustomerPayments(token, bookingId);
            if (res.success) {
                const list = res.customerPayments || res.payments || [];
                // Sort chronological (latest first or earliest first)
                list.sort((a, b) => new Date(b.paymentDate || b.createdAt || 0) - new Date(a.paymentDate || a.createdAt || 0));
                setPayments(list);
            } else {
                setPayments([]);
            }
        } catch {
            // Fallback: If customer has advance paid recorded on booking but no separate log
            if (totalPaid > 0) {
                setPayments([{
                    amount: totalPaid,
                    paymentMethod: record?.paymentMode || 'Advance',
                    paymentDate: record?.createdAt || new Date().toISOString(),
                    referenceNumber: record?.transactionId || 'Verified Booking Advance',
                    notes: 'Initial advance deposit'
                }]);
            } else {
                setPayments([]);
            }
        } finally {
            setLoading(false);
        }
    }, [isOpen, bookingId, token, totalPaid, record]);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, loadHistory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fadeIn">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col justify-between animate-slideLeft border-l border-slate-200">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1 text-left">
                                <div className="flex items-center space-x-2">
                                    <span className="text-xl">💳</span>
                                    <h2 className="text-lg font-bold text-slate-900 font-serif">
                                        Payment History & Ledger
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Customer: <strong className="text-slate-800">{customerName}</strong> · Ref: <span className="font-mono text-slate-600">{bookingNumber}</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Financial Snapshot Summary Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-left">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Package Price
                                </span>
                                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                                    ₹{packagePrice.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                                    Total Received
                                </span>
                                <span className="text-sm font-extrabold text-emerald-700 block mt-0.5">
                                    ₹{totalPaid.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                                    Remaining Due
                                </span>
                                <span className="text-sm font-extrabold text-amber-700 block mt-0.5">
                                    ₹{remainingDue.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Status
                                </span>
                                <div className="mt-1">
                                    <StatusBadge status={paymentStatus} entity="PAYMENT" size="sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Body: Chronological Transactions */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Transaction Records ({payments.length})
                            </h3>
                            {remainingDue > 0 && onRecordNewPayment && (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => {
                                        onClose();
                                        onRecordNewPayment(record);
                                    }}
                                    icon={<span>➕</span>}
                                >
                                    Record Installment
                                </Button>
                            )}
                        </div>

                        {loading ? (
                            <TableSkeleton rows={4} cols={5} />
                        ) : error ? (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                                ⚠️ {error}
                            </div>
                        ) : payments.length === 0 ? (
                            <EmptyState
                                title="No Payment Transactions"
                                description="No customer payments or advance installments have been recorded for this booking yet."
                                actionLabel={remainingDue > 0 && onRecordNewPayment ? "Record First Payment" : undefined}
                                onAction={() => {
                                    onClose();
                                    if (onRecordNewPayment) onRecordNewPayment(record);
                                }}
                            />
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>UTR / Reference</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((p, idx) => {
                                            const pDate = p.paymentDate || p.createdAt;
                                            const dateFormatted = pDate
                                                ? new Date(pDate).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })
                                                : '—';

                                            return (
                                                <TableRow key={p._id || `tx-${idx}`}>
                                                    <TableCell>
                                                        <span className="font-bold text-slate-800 text-xs block">
                                                            {dateFormatted}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {pDate ? new Date(pDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-extrabold text-emerald-700 text-xs">
                                                            ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                            {p.paymentMethod || 'Online'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-xs text-slate-600">
                                                            {p.referenceNumber || 'Verified'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs text-slate-500 truncate max-w-xs block" title={p.notes}>
                                                            {p.notes || '—'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">
                            Total Records: {payments.length}
                        </span>
                        <Button type="button" variant="secondary" onClick={onClose} size="sm">
                            Close Drawer
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

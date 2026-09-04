import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { crmApi } from '../../../services/crmApi';

const PAYMENT_METHODS = [
    { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
    { value: 'UPI', label: 'UPI / Online' },
    { value: 'CASH', label: 'Cash' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'OTHER', label: 'Other' }
];

export default function RecordVendorPaymentModal({
    isOpen,
    onClose,
    token,
    item, // { vendorId, vendorName, bookingId, bookingNumber, serviceName, dueAmount, plannedCost }
    onPaymentSaved
}) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [amount, setAmount] = useState(item?.dueAmount ? String(item.dueAmount) : '');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [paymentDate, setPaymentDate] = useState(todayStr);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (isOpen && item) {
            setAmount(item.dueAmount ? String(item.dueAmount) : '');
            setPaymentMethod('BANK_TRANSFER');
            setPaymentDate(todayStr);
            setReferenceNumber('');
            setNotes('');
            setError('');
        }
    }, [isOpen, item, todayStr]);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid payment amount.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                bookingId: item.bookingId,
                vendorId: item.vendorId,
                amount: numAmount,
                paymentMethod,
                paymentDate: paymentDate || todayStr,
                referenceNumber: referenceNumber.trim() || undefined,
                notes: notes.trim() || undefined
            };

            const res = await crmApi.recordVendorPayment(token, payload);
            if (res.success) {
                if (onPaymentSaved) onPaymentSaved(res);
                onClose();
            } else {
                setError(res.message || 'Failed to record vendor payment.');
            }
        } catch (err) {
            setError(err.message || 'Error recording vendor payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Record Vendor Payout — ${item.vendorName || 'Vendor'}`}
            size="md"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    >
                        Disburse Payout
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                        {error}
                    </div>
                )}

                {/* Booking & Service Context Banner */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-gray-800">
                        <span>Vendor: {item.vendorName}</span>
                        <span className="font-mono text-blue-700">{item.bookingNumber}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                        <span>Service: {item.serviceName || 'General'}</span>
                        <span>Outstanding Due: <strong className="text-rose-700">₹{(item.dueAmount || 0).toLocaleString('en-IN')}</strong></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Disbursement Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            min="1"
                            step="any"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            {PAYMENT_METHODS.map((pm) => (
                                <option key={pm.value} value={pm.value}>
                                    {pm.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Payment Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            max={todayStr}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Transaction / UTR Reference
                        </label>
                        <Input
                            type="text"
                            placeholder="NEFT / IMPS / UPI Ref #"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Internal Notes
                    </label>
                    <textarea
                        rows={2}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Settlement notes, invoice details or adjustments..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </form>
        </Modal>
    );
}

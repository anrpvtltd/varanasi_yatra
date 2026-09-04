import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { crmApi } from '../../../services/crmApi';

const EXPENSE_CATEGORIES = [
    { value: 'FUEL', label: 'Fuel / Diesel' },
    { value: 'PARKING', label: 'Toll & Parking' },
    { value: 'EMERGENCY', label: 'Emergency Purchase' },
    { value: 'STAFF', label: 'Staff Expense / Allowance' },
    { value: 'COMMISSION', label: 'Partner Commission' },
    { value: 'MARKETING', label: 'Marketing / Promotion' },
    { value: 'OFFICE', label: 'Office & Admin' },
    { value: 'REFUND', label: 'Customer Refund' },
    { value: 'OTHER', label: 'Miscellaneous / Other' }
];

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'UPI', label: 'UPI / Online' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
    { value: 'CARD', label: 'Card' },
    { value: 'OTHER', label: 'Other' }
];

export default function RecordExpenseModal({
    isOpen,
    onClose,
    token,
    bookings = [],
    preselectedBookingId = '',
    onExpenseSaved
}) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [description, setDescription] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('FUEL');
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(todayStr);
    const [bookingId, setBookingId] = useState(preselectedBookingId || '');
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setDescription('');
            setExpenseCategory('FUEL');
            setAmount('');
            setExpenseDate(todayStr);
            setBookingId(preselectedBookingId || '');
            setPaymentMethod('UPI');
            setReferenceNumber('');
            setNotes('');
            setError('');
        }
    }, [isOpen, preselectedBookingId, todayStr]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid positive expense amount.');
            return;
        }

        if (!description.trim()) {
            setError('Please enter an expense title / description.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                expenseCategory,
                description: description.trim(),
                amount: numAmount,
                expenseDate: expenseDate || todayStr,
                bookingId: bookingId || undefined,
                paymentMethod,
                referenceNumber: referenceNumber.trim() || undefined,
                notes: notes.trim() || undefined
            };

            const res = await crmApi.recordExpense(token, payload);
            if (res.success) {
                if (onExpenseSaved) onExpenseSaved(res.expense);
                onClose();
            } else {
                setError(res.message || 'Failed to record business expense.');
            }
        } catch (err) {
            setError(err.message || 'Error recording expense.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Record Business Expense"
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
                        Save Expense
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

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Expense Title / Description <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        placeholder="e.g. Fuel for Airport Pickup, Dashashwamedh Parking"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Expense Category <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={expenseCategory}
                            onChange={(e) => setExpenseCategory(e.target.value)}
                        >
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            min="1"
                            step="any"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Expense Date <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            max={todayStr}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            Payment Method
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

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Link to Booking (Optional)
                    </label>
                    <Select
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                    >
                        <option value="">-- General Operational Expense (No Booking) --</option>
                        {bookings.map((b) => (
                            <option key={b._id} value={b._id}>
                                {b.bookingNumber} — {b.customerDetails?.name || 'Guest'} ({b.travelDetails?.travelDate || 'Date N/A'})
                            </option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Reference / Receipt No. (Optional)
                    </label>
                    <Input
                        type="text"
                        placeholder="Bill No., UPI Ref, or Voucher #"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Notes (Internal CEO Record)
                    </label>
                    <textarea
                        rows={2}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Additional operational or vendor notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </form>
        </Modal>
    );
}

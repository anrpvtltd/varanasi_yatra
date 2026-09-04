import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormInput, TextArea } from '../ui/Input';
import { crmApi } from '../../../services/crmApi';

const PAYMENT_METHODS = [
    { id: 'UPI', label: 'UPI', icon: '📱' },
    { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
    { id: 'CASH', label: 'Cash', icon: '💵' },
    { id: 'CARD', label: 'Card', icon: '💳' },
    { id: 'OTHER', label: 'Other', icon: '✨' }
];

export default function RecordPaymentModal({
    isOpen = false,
    onClose,
    booking,
    token,
    onPaymentRecorded
}) {
    const todayStr = new Date().toISOString().split('T')[0];

    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [paymentDate, setPaymentDate] = useState(todayStr);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const packagePrice = booking?.packagePrice ||
        booking?.packageDetails?.finalCustomerPrice ||
        booking?.customerPaymentSummary?.packagePrice ||
        booking?.totalAmount || 0;

    const totalPaid = (booking?.totalPaid !== undefined && booking?.totalPaid > 0)
        ? booking.totalPaid
        : ((booking?.customerPaymentSummary?.totalPaid !== undefined && booking?.customerPaymentSummary?.totalPaid > 0)
            ? booking.customerPaymentSummary.totalPaid
            : (Number(booking?.advanceAmount) || Number(booking?.advancePaid) || 0));

    const remainingDue = (booking?.remainingDue !== undefined)
        ? booking.remainingDue
        : ((booking?.customerPaymentSummary?.customerDue !== undefined && packagePrice > 0)
            ? booking.customerPaymentSummary.customerDue
            : Math.max(0, packagePrice - totalPaid));

    // Reset or pre-fill state whenever modal opens
    useEffect(() => {
        if (isOpen) {
            setAmount(remainingDue > 0 ? String(remainingDue) : '');
            setPaymentMethod('UPI');
            setPaymentDate(todayStr);
            setReferenceNumber('');
            setNotes('');
            setErrorMessage('');
            setIsSubmitting(false);
        }
    }, [isOpen, remainingDue, todayStr]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) {
            setErrorMessage('Please enter a valid positive payment amount.');
            return;
        }

        if (paymentDate && paymentDate > todayStr) {
            setErrorMessage('Payment date cannot be in the future.');
            return;
        }

        const isRefRequired = ['UPI', 'BANK_TRANSFER', 'CARD'].includes(paymentMethod);
        if (isRefRequired && !referenceNumber.trim()) {
            setErrorMessage(`Reference / UTR number is required for ${paymentMethod.replace('_', ' ')}.`);
            return;
        }

        const targetBookingId = booking?._id || booking?.bookingNumber || booking?.bookingId;
        if (!targetBookingId) {
            setErrorMessage('Booking reference identifier is missing. Please reopen the booking.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await crmApi.recordCustomerPayment(token, {
                bookingId: targetBookingId,
                amount: numAmount,
                paymentMethod,
                paymentDate: paymentDate || todayStr,
                referenceNumber: referenceNumber.trim(),
                notes: notes.trim()
            });

            if (res.success) {
                if (onPaymentRecorded) {
                    onPaymentRecorded(res.booking || res);
                }
                if (onClose) onClose();
            } else {
                setErrorMessage(res.message || 'Failed to record customer payment.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Server error while recording payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !booking) return null;

    const customerName = booking.customerDetails?.name || booking.name || 'Valued Customer';
    const bookingNumber = booking.bookingNumber || booking._id || 'BKG';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Record Customer Payment"
            subtitle={`Booking #${bookingNumber} · ${customerName}`}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Due Amount Highlight Card */}
                <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                            Package Price
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                            ₹{packagePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                            ✓ ₹{totalPaid.toLocaleString('en-IN')} Received
                        </span>
                    </div>

                    <div className="text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                            Remaining Due
                        </span>
                        <span className={`text-base font-extrabold block ${remainingDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            ₹{remainingDue.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            remainingDue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                            {remainingDue === 0 ? 'Fully Paid' : 'Balance Due'}
                        </span>
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
                        <span>⚠️</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Amount */}
                <FormInput
                    label="Amount (₹)"
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 15000)"
                />

                {/* Payment Method Radio Pills */}
                <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold text-slate-700">
                        Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = paymentMethod === method.id;
                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                            : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{method.icon}</span>
                                    <span>{method.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Date & Reference UTR in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormInput
                        label="Payment Date"
                        required
                        type="date"
                        max={todayStr}
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                    />

                    <FormInput
                        label={`Reference / UTR ${['UPI', 'BANK_TRANSFER', 'CARD'].includes(paymentMethod) ? '*' : ''}`}
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder={['UPI', 'BANK_TRANSFER', 'CARD'].includes(paymentMethod) ? 'e.g. UTR-928472918' : 'Optional reference'}
                    />
                </div>

                {/* Notes */}
                <TextArea
                    label="Payment Notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Paid 50% advance via GPay on booking confirmation"
                />

                {/* Modal Footer Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={isSubmitting}
                        icon={<span>💳</span>}
                    >
                        Record Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

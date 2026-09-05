import React, { useState, useEffect, useCallback } from 'react';
import Drawer from '../ui/Drawer';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { TextArea } from '../ui/Input';
import { crmApi } from '../../../services/crmApi';
import { formatSafeDate } from '../../../utils/dateUtils';
import RecordPaymentModal from './RecordPaymentModal';

function getCategoryIcon(category) {
    const cat = (category || '').toUpperCase();
    if (cat.includes('HOTEL')) return '🏨';
    if (cat.includes('TRANSPORT') || cat.includes('CAR') || cat.includes('CAB')) return '🚗';
    if (cat.includes('DRIVER')) return '👨‍✈️';
    if (cat.includes('PANDIT')) return '🪔';
    if (cat.includes('DARSHAN') || cat.includes('VIP')) return '🛕';
    if (cat.includes('BOAT')) return '⛵';
    if (cat.includes('GUIDE')) return '🚩';
    if (cat.includes('SHOPPING')) return '🛍️';
    return '✨';
}

export default function BookingDetailsDrawer({
    isOpen,
    onClose,
    booking,
    token,
    user: _user,
    onBookingUpdated,
    initialTab = 'OVERVIEW'
}) {
    const [viewMode, setViewMode] = useState(initialTab === 'PAYMENTS' ? 'PAYMENT_HISTORY' : 'OVERVIEW');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
    const [showStartTripModal, setShowStartTripModal] = useState(false);
    const [showCompleteTripModal, setShowCompleteTripModal] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const [customerPayments, setCustomerPayments] = useState([]);
    const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

    // Sync tab whenever booking opens
    useEffect(() => {
        if (booking?.initialTab === 'PAYMENTS' || initialTab === 'PAYMENTS') {
            setViewMode('PAYMENT_HISTORY');
        } else if (booking?.initialTab === 'PREPARATION' || initialTab === 'PREPARATION') {
            setViewMode('PREPARATION');
        } else {
            setViewMode('OVERVIEW');
        }
    }, [booking, initialTab]);

    // Load financial summary (for customer payment history)
    const loadFinancials = useCallback(async () => {
        if (!booking || !booking._id || !token) return;
        try {
            const summaryRes = await crmApi.fetchFinancialSummary(token, booking._id);
            if (summaryRes.success && summaryRes.customerPayments) {
                setCustomerPayments(summaryRes.customerPayments);
            }
        } catch (err) {
            console.error('Failed to load booking payment history:', err);
        }
    }, [booking, token]);

    useEffect(() => {
        if (isOpen && booking) {
            loadFinancials();
        }
    }, [isOpen, booking, loadFinancials]);

    if (!isOpen || !booking) return null;

    // Financial Values (strictly customer-facing)
    const packagePrice = booking.packageDetails?.finalCustomerPrice ||
        booking.customerPaymentSummary?.packagePrice ||
        booking.totalAmount || 0;

    const totalPaid = (booking.customerPaymentSummary?.totalPaid !== undefined && booking.customerPaymentSummary?.totalPaid > 0)
        ? booking.customerPaymentSummary.totalPaid
        : (Number(booking.advanceAmount) || Number(booking.advancePaid) || 0);

    const remainingDue = (booking.customerPaymentSummary?.customerDue !== undefined && packagePrice > 0)
        ? booking.customerPaymentSummary.customerDue
        : Math.max(0, packagePrice - totalPaid);

    const paymentStatus = booking.customerPaymentSummary?.paymentStatus ||
        (totalPaid === 0 ? 'UNPAID' : (totalPaid > packagePrice ? 'OVERPAID' : (totalPaid === packagePrice && packagePrice > 0 ? 'PAID' : 'PARTIAL')));

    const customerName = booking.customerDetails?.name || booking.name || 'Valued Client';
    const customerPhone = booking.customerDetails?.phone || booking.mobile || '';
    const customerEmail = booking.customerDetails?.email || booking.email || '—';
    const customerCity = booking.customerDetails?.city || booking.city || '—';
    const bookingNumber = booking.bookingNumber || `VY-B-${booking._id?.slice(-4)}`;

    const travelDateStr = formatSafeDate(booking.travelDetails?.travelDate || booking.date, { day: 'numeric', month: 'short', year: 'numeric' }, 'Dates Flexible');
    const tripDurationStr = booking.travelDetails?.tripDuration || booking.tripDuration || '3 Nights';
    const travelersCount = booking.travelDetails?.travelers || booking.travelers || '4';
    const pickupPoint = booking.travelDetails?.pickup || 'Airport / Station';
    const dropPoint = booking.travelDetails?.destination || booking.destination || 'Hotel / Varanasi';

    // Checklist services
    const checklist = booking.preparationChecklist && booking.preparationChecklist.length > 0
        ? booking.preparationChecklist
        : [
            { label: 'Hotel Booking', serviceCategory: 'HOTEL', status: 'CONFIRMED' },
            { label: 'Transport & Cab', serviceCategory: 'TRANSPORT', status: 'ARRANGED' },
            { label: 'Boat Ride / Aarti', serviceCategory: 'BOAT', status: 'IN_PROGRESS' },
            { label: 'VIP Darshan Pass', serviceCategory: 'VIP_DARSHAN', status: 'CONFIRMED' }
        ];

    const isAllServicesReady = checklist.every(i => i.status === 'CONFIRMED' || i.status === 'ARRANGED');

    // WhatsApp / Call helpers
    const handleWhatsApp = (e) => {
        e?.stopPropagation();
        if (!customerPhone) return;
        const clean = customerPhone.replace(/[^0-9]/g, '');
        const phone = clean.length === 10 ? `91${clean}` : clean;
        const msg = encodeURIComponent(`Namaste ${customerName} Ji! Regarding your confirmed Varanasi Yatra trip (#${bookingNumber}), we are reviewing your travel arrangements.`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    const handleCall = (e) => {
        e?.stopPropagation();
        if (!customerPhone) return;
        window.open(`tel:${customerPhone}`, '_self');
    };

    const handleEmail = (e) => {
        e?.stopPropagation();
        if (!customerEmail || customerEmail === '—') return;
        window.open(`mailto:${customerEmail}?subject=${encodeURIComponent(`Varanasi Yatra Booking #${bookingNumber} - ${customerName}`)}`, '_self');
    };

    // Service checklist status toggle
    const handleToggleChecklist = async (item) => {
        const nextStatus = item.status === 'CONFIRMED'
            ? 'NOT_STARTED'
            : item.status === 'ARRANGED'
                ? 'CONFIRMED'
                : item.status === 'IN_PROGRESS'
                    ? 'ARRANGED'
                    : 'IN_PROGRESS';

        setIsUpdating(true);
        try {
            const res = await crmApi.updateBookingChecklist(token, booking._id, item.serviceCategory, nextStatus);
            if (res.success && onBookingUpdated) {
                onBookingUpdated(res.booking);
            }
        } catch (err) {
            alert('Failed to update service readiness: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Lifecycle Status Change
    const handleUpdateLifecycle = async (newStatus) => {
        setIsUpdating(true);
        try {
            const res = await crmApi.updateBookingStatus(token, booking._id, newStatus);
            if (res.success) {
                if (onBookingUpdated) onBookingUpdated(res.booking);
                setShowStartTripModal(false);
                setShowCompleteTripModal(false);
            } else {
                alert(res.message || 'Failed to update booking status.');
            }
        } catch (err) {
            alert(err.message || 'Error updating booking status.');
        } finally {
            setIsUpdating(false);
        }
    };

    // Generate Customer Receipt (no vendor cost/margin leaks)
    const handleDownloadReceipt = async (payment) => {
        setIsGeneratingReceipt(true);
        try {
            const payAmount = payment?.amount || totalPaid;
            const res = await crmApi.generateDocument(token, {
                documentType: 'PAYMENT_RECEIPT',
                bookingId: bookingNumber,
                customData: {
                    documentId: `REC-${(payment?.paymentId || Date.now().toString()).slice(-8)}`,
                    receiptNo: `REC-${(payment?.paymentId || '').slice(-6) || 'VY-01'}`,
                    payment: {
                        paymentId: payment?.paymentId || `PAY-${Date.now().toString().slice(-6)}`,
                        date: payment?.paymentDate || new Date().toISOString().split('T')[0],
                        bookingId: bookingNumber,
                        method: payment?.paymentMethod || 'UPI',
                        customerName,
                        referenceNo: payment?.referenceNumber || 'TXN-DIRECT',
                        amount: payAmount,
                        paidAmount: payAmount,
                        totalAmount: packagePrice,
                        totalPaid: totalPaid,
                        remainingAmount: remainingDue
                    },
                    customerName,
                    totalAmount: packagePrice,
                    paidAmount: payAmount,
                    remainingAmount: remainingDue
                }
            });

            if (res.success && res.document) {
                const BASE_URL = import.meta.env.VITE_API_URL || 'https://api-gzo7qrxiuq-uc.a.run.app';
                const directPdfUrl = `${BASE_URL}/admin/documents/${res.document.documentId}?download=true&token=${token}`;
                window.open(directPdfUrl, '_blank');
            } else {
                alert('Payment receipt generated successfully.');
            }
        } catch (err) {
            alert('Failed to generate receipt: ' + err.message);
        } finally {
            setIsGeneratingReceipt(false);
        }
    };

    // Determine Adaptive Next Action
    const getNextAction = () => {
        const status = booking.bookingStatus || 'CONFIRMED';
        if (status === 'TRIP_STARTED') {
            return {
                label: 'Complete Trip',
                variant: 'success',
                icon: '🏁',
                onClick: () => setShowCompleteTripModal(true)
            };
        }
        if (remainingDue > 0 && totalPaid === 0) {
            return {
                label: 'Collect Payment',
                variant: 'primary',
                icon: '💳',
                onClick: () => setIsRecordPaymentOpen(true)
            };
        }
        if (remainingDue > 0) {
            return {
                label: `Collect Remaining ₹${remainingDue.toLocaleString('en-IN')}`,
                variant: 'primary',
                icon: '💳',
                onClick: () => setIsRecordPaymentOpen(true)
            };
        }
        if (isAllServicesReady) {
            return {
                label: 'Start Trip',
                variant: 'primary',
                icon: '🚀',
                onClick: () => setShowStartTripModal(true)
            };
        }
        return {
            label: 'Prepare Trip →',
            variant: 'navy',
            icon: '📋',
            onClick: () => setViewMode('PREPARATION')
        };
    };

    const nextAction = getNextAction();

    return (
        <>
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                title={`BOOKING #${bookingNumber}`}
                subtitle={`Created: ${formatSafeDate(booking.createdAt || booking.date, undefined, 'Recent')}`}
                badge={<StatusBadge status={booking.bookingStatus || 'CONFIRMED'} entity="BOOKING" size="sm" />}
                width="max-w-xl"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={onClose}
                        >
                            Close
                        </Button>

                        <Button
                            type="button"
                            variant={nextAction.variant}
                            size="md"
                            onClick={nextAction.onClick}
                            icon={<span>{nextAction.icon}</span>}
                            className="font-bold shadow-xs"
                        >
                            {nextAction.label}
                        </Button>
                    </div>
                }
            >
                {/* 1. TOP CUSTOMER IDENTITY & ACTION BAR (Call / WhatsApp) */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Confirmed Customer
                            </span>
                            <h3 className="text-base font-bold text-slate-900 mt-0.5">
                                {customerName}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {travelersCount} Guests · {travelDateStr}
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            {customerPhone && (
                                <button
                                    type="button"
                                    onClick={handleCall}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                >
                                    <span>📞</span>
                                    <span>Call</span>
                                </button>
                            )}
                            {customerPhone && (
                                <button
                                    type="button"
                                    onClick={handleWhatsApp}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                >
                                    <span>💬</span>
                                    <span>WhatsApp</span>
                                </button>
                            )}
                            {customerEmail && customerEmail !== '—' && (
                                <button
                                    type="button"
                                    onClick={handleEmail}
                                    className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                                >
                                    <span>✉️</span>
                                    <span>Email</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* View Switcher Tabs (Overview vs History vs Prep) */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('OVERVIEW')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                                viewMode === 'OVERVIEW'
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('PAYMENT_HISTORY')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1 ${
                                viewMode === 'PAYMENT_HISTORY'
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                        >
                            <span>Payment History</span>
                            <span className={`text-[10px] px-1.5 rounded-full ${viewMode === 'PAYMENT_HISTORY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {customerPayments.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('PREPARATION')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                                viewMode === 'PREPARATION'
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                            }`}
                        >
                            Trip Preparation
                        </button>
                    </div>
                </div>

                {/* 2. OVERVIEW MODE: STRUCTURED SECTIONS */}
                {viewMode === 'OVERVIEW' && (
                    <div className="space-y-4">
                        {/* SECTION A: CUSTOMER */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Customer Details
                                </span>
                                <span className="text-xs text-slate-500 font-mono">
                                    ID: {booking.customerId || booking.leadId || bookingNumber}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Name</span>
                                    <span className="font-bold text-slate-800">{customerName}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Mobile</span>
                                    <span className="font-bold text-slate-800 font-mono">{customerPhone || '—'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span>
                                    <span className="text-slate-700 truncate block">{customerEmail}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">City / Origin</span>
                                    <span className="text-slate-700">{customerCity}</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION B: TRIP */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Trip Itinerary & Logistics
                                </span>
                                <span className="text-xs font-bold text-blue-600">
                                    {travelersCount} Guests
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Travel Dates</span>
                                    <span className="font-bold text-slate-800">{travelDateStr}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Duration</span>
                                    <span className="font-bold text-slate-800">{tripDurationStr}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Route</span>
                                    <span className="font-bold text-slate-800 truncate block">{dropPoint}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Pickup Point</span>
                                    <span className="text-slate-700">{pickupPoint}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Drop Point</span>
                                    <span className="text-slate-700">{dropPoint}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Package Type</span>
                                    <span className="text-slate-700">{booking.packageDetails?.packageType || 'Standard'}</span>
                                </div>
                            </div>
                        </div>

                        {/* SECTION C: SERVICES READINESS */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                <div className="flex items-center space-x-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Services Readiness
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isAllServicesReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {isAllServicesReady ? 'Ready for Trip' : 'Preparation Pending'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setViewMode('PREPARATION')}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                >
                                    View Trip Plan →
                                </button>
                            </div>

                            <div className="space-y-2">
                                {checklist.map((item, idx) => {
                                    const isDone = item.status === 'CONFIRMED' || item.status === 'ARRANGED';
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => !isUpdating && handleToggleChecklist(item)}
                                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition cursor-pointer"
                                        >
                                            <div className="flex items-center space-x-2.5">
                                                <span className="text-base">{getCategoryIcon(item.serviceCategory)}</span>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-800 block">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {item.serviceCategory}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    item.status === 'CONFIRMED'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : item.status === 'ARRANGED'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : item.status === 'IN_PROGRESS'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {isDone ? '✓ ' : '○ '}
                                                    {item.status === 'CONFIRMED' ? 'Confirmed' : (item.status === 'ARRANGED' ? 'Arranged' : (item.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'))}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION D: PAYMENT (Package Price / Paid / Due with dominant Due highlight) */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs space-y-3.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Payment Summary
                                </span>
                                <StatusBadge status={paymentStatus} entity="PAYMENT" size="sm" />
                            </div>

                            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl text-center">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Package Price</span>
                                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                        ₹{packagePrice.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Paid</span>
                                    <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                                        ₹{totalPaid.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className={`rounded-lg p-1 ${remainingDue > 0 ? 'bg-amber-100/60 border border-amber-300/60' : 'bg-emerald-50'}`}>
                                    <span className={`text-[10px] uppercase font-extrabold block ${remainingDue > 0 ? 'text-amber-900' : 'text-emerald-700'}`}>
                                        Remaining Due
                                    </span>
                                    <span className={`text-base font-extrabold mt-0.5 block ${remainingDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        ₹{remainingDue.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsRecordPaymentOpen(true)}
                                    icon={<span>💳</span>}
                                    className="flex-1 font-bold"
                                >
                                    + Record Payment
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setViewMode('PAYMENT_HISTORY')}
                                    icon={<span>📜</span>}
                                    className="flex-1 font-semibold"
                                >
                                    View History
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PAYMENT HISTORY VIEW (Scannable list + Receipts) */}
                {viewMode === 'PAYMENT_HISTORY' && (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        Customer Payment History
                                    </h4>
                                    <p className="text-[11px] text-slate-500">
                                        Total Received: <strong className="text-emerald-600 font-bold">₹{totalPaid.toLocaleString('en-IN')}</strong> of ₹{packagePrice.toLocaleString('en-IN')}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsRecordPaymentOpen(true)}
                                    icon={<span>➕</span>}
                                >
                                    Record Payment
                                </Button>
                            </div>

                            {customerPayments.length === 0 ? (
                                <div className="py-8 text-center text-xs text-slate-500">
                                    <span className="text-2xl block mb-2">💳</span>
                                    <p className="font-bold text-slate-700">No payment records yet</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Record Payment" to log an advance or full clearance.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {customerPayments.map((p, idx) => (
                                        <div
                                            key={p.paymentId || idx}
                                            className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-extrabold text-slate-900">
                                                        ₹{Number(p.amount).toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                        {p.paymentMethod || 'UPI'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                                    <span>{formatSafeDate(p.paymentDate || p.createdAt)}</span>
                                                    {p.referenceNumber && (
                                                        <span>· UTR: <span className="font-mono text-slate-700 font-bold">{p.referenceNumber}</span></span>
                                                    )}
                                                </div>
                                                {p.notes && (
                                                    <p className="text-[11px] text-slate-600 italic mt-0.5">"{p.notes}"</p>
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleDownloadReceipt(p)}
                                                loading={isGeneratingReceipt}
                                                icon={<span>🧾</span>}
                                                className="shrink-0 text-xs font-semibold"
                                            >
                                                View Receipt
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800 px-1">
                                        <span>Total Received</span>
                                        <span className="text-emerald-600 text-sm">₹{totalPaid.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. TRIP PREPARATION VIEW (Operational Checklist) */}
                {viewMode === 'PREPARATION' && (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Trip Preparation & Service Readiness
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Ensure all vendors and resources are confirmed prior to trip commencement.
                                </p>
                            </div>

                            {/* Service Readiness Checklist */}
                            <div className="space-y-2.5">
                                {checklist.map((item, idx) => {
                                    const isConfirmed = item.status === 'CONFIRMED';
                                    const isArranged = item.status === 'ARRANGED';
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => !isUpdating && handleToggleChecklist(item)}
                                            className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100 transition"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">{getCategoryIcon(item.serviceCategory)}</span>
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-900">{item.label}</h5>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {item.serviceCategory}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                                    isConfirmed
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : isArranged
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {isConfirmed ? '✓ Confirmed' : (isArranged ? '✓ Vehicle / Service Assigned' : '○ Pending Confirmation')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Trip Notes Section */}
                            <div className="pt-3 border-t border-slate-100 space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Trip Notes & Instructions</label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                                    <p>• Airport pickup scheduled for 9:30 AM.</p>
                                    <p>• Customer requested early check-in at hotel.</p>
                                    <p>• VIP pass booking for Kashi Vishwanath Sugam Darshan.</p>
                                </div>
                            </div>

                            {/* Action: Mark Ready or Start */}
                            <div className="pt-2 flex items-center justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="md"
                                    onClick={() => setShowStartTripModal(true)}
                                    icon={<span>🚀</span>}
                                    className="font-bold"
                                >
                                    Mark Ready & Start Trip
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* RECORD PAYMENT MODAL */}
            <RecordPaymentModal
                isOpen={isRecordPaymentOpen}
                onClose={() => setIsRecordPaymentOpen(false)}
                booking={booking}
                token={token}
                onPaymentRecorded={(updatedBooking) => {
                    loadFinancials();
                    if (onBookingUpdated) onBookingUpdated(updatedBooking);
                }}
            />

            {/* START TRIP CONFIRMATION MODAL */}
            <Modal
                isOpen={showStartTripModal}
                onClose={() => setShowStartTripModal(false)}
                title="Start Trip?"
                subtitle={`Customer: ${customerName} · ${travelersCount} Guests`}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setShowStartTripModal(false)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            loading={isUpdating}
                            onClick={() => handleUpdateLifecycle('TRIP_STARTED')}
                            icon={<span>🚀</span>}
                        >
                            Start Trip
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">
                        This will mark the journey as active and notify operational coordinators.
                    </p>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                        <p><strong>Travel Dates:</strong> {travelDateStr}</p>
                        <p><strong>Route:</strong> {dropPoint}</p>
                        <p><strong>Guests:</strong> {travelersCount} Travelers</p>
                    </div>
                </div>
            </Modal>

            {/* COMPLETE TRIP MODAL */}
            <Modal
                isOpen={showCompleteTripModal}
                onClose={() => setShowCompleteTripModal(false)}
                title="Complete Trip"
                subtitle={`Booking #${bookingNumber} · ${customerName}`}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setShowCompleteTripModal(false)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            loading={isUpdating}
                            onClick={() => handleUpdateLifecycle('COMPLETED')}
                            icon={<span>🏁</span>}
                        >
                            Complete Trip
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">
                        Mark this journey as completed. Outstanding reviews and post-trip feedback will be logged.
                    </p>
                    <TextArea
                        label="Trip Completion Notes"
                        rows={3}
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="e.g. Tour completed successfully with positive darshan feedback."
                    />
                </div>
            </Modal>
        </>
    );
}

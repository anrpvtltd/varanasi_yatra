import React, { useState, useEffect } from 'react';
import { crmApi } from '../../../services/crmApi';
import { computeBookingReadiness } from '../../../utils/bookingReadiness';
import { formatSafeDate } from '../../../utils/dateUtils';
import PaymentManagementPanel from './PaymentManagementPanel';

export default function BookingDetailsDrawer({
    isOpen,
    onClose,
    booking,
    token,
    user,
    onBookingUpdated,
    initialTab = 'PREPARATION'
}) {
    const [activeDrawerTab, setActiveDrawerTab] = useState(booking?.initialTab || initialTab);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (booking?.initialTab) {
            setActiveDrawerTab(booking.initialTab);
        } else if (initialTab) {
            setActiveDrawerTab(initialTab);
        }
    }, [booking, initialTab]);

    if (!isOpen || !booking) return null;

    const readiness = computeBookingReadiness(booking);


    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true);
        try {
            const res = await crmApi.updateBookingStatus(token, booking._id, newStatus);
            if (res.success && onBookingUpdated) {
                onBookingUpdated(res.booking);
            }
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChecklistToggle = async (item) => {
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
            alert('Failed to update checklist: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'READY':
                return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-3 py-1 rounded-full text-xs">🟢 READY FOR TRIP</span>;
            case 'PREPARING':
                return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-3 py-1 rounded-full text-xs">🟡 IN PREPARATION</span>;
            case 'TRIP_STARTED':
                return <span className="bg-blue-100 text-blue-900 border border-blue-300 font-extrabold px-3 py-1 rounded-full text-xs">🚀 TRIP ACTIVE</span>;
            case 'COMPLETED':
                return <span className="bg-stone-200 text-stone-800 border border-stone-400 font-extrabold px-3 py-1 rounded-full text-xs">✅ COMPLETED</span>;
            case 'CANCELLED':
                return <span className="bg-rose-100 text-rose-800 border border-rose-300 font-extrabold px-3 py-1 rounded-full text-xs">🔴 CANCELLED</span>;
            default:
                return <span className="bg-stone-100 text-stone-700 font-extrabold px-3 py-1 rounded-full text-xs">⏳ PENDING</span>;
        }
    };

    const getCategoryIcon = (category) => {
        const cat = (category || '').toUpperCase();
        if (cat.includes('HOTEL')) return '🏨';
        if (cat.includes('TRANSPORT') || cat.includes('CAR')) return '🚗';
        if (cat.includes('DRIVER')) return '👨‍✈️';
        if (cat.includes('PANDIT')) return '🪔';
        if (cat.includes('VIP')) return '🛕';
        if (cat.includes('BOAT')) return '⛵';
        if (cat.includes('GUIDE')) return '🚩';
        if (cat.includes('SHOPPING')) return '🛍️';
        return '✨';
    };

    return (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex justify-end transition-opacity">
            <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">

                {/* DRAWER HEADER */}
                <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">🚖</span>
                            <h2 className="text-lg font-serif font-extrabold tracking-wide">BOOKING #{booking.bookingNumber}</h2>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">Created: {formatSafeDate(booking.createdAt)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold transition cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* DRAWER CONTENT BODY */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* CUSTOMER & TRIP SUMMARY CARD */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">Customer Details</span>
                                <h3 className="text-base font-extrabold text-stone-900">{booking.customerDetails?.name}</h3>
                                <p className="text-xs font-bold text-stone-700 flex items-center space-x-1 mt-0.5">
                                    <span>📞</span>
                                    <span>{booking.customerDetails?.phone}</span>
                                    {booking.customerDetails?.city && <span>· {booking.customerDetails?.city}</span>}
                                </p>
                            </div>
                            <div>{getStatusBadge(booking.bookingStatus)}</div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-white/80 p-3 rounded-xl border border-amber-200/50 text-xs font-bold">
                            <div>
                                <span className="text-[10px] text-stone-400 font-extrabold uppercase block">Travel Date</span>
                                <span className="text-stone-900">{booking.travelDetails?.travelDate || 'Flexible'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-stone-400 font-extrabold uppercase block">Duration</span>
                                <span className="text-stone-900">{booking.travelDetails?.tripDuration || '3 Days'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-stone-400 font-extrabold uppercase block">Travelers</span>
                                <span className="text-stone-900">{booking.travelDetails?.travelers} Guest(s)</span>
                            </div>
                        </div>
                    </div>

                    {/* DRAWER TABS SWITCHER */}
                    <div className="flex border-b border-stone-200 space-x-2">
                        <button
                            type="button"
                            onClick={() => setActiveDrawerTab('PREPARATION')}
                            className={`px-4 py-2 font-serif font-extrabold text-xs border-b-2 transition ${
                                activeDrawerTab === 'PREPARATION'
                                    ? 'border-amber-600 text-amber-900 bg-amber-50/60'
                                    : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            📋 TRIP PREPARATION & CHECKLIST
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveDrawerTab('PAYMENTS')}
                            className={`px-4 py-2 font-serif font-extrabold text-xs border-b-2 transition ${
                                activeDrawerTab === 'PAYMENTS'
                                    ? 'border-amber-600 text-amber-900 bg-amber-50/60'
                                    : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            💳 PAYMENTS & REAL PROFIT
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveDrawerTab('DOCUMENTS')}
                            className={`px-4 py-2 font-serif font-extrabold text-xs border-b-2 transition ${
                                activeDrawerTab === 'DOCUMENTS'
                                    ? 'border-amber-600 text-amber-900 bg-amber-50/60'
                                    : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            📄 DOCUMENTS
                        </button>
                    </div>

                    {/* TAB 1: TRIP PREPARATION */}
                    {activeDrawerTab === 'PREPARATION' && (
                        <div className="space-y-6">
                            {/* TRIP READINESS PROGRESS CARD */}
                            <div className="bg-stone-900 text-white p-5 rounded-2xl space-y-3 shadow-md">

                        <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">TRIP READINESS ENGINE</span>
                            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                readiness.status === 'READY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                readiness.status === 'ELAPSED' ? 'bg-stone-700 text-stone-300' :
                                readiness.status === 'AT_RISK' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                                {readiness.status}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                                <span>Preparation Progress</span>
                                <span className="text-amber-400">{readiness.percentage}% ({readiness.completed} / {readiness.totalRequired} Services Arranged)</span>
                            </div>
                            <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden border border-stone-700 p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        readiness.percentage === 100 ? 'bg-emerald-500' :
                                        readiness.status === 'AT_RISK' ? 'bg-rose-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${readiness.percentage}%` }}
                                ></div>
                            </div>
                        </div>

                        {readiness.missingItems.length > 0 && (
                            <div className="text-[11px] font-semibold text-rose-300 pt-1">
                                ⚠️ Pending: {readiness.missingItems.join(', ')}
                            </div>
                        )}
                    </div>

                    {/* SERVICE PREPARATION CHECKLIST */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                                Service Preparation Checklist ({booking.preparationChecklist?.length || 0})
                            </h3>
                            <span className="text-[10px] text-stone-400 font-semibold">Click to advance status</span>
                        </div>

                        <div className="space-y-2">
                            {(booking.preparationChecklist || []).map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => !isUpdating && handleChecklistToggle(item)}
                                    className="bg-stone-50 border border-stone-200 hover:border-amber-400 p-3.5 rounded-2xl flex items-center justify-between transition cursor-pointer"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xl">{getCategoryIcon(item.serviceCategory)}</span>
                                        <div>
                                            <h4 className="text-xs font-extrabold text-stone-900">{item.label}</h4>
                                            <span className="text-[10px] text-stone-500 font-medium">{item.serviceCategory}</span>
                                        </div>
                                    </div>

                                    <div>
                                        {item.status === 'CONFIRMED' && (
                                            <span className="bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full text-xs">
                                                🟢 Confirmed
                                            </span>
                                        )}
                                        {item.status === 'ARRANGED' && (
                                            <span className="bg-blue-100 text-blue-800 font-extrabold px-3 py-1 rounded-full text-xs">
                                                🔵 Arranged
                                            </span>
                                        )}
                                        {item.status === 'IN_PROGRESS' && (
                                            <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full text-xs">
                                                🟡 In Progress
                                            </span>
                                        )}
                                        {item.status === 'NOT_STARTED' && (
                                            <span className="bg-rose-50 text-rose-700 font-extrabold px-3 py-1 rounded-full text-xs border border-rose-200">
                                                🔴 Not Arranged
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LIFECYCLE QUICK ACTION BUTTONS */}
                    <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 space-y-2">
                        <span className="text-[11px] font-extrabold text-stone-600 uppercase tracking-widest block">Update Trip Lifecycle Status</span>
                        <div className="flex flex-wrap gap-2">
                            {booking.bookingStatus !== 'TRIP_STARTED' && (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('TRIP_STARTED')}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                                >
                                    🚀 Start Trip
                                </button>
                            )}
                            {booking.bookingStatus !== 'COMPLETED' && (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('COMPLETED')}
                                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                                >
                                    ✅ Mark Completed
                                </button>
                            )}
                            {booking.bookingStatus !== 'CANCELLED' && (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange('CANCELLED')}
                                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                                >
                                    🔴 Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ACTIVITY HISTORY TIMELINE */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">Activity History Timeline</h3>
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3">
                            {(booking.activityHistory || []).map((act, idx) => (
                                <div key={idx} className="flex items-start space-x-3 text-xs border-b border-stone-200/60 pb-2.5 last:border-0 last:pb-0">
                                    <span className="text-stone-400 mt-0.5">•</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-stone-800">{act.message}</p>
                                        <span className="text-[10px] text-stone-400">
                                            {new Date(act.timestamp).toLocaleString()} · {act.performedBy || 'System'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: PAYMENTS & REAL PROFIT ENGINE */}
            {activeDrawerTab === 'PAYMENTS' && (
                <PaymentManagementPanel
                    booking={booking}
                    token={token}
                    user={user}
                    onBookingUpdated={onBookingUpdated}
                />
            )}

            {/* TAB 3: OFFICIAL DOCUMENTS */}
            {activeDrawerTab === 'DOCUMENTS' && (
                <div className="space-y-6">
                    <div className="bg-stone-900 text-white p-5 rounded-2xl space-y-2 shadow-md">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">DOCUMENT GENERATION & MANAGEMENT</span>
                        <h3 className="text-sm font-bold text-stone-100">Official Documents for Booking #{booking.bookingNumber || booking._id}</h3>
                        <p className="text-xs text-stone-400">Instantly generate versioned PDF documents with stored data snapshots.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { type: 'TRAVEL_VOUCHER', label: '🎫 Customer Travel Voucher', role: 'Manager' },
                            { type: 'CUSTOMER_INVOICE', label: '🧾 Tax Invoice', role: 'Manager' },
                            { type: 'PAYMENT_RECEIPT', label: '💳 Payment Receipt', role: 'Manager' },
                            { type: 'BOOKING_CONFIRMATION', label: '🎉 Booking Confirmation', role: 'Manager' },
                            { type: 'DRIVER_OPERATIONS_SHEET', label: '🚘 Driver Pickup Sheet', role: 'Manager' },
                            { type: 'VENDOR_OPERATIONS_SHEET', label: '🏨 Vendor Assignment', role: 'Manager' },
                            { type: 'INTERNAL_FINANCIAL_REPORT', label: '👑 CEO Financial Report', role: 'CEO' }
                        ].filter(d => d.role === 'Manager' || user?.role === 'CEO').map(d => (
                            <button
                                key={d.type}
                                onClick={async () => {
                                    try {
                                        const custSum = booking.customerPaymentSummary || {};
                                        const pkgPrice = custSum.packagePrice || booking.packageDetails?.finalCustomerPrice || booking.totalAmount || 0;
                                        const totPaid = custSum.totalPaid || booking.advanceAmount || booking.paidAmount || 0;
                                        const remDue = custSum.customerDue !== undefined ? custSum.customerDue : Math.max(0, pkgPrice - totPaid);
                                        const custName = booking.customerDetails?.name || booking.name || 'Valued Guest';

                                        const res = await crmApi.generateDocument(token, {
                                            documentType: d.type,
                                            bookingId: booking.bookingNumber || booking._id,
                                            customData: {
                                                bookingId: booking.bookingNumber || booking._id,
                                                customerName: custName,
                                                totalAmount: pkgPrice,
                                                paidAmount: totPaid,
                                                remainingAmount: remDue,
                                                payment: {
                                                    bookingId: booking.bookingNumber || booking._id,
                                                    customerName: custName,
                                                    totalAmount: pkgPrice,
                                                    paidAmount: totPaid,
                                                    totalPaid: totPaid,
                                                    remainingAmount: remDue,
                                                    date: new Date().toISOString().split('T')[0],
                                                    method: 'Online / UPI'
                                                }
                                            }
                                        });
                                        if (res.success) {
                                            alert(`Document ${d.type} generated successfully: ${res.document.documentId}`);
                                        }
                                    } catch (err) {
                                        alert(err.message || 'Generation failed');
                                    }
                                }}
                                className="p-3 bg-stone-50 border border-stone-200 hover:border-amber-500 rounded-xl text-xs font-bold text-stone-800 text-left transition-colors flex items-center justify-between"
                            >
                                <span>{d.label}</span>
                                <span className="text-amber-600">⚡</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

        </div>
    </div>
</div>
    );
}

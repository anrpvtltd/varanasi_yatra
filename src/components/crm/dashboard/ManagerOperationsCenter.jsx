import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateManagerDashboard } from '../../../utils/dashboardIntelligence';
import PriorityQueue from './PriorityQueue';
import UpcomingTrips from './UpcomingTrips';
import PaymentFollowupQueue from './PaymentFollowupQueue';

export default function ManagerOperationsCenter({
    token,
    user: _user,
    onOpenBooking,
    onOpenLead,
    onOpenQuote
}) {
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await crmApi.fetchManagerDashboard(token);
            if (res.success) {
                const computed = calculateManagerDashboard(res.bookings || [], res.leads || [], res.quotes || []);
                setDashData(computed);
            }
        } catch (err) {
            console.error('Failed to load Manager Dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handlePriorityAction = (item) => {
        if (item.navigationTarget === 'BOOKING_DRAWER' || item.navigationTarget === 'BOOKING_PAYMENTS') {
            if (onOpenBooking) onOpenBooking({ _id: item.relatedId, bookingNumber: item.bookingNumber });
        } else if (item.navigationTarget === 'LEAD_DRAWER') {
            if (onOpenLead) onOpenLead({ _id: item.relatedId, name: item.customerName });
        } else if (item.navigationTarget === 'QUOTE_BUILDER') {
            if (onOpenQuote) onOpenQuote({ _id: item.relatedId });
        }
    };

    return (
        <div className="space-y-6">

            {/* DASHBOARD HEADER */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚙️</span>
                        <h2 className="text-xl font-serif font-extrabold text-stone-900">Manager Operations Center</h2>
                    </div>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                        Real-time operational execution, trip preparation checklists, and follow-up priorities.
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={loadData}
                        className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                    >
                        🔄 Refresh Queue
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-stone-400 font-bold text-xs animate-pulse">
                    Calculating Operational Priorities & Readiness...
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. TODAY'S ACTION PRIORITIES */}
                    <PriorityQueue
                        priorities={dashData?.priorities || []}
                        onActionClick={handlePriorityAction}
                    />

                    {/* 2. UPCOMING TRIPS (NEXT 30 DAYS) */}
                    <UpcomingTrips
                        trips={dashData?.upcomingTrips || []}
                        onOpenBooking={onOpenBooking}
                    />

                    {/* 3. CUSTOMER PAYMENT FOLLOW-UP QUEUE */}
                    <PaymentFollowupQueue
                        paymentFollowups={dashData?.paymentFollowups || []}
                        onOpenBooking={onOpenBooking}
                    />

                    {/* 4. QUOTE & LEAD FOLLOW-UP QUEUES GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* QUOTE FOLLOW-UPS */}
                        <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-3 shadow-xs">
                            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest border-b pb-2 border-stone-100 flex justify-between items-center">
                                <span>📜 QUOTE FOLLOW-UPS ({(dashData?.quoteFollowups || []).length})</span>
                                <span className="text-[10px] text-stone-400 font-normal">Oldest First</span>
                            </h3>

                            {(dashData?.quoteFollowups || []).length === 0 ? (
                                <div className="text-stone-400 font-bold text-center py-4 text-xs">No pending quotes requiring follow-up.</div>
                            ) : (
                                <div className="space-y-2">
                                    {(dashData?.quoteFollowups || []).map((q) => (
                                        <div key={q.quoteId} className="bg-stone-50 border border-stone-200 p-3 rounded-2xl flex justify-between items-center text-xs">
                                            <div>
                                                <div className="font-extrabold text-stone-900">#{q.quoteNumber} · {q.customerName}</div>
                                                <div className="text-[10px] text-stone-500 font-medium">Quote Value: ₹{q.finalPrice?.toLocaleString('en-IN')}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onOpenQuote && onOpenQuote({ _id: q.quoteId, leadId: q.leadId })}
                                                className="px-3 py-1 bg-stone-900 hover:bg-stone-950 text-white font-bold rounded-xl text-xs uppercase"
                                            >
                                                OPEN QUOTE
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* LEAD FOLLOW-UPS */}
                        <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-3 shadow-xs">
                            <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest border-b pb-2 border-stone-100 flex justify-between items-center">
                                <span>📞 LEAD FOLLOW-UPS TODAY ({(dashData?.leadFollowups || []).length})</span>
                                <span className="text-[10px] text-stone-400 font-normal">Action Required</span>
                            </h3>

                            {(dashData?.leadFollowups || []).length === 0 ? (
                                <div className="text-stone-400 font-bold text-center py-4 text-xs">No leads scheduled for follow-up today.</div>
                            ) : (
                                <div className="space-y-2">
                                    {(dashData?.leadFollowups || []).map((l) => (
                                        <div key={l._id} className="bg-stone-50 border border-stone-200 p-3 rounded-2xl flex justify-between items-center text-xs">
                                            <div>
                                                <div className="font-extrabold text-stone-900">{l.name}</div>
                                                <div className="text-[10px] text-stone-500 font-medium">📞 {l.phone} · Stage: {l.stage || 'Enquiry'}</div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => onOpenLead && onOpenLead(l)}
                                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase"
                                            >
                                                OPEN LEAD
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

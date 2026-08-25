import React from 'react';

export default function BusinessFunnel({ funnel = {} }) {
    return (
        <div className="bg-white border border-stone-200 p-5 rounded-3xl space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest">
                    🎯 BUSINESS CONVERSION FUNNEL
                </h3>
                <span className="text-[10px] text-stone-400 font-semibold">Stage Conversion Metrics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">New Enquiries</span>
                    <span className="text-lg font-extrabold text-stone-900">{funnel.newLeads || 0}</span>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">Quotes Sent</span>
                    <span className="text-lg font-extrabold text-blue-900">{funnel.quotesSent || 0}</span>
                    <span className="text-[10px] font-bold text-blue-700 block mt-1">({funnel.leadToQuotePct || 0}% Lead ➔ Quote)</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl">
                    <span className="text-[10px] text-amber-700 font-extrabold uppercase block mb-1">Bookings Confirmed</span>
                    <span className="text-lg font-extrabold text-amber-900">{funnel.bookingsConfirmed || 0}</span>
                    <span className="text-[10px] font-bold text-amber-700 block mt-1">({funnel.quoteToBookingPct || 0}% Quote ➔ Booking)</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase block mb-1">Trips Completed</span>
                    <span className="text-lg font-extrabold text-emerald-900">{funnel.tripsCompleted || 0}</span>
                    <span className="text-[10px] font-bold text-emerald-700 block mt-1">({funnel.bookingToCompletedPct || 0}% Booking ➔ Completed)</span>
                </div>
            </div>
        </div>
    );
}

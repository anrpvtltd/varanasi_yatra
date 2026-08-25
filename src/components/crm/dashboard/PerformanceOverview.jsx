import React from 'react';

export default function PerformanceOverview({ overview = {} }) {
    const { bookingPerformance = {}, vendorPerformance = {}, expenseBreakdown = {} } = overview;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">

            {/* BOOKING & TRIP HEALTH */}
            <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-3 shadow-xs">
                <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px] border-b pb-2 border-stone-100">
                    🧳 Booking & Trip Volume
                </h4>

                <div className="grid grid-cols-2 gap-2 text-center font-bold">
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-400 block font-semibold">Total Bookings</span>
                        <span className="text-base text-stone-900">{bookingPerformance.totalBookings || 0}</span>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-700 block font-semibold">Active Upcoming</span>
                        <span className="text-base text-amber-900">{bookingPerformance.upcomingTrips || 0}</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block font-semibold">Trips Completed</span>
                        <span className="text-base text-emerald-900">{bookingPerformance.tripsCompleted || 0}</span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        <span className="text-[10px] text-rose-700 block font-semibold">Cancelled</span>
                        <span className="text-base text-rose-900">{bookingPerformance.cancelledTrips || 0}</span>
                    </div>
                </div>
            </div>

            {/* VENDOR PERFORMANCE RELIABILITY */}
            <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-3 shadow-xs">
                <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px] border-b pb-2 border-stone-100">
                    🏨 Vendor Reliability Health
                </h4>

                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-xl border border-emerald-200 font-bold text-emerald-900">
                        <span>Top Tier Partners (≥80/100)</span>
                        <span className="px-2 py-0.5 bg-emerald-200 rounded-full text-[10px] font-extrabold">{(vendorPerformance.topVendors || []).length}</span>
                    </div>

                    <div className="flex justify-between items-center bg-rose-50 p-2 rounded-xl border border-rose-200 font-bold text-rose-900">
                        <span>Low Reliability (&lt;70/100)</span>
                        <span className="px-2 py-0.5 bg-rose-200 rounded-full text-[10px] font-extrabold">{(vendorPerformance.lowReliabilityVendors || []).length}</span>
                    </div>

                    <div className="flex justify-between items-center bg-amber-50 p-2 rounded-xl border border-amber-200 font-bold text-amber-900">
                        <span>New Vendors (No History)</span>
                        <span className="px-2 py-0.5 bg-amber-200 rounded-full text-[10px] font-extrabold">{(vendorPerformance.newVendors || []).length}</span>
                    </div>
                </div>
            </div>

            {/* EXPENSE CATEGORY BREAKDOWN */}
            <div className="bg-white border border-stone-200 p-4 rounded-3xl space-y-3 shadow-xs">
                <h4 className="font-extrabold text-stone-900 uppercase tracking-widest text-[11px] border-b pb-2 border-stone-100">
                    💸 Business Expense Categories
                </h4>

                <div className="space-y-1.5 font-semibold text-[11px]">
                    {Object.entries(expenseBreakdown || {}).map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between items-center text-stone-700">
                            <span className="uppercase text-[10px] font-extrabold text-stone-400">{cat}</span>
                            <span className="font-bold text-stone-900">₹{amt?.toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

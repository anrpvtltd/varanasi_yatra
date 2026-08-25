import React from 'react';

export default function UpcomingTrips({ trips = [], onOpenBooking }) {
    if (!trips || trips.length === 0) {
        return (
            <div className="bg-stone-50 border border-dashed border-stone-200 p-6 rounded-3xl text-center text-stone-400 font-bold text-xs">
                🏝️ No upcoming confirmed trips in the next 30 days.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest">
                    🧳 UPCOMING TRIPS (NEXT 30 DAYS) ({trips.length})
                </h3>
                <span className="text-[10px] text-stone-400 font-semibold">Sorted by Risk & Date</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {trips.map((b) => {
                    const readiness = b.tripReadiness || {};
                    const isAtRisk = readiness.status === 'AT_RISK';
                    const isReady = readiness.status === 'READY';

                    return (
                        <div
                            key={b._id}
                            onClick={() => onOpenBooking && onOpenBooking(b)}
                            className="bg-white border border-stone-200 hover:border-amber-400 p-4 rounded-2xl shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
                        >
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-extrabold text-stone-900">#{b.bookingNumber}</span>
                                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                        isReady ? 'bg-emerald-100 text-emerald-800' : isAtRisk ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {readiness.status || 'INCOMPLETE'}
                                    </span>
                                </div>

                                <h4 className="text-xs font-extrabold text-stone-900 mt-2">{b.customerDetails?.name || 'Guest'}</h4>
                                <p className="text-xs text-stone-500 font-medium">📅 Travel Date: <span className="font-bold text-stone-800">{b.travelDetails?.travelDate || 'Flexible'}</span></p>
                                <p className="text-xs text-stone-500 font-medium">📦 Package: {b.packageDetails?.packageName || 'Custom Package'}</p>
                            </div>

                            <div className="pt-2 border-t border-stone-100 space-y-1">
                                <div className="flex justify-between text-[11px] font-extrabold">
                                    <span className="text-stone-500">Preparation</span>
                                    <span className={isReady ? 'text-emerald-700' : isAtRisk ? 'text-rose-700' : 'text-amber-700'}>{readiness.percentage || 0}%</span>
                                </div>
                                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            isReady ? 'bg-emerald-500' : isAtRisk ? 'bg-rose-500' : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${readiness.percentage || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

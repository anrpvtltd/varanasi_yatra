import React from 'react';

export default function ActiveUpcomingTripsList({ leads }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const activeTripsList = leads.filter(l => {
        if (l.status === 'Trip Started') return true;
        if (l.status === 'Confirmed') {
            if (!l.date) return true;
            return l.date.split('T')[0] >= todayStr;
        }
        return false;
    });

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                    <span className="text-purple-600">🚖</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active / Upcoming Trips</h3>
                </div>
                {activeTripsList.length > 0 ? (
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {activeTripsList.slice(0, 5).map((trip) => (
                            <div key={trip._id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 font-sans">
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-950">{trip.name}</p>
                                    <p className="text-[10px] text-slate-500">
                                        📍 Pickup: {trip.pickup || 'Varanasi'} ➔ Destination: {trip.destination || 'Kashi'}
                                    </p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="font-bold text-slate-700">{trip.date || 'TBD'}</p>
                                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        trip.status === 'Trip Started'
                                            ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                    }`}>
                                        {trip.status === 'Trip Started' ? 'On Road' : 'Confirmed'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        No active or upcoming trips found.
                    </div>
                )}
            </div>
        </div>
    );
}

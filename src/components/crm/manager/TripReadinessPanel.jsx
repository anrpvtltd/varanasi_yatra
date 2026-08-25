import React, { useState, useMemo } from 'react';
import { computeTripReadiness } from '../../../utils/tripReadiness';

const URGENCY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

export default function TripReadinessPanel({ leads, onOpenLead }) {
    const [statusFilter, setStatusFilter] = useState('ALL');

    const tripsWithReadiness = useMemo(() => {
        return leads
            .filter(l => l.status === 'Confirmed' || l.status === 'Trip Started')
            .map(l => ({ ...l, readiness: computeTripReadiness(l) }))
            .filter(l => l.readiness)
            .sort((a, b) => {
                const urgDiff = (URGENCY_RANK[b.readiness.urgency] || 0) - (URGENCY_RANK[a.readiness.urgency] || 0);
                if (urgDiff !== 0) return urgDiff;
                return a.readiness.percent - b.readiness.percent;
            });
    }, [leads]);

    const readyCount = tripsWithReadiness.filter(t => t.readiness.status === 'READY').length;
    const incompleteCount = tripsWithReadiness.filter(t => t.readiness.status === 'INCOMPLETE').length;
    const atRiskCount = tripsWithReadiness.filter(t => t.readiness.status === 'AT RISK').length;
    const totalTrips = tripsWithReadiness.length;

    const filteredTrips = useMemo(() => {
        if (statusFilter === 'ALL') return tripsWithReadiness;
        if (statusFilter === 'READY') return tripsWithReadiness.filter(t => t.readiness.status === 'READY');
        if (statusFilter === 'INCOMPLETE') return tripsWithReadiness.filter(t => t.readiness.status === 'INCOMPLETE');
        if (statusFilter === 'AT RISK') return tripsWithReadiness.filter(t => t.readiness.status === 'AT RISK');
        if (statusFilter === 'CRITICAL') return tripsWithReadiness.filter(t => t.readiness.urgency === 'CRITICAL');
        return tripsWithReadiness;
    }, [tripsWithReadiness, statusFilter]);

    const statusBadges = {
        READY: { text: '✅ READY', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        INCOMPLETE: { text: '⚠️ INCOMPLETE', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
        'AT RISK': { text: '🚨 AT RISK', bg: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' }
    };

    const urgencyBadges = {
        CRITICAL: 'bg-red-600 text-white',
        HIGH: 'bg-orange-500 text-white',
        MEDIUM: 'bg-blue-500 text-white',
        LOW: 'bg-slate-200 text-slate-700'
    };

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                    <span className="text-purple-600">🛡️</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Trip Readiness Operations</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {readyCount} Ready · {incompleteCount} Incomplete · {atRiskCount} At Risk ({totalTrips} Total)
                </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-3 text-[10px] font-bold">
                {['ALL', 'AT RISK', 'INCOMPLETE', 'READY', 'CRITICAL'].map(f => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-2.5 py-1 rounded-lg border uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                            statusFilter === f
                                ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filteredTrips.length > 0 ? (
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
                    {filteredTrips.map(trip => {
                        const sb = statusBadges[trip.readiness.status] || statusBadges.INCOMPLETE;
                        const urgClass = urgencyBadges[trip.readiness.urgency] || urgencyBadges.LOW;

                        return (
                            <div
                                key={trip._id}
                                className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition flex flex-col space-y-2.5"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0">
                                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                            <span className="font-bold text-slate-900 text-sm">{trip.name}</span>
                                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${sb.bg}`}>
                                                {sb.text}
                                            </span>
                                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${urgClass}`}>
                                                {trip.readiness.urgency}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-semibold">
                                            📍 {trip.destination || 'Varanasi'} · 📅 Travel: {trip.date || 'TBD'}
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-3 self-end sm:self-center">
                                        <div className="text-right">
                                            <span className="text-sm font-extrabold text-slate-900">{trip.readiness.percent}%</span>
                                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        trip.readiness.percent === 100 ? 'bg-emerald-500' : trip.readiness.percent >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${trip.readiness.percent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onOpenLead(trip)}
                                            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer shadow-xs"
                                        >
                                            [OPEN TRIP]
                                        </button>
                                    </div>
                                </div>

                                {/* Checklist items */}
                                <div className="flex items-center space-x-2 flex-wrap gap-1.5 pt-1 border-t border-slate-100 text-[10px] font-semibold">
                                    {trip.readiness.checks.map(c => (
                                        <span
                                            key={c.key}
                                            className={`px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                                                c.done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                                            }`}
                                        >
                                            <span>{c.done ? '✓' : '✕'}</span>
                                            <span>{c.label}</span>
                                        </span>
                                    ))}
                                </div>

                                {/* Operational Explanation */}
                                <p className="text-[11px] text-slate-600 font-medium">
                                    💡 <span className="font-bold text-slate-900">Note:</span> {trip.readiness.reason}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    ✅ No confirmed or active trips match the selected filter.
                </div>
            )}
        </div>
    );
}

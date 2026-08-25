import React, { useState, useMemo } from 'react';
import { computeLeadPriority } from '../../../utils/leadPriority';
import { computeNextBestAction } from '../../../utils/nextBestAction';

const URGENCY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

export default function TopPriorityActions({ leads, completedTaskIds, onToggleComplete, onOpenLead }) {
    const [actionFilter, setActionFilter] = useState('ALL');

    const actionableLeads = useMemo(() => {
        return leads
            .filter(l => l.status !== 'Completed' && l.status !== 'Cancelled')
            .map(l => {
                const priority = computeLeadPriority(l);
                const nextAction = computeNextBestAction(l);
                return {
                    ...l,
                    priority,
                    nextAction
                };
            })
            .sort((a, b) => {
                const aStale = a.priority.evidence.includes('test/stale record (deprioritized)');
                const bStale = b.priority.evidence.includes('test/stale record (deprioritized)');
                if (aStale !== bStale) return aStale ? 1 : -1;

                const urgDiff = (URGENCY_RANK[b.priority.urgency] || 0) - (URGENCY_RANK[a.priority.urgency] || 0);
                if (urgDiff !== 0) return urgDiff;
                const scoreDiff = b.priority.score - a.priority.score;
                if (scoreDiff !== 0) return scoreDiff;
                return (a._id || '').localeCompare(b._id || '');
            });
    }, [leads]);

    const filteredLeads = useMemo(() => {
        if (actionFilter === 'ALL') return actionableLeads.slice(0, 8);
        if (actionFilter === 'HOT') return actionableLeads.filter(l => l.priority.tier === 'HOT').slice(0, 8);
        if (actionFilter === 'WARM') return actionableLeads.filter(l => l.priority.tier === 'WARM').slice(0, 8);
        if (actionFilter === 'COLD') return actionableLeads.filter(l => l.priority.tier === 'COLD').slice(0, 8);
        if (actionFilter === 'CRITICAL') return actionableLeads.filter(l => l.priority.urgency === 'CRITICAL').slice(0, 8);
        if (actionFilter === 'FOLLOW-UP') return actionableLeads.filter(l => l.nextAction.action === 'FOLLOW_UP').slice(0, 8);
        if (actionFilter === 'TRIP PREPARATION') return actionableLeads.filter(l => l.nextAction.action.includes('ASSIGN') || l.nextAction.action.includes('TRIP') || l.nextAction.action.includes('HOTEL')).slice(0, 8);
        if (actionFilter === 'CUSTOMER ISSUE') return actionableLeads.filter(l => l.priority.evidence.includes('detected issue') || l.priority.evidence.includes('operational gaps')).slice(0, 8);
        return actionableLeads.slice(0, 8);
    }, [actionableLeads, actionFilter]);

    const tierColors = {
        HOT: { bg: 'bg-rose-50 border-rose-200 text-rose-700' },
        WARM: { bg: 'bg-amber-50 border-amber-200 text-amber-700' },
        COLD: { bg: 'bg-slate-50 border-slate-200 text-slate-500' }
    };

    const urgencyColors = {
        CRITICAL: 'bg-red-600 text-white font-extrabold animate-pulse',
        HIGH: 'bg-orange-500 text-white font-extrabold',
        MEDIUM: 'bg-blue-500 text-white font-bold',
        LOW: 'bg-slate-300 text-slate-700 font-semibold'
    };

    const confidenceColors = {
        HIGH: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
        LOW: 'text-slate-500 bg-slate-50 border-slate-200'
    };

    const filters = ['ALL', 'HOT', 'WARM', 'COLD', 'CRITICAL', 'FOLLOW-UP', 'TRIP PREPARATION', 'CUSTOMER ISSUE'];

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                    <span className="text-amber-500">⚡</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top Priority Actions & Intelligence</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Showing {filteredLeads.length} of {actionableLeads.length} Action Items
                </span>
            </div>

            {/* Intelligence Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-3 text-[10px] font-bold">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setActionFilter(f)}
                        className={`px-2.5 py-1 rounded-lg border uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                            actionFilter === f
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {filteredLeads.length > 0 ? filteredLeads.map((lead, idx) => {
                    const tc = tierColors[lead.priority.tier] || tierColors.COLD;
                    const isComplete = completedTaskIds.has(lead._id);
                    const urgClass = urgencyColors[lead.priority.urgency] || urgencyColors.LOW;
                    const confClass = confidenceColors[lead.priority.confidence] || confidenceColors.LOW;

                    return (
                        <div
                            key={lead._id}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 gap-3.5 ${
                                isComplete
                                    ? 'bg-emerald-50/30 border-emerald-100 opacity-60'
                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                            }`}
                        >
                            {/* Left details section */}
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                                <div className="flex flex-col items-center space-y-1 pt-1 select-none">
                                    <span className="text-[10px] font-extrabold text-slate-300">#{idx + 1}</span>
                                    <button
                                        onClick={() => onToggleComplete(lead._id)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${
                                            isComplete
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-slate-300 hover:border-amber-500'
                                        }`}
                                    >
                                        {isComplete && <span className="text-[10px] font-bold">✓</span>}
                                    </button>
                                </div>

                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                        <span className={`font-bold text-slate-900 text-sm ${isComplete ? 'line-through text-slate-400' : ''}`}>
                                            {lead.name}
                                        </span>

                                        {/* Priority Tier Badge */}
                                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${tc.bg}`}>
                                            {lead.priority.tier} ({lead.priority.score})
                                        </span>

                                        {/* Urgency Badge */}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider ${urgClass}`}>
                                            {lead.priority.urgency}
                                        </span>

                                        {/* Confidence Badge */}
                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${confClass}`}>
                                            Conf: {lead.priority.confidence}
                                        </span>

                                        {/* Status Badge */}
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50 uppercase tracking-wider">
                                            {lead.status}
                                        </span>
                                    </div>

                                    {/* Action Reason */}
                                    <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                                        💡 <span className="font-bold text-slate-900">Reason:</span> {lead.nextAction.reason}
                                    </p>

                                    {/* Evidence Pills */}
                                    {lead.priority.evidence && lead.priority.evidence.length > 0 && (
                                        <div className="flex items-center space-x-1 flex-wrap gap-y-1 pt-0.5">
                                            <span className="text-[9px] font-bold text-slate-400">Signals:</span>
                                            {lead.priority.evidence.map((ev, i) => (
                                                <span key={i} className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-mono">
                                                    {ev}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {lead.date && (
                                        <p className="text-[10px] text-slate-400 font-semibold">
                                            📅 {lead.date} · 📍 {lead.destination || 'Varanasi'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right action controls */}
                            <div className="flex items-center space-x-2 self-end sm:self-center">
                                {lead.nextAction.action === 'CALL' && lead.mobile && (
                                    <a
                                        href={`tel:${lead.mobile}`}
                                        className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
                                        title={`Call ${lead.name}`}
                                    >
                                        <span>📞</span>
                                    </a>
                                )}
                                <button
                                    onClick={() => onOpenLead(lead)}
                                    className={`px-3 py-2.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer shadow-xs ${
                                        lead.nextAction.action === 'CALL' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                                        lead.nextAction.action === 'FOLLOW_UP' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                        'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                                >
                                    [{lead.nextAction.label.toUpperCase()}]
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        ✅ No priority actions match the selected filter.
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { detectIssues } from '../../../utils/leadIssues';

const SEVERITY_RANK = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

export default function CustomerIssueAlerts({ leads, onOpenLead }) {
    const [severityFilter, setSeverityFilter] = useState('ALL');

    const globalIssues = useMemo(() => {
        const items = [];
        leads
            .filter(l => l.status !== 'Completed' && l.status !== 'Cancelled')
            .forEach(l => {
                const result = detectIssues(l);
                if (result.hasIssue && result.issues && result.issues.length > 0) {
                    result.issues.forEach(iss => {
                        items.push({
                            ...iss,
                            lead: l
                        });
                    });
                }
            });

        return items.sort((a, b) => {
            const sevDiff = (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
            if (sevDiff !== 0) return sevDiff;
            const aDate = a.lead.date ? new Date(a.lead.date).getTime() : 9999999999999;
            const bDate = b.lead.date ? new Date(b.lead.date).getTime() : 9999999999999;
            if (aDate !== bDate) return aDate - bDate;
            return (a.lead._id || '').localeCompare(b.lead._id || '');
        });
    }, [leads]);

    const filteredIssues = useMemo(() => {
        if (severityFilter === 'ALL') return globalIssues;
        return globalIssues.filter(i => i.severity === severityFilter);
    }, [globalIssues, severityFilter]);

    if (globalIssues.length === 0) return null;

    const severityBadges = {
        CRITICAL: 'bg-red-600 text-white font-extrabold animate-pulse',
        HIGH: 'bg-orange-500 text-white font-extrabold',
        MEDIUM: 'bg-amber-500 text-white font-bold',
        LOW: 'bg-slate-300 text-slate-700 font-semibold'
    };

    return (
        <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-xs flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-rose-100 pb-3 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                    <span className="text-rose-600">🚨</span>
                    <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Customer & Operational Issue Alerts</h3>
                </div>
                <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    {globalIssues.length} Operational Issue{globalIssues.length > 1 ? 's' : ''} Detected
                </span>
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 mb-3 text-[10px] font-bold">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
                    <button
                        key={f}
                        onClick={() => setSeverityFilter(f)}
                        className={`px-2.5 py-1 rounded-lg border uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                            severityFilter === f
                                ? 'bg-rose-900 text-white border-rose-900 shadow-xs'
                                : 'bg-rose-50/50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1 overflow-y-auto max-h-[440px] pr-1">
                {filteredIssues.length > 0 ? (
                    filteredIssues.map((issue, idx) => {
                        const sevClass = severityBadges[issue.severity] || severityBadges.LOW;

                        return (
                            <div
                                key={`${issue.lead._id}-${issue.type}-${idx}`}
                                className="bg-rose-50/30 border border-rose-100/90 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-rose-300 transition"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider ${sevClass}`}>
                                            {issue.severity}
                                        </span>
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                            {issue.lead.status}
                                        </span>
                                    </div>

                                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{issue.title}</h4>
                                    <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                                        ⚠️ {issue.reason}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-semibold">
                                        👤 {issue.lead.name} · 📍 {issue.lead.destination || 'Varanasi'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => onOpenLead(issue.lead)}
                                    className="w-full bg-white hover:bg-rose-600 hover:text-white border border-rose-200 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider py-2 rounded-lg transition cursor-pointer shadow-xs"
                                >
                                    [{issue.nextAction ? issue.nextAction.label.toUpperCase() : 'RESOLVE ISSUE'}]
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-8 text-center text-slate-400 text-xs font-medium">
                        ✅ No customer issues match the selected severity filter.
                    </div>
                )}
            </div>
        </div>
    );
}

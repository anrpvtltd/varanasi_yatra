import React from 'react';
import { computeTripReadiness } from '../../../utils/tripReadiness';
import { detectIssues } from '../../../utils/leadIssues';
import { checkRequirementsReadiness } from '../../../utils/requirementsEngine';

export default function TodaysMission({ leads, completedTaskIds, onCategoryClick, activeCategory }) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const followUps = leads.filter(l =>
        (l.status === 'In-Progress' || l.status === 'Pending') &&
        l.followUpDate && l.followUpDate <= todayStr
    ).length;

    const leadsToCall = leads.filter(l =>
        l.status === 'Pending' &&
        (!l.statusHistory || l.statusHistory.length <= 1)
    ).length;

    const readyForQuote = leads.filter(l =>
        checkRequirementsReadiness(l).isQuoteReady && l.status !== 'Completed' && l.status !== 'Cancelled'
    ).length;

    const tripsToPrep = leads.filter(l => {
        const r = computeTripReadiness(l);
        return l.status === 'Confirmed' && r && (r.status === 'INCOMPLETE' || r.status === 'AT RISK');
    }).length;

    const customerIssues = leads.filter(l => {
        const res = detectIssues(l);
        return res.hasIssue && res.issues.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH' || i.severity === 'MEDIUM');
    }).length;

    const totalTasks = followUps + leadsToCall + readyForQuote + tripsToPrep + customerIssues;
    const completedCount = completedTaskIds?.size || 0;
    const progressPercent = totalTasks > 0 ? Math.min(Math.round((completedCount / totalTasks) * 100), 100) : 100;

    // Progress bar visualization: e.g. ████████░░░░
    const barLength = 12;
    const filledLength = totalTasks > 0 ? Math.round((completedCount / totalTasks) * barLength) : barLength;
    const progressBarStr = '█'.repeat(filledLength) + '░'.repeat(Math.max(0, barLength - filledLength));

    const categories = [
        { 
            label: 'FOLLOW-UPS', 
            count: followUps, 
            icon: '🔄', 
            desc: 'Due today or overdue',
            color: 'text-blue-600 border-blue-200/60 bg-blue-50/50 hover:bg-blue-50',
            activeStyle: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50',
            key: 'followups' 
        },
        { 
            label: 'LEADS TO CALL', 
            count: leadsToCall, 
            icon: '📞', 
            desc: 'Pending first-contact leads',
            color: 'text-amber-600 border-amber-200/60 bg-amber-50/50 hover:bg-amber-50',
            activeStyle: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50',
            key: 'calls' 
        },
        { 
            label: 'READY FOR QUOTE', 
            count: readyForQuote, 
            icon: '📝', 
            desc: 'Requirements ready to quote',
            color: 'text-emerald-600 border-emerald-200/60 bg-emerald-50/50 hover:bg-emerald-50',
            activeStyle: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50',
            key: 'ready_quote' 
        },
        { 
            label: 'TRIPS TO PREPARE', 
            count: tripsToPrep, 
            icon: '🚖', 
            desc: 'Confirmed trips need attention',
            color: 'text-purple-600 border-purple-200/60 bg-purple-50/50 hover:bg-purple-50',
            activeStyle: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50',
            key: 'trips' 
        },
        { 
            label: 'CUSTOMER ATTENTION', 
            count: customerIssues, 
            icon: '⚠️', 
            desc: 'Operational issues detected',
            color: 'text-rose-600 border-rose-200/60 bg-rose-50/50 hover:bg-rose-50',
            activeStyle: 'ring-2 ring-rose-500 border-rose-500 bg-rose-50',
            key: 'issues' 
        }
    ];

    return (
        <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl shadow-sm mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-5 mb-5">
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">🎯</span>
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wider">TODAY&apos;S MISSION</h2>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">Focus on the actions that matter most today.</p>
                </div>

                {/* Progress bar text layout */}
                <div className="flex flex-col space-y-1 select-none font-mono">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Today&apos;s Progress</p>
                    <div className="flex items-center space-x-2.5">
                        <span className="text-sm font-bold text-amber-600">{progressBarStr}</span>
                        <span className="text-xs font-bold text-slate-900">
                            {completedCount} / {totalTasks} completed ({progressPercent}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* Mission Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {categories.map(cat => {
                    const isActive = activeCategory === cat.key;
                    return (
                        <button
                            key={cat.key}
                            onClick={() => onCategoryClick(cat.key)}
                            className={`border rounded-xl p-4 text-left transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                                isActive ? cat.activeStyle : cat.color
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xl">{cat.icon}</span>
                                <span className="text-2xl font-extrabold tracking-tight">{cat.count}</span>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-extrabold tracking-wider uppercase">{cat.label}</p>
                                <p className="text-[10px] text-slate-400 font-semibold leading-snug">{cat.desc}</p>
                            </div>
                            <div className="pt-1 flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                <span className="underline group-hover:text-slate-900">[VIEW]</span>
                                {isActive && <span className="text-emerald-500">Active ✓</span>}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

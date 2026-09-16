import React, { useState } from 'react';

export default function AIActivityLog({
    auditLogs = [],
    runs = [],
    isLoading = false,
    onRefresh
}) {
    const [viewMode, setViewMode] = useState('AUDIT'); // 'AUDIT' or 'RUNS'
    const [decisionFilter, setDecisionFilter] = useState('ALL');
    const [selectedEntry, setSelectedEntry] = useState(null);

    const filteredLogs = auditLogs.filter(log => {
        if (decisionFilter === 'ALL') return true;
        return log.decision === decisionFilter;
    });

    const getDecisionBadge = (decision) => {
        switch (decision) {
            case 'ALLOWED':
                return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
            case 'BLOCKED':
                return 'bg-rose-950 text-rose-400 border border-rose-800';
            case 'APPROVAL_REQUIRED':
                return 'bg-amber-950 text-amber-400 border border-amber-800';
            case 'FAILED':
                return 'bg-slate-800 text-slate-300 border border-slate-700';
            default:
                return 'bg-slate-900 text-slate-400 border border-slate-800';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-4">
            {/* Header and Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode('AUDIT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            viewMode === 'AUDIT'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        Immutable Audit Logs ({auditLogs.length})
                    </button>
                    <button
                        onClick={() => setViewMode('RUNS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            viewMode === 'RUNS'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                    >
                        AI Run History ({runs.length})
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    {viewMode === 'AUDIT' && (
                        <select
                            value={decisionFilter}
                            onChange={(e) => setDecisionFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        >
                            <option value="ALL">All Decisions</option>
                            <option value="ALLOWED">ALLOWED Only</option>
                            <option value="BLOCKED">BLOCKED Only</option>
                            <option value="APPROVAL_REQUIRED">APPROVAL REQUIRED</option>
                        </select>
                    )}

                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors flex items-center space-x-1"
                    >
                        <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {viewMode === 'AUDIT' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Actor</th>
                                    <th className="py-3 px-4">Module</th>
                                    <th className="py-3 px-4">Action / Tool</th>
                                    <th className="py-3 px-4">Decision</th>
                                    <th className="py-3 px-4">Reason</th>
                                    <th className="py-3 px-4 text-right">Inspect</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-slate-500 font-sans">
                                            No audit entries found matching current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log, idx) => (
                                        <tr key={log._id || idx} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                                <span className="font-semibold text-slate-200">{log.actorRole}</span>
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                                                {log.module}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                                <span className="text-amber-400">{log.tool || log.action}</span>
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDecisionBadge(log.decision)}`}>
                                                    {log.decision}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate font-sans text-xs" title={log.reason}>
                                                {log.reason}
                                            </td>
                                            <td className="py-2.5 px-4 text-right whitespace-nowrap font-sans">
                                                <button
                                                    onClick={() => setSelectedEntry({ type: 'AUDIT', data: log })}
                                                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Run ID</th>
                                    <th className="py-3 px-4">Module</th>
                                    <th className="py-3 px-4">Task</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Tools Called</th>
                                    <th className="py-3 px-4">Tokens</th>
                                    <th className="py-3 px-4">Latency</th>
                                    <th className="py-3 px-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                                {runs.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-slate-500 font-sans">
                                            No AI runs recorded yet. Initiate a test analysis run above.
                                        </td>
                                    </tr>
                                ) : (
                                    runs.map((r, idx) => (
                                        <tr key={r._id || idx} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="py-2.5 px-4 font-bold text-slate-200 whitespace-nowrap">
                                                {r.runId}
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                                                {r.module}
                                            </td>
                                            <td className="py-2.5 px-4 text-amber-400 whitespace-nowrap">
                                                {r.taskType}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    r.status === 'COMPLETED'
                                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                                        : (r.status === 'BLOCKED' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400')
                                                }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                                                {r.toolCallCount || r.toolCalls?.length || 0}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap font-sans">
                                                {r.tokenUsage?.totalTokens || 0}
                                            </td>
                                            <td className="py-2.5 px-4 whitespace-nowrap font-sans text-slate-400">
                                                {r.latencyMs ? `${r.latencyMs}ms` : '—'}
                                            </td>
                                            <td className="py-2.5 px-4 text-right whitespace-nowrap font-sans">
                                                <button
                                                    onClick={() => setSelectedEntry({ type: 'RUN', data: r })}
                                                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                                                >
                                                    Inspect
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Inspector Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-white text-base">
                                {selectedEntry.type === 'AUDIT' ? 'Audit Log Entry Detail' : 'AI Run Trace & Telemetry'}
                            </h3>
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <pre className="bg-slate-950 p-4 rounded-lg text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                                {JSON.stringify(selectedEntry.data, null, 2)}
                            </pre>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

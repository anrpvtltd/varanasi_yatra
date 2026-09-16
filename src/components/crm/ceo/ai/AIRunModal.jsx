import React, { useState } from 'react';

export default function AIRunModal({
    isOpen,
    onClose,
    onExecuteRun,
    isSafeMode = true,
    isMasterOn = false,
    isEmergency = false
}) {
    const [module, setModule] = useState('SALES_ASSISTANT');
    const [taskType, setTaskType] = useState('lead_summary');
    const [query, setQuery] = useState('');
    const [leadId, setLeadId] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        if (!isMasterOn) {
            setError('Master AI is disabled. Enable it in the status panel first.');
            return;
        }
        if (isEmergency) {
            setError('Emergency Stop is active. Execution blocked.');
            return;
        }

        try {
            setIsRunning(true);
            const res = await onExecuteRun({
                module,
                taskType,
                query: query || undefined,
                leadId: leadId || undefined,
                prompt: query || undefined
            });
            setResult(res);
        } catch (err) {
            setError(err.message || 'Failed to execute AI run');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                        <h3 className="text-white font-semibold text-base flex items-center space-x-2">
                            <span>Execute Controlled AI Run</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                                CEO Sandbox
                            </span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Deterministic analysis runtime. Guardrails, safe mode, and audit logging actively enforced.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-lg font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Safe Mode Advisory */}
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    isSafeMode
                        ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}>
                    <div className="flex items-center space-x-2">
                        <span>{isSafeMode ? '🔒' : '⚠️'}</span>
                        <span>
                            {isSafeMode
                                ? 'Safe Mode Active: High-risk actions & write operations will be blocked.'
                                : 'Safe Mode Disabled: Caution advised.'}
                        </span>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs">
                        <strong>Execution Error:</strong> {error}
                    </div>
                )}

                {/* Execution Form */}
                {!result ? (
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-slate-400 font-medium mb-1">Module</label>
                                <select
                                    value={module}
                                    onChange={(e) => setModule(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                                >
                                    <option value="SALES_ASSISTANT">Sales Assistant</option>
                                    <option value="CUSTOMER_ASSISTANT">Customer Assistant</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-400 font-medium mb-1">Task Type</label>
                                <select
                                    value={taskType}
                                    onChange={(e) => setTaskType(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                                >
                                    <option value="lead_summary">Lead Summary &amp; Analysis</option>
                                    <option value="itinerary_suggestion">Itinerary Recommendation</option>
                                    <option value="crm_health_check">CRM Diagnostics Check</option>
                                    <option value="general_analysis">General Operational Analysis</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 font-medium mb-1">
                                Lead ID (Optional context)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 64b8f... or leave blank"
                                value={leadId}
                                onChange={(e) => setLeadId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-600 font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 font-medium mb-1">
                                Analysis Query / Prompt
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Enter specific analysis instructions for the AI runtime..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-600"
                            />
                        </div>

                        <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isRunning || !isMasterOn || isEmergency}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow"
                            >
                                {isRunning ? 'Running Analysis...' : '▶ Execute Run'}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Structured Result Inspector */
                    <div className="space-y-4 text-xs">
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                                    <span>✓</span>
                                    <span>Run Completed Successfully</span>
                                </span>
                                <span className="text-slate-500 font-mono text-[11px]">
                                    Run ID: {result.runId || result.run?.runId}
                                </span>
                            </div>

                            <div>
                                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                                    Executive Summary
                                </div>
                                <div className="text-slate-200 mt-1 text-xs leading-relaxed">
                                    {result.summary || result.result?.summary || 'Analysis completed.'}
                                </div>
                            </div>

                            {(() => {
                                const recommendations = result.recommendations || result.result?.recommendations || [];
                                const toolCalls = result.toolCalls || result.run?.toolCalls || [];
                                const blockedActions = result.blockedActions || result.result?.blockedActions || [];

                                return (
                                    <>
                                        {/* Recommendations */}
                                        {recommendations.length > 0 && (
                                            <div>
                                                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">
                                                    Recommendations
                                                </div>
                                                <ul className="list-disc list-inside text-slate-300 space-y-1">
                                                    {recommendations.map((rec, i) => (
                                                        <li key={i}>{rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Tool Calls Log */}
                                        {toolCalls.length > 0 && (
                                            <div>
                                                <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">
                                                    Executed Tools ({toolCalls.length})
                                                </div>
                                                <div className="space-y-1">
                                                    {toolCalls.map((tc, i) => (
                                                        <div key={i} className="bg-slate-900 px-2.5 py-1 rounded text-[11px] font-mono flex items-center justify-between text-slate-400">
                                                            <span>{tc.toolName || tc.tool}</span>
                                                            <span className="text-emerald-400 text-[10px]">{tc.status || 'OK'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Blocked Actions */}
                                        {blockedActions.length > 0 && (
                                            <div className="p-2 bg-amber-950/40 border border-amber-800 rounded">
                                                <div className="text-amber-300 font-semibold text-[10px] uppercase">
                                                    Blocked Actions (Safe Mode Policy)
                                                </div>
                                                <ul className="text-amber-200/80 text-[11px] list-disc list-inside mt-1">
                                                    {blockedActions.map((ba, i) => (
                                                        <li key={i}>{ba}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => setResult(null)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
                            >
                                Run Another
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

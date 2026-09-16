import React from 'react';

export default function AIStatusPanel({
    config,
    health,
    runsCount = 0,
    assistantMetrics = null,
    salesMetrics = null,
    onToggleMaster,
    onToggleSafeMode,
    onToggleEmergencyStop,
    isUpdating = false
}) {
    const isEmergency = config?.emergencyStop || false;
    const isMasterOn = config?.masterEnabled && !isEmergency;
    const isSafeMode = config?.safeMode ?? true;

    return (
        <div className="space-y-4">
            {/* 🚨 Critical Emergency Stop Alert Banner */}
            {isEmergency && (
                <div className="bg-red-950/80 border-2 border-red-600 rounded-xl p-4 shadow-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-600 rounded-lg text-white font-bold text-xl">
                            ⚠️
                        </div>
                        <div>
                            <h3 className="text-red-200 font-bold text-base tracking-wide uppercase">
                                AI Emergency Stop Active
                            </h3>
                            <p className="text-red-300/80 text-xs">
                                All AI execution, tool calls, and run endpoints are immediately blocked. Audit records are preserved.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onToggleEmergencyStop(false)}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg transition-colors shadow"
                    >
                        Clear Emergency Stop
                    </button>
                </div>
            )}

            {/* Core Status Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Master Switch */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Master AI Switch</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isMasterOn ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                            {isMasterOn ? '● ENABLED' : '○ DISABLED'}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-bold text-white">
                            {isMasterOn ? 'Operational' : 'Halted'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {isMasterOn ? 'Permitted modules execute with role checks.' : 'All incoming AI operations blocked.'}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                        <button
                            onClick={() => onToggleMaster(!config?.masterEnabled)}
                            disabled={isUpdating || isEmergency}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                config?.masterEnabled
                                    ? 'bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                                    : 'bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                            }`}
                        >
                            {config?.masterEnabled ? 'Turn Off Master AI' : 'Enable Master AI'}
                        </button>
                    </div>
                </div>

                {/* 2. Safe Mode */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Safe Mode Policy</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isSafeMode ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                            {isSafeMode ? '🔒 SAFE MODE ON' : '⚠️ SAFE MODE OFF'}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-bold text-white">
                            {isSafeMode ? 'Read-Only Guardrails' : 'Write Actions Allowed'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {isSafeMode ? 'Lead writes, messages, and financials strictly blocked.' : 'Careful: Mutation tools permitted for authorized roles.'}
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                        <button
                            onClick={() => onToggleSafeMode(!isSafeMode)}
                            disabled={isUpdating || isEmergency}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSafeMode
                                    ? 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                        >
                            {isSafeMode ? 'Disable Safe Mode' : 'Enforce Safe Mode'}
                        </button>
                    </div>
                </div>

                {/* 3. Emergency Kill Switch */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kill Switch</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isEmergency ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
                        }`}>
                            {isEmergency ? 'ACTIVE' : 'READY'}
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-bold text-white">
                            {isEmergency ? 'Emergency Halted' : 'Normal Operations'}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Instant zero-latency cutoff of all active and queued operations.
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                        <button
                            onClick={() => onToggleEmergencyStop(!isEmergency)}
                            disabled={isUpdating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                isEmergency
                                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                    : 'bg-red-700 hover:bg-red-600 text-white hover:shadow-red-900/50'
                            }`}
                        >
                            {isEmergency ? 'Reset Kill Switch' : 'EMERGENCY STOP'}
                        </button>
                    </div>
                </div>

                {/* 4. Gateway Health & Usage */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gateway & Runtime</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                            v1.0.0
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-black text-white">{runsCount}</span>
                            <span className="text-xs text-slate-400">/ {config?.dailyRunLimit || 200} daily limit</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Provider: <span className="text-slate-300 font-medium">{config?.provider || 'mock'}</span> ({config?.model || 'deterministic'})
                        </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <span>Concurrent: max {config?.maxConcurrentRuns || 5}</span>
                        <span className={`font-medium ${health?.status === 'OK' || !health ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {health?.status === 'OK' || !health ? 'Gateway Online' : 'Gateway Degraded'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 🤖 Customer Travel Assistant Status Card (Prompt 6) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">🛕</span>
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Customer Travel Assistant</h4>
                            <p className="text-xs text-slate-400">Public-facing conversational trip qualifier & lead intake</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            config?.modules?.customerAssistant?.enabled && isMasterOn
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                            {config?.modules?.customerAssistant?.enabled && isMasterOn ? '● ACTIVE' : '○ INACTIVE'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-center">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Sessions Today</span>
                        <span className="text-xl font-black text-white">{assistantMetrics?.sessionsToday || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Completed</span>
                        <span className="text-xl font-black text-emerald-400">{assistantMetrics?.completedRequirements || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Lead Conversions</span>
                        <span className="text-xl font-black text-amber-400">{assistantMetrics?.leadsCreated || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Human Handoffs</span>
                        <span className="text-xl font-black text-sky-400">{assistantMetrics?.handoffs || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Conversion Rate</span>
                        <span className="text-xl font-black text-purple-400">{assistantMetrics?.conversionRate || '0.0%'}</span>
                    </div>
                </div>
            </div>

            {/* 🤖 AI Sales Assistant Status Card (Prompt 7) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">💼</span>
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Sales Assistant (Co-Pilot)</h4>
                            <p className="text-xs text-slate-400">Internal qualification, follow-ups, objections & quote prep</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            config?.modules?.salesAssistant?.enabled && isMasterOn
                                ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                            {config?.modules?.salesAssistant?.enabled && isMasterOn ? '● ACTIVE' : '○ INACTIVE'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4 text-center">
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Analyzed</span>
                        <span className="text-xl font-black text-white">{salesMetrics?.leadsAnalyzed || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Next Actions</span>
                        <span className="text-xl font-black text-indigo-400">{salesMetrics?.recommendationsCount || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Follow-Up Drafts</span>
                        <span className="text-xl font-black text-emerald-400">{salesMetrics?.followUpsDrafted || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Objections</span>
                        <span className="text-xl font-black text-amber-400">{salesMetrics?.objectionsAnalyzed || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Quote Inputs</span>
                        <span className="text-xl font-black text-purple-400">{salesMetrics?.quotePreparationsCount || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400 block uppercase font-medium">Approvals</span>
                        <span className="text-xl font-black text-sky-400">{salesMetrics?.humanApprovals || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

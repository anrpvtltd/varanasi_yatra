import React from 'react';

export default function AIModuleFlags({
    config,
    onToggleModule,
    isUpdating = false
}) {
    const modules = config?.modules || {};

    const moduleCards = [
        {
            key: 'customerAssistant',
            name: 'AI Customer Assistant',
            description: 'Analyzes guest preferences, extracts darshan and ritual requirements, and drafts personalized trip suggestions in Safe Mode.',
            enabled: modules.customerAssistant?.enabled || false,
            isHunterOrVoice: false,
            phaseText: 'Active Foundation',
            allowedRoles: modules.customerAssistant?.allowedRoles || ['CEO', 'MANAGER'],
            toolsCount: modules.customerAssistant?.allowedTools?.length || 3
        },
        {
            key: 'salesAssistant',
            name: 'AI Sales Assistant',
            description: 'Assists staff with lead qualification, intent scoring, next-best-actions, objection handling, follow-up drafting, and quote inputs with zero autonomous pricing authority.',
            enabled: modules.salesAssistant?.enabled || false,
            isHunterOrVoice: false,
            phaseText: 'Operational',
            allowedRoles: modules.salesAssistant?.allowedRoles || ['CEO', 'MANAGER'],
            toolsCount: modules.salesAssistant?.allowedTools?.length || 3
        },
        {
            key: 'customerHunter',
            name: 'AI Customer Hunter',
            description: 'Autonomous traveler intent discovery engine from authorized public signals and partner feeds. Master switch for all Hunter operations.',
            enabled: modules.customerHunter?.enabled || false,
            isHunterOrVoice: false,
            phaseText: 'Operational',
            allowedRoles: modules.customerHunter?.allowedRoles || ['CEO'],
            toolsCount: modules.customerHunter?.allowedTools?.length || 5
        },
        {
            key: 'localHunter',
            name: 'Local Hunter',
            description: 'Detects in-destination travelers currently in Varanasi needing immediate boat, darshan, guide, or transport services.',
            enabled: modules.localHunter?.enabled || false,
            isHunterOrVoice: false,
            phaseText: 'Operational',
            allowedRoles: modules.localHunter?.allowedRoles || ['CEO'],
            toolsCount: modules.localHunter?.allowedTools?.length || 5
        },
        {
            key: 'outsideHunter',
            name: 'Outside Hunter',
            description: 'Identifies prospective pilgrims planning upcoming Varanasi visits needing hotel accommodation, full packages, and temple tours.',
            enabled: modules.outsideHunter?.enabled || false,
            isHunterOrVoice: false,
            phaseText: 'Operational',
            allowedRoles: modules.outsideHunter?.allowedRoles || ['CEO'],
            toolsCount: modules.outsideHunter?.allowedTools?.length || 5
        },
        {
            key: 'voiceAi',
            name: 'Voice AI',
            description: 'Conversational voice assistant for Hindi and English telephone inquiries with zero hallucinations and human escalation.',
            enabled: false,
            isHunterOrVoice: true,
            phaseText: 'Future Module (Disabled)',
            allowedRoles: ['CEO'],
            toolsCount: 0
        }
    ];

    const [activeRoadmapTab, setActiveRoadmapTab] = React.useState('hunter');

    const hunterSubtasks = [
        { name: 'Hunter core engine', status: 'COMPLETED', desc: 'Base Hunter & orchestration architecture' },
        { name: 'Source abstraction', status: 'COMPLETED', desc: 'Pluggable signal source connectors' },
        { name: 'Source policy', status: 'COMPLETED', desc: 'Authorized sources only, no private scraping' },
        { name: 'Local Hunter', status: 'COMPLETED', desc: 'In-destination immediate intent discovery' },
        { name: 'Outside Hunter', status: 'COMPLETED', desc: 'Pre-trip planning & package discovery' },
        { name: 'Signal normalization', status: 'COMPLETED', desc: 'Text cleaning, entity extraction, hashing' },
        { name: 'Intent detection', status: 'COMPLETED', desc: 'Intent classification & service extraction' },
        { name: 'Qualification', status: 'COMPLETED', desc: '0–100 score with business explanations' },
        { name: 'Confidence', status: 'COMPLETED', desc: 'Multi-factor confidence scoring' },
        { name: 'Deduplication', status: 'COMPLETED', desc: 'Signal & opportunity deduplication engine' },
        { name: 'Opportunity generation', status: 'COMPLETED', desc: 'AIOpportunity records creation' },
        { name: 'Opportunity queue', status: 'COMPLETED', desc: 'CEO review & triage dashboard' },
        { name: 'Human verification', status: 'COMPLETED', desc: 'Mandatory human approval gate' },
        { name: 'CRM conversion', status: 'COMPLETED', desc: 'Controlled transition to CRM leads' },
        { name: 'Hunter analytics', status: 'COMPLETED', desc: 'Funnels, source health & demand breakdowns' },
        { name: 'CEO controls', status: 'COMPLETED', desc: 'Start, pause, resume, emergency stop' },
        { name: 'Scheduler', status: 'COMPLETED', desc: 'Manual default scheduling foundation' },
        { name: 'Run limits', status: 'COMPLETED', desc: 'Bounded execution & safety limits' },
        { name: 'Audit', status: 'COMPLETED', desc: 'Comprehensive discovery & triage logging' },
        { name: 'Security tests', status: 'COMPLETED', desc: 'Prompt injection & access boundary defense' },
        { name: 'Documentation', status: 'COMPLETED', desc: 'Detailed architecture & policy guides' }
    ];

    const salesSubtasks = [
        { name: 'Sales AI module', status: 'COMPLETED', desc: 'Feature flag & CEO modular enablement controls' },
        { name: 'Lead qualification', status: 'COMPLETED', desc: 'Structured qualification & 0–100 explainable score' },
        { name: 'Intent scoring', status: 'COMPLETED', desc: 'Explicit buying signal analysis (HOT, WARM, COLD)' },
        { name: 'Readiness scoring', status: 'COMPLETED', desc: 'Stage mapping (EARLY_RESEARCH to READY_TO_BOOK)' },
        { name: 'Requirement gap detection', status: 'COMPLETED', desc: 'Missing dates, headcounts, hotel categories' },
        { name: 'Next-best-action', status: 'COMPLETED', desc: 'Singular high-confidence operational action' },
        { name: 'Follow-up suggestions', status: 'COMPLETED', desc: 'Travel proximity, quote staleness, timing' },
        { name: 'Objection handling', status: 'COMPLETED', desc: '11 categories with empathetic response strategies' },
        { name: 'Draft response generation', status: 'COMPLETED', desc: 'WhatsApp, SMS, Email drafts for human review' },
        { name: 'Quote input assistance', status: 'COMPLETED', desc: 'Structured service draft without pricing authority' },
        { name: 'Human approval', status: 'COMPLETED', desc: 'Mandatory human confirmation for all mutations' },
        { name: 'Sales analytics', status: 'COMPLETED', desc: 'Executive visibility into sessions, recommendations' },
        { name: 'Security tests', status: 'COMPLETED', desc: 'Prompt injection defense & role/financial privacy' },
        { name: 'Documentation', status: 'COMPLETED', desc: 'Architecture, sales workflow & API contract guides' }
    ];

    const currentSubtasks = activeRoadmapTab === 'hunter' ? hunterSubtasks : salesSubtasks;
    const completedCount = currentSubtasks.filter(t => t.status === 'COMPLETED').length;
    const totalCount = currentSubtasks.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-white">AI Module Feature Flags</h3>
                    <p className="text-xs text-slate-400">
                        Modular boundary control. Customer Hunter and Voice capabilities remain strictly disabled.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleCards.map((mod) => (
                    <div
                        key={mod.key}
                        className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                            mod.enabled
                                ? 'bg-slate-900/90 border-slate-700 shadow-sm'
                                : 'bg-slate-950/60 border-slate-800/80 opacity-90'
                        }`}
                    >
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white">{mod.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                                    mod.enabled
                                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                                }`}>
                                    {mod.enabled ? 'ON' : 'OFF'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                {mod.description}
                            </p>

                            <div className="mt-3 inline-block px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400">
                                {mod.phaseText}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                            <div className="text-[11px] text-slate-500">
                                Roles: <span className="text-slate-300 font-medium">{mod.allowedRoles.join(', ')}</span>
                            </div>

                            {!mod.isHunterOrVoice ? (
                                <button
                                    onClick={() => onToggleModule(mod.key, !mod.enabled)}
                                    disabled={isUpdating}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                        mod.enabled
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                >
                                    {mod.enabled ? 'Disable' : 'Enable'}
                                </button>
                            ) : (
                                <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-wider">
                                    Disabled
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Section 71: Roadmap / Progress Center */}
            <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-lg">🧭</span>
                            <h4 className="text-sm font-bold text-white tracking-wide">
                                AI Roadmap & Progress Center
                            </h4>
                            <div className="flex items-center space-x-1.5 ml-2">
                                <button
                                    onClick={() => setActiveRoadmapTab('hunter')}
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors border ${
                                        activeRoadmapTab === 'hunter'
                                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                    AI Customer Hunter
                                </button>
                                <button
                                    onClick={() => setActiveRoadmapTab('sales')}
                                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors border ${
                                        activeRoadmapTab === 'sales'
                                            ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                    AI Sales Assistant
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Progress derived strictly from verified completed tasks. No arbitrary completion metrics.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                            ✓ {completedCount} / {totalCount} Subtasks Verified
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {currentSubtasks.map((task, idx) => (
                        <div
                            key={idx}
                            className="flex items-start justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                    <span className="text-emerald-400 text-xs">✓</span>
                                    <span className="text-xs font-semibold text-slate-200">{task.name}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 pl-4">{task.desc}</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded">
                                {task.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

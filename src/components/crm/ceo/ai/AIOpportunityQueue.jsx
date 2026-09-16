import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../../services/crmApi';

export default function AIOpportunityQueue({
    token,
    user,
    config: _config,
    opportunities = [],
    isLoading = false,
    onRefresh,
    onUpdateStatus: _onUpdateStatus
}) {
    const isCeo = user?.role === 'CEO';

    const [activeSubTab, setActiveSubTab] = useState('QUEUE'); // 'QUEUE' | 'ANALYTICS' | 'SOURCES'
    const [hunterStatus, setHunterStatus] = useState(null);
    const [hunterAnalytics, setHunterAnalytics] = useState(null);
    const [hunterSources, setHunterSources] = useState([]);
    const [localOpps, setLocalOpps] = useState([]);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL' | 'AI_LOCAL' | 'AI_OUTSIDE'
    const [selectedOpp, setSelectedOpp] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Conversion Modal State
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [convertOppTarget, setConvertOppTarget] = useState(null);
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadEmail, setLeadEmail] = useState('');

    // Prompt 9 Source Management State
    const [selectedSourceStats, setSelectedSourceStats] = useState(null);
    const [isSourceStatsModalOpen, setIsSourceStatsModalOpen] = useState(false);
    const [sourceActionLoading, setSourceActionLoading] = useState({});
    const [sourceStatusMessage, setSourceStatusMessage] = useState('');

    // Prompt 9.8 Contactability State
    const [contactData, setContactData] = useState(null);
    const [contactLoading, setContactLoading] = useState(false);
    const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
    const [newRouteType, setNewRouteType] = useState('BUSINESS_WEBSITE');
    const [newRouteValue, setNewRouteValue] = useState('');
    const [newRouteLabel, setNewRouteLabel] = useState('');

    // Load Hunter Telemetry
    const loadHunterData = useCallback(async () => {
        if (!token) return;
        try {
            const [statusRes, analyticsRes, sourcesRes, oppsRes] = await Promise.all([
                crmApi.fetchHunterStatus(token).catch(() => ({ success: false })),
                crmApi.fetchHunterAnalytics(token).catch(() => ({ success: false })),
                crmApi.fetchHunterSources(token).catch(() => ({ success: false, data: [] })),
                crmApi.fetchHunterOpportunities(token).catch(() => ({ success: false, data: [] }))
            ]);

            if (statusRes.success && statusRes.data) setHunterStatus(statusRes.data);
            if (analyticsRes.success && analyticsRes.data) setHunterAnalytics(analyticsRes.data);
            if (sourcesRes.success && Array.isArray(sourcesRes.data)) setHunterSources(sourcesRes.data);
            if (oppsRes.success && Array.isArray(oppsRes.data)) setLocalOpps(oppsRes.data);
        } catch (err) {
            console.error('Failed to load Hunter data:', err);
        }
    }, [token]);

    useEffect(() => {
        loadHunterData();
    }, [loadHunterData]);

    const activeOpportunities = localOpps.length > 0 ? localOpps : opportunities;

    // Filter Logic
    const filteredOpportunities = activeOpportunities.filter((opp) => {
        if (modeFilter !== 'ALL' && opp.hunterMode !== modeFilter) return false;
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'HIGH_INTENT') return opp.intentLevel === 'HIGH';
        return opp.status === statusFilter;
    });

    // Control Handlers
    const handleStartRun = async (mode) => {
        if (!isCeo) {
            setErrorMessage('Only CEO can execute Hunter discovery runs.');
            return;
        }
        setActionLoading(true);
        setErrorMessage('');
        try {
            const res = await crmApi.startHunterRun(token, { mode, maxSignals: 50 });
            if (res.success) {
                setActionMessage(`Hunter Run Completed: Discovered ${res.data?.opportunitiesCreated || 0} opportunities.`);
                loadHunterData();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to start Hunter run.');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePause = async () => {
        setActionLoading(true);
        try {
            await crmApi.pauseHunter(token);
            setActionMessage('Customer Hunter paused.');
            loadHunterData();
        } catch (err) {
            setErrorMessage(err.message || 'Failed to pause Hunter.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResume = async () => {
        setActionLoading(true);
        try {
            await crmApi.resumeHunter(token);
            setActionMessage('Customer Hunter resumed.');
            loadHunterData();
        } catch (err) {
            setErrorMessage(err.message || 'Failed to resume Hunter.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEmergencyStop = async () => {
        setActionLoading(true);
        try {
            await crmApi.stopHunter(token);
            setActionMessage('🚨 EMERGENCY STOP: All Hunter discovery halted.');
            loadHunterData();
        } catch (err) {
            setErrorMessage(err.message || 'Failed to stop Hunter.');
        } finally {
            setActionLoading(false);
        }
    };

    // Opportunity Actions
    const handleApprove = async (oppId) => {
        setActionLoading(true);
        try {
            await crmApi.approveHunterOpportunity(token, oppId);
            setActionMessage(`Opportunity ${oppId} approved and verified.`);
            loadHunterData();
            if (selectedOpp && selectedOpp.opportunityId === oppId) {
                setSelectedOpp(prev => ({ ...prev, status: 'APPROVED', verificationStatus: 'HUMAN_VERIFIED' }));
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to approve opportunity.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (oppId, reason) => {
        setActionLoading(true);
        try {
            await crmApi.rejectHunterOpportunity(token, oppId, reason);
            setActionMessage(`Opportunity ${oppId} rejected.`);
            loadHunterData();
            if (selectedOpp && selectedOpp.opportunityId === oppId) {
                setSelectedOpp(prev => ({ ...prev, status: 'REJECTED' }));
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to reject opportunity.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkDuplicate = async (oppId) => {
        setActionLoading(true);
        try {
            await crmApi.duplicateHunterOpportunity(token, oppId);
            setActionMessage(`Opportunity ${oppId} marked as duplicate.`);
            loadHunterData();
            if (selectedOpp && selectedOpp.opportunityId === oppId) {
                setSelectedOpp(prev => ({ ...prev, status: 'DUPLICATE' }));
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to mark duplicate.');
        } finally {
            setActionLoading(false);
        }
    };

    // Open Lead Conversion Modal
    const handleOpenConvertModal = (opp) => {
        setConvertOppTarget(opp);
        setLeadName('Hunter Guest');
        setLeadPhone('');
        setLeadEmail('');
        setIsConvertModalOpen(true);
    };

    // Submit CRM Lead Conversion
    const handleSubmitConversion = async () => {
        if (!convertOppTarget) return;
        setActionLoading(true);
        setErrorMessage('');
        try {
            const res = await crmApi.convertHunterOpportunityToLead(token, convertOppTarget.opportunityId, {
                name: leadName,
                phone: leadPhone,
                email: leadEmail
            });
            if (res.success) {
                setActionMessage(`Opportunity ${convertOppTarget.opportunityId} successfully converted to CRM Lead ${res.leadId} (${res.source})!`);
                setIsConvertModalOpen(false);
                setSelectedOpp(null);
                loadHunterData();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to convert opportunity to CRM lead.');
        } finally {
            setActionLoading(false);
        }
    };

    // Prompt 9: Source Management Handlers
    const handleTestSource = async (sourceId) => {
        if (!isCeo) return;
        setSourceActionLoading(prev => ({ ...prev, [`test-${sourceId}`]: true }));
        setErrorMessage('');
        setSourceStatusMessage('');
        try {
            const res = await crmApi.testHunterSource(token, sourceId);
            if (res.success) {
                setSourceStatusMessage(`Health check for ${sourceId}: ${res.data.status} (${res.data.healthy ? 'Healthy' : 'Degraded/Error'})${res.data.error ? ` — ${res.data.error}` : ''}`);
                loadHunterData();
            }
        } catch (err) {
            setErrorMessage(err.message || `Health check failed for ${sourceId}`);
        } finally {
            setSourceActionLoading(prev => ({ ...prev, [`test-${sourceId}`]: false }));
        }
    };

    const handleRunSource = async (sourceId) => {
        if (!isCeo) return;
        setSourceActionLoading(prev => ({ ...prev, [`run-${sourceId}`]: true }));
        setErrorMessage('');
        setSourceStatusMessage('');
        try {
            const res = await crmApi.runHunterSource(token, sourceId, {});
            if (res.success) {
                setSourceStatusMessage(`Run finished for ${sourceId}: Fetched ${res.data.signalsFetched || 0}, Normalized ${res.data.signalsNormalized || 0}, Created ${res.data.opportunitiesCreated || 0} opportunities.`);
                loadHunterData();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            setErrorMessage(err.message || `Failed to run ${sourceId}`);
        } finally {
            setSourceActionLoading(prev => ({ ...prev, [`run-${sourceId}`]: false }));
        }
    };

    const handleRunAllSources = async () => {
        if (!isCeo) return;
        setSourceActionLoading(prev => ({ ...prev, 'run-all': true }));
        setErrorMessage('');
        setSourceStatusMessage('');
        try {
            const res = await crmApi.runAllHunterSources(token, {});
            if (res.success) {
                setSourceStatusMessage(`Run All Sources Completed: Status ${res.data.status}. Succeeded: ${res.data.successfulSources}/${res.data.totalSourcesRun}. Total Opps: ${res.data.totalOpportunities}.`);
                loadHunterData();
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to run all sources');
        } finally {
            setSourceActionLoading(prev => ({ ...prev, 'run-all': false }));
        }
    };

    const handleToggleSource = async (sourceId, currentEnabled) => {
        if (!isCeo) return;
        setSourceActionLoading(prev => ({ ...prev, [`toggle-${sourceId}`]: true }));
        setErrorMessage('');
        setSourceStatusMessage('');
        try {
            const res = await crmApi.updateHunterSourceConfig(token, sourceId, { enabled: !currentEnabled });
            if (res.success) {
                setSourceStatusMessage(`Source ${sourceId} is now ${!currentEnabled ? 'ENABLED' : 'DISABLED'}`);
                loadHunterData();
            }
        } catch (err) {
            setErrorMessage(err.message || `Failed to toggle ${sourceId}`);
        } finally {
            setSourceActionLoading(prev => ({ ...prev, [`toggle-${sourceId}`]: false }));
        }
    };

    const handleOpenSourceStats = async (sourceId) => {
        setSourceActionLoading(prev => ({ ...prev, [`stats-${sourceId}`]: true }));
        try {
            const res = await crmApi.fetchHunterSourceStats(token, sourceId);
            if (res.success && res.data) {
                setSelectedSourceStats(res.data);
                setIsSourceStatsModalOpen(true);
            }
        } catch (err) {
            setErrorMessage(err.message || `Failed to load stats for ${sourceId}`);
        } finally {
            setSourceActionLoading(prev => ({ ...prev, [`stats-${sourceId}`]: false }));
        }
    };

    // Prompt 9.8: Contactability Handlers
    const loadContactability = async (oppId) => {
        if (!token || !oppId) return;
        setContactLoading(true);
        try {
            const res = await crmApi.fetchOpportunityContactability(token, oppId);
            if (res.success && res.data) setContactData(res.data);
        } catch (err) {
            console.error('Failed to load contactability:', err);
        } finally {
            setContactLoading(false);
        }
    };

    const handleDiscoverRoutes = async (oppId) => {
        if (!isCeo) return;
        setContactLoading(true);
        setErrorMessage('');
        try {
            const res = await crmApi.discoverContactRoutes(token, oppId);
            if (res.success) {
                setActionMessage(`Contact discovery: ${res.data?.discoveryResult?.routesFound || 0} routes found.`);
                loadContactability(oppId);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Contact discovery failed.');
        } finally {
            setContactLoading(false);
        }
    };

    const handleAddManualRoute = async (oppId) => {
        if (!newRouteType || !newRouteValue.trim()) return;
        setContactLoading(true);
        setErrorMessage('');
        try {
            const res = await crmApi.addManualContactRoute(token, oppId, {
                type: newRouteType,
                value: newRouteValue.trim(),
                label: newRouteLabel.trim()
            });
            if (res.success) {
                setActionMessage('Manual contact route added.');
                setNewRouteValue('');
                setNewRouteLabel('');
                setIsAddRouteOpen(false);
                loadContactability(oppId);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Failed to add route.');
        } finally {
            setContactLoading(false);
        }
    };

    const handleVerifyRoute = async (oppId, routeIndex, status) => {
        setContactLoading(true);
        try {
            const res = await crmApi.verifyContactRoute(token, oppId, routeIndex, { status });
            if (res.success) {
                setActionMessage(`Route ${routeIndex} marked as ${status}.`);
                loadContactability(oppId);
            }
        } catch (err) {
            setErrorMessage(err.message || 'Verification failed.');
        } finally {
            setContactLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. Master Hunter Control & Status Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🎯</span>
                            <h3 className="text-base font-bold text-white tracking-wide">
                                AI Customer Hunter Control Center
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                hunterStatus?.status === 'READY'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : hunterStatus?.status === 'PAUSED'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : hunterStatus?.status === 'EMERGENCY_STOP'
                                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                                {hunterStatus?.status || 'OFFLINE'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Discovers verified travel demand from authorized public signals. Requires human review before CRM lead conversion.
                        </p>
                    </div>

                    {/* Operational Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => handleStartRun('AI_LOCAL')}
                            disabled={actionLoading || !isCeo}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1.5"
                        >
                            <span>📍</span>
                            <span>Start Local Hunter</span>
                        </button>
                        <button
                            onClick={() => handleStartRun('AI_OUTSIDE')}
                            disabled={actionLoading || !isCeo}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded text-xs font-semibold transition-colors flex items-center space-x-1.5"
                        >
                            <span>🌐</span>
                            <span>Start Outside Hunter</span>
                        </button>
                        <button
                            onClick={handlePause}
                            disabled={actionLoading || !isCeo}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
                        >
                            Pause
                        </button>
                        <button
                            onClick={handleResume}
                            disabled={actionLoading || !isCeo}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
                        >
                            Resume
                        </button>
                        <button
                            onClick={handleEmergencyStop}
                            disabled={actionLoading || !isCeo}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
                        >
                            🛑 STOP ALL
                        </button>
                    </div>
                </div>

                {/* Status KPI Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Signals Processed</span>
                        <span className="font-bold text-white text-sm">{hunterStatus?.signalsProcessed || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Opportunities</span>
                        <span className="font-bold text-indigo-400 text-sm">{hunterStatus?.opportunities || activeOpportunities.length}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Duplicates Filtered</span>
                        <span className="font-bold text-slate-400 text-sm">{hunterStatus?.duplicatesRemoved || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Pending Review</span>
                        <span className="font-bold text-amber-400 text-sm">{hunterStatus?.pendingReview || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Approved</span>
                        <span className="font-bold text-emerald-400 text-sm">{hunterStatus?.approved || 0}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase">Converted Leads</span>
                        <span className="font-bold text-cyan-400 text-sm">{hunterStatus?.converted || 0}</span>
                    </div>
                </div>
            </div>

            {/* Banner Messages */}
            {actionMessage && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-200 text-xs flex justify-between items-center">
                    <span>{actionMessage}</span>
                    <button onClick={() => setActionMessage('')} className="text-emerald-400 hover:text-white">✕</button>
                </div>
            )}
            {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-200 text-xs flex justify-between items-center">
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-white">✕</button>
                </div>
            )}

            {/* 2. Sub-Tab Switcher */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
                {[
                    { id: 'QUEUE', label: `Opportunities Queue (${filteredOpportunities.length})`, icon: '📋' },
                    { id: 'ANALYTICS', label: 'Hunter Funnel & Demand', icon: '📊' },
                    { id: 'SOURCES', label: `Signal Sources (${hunterSources.length})`, icon: '📡' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                            activeSubTab === tab.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 3. SUB-TAB: OPPORTUNITIES QUEUE */}
            {activeSubTab === 'QUEUE' && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-400 font-medium mr-1">Mode:</span>
                            {['ALL', 'AI_LOCAL', 'AI_OUTSIDE'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setModeFilter(m)}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                        modeFilter === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    {m === 'ALL' ? 'All Modes' : (m === 'AI_LOCAL' ? '📍 Local' : '🌐 Outside')}
                                </button>
                            ))}

                            <span className="text-slate-400 font-medium ml-3 mr-1">Status:</span>
                            {['ALL', 'HIGH_INTENT', 'NEW', 'APPROVED', 'CONVERTED', 'REJECTED'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                                        statusFilter === st ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={loadHunterData}
                            disabled={isLoading || actionLoading}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {/* Table View */}
                    {filteredOpportunities.length === 0 ? (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-10 text-center text-slate-400 text-xs">
                            <div className="text-3xl mb-2">🎯</div>
                            <p className="font-semibold text-slate-300">No opportunities match selected filters.</p>
                            <p className="text-slate-500 mt-1">Click "Start Local Hunter" or "Start Outside Hunter" to run discovery.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                                        <tr>
                                            <th className="py-3 px-4">Opportunity</th>
                                            <th className="py-3 px-4">Mode</th>
                                            <th className="py-3 px-4">Intent &amp; Services</th>
                                            <th className="py-3 px-4">Timing</th>
                                            <th className="py-3 px-4">Score</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/80">
                                        {filteredOpportunities.map(opp => (
                                            <tr key={opp.opportunityId} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-mono font-bold text-indigo-300">{opp.opportunityId}</span>
                                                    <div className="text-[10px] text-slate-500">{opp.source || 'MOCK'}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        opp.hunterMode === 'AI_LOCAL'
                                                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                                                    }`}>
                                                        {opp.hunterMode === 'AI_LOCAL' ? '📍 LOCAL' : '🌐 OUTSIDE'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="font-semibold text-slate-200">{opp.detectedIntent}</div>
                                                        {opp.commercialIntentCategory && (
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                                                {opp.commercialIntentCategory}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(opp.serviceInterest || []).map(s => (
                                                            <span key={s} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-slate-300 font-medium">{opp.travelWindow || 'Flexible'}</span>
                                                    {opp.area && <span className="block text-[10px] text-amber-400">{opp.area}</span>}
                                                    {opp.stalenessStatus && (
                                                        <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                            opp.stalenessStatus === 'FRESH' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                            opp.stalenessStatus === 'AGING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                                            opp.stalenessStatus === 'STALE' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                                        }`}>
                                                            {opp.stalenessStatus}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-emerald-400">
                                                            {opp.actionabilityScore != null ? opp.actionabilityScore : (opp.qualificationScore || 50)}/100
                                                        </span>
                                                        {opp.actionabilityTier && (
                                                            <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                                                                opp.actionabilityTier === 'HIGH_PRIORITY' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                                opp.actionabilityTier === 'ACTIONABLE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                                'bg-slate-800 text-slate-400 border border-slate-700'
                                                            }`}>
                                                                {opp.actionabilityTier}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        conf: {Math.round((opp.confidence || 0.5) * 100)}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            opp.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                                            opp.status === 'CONVERTED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                                            opp.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                                            'bg-amber-950 text-amber-300 border border-amber-800'
                                                        }`}>
                                                            {opp.status}
                                                        </span>
                                                        {opp.contactability && opp.contactability.status !== 'NOT_ATTEMPTED' && (
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                                                opp.contactability.status === 'ROUTES_FOUND' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                                                                opp.contactability.status === 'NO_ROUTES_FOUND' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                                                opp.contactability.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                                                                'bg-slate-800 text-slate-500 border border-slate-700'
                                                            }`}>
                                                                📞 {opp.contactability.routeCount || 0} routes
                                                            </span>
                                                        )}
                                                        {opp.bestContactRoute && (
                                                            <span className="text-[9px] text-teal-400 truncate max-w-[120px]" title={`Best route (advisory): ${opp.bestContactRoute.value}`}>
                                                                ★ {opp.bestContactRoute.type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                                    <button
                                                        onClick={() => { setSelectedOpp(opp); loadContactability(opp.opportunityId); }}
                                                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                                                    >
                                                        Review
                                                    </button>
                                                    {opp.status === 'NEW' && (
                                                        <button
                                                            onClick={() => handleApprove(opp.opportunityId)}
                                                            disabled={actionLoading}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {opp.status === 'APPROVED' && (
                                                        <button
                                                            onClick={() => handleOpenConvertModal(opp)}
                                                            disabled={actionLoading}
                                                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                                                        >
                                                            Convert to Lead
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. SUB-TAB: ANALYTICS */}
            {activeSubTab === 'ANALYTICS' && (
                <div className="space-y-5">
                    {/* Funnel Overview */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <h4 className="text-sm font-bold text-white mb-3">Discovery-to-Lead Funnel</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">1. Signals</div>
                                <div className="text-lg font-bold text-white mt-1">{hunterAnalytics?.funnel?.signals || 0}</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">2. Relevant</div>
                                <div className="text-lg font-bold text-indigo-400 mt-1">{hunterAnalytics?.funnel?.relevant || 0}</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">3. Opportunities</div>
                                <div className="text-lg font-bold text-blue-400 mt-1">{hunterAnalytics?.funnel?.opportunities || 0}</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">4. Reviewed</div>
                                <div className="text-lg font-bold text-amber-400 mt-1">{hunterAnalytics?.funnel?.reviewed || 0}</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">5. Approved</div>
                                <div className="text-lg font-bold text-emerald-400 mt-1">{hunterAnalytics?.funnel?.approved || 0}</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">6. CRM Leads</div>
                                <div className="text-lg font-bold text-cyan-400 mt-1">{hunterAnalytics?.funnel?.convertedLeads || 0}</div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <div className="text-slate-400 font-medium">7. Bookings</div>
                                <div className="text-lg font-bold text-violet-400 mt-1">{hunterAnalytics?.funnel?.bookings || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Mode Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white flex items-center space-x-2">
                                    <span>📍</span>
                                    <span>Local Hunter Performance</span>
                                </span>
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded">
                                    IN-DESTINATION
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Signals</span>
                                    <span className="font-bold text-white">{hunterAnalytics?.modes?.local?.signals || 0}</span>
                                </div>
                                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Opportunities</span>
                                    <span className="font-bold text-indigo-400">{hunterAnalytics?.modes?.local?.opportunities || 0}</span>
                                </div>
                                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Approved</span>
                                    <span className="font-bold text-emerald-400">{hunterAnalytics?.modes?.local?.approved || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white flex items-center space-x-2">
                                    <span>🌐</span>
                                    <span>Outside Hunter Performance</span>
                                </span>
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded">
                                    FUTURE PLANNING
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Signals</span>
                                    <span className="font-bold text-white">{hunterAnalytics?.modes?.outside?.signals || 0}</span>
                                </div>
                                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Opportunities</span>
                                    <span className="font-bold text-indigo-400">{hunterAnalytics?.modes?.outside?.opportunities || 0}</span>
                                </div>
                                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                    <span className="text-slate-500 text-[10px] block">Approved</span>
                                    <span className="font-bold text-emerald-400">{hunterAnalytics?.modes?.outside?.approved || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Discovery Channel Separation (Prompt 9.5 Section 12) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-sm text-white flex items-center space-x-2">
                                <span>🔍</span>
                                <span>Discovery Channels</span>
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                                FIRST-PARTY VS EXTERNAL
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 text-xs font-semibold block">External Discovery</span>
                                <span className="text-[10px] text-slate-500 block mb-1">Search APIs &amp; Feeds</span>
                                <div className="text-sm font-bold text-white">
                                    {hunterAnalytics?.sourceBreakdown?.EXTERNAL_DISCOVERY?.signals || 0} <span className="text-[10px] font-normal text-slate-400">sigs</span>
                                </div>
                                <div className="text-xs text-indigo-400 font-semibold mt-0.5">
                                    {hunterAnalytics?.sourceBreakdown?.EXTERNAL_DISCOVERY?.opportunities || 0} opps • {hunterAnalytics?.sourceBreakdown?.EXTERNAL_DISCOVERY?.convertedLeads || 0} leads
                                </div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-emerald-400 text-xs font-semibold block">First-Party Discovery</span>
                                <span className="text-[10px] text-slate-500 block mb-1">Website &amp; Inquiries</span>
                                <div className="text-sm font-bold text-white">
                                    {hunterAnalytics?.sourceBreakdown?.FIRST_PARTY_DISCOVERY?.signals || 0} <span className="text-[10px] font-normal text-slate-400">sigs</span>
                                </div>
                                <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                                    {hunterAnalytics?.sourceBreakdown?.FIRST_PARTY_DISCOVERY?.opportunities || 0} opps • {hunterAnalytics?.sourceBreakdown?.FIRST_PARTY_DISCOVERY?.convertedLeads || 0} leads
                                </div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-blue-400 text-xs font-semibold block">Partner Referrals</span>
                                <span className="text-[10px] text-slate-500 block mb-1">B2B Partner Feeds</span>
                                <div className="text-sm font-bold text-white">
                                    {hunterAnalytics?.sourceBreakdown?.PARTNER_DISCOVERY?.signals || 0} <span className="text-[10px] font-normal text-slate-400">sigs</span>
                                </div>
                                <div className="text-xs text-blue-400 font-semibold mt-0.5">
                                    {hunterAnalytics?.sourceBreakdown?.PARTNER_DISCOVERY?.opportunities || 0} opps • {hunterAnalytics?.sourceBreakdown?.PARTNER_DISCOVERY?.convertedLeads || 0} leads
                                </div>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-purple-400 text-xs font-semibold block">Mock / Sandbox</span>
                                <span className="text-[10px] text-slate-500 block mb-1">Test Fixtures</span>
                                <div className="text-sm font-bold text-white">
                                    {hunterAnalytics?.sourceBreakdown?.MOCK?.signals || 0} <span className="text-[10px] font-normal text-slate-400">sigs</span>
                                </div>
                                <div className="text-xs text-purple-400 font-semibold mt-0.5">
                                    {hunterAnalytics?.sourceBreakdown?.MOCK?.opportunities || 0} opps • {hunterAnalytics?.sourceBreakdown?.MOCK?.convertedLeads || 0} leads
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. SUB-TAB: SOURCES (Prompt 9 Source Management Center) */}
            {activeSubTab === 'SOURCES' && (
                <div className="space-y-4">
                    {/* Status Feedback Banner */}
                    {sourceStatusMessage && (
                        <div className="p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-200 rounded-lg text-xs flex items-center justify-between">
                            <span>{sourceStatusMessage}</span>
                            <button onClick={() => setSourceStatusMessage('')} className="text-cyan-400 hover:text-white font-bold ml-3">✕</button>
                        </div>
                    )}

                    {/* Source KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                            <span className="text-[11px] text-slate-400 font-medium block">Total Sources</span>
                            <div className="text-xl font-bold text-white mt-0.5">{hunterSources.length}</div>
                            <span className="text-[10px] text-slate-500">Registered Connectors</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                            <span className="text-[11px] text-emerald-400 font-medium block">Ready &amp; Configured</span>
                            <div className="text-xl font-bold text-emerald-400 mt-0.5">
                                {hunterSources.filter(s => s.configurationStatus === 'READY').length}
                            </div>
                            <span className="text-[10px] text-slate-500">Live Credentials Available</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                            <span className="text-[11px] text-amber-400 font-medium block">Not Configured</span>
                            <div className="text-xl font-bold text-amber-400 mt-0.5">
                                {hunterSources.filter(s => s.configurationStatus === 'NOT_CONFIGURED').length}
                            </div>
                            <span className="text-[10px] text-slate-500">Requires Server API Keys</span>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                            <span className="text-[11px] text-rose-400 font-medium block">Errors / Limited</span>
                            <div className="text-xl font-bold text-rose-400 mt-0.5">
                                {hunterSources.filter(s => s.healthStatus === 'ERROR' || s.healthStatus === 'RATE_LIMITED').length}
                            </div>
                            <span className="text-[10px] text-slate-500">Needs Attention</span>
                        </div>
                    </div>

                    {/* Sources Table Container */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center bg-slate-950/40">
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <span>Signal Sources &amp; Provider Connectors</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                                        Hunter Engine
                                    </span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Connects authorized external data sources to Hunter pipeline. Zero scraping of private accounts. Uncredentialed providers show NOT_CONFIGURED.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={loadHunterData}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                                >
                                    ↻ Refresh
                                </button>
                                {isCeo && (
                                    <button
                                        onClick={handleRunAllSources}
                                        disabled={sourceActionLoading['run-all']}
                                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded text-xs font-semibold shadow transition"
                                    >
                                        {sourceActionLoading['run-all'] ? 'Running All Sources...' : '▶ Run All Enabled Sources'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-medium">
                                    <tr>
                                        <th className="py-3 px-4">Source &amp; Provider</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Config Status</th>
                                        <th className="py-3 px-4">Health</th>
                                        <th className="py-3 px-4">Rate Limits</th>
                                        <th className="py-3 px-4">Pipeline Stats</th>
                                        <th className="py-3 px-4">Last Run</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80">
                                    {hunterSources.map(src => {
                                        const isEnabled = Boolean(src.enabled);
                                        const isConfigured = src.configurationStatus === 'READY';

                                        return (
                                            <tr key={src.sourceId} className="hover:bg-slate-800/40 transition">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-white">{src.sourceName || src.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{src.sourceId} • {src.provider}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                                                            {src.sourceType}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase border ${
                                                            src.sourceType === 'MOCK'
                                                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                                                : ((src.sourceMode === 'REAL' || (src.configurationStatus === 'READY' && src.healthStatus === 'HEALTHY' && src.lastSuccessfulRunAt))
                                                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                                                    : 'bg-slate-900 text-slate-400 border-slate-700')
                                                        }`}>
                                                            MODE: {src.sourceType === 'MOCK' ? 'MOCK' : ((src.sourceMode === 'REAL' || (src.configurationStatus === 'READY' && src.healthStatus === 'HEALTHY' && src.lastSuccessfulRunAt)) ? 'REAL' : 'NOT_CONFIGURED')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                        src.configurationStatus === 'READY'
                                                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                                            : src.configurationStatus === 'NOT_CONFIGURED'
                                                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                                                            : 'bg-rose-950 text-rose-400 border-rose-800'
                                                    }`}>
                                                        {src.configurationStatus || 'NOT_CONFIGURED'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            src.healthStatus === 'HEALTHY'
                                                                ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                                                                : src.healthStatus === 'DEGRADED'
                                                                ? 'bg-amber-400'
                                                                : src.healthStatus === 'ERROR'
                                                                ? 'bg-rose-500'
                                                                : 'bg-slate-500'
                                                        }`} />
                                                        <span className="text-[11px] font-medium text-slate-200">
                                                            {src.healthStatus || 'NOT_CONFIGURED'}
                                                        </span>
                                                    </div>
                                                    {src.lastErrorMessage && (
                                                        <div className="text-[10px] text-rose-400 truncate max-w-[140px]" title={src.lastErrorMessage}>
                                                            {src.lastErrorMessage}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                                                    <div>{src.rateLimit?.currentWindowRequests || src.requestsThisHour || 0} / {src.rateLimit?.maxPerHour || src.maxPerHour || 100}/hr</div>
                                                    <div className="text-[10px] text-slate-500">{src.rateLimit?.dailyRemaining ?? '—'} daily rem</div>
                                                </td>
                                                <td className="py-3 px-4 text-[11px]">
                                                    <div className="font-mono text-slate-200">
                                                        <span className="text-cyan-400 font-bold">{src.signalsCount || 0}</span> sigs
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        <span className="text-emerald-400 font-semibold">{src.opportunitiesCount || 0}</span> opps • {src.conversionsCount || 0} leads
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 text-[11px]">
                                                    {src.lastSuccessfulRunAt ? (
                                                        <span>{new Date(src.lastSuccessfulRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    ) : (
                                                        <span className="text-slate-600">Never</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1.5">
                                                        {isCeo && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleToggleSource(src.sourceId, isEnabled)}
                                                                    disabled={sourceActionLoading[`toggle-${src.sourceId}`]}
                                                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                                                        isEnabled
                                                                            ? 'bg-slate-800 text-amber-300 border-amber-900/50 hover:bg-slate-700'
                                                                            : 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                                                                    }`}
                                                                >
                                                                    {isEnabled ? 'Disable' : 'Enable'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleTestSource(src.sourceId)}
                                                                    disabled={sourceActionLoading[`test-${src.sourceId}`]}
                                                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700 transition"
                                                                    title="Test Health Check"
                                                                >
                                                                    {sourceActionLoading[`test-${src.sourceId}`] ? '...' : 'Test'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRunSource(src.sourceId)}
                                                                    disabled={!isEnabled || !isConfigured || sourceActionLoading[`run-${src.sourceId}`]}
                                                                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded text-[10px] font-semibold transition"
                                                                    title={!isConfigured ? 'Cannot run: NOT_CONFIGURED' : 'Execute discovery run'}
                                                                >
                                                                    {sourceActionLoading[`run-${src.sourceId}`] ? 'Running' : 'Run'}
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenSourceStats(src.sourceId)}
                                                            disabled={sourceActionLoading[`stats-${src.sourceId}`]}
                                                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] border border-slate-700 transition"
                                                            title="Inspect Source Runs & Metrics"
                                                        >
                                                            Stats
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt 9: Source Stats & Run History Modal */}
            {isSourceStatsModalOpen && selectedSourceStats && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <span>{selectedSourceStats.metadata?.sourceName || selectedSourceStats.sourceId}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                        {selectedSourceStats.metadata?.sourceType}
                                    </span>
                                </h3>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">
                                    ID: {selectedSourceStats.sourceId} • Provider: {selectedSourceStats.metadata?.provider}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSourceStatsModalOpen(false)}
                                className="text-slate-400 hover:text-white text-base"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Metadata Overview */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Configuration</span>
                                <span className="font-bold text-emerald-400">{selectedSourceStats.metadata?.configurationStatus}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Health Status</span>
                                <span className="font-bold text-slate-200">{selectedSourceStats.metadata?.healthStatus}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Response Time</span>
                                <span className="font-bold text-cyan-400">{selectedSourceStats.metadata?.responseTimeMs || 0}ms</span>
                            </div>
                            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Conversions</span>
                                <span className="font-bold text-purple-400">{selectedSourceStats.conversionsCount || 0} Leads</span>
                            </div>
                        </div>

                        {/* Recent Runs Table */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Source Runs</h4>
                            {(selectedSourceStats.recentRuns || []).length === 0 ? (
                                <div className="p-4 bg-slate-950 rounded border border-slate-800 text-center text-xs text-slate-500">
                                    No run history recorded yet for this source.
                                </div>
                            ) : (
                                <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden">
                                    <table className="w-full text-left text-xs text-slate-300">
                                        <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 text-[11px]">
                                            <tr>
                                                <th className="p-2.5">Run ID</th>
                                                <th className="p-2.5">Status</th>
                                                <th className="p-2.5">Fetched</th>
                                                <th className="p-2.5">Normalized</th>
                                                <th className="p-2.5">Opps</th>
                                                <th className="p-2.5">Duration</th>
                                                <th className="p-2.5">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {selectedSourceStats.recentRuns.map((r, i) => (
                                                <tr key={i} className="hover:bg-slate-900/40">
                                                    <td className="p-2.5 font-mono text-[10px] text-slate-400">{r.runId}</td>
                                                    <td className="p-2.5">
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                            r.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                                                        }`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-2.5 font-mono">{r.signalsFetched || 0}</td>
                                                    <td className="p-2.5 font-mono text-cyan-400">{r.signalsNormalized || 0}</td>
                                                    <td className="p-2.5 font-mono text-emerald-400 font-bold">{r.opportunitiesCreated || 0}</td>
                                                    <td className="p-2.5 font-mono text-slate-400">{r.durationMs || 0}ms</td>
                                                    <td className="p-2.5 text-slate-500 text-[10px]">
                                                        {r.startedAt ? new Date(r.startedAt).toLocaleTimeString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setIsSourceStatsModalOpen(false)}
                                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Detail Review Modal */}
            {selectedOpp && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-mono text-sm font-bold text-indigo-400">{selectedOpp.opportunityId}</span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                        {selectedOpp.hunterMode}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white mt-1">{selectedOpp.detectedIntent}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedOpp(null)}
                                className="text-slate-400 hover:text-white text-base"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Business Evidence (Section 55 & 56) */}
                        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Why AI Flagged This Opportunity
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed">
                                {selectedOpp.reasoningSummary}
                            </p>
                            {selectedOpp.evidenceSummary && (
                                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                                    "{selectedOpp.evidenceSummary}"
                                </div>
                            )}
                        </div>

                        {/* Prompt 9.10: Phase 10 Manager Prospect Quality Breakdown */}
                        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5 text-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                                🎯 Explainable Prospect Quality (Phase 10)
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                    <span className="text-slate-500 block text-[10px]">WHY THIS PROSPECT</span>
                                    <span className="text-slate-200">{selectedOpp.prospectExplanation?.whyThisProspect || selectedOpp.reasoningSummary}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">WHAT THEY NEED</span>
                                    <span className="text-slate-200">{selectedOpp.prospectExplanation?.whatTheyNeed || (selectedOpp.serviceInterest || []).join(', ')}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">WHEN THEY MAY TRAVEL</span>
                                    <span className="text-slate-200">{selectedOpp.travelWindow || 'Flexible'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">WHERE / DESTINATION</span>
                                    <span className="text-slate-200">{selectedOpp.location} {selectedOpp.area ? `(${selectedOpp.area})` : ''}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">SERVICE MATCH</span>
                                    <span className="text-slate-200">{(selectedOpp.prospectExplanation?.serviceMatches || selectedOpp.serviceInterest || []).join(', ') || 'General inquiry'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">ACTIONABILITY SCORE &amp; TIER</span>
                                    <span className="text-emerald-400 font-bold">{selectedOpp.actionabilityScore || selectedOpp.qualificationScore}/100 ({selectedOpp.actionabilityTier || 'ACTIONABLE'})</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">AI RECOMMENDED NEXT ACTION</span>
                                    <span className="text-amber-300 font-semibold">{selectedOpp.prospectExplanation?.aiRecommendedNextAction || 'HUMAN_REVIEW'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">BEST CONTACT ROUTE (ADVISORY)</span>
                                    <span className="text-teal-300 font-mono text-[10px]">
                                        {selectedOpp.prospectExplanation?.bestContactRoute?.value || selectedOpp.bestContactRoute?.value || 'None discovered yet'}
                                        {selectedOpp.bestContactRoute?.type ? ` (${selectedOpp.bestContactRoute.type})` : ''}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">HUMAN VERIFICATION</span>
                                    <span className="text-slate-200">{selectedOpp.verificationStatus || 'UNVERIFIED'} ({selectedOpp.lifecycleState || 'DISCOVERED'})</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block text-[10px]">CONTACT OUTCOME</span>
                                    <span className="text-slate-200">{selectedOpp.humanContactOutcome || 'Not recorded'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Structured Entities */}
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Travel Window</span>
                                <span className="font-semibold text-slate-200">{selectedOpp.travelWindow || 'Flexible'}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Destination / Area</span>
                                <span className="font-semibold text-slate-200">{selectedOpp.location} {selectedOpp.area ? `(${selectedOpp.area})` : ''}</span>
                            </div>
                            <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Qualification Score</span>
                                <span className="font-bold text-emerald-400">{selectedOpp.qualificationScore}/100</span>
                            </div>
                            <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                                <span className="text-[10px] text-slate-500 block">Overall Confidence</span>
                                <span className="font-bold text-indigo-400">{Math.round((selectedOpp.confidence || 0.5) * 100)}%</span>
                            </div>
                        </div>

                        {/* Qualification Reasons */}
                        {(selectedOpp.qualificationReasons || []).length > 0 && (
                            <div className="space-y-1">
                                <span className="text-[11px] text-slate-400 font-medium">Qualification Evidence:</span>
                                <ul className="text-xs text-slate-300 space-y-0.5 pl-4 list-disc">
                                    {selectedOpp.qualificationReasons.map((r, i) => (
                                        <li key={i}>{r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Prompt 9.8: Contact Routes Section */}
                        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                    📞 Contact Routes
                                    {contactData?.contactability?.routeCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                                            {contactData.contactability.routeCount}
                                        </span>
                                    )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {isCeo && (
                                        <button
                                            onClick={() => handleDiscoverRoutes(selectedOpp.opportunityId)}
                                            disabled={contactLoading}
                                            className="px-2 py-1 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white rounded text-[10px] font-semibold transition"
                                        >
                                            {contactLoading ? 'Discovering...' : '🔍 Discover Routes'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsAddRouteOpen(!isAddRouteOpen)}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition"
                                    >
                                        + Manual
                                    </button>
                                </div>
                            </div>

                            {/* Contact Status */}
                            {contactData?.contactability && (
                                <div className="flex items-center gap-2 text-[11px]">
                                    <span className="text-slate-500">Status:</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        contactData.contactability.status === 'ROUTES_FOUND' ? 'bg-teal-950 text-teal-400 border border-teal-800' :
                                        contactData.contactability.status === 'NOT_ATTEMPTED' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                        contactData.contactability.status === 'PROVIDER_NOT_CONFIGURED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                        'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}>
                                        {contactData.contactability.status}
                                    </span>
                                    {contactData.contactability.provider && (
                                        <span className="text-slate-500 font-mono">via {contactData.contactability.provider}</span>
                                    )}
                                </div>
                            )}

                            {/* Discovered Routes */}
                            {(contactData?.contactability?.routes || []).length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-500 font-semibold">Discovered Routes:</span>
                                    {contactData.contactability.routes.map((route, i) => (
                                        <div key={`d-${i}`} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-teal-300">{route.type}</span>
                                                    <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                                                        route.verifiedByHuman ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'
                                                    }`}>
                                                        {route.verifiedByHuman ? '✓ VERIFIED' : 'UNVERIFIED'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-blue-300 truncate mt-0.5" title={route.value}>{route.value}</div>
                                                {route.label && <div className="text-[10px] text-slate-500">{route.label}</div>}
                                                <div className="text-[9px] text-slate-600 font-mono">conf: {Math.round((route.confidence || 0) * 100)}% • {route.provenance}</div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                {!route.verifiedByHuman && (
                                                    <button
                                                        onClick={() => handleVerifyRoute(selectedOpp.opportunityId, i, 'HUMAN_VERIFIED')}
                                                        disabled={contactLoading}
                                                        className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[9px] border border-emerald-800"
                                                    >
                                                        ✓
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleVerifyRoute(selectedOpp.opportunityId, i, 'REJECTED')}
                                                    disabled={contactLoading}
                                                    className="px-1.5 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-[9px] border border-rose-800"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Manual Routes */}
                            {(contactData?.contactability?.manualRoutes || []).length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-[10px] text-slate-500 font-semibold">Manual Routes:</span>
                                    {contactData.contactability.manualRoutes.map((route, i) => {
                                        const globalIdx = (contactData?.contactability?.routes || []).length + i;
                                        return (
                                            <div key={`m-${i}`} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-indigo-900/30">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-[9px] font-mono text-indigo-300">{route.type}</span>
                                                        <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-indigo-950 text-indigo-400">MANUAL</span>
                                                    </div>
                                                    <div className="text-[11px] text-blue-300 truncate mt-0.5" title={route.value}>{route.value}</div>
                                                    {route.label && <div className="text-[10px] text-slate-500">{route.label}</div>}
                                                </div>
                                                <div className="flex items-center gap-1 ml-2">
                                                    {!route.verifiedByHuman && (
                                                        <button
                                                            onClick={() => handleVerifyRoute(selectedOpp.opportunityId, globalIdx, 'HUMAN_VERIFIED')}
                                                            disabled={contactLoading}
                                                            className="px-1.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[9px] border border-emerald-800"
                                                        >
                                                            ✓
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add Manual Route Form */}
                            {isAddRouteOpen && (
                                <div className="p-2.5 bg-slate-900 rounded border border-slate-700 space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Add Manual Contact Route</div>
                                    <div className="flex gap-2">
                                        <select
                                            value={newRouteType}
                                            onChange={e => setNewRouteType(e.target.value)}
                                            className="bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-white"
                                        >
                                            <option value="BUSINESS_WEBSITE">Business Website</option>
                                            <option value="GOOGLE_BUSINESS">Google Business</option>
                                            <option value="SOCIAL_MEDIA">Social Media</option>
                                            <option value="PUBLIC_EMAIL">Public Email</option>
                                            <option value="PUBLIC_LISTING">Public Listing</option>
                                            <option value="TOURISM_PORTAL">Tourism Portal</option>
                                            <option value="MANUAL_ENTRY">Other</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={newRouteValue}
                                            onChange={e => setNewRouteValue(e.target.value)}
                                            placeholder="URL, handle, or contact info"
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-white"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={newRouteLabel}
                                            onChange={e => setNewRouteLabel(e.target.value)}
                                            placeholder="Label (optional)"
                                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-[11px] text-white"
                                        />
                                        <button
                                            onClick={() => handleAddManualRoute(selectedOpp.opportunityId)}
                                            disabled={contactLoading || !newRouteValue.trim()}
                                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded text-[10px] font-semibold"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setIsAddRouteOpen(false)}
                                            className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {(!contactData || (contactData.contactability?.status === 'NOT_ATTEMPTED' && !(contactData.contactability?.routes?.length > 0))) && (
                                <div className="text-center text-[11px] text-slate-500 py-2">
                                    No contact routes discovered yet. Click "Discover Routes" or add manually.
                                </div>
                            )}
                        </div>

                        {/* Modal Action Buttons (Strictly NO Auto Contact / Auto Book) */}
                        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleReject(selectedOpp.opportunityId, 'Rejected in review')}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleMarkDuplicate(selectedOpp.opportunityId)}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                                >
                                    Duplicate
                                </button>
                            </div>

                            <div className="flex items-center space-x-2">
                                {selectedOpp.status === 'NEW' && (
                                    <button
                                        onClick={() => handleApprove(selectedOpp.opportunityId)}
                                        disabled={actionLoading}
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                                    >
                                        Approve &amp; Verify
                                    </button>
                                )}
                                {selectedOpp.status === 'APPROVED' && (
                                    <button
                                        onClick={() => handleOpenConvertModal(selectedOpp)}
                                        disabled={actionLoading}
                                        className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                                    >
                                        Convert to CRM Lead
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Controlled CRM Lead Conversion Modal (Section 28 & 54) */}
            {isConvertModalOpen && convertOppTarget && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-cyan-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-800 pb-2">
                            <div>
                                <h3 className="text-sm font-bold text-white">Convert to CRM Lead</h3>
                                <p className="text-[11px] text-slate-400">
                                    Creates an official Enquiry with source {convertOppTarget.hunterMode}.
                                </p>
                            </div>
                            <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-300 space-y-1">
                            <div><strong>Opportunity:</strong> {convertOppTarget.opportunityId}</div>
                            <div><strong>Intent:</strong> {convertOppTarget.detectedIntent}</div>
                            <div><strong>Travel Window:</strong> {convertOppTarget.travelWindow || 'Flexible'}</div>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div>
                                <label className="text-slate-400 block mb-1">Prospect / Contact Name</label>
                                <input
                                    type="text"
                                    value={leadName}
                                    onChange={(e) => setLeadName(e.target.value)}
                                    placeholder="Guest Name"
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="text-slate-400 block mb-1">Mobile / WhatsApp (Optional)</label>
                                <input
                                    type="text"
                                    value={leadPhone}
                                    onChange={(e) => setLeadPhone(e.target.value)}
                                    placeholder="10-digit phone"
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                            <button
                                onClick={() => setIsConvertModalOpen(false)}
                                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitConversion}
                                disabled={actionLoading}
                                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                            >
                                {actionLoading ? 'Converting...' : 'Confirm & Create Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../../services/crmApi';
import AIStatusPanel from './AIStatusPanel';
import AIModuleFlags from './AIModuleFlags';
import AIActivityLog from './AIActivityLog';
import AISettings from './AISettings';
import AIOpportunityQueue from './AIOpportunityQueue';
import AIRunModal from './AIRunModal';

export default function AIControlCenter({ token, user }) {
    const isCeo = user?.role === 'CEO';

    const [activeTab, setActiveTab] = useState('STATUS'); // 'STATUS' | 'ACTIVITY' | 'OPPORTUNITIES' | 'SETTINGS'
    const [config, setConfig] = useState(null);
    const [health, setHealth] = useState(null);
    const [runs, setRuns] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [opportunities, setOpportunities] = useState([]);
    const [assistantMetrics, setAssistantMetrics] = useState(null);
    const [salesMetrics, setSalesMetrics] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);

    // Auto-dismiss banners
    useEffect(() => {
        if (successMessage) {
            const t = setTimeout(() => setSuccessMessage(''), 4000);
            return () => clearTimeout(t);
        }
    }, [successMessage]);

    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        try {
            const [healthRes, configRes, runsRes, auditRes, oppsRes, asstMetricsRes, salesMetricsRes] = await Promise.all([
                crmApi.fetchAiHealth(token).catch(() => ({ success: false })),
                crmApi.fetchAiConfig(token).catch((err) => ({ success: false, error: err.message })),
                crmApi.fetchAiRuns(token, { limit: 30 }).catch(() => ({ success: false, data: [] })),
                crmApi.fetchAiAuditLogs(token, { limit: 50 }).catch(() => ({ success: false, data: [] })),
                crmApi.fetchAiOpportunities(token).catch(() => ({ success: false, data: [] })),
                crmApi.fetchAiAssistantMetrics(token).catch(() => ({ success: false })),
                crmApi.fetchAiSalesMetrics(token).catch(() => ({ success: false }))
            ]);

            if (healthRes.success) setHealth(healthRes.data || healthRes);
            if (configRes.success && configRes.data) setConfig(configRes.data);
            if (runsRes.success && Array.isArray(runsRes.data)) setRuns(runsRes.data);
            if (auditRes.success && Array.isArray(auditRes.data)) setAuditLogs(auditRes.data);
            if (oppsRes.success && Array.isArray(oppsRes.data)) setOpportunities(oppsRes.data);
            if (asstMetricsRes.success && asstMetricsRes.metrics) setAssistantMetrics(asstMetricsRes.metrics);
            if (salesMetricsRes.success && salesMetricsRes.metrics) setSalesMetrics(salesMetricsRes.metrics);
        } catch (err) {
            setError(err.message || 'Failed to load AI Control Center data');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Master Switch Toggle
    const handleToggleMaster = async (enabled) => {
        if (!isCeo) {
            setError('Only the CEO can modify the Master AI switch.');
            return;
        }
        setIsUpdating(true);
        setError('');
        try {
            const res = await crmApi.toggleAiMaster(token, enabled);
            if (res.success && res.data) {
                setConfig(res.data);
                setSuccessMessage(`Master AI Switch turned ${enabled ? 'ON' : 'OFF'}.`);
            }
        } catch (err) {
            setError(err.message || 'Failed to update Master AI switch');
        } finally {
            setIsUpdating(false);
        }
    };

    // Safe Mode Toggle
    const handleToggleSafeMode = async (safeMode) => {
        if (!isCeo) {
            setError('Only the CEO can modify Safe Mode.');
            return;
        }
        setIsUpdating(true);
        setError('');
        try {
            const res = await crmApi.toggleAiSafeMode(token, safeMode);
            if (res.success && res.data) {
                setConfig(res.data);
                setSuccessMessage(`AI Safe Mode ${safeMode ? 'ENABLED (Read-Only Guardrails)' : 'DISABLED (Mutations Allowed)'}.`);
            }
        } catch (err) {
            setError(err.message || 'Failed to toggle Safe Mode');
        } finally {
            setIsUpdating(false);
        }
    };

    // Emergency Stop Toggle
    const handleToggleEmergencyStop = async (emergencyStop) => {
        if (!isCeo) {
            setError('Only the CEO can trigger or clear Emergency Stop.');
            return;
        }
        setIsUpdating(true);
        setError('');
        try {
            const res = await crmApi.toggleAiEmergencyStop(token, emergencyStop);
            if (res.success && res.data) {
                setConfig(res.data);
                setSuccessMessage(
                    emergencyStop
                        ? '🚨 EMERGENCY STOP ACTIVATED: All AI execution immediately halted.'
                        : 'Emergency Stop cleared. Standard controls restored.'
                );
            }
        } catch (err) {
            setError(err.message || 'Failed to update Emergency Stop');
        } finally {
            setIsUpdating(false);
        }
    };

    // Module Flag Toggle
    const handleToggleModule = async (moduleKey, enabled) => {
        if (!isCeo) {
            setError('Only the CEO can configure AI modules.');
            return;
        }
        setIsUpdating(true);
        setError('');
        try {
            const currentModules = config?.modules || {};
            const updatedModules = {
                ...currentModules,
                [moduleKey]: {
                    ...(currentModules[moduleKey] || {}),
                    enabled
                }
            };
            const res = await crmApi.updateAiConfig(token, { modules: updatedModules });
            if (res.success && res.data) {
                setConfig(res.data);
                setSuccessMessage(`Module ${moduleKey} set to ${enabled ? 'ON' : 'OFF'}.`);
            }
        } catch (err) {
            setError(err.message || `Failed to update module ${moduleKey}`);
        } finally {
            setIsUpdating(false);
        }
    };

    // Update Settings & Limits
    const handleSaveSettings = async (updates) => {
        if (!isCeo) {
            setError('Only the CEO can update AI operational settings.');
            return;
        }
        setIsUpdating(true);
        setError('');
        try {
            const res = await crmApi.updateAiConfig(token, updates);
            if (res.success && res.data) {
                setConfig(res.data);
                setSuccessMessage('AI operational settings updated successfully.');
            }
        } catch (err) {
            setError(err.message || 'Failed to update AI settings');
        } finally {
            setIsUpdating(false);
        }
    };

    // Controlled Run Execution
    const handleExecuteRun = async (payload) => {
        setError('');
        const res = await crmApi.executeAiRun(token, payload);
        // Refresh runs and logs
        loadData();
        return res;
    };

    // Update Opportunity Status
    const handleUpdateOpportunity = async (oppId, status) => {
        setIsUpdating(true);
        setError('');
        try {
            const res = await crmApi.updateAiOpportunity(token, oppId, { status });
            if (res.success) {
                setSuccessMessage(`Opportunity ${oppId} updated to ${status}.`);
                loadData();
            }
        } catch (err) {
            setError(err.message || 'Failed to update opportunity');
        } finally {
            setIsUpdating(false);
        }
    };

    const isEmergency = config?.emergencyStop || false;

    return (
        <div className="space-y-6 pb-12">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🤖</span>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            CEO AI Control Center
                        </h1>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                            AI Operational Control
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Executive oversight, permission boundaries, Safe Mode policies, and auditable AI execution.
                    </p>
                </div>

                {/* Header Actions */}
                <div className="flex items-center flex-wrap gap-2.5">
                    <button
                        onClick={loadData}
                        disabled={isLoading || isUpdating}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                    >
                        {isLoading ? 'Loading...' : '↻ Refresh'}
                    </button>

                    <button
                        onClick={() => setIsRunModalOpen(true)}
                        disabled={!config?.masterEnabled || isEmergency}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-medium transition-colors shadow flex items-center space-x-1.5"
                    >
                        <span>▶</span>
                        <span>Run Test Analysis</span>
                    </button>

                    {/* Quick Emergency Kill Switch */}
                    {!isEmergency ? (
                        <button
                            onClick={() => handleToggleEmergencyStop(true)}
                            disabled={isUpdating}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors shadow flex items-center space-x-1.5"
                        >
                            <span>🛑</span>
                            <span>Emergency Stop</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleToggleEmergencyStop(false)}
                            disabled={isUpdating}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow"
                        >
                            Clear Emergency Stop
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Banners */}
            {error && (
                <div className="p-3.5 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-rose-400 hover:text-white text-sm ml-2">×</button>
                </div>
            )}
            {successMessage && (
                <div className="p-3.5 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white text-sm ml-2">×</button>
                </div>
            )}

            {/* Workspace Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
                {[
                    { id: 'STATUS', label: 'System Status & Modules', icon: '📊' },
                    { id: 'ACTIVITY', label: `Activity & Audits (${auditLogs.length})`, icon: '📋' },
                    { id: 'OPPORTUNITIES', label: `Hunter Opportunities (${opportunities.length})`, icon: '🎯' },
                    { id: 'SETTINGS', label: 'Safety Limits & Provider', icon: '⚙️' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Views */}
            {activeTab === 'STATUS' && (
                <div className="space-y-6">
                    <AIStatusPanel
                        config={config}
                        health={health}
                        runsCount={runs.length}
                        assistantMetrics={assistantMetrics}
                        salesMetrics={salesMetrics}
                        onToggleMaster={handleToggleMaster}
                        onToggleSafeMode={handleToggleSafeMode}
                        onToggleEmergencyStop={handleToggleEmergencyStop}
                        isUpdating={isUpdating}
                    />
                    <AIModuleFlags
                        modules={config?.modules}
                        onToggleModule={handleToggleModule}
                        isUpdating={isUpdating}
                        isEmergency={isEmergency}
                    />
                </div>
            )}

            {activeTab === 'ACTIVITY' && (
                <AIActivityLog
                    runs={runs}
                    auditLogs={auditLogs}
                    onRefresh={loadData}
                    isLoading={isLoading}
                />
            )}

            {activeTab === 'OPPORTUNITIES' && (
                <AIOpportunityQueue
                    token={token}
                    user={user}
                    config={config}
                    opportunities={opportunities}
                    isLoading={isLoading}
                    onRefresh={loadData}
                    onUpdateStatus={handleUpdateOpportunity}
                />
            )}

            {activeTab === 'SETTINGS' && (
                <AISettings
                    config={config}
                    onSave={handleSaveSettings}
                    isUpdating={isUpdating}
                />
            )}

            {/* Test Run Execution Modal */}
            <AIRunModal
                isOpen={isRunModalOpen}
                onClose={() => setIsRunModalOpen(false)}
                onExecuteRun={handleExecuteRun}
                isSafeMode={config?.safeMode ?? true}
                isMasterOn={config?.masterEnabled ?? false}
                isEmergency={isEmergency}
            />
        </div>
    );
}

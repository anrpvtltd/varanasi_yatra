import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../services/crmApi';

export default function CEOOperationsPanel({ token, user }) {
    const [healthData, setHealthData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const loadHealthStatus = useCallback(async () => {
        if (!token || user?.role !== 'CEO') return;
        setIsLoading(true);
        setError('');
        try {
            const res = await crmApi.fetchSystemHealth(token);
            if (res.success) {
                setHealthData(res);
            }
        } catch (err) {
            setError(err.message || 'Failed to load system health');
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadHealthStatus();
    }, [loadHealthStatus]);

    if (user?.role !== 'CEO') {
        return null;
    }

    return (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-white space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div>
                    <h2 className="text-sm font-serif font-extrabold tracking-wider uppercase text-amber-400 flex items-center space-x-2">
                        <span>🛡️</span>
                        <span>CEO System & Infrastructure Control</span>
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">Real-time application health, database status, storage engine, and environment telemetry</p>
                </div>
                <button
                    type="button"
                    onClick={loadHealthStatus}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl transition"
                >
                    {isLoading ? '⏳ Refreshing...' : '🔄 Refresh Status'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-rose-900/40 border border-rose-700 text-rose-300 text-xs rounded-xl">
                    ⚠️ {error}
                </div>
            )}

            {healthData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/50">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Application Status</span>
                        <div className="mt-1 flex items-center space-x-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-sm font-extrabold text-emerald-400">{healthData.status}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">Env: <span className="text-stone-200 font-mono">{healthData.system?.environment}</span></p>
                    </div>

                    <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/50">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Database Engine</span>
                        <div className="mt-1 flex items-center space-x-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${healthData.services?.database?.status === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                            <span className="text-sm font-extrabold text-stone-100">{healthData.services?.database?.status}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">Ping: <span className="text-stone-200 font-mono">{healthData.services?.database?.pingLatencyMs ?? 'N/A'} ms</span></p>
                    </div>

                    <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/50">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Document Storage Engine</span>
                        <div className="mt-1 flex items-center space-x-2">
                            <span className="text-sm font-extrabold text-amber-400">📁 {healthData.services?.storage?.provider}</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">Max Upload: <span className="text-stone-200 font-mono">10 MB</span></p>
                    </div>

                    <div className="bg-stone-800/60 p-4 rounded-xl border border-stone-700/50">
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Process Uptime</span>
                        <div className="mt-1 flex items-center space-x-2">
                            <span className="text-sm font-extrabold text-stone-100">{Math.floor((healthData.system?.uptimeSeconds || 0) / 60)} mins</span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-2">Node: <span className="text-stone-200 font-mono">{healthData.system?.nodeVersion}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
}

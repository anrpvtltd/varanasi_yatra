import React, { useState, useEffect } from 'react';

export default function AISettings({
    config,
    onSaveConfig,
    isUpdating = false
}) {
    const [formData, setFormData] = useState({
        dailyRunLimit: 200,
        maxConcurrentRuns: 5,
        maxToolCallsPerRun: 10,
        provider: 'mock',
        model: 'mock-deterministic-v1'
    });
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (config) {
            setFormData({
                dailyRunLimit: config.dailyRunLimit || 200,
                maxConcurrentRuns: config.maxConcurrentRuns || 5,
                maxToolCallsPerRun: config.maxToolCallsPerRun || 10,
                provider: config.provider || 'mock',
                model: config.model || 'mock-deterministic-v1'
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Limit') || name.includes('Runs') || name.includes('Calls') ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveSuccess(false);
        await onSaveConfig(formData);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div>
                <h3 className="text-base font-bold text-white">AI Gateway Operational Parameters</h3>
                <p className="text-xs text-slate-400">
                    Centralized throttles, safety budgets, and runtime provider configuration.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
                {saveSuccess && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                        <span>✓</span>
                        <span>Configuration updated successfully.</span>
                    </div>
                )}

                {/* Safety Throttles */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Operational Safety Limits
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Daily Run Limit
                            </label>
                            <input
                                type="number"
                                name="dailyRunLimit"
                                value={formData.dailyRunLimit}
                                onChange={handleChange}
                                min="10"
                                max="1000"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Prevents runaway cost or quota exhaustion.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Max Concurrent Runs
                            </label>
                            <input
                                type="number"
                                name="maxConcurrentRuns"
                                value={formData.maxConcurrentRuns}
                                onChange={handleChange}
                                min="1"
                                max="20"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Simultaneous agent tasks permitted.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Max Tools / Run
                            </label>
                            <input
                                type="number"
                                name="maxToolCallsPerRun"
                                value={formData.maxToolCallsPerRun}
                                onChange={handleChange}
                                min="1"
                                max="30"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Maximum internal tool dispatches per task.</p>
                        </div>
                    </div>
                </div>

                {/* Provider Configuration */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Inference Provider
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Runtime Provider
                            </label>
                            <select
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="mock">Deterministic Mock Provider (Default / Zero Cost)</option>
                                <option value="openai">OpenAI (Production)</option>
                                <option value="gemini">Google Gemini (Production)</option>
                                <option value="anthropic">Anthropic Claude (Production)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                Model Identifier
                            </label>
                            <input
                                type="text"
                                name="model"
                                value={formData.model}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Secret Isolation Notice */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-amber-400 font-bold">🔒</span>
                            <div>
                                <div className="text-xs text-slate-300 font-medium">Provider API Credentials</div>
                                <div className="text-[10px] text-slate-500">
                                    Stored exclusively in server-side environment variables. Never sent to browser.
                                </div>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                            CONFIGURED ON SERVER
                        </span>
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
                    >
                        {isUpdating ? 'Saving Parameters...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}

import React from 'react';

export default function BusinessRiskRadar({ risks = [] }) {
    if (!risks || risks.length === 0) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl text-center text-emerald-800 font-bold text-xs space-y-1">
                <span className="text-xl block">🛡️</span>
                <span>No operational or financial business risks detected. All systems healthy!</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest flex items-center space-x-2">
                    <span>📡 OPERATIONAL & FINANCIAL RISK RADAR</span>
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full">{risks.length}</span>
                </h3>
            </div>

            <div className="space-y-2">
                {risks.map((risk) => {
                    const isCrit = risk.severity === 'CRITICAL';
                    const isHigh = risk.severity === 'HIGH';

                    return (
                        <div
                            key={risk.id}
                            className={`p-3.5 rounded-2xl border flex items-start justify-between space-x-3 text-xs ${
                                isCrit ? 'bg-rose-50 border-rose-300' : isHigh ? 'bg-amber-50 border-amber-300' : 'bg-stone-50 border-stone-200'
                            }`}
                        >
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                        isCrit ? 'bg-rose-600 text-white' : isHigh ? 'bg-amber-600 text-white' : 'bg-stone-700 text-white'
                                    }`}>
                                        {risk.severity}
                                    </span>
                                    <h4 className="font-extrabold text-stone-900">{risk.title}</h4>
                                </div>
                                <p className="text-stone-600 font-medium text-[11px] leading-snug">{risk.description}</p>
                            </div>

                            {risk.financialImpact > 0 && (
                                <div className="text-right whitespace-nowrap">
                                    <span className="text-[10px] text-stone-400 font-extrabold uppercase block">Impact</span>
                                    <span className="font-extrabold text-rose-700">₹{risk.financialImpact.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

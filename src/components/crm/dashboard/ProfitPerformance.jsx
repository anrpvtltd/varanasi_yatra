import React from 'react';

export default function ProfitPerformance({ performance = {} }) {
    const { expectedProfit = 0, actualProfit = 0, profitVariance = 0, status = 'ON_TRACK' } = performance;

    const isAbove = status === 'ABOVE_EXPECTATION';
    const isLoss = status === 'LOSS';
    const isBelow = status === 'BELOW_EXPECTATION';

    return (
        <div className="bg-white border border-stone-200 p-5 rounded-3xl space-y-3 shadow-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest">
                    📈 PROFIT PERFORMANCE & MARGIN VARIANCE
                </h3>
                <span className={`px-3 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                    isAbove ? 'bg-emerald-100 text-emerald-800' :
                    isLoss ? 'bg-rose-100 text-rose-800' :
                    isBelow ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                    {isAbove ? '🟢 ABOVE EXPECTATION' : isLoss ? '🔴 LOSS' : isBelow ? '🟠 BELOW EXPECTATION' : '🟢 ON TRACK'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">Expected Profit</span>
                    <span className="text-base font-extrabold text-stone-800">₹{expectedProfit.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase block mb-1">Actual Realized Profit</span>
                    <span className="text-base font-extrabold text-emerald-900">₹{actualProfit.toLocaleString('en-IN')}</span>
                </div>
                <div className={`p-3 rounded-2xl border ${profitVariance < 0 ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <span className="text-[10px] text-stone-500 font-extrabold uppercase block mb-1">Profit Variance</span>
                    <span className={`text-base font-extrabold ${profitVariance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {profitVariance >= 0 ? '+' : ''}₹{profitVariance.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>
        </div>
    );
}

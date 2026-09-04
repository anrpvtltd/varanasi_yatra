import React from 'react';

export default function ProfitPerformance({ performance = {} }) {
    const { 
        expectedProfit = 0, 
        realizedProfit = null, 
        actualProfit = null, 
        profitVariance = null, 
        status = 'PENDING_REALIZATION' 
    } = performance;

    const profitVal = realizedProfit !== null && realizedProfit !== undefined ? realizedProfit : actualProfit;
    const isRealized = profitVal !== null && profitVal !== undefined;

    const isAbove = status === 'ABOVE_EXPECTATION';
    const isLoss = status === 'LOSS';
    const isBelow = status === 'BELOW_EXPECTATION';
    const isPending = status === 'PENDING_REALIZATION' || !isRealized;

    return (
        <div className="bg-white border border-stone-200 p-5 rounded-3xl space-y-3 shadow-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest">
                    📈 PROFIT PERFORMANCE & MARGIN VARIANCE
                </h3>
                <span className={`px-3 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                    isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    isAbove ? 'bg-emerald-100 text-emerald-800' :
                    isLoss ? 'bg-rose-100 text-rose-800' :
                    isBelow ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                    {isPending ? '🟠 PENDING REALIZATION' : isAbove ? '🟢 ABOVE EXPECTATION' : isLoss ? '🔴 LOSS' : isBelow ? '🟠 BELOW EXPECTATION' : '🟢 ON TRACK'}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase block mb-1">Expected Profit</span>
                    <span className="text-base font-extrabold text-stone-800">₹{(expectedProfit || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className={`p-3 rounded-2xl border ${isRealized ? 'bg-emerald-50 border-emerald-200' : 'bg-stone-50 border-dashed border-stone-300'}`}>
                    <span className={`text-[10px] font-extrabold uppercase block mb-1 ${isRealized ? 'text-emerald-700' : 'text-stone-400'}`}>
                        Actual Realized Profit
                    </span>
                    <span className={`font-extrabold ${isRealized ? 'text-base text-emerald-900' : 'text-xs text-amber-700'}`}>
                        {isRealized ? `₹${profitVal.toLocaleString('en-IN')}` : 'Not Yet Realized'}
                    </span>
                </div>
                <div className={`p-3 rounded-2xl border ${
                    !isRealized ? 'bg-stone-50 border-stone-200' :
                    profitVariance < 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                    <span className="text-[10px] text-stone-500 font-extrabold uppercase block mb-1">Profit Variance</span>
                    <span className={`font-extrabold ${
                        !isRealized ? 'text-xs text-stone-400' :
                        profitVariance < 0 ? 'text-base text-rose-700' : 'text-base text-emerald-700'
                    }`}>
                        {!isRealized ? 'N/A' : `${profitVariance >= 0 ? '+' : ''}₹${profitVariance.toLocaleString('en-IN')}`}
                    </span>
                </div>
            </div>
        </div>
    );
}

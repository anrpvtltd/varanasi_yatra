import React from 'react';

export default function FinancialCommandStrip({ strip = {} }) {
    const isRealized = strip.realizedProfit !== null && strip.realizedProfit !== undefined;

    return (
        <div className="bg-stone-900 text-white p-5 rounded-3xl space-y-4 shadow-xl border border-amber-500/30">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2">
                    <span className="font-serif font-extrabold text-sm text-amber-400 uppercase tracking-widest flex items-center space-x-2">
                        <span>👑 EXECUTIVE FINANCIAL COMMAND STRIP</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-3 py-0.5 rounded-full uppercase border border-amber-500/40">
                        Accrual & Cash Accounting
                    </span>
                </div>

                {/* Auxiliary Cash & Expense Telemetry */}
                <div className="flex items-center space-x-3 text-[11px]">
                    <div className="bg-stone-800 px-2.5 py-1 rounded-xl border border-stone-700 flex items-center space-x-1.5">
                        <span className="text-stone-400 font-bold">Liquid Cash:</span>
                        <span className="font-extrabold text-emerald-400">₹{(strip.netCashPosition || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(strip.businessExpenses || 0) > 0 && (
                        <div className="bg-stone-800 px-2.5 py-1 rounded-xl border border-stone-700 flex items-center space-x-1.5">
                            <span className="text-stone-400 font-bold">Expenses:</span>
                            <span className="font-extrabold text-stone-300">₹{(strip.businessExpenses || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(strip.passThroughTotal || 0) > 0 && (
                        <div className="bg-stone-800 px-2.5 py-1 rounded-xl border border-stone-700 flex items-center space-x-1.5">
                            <span className="text-stone-400 font-bold">Pass-Through:</span>
                            <span className="font-extrabold text-sky-400">₹{(strip.passThroughTotal || 0).toLocaleString('en-IN')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Core 8 Financial Command Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
                {/* 1. REVENUE */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700 flex flex-col justify-between">
                    <span className="text-[9px] text-stone-400 font-extrabold uppercase block mb-1">Revenue</span>
                    <span className="text-sm font-extrabold text-white">₹{(strip.totalRevenue || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-stone-500 mt-1 block">Active Bookings</span>
                </div>

                {/* 2. CASH COLLECTED */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700 flex flex-col justify-between">
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase block mb-1">Cash Collected</span>
                    <span className="text-sm font-extrabold text-emerald-400">₹{(strip.customerCashCollected || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-emerald-500/70 mt-1 block">Received Inflow</span>
                </div>

                {/* 3. CUSTOMER DUE */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700 flex flex-col justify-between">
                    <span className="text-[9px] text-amber-400 font-extrabold uppercase block mb-1">Customer Due</span>
                    <span className="text-sm font-extrabold text-amber-400">₹{(strip.customerOutstanding ?? strip.customerDue ?? 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-amber-500/70 mt-1 block">Receivables</span>
                </div>

                {/* 4. VENDOR COST */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700 flex flex-col justify-between">
                    <span className="text-[9px] text-purple-300 font-extrabold uppercase block mb-1">Vendor Cost</span>
                    <span className="text-sm font-extrabold text-purple-300">₹{(strip.plannedVendorCost ?? strip.vendorCost ?? 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-purple-400/70 mt-1 block">Planned Service Cost</span>
                </div>

                {/* 5. VENDOR PAID */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700 flex flex-col justify-between">
                    <span className="text-[9px] text-rose-300 font-extrabold uppercase block mb-1">Vendor Paid</span>
                    <span className="text-sm font-extrabold text-rose-300">₹{(strip.vendorPaymentsMade ?? strip.vendorPaid ?? 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-rose-400/70 mt-1 block">Cash Outflow</span>
                </div>

                {/* 6. VENDOR DUE */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700 flex flex-col justify-between">
                    <span className="text-[9px] text-rose-400 font-extrabold uppercase block mb-1">Vendor Due</span>
                    <span className="text-sm font-extrabold text-rose-400">₹{(strip.vendorOutstanding ?? strip.vendorDue ?? 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-rose-400/70 mt-1 block">Pending Payables</span>
                </div>

                {/* 7. EXPECTED PROFIT */}
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-amber-500/40 flex flex-col justify-between">
                    <span className="text-[9px] text-amber-400 font-extrabold uppercase block mb-1">Expected Profit</span>
                    <span className="text-sm font-extrabold text-amber-300">₹{(strip.expectedProfit || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[8px] text-amber-400/70 mt-1 block">Rev - Cost + Comm</span>
                </div>

                {/* 8. REALIZED PROFIT */}
                <div className={`p-3 rounded-2xl border shadow-md flex flex-col justify-between ${
                    isRealized 
                        ? 'bg-emerald-700/90 border-emerald-400 text-white' 
                        : 'bg-stone-800/90 border-dashed border-stone-600 text-stone-300'
                }`}>
                    <span className={`text-[9px] font-extrabold uppercase block mb-1 ${isRealized ? 'text-emerald-100' : 'text-stone-400'}`}>
                        Realized Profit
                    </span>
                    <span className={`font-extrabold tracking-tight ${
                        isRealized ? 'text-sm text-white' : 'text-xs text-amber-300'
                    }`}>
                        {isRealized ? `₹${strip.realizedProfit.toLocaleString('en-IN')}` : 'Not Yet Realized'}
                    </span>
                    <span className={`text-[8px] mt-1 block ${isRealized ? 'text-emerald-200' : 'text-stone-500'}`}>
                        {isRealized ? 'Settled Margin' : 'Pending Cost Realization'}
                    </span>
                </div>
            </div>
        </div>
    );
}

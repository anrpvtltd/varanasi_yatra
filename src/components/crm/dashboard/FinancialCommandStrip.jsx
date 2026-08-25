import React from 'react';

export default function FinancialCommandStrip({ strip = {} }) {
    return (
        <div className="bg-stone-900 text-white p-5 rounded-3xl space-y-4 shadow-xl border border-amber-500/30">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                <h3 className="font-serif font-extrabold text-sm text-amber-400 uppercase tracking-widest flex items-center space-x-2">
                    <span>👑 EXECUTIVE FINANCIAL COMMAND STRIP</span>
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-3 py-1 rounded-full uppercase border border-amber-500/40">
                    Real-Time Cash Flow
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-stone-400 font-extrabold uppercase block mb-1">Total Revenue</span>
                    <span className="text-sm font-extrabold text-white">₹{(strip.totalRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase block mb-1">Cash Collected</span>
                    <span className="text-sm font-extrabold text-emerald-400">₹{(strip.customerCashCollected || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-amber-400 font-extrabold uppercase block mb-1">Customer Due</span>
                    <span className="text-sm font-extrabold text-amber-400">₹{(strip.customerOutstanding || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-rose-300 font-extrabold uppercase block mb-1">Vendor Paid</span>
                    <span className="text-sm font-extrabold text-rose-300">₹{(strip.vendorPaymentsMade || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-rose-400 font-extrabold uppercase block mb-1">Vendor Due</span>
                    <span className="text-sm font-extrabold text-rose-400">₹{(strip.vendorOutstanding || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-stone-400 font-extrabold uppercase block mb-1">Overhead Exp</span>
                    <span className="text-sm font-extrabold text-stone-300">₹{(strip.businessExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-stone-800/90 p-3 rounded-2xl border border-stone-700">
                    <span className="text-[9px] text-amber-300 font-extrabold uppercase block mb-1">Net Cash Pos</span>
                    <span className="text-sm font-extrabold text-amber-300">₹{(strip.netCashPosition || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-amber-600 text-white p-3 rounded-2xl border border-amber-400 shadow-md">
                    <span className="text-[9px] text-amber-100 font-extrabold uppercase block mb-1">Actual Profit</span>
                    <span className="text-sm font-extrabold text-white">₹{(strip.actualProfit || 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
}

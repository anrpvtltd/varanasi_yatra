import React from 'react';

export default function RevenueOverviewChart({ cash, outstanding }) {
    const total = cash + outstanding;
    const cashPercent = total > 0 ? Math.round((cash / total) * 100) : 0;
    const outstandingPercent = total > 0 ? Math.round((outstanding / total) * 100) : 0;

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (cash / (total || 1)) * circumference;

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-full">
            <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>💰</span>
                    <span>Revenue Overview</span>
                </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            className="stroke-rose-100"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        {total > 0 && (
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                className="stroke-emerald-600 transition-all duration-500 ease-out"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total expected</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5">₹{total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-3.5 w-full sm:w-auto min-w-[140px]">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
                            <span className="text-slate-500 font-medium">Cash Collected</span>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">₹{cash.toLocaleString()}</p>
                            <p className="text-[9px] text-emerald-600 font-semibold">{cashPercent}%</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-rose-200 rounded-full"></span>
                            <span className="text-slate-500 font-medium">Outstanding</span>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">₹{outstanding.toLocaleString()}</p>
                            <p className="text-[9px] text-rose-600 font-semibold">{outstandingPercent}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';

export default function BusinessAttentionPanel({ pendingCount, outstandingAmount, confirmedCount }) {
    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs mb-8">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                <span className="text-slate-900">🔔</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Business Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                <div className="flex items-center space-x-3.5 py-3.5 px-4 bg-rose-50/40 border border-rose-100/80 rounded-xl">
                    <span className="text-2xl">🔴</span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Waiting Follow-up</p>
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{pendingCount}</strong> leads waiting in queue
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3.5 py-3.5 px-4 bg-amber-50/40 border border-amber-100/80 rounded-xl">
                    <span className="text-2xl">🟡</span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Payments Outstanding</p>
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">₹{outstandingAmount.toLocaleString()}</strong> remains outstanding
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3.5 py-3.5 px-4 bg-emerald-50/40 border border-emerald-100/80 rounded-xl">
                    <span className="text-2xl">🟢</span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Trips Confirmed</p>
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{confirmedCount}</strong> bookings ready to execute
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

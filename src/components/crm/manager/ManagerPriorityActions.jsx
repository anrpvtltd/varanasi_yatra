import React from 'react';

export default function ManagerPriorityActions({ pendingCount, inProgressCount, confirmedCount }) {
    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                    <span className="text-amber-500">⚡</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Priority Actions</h3>
                </div>
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition">
                        <span className="text-lg">🔴</span>
                        <span className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{pendingCount}</strong> pending leads require follow-up
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition border-t border-slate-100 pt-3">
                        <span className="text-lg">🟡</span>
                        <span className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{inProgressCount}</strong> active leads are currently in progress
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition border-t border-slate-100 pt-3">
                        <span className="text-lg">🟢</span>
                        <span className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{confirmedCount}</strong> confirmed trips require operational planning
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

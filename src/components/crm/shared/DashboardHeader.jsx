import React from 'react';

export default function DashboardHeader({ title, subtitle, onAddLead, onSync, onLogout, userIcon }) {
    return (
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="space-y-1.5 z-10">
                <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{userIcon}</span>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                </div>
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </div>
            <div className="mt-4 sm:mt-0 z-10 flex flex-wrap gap-3">
                <button
                    onClick={onAddLead}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm shadow-amber-600/10 flex items-center space-x-1.5"
                >
                    <span>➕</span>
                    <span>Add Manual Lead</span>
                </button>
                <button
                    onClick={onSync}
                    className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm"
                >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Sync Data</span>
                </button>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm"
                >
                    <span>🔒</span>
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
}

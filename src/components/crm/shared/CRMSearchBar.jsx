import React from 'react';

export default function CRMSearchBar({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, filteredCount }) {
    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
            {/* Search query box */}
            <div className="w-full md:max-w-xl relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="Search by customer, mobile, email, destination, pickup, vehicle, or driver..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all text-slate-800 placeholder-slate-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer"
                    >
                        &times;
                    </button>
                )}
            </div>

            {/* Filter and reset helpers */}
            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3.5">
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                    Showing: <span className="text-slate-800 font-extrabold">{statusFilter}</span> ({filteredCount})
                </span>
                {(statusFilter !== 'All' || searchQuery) && (
                    <button
                        onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
                        className="text-[10px] uppercase tracking-wider font-bold text-amber-600 hover:text-amber-800 px-3.5 py-2 bg-amber-50/60 rounded-lg transition cursor-pointer"
                    >
                        Reset Filters
                    </button>
                )}
            </div>
        </div>
    );
}

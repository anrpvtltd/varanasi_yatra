import React from 'react';

export default function DocumentStatusBadge({ status }) {
    const styles = {
        READY: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        GENERATING: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse',
        CREATED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        FAILED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        ARCHIVED: 'bg-slate-800 text-slate-400 border-slate-700'
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.READY}`}>
            {status || 'READY'}
        </span>
    );
}

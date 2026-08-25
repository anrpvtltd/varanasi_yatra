import React from 'react';

export default function PriorityQueue({ priorities = [], onActionClick }) {
    if (!priorities || priorities.length === 0) {
        return (
            <div className="bg-stone-50 border border-dashed border-stone-200 p-6 rounded-3xl text-center text-stone-400 font-bold text-xs">
                ✨ No urgent operational priorities right now. All trips and follow-ups are on track!
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest flex items-center space-x-2">
                    <span>⚡ TODAY'S ACTION PRIORITIES</span>
                    <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full">{priorities.length}</span>
                </h3>
                <span className="text-[10px] text-stone-400 font-semibold">Sorted by Urgency Score</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorities.map((item) => {
                    const isCrit = item.priority === 'CRITICAL';
                    const isHigh = item.priority === 'HIGH';
                    const isMed = item.priority === 'MEDIUM';

                    return (
                        <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                                isCrit
                                    ? 'bg-rose-50/80 border-rose-300'
                                    : isHigh
                                    ? 'bg-amber-50/80 border-amber-300'
                                    : isMed
                                    ? 'bg-blue-50/70 border-blue-200'
                                    : 'bg-stone-50 border-stone-200'
                            }`}
                        >
                            <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                        isCrit ? 'bg-rose-600 text-white' : isHigh ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                                    }`}>
                                        {isCrit ? '🔴 CRITICAL' : isHigh ? '🟠 HIGH' : '🟡 MEDIUM'}
                                    </span>
                                    <span className="text-[10px] text-stone-400 font-extrabold">Score: {item.score}/100</span>
                                </div>

                                <h4 className="text-xs font-extrabold text-stone-900 mt-1">{item.title}</h4>
                                <p className="text-xs text-stone-600 font-medium leading-snug">{item.description}</p>
                            </div>

                            <div className="pt-2 border-t border-stone-200/60 flex justify-between items-center">
                                <span className="text-[10px] text-stone-500 font-bold">Due: {item.dueDate}</span>
                                <button
                                    type="button"
                                    onClick={() => onActionClick && onActionClick(item)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer ${
                                        isCrit ? 'bg-rose-700 hover:bg-rose-800 text-white' : 'bg-stone-900 hover:bg-stone-950 text-white'
                                    }`}
                                >
                                    {item.navigationTarget === 'BOOKING_DRAWER' ? 'OPEN BOOKING' : item.navigationTarget === 'LEAD_DRAWER' ? 'OPEN LEAD' : 'TAKE ACTION'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

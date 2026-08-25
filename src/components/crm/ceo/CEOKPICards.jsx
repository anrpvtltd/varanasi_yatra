import React from 'react';

export default function CEOKPICards({ stats }) {
    const ceoMetrics = [
        { title: "Total Leads", icon: "📊", value: stats.totalLeads, textColor: "text-slate-400" },
        { title: "Conversion Rate", icon: "📈", value: `${stats.conversionRate}%`, textColor: "text-amber-600" },
        { title: "Cash Collected", icon: "💵", value: `₹${stats.totalCashInHand.toLocaleString()}`, textColor: "text-emerald-700" },
        { title: "Outstanding", icon: "💳", value: `₹${stats.totalOutstanding.toLocaleString()}`, textColor: "text-rose-700" }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {ceoMetrics.map((card) => (
                <div
                    key={card.title}
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs"
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[10px] uppercase tracking-wider font-extrabold ${card.textColor}`}>{card.title}</p>
                        <span className="text-sm">{card.icon}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">{card.value}</p>
                </div>
            ))}
        </div>
    );
}

import React from 'react';

export default function ManagerKPICards({ stats, statusFilter, setStatusFilter }) {
    const managerMetrics = [
        { title: "Total Leads", icon: "📊", value: stats.totalLeads, textColor: "text-slate-400", statusValue: "All", selectedBorder: "border-slate-400", ringColor: "ring-slate-400/25", selectedBg: "bg-slate-50/40", hoverBorder: "hover:border-slate-350" },
        { title: "Action Required", icon: "⏳", value: stats.pendingLeads, textColor: "text-amber-600", statusValue: "Pending", selectedBorder: "border-amber-500", ringColor: "ring-amber-500/20", selectedBg: "bg-amber-50/20", hoverBorder: "hover:border-amber-300" },
        { title: "In Progress", icon: "📞", value: stats.inProgressLeads, textColor: "text-blue-600", statusValue: "In-Progress", selectedBorder: "border-blue-500", ringColor: "ring-blue-500/20", selectedBg: "bg-blue-50/20", hoverBorder: "hover:border-blue-300" },
        { title: "Confirmed", icon: "🔒", value: stats.confirmedLeads, textColor: "text-emerald-600", statusValue: "Confirmed", selectedBorder: "border-emerald-500", ringColor: "ring-emerald-500/20", selectedBg: "bg-emerald-50/20", hoverBorder: "hover:border-emerald-300" },
        { title: "Completed", icon: "✨", value: stats.completedLeads, textColor: "text-teal-700", statusValue: "Completed", selectedBorder: "border-teal-500", ringColor: "ring-teal-500/20", selectedBg: "bg-teal-50/20", hoverBorder: "hover:border-teal-300" }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mb-8">
            {managerMetrics.map((card) => {
                const isSelected = statusFilter === card.statusValue;
                return (
                    <div
                        key={card.title}
                        onClick={() => setStatusFilter(card.statusValue)}
                        className={`bg-white p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                            isSelected
                                ? `${card.selectedBorder} shadow-sm ring-1 ${card.ringColor} ${card.selectedBg}`
                                : `border-slate-200/80 ${card.hoverBorder} shadow-xs`
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <p className={`text-[10px] uppercase tracking-wider font-bold ${card.textColor}`}>{card.title}</p>
                            <span className="text-xs">{card.icon}</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">{card.value}</p>
                    </div>
                );
            })}
        </div>
    );
}

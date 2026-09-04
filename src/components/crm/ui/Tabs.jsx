import React from 'react';

/**
 * Standard CRM Segmented Tabs Component
 */
export default function Tabs({
    tabs = [], // [{ id, label, count, icon }]
    activeTab,
    onChange,
    variant = 'segmented', // 'segmented' | 'underline'
    className = ''
}) {
    if (variant === 'underline') {
        return (
            <div className={`flex items-center space-x-6 border-b border-slate-200 text-xs font-semibold ${className}`}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange && onChange(tab.id)}
                            className={`pb-3 relative transition-colors cursor-pointer flex items-center space-x-2 ${
                                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.icon && <span className="text-sm">{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                            {isActive && (
                                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Default 'segmented' pills container
    return (
        <div className={`inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 select-none ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange && onChange(tab.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center space-x-1.5 ${
                            isActive
                                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                    >
                        {tab.icon && <span className="text-xs">{tab.icon}</span>}
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/70 text-slate-600'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

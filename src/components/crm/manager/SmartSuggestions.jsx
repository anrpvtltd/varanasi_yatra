import React from 'react';
import { generateSmartSuggestions } from '../../../utils/smartSuggestions';

export default function SmartSuggestions({ leads }) {
    const suggestions = generateSmartSuggestions(leads);
    if (suggestions.length === 0) return null;

    return (
        <div className="bg-white border border-amber-200/60 p-5 rounded-2xl shadow-xs mb-6">
            <div className="flex items-center space-x-2 border-b border-amber-100 pb-3 mb-3">
                <span className="text-amber-500">💡</span>
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Smart Suggestions</h3>
            </div>
            <div className="space-y-2.5">
                {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-700 font-medium">
                        <span className="text-amber-400 mt-0.5 text-[10px]">▸</span>
                        <span>{s}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

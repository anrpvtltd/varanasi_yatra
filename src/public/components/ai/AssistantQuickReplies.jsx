import React from 'react';

export default function AssistantQuickReplies({ options = [], onSelect, disabled = false }) {
    if (!options || options.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 pt-2 pb-1" role="group" aria-label="Suggested quick responses">
            {options.map((option, idx) => (
                <button
                    key={`${option}-${idx}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(option)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-amber-400 active:scale-95"
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

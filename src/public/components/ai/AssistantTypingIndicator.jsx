import React from 'react';

export default function AssistantTypingIndicator() {
    return (
        <div className="flex items-center gap-2 py-2 px-3 bg-stone-800/80 rounded-2xl rounded-bl-sm border border-stone-700/60 w-fit text-stone-400 text-xs shadow-sm">
            <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span className="ml-1 text-[11px] font-medium text-stone-400">Assistant is typing...</span>
        </div>
    );
}

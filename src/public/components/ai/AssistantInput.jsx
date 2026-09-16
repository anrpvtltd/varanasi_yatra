import React, { useState, useRef, useEffect } from 'react';

export default function AssistantInput({ onSend, disabled = false, placeholder = "Type your requirements..." }) {
    const [text, setText] = useState('');
    const inputRef = useRef(null);
    const MAX_CHARS = 500;

    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || disabled || trimmed.length > MAX_CHARS) return;
        onSend(trimmed);
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-stone-900 border-t border-stone-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    disabled={disabled}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={MAX_CHARS}
                    placeholder={placeholder}
                    className="flex-1 bg-stone-800 text-stone-100 placeholder-stone-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors disabled:opacity-50"
                    aria-label="Message for Kashi-Vashi Travel Assistant"
                />

                <button
                    type="submit"
                    disabled={disabled || !text.trim() || text.length > MAX_CHARS}
                    className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-sm"
                    aria-label="Send message"
                >
                    <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </div>

            {text.length > 350 && (
                <div className="flex justify-end pr-1 text-[10px] text-stone-400">
                    <span className={text.length >= MAX_CHARS ? 'text-rose-400 font-bold' : ''}>
                        {text.length}/{MAX_CHARS}
                    </span>
                </div>
            )}
        </form>
    );
}

import React, { useEffect } from 'react';

/**
 * Standard CRM Modal Dialog Component
 */
export default function Modal({
    isOpen = false,
    onClose,
    title,
    subtitle,
    children,
    footer = null,
    maxWidth = 'max-w-xl', // max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl | max-w-4xl
    className = ''
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                if (onClose) onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                aria-hidden="true"
            />

            {/* Modal Dialog Box */}
            <div
                className={`relative w-full ${maxWidth} bg-white rounded-2xl border border-slate-200 shadow-[0_20px_48px_rgba(15,23,42,0.16)] overflow-hidden text-left z-10 select-text animate-fadeIn ${className}`}
            >
                {/* Header */}
                {(title || subtitle) && (
                    <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
                        <div>
                            {title && <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
                            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            aria-label="Close modal"
                        >
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto space-y-4 text-xs text-slate-700">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

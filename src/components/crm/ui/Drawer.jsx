import React, { useEffect } from 'react';

/**
 * Standard Reusable Right-Side Slide-Over Drawer
 */
export default function Drawer({
    isOpen = false,
    onClose,
    title,
    subtitle,
    badge = null,
    identity = null, // { name, phone, email, id, stage }
    footer = null,
    children,
    width = 'max-w-2xl', // default ~672px on desktop
    className = ''
}) {
    // Handle ESC key press to close drawer
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
        <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fadeIn">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                aria-hidden="true"
            />

            {/* Slide-over panel */}
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                <div
                    className={`w-screen ${width} bg-white shadow-[-4px_0_24px_rgba(15,23,42,0.12)] border-l border-slate-200/90 flex flex-col justify-between text-left select-text ${className}`}
                >
                    {/* Header */}
                    <div className="px-6 py-4.5 border-b border-slate-200/80 bg-white sticky top-0 z-10 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center space-x-2.5">
                                    <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
                                    {badge && <span className="shrink-0">{badge}</span>}
                                </div>
                                {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                aria-label="Close drawer"
                            >
                                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Customer / Entity Identity Banner */}
                        {identity && (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div className="flex items-center space-x-2.5">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                        {(identity.name || 'G')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 block">{identity.name || 'Guest'}</span>
                                        <span className="text-[11px] text-slate-500 block">{identity.phone || identity.email || 'No contact specified'}</span>
                                    </div>
                                </div>

                                {identity.id && (
                                    <span className="text-[10px] font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                        ID: {identity.id}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
                        {children}
                    </div>

                    {/* Sticky Footer */}
                    {footer && (
                        <div className="px-6 py-3.5 bg-white border-t border-slate-200/80 sticky bottom-0 z-10 flex items-center justify-end space-x-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

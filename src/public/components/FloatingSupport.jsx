import React, { useState, useEffect } from 'react';
import { trackWhatsAppClick, trackCallClick } from '../utils/analytics';

export default function FloatingSupport() {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <aside aria-label="Quick Support" className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
            {/* Back to top - only visible when scrolled down */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="w-10 h-10 rounded-full bg-stone-900/90 text-stone-300 hover:text-white hover:bg-stone-850 shadow-lg border border-stone-800 flex items-center justify-center transition transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-sm"
                    aria-label="Scroll back to top"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            )}

            {/* Quick Call Helpline (compact icon on mobile, hidden if screen too small) */}
            <a
                href="tel:+918400554029"
                onClick={() => trackCallClick('floating_support')}
                className="hidden sm:inline-flex items-center gap-1.5 bg-stone-900/90 hover:bg-stone-900 text-stone-200 hover:text-white px-3 py-2 rounded-full shadow-lg border border-stone-800 text-xs font-semibold backdrop-blur-sm transition transform hover:scale-105 active:scale-95"
                aria-label="Call Varanasi Yatra Helpline"
            >
                <svg className="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 24 24">
                    <path d="M21.384 17.791c-1.115-1.115-2.6-1.115-3.715 0l-.821.821c-.151.151-.377.197-.577.121-2.282-.873-4.14-2.732-5.014-5.014-.076-.2-.03-.426.121-.577l.821-.821c1.115-1.115 1.115-2.6 0-3.715L10.36 6.769C9.245 5.654 7.6 5.654 6.485 6.769l-.821.821c-1.354 1.354-1.815 3.324-1.189 5.176 1.488 4.407 4.966 7.886 9.373 9.373 1.853.626 3.823.165 5.176-1.189l.821-.821c1.115-1.115 1.115-2.6 0-3.715l-1.838-1.838z"/>
                </svg>
                <span>Call Help</span>
            </a>

            {/* Compact WhatsApp Pill - Non-obstructive */}
            <a
                href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20would%20like%20assistance%20with%20planning%20my%20trip."
                target="_blank"
                rel="noreferrer"
                onClick={() => trackWhatsAppClick('floating_support_pill')}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-full shadow-xl text-xs font-bold transition transform hover:scale-105 active:scale-95 border border-emerald-500/60"
                aria-label="Chat on WhatsApp"
            >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.845-4.414 9.848-9.847.002-2.632-1.023-5.105-2.887-6.97C17.152 1.922 14.68 .898 12.01 .898c-5.43 0-9.847 4.414-9.85 9.849-.001 1.932.501 3.815 1.455 5.421L2.642 22.28l6.005-1.574zM17.92 14.87c-.318-.16-1.877-.926-2.162-1.03-.285-.104-.493-.155-.7.156-.207.31-.8.926-.98 1.132-.18.207-.36.233-.678.074-1.69-.844-2.8-1.522-3.922-3.447-.297-.51.297-.474.85-1.583.093-.187.047-.35-.023-.454-.07-.104-.7-1.682-.958-2.306-.252-.603-.509-.522-.7-.522-.181-.001-.389-.001-.597-.001-.207 0-.544.078-.83.392-.285.31-1.088 1.065-1.088 2.597 0 1.532 1.114 3.013 1.27 3.22.155.207 2.193 3.349 5.313 4.699.742.32 1.322.512 1.774.656.745.237 1.423.204 1.959.124.598-.09 1.877-.767 2.137-1.474.26-.707.26-1.316.182-1.443-.078-.127-.285-.207-.604-.367z" />
                </svg>
                <span>WhatsApp</span>
            </a>
        </aside>
    );
}

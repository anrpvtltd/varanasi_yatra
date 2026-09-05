import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { trackWhatsAppClick } from '../utils/analytics';

export default function PublicHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Close mobile drawer on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Disable body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const navLinks = [
        { name: 'Experiences', href: '/experiences' },
        { name: 'Tours', href: '/tours' },
        { name: 'Destinations', href: '/destinations' },
        { name: 'Hotels', href: '/hotels' },
        { name: 'Travel Guide', href: '/travel-guide' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' }
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <header className="bg-stone-950 text-white sticky top-0 z-50 border-b border-stone-900 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">

                {/* Left Side: Logo & Brand Standardization (Varanasi Yatra, NOT an H1) */}
                <Link to="/" className="flex items-center space-x-3 group" aria-label="Varanasi Yatra Home">
                    <img
                        src={logoImg}
                        alt="Varanasi Yatra Emblem"
                        className="w-9 h-9 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div>
                        <span className="text-base font-serif font-black tracking-wider text-white uppercase leading-none block">
                            Varanasi Yatra
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-amber-500 block mt-0.5">
                            Spiritual & Heritage Journeys
                        </span>
                    </div>
                </Link>

                {/* Center: Desktop Navigation Links */}
                <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-stone-300">
                    {navLinks.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`transition-colors py-1 relative ${
                                    active
                                        ? 'text-amber-500'
                                        : 'hover:text-amber-400 text-stone-300'
                                }`}
                            >
                                {item.name}
                                {active && (
                                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side: WhatsApp & Plan My Trip CTA (Desktop) */}
                <div className="hidden sm:flex items-center space-x-3">
                    <a
                        href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20would%20like%20to%20plan%20my%20trip."
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWhatsAppClick('header_desktop')}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-950/30 transition flex items-center gap-1.5"
                        aria-label="Chat on WhatsApp"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>WhatsApp</span>
                    </a>

                    <Link
                        to="/plan-your-trip"
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition shadow-md transform hover:scale-[1.02] active:scale-95 text-center"
                    >
                        Plan My Trip
                    </Link>
                </div>

                {/* Mobile Menu Hamburger Button */}
                <div className="flex sm:hidden items-center space-x-2">
                    <Link
                        to="/plan-your-trip"
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        Plan
                    </Link>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 text-stone-300 hover:text-white rounded-lg hover:bg-stone-900 transition focus:outline-none focus:ring-2 focus:ring-amber-500"
                        aria-expanded={isOpen}
                        aria-label="Toggle navigation menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Slide-Over Drawer */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 top-[53px] z-50 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 flex flex-col p-6 overflow-y-auto">
                    <div className="flex flex-col space-y-4 text-sm font-bold uppercase tracking-wider text-stone-200">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`py-2 border-b border-stone-800/80 flex items-center justify-between ${
                                    isActive(item.href) ? 'text-amber-500' : 'hover:text-amber-400'
                                }`}
                            >
                                <span>{item.name}</span>
                                <span className="text-stone-600">➔</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col space-y-3">
                        <Link
                            to="/plan-your-trip"
                            onClick={() => setIsOpen(false)}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white text-center py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider shadow-md"
                        >
                            Plan My Trip
                        </Link>

                        <a
                            href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20would%20like%20to%20plan%20my%20trip."
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => {
                                setIsOpen(false);
                                trackWhatsAppClick('mobile_drawer');
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center py-3 rounded-xl font-bold text-xs tracking-wider shadow-sm flex items-center justify-center gap-2"
                        >
                            <span>Chat on WhatsApp (+91-8149783494)</span>
                        </a>

                        <a
                            href="tel:+918400554029"
                            className="w-full bg-stone-900 text-stone-300 text-center py-2.5 rounded-xl text-xs font-semibold border border-stone-800 flex items-center justify-center gap-1.5"
                        >
                            <span>Helpline: +91-8400554029</span>
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}

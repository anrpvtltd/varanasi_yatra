import React, { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    // Disable body scroll when menu is open
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

    return (
        <header className="bg-stone-950 text-white sticky top-0 z-50 border-b border-stone-900 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">

                {/* Left Side: Logo & Brand Grouping */}
                <div className="flex items-center space-x-3">
                    <img src={logoImg} alt="Banaras Yatra Logo" className="w-9 h-9 object-contain flex-shrink-0" />
                    <div>
                        <h1 className="text-base font-serif font-black tracking-wider text-white uppercase leading-none">
                            Banaras Yatra
                        </h1>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-orange-500 block mt-0.5">
                            Travel & Tours
                        </span>
                    </div>
                </div>

                <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-stone-300">
                    <a href="/#home" className="hover:text-orange-500 transition-colors">Home</a>
                    <a href="/#about" className="hover:text-orange-500 transition-colors">About Us</a>
                    <a href="/#packages" className="hover:text-orange-500 transition-colors">Tour Packages</a>
                    <a href="/#destinations" className="hover:text-orange-500 transition-colors">Destinations</a>
                    <a href="/#services" className="hover:text-orange-500 transition-colors">Services</a>
                    <a href="/#gallery" className="hover:text-orange-500 transition-colors">Gallery</a>
                    <a href="/#faq" className="hover:text-orange-500 transition-colors">FAQ</a>
                </nav>

                {/* Right Side: Direct Helpline, Booking Button, & Mobile Hamburger */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="hidden sm:block text-right">
                        <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider">Direct Helpline</span>
                        <a href="tel:+918400554029" className="text-xs font-mono font-bold text-orange-500 hover:underline">
                            +91-8400554029
                        </a>
                    </div>

                    <a
                        href="#booking-form"
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition shadow-md transform hover:scale-[1.02] active:scale-95 cursor-pointer text-center"
                    >
                        Enquire
                    </a>

                    {/* Accessible Hamburger Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        type="button"
                        className="lg:hidden text-stone-400 hover:text-white p-1 rounded-md focus:outline-none"
                        aria-expanded={isOpen}
                        aria-label="Toggle navigation menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

            </div>

            {/* Slide-out Backdrop Overlay (Closes menu on clicking outside) */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Slide-out Mobile Navigation Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-stone-950 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                role="dialog"
                aria-label="Mobile navigation"
            >
                <div className="flex justify-end p-4">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-stone-400 hover:text-white focus:outline-none"
                        aria-label="Close menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="px-6 py-2 flex flex-col space-y-4 text-xs font-bold uppercase tracking-wider text-stone-300">
                    <a href="/#home" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">Home</a>
                    <a href="/#about" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">About Us</a>
                    <a href="/#packages" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">Tour Packages</a>
                    <a href="/#destinations" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">Destinations</a>
                    <a href="/#services" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">Services</a>
                    <a href="/#gallery" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">Gallery</a>
                    <a href="/#faq" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors py-1 block">FAQ</a>
                    
                    <div className="pt-4 border-t border-stone-900">
                        <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider mb-1">Direct Helpline</span>
                        <a href="tel:+918400554029" className="text-xs font-mono font-bold text-orange-500">
                            +91-8400554029
                        </a>
                    </div>
                </nav>
            </div>
        </header>
    );
}
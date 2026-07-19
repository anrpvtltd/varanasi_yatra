import React, { useState } from 'react';
import logoImg from '../assets/logo.png';

export default function Footer() {
    const [blogText, setBlogText] = useState("Read Our Travel Blog");
    const [isComingSoon, setIsComingSoon] = useState(false);

    // Navigation arrays
    const quickLinks = [
        { name: "Home", href: "/" },
        { name: "About Us", href: "/#about" },
        { name: "Tour Packages", href: "/#packages" },
        { name: "Services", href: "/#services" },
        { name: "Gallery", href: "/#gallery" },
        { name: "FAQ", href: "/#faq" },
        { name: "Contact Us", href: "/#booking-form" }
    ];

    const topDestinations = [
        { name: "Varanasi (Kashi)", href: "/destinations/varanasi" },
        { name: "Ayodhya Ji", href: "/destinations/ayodhya" },
        { name: "Bodh Gaya Circuit", href: "/destinations/bodh-gaya" },
        { name: "Chunar Fort Heritage", href: "/destinations/chunar" },
        { name: "Mirzapur Vindhyachal", href: "/destinations/vindhyachal" },
        { name: "Nepal Gateway", href: "/destinations/nepal" }
    ];

    const handleBlogClick = (e) => {
        e.preventDefault();
        if (isComingSoon) return;

        setIsComingSoon(true);
        setBlogText("Stories Launching Soon! 🕒");

        setTimeout(() => {
            setBlogText("Read Our Travel Blog");
            setIsComingSoon(false);
        }, 3000);
    };

    return (
        <footer className="bg-stone-950 text-stone-400 pt-16 pb-8 border-t border-stone-900 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

                {/* Column 1: Brand Pitch Statement + Social Icons + Blog Button */}
                <div className="space-y-5 select-none">
                    <div className="flex items-center space-x-3">
                        <img src={logoImg} alt="Banaras Yatra Logo" className="w-10 h-10 object-contain flex-shrink-0" />
                        <div>
                            <h3 className="text-white font-serif font-bold text-lg leading-tight uppercase tracking-wider">
                                Banaras Yatra
                            </h3>
                            <p className="text-[10px] uppercase font-bold text-orange-500 tracking-widest">
                                Travel & Tours Operator
                            </p>
                        </div>
                    </div>

                    <p className="text-xs leading-relaxed text-stone-500 select-text">
                        Providing spiritual pilgrimages, private transport bookings, and customized tour plans across Varanasi, Ayodhya, Bihar, and Nepal with local trust and safety.
                    </p>

                    {/* Social Media Icon Row */}
                    <div className="space-y-2 pt-2">
                        <span className="block text-[10px] font-bold tracking-widest text-stone-600 uppercase">Connect With Us</span>
                        <div className="flex flex-wrap items-center gap-2.5">

                            {/* 1. Instagram */}
                            <a href="https://instagram.com/info.varanasi.yatra" target="_blank" rel="noreferrer" title="Instagram" className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-600 hover:to-purple-600 hover:text-white transform hover:scale-110 hover:-translate-y-1 transition-all duration-200 shadow-md text-stone-400">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
                            </a>

                            {/* 2. YouTube */}
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" title="YouTube" className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center hover:bg-red-600 hover:text-white transform hover:scale-110 hover:-translate-y-1 transition-all duration-200 shadow-md text-stone-400">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>

                            {/* 3. Facebook */}
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transform hover:scale-110 hover:-translate-y-1 transition-all duration-200 shadow-md text-stone-400">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                            </a>

                            {/* 4. LinkedIn */}
                            <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn" className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center hover:bg-blue-700 hover:text-white transform hover:scale-110 hover:-translate-y-1 transition-all duration-200 shadow-md text-stone-400">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </a>

                            {/* 5. Threads */}
                            <a href="https://threads.net" target="_blank" rel="noreferrer" title="Threads" className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center hover:bg-white hover:text-black transform hover:scale-110 hover:-translate-y-1 transition-all duration-200 shadow-md text-stone-400">
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.686 2.568c2.28 0 4.296.84 5.676 2.376.624.696.48 1.704-.264 2.244-.672.492-1.608.384-2.172-.276-.9-.996-2.124-1.536-3.468-1.536-2.928 0-5.352 2.148-5.352 5.592 0 3.396 2.34 5.616 5.352 5.616 1.776 0 3.144-.648 4.092-1.824.3-.372.24-.912-.132-1.212s-.912-.24-1.212.132c-.624.78-1.572 1.188-2.748 1.188-1.956 0-3.564-1.428-3.66-3.612h7.824c.72 0 1.308-.54 1.38-1.26.168-1.68-.084-3.516-1.128-4.908-1.272-1.704-3.396-2.52-5.916-2.52-4.572 0-8.244 3.516-8.244 8.664 0 5.256 3.864 8.784 8.796 8.784 2.22 0 4.296-.696 5.868-1.968.648-.528 1.596-.408 2.088.252.468.636.336 1.548-.288 2.052-2.1 1.716-4.884 2.64-7.896 2.64-6.396 0-11.412-4.5-11.412-11.76 0-7.056 4.956-11.664 11.028-11.664zm2.46 8.016h-5.976c.192-1.848 1.548-3.072 3.072-3.072 1.548 0 2.724 1.188 2.904 3.072z" /></svg>
                            </a>

                        </div>
                    </div>

                    {/* Blog Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleBlogClick}
                            className={`inline-flex items-center space-x-2 border px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-sm transform hover:scale-105 transition-all duration-200 cursor-pointer outline-none ${isComingSoon
                                    ? 'bg-orange-600 border-orange-500 text-white'
                                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:bg-orange-600 hover:border-orange-500'
                                }`}
                        >
                            <span>📚 {blogText}</span>
                            {!isComingSoon && <span className="text-[10px] opacity-60">➔</span>}
                        </button>
                    </div>
                </div>

                {/* Column 2: Quick Links */}
                <div className="select-none">
                    <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider border-b border-stone-900 pb-3 mb-4">
                        Quick Navigation
                    </h4>
                    <ul className="space-y-2.5 text-xs">
                        {quickLinks.map((link, idx) => (
                            <li key={idx}>
                                <a
                                    href={link.href}
                                    className="inline-flex items-center space-x-1 cursor-pointer hover:text-orange-500 hover:translate-x-2 transition-all duration-200 group text-stone-400"
                                >
                                    <span className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">➔</span>
                                    <span>{link.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 3: Top Destinations */}
                <div className="select-none">
                    <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider border-b border-stone-900 pb-3 mb-4">
                        Top Destinations
                    </h4>
                    <ul className="space-y-2.5 text-xs">
                        {topDestinations.map((dest, idx) => (
                            <li key={idx}>
                                <a
                                    href={dest.href}
                                    className="inline-flex items-center space-x-1 cursor-pointer hover:text-orange-500 hover:translate-x-2 transition-all duration-200 group text-stone-400"
                                >
                                    <span className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">✦</span>
                                    <span>{dest.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4: Contact Information & Startup Service Area */}
                <div className="space-y-4">
                    <h4 className="text-white font-serif font-bold text-sm uppercase tracking-wider border-b border-stone-900 pb-3 mb-3 select-none">
                        Contact Support
                    </h4>
                    <div className="space-y-3 text-xs select-text">

                        {/* Service Area instead of physical office */}
                        <div className="flex items-start space-x-3 p-2 rounded-xl bg-stone-900/30 border border-stone-900/50 hover:border-orange-500/30 hover:bg-stone-900/80 transform hover:scale-105 transition-all duration-300 origin-left group text-stone-400">
                            <span className="text-orange-500 mt-0.5 flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </span>
                            <div>
                                <span className="block font-bold text-stone-300 group-hover:text-orange-400 transition-colors select-none">Service Area</span>
                                <span className="text-stone-500 text-[11px] leading-tight block mt-0.5">Serving Varanasi and Nearby Destinations</span>
                                <span className="text-orange-500/70 text-[9px] uppercase font-bold tracking-wider block mt-0.5">Working Hours: 24 x 7</span>
                            </div>
                        </div>

                        {/* WhatsApp / Helpline Contact */}
                        <a href="https://wa.me/918149783494" target="_blank" rel="noreferrer" className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900/30 border border-stone-900/50 hover:border-orange-500/30 hover:bg-stone-900/80 transform hover:scale-105 transition-all duration-300 origin-left group block text-stone-400">
                            <span className="text-emerald-500 flex-shrink-0">
                                <span className="text-lg">💬</span>
                            </span>
                            <div>
                                <span className="block font-bold text-stone-300 group-hover:text-orange-400 transition-colors select-none">WhatsApp / Support</span>
                                <span className="text-emerald-500 font-mono font-bold text-[11px] block mt-0.5">+91-8149783494</span>
                            </div>
                        </a>

                        {/* Phone booking contact */}
                        <a href="tel:+918400554029" className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900/30 border border-stone-900/50 hover:border-orange-500/30 hover:bg-stone-900/80 transform hover:scale-105 transition-all duration-300 origin-left group block text-stone-400">
                            <span className="text-orange-500 flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </span>
                            <div>
                                <span className="block font-bold text-stone-300 group-hover:text-orange-400 transition-colors select-none">Phone Contact</span>
                                <span className="text-orange-500 font-mono font-bold text-[11px] block mt-0.5">+91-8400554029</span>
                            </div>
                        </a>

                        {/* Email */}
                        <a href="mailto:info.varanasi.yatra@gmail.com" className="flex items-center space-x-3 p-2 rounded-xl bg-stone-900/30 border border-stone-900/50 hover:border-orange-500/30 hover:bg-stone-900/80 transform hover:scale-105 transition-all duration-300 origin-left group block text-stone-400">
                            <span className="text-orange-500 flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </span>
                            <div>
                                <span className="block font-bold text-stone-300 group-hover:text-orange-400 transition-colors select-none">Official Email Desk</span>
                                <span className="text-stone-400 text-[11px] block mt-0.5 break-all">info.varanasi.yatra@gmail.com</span>
                            </div>
                        </a>

                    </div>
                </div>

            </div>

            {/* Bottom Row containing legal pages links for Indian Travel Startup */}
            <div className="max-w-7xl mx-auto pt-6 border-t border-stone-900 text-center flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-stone-600 font-medium select-none">
                <p>© 2026 Banaras Yatra Travel & Tours. All Rights Reserved.</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a href="/privacy.html" target="_blank" rel="noreferrer" className="hover:text-stone-400 transition-colors">Privacy Policy</a>
                    <span>•</span>
                    <a href="/terms.html" target="_blank" rel="noreferrer" className="hover:text-stone-400 transition-colors">Terms & Conditions</a>
                    <span>•</span>
                    <a href="/refunds.html" target="_blank" rel="noreferrer" className="hover:text-stone-400 transition-colors">Refund & Cancellation</a>
                    <span>•</span>
                    <a href="/cookies.html" target="_blank" rel="noreferrer" className="hover:text-stone-400 transition-colors">Cookie Policy</a>
                    <span>•</span>
                    <a href="/disclaimer.html" target="_blank" rel="noreferrer" className="hover:text-stone-400 transition-colors">Disclaimer</a>
                </div>
            </div>
        </footer>
    );
}
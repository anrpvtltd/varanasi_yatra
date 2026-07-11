import React from 'react';
import logoImg from '../assets/logo.png';

export default function Header() {
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

                {/* Center: Clean Navigation Links */}
                <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-stone-300">
                    <a href="#home" className="hover:text-orange-500 transition-colors">Home</a>
                    <a href="#about" className="hover:text-orange-500 transition-colors">About Us</a>
                    <a href="#packages" className="hover:text-orange-500 transition-colors">Tour Packages</a>
                    <a href="#destinations" className="hover:text-orange-500 transition-colors">Destinations</a>
                    <a href="#services" className="hover:text-orange-500 transition-colors">Services</a>
                    <a href="#gallery" className="hover:text-orange-500 transition-colors">Gallery</a>
                </nav>

                {/* Right Side: Micro Direct Helpline & Fixed Action Button */}
                <div className="flex items-center space-x-4">
                    <div className="hidden sm:block text-right">
                        <span className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider">Direct Helpline</span>
                        <a href="tel:+919140487098" className="text-xs font-mono font-bold text-orange-500 hover:underline">
                            +91 91404 87098
                        </a>
                    </div>

                    {/* 🔥 FIXED: Changed href from "#booking-form" to "tel" protocol for instant calling system action */}
                    <a
                        href="tel:+918149783494"
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition shadow-md transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        Enquire Now
                    </a>
                </div>

            </div>
        </header>
    );
}
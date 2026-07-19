import React, { useState, useEffect } from 'react';
import BookingForm from './BookingForm';

// Assets Connections
import logoImg from '../assets/logo.png';
import heroBgImg from '../assets/ExperienceVaranasi/GangaAarti.png';

// Typewriter words static constant
const WORDS_LIST = ["Varanasi", "Ayodhya", "Bihar", "Mirzapur", "Chunar", "Nepal"];

export default function Hero() {
    // 📝 Controlled Typewriter Setup
    const [wordIndex, setWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentWord = WORDS_LIST[wordIndex];
        let typingSpeed = isDeleting ? 70 : 220;

        if (!isDeleting && currentText === currentWord) {
            typingSpeed = 2200;
            setIsDeleting(true);
        } else if (isDeleting && currentText === '') {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % WORDS_LIST.length);
        }

        const timer = setTimeout(() => {
            setCurrentText(
                isDeleting
                    ? currentWord.substring(0, currentText.length - 1)
                    : currentWord.substring(0, currentText.length + 1)
            );
        }, typingSpeed);

        return () => clearTimeout(timer);
    }, [currentText, isDeleting, wordIndex]);

    return (
        <section
            id="home"
            className="relative bg-stone-950 text-white overflow-hidden py-10 lg:py-16 px-4 sm:px-6 bg-cover bg-center flex items-center min-h-[calc(100vh-60px)]"
            style={{
                backgroundImage: `linear-gradient(rgba(12, 10, 9, 0.84), rgba(12, 10, 9, 0.90)), url(${heroBgImg})`
            }}
        >
            <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full">

                {/* Left Side Info Area */}
                <div className="lg:col-span-7 space-y-5 text-left">
                    <div className="inline-flex items-center space-x-2.5 bg-stone-900/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-stone-800 shadow-sm">
                        <img src={logoImg} alt="Logo" className="w-8 h-8 object-contain flex-shrink-0" />
                        <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase">Banaras Yatra Premium Operator</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-5xl font-serif font-bold text-white leading-[1.18] tracking-wide">
                        Experience <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 italic">Kashi Like a Local</span>: <br /> Spiritual, Comfortable & Transparent
                    </h1>

                    <div className="flex items-center space-x-2 text-base sm:text-xl text-stone-300 font-serif font-medium tracking-wide border-l-4 border-orange-500 pl-3 min-h-[56px] sm:min-h-[36px]">
                        <span>Travel with us to</span>
                        <span className="text-orange-500 font-bold tracking-wider drop-shadow-[0_2px_8px_rgba(234,88,12,0.3)]">
                            {currentText}
                        </span>
                        <span className="w-0.5 h-5 bg-orange-500 animate-pulse">|</span>
                    </div>

                    <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                        Embark on a soulful pilgrimage through Varanasi. We provide handpicked hotels near the temples, trusted local drivers, and certified guides to ensure your family's journey is peaceful, safe, and completely transparent.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-stone-800/60">
                        <div className="flex items-center space-x-2.5 bg-stone-900/50 backdrop-blur-xs p-2.5 rounded-xl border border-stone-800/40">
                            <span className="text-orange-500 bg-orange-500/10 p-2 text-xs rounded-lg">✈️</span>
                            <span className="text-[11px] font-semibold text-stone-200">Airport Pickup & Drop</span>
                        </div>
                        <div className="flex items-center space-x-2.5 bg-stone-900/50 backdrop-blur-xs p-2.5 rounded-xl border border-stone-800/40">
                            <span className="text-orange-500 bg-orange-500/10 p-2 text-xs rounded-lg">🚗</span>
                            <span className="text-[11px] font-semibold text-stone-200">Premium Cab Hire</span>
                        </div>
                        <div className="flex items-center space-x-2.5 bg-stone-900/50 backdrop-blur-xs p-2.5 rounded-xl border border-stone-800/40">
                            <span className="text-orange-500 bg-orange-500/10 p-2 text-xs rounded-lg">🏨</span>
                            <span className="text-[11px] font-semibold text-stone-200">Stay & Guided Sightseeing</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        <a href="#packages" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-xl text-xs flex items-center space-x-2 transform hover:scale-105 duration-200">
                            <span>Explore Packages</span> <span>➔</span>
                        </a>
                        <a href="https://wa.me/918149783494" target="_blank" rel="noreferrer" className="bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-white px-6 py-3 rounded-xl font-bold transition text-xs flex items-center space-x-2 transform hover:scale-105 duration-200">
                            <span className="text-emerald-500">💬</span> <span>Chat on WhatsApp</span>
                        </a>
                    </div>

                    {/* Trust indicators below CTA */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-stone-400 text-[10px] font-medium border-t border-stone-900/50">
                        <span className="flex items-center space-x-1.5"><span className="text-orange-500">✓</span> <span>Local Varanasi Experts</span></span>
                        <span className="flex items-center space-x-1.5"><span className="text-orange-500">✓</span> <span>24x7 Travel Support</span></span>
                        <span className="flex items-center space-x-1.5"><span className="text-orange-500">✓</span> <span>Custom Tour Planning</span></span>
                        <span className="flex items-center space-x-1.5"><span className="text-orange-500">✓</span> <span>Private Driver & Car</span></span>
                        <span className="flex items-center space-x-1.5"><span className="text-orange-500">✓</span> <span>Airport Pickup & Drop</span></span>
                    </div>
                </div>

                {/* 👑 RIGHT SIDE PREMIUM UPGRADED BOX */}
                <div id="booking-form" className="lg:col-span-5 w-full">
                    <BookingForm />
                </div>

            </div>
        </section>
    );
}
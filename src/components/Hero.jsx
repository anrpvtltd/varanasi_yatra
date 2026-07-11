import React, { useState, useEffect } from 'react';

// Assets Connections
import logoImg from '../assets/logo.png';
import heroBgImg from '../assets/ExperienceVaranasi/GangaAarti.png';

export default function Hero() {
    const [formData, setFormData] = useState({
        name: '', mobile: '', email: '', pickup: '', date: '', travelers: '1'
    });
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // 📝 Controlled Typewriter Setup
    const words = ["Varanasi", "Ayodhya", "Bihar", "Mirzapur", "Chunar", "Nepal"];
    const [wordIndex, setWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentWord = words[wordIndex];
        let typingSpeed = isDeleting ? 70 : 220;

        if (!isDeleting && currentText === currentWord) {
            typingSpeed = 2200;
            setIsDeleting(true);
        } else if (isDeleting && currentText === '') {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            const response = await fetch('https://us-central1-varanasi-yatra.cloudfunctions.net/api/enquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setSubmitted(true);
                setFormData({ name: '', mobile: '', email: '', pickup: '', date: '', travelers: '1' });
                setTimeout(() => setSubmitted(false), 6000);
            } else {
                setErrorMsg(data.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setErrorMsg('Server connection failed. Please check if backend is running.');
        }
    };

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
                    <div className="inline-flex items-center space-x-2 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-800 shadow-sm">
                        <img src={logoImg} alt="Logo" className="w-4 h-4 object-contain flex-shrink-0" />
                        <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">Banaras Yatra Premium Operator</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-5xl font-serif font-bold text-white leading-[1.18] tracking-wide">
                        Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 italic">Spiritual Soul</span> <br /> of India with Us
                    </h1>

                    <div className="flex items-center space-x-2 text-base sm:text-xl text-stone-300 font-serif font-medium tracking-wide border-l-4 border-orange-500 pl-3 min-h-[36px]">
                        <span>Travel with us to</span>
                        <span className="text-orange-500 font-bold tracking-wider drop-shadow-[0_2px_8px_rgba(234,88,12,0.3)]">
                            {currentText}
                        </span>
                        <span className="w-0.5 h-5 bg-orange-500 animate-pulse">|</span>
                    </div>

                    <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
                        One Journey. Many Incredible Experiences.
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
                </div>

                {/* 👑 RIGHT SIDE PREMIUM UPGRADED BOX (Image Matching Specs) */}
                <div
                    id="booking-form"
                    className="lg:col-span-5 bg-stone-950/65 backdrop-blur-md rounded-[28px] p-7 shadow-[0_0_40px_rgba(0,0,0,0.7)] border border-amber-500/30 w-full relative overflow-hidden"
                >
                    {/* Subtle Golden Pattern Overlay Vibe via CSS */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <div className="relative z-10">
                        {/* Header Block with Decorative Elements */}
                        <div className="flex items-center justify-center space-x-2 mb-1">
                            <span className="text-[9px] text-amber-500/60 font-serif border border-amber-500/30 px-1 py-0.5 rounded">BY</span>
                            <h2 className="text-xl font-serif font-bold text-amber-100 tracking-wide">Plan Your Perfect Trip</h2>
                            <span className="text-[9px] text-amber-500/60 font-serif border border-amber-500/30 px-1 py-0.5 rounded">DY</span>
                        </div>
                        <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto mb-6"></div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-left">

                            {/* Field: Name */}
                            <div>
                                <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1.5 tracking-widest">Your Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-stone-800 text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition"
                                    placeholder="Enter full name"
                                />
                            </div>

                            {/* Grid: Mobile and Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1.5 tracking-widest">Mobile Number</label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        required
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-stone-800 text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition"
                                        placeholder="10-digit mobile"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1.5 tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-stone-800 text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition"
                                        placeholder="name@domain.com"
                                    />
                                </div>
                            </div>

                            {/* Field: Pickup Location */}
                            <div>
                                <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1.5 tracking-widest">Pickup Location</label>
                                <input
                                    type="text"
                                    name="pickup"
                                    required
                                    value={formData.pickup}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-stone-800 text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition"
                                    placeholder="Varanasi Airport / Railway Station"
                                />
                            </div>

                            {/* Grid: Date and Travelers */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1.5 tracking-widest">Travel Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        required
                                        value={formData.date}
                                        onChange={handleChange}
                                        style={{ colorScheme: 'dark' }}
                                        className="w-full bg-black/40 border border-stone-800 text-stone-200 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1.5 tracking-widest">No. of Travelers</label>
                                    <select
                                        name="travelers"
                                        value={formData.travelers}
                                        onChange={handleChange}
                                        className="w-full bg-black/40 border border-stone-800 text-stone-300 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition cursor-pointer"
                                    >
                                        <option value="1" className="bg-stone-900 text-white">1 Person</option>
                                        <option value="2" className="bg-stone-900 text-white">2 Persons</option>
                                        <option value="3-5" className="bg-stone-900 text-white">3 - 5 Persons</option>
                                        <option value="6-10" className="bg-stone-900 text-white">6 - 10 Persons</option>
                                        <option value="10+" className="bg-stone-900 text-white">Group (10+)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Action Button matching the warm rust-orange glowing gradient */}
                            <button
                                type="submit"
                                className="w-full mt-2 bg-gradient-to-r from-orange-700 via-amber-700 to-amber-800 hover:from-orange-600 hover:to-amber-700 text-amber-50 font-serif font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl shadow-[0_4px_20px_rgba(180,83,9,0.25)] border border-amber-600/30 transition-all duration-300 transform hover:scale-[1.01] cursor-pointer"
                            >
                                Get Free Quote
                            </button>
                        </form>

                        {submitted && (
                            <div className="mt-4 p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] rounded-xl text-center font-medium animate-pulse">
                                🎉 Thank you! Your inquiry has been submitted and saved successfully.
                            </div>
                        )}

                        {errorMsg && (
                            <div className="mt-4 p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-[11px] rounded-xl text-center font-medium">
                                ⚠️ {errorMsg}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </section>
    );
}
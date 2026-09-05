import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { trackWhatsAppClick, trackCallClick } from '../utils/analytics';

export default function PublicFooter() {
    return (
        <footer className="bg-stone-950 text-stone-400 pt-16 pb-12 border-t border-stone-900 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

                {/* Column 1: Brand pitch & mission */}
                <div className="space-y-4">
                    <Link to="/" className="flex items-center space-x-3 group" aria-label="Varanasi Yatra">
                        <img
                            src={logoImg}
                            alt="Varanasi Yatra Emblem"
                            className="w-10 h-10 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div>
                            <span className="text-white font-serif font-bold text-lg leading-tight uppercase tracking-wider block">
                                Varanasi Yatra
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest block">
                                Authentic Pilgrimages & Tours
                            </span>
                        </div>
                    </Link>

                    <p className="text-xs leading-relaxed text-stone-400">
                        Dedicated local travel facilitation across Varanasi, Sarnath, Ayodhya, and Buddhist circuits. We coordinate verified private boats, authentic Vedic rituals, and trusted local transport with genuine transparency.
                    </p>

                    <div className="pt-2">
                        <span className="block text-[10px] font-bold tracking-widest text-stone-500 uppercase mb-2">
                            Verified Local Desk
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-xs text-stone-300 font-medium">On-Ground Support Active in Varanasi</span>
                        </div>
                    </div>
                </div>

                {/* Column 2: Explore & Experiences */}
                <div>
                    <h3 className="text-white font-serif font-bold text-sm uppercase tracking-wider border-b border-stone-800/80 pb-3 mb-4">
                        Explore Varanasi
                    </h3>
                    <ul className="space-y-2.5 text-xs">
                        <li>
                            <Link to="/experiences" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span>
                                <span>All Experiences</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/experiences/ganga-aarti" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Ganga Aarti Experience</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/experiences/varanasi-boat-ride" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Sunrise & Evening Boat Rides</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/experiences/temple-darshan" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Kashi Vishwanath Darshan</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/tours" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span>
                                <span>Curated Tour Packages</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/destinations" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span>
                                <span>Destinations (Varanasi & Sarnath)</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/hotels" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Where to Stay in Varanasi</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Column 3: Travel Guides & Company */}
                <div>
                    <h3 className="text-white font-serif font-bold text-sm uppercase tracking-wider border-b border-stone-800/80 pb-3 mb-4">
                        Traveler Resources
                    </h3>
                    <ul className="space-y-2.5 text-xs">
                        <li>
                            <Link to="/travel-guide" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span>
                                <span>Travel Guides & Tips</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/travel-guide/best-time" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Best Time to Visit</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/travel-guide/ganga-aarti-timings" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Aarti Timings & Best Spots</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/travel-guide/transport" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-stone-600">→</span>
                                <span>Local Transport & Taxis</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/about" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span>
                                <span>About Varanasi Yatra</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/contact" className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5">
                                <span className="text-amber-500">✦</span>
                                <span>Contact Desk</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/plan-your-trip" className="hover:text-amber-400 font-bold text-amber-500 inline-flex items-center gap-1.5">
                                <span>✨</span>
                                <span>Plan Your Trip (Custom Itinerary)</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Column 4: Verified Contact Coordinates */}
                <div className="space-y-3">
                    <h3 className="text-white font-serif font-bold text-sm uppercase tracking-wider border-b border-stone-800/80 pb-3 mb-3">
                        Contact & Support
                    </h3>

                    <a
                        href="tel:+918400554029"
                        onClick={() => trackCallClick('footer_phone')}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/50 border border-stone-800/70 hover:border-amber-500/40 transition group"
                    >
                        <span className="text-amber-500 text-sm mt-0.5">📞</span>
                        <div>
                            <span className="text-[11px] text-stone-500 block uppercase font-bold">Helpline (Direct)</span>
                            <span className="text-stone-200 group-hover:text-amber-400 text-xs font-mono font-bold">+91-8400554029</span>
                        </div>
                    </a>

                    <a
                        href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20need%20assistance."
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWhatsAppClick('footer_whatsapp')}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/50 border border-stone-800/70 hover:border-emerald-500/40 transition group"
                    >
                        <span className="text-emerald-500 text-sm mt-0.5">💬</span>
                        <div>
                            <span className="text-[11px] text-stone-500 block uppercase font-bold">WhatsApp Assistance</span>
                            <span className="text-stone-200 group-hover:text-emerald-400 text-xs font-mono font-bold">+91-8149783494</span>
                        </div>
                    </a>

                    <a
                        href="mailto:info.varanasi.yatra@gmail.com"
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-900/50 border border-stone-800/70 hover:border-amber-500/40 transition group"
                    >
                        <span className="text-amber-500 text-sm mt-0.5">✉️</span>
                        <div>
                            <span className="text-[11px] text-stone-500 block uppercase font-bold">Official Email</span>
                            <span className="text-stone-200 group-hover:text-amber-400 text-xs font-mono break-all">info.varanasi.yatra@gmail.com</span>
                        </div>
                    </a>

                    <div className="p-2.5 rounded-xl bg-stone-900/30 border border-stone-800/40 text-[11px] text-stone-400">
                        <span className="font-semibold text-stone-300 block mb-0.5">Service Coverage:</span>
                        <span>Varanasi Ghats, Kashi Vishwanath, Sarnath, Cantt Station, Babatpur Airport, Ayodhya, Prayagraj & Bodh Gaya.</span>
                    </div>
                </div>

            </div>

            {/* Bottom Row: Legal Links + Discreet Team Login */}
            <div className="max-w-7xl mx-auto pt-6 border-t border-stone-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-stone-500 font-medium">
                <p>© 2026 Varanasi Yatra. All Rights Reserved.</p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <a href="/privacy.html" target="_blank" rel="noreferrer" className="hover:text-stone-300 transition-colors">Privacy</a>
                    <span>•</span>
                    <a href="/terms.html" target="_blank" rel="noreferrer" className="hover:text-stone-300 transition-colors">Terms</a>
                    <span>•</span>
                    <a href="/refunds.html" target="_blank" rel="noreferrer" className="hover:text-stone-300 transition-colors">Refunds</a>
                    <span>•</span>
                    <a href="/cookies.html" target="_blank" rel="noreferrer" className="hover:text-stone-300 transition-colors">Cookies</a>
                    <span>•</span>
                    <a href="/disclaimer.html" target="_blank" rel="noreferrer" className="hover:text-stone-300 transition-colors">Disclaimer</a>
                    <span>•</span>
                    {/* Authorized CRM Team Login Link */}
                    <Link
                        to="/crm"
                        id="footer-team-login"
                        className="text-stone-400 hover:text-amber-400 transition-all duration-200 inline-flex items-center gap-1.5 font-medium text-xs py-1 px-2.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-500/50 shadow-2xs hover:shadow-xs"
                        title="Authorized Operations & Team Access"
                    >
                        <span aria-hidden="true">🔐</span>
                        <span>Team Login</span>
                    </Link>
                </div>
            </div>
        </footer>
    );
}

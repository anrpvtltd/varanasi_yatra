import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import assiMorningImg from '../../assets/ExperienceVaranasi/AssiMorning.avif';
import { trackWhatsAppClick } from '../utils/analytics';

export default function AboutPage() {
    return (
        <>
            <SEO
                title="About Us | Authentic Local Pilgrimage Stewardship | Varanasi Yatra"
                description="The story of Varanasi Yatra. Founded by local Kashi residents to ensure every pilgrim and visitor experiences the sacred beauty of Varanasi with honesty, warmth, and peace of mind."
                pathname="/about"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'About Us' }
                        ]}
                    />
                </div>
            </div>

            <article className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                {/* Main Story Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
                    <div className="lg:col-span-7 space-y-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                            Our Story & Calling
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-stone-900 leading-tight">
                            Born Out of a Passion to Share the Sacred Soul of Kashi
                        </h1>
                        <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />

                        <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                            <p>
                                <strong>Varanasi Yatra</strong> began with a simple, personal observation. Over the years, we watched family, friends, and pilgrims from all corners of India and the world arrive in Varanasi with hearts full of devotion, only to face confusion. Finding a clean, family-friendly hotel near the riverfront ghats, coordinating a trustworthy taxi driver, and securing a respectful temple guide often felt like an exhausting task amidst chaotic touts and commission agents.
                            </p>
                            <p>
                                We founded Varanasi Yatra to change that. As locals who grew up listening to the resonant temple bells and witnessing the morning Subah-e-Banaras aarti at Assi Ghat, we wanted to bridge this gap. Our initiative is built to replace uncertainty with warmth, authentic hospitality, and complete financial transparency.
                            </p>
                            <p>
                                We do not run rushed, commercialized mass tours. Instead, we coordinate custom spiritual journeys designed especially for families and senior citizens. By working directly with trusted local transport owners, verified boatmen, certified guides, and handpicked hotels, we ensure your pilgrimage is conducted with dignity, comfort, and peace of mind.
                            </p>
                        </div>

                        {/* Values grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200">
                            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
                                    Local Guardians
                                </h2>
                                <p className="text-[11px] text-stone-600 leading-relaxed">
                                    We guide you through the city as our honored guests, not merely as commercial tourists, safeguarding your safety at every step.
                                </p>
                            </div>
                            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                                <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">
                                    Honest & Transparent
                                </h2>
                                <p className="text-[11px] text-stone-600 leading-relaxed">
                                    Zero hidden commissions, zero forced shopping stops, and clear pre-agreed pricing for boats, cabs, and guides.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-xl aspect-[4/3]">
                            <ImageWithSkeleton
                                src={assiMorningImg}
                                alt="Morning prayers at Assi Ghat Varanasi"
                                className="w-full h-full object-cover"
                                priority={true}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-6">
                                <p className="text-white text-xs font-serif font-bold">
                                    "Our mission is to ensure logistics are handled with honesty, leaving you free to absorb the sacred divinity of Kashi."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Founder Message Section */}
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-sm mb-16">
                    <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0 text-center">
                            <div className="w-24 h-24 rounded-2xl bg-stone-950 border border-stone-800 shadow-md flex items-center justify-center text-amber-500 font-serif font-bold text-3xl mx-auto">
                                VY
                            </div>
                            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-3 block">
                                Founder Desk
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-700 block">
                                Varanasi Yatra
                            </span>
                        </div>

                        <div className="flex-1 text-left space-y-4">
                            <span className="text-3xl text-amber-500 font-serif font-bold select-none block">“</span>
                            <p className="text-xs sm:text-sm text-stone-700 italic leading-relaxed">
                                Our goal is to make every visitor experience the spiritual beauty of Varanasi with comfort, transparency, and local guidance.
                            </p>
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                Varanasi is not just a destination; it is an emotional and spiritual awakening. However, to feel that divinity, one needs a peaceful state of mind. We started Varanasi Yatra to ensure that logistics, hotel bookings, and transport coordination are handled honestly, leaving you free to absorb the sacred energy of Kashi.
                            </p>
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-stone-900 block">The Varanasi Yatra Team</span>
                                    <span className="text-[10px] text-stone-400">Local Travel Coordinators & Pilgrimage Facilitators</span>
                                </div>
                                <span className="text-amber-600 text-xl font-bold">🙏</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Planning CTA */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 sm:p-10 text-white text-center max-w-3xl mx-auto">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold mb-2">
                        Let Us Help You Plan Your Yatra
                    </h2>
                    <p className="text-amber-100 text-xs sm:text-sm max-w-lg mx-auto mb-6">
                        Speak directly with our local coordinator in Varanasi. No call centers, just genuine local hospitality.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/plan-your-trip"
                            className="bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md"
                        >
                            Plan My Trip
                        </Link>
                        <a
                            href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20would%20like%20to%20plan%20my%20trip."
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackWhatsAppClick('about_page_cta')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition inline-flex items-center gap-2"
                        >
                            <span>Chat on WhatsApp</span>
                            <span>💬</span>
                        </a>
                    </div>
                </div>
            </article>
        </>
    );
}

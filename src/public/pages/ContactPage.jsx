import React from 'react';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import QuickTripPlanner from '../components/QuickTripPlanner';
import { trackWhatsAppClick, trackCallClick } from '../utils/analytics';

export default function ContactPage() {
    return (
        <>
            <SEO
                title="Contact Varanasi Yatra | 24x7 Local Helpline & WhatsApp Desk"
                description="Get in touch with our local Varanasi travel coordinators. Direct phone: +91-8400554029, WhatsApp: +91-8149783494, Email: info.varanasi.yatra@gmail.com."
                pathname="/contact"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Contact Us' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mb-10">
                    <SectionHeading
                        as="h1"
                        eyebrow="Direct Local Reach"
                        title="Contact Varanasi Yatra"
                        description="Whether you have an immediate question about today's Aarti timings or wish to plan an upcoming multi-day family pilgrimage, our team is directly reachable."
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Contact Cards */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Direct Helpline */}
                        <a
                            href="tel:+918400554029"
                            onClick={() => trackCallClick('contact_page')}
                            className="block bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:border-amber-500/50 hover:shadow-md transition group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
                                    📞
                                </div>
                                <div>
                                    <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
                                        Direct Helpline
                                    </span>
                                    <span className="text-base font-serif font-black text-stone-900 group-hover:text-amber-700 transition-colors font-mono">
                                        +91-8400554029
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        Voice call assistance for bookings & immediate queries
                                    </span>
                                </div>
                            </div>
                        </a>

                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20need%20assistance."
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackWhatsAppClick('contact_page')}
                            className="block bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
                                    💬
                                </div>
                                <div>
                                    <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
                                        WhatsApp Desk
                                    </span>
                                    <span className="text-base font-serif font-black text-stone-900 group-hover:text-emerald-700 transition-colors font-mono">
                                        +91-8149783494
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        Instant chat for custom itineraries & photo quotes
                                    </span>
                                </div>
                            </div>
                        </a>

                        {/* Official Email */}
                        <a
                            href="mailto:info.varanasi.yatra@gmail.com"
                            className="block bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:border-amber-500/50 hover:shadow-md transition group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
                                    ✉️
                                </div>
                                <div>
                                    <span className="text-[11px] uppercase font-bold tracking-wider text-stone-500 block">
                                        Official Email Desk
                                    </span>
                                    <span className="text-xs font-mono font-bold text-stone-900 group-hover:text-amber-700 transition-colors break-all">
                                        info.varanasi.yatra@gmail.com
                                    </span>
                                    <span className="text-[11px] text-stone-500 block mt-0.5">
                                        For formal proposals, group inquiries, and partnerships
                                    </span>
                                </div>
                            </div>
                        </a>

                        {/* Service Area & Operation Hours */}
                        <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 text-xs text-stone-700 space-y-3">
                            <div>
                                <span className="font-bold text-stone-900 block mb-1">📍 On-Ground Operations Area:</span>
                                <p className="text-stone-600 leading-relaxed">
                                    Varanasi Riverfront (Assi to Namo Ghat), Godowlia, Chowk, Varanasi Cantt Railway Station, Babatpur International Airport (VNS), Sarnath, Ayodhya Ji, and Bodh Gaya.
                                </p>
                            </div>
                            <div className="pt-2 border-t border-stone-200/80">
                                <span className="font-bold text-stone-900 block mb-1">⏰ Operating Hours:</span>
                                <p className="text-stone-600 leading-relaxed">
                                    Guest On-Ground Coordination: 24 Hours / 7 Days a Week.
                                    <br />
                                    General Desk Inquiries: 06:00 AM – 10:30 PM IST.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Embedded Trip Planner / Contact Form */}
                    <div className="lg:col-span-7">
                        <QuickTripPlanner
                            title="Send an Enquiry / Request a Custom Plan"
                            subtitle="Fill in your travel preferences and our local coordinator will respond via WhatsApp or call."
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

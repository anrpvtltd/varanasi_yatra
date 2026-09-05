import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import QuickTripPlanner from '../components/QuickTripPlanner';
import { trackWhatsAppClick, trackQRScan } from '../utils/analytics';
import { setPartnerAttribution } from '../utils/attribution';

export default function PartnerQRPage() {
    const { partnerId } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const qrId = queryParams.get('qr') || partnerId;

    const [partner, setPartner] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotFound, setIsNotFound] = useState(false);

    useEffect(() => {
        if (!partnerId) {
            setIsLoading(false);
            setIsNotFound(true);
            return;
        }

        let isMounted = true;
        const normalizedId = partnerId.toLowerCase().trim();

        async function fetchPartner() {
            try {
                const res = await fetch(`/public/partners/${normalizedId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        if (data.success && data.partner) {
                            setPartner(data.partner);
                            // Persist attribution in sessionStorage for entire journey
                            setPartnerAttribution({
                                partnerId: data.partner.partnerCode,
                                partnerName: data.partner.name,
                                qrId,
                                landingPath: location.pathname
                            });

                            // Track scan (de-duped per session so page refreshes don't spam count)
                            const sessionKey = `vy_scanned_${data.partner.partnerCode}`;
                            if (typeof window !== 'undefined' && !window.sessionStorage.getItem(sessionKey)) {
                                window.sessionStorage.setItem(sessionKey, '1');
                                fetch(`/public/partners/${data.partner.partnerCode}/scan`, { method: 'POST' }).catch(() => {});
                            }
                            trackQRScan(data.partner.partnerCode, qrId);
                        } else {
                            setIsNotFound(true);
                        }
                    }
                } else {
                    if (isMounted) {
                        setIsNotFound(true);
                    }
                }
            } catch {
                if (isMounted) {
                    setIsNotFound(true);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchPartner();

        return () => {
            isMounted = false;
        };
    }, [partnerId, qrId, location.pathname]);

    // Format fallback partner name from slug if offline/error
    const formattedPartner = partner?.name || (partnerId ? partnerId.replace(/[-_]/g, ' ').toUpperCase() : 'Hotel Guest Desk');

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs font-mono text-stone-500 uppercase tracking-wider">Connecting to Hotel Guest Concierge...</p>
            </div>
        );
    }

    // Inactive partner state (Safe fallback without leaking private details)
    if (partner && !partner.active) {
        return (
            <>
                <SEO
                    title="Hotel Concierge Desk | Varanasi Yatra"
                    description="Varanasi Yatra verified local travel concierge for hotel guests in Varanasi."
                    pathname={`/p/${partnerId || ''}`}
                />
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 sm:p-8 text-center shadow-xs">
                        <span className="text-2xl block mb-2">ℹ️</span>
                        <h1 className="text-xl font-serif font-bold text-stone-900 mb-1">
                            Hotel Guest Travel Desk Offline
                        </h1>
                        <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto mb-6">
                            The automated concierge integration for this hotel is currently paused. You can still arrange verified boats, darshan, and private taxis directly with our central Varanasi team.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/plan-your-trip"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
                            >
                                Plan Trip With Central Desk ➔
                            </Link>
                            <a
                                href="https://wa.me/918149783494?text=Namaste!%20I%20am%20in%20Varanasi%20and%20need%20travel%20assistance."
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick('partner_inactive_fallback')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs"
                            >
                                WhatsApp Support
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Invalid / Unregistered partner fallback
    if (isNotFound) {
        return (
            <>
                <SEO
                    title="Varanasi Travel Concierge | Varanasi Yatra"
                    description="Verified local tour facilitation, private boats, and darshan assistance in Varanasi."
                    pathname="/plan-your-trip"
                />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                    <div className="bg-stone-900 text-white p-6 sm:p-8 rounded-3xl mb-8 text-center">
                        <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400 bg-stone-800 px-3 py-1 rounded-full border border-amber-500/30 inline-block mb-3">
                            Direct Guest Assistance
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-serif font-black mb-2">
                            Welcome to Kashi
                        </h1>
                        <p className="text-stone-300 text-xs sm:text-sm max-w-xl mx-auto">
                            Whether you are staying at a ghat hotel or city retreat, Varanasi Yatra provides transparent, verified private boats, temple darshan, and taxi transfers.
                        </p>
                    </div>

                    <QuickTripPlanner
                        title="Varanasi Guest Travel Desk"
                        subtitle="Tell us your requirements — get a fixed-rate, scam-free itinerary directly on WhatsApp."
                    />
                </div>
            </>
        );
    }

    // Standard Active Partner Landing Page
    return (
        <>
            <SEO
                title={`Welcome to Varanasi | Guest Concierge for ${formattedPartner} | Varanasi Yatra`}
                description={`Official guest travel desk for ${formattedPartner}. Scam-free private sunrise boats, Kashi Vishwanath Sugam Darshan, and doorstep AC taxis.`}
                pathname={`/p/${partnerId || ''}`}
            />

            {/* Focused Hero Banner */}
            <div className="bg-stone-950 text-white py-10 px-4 sm:px-6 border-b border-stone-800">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400 bg-stone-900 px-3.5 py-1.5 rounded-full border border-amber-500/30 inline-block mb-3">
                        Guest Concierge Service
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-serif font-black mb-2">
                        Welcome to Kashi
                    </h1>
                    <p className="text-amber-200/90 text-xs sm:text-sm font-semibold tracking-wide">
                        Recommended for guests of: <span className="text-white font-bold underline decoration-amber-500 decoration-2">{formattedPartner}</span>
                    </p>
                    <p className="text-stone-400 text-xs mt-2 max-w-lg mx-auto">
                        Transparent, scam-free travel assistance curated directly for your stay in Varanasi.
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
                {/* 3 Value Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                        <span className="text-xl block mb-1">⛵</span>
                        <h2 className="font-serif font-bold text-xs text-stone-900">Verified Boats</h2>
                        <p className="text-[11px] text-stone-500 mt-0.5">Fixed rates, life jackets & safe ghat pickup</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                        <span className="text-xl block mb-1">🚗</span>
                        <h2 className="font-serif font-bold text-xs text-stone-900">Doorstep AC Taxis</h2>
                        <p className="text-[11px] text-stone-500 mt-0.5">Airport pickup, Sarnath & Ayodhya day tours</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 text-center shadow-2xs">
                        <span className="text-xl block mb-1">🕉️</span>
                        <h2 className="font-serif font-bold text-xs text-stone-900">Sugam Darshan</h2>
                        <p className="text-[11px] text-stone-500 mt-0.5">Kashi Vishwanath VIP coordination</p>
                    </div>
                </div>

                {/* Form Embedded with Partner Context */}
                <QuickTripPlanner
                    partnerId={partner.partnerCode}
                    qrId={qrId}
                    title={`Guest Travel Request — ${formattedPartner}`}
                    subtitle="Our local team coordinates directly with your schedule. No middlemen, no commissions."
                />

                {/* Immediate WhatsApp & Call Action */}
                <div className="mt-8 text-center space-y-2">
                    <a
                        href={`https://wa.me/918149783494?text=Namaste!%20I%20am%20a%20guest%20at%20${encodeURIComponent(formattedPartner)}%20and%20scanned%20the%20QR%20code.`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWhatsAppClick(`partner_qr_${partner.partnerCode}`, { source: 'HOTEL_QR', partnerId: partner.partnerCode })}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                    >
                        <span>Need Immediate Assistance? Chat on WhatsApp</span>
                        <span>💬</span>
                    </a>
                    <div className="text-[11px] text-stone-500">
                        Or speak with our desk: <a href="tel:+918400554029" className="text-amber-800 font-bold font-mono hover:underline">+91 84005 54029</a> · Email: <a href="mailto:info.varanasi.yatra@gmail.com" className="hover:underline">info.varanasi.yatra@gmail.com</a>
                    </div>
                </div>
            </div>
        </>
    );
}

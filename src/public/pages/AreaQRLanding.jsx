import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import QuickTripPlanner from '../components/QuickTripPlanner';
import { trackWhatsAppClick, trackQRScan } from '../utils/analytics';
import { setAreaQrAttribution } from '../utils/attribution';

export default function AreaQRLanding() {
    const { qrId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [qrData, setQrData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusError, setStatusError] = useState(null);

    useEffect(() => {
        if (!qrId) {
            setIsLoading(false);
            setStatusError('NOT_FOUND');
            return;
        }

        let isMounted = true;
        const normalizedQrId = String(qrId).trim().toUpperCase();

        async function resolveQR() {
            try {
                const res = await fetch(`/public/qr/${normalizedQrId}`);
                const data = await res.json();

                if (!isMounted) return;

                if (!res.ok || !data.success) {
                    setStatusError(data.error || 'NOT_FOUND');
                    return;
                }

                // If this QR was replaced and has an active replacement redirect
                if (data.redirected && data.targetQrId && data.targetQrId !== normalizedQrId) {
                    navigate(`/q/${data.targetQrId}`, { replace: true });
                    return;
                }

                const qr = data.qr;
                if (!qr || qr.active === false) {
                    setStatusError(data.status || 'INACTIVE');
                    return;
                }

                setQrData(qr);

                // Set attribution in sessionStorage
                setAreaQrAttribution({
                    qrId: qr.qrId,
                    areaId: qr.areaId,
                    areaName: qr.areaName,
                    qrType: qr.qrType,
                    placementName: qr.placementName || '',
                    venueName: qr.venueName || '',
                    landingPath: location.pathname
                });

                // Deduped session scan tracking
                const sessionKey = `vy_qr_scanned_${qr.qrId}`;
                if (typeof window !== 'undefined' && !window.sessionStorage.getItem(sessionKey)) {
                    window.sessionStorage.setItem(sessionKey, '1');
                    fetch(`/public/qr/${qr.qrId}/scan`, { method: 'POST' }).catch(() => {});
                }

                trackQRScan(qr.areaName || 'AREA_QR', qr.qrId);
            } catch {
                if (isMounted) {
                    setStatusError('SERVER_ERROR');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        resolveQR();

        return () => {
            isMounted = false;
        };
    }, [qrId, location.pathname, navigate]);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <div className="w-12 h-12 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs font-mono text-stone-500 uppercase tracking-wider">Connecting to Varanasi Travel Concierge...</p>
            </div>
        );
    }

    // Inactive / Damaged / Missing / Invalid QR state
    if (statusError || !qrData) {
        return (
            <>
                <SEO
                    title="Varanasi Travel Concierge | Kashi-Vashi"
                    description="Verified local travel concierge for devotees and visitors in Varanasi."
                    canonicalPath={`/q/${qrId || ''}`}
                    noIndex={true}
                />
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 sm:p-10 text-center shadow-xs">
                        <span className="text-3xl block mb-3">🪔</span>
                        <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
                            Welcome to Kashi-Vashi
                        </h1>
                        <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
                            This travel desk poster is currently undergoing scheduled maintenance or has been updated. You can still plan your custom darshan, boat rides, and private cabs directly with our verified local team.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                to="/plan-your-trip"
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-xs"
                            >
                                Plan Trip With Central Concierge ➔
                            </Link>
                            <a
                                href="https://wa.me/918149783494?text=Namaste!%20I%20scanned%20a%20Kashi-Vashi%20poster%20and%20need%20travel%20assistance."
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick('area_qr_inactive_fallback')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-xs"
                            >
                                WhatsApp Central Support
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const displayName = qrData.venueName || qrData.placementName || (qrData.areaName ? `${qrData.areaName} Desk` : 'Varanasi Central');
    const waMessage = `Namaste! I scanned the Kashi-Vashi travel desk at ${displayName} and would like to arrange my trip.`;

    return (
        <>
            <SEO
                title={`Spiritual Travel Concierge — ${displayName} | Kashi-Vashi`}
                description={`Official travel assistance desk at ${displayName}. Verified Kashi Vishwanath darshan, private sunrise boats, and AC cabs.`}
                canonicalPath={`/q/${qrData.qrId}`}
                noIndex={true}
            />

            <main className="bg-stone-50 min-h-screen py-8 sm:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
                    {/* Header Banner */}
                    <header className="bg-gradient-to-r from-amber-700 to-amber-900 text-white rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-amber-600/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-amber-600/30 border border-amber-400/40 px-3 py-1 rounded-full text-xs font-medium text-amber-200 mb-3">
                                <span>📍</span>
                                <span>{qrData.areaName || 'Varanasi'} Travel Concierge</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-2 leading-tight">
                                Experience Varanasi with Verified Local Care
                            </h1>
                            <p className="text-amber-100/90 text-sm sm:text-base mb-6 leading-relaxed">
                                Welcome from <strong className="text-amber-300 font-semibold">{displayName}</strong>. Get Sugam VIP Darshan, private Ganges boats, verified Vedic pandits, and reliable cabs — with 100% price transparency.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <a
                                    href={`https://wa.me/918149783494?text=${encodeURIComponent(waMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => trackWhatsAppClick(`area_qr_${qrData.qrId}`)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
                                >
                                    <span>💬</span>
                                    <span>Instant WhatsApp Booking</span>
                                </a>
                                <a
                                    href="tel:+918149783494"
                                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                                >
                                    <span>📞</span>
                                    <span>Direct Call</span>
                                </a>
                            </div>
                        </div>
                    </header>

                    {/* Trust Highlights */}
                    <section aria-label="Service Highlights" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-lg shrink-0">
                                🕉️
                            </div>
                            <div>
                                <h2 className="font-serif font-bold text-sm text-stone-900">VIP Darshan Support</h2>
                                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                                    Sugam Darshan guidance & protocol coordination for hassle-free darshan.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-lg shrink-0">
                                ⛵
                            </div>
                            <div>
                                <h2 className="font-serif font-bold text-sm text-stone-900">Private Ganges Boats</h2>
                                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                                    Sunrise & evening Ganga Aarti rides with life jackets and verified boatmen.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-lg shrink-0">
                                🛡️
                            </div>
                            <div>
                                <h2 className="font-serif font-bold text-sm text-stone-900">Zero Commission Trap</h2>
                                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                                    Fixed, transparent quotes. No unauthorized detours to commission shops.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Quick Trip Planner Form */}
                    <section aria-label="Trip Planner Form">
                        <QuickTripPlanner
                            qrId={qrData.qrId}
                            title={`Plan Your Varanasi Visit from ${displayName}`}
                            subtitle="Share your dates and requirements. We'll send a transparent, custom itinerary in 30 minutes."
                        />
                    </section>
                </div>
            </main>
        </>
    );
}

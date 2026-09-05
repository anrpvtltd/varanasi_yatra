import React, { useState } from 'react';
import { trackTripPlannerStart, trackTripPlannerSubmit, trackWhatsAppClick } from '../utils/analytics';
import { getAttribution } from '../utils/attribution';

const REQUIREMENT_OPTIONS = [
    { id: 'darshan', label: 'Temple Darshan (VIP / Sugam)', icon: '🕉️' },
    { id: 'boat', label: 'Boat Ride (Sunrise / Sunset Aarti)', icon: '⛵' },
    { id: 'transport', label: 'Private AC Cab / Airport Pickup', icon: '🚗' },
    { id: 'hotel', label: 'Hotel / Heritage Stay Guidance', icon: '🏨' },
    { id: 'guide', label: 'Verified Local Guide', icon: '🧭' },
    { id: 'pandit', label: 'Pandit / Vedic Rituals', icon: '🪔' },
    { id: 'shopping', label: 'Authentic Banarasi Silk & Craft Walk', icon: '🧵' },
    { id: 'complete', label: 'Complete Custom Yatra Package', icon: '✨' }
];

export default function QuickTripPlanner({
    partnerId = '',
    qrId = '',
    initialPackage = '',
    title = 'Quick Trip Planner',
    subtitle = 'Tell us what you need in Varanasi — get a transparent, custom itinerary in 30 minutes.'
}) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        travelDate: '',
        duration: '2 Days / 1 Night',
        guests: '2 Adults',
        comingFrom: '',
        requirements: initialPackage ? [initialPackage] : ['darshan', 'boat'],
        website_hp: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [startedTracking, setStartedTracking] = useState(false);

    const handleFocus = () => {
        if (!startedTracking) {
            setStartedTracking(true);
            trackTripPlannerStart();
        }
    };

    const handleRequirementToggle = (id) => {
        handleFocus();
        setFormData((prev) => {
            const exists = prev.requirements.includes(id);
            const updated = exists
                ? prev.requirements.filter((item) => item !== id)
                : [...prev.requirements, id];
            return { ...prev, requirements: updated };
        });
    };

    const handleChange = (e) => {
        handleFocus();
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        // Validation
        if (!formData.name.trim() || formData.name.trim().length < 2) {
            setErrorMessage('Please enter your full name (minimum 2 characters).');
            return;
        }

        const phoneClean = formData.phone.replace(/[^0-9]/g, '');
        if (phoneClean.length < 10) {
            setErrorMessage('Please enter a valid 10-digit mobile number.');
            return;
        }

        if (formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                setErrorMessage('Please enter a valid email address.');
                return;
            }
        }

        setIsSubmitting(true);

        const attr = getAttribution();
        const finalSource = partnerId ? 'HOTEL_QR' : (attr.source || 'WEBSITE');
        const finalPartnerId = partnerId || attr.partnerId || null;
        const finalQrId = qrId || attr.qrId || null;

        const payload = {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim() || undefined,
            travelDate: formData.travelDate || 'Flexible / Upcoming',
            guests: formData.guests,
            duration: formData.duration,
            comingFrom: formData.comingFrom.trim() || 'Not specified',
            requirements: formData.requirements,
            source: finalSource,
            partnerId: finalPartnerId,
            qrId: finalQrId,
            landingPath: typeof window !== 'undefined' ? window.location.pathname : '',
            utm: {
                source: attr.utmSource || null,
                medium: attr.utmMedium || null,
                campaign: attr.utmCampaign || null,
                term: attr.utmTerm || null,
                content: attr.utmContent || null
            },
            website_hp: formData.website_hp
        };

        try {
            // 1. Semantic Public Lead endpoint
            const res = await fetch('/public/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSubmitted(true);
                trackTripPlannerSubmit({
                    success: true,
                    requirements: formData.requirements,
                    source: finalSource,
                    partnerId: finalPartnerId
                });
            } else {
                // 2. Fallback to legacy endpoint if /public/leads is unreachable
                const fallbackRes = await fetch('/api/enquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: payload.name,
                        mobile: payload.phone,
                        email: payload.email,
                        date: payload.travelDate,
                        travelers: payload.guests,
                        destination: 'Varanasi',
                        specialRequirements: formData.requirements.join(', '),
                        pickup: payload.comingFrom,
                        leadSource: finalSource === 'HOTEL_QR' ? 'QR' : 'Website'
                    })
                });

                setSubmitted(true);
                trackTripPlannerSubmit({
                    success: fallbackRes.ok,
                    requirements: formData.requirements,
                    source: finalSource,
                    partnerId: finalPartnerId
                });
            }
        } catch {
            // Network fallback: mark submitted so traveler can proceed to WhatsApp without frustration
            setSubmitted(true);
            trackTripPlannerSubmit({
                success: false,
                requirements: formData.requirements,
                source: finalSource,
                partnerId: finalPartnerId
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        const waText = encodeURIComponent(
            `Namaste Varanasi Yatra! I just submitted a trip request for ${formData.name} (${formData.guests}, arriving ${formData.travelDate || 'soon'}). Requirements: ${formData.requirements.join(', ')}.`
        );

        return (
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200/80 shadow-lg text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                    ✓
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                    Har Har Mahadev, {formData.name}!
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                    We have received your trip request. Our local Varanasi travel coordinator will review your dates and requirements and share a custom itinerary on WhatsApp/Call.
                </p>

                <div className="bg-stone-50 rounded-2xl p-4 mb-6 text-left text-xs space-y-1.5 border border-stone-200/60">
                    <p className="text-stone-500 font-medium">Request Summary:</p>
                    <p className="text-stone-800 font-semibold">Travelers: <span className="font-normal">{formData.guests} • {formData.duration}</span></p>
                    <p className="text-stone-800 font-semibold">Travel Date: <span className="font-normal">{formData.travelDate || 'Flexible'}</span></p>
                    <p className="text-stone-800 font-semibold">Services: <span className="font-normal">{formData.requirements.join(', ') || 'Custom'}</span></p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href={`https://wa.me/918149783494?text=${waText}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWhatsAppClick('trip_planner_success_screen')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md inline-flex items-center justify-center gap-2"
                    >
                        <span>Chat Now on WhatsApp</span>
                        <span>💬</span>
                    </a>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setFormData({
                                name: '',
                                phone: '',
                                email: '',
                                travelDate: '',
                                duration: '2 Days / 1 Night',
                                guests: '2 Adults',
                                comingFrom: '',
                                requirements: ['darshan', 'boat']
                            });
                        }}
                        className="text-stone-600 hover:text-stone-900 font-bold text-sm px-5 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                    >
                        Plan Another Trip
                    </button>
                </div>
            </div>
        );
    }

    return (
        <section id="trip-planner" className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-md">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <span className="text-[11px] uppercase tracking-widest font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
                        Transparent • No Middlemen
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900">
                        {title}
                    </h2>
                    <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                        ⚠️ {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot Spam Protection (Hidden from legitimate users) */}
                    <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
                        <label htmlFor="website_hp">Do not fill this field</label>
                        <input
                            type="text"
                            id="website_hp"
                            name="website_hp"
                            value={formData.website_hp}
                            onChange={handleChange}
                            tabIndex="-1"
                            autoComplete="off"
                        />
                    </div>

                    {/* Row 1: Date, Guests, Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="planner-travel-date" className="block text-xs font-bold text-stone-700 mb-1.5">
                                Travel Date
                            </label>
                            <input
                                id="planner-travel-date"
                                type="date"
                                name="travelDate"
                                value={formData.travelDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="planner-guests" className="block text-xs font-bold text-stone-700 mb-1.5">
                                Number of Guests
                            </label>
                            <select
                                id="planner-guests"
                                name="guests"
                                value={formData.guests}
                                onChange={handleChange}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
                            >
                                <option value="Solo Traveler">Solo Traveler (1 Person)</option>
                                <option value="2 Adults">Couple / 2 Adults</option>
                                <option value="Family (3-4 Persons)">Family (3–4 Persons)</option>
                                <option value="Family (5-8 Persons)">Large Family (5–8 Persons)</option>
                                <option value="Group (9+ Persons)">Group / Satsang (9+ Persons)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="planner-duration" className="block text-xs font-bold text-stone-700 mb-1.5">
                                Duration in Varanasi
                            </label>
                            <select
                                id="planner-duration"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition cursor-pointer"
                            >
                                <option value="1 Day (Express / Same-Day)">1 Day (Express / Same-Day)</option>
                                <option value="2 Days / 1 Night">2 Days / 1 Night</option>
                                <option value="3 Days / 2 Nights">3 Days / 2 Nights</option>
                                <option value="4+ Days Circuit (Varanasi + Ayodhya / Gaya)">4+ Days Circuit (Varanasi + Ayodhya / Gaya)</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Coming from */}
                    <div>
                        <label htmlFor="planner-coming-from" className="block text-xs font-bold text-stone-700 mb-1.5">
                            Where are you traveling from? (City / Flight / Train)
                        </label>
                        <input
                            id="planner-coming-from"
                            type="text"
                            name="comingFrom"
                            value={formData.comingFrom}
                            onChange={handleChange}
                            placeholder="e.g. Mumbai / Delhi flight / Varanasi Junction Train"
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                        />
                    </div>

                    {/* Requirements Checkbox Grid */}
                    <div>
                        <span className="block text-xs font-bold text-stone-700 mb-2">
                            What services do you need? (Select all that apply)
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {REQUIREMENT_OPTIONS.map((opt) => {
                                const selected = formData.requirements.includes(opt.id);
                                return (
                                    <button
                                        type="button"
                                        key={opt.id}
                                        onClick={() => handleRequirementToggle(opt.id)}
                                        className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between cursor-pointer ${
                                            selected
                                                ? 'bg-amber-50 border-amber-500 text-amber-950 font-semibold ring-1 ring-amber-500 shadow-xs'
                                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100/70 hover:border-stone-300'
                                        }`}
                                    >
                                        <span className="text-base mb-1" aria-hidden="true">{opt.icon}</span>
                                        <span className="text-[11px] leading-snug">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 3: Name, Phone, Email */}
                    <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="planner-name" className="block text-xs font-bold text-stone-700 mb-1.5">
                                Your Full Name <span className="text-amber-600">*</span>
                            </label>
                            <input
                                id="planner-name"
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Ramesh Sharma"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="planner-phone" className="block text-xs font-bold text-stone-700 mb-1.5">
                                WhatsApp / Phone <span className="text-amber-600">*</span>
                            </label>
                            <input
                                id="planner-phone"
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="10-digit mobile number"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="planner-email" className="block text-xs font-bold text-stone-700 mb-1.5">
                                Email (Optional)
                            </label>
                            <input
                                id="planner-email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. ramesh@gmail.com"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 font-medium focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Creating Your Plan...</span>
                                </>
                            ) : (
                                <>
                                    <span>Get My Trip Plan</span>
                                    <span aria-hidden="true">➔</span>
                                </>
                            )}
                        </button>
                        <p className="text-center text-[11px] text-stone-500 mt-2">
                            🔒 100% Privacy. No spam, no automated sales calls. You will receive an authentic Varanasi itinerary from our local team.
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
}

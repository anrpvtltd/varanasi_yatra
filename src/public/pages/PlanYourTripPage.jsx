import React from 'react';
import { useLocation } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import QuickTripPlanner from '../components/QuickTripPlanner';
import { trackWhatsAppClick } from '../utils/analytics';

export default function PlanYourTripPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialExperience = queryParams.get('experience') || '';
    const initialTour = queryParams.get('tour') || '';

    const initialRequirement = initialExperience || initialTour || '';

    return (
        <>
            <SEO
                title="Plan Your Varanasi Trip | Custom Spiritual Itineraries & Transparent Quotes | Varanasi Yatra"
                description="Design your custom pilgrimage or vacation in Varanasi. Choose your travel dates, preferred boat rides, temple darshan, and private transport with complete transparency."
                pathname="/plan-your-trip"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Plan Your Trip' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mx-auto mb-10 text-center">
                    <SectionHeading
                        as="h1"
                        align="center"
                        eyebrow="Custom Travel Facilitation"
                        title="Plan Your Varanasi Yatra"
                        description="Tell us your travel dates, group size, and what you wish to experience. Our local Varanasi team will craft a relaxed, transparent itinerary tailored to your family's pace."
                    />
                </div>

                <div className="max-w-4xl mx-auto">
                    <QuickTripPlanner
                        initialPackage={initialRequirement}
                        title="Customize Your Pilgrimage & Tour"
                        subtitle="No fixed templates. We adapt the schedule to your flight/train arrival and mobility requirements."
                    />
                </div>

                {/* Trust and Assurance Cards */}
                <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="bg-white p-6 rounded-2xl border border-stone-200">
                        <span className="text-2xl mb-2 block" aria-hidden="true">⏱️</span>
                        <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">Fast Response</h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                            Receive a transparent, unhurried day-by-day itinerary proposal within 30–60 minutes during operating hours.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200">
                        <span className="text-2xl mb-2 block" aria-hidden="true">👴👵</span>
                        <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">Senior-Friendly Care</h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                            We minimize steep steps, coordinate e-rickshaws, and ensure comfortable temple queue assistance for elders.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-stone-200">
                        <span className="text-2xl mb-2 block" aria-hidden="true">🛡️</span>
                        <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">Transparent Pricing</h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                            Fixed pre-agreed pricing for private AC cabs, boat charters, and verified local guides. Zero surprise fees.
                        </p>
                    </div>
                </div>

                {/* Direct WhatsApp Callout */}
                <div className="mt-10 text-center text-xs text-stone-500">
                    Prefer speaking directly to a human right now?{' '}
                    <a
                        href="https://wa.me/918149783494?text=Namaste!%20I%20want%20to%20plan%20my%20Varanasi%20trip."
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackWhatsAppClick('plan_trip_page_direct')}
                        className="text-emerald-700 font-bold hover:underline"
                    >
                        Chat on WhatsApp (+91 81497 83494)
                    </a>{' '}
                    or call our helpline at{' '}
                    <a href="tel:+918400554029" className="text-amber-800 font-bold font-mono hover:underline">
                        +91 84005 54029
                    </a>.
                </div>
            </div>
        </>
    );
}

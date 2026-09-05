import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import GuideCard from '../components/GuideCard';
import { TRAVEL_GUIDES } from '../data/travelGuidesData';

export default function TravelGuideHubPage() {
    return (
        <>
            <SEO
                title="Varanasi Travel Guide & Practical Tips | Timings, Weather & Transport | Varanasi Yatra"
                description="Practical, unhurried guides to exploring Varanasi. Verified Aarti timings, seasonal weather insights, Ghat etiquette, and local cab information."
                pathname="/travel-guide"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Travel Guide' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mb-10">
                    <SectionHeading
                        as="h1"
                        eyebrow="Local Insider Insights"
                        title="Varanasi Travel Guides & Practical Advice"
                        description="Written by people who navigate the ghats, alleys, and temple corridors daily. Practical answers to help you travel with confidence and peace of mind."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TRAVEL_GUIDES.map((guide) => (
                        <GuideCard key={guide.slug} guide={guide} />
                    ))}
                </div>

                {/* Additional Quick Tips Banner */}
                <div className="mt-14 bg-stone-900 text-white rounded-3xl p-8 sm:p-10">
                    <div className="max-w-2xl">
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-2">
                            Quick Varanasi Rules of Thumb
                        </span>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-3">
                            3 Things to Always Keep in Mind
                        </h2>
                        <ul className="space-y-2 text-xs text-stone-300 leading-relaxed">
                            <li>• <strong>Photography Restrictions:</strong> Photography is strictly prohibited inside the inner sanctum of Kashi Vishwanath and at Manikarnika/Harishchandra cremation ghats out of respect for departed souls.</li>
                            <li>• <strong>Footwear Protocol:</strong> Wear slip-on shoes or sandals without complicated laces, as you will be removing them frequently at temple gates and ghat platforms.</li>
                            <li>• <strong>Morning Starts Early:</strong> The most sublime energy in Varanasi unfolds between 5:15 AM and 7:00 AM on the river. Plan an early bedtime to embrace dawn on the Ganga.</li>
                        </ul>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <h3 className="font-serif font-bold text-lg text-stone-900 mb-2">
                        Have a Specific Question About Your Varanasi Trip?
                    </h3>
                    <p className="text-stone-600 text-xs mb-4">
                        Our local team is happy to answer practical questions about temple queues, elderly assistance, or train timings.
                    </p>
                    <Link
                        to="/contact"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition shadow-sm inline-block"
                    >
                        Ask Our Local Team
                    </Link>
                </div>
            </div>
        </>
    );
}

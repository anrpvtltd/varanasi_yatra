import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import TourCard from '../components/TourCard';
import { TOURS } from '../data/toursData';

export default function ToursHubPage() {
    return (
        <>
            <SEO
                title="Varanasi Tour Packages & Spiritual Circuits | Varanasi Yatra"
                description="Browse handpicked Varanasi tour itineraries: 1-Day Kashi Darshan, 2-Day Varanasi & Sarnath, 3-Day Custom Circuit, and day excursions to Ayodhya & Bodh Gaya."
                pathname="/tours"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Tours & Packages' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mb-10">
                    <SectionHeading
                        as="h1"
                        eyebrow="Curated Pilgrimages & Day Tours"
                        title="Varanasi Tour Packages & Regional Circuits"
                        description="Every itinerary is flexible and customized to your arrival timings and family needs. We combine clean private AC transport, verified boat charters, and respectful darshan facilitation."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TOURS.map((tour) => (
                        <TourCard key={tour.slug} tour={tour} />
                    ))}
                </div>

                {/* Custom Itinerary Notice */}
                <div className="mt-14 bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-sm text-center max-w-3xl mx-auto">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-3">
                        Tailor-Made Pilgrimages
                    </span>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
                        Need a Custom Pilgrimage Schedule?
                    </h2>
                    <p className="text-stone-600 text-xs sm:text-sm mb-6 max-w-xl mx-auto">
                        Tell us your train/flight arrival, hotel preferences, or special Vedic ritual requirements. We will prepare an unhurried, comfortable schedule for your family.
                    </p>
                    <Link
                        to="/plan-your-trip"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md inline-block"
                    >
                        Create Custom Itinerary
                    </Link>
                </div>
            </div>
        </>
    );
}

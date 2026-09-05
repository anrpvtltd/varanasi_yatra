import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { DESTINATIONS } from '../data/destinationsData';

export default function DestinationsHubPage() {
    return (
        <>
            <SEO
                title="Destinations & Sacred Circuits | Varanasi, Sarnath & Beyond | Varanasi Yatra"
                description="Explore Varanasi (Kashi), Sarnath, Ayodhya Ji, and Bodh Gaya. Comprehensive local destination guides, key sacred sites, and ideal travel seasons."
                pathname="/destinations"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Destinations' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mb-10">
                    <SectionHeading
                        as="h1"
                        eyebrow="Sacred Geography of Northern India"
                        title="Destinations & Pilgrim Circuits"
                        description="From the ancient ghats of Kashi to the tranquil deer parks of Sarnath, explore key spiritual centers with verified local coordination."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {DESTINATIONS.map((dest) => (
                        <article
                            key={dest.slug}
                            className="group bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col"
                        >
                            <Link to={`/destinations/${dest.slug}`} className="block relative aspect-[16/9] overflow-hidden">
                                <ImageWithSkeleton
                                    src={dest.image}
                                    alt={dest.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <span className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-sm text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-stone-700/60">
                                    {dest.idealDays}
                                </span>
                            </Link>

                            <div className="p-6 sm:p-8 flex flex-col flex-grow">
                                <span className="text-xs font-bold tracking-widest text-amber-700 uppercase mb-1">
                                    {dest.tagline}
                                </span>
                                <h3 className="text-2xl font-serif font-bold text-stone-900 group-hover:text-amber-700 transition-colors mb-2">
                                    <Link to={`/destinations/${dest.slug}`}>
                                        {dest.name}
                                    </Link>
                                </h3>

                                <p className="text-stone-600 text-xs leading-relaxed line-clamp-3 mb-6 flex-grow">
                                    {dest.overview}
                                </p>

                                <div className="space-y-2 mb-6 text-xs text-stone-700">
                                    <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                                        <span className="font-semibold text-stone-800">Best Season:</span>
                                        <span>{dest.bestSeason}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                                        <span className="font-semibold text-stone-800">Connectivity:</span>
                                        <span className="truncate max-w-[200px] text-right">{dest.connectivity}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Link
                                        to={`/destinations/${dest.slug}`}
                                        className="text-xs font-bold text-stone-900 group-hover:text-amber-700 inline-flex items-center gap-1.5 transition-colors"
                                    >
                                        <span>Explore Destination Guide</span>
                                        <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
                                    </Link>
                                    <Link
                                        to={`/plan-your-trip?destination=${dest.slug}`}
                                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-lg transition-colors border border-amber-200"
                                    >
                                        Plan Yatra
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </>
    );
}

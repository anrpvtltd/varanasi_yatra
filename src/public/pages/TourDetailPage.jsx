import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import TourCard from '../components/TourCard';
import { TOURS } from '../data/toursData';
import { trackWhatsAppClick } from '../utils/analytics';

export default function TourDetailPage() {
    const { slug } = useParams();
    const tour = TOURS.find((t) => t.slug === slug);

    if (!tour) {
        return <Navigate to="/tours" replace />;
    }

    const {
        title,
        tagline,
        duration,
        image,
        badge,
        startingPrice,
        priceNote,
        overview,
        itinerary,
        inclusions,
        exclusions,
        idealFor,
        practicalTips,
        faqs,
        relatedSlugs
    } = tour;

    const relatedTours = TOURS.filter((t) =>
        relatedSlugs && relatedSlugs.includes(t.slug)
    );

    return (
        <>
            <SEO
                title={`${title} | Varanasi Yatra`}
                description={overview}
                pathname={`/tours/${slug}`}
                image={image}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'TourPackage',
                    name: title,
                    description: overview,
                    provider: {
                        '@type': 'TravelAgency',
                        name: 'Varanasi Yatra'
                    },
                    offers: startingPrice ? {
                        '@type': 'Offer',
                        price: startingPrice.replace(/[^0-9]/g, ''),
                        priceCurrency: 'INR'
                    } : undefined
                }}
            />

            {/* Breadcrumb Bar */}
            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Tours', href: '/tours' },
                            { label: title }
                        ]}
                    />
                </div>
            </div>

            <article className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                {/* Hero Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-center">
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                            <span>{badge || 'Curated Itinerary'}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-stone-900 leading-tight mb-4">
                            {title}
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                            {tagline}
                        </p>

                        <div className="flex flex-wrap gap-4 py-4 border-y border-stone-200 text-xs text-stone-700 mb-6">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">Duration:</span>
                                <span>{duration}</span>
                            </div>
                            {startingPrice && (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-stone-900">Starting Price:</span>
                                    <span className="text-stone-950 font-bold font-mono">{startingPrice}</span>
                                    {priceNote && <span className="text-stone-500">({priceNote})</span>}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">Vehicle:</span>
                                <span>Private AC Dedicated Cab</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to={`/plan-your-trip?tour=${slug}`}
                                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition"
                            >
                                Book / Customize Itinerary
                            </Link>
                            <a
                                href={`https://wa.me/918149783494?text=Namaste!%20I%20am%20interested%20in%20the%20${encodeURIComponent(title)}%20tour.`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick(`tour_${slug}`)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3.5 rounded-xl shadow-sm transition inline-flex items-center gap-2"
                            >
                                <span>WhatsApp Us</span>
                                <span>💬</span>
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-md aspect-[4/3]">
                            <ImageWithSkeleton
                                src={image}
                                alt={title}
                                className="w-full h-full object-cover"
                                priority={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        {/* Overview */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-3">
                                Tour Overview
                            </h2>
                            <p className="text-stone-700 text-sm leading-relaxed">
                                {overview}
                            </p>
                        </section>

                        {/* Itinerary Timeline */}
                        {itinerary && itinerary.length > 0 && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-6">
                                    Detailed Itinerary
                                </h2>
                                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-amber-200">
                                    {itinerary.map((slot, idx) => (
                                        <div key={idx} className="relative pl-10">
                                            <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-amber-600 border-2 border-white shadow-xs -translate-x-1/2" />
                                            <span className="text-[11px] font-bold tracking-wider uppercase text-amber-700 block mb-0.5">
                                                {slot.time || `Phase ${idx + 1}`}
                                            </span>
                                            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
                                                {slot.title}
                                            </h3>
                                            <p className="text-stone-600 text-xs leading-relaxed">
                                                {slot.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Inclusions & Exclusions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <section className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-200/70">
                                <h3 className="font-serif font-bold text-base text-emerald-950 mb-3 flex items-center gap-2">
                                    <span>✓</span>
                                    <span>Inclusions</span>
                                </h3>
                                <ul className="text-xs text-stone-700 space-y-2">
                                    {inclusions && inclusions.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="bg-stone-50 rounded-3xl p-6 border border-stone-200">
                                <h3 className="font-serif font-bold text-base text-stone-900 mb-3 flex items-center gap-2">
                                    <span>✕</span>
                                    <span>Exclusions</span>
                                </h3>
                                <ul className="text-xs text-stone-600 space-y-2">
                                    {exclusions && exclusions.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="text-stone-400 font-bold">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Ideal For */}
                        {idealFor && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                                <h3 className="font-serif font-bold text-lg text-stone-900 mb-3">
                                    Who Is This Tour Ideal For?
                                </h3>
                                <p className="text-xs text-stone-700 leading-relaxed">
                                    {idealFor}
                                </p>
                            </section>
                        )}

                        {/* Practical Tips */}
                        {practicalTips && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                                <h3 className="font-serif font-bold text-lg text-stone-900 mb-4">
                                    Practical Guidelines for This Route
                                </h3>
                                <div className="space-y-2.5 text-xs text-stone-700">
                                    {practicalTips.map((tip, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <span className="text-amber-600 font-bold">ℹ️</span>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* FAQs */}
                        {faqs && faqs.length > 0 && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                                <h3 className="font-serif font-bold text-lg text-stone-900 mb-4">
                                    Tour FAQs
                                </h3>
                                <div className="space-y-3">
                                    {faqs.map((faq, idx) => (
                                        <details key={idx} className="group bg-stone-50 rounded-xl p-3.5 border border-stone-200/80">
                                            <summary className="font-serif font-bold text-xs sm:text-sm text-stone-900 cursor-pointer flex items-center justify-between list-none">
                                                <span>{faq.q}</span>
                                                <span className="text-amber-600 group-open:rotate-180 transition-transform font-mono text-xs">▼</span>
                                            </summary>
                                            <p className="text-xs text-stone-600 leading-relaxed mt-2.5 pt-2.5 border-t border-stone-200/60">
                                                {faq.a}
                                            </p>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Sticky Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm sticky top-20">
                            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
                                Book or Customize
                            </h3>
                            <p className="text-stone-600 text-xs leading-relaxed mb-4">
                                Private, non-rushed yatra arrangement. Every booking includes a designated local point of contact.
                            </p>

                            {startingPrice && (
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 mb-4">
                                    <span className="text-[11px] text-stone-600 block">Indicative Rate:</span>
                                    <span className="text-lg font-serif font-black text-amber-950">{startingPrice}</span>
                                    {priceNote && <span className="text-[11px] text-stone-500 block">{priceNote}</span>}
                                </div>
                            )}

                            <Link
                                to={`/plan-your-trip?tour=${slug}`}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-center py-3 rounded-xl font-bold text-xs uppercase tracking-wider block transition shadow-sm mb-3"
                            >
                                Request Itinerary & Quote
                            </Link>

                            <a
                                href={`https://wa.me/918149783494?text=Namaste!%20I%20would%20like%20to%20customize%20the%20${encodeURIComponent(title)}%20tour.`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick(`sidebar_tour_${slug}`)}
                                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-center py-2.5 rounded-xl font-semibold text-xs block transition border border-stone-300"
                            >
                                Chat With Local Coordinator
                            </a>

                            <div className="mt-4 pt-4 border-t border-stone-100 text-[11px] text-stone-500 text-center">
                                Direct Phone: <a href="tel:+918400554029" className="text-amber-700 font-bold font-mono">+91 84005 54029</a>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Related Tours */}
                {relatedTours.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-stone-200">
                        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">
                            Other Recommended Tours
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedTours.map((rel) => (
                                <TourCard key={rel.slug} tour={rel} />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
}

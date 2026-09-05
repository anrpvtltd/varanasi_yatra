import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { DESTINATIONS } from '../data/destinationsData';
import { trackWhatsAppClick } from '../utils/analytics';

export default function DestinationDetailPage() {
    const { slug } = useParams();
    const destination = DESTINATIONS.find((d) => d.slug === slug);

    if (!destination) {
        return <Navigate to="/destinations" replace />;
    }

    const {
        name,
        tagline,
        image,
        idealDays,
        bestSeason,
        connectivity,
        overview,
        keyAttractions,
        practicalTips,
        faqs
    } = destination;

    return (
        <>
            <SEO
                title={`${name} Travel Guide | Varanasi Yatra`}
                description={overview}
                pathname={`/destinations/${slug}`}
                image={image}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Place',
                    name,
                    description: overview,
                    url: `https://varanasiyatra.com/destinations/${slug}`
                }}
            />

            {/* Breadcrumb Bar */}
            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Destinations', href: '/destinations' },
                            { label: name }
                        ]}
                    />
                </div>
            </div>

            <article className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                {/* Hero Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-center">
                    <div className="lg:col-span-7">
                        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                            <span>Pilgrim Circuit</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-stone-900 leading-tight mb-4">
                            {name}
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                            {tagline}
                        </p>

                        <div className="flex flex-wrap gap-4 py-4 border-y border-stone-200 text-xs text-stone-700 mb-6">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">Recommended Stay:</span>
                                <span>{idealDays}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">Best Season:</span>
                                <span>{bestSeason}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">Connectivity:</span>
                                <span>{connectivity}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to={`/plan-your-trip?destination=${slug}`}
                                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition"
                            >
                                Plan {name} Yatra
                            </Link>
                            <a
                                href={`https://wa.me/918149783494?text=Namaste!%20I%20would%20like%20to%20plan%20a%20visit%20to%20${encodeURIComponent(name)}.`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick(`dest_${slug}`)}
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
                                alt={name}
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
                                About {name}
                            </h2>
                            <p className="text-stone-700 text-sm leading-relaxed">
                                {overview}
                            </p>
                        </section>

                        {/* Key Attractions */}
                        {keyAttractions && keyAttractions.length > 0 && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-6">
                                    Key Sacred & Heritage Sites
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {keyAttractions.map((site, idx) => (
                                        <div key={idx} className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80">
                                            <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">
                                                {site.name}
                                            </h3>
                                            <p className="text-stone-600 text-xs leading-relaxed">
                                                {site.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Practical Guidelines */}
                        {practicalTips && practicalTips.length > 0 && (
                            <section className="bg-amber-50/50 rounded-3xl p-6 sm:p-8 border border-amber-200/70">
                                <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 mb-4">
                                    Practical Traveler Tips for {name}
                                </h2>
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
                                <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 mb-4">
                                    Frequently Asked Questions
                                </h2>
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

                    {/* Sidebar CTA */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm sticky top-20">
                            <h3 className="font-serif font-bold text-base text-stone-900 mb-2">
                                Plan Your {name} Trip
                            </h3>
                            <p className="text-stone-600 text-xs leading-relaxed mb-6">
                                Private transport, hotel selection near major sites, and knowledgeable guide escort arranged by Varanasi Yatra.
                            </p>

                            <Link
                                to={`/plan-your-trip?destination=${slug}`}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-center py-3 rounded-xl font-bold text-xs uppercase tracking-wider block transition shadow-sm mb-3"
                            >
                                Request Custom Itinerary
                            </Link>

                            <a
                                href={`https://wa.me/918149783494?text=Namaste!%20I%20have%20questions%20about%20traveling%20to%20${encodeURIComponent(name)}.`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick(`dest_side_${slug}`)}
                                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-center py-2.5 rounded-xl font-semibold text-xs block transition border border-stone-300"
                            >
                                Chat With Local Coordinator
                            </a>

                            <div className="mt-4 pt-4 border-t border-stone-100 text-[11px] text-stone-500 text-center">
                                Direct Helpline: <a href="tel:+918400554029" className="text-amber-700 font-bold font-mono">+91 84005 54029</a>
                            </div>
                        </div>
                    </aside>
                </div>
            </article>
        </>
    );
}

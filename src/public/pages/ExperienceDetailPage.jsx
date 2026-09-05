import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import ExperienceCard from '../components/ExperienceCard';
import { EXPERIENCES } from '../data/experiencesData';
import { trackWhatsAppClick } from '../utils/analytics';

export default function ExperienceDetailPage() {
    const { slug } = useParams();
    const experience = EXPERIENCES.find((e) => e.slug === slug);

    if (!experience) {
        return <Navigate to="/experiences" replace />;
    }

    const {
        title,
        subtitle,
        image,
        duration,
        timings,
        badge,
        shortDesc,
        fullDesc,
        highlights,
        included,
        practicalTips,
        faqs,
        relatedSlugs
    } = experience;

    const relatedExperiences = EXPERIENCES.filter((e) =>
        relatedSlugs && relatedSlugs.includes(e.slug)
    );

    return (
        <>
            <SEO
                title={`${title} | Varanasi Yatra`}
                description={shortDesc}
                pathname={`/experiences/${slug}`}
                image={image}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'TouristAttraction',
                    name: title,
                    description: shortDesc,
                    touristType: ['Spiritual Travelers', 'Heritage Enthusiasts'],
                    url: `https://varanasiyatra.com/experiences/${slug}`
                }}
            />

            {/* Breadcrumb Bar */}
            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Experiences', href: '/experiences' },
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
                            <span>{badge || 'Sacred Experience'}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-stone-900 leading-tight mb-4">
                            {title}
                        </h1>
                        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                            {subtitle}
                        </p>

                        <div className="flex flex-wrap gap-4 py-4 border-y border-stone-200 text-xs text-stone-700 mb-6">
                            {duration && (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-stone-900">Duration:</span>
                                    <span>{duration}</span>
                                </div>
                            )}
                            {timings && (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-stone-900">Recommended Time:</span>
                                    <span>{timings}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900">Guidance:</span>
                                <span className="text-emerald-700 font-medium">Local Coordinator Assigned</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to={`/plan-your-trip?experience=${slug}`}
                                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md transition"
                            >
                                Book / Plan This Experience
                            </Link>
                            <a
                                href={`https://wa.me/918149783494?text=Namaste!%20I%20am%20interested%20in%20the%20${encodeURIComponent(title)}%20experience.`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick(`experience_${slug}`)}
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
                        {/* What You'll Experience */}
                        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-4">
                                What You'll Experience
                            </h2>
                            <div className="prose text-stone-700 text-sm leading-relaxed space-y-4">
                                {Array.isArray(fullDesc) ? (
                                    fullDesc.map((p, idx) => <p key={idx}>{p}</p>)
                                ) : (
                                    <p>{fullDesc || shortDesc}</p>
                                )}
                            </div>
                        </section>

                        {/* Key Highlights */}
                        {highlights && highlights.length > 0 && (
                            <section className="bg-amber-50/50 rounded-3xl p-6 sm:p-8 border border-amber-200/70">
                                <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-950 mb-4">
                                    Experience Highlights
                                </h2>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-800">
                                    {highlights.map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-amber-100">
                                            <span className="text-amber-600 font-bold">✓</span>
                                            <span className="leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Practical Information */}
                        {practicalTips && (
                            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                                <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 mb-4">
                                    Practical Information & Advice
                                </h2>
                                <div className="space-y-3 text-xs text-stone-700">
                                    {practicalTips.map((tip, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <span className="text-amber-600 font-bold">ℹ️</span>
                                            <span className="leading-relaxed">{tip}</span>
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

                    {/* Sidebar: Booking Summary & Direct Assistance */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm sticky top-20">
                            <h3 className="font-serif font-bold text-base text-stone-900 mb-2">
                                Plan This Experience
                            </h3>
                            <p className="text-stone-600 text-xs leading-relaxed mb-4">
                                Customized private arrangement for your family or group. No middlemen, no unexpected tout commissions.
                            </p>

                            {included && (
                                <div className="mb-6 bg-stone-50 rounded-xl p-3.5 border border-stone-200/60">
                                    <span className="font-bold text-stone-800 text-xs block mb-2">What is Included:</span>
                                    <ul className="text-xs text-stone-600 space-y-1.5">
                                        {included.map((item, idx) => (
                                            <li key={idx} className="flex items-center gap-1.5">
                                                <span className="text-emerald-600 font-bold">✓</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Link
                                to={`/plan-your-trip?experience=${slug}`}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-center py-3 rounded-xl font-bold text-xs uppercase tracking-wider block transition shadow-sm mb-3"
                            >
                                Request Itinerary & Quote
                            </Link>

                            <a
                                href={`https://wa.me/918149783494?text=Namaste!%20I%20have%20questions%20about%20${encodeURIComponent(title)}.`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick(`sidebar_${slug}`)}
                                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-center py-2.5 rounded-xl font-semibold text-xs block transition border border-stone-300"
                            >
                                Quick WhatsApp Enquiry
                            </a>

                            <div className="mt-4 pt-4 border-t border-stone-100 text-[11px] text-stone-500 text-center">
                                Direct Phone: <a href="tel:+918400554029" className="text-amber-700 font-bold font-mono">+91-8400554029</a>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Related Experiences */}
                {relatedExperiences.length > 0 && (
                    <section className="mt-16 pt-12 border-t border-stone-200">
                        <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">
                            Combine With Other Experiences
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedExperiences.map((rel) => (
                                <ExperienceCard key={rel.slug} experience={rel} />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
}

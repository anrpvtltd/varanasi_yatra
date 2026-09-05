import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import GuideCard from '../components/GuideCard';
import ExperienceCard from '../components/ExperienceCard';
import { TRAVEL_GUIDES } from '../data/travelGuidesData';
import { EXPERIENCES } from '../data/experiencesData';
import { trackWhatsAppClick } from '../utils/analytics';

export default function TravelGuideDetailPage() {
    const { slug } = useParams();
    const guide = TRAVEL_GUIDES.find((g) => g.slug === slug);

    if (!guide) {
        return <Navigate to="/travel-guide" replace />;
    }

    const {
        title,
        category,
        readTime,
        image,
        excerpt,
        quickAnswer,
        sections,
        practicalTips,
        faqs,
        relatedExperienceSlugs,
        relatedGuideSlugs
    } = guide;

    const relatedExperiences = EXPERIENCES.filter((e) =>
        relatedExperienceSlugs && relatedExperienceSlugs.includes(e.slug)
    );

    const relatedGuides = TRAVEL_GUIDES.filter((g) =>
        relatedGuideSlugs && relatedGuideSlugs.includes(g.slug)
    );

    return (
        <>
            <SEO
                title={`${title} | Varanasi Yatra`}
                description={excerpt}
                pathname={`/travel-guide/${slug}`}
                image={image}
                schema={{
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: title,
                    description: excerpt,
                    image,
                    author: {
                        '@type': 'Organization',
                        name: 'Varanasi Yatra Local Editorial Desk'
                    },
                    publisher: {
                        '@type': 'Organization',
                        name: 'Varanasi Yatra',
                        logo: {
                            '@type': 'ImageObject',
                            url: 'https://varanasiyatra.com/assets/logo.png'
                        }
                    },
                    mainEntityOfPage: `https://varanasiyatra.com/travel-guide/${slug}`
                }}
            />

            {/* Breadcrumb Bar */}
            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Travel Guide', href: '/travel-guide' },
                            { label: title }
                        ]}
                    />
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider mb-3">
                        <span className="text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            {category}
                        </span>
                        <span className="text-stone-500">📖 {readTime}</span>
                        <span className="text-stone-400">•</span>
                        <span className="text-emerald-700 font-medium">Updated 2026</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-stone-900 leading-tight mb-4">
                        {title}
                    </h1>

                    <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                        {excerpt}
                    </p>
                </div>

                {/* Quick Answer / Takeaway Box */}
                {quickAnswer && (
                    <div className="bg-amber-50/70 rounded-2xl p-5 sm:p-6 border border-amber-200/80 mb-8">
                        <div className="flex items-start gap-3">
                            <span className="text-amber-700 text-lg">💡</span>
                            <div>
                                <span className="font-serif font-bold text-sm text-amber-950 block mb-1">
                                    Quick Takeaway / Short Answer:
                                </span>
                                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                                    {quickAnswer}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hero Image */}
                <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-sm aspect-[16/9] mb-10">
                    <ImageWithSkeleton
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover"
                        priority={true}
                    />
                </div>

                {/* Detailed Content Sections */}
                <div className="space-y-8 text-stone-800 text-sm sm:text-base leading-relaxed">
                    {sections && sections.map((sec, idx) => (
                        <section key={idx} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-3">
                                {sec.heading}
                            </h2>
                            <p className="text-stone-700 text-sm leading-relaxed">
                                {sec.content}
                            </p>
                        </section>
                    ))}
                </div>

                {/* Practical Tips */}
                {practicalTips && practicalTips.length > 0 && (
                    <section className="mt-10 bg-amber-50/50 rounded-3xl p-6 sm:p-8 border border-amber-200/70">
                        <h2 className="text-lg sm:text-xl font-serif font-bold text-amber-950 mb-4">
                            Practical Guidelines & Advice
                        </h2>
                        <ul className="space-y-2.5 text-xs sm:text-sm text-stone-800">
                            {practicalTips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                    <span className="text-amber-600 font-bold mt-0.5">ℹ️</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* FAQs */}
                {faqs && faqs.length > 0 && (
                    <section className="mt-10 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
                        <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-3">
                            {faqs.map((faq, idx) => (
                                <details key={idx} className="group bg-stone-50 rounded-xl p-3.5 border border-stone-200/70">
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

                {/* Related Experiences */}
                {relatedExperiences.length > 0 && (
                    <section className="mt-12 pt-8 border-t border-stone-200">
                        <h2 className="text-xl font-serif font-bold text-stone-900 mb-6">
                            Related Varanasi Experiences
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {relatedExperiences.map((rel) => (
                                <ExperienceCard key={rel.slug} experience={rel} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Related Articles */}
                {relatedGuides.length > 0 && (
                    <section className="mt-12 pt-8 border-t border-stone-200">
                        <h2 className="text-xl font-serif font-bold text-stone-900 mb-6">
                            More Travel Guides
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {relatedGuides.map((rel) => (
                                <GuideCard key={rel.slug} guide={rel} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Plan My Trip CTA */}
                <div className="mt-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-8 text-white text-center">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold mb-2">
                        Plan Your Journey With Local Guidance
                    </h2>
                    <p className="text-amber-100 text-xs sm:text-sm max-w-lg mx-auto mb-6">
                        Avoid touts, confusion, and overpriced arrangements. Speak with our local Varanasi coordinators today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/plan-your-trip"
                            className="bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md"
                        >
                            Plan My Trip
                        </Link>
                        <a
                            href="https://wa.me/918149783494?text=Namaste!%20I%20have%20questions%20regarding%20my%20Varanasi%20trip."
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackWhatsAppClick(`guide_${slug}`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                        >
                            <span>WhatsApp Us</span>
                            <span>💬</span>
                        </a>
                    </div>
                </div>
            </article>
        </>
    );
}

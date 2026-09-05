import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import SectionHeading from '../components/SectionHeading';
import QuickTripPlanner from '../components/QuickTripPlanner';
import ExperienceCard from '../components/ExperienceCard';
import TourCard from '../components/TourCard';
import GuideCard from '../components/GuideCard';
import ImageWithSkeleton from '../components/ImageWithSkeleton';
import { EXPERIENCES } from '../data/experiencesData';
import { TOURS } from '../data/toursData';
import { TRAVEL_GUIDES } from '../data/travelGuidesData';
import { FAQS } from '../data/faqsData';
import gangaAartiHero from '../../assets/ExperienceVaranasi/GangaAarti.avif';
import assiMorningImg from '../../assets/ExperienceVaranasi/AssiMorning.avif';
import { trackWhatsAppClick } from '../utils/analytics';

const SERVICE_TAGS = [
    { name: 'Private Boat Rides', icon: '⛵' },
    { name: 'Kashi Vishwanath Darshan', icon: '🕉️' },
    { name: 'Clean AC Cabs & Airport Pickups', icon: '🚗' },
    { name: 'Heritage Ghat Stays & Hotels', icon: '🏨' },
    { name: 'Certified Local Guides', icon: '🧭' },
    { name: 'Vedic Rituals & Pandits', icon: '🪔' },
    { name: 'Authentic Banarasi Silk Walks', icon: '🧵' },
    { name: 'Ayodhya & Bodh Gaya Circuits', icon: '✨' }
];

const TRUST_PILLARS = [
    {
        title: 'Authentic Local Coordinators',
        desc: 'Based directly in Varanasi near the Ghats. No third-party middlemen or distant call centers.',
        icon: '📍'
    },
    {
        title: 'Zero Commission Traps',
        desc: 'No forced stops at overpriced souvenir shops or fraudulent boatmen. Transparent, pre-agreed pricing.',
        icon: '🛡️'
    },
    {
        title: 'Verified Boats & Licensed Guides',
        desc: 'Every boatman has life jackets, every cab has commercial permits, and every temple guide is knowledgeable and respectful.',
        icon: '✓'
    },
    {
        title: '24x7 On-Ground Care',
        desc: 'From airport arrival to late-evening Aarti, our team is a phone call or WhatsApp message away throughout your stay.',
        icon: '📞'
    }
];

const WORKFLOW_STEPS = [
    {
        num: '01',
        title: 'Share Your Travel Window',
        desc: 'Tell us your dates, group size, and what you wish to experience in Varanasi (Aarti, Darshan, Sarnath, or food walks).'
    },
    {
        num: '02',
        title: 'Receive Custom Plan & Price',
        desc: 'Our local coordinator designs a relaxed, unhurried itinerary with clear inclusions and no surprise charges.'
    },
    {
        num: '03',
        title: 'Experience Varanasi With Peace of Mind',
        desc: 'Arrive in Kashi. Your private driver, boatman, and darshan coordinator are synced and ready for you.'
    }
];

export default function HomePage() {
    return (
        <>
            <SEO
                title="Varanasi Yatra | Authentic Spiritual Pilgrimages & Custom Tours"
                description="Experience Varanasi with trusted local travel planners. Private boat rides, Kashi Vishwanath darshan assistance, Sarnath excursions, and transparent custom itineraries."
                pathname="/"
            />

            {/* 1. HERO SECTION (Compact on mobile, elegant on desktop) */}
            <section className="relative bg-stone-950 text-white overflow-hidden">
                {/* Background image overlay */}
                <div className="absolute inset-0 z-0 opacity-25 mix-blend-luminosity">
                    <ImageWithSkeleton
                        src={gangaAartiHero}
                        alt="Evening Ganga Aarti at Dashashwamedh Ghat"
                        className="w-full h-full object-cover"
                        priority={true}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/90 to-[#faf8f5] z-0" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-20 pb-10 sm:pb-24">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-stone-900/90 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-3 sm:mb-6 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Varanasi Travel Operator</span>
                        </div>

                        {/* Exact single H1 for page */}
                        <h1 className="text-2xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-white leading-tight mb-3 sm:mb-5">
                            Experience Varanasi <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                                Your Way
                            </span>
                        </h1>

                        <p className="text-stone-300 text-xs sm:text-base lg:text-lg leading-relaxed mb-5 sm:mb-8 max-w-2xl mx-auto font-normal">
                            Personalized spiritual pilgrimages, verified morning boat rides, hassle-free temple darshan, and private transport planned with authentic local expertise.
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 mb-6 sm:mb-10">
                            <a
                                href="#trip-planner"
                                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs sm:text-sm px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-95 text-center"
                            >
                                Plan My Trip
                            </a>
                            <a
                                href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20would%20like%20to%20plan%20my%20trip."
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => trackWhatsAppClick('hero_cta')}
                                className="w-full sm:w-auto bg-stone-900/90 hover:bg-stone-850 text-stone-200 hover:text-white border border-stone-700 font-bold text-xs sm:text-sm px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                            >
                                <span className="text-emerald-400">💬</span>
                                <span>Chat on WhatsApp</span>
                            </a>
                        </div>

                        {/* Supporting Service Tags */}
                        <div className="pt-4 sm:pt-6 border-t border-stone-800/80">
                            <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2.5 sm:mb-3">
                                Complete On-Ground Travel Assistance In Kashi
                            </span>
                            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                {SERVICE_TAGS.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-[11px] sm:text-xs bg-stone-900/80 border border-stone-800 text-stone-300 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5"
                                    >
                                        <span aria-hidden="true">{tag.icon}</span>
                                        <span>{tag.name}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. QUICK TRIP PLANNER (Directly follows Hero on mobile & desktop) */}
            <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-12 mb-16">
                <QuickTripPlanner
                    title="Quick Trip Planner"
                    subtitle="Custom dates, handpicked ghat activities, and transparent local rates."
                />
            </div>

            {/* 3. POPULAR EXPERIENCES */}
            <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <SectionHeading
                        eyebrow="Curated Varanasi Moments"
                        title="Popular Experiences"
                        description="From magical sunrise oars on the holy Ganga to grand evening aarti, discover the soul of the city."
                    />
                    <Link
                        to="/experiences"
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition-colors self-start md:self-end bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-amber-200"
                    >
                        <span>View All Experiences</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {EXPERIENCES.slice(0, 3).map((exp) => (
                        <ExperienceCard key={exp.slug} experience={exp} />
                    ))}
                </div>
            </section>

            {/* 4. POPULAR / FEATURED ITINERARIES */}
            <section className="py-12 sm:py-16 bg-stone-100/70 border-y border-stone-200/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <SectionHeading
                            eyebrow="Crafted With Local Care"
                            title="Featured Tour Itineraries"
                            description="Thoughtfully paced schedules designed to give you spiritual immersion without temple rush or fatigue."
                        />
                        <Link
                            to="/tours"
                            className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition-colors self-start md:self-end bg-white hover:bg-stone-50 px-4 py-2 rounded-xl border border-stone-300"
                        >
                            <span>Browse All Tours</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TOURS.slice(0, 3).map((tour) => (
                            <TourCard key={tour.slug} tour={tour} />
                        ))}
                    </div>

                    <div className="mt-10 bg-white rounded-2xl p-6 border border-stone-200 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <h3 className="font-serif font-bold text-base text-stone-900">
                                Need a completely customized itinerary?
                            </h3>
                            <p className="text-xs text-stone-600 mt-0.5">
                                Arriving with elderly parents, children, or special ritual requirements? We tailor the pace to you.
                            </p>
                        </div>
                        <Link
                            to="/plan-your-trip"
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm flex-shrink-0"
                        >
                            Customize Itinerary
                        </Link>
                    </div>
                </div>
            </section>

            {/* 5. WHY TRAVELERS CHOOSE VARANASI YATRA (Merged Services + Values + Trust) */}
            <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <SectionHeading
                        align="center"
                        eyebrow="Transparent Local Stewardship"
                        title="Why Travelers Choose Varanasi Yatra"
                        description="Varanasi can be overwhelming for first-time visitors. Our purpose is to make your pilgrimage peaceful, dignified, and scam-free."
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {TRUST_PILLARS.map((pillar, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col"
                        >
                            <span className="text-2xl mb-3" aria-hidden="true">{pillar.icon}</span>
                            <h3 className="font-serif font-bold text-base text-stone-900 mb-2">
                                {pillar.title}
                            </h3>
                            <p className="text-xs text-stone-600 leading-relaxed">
                                {pillar.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. HOW IT WORKS (3 Simple Steps) */}
            <section className="py-14 sm:py-20 bg-stone-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="text-[11px] uppercase tracking-widest font-bold text-amber-400 block mb-2">
                            Simple & Hassle-Free
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">
                            How It Works
                        </h2>
                        <p className="text-stone-300 text-xs sm:text-sm mt-2">
                            From your initial enquiry to your final departure, you have a dedicated local travel point of contact.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {WORKFLOW_STEPS.map((step, idx) => (
                            <div key={idx} className="relative bg-stone-850/80 rounded-2xl p-6 border border-stone-800">
                                <span className="text-amber-500 font-mono font-black text-2xl sm:text-3xl block mb-2 opacity-80">
                                    {step.num}
                                </span>
                                <h3 className="font-serif font-bold text-lg text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-stone-400 text-xs leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. AUTHENTIC TRUST & GUEST REASSURANCE (Honest trust, no fake reviews) */}
            <section className="py-14 sm:py-18 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="bg-gradient-to-br from-amber-50/70 via-stone-50 to-white rounded-3xl p-8 sm:p-12 border border-amber-200/60 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div>
                            <span className="text-[11px] uppercase tracking-widest font-bold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300/40 inline-block mb-3">
                                Honest Travel Standards
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 leading-tight">
                                Our Promise to Every Pilgrim and Traveler
                            </h2>
                            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed mt-4">
                                We believe in unvarnished honesty. We do not publish fabricated 5-star ratings or exaggerated traveler statistics. Instead, we measure success by the peace of mind our guests experience when navigating the holy city.
                            </p>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-base mt-0.5">✓</span>
                                    <p className="text-xs text-stone-700">
                                        <strong className="text-stone-900">Elderly & Child-Friendly Routes:</strong> We plan ghat access with minimal walking steps and coordinate wheelchairs or e-rickshaws when required.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-base mt-0.5">✓</span>
                                    <p className="text-xs text-stone-700">
                                        <strong className="text-stone-900">Verified Purohits & Ritual Support:</strong> Authentic Sankalp, Rudrabhishek, or Pind Daan rituals conducted with respectful Vedic protocols.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-emerald-600 font-bold text-base mt-0.5">✓</span>
                                    <p className="text-xs text-stone-700">
                                        <strong className="text-stone-900">Direct Local Coordinator:</strong> You have an assigned local manager who verifies your pickup, cab, and boat schedules ahead of time.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-md aspect-[4/3]">
                            <ImageWithSkeleton
                                src={assiMorningImg}
                                alt="Morning Ghats in Varanasi"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex items-end p-6">
                                <div className="text-white">
                                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block">Local Stewardship</span>
                                    <p className="text-sm font-serif font-bold mt-1">
                                        "Kashi is not just a destination; it is an awakening. We treat every traveler as a sacred guest."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. TRAVEL GUIDES & LOCAL INSIGHTS */}
            <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <SectionHeading
                        eyebrow="Practical Insights"
                        title="Travel Guide & Tips"
                        description="Essential timings, seasonal weather tips, and ghat navigation advice written by people who live here."
                    />
                    <Link
                        to="/travel-guide"
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition-colors self-start md:self-end bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl border border-amber-200"
                    >
                        <span>All Travel Guides</span>
                        <span aria-hidden="true">→</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TRAVEL_GUIDES.map((guide) => (
                        <GuideCard key={guide.slug} guide={guide} />
                    ))}
                </div>
            </section>

            {/* 9. AUTHENTIC FAQS */}
            <section className="py-12 sm:py-16 bg-stone-50 border-t border-stone-200/80">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <SectionHeading
                        align="center"
                        eyebrow="Helpful Information"
                        title="Frequently Asked Questions"
                        description="Common queries from travelers visiting Varanasi."
                    />

                    <div className="mt-8 space-y-3">
                        {FAQS.slice(0, 5).map((faq, idx) => (
                            <details
                                key={idx}
                                className="group bg-white rounded-xl border border-stone-200 p-4 transition-all open:ring-1 open:ring-amber-500/30"
                            >
                                <summary className="font-serif font-bold text-sm text-stone-900 cursor-pointer flex items-center justify-between list-none">
                                    <span>{faq.q}</span>
                                    <span className="text-amber-600 group-open:rotate-180 transition-transform text-xs font-mono ml-3 flex-shrink-0">
                                        ▼
                                    </span>
                                </summary>
                                <p className="text-xs text-stone-600 leading-relaxed mt-3 pt-3 border-t border-stone-100">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* 10. FINAL CALL TO ACTION */}
            <section className="py-16 sm:py-20 bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-4xl font-serif font-black mb-4">
                        Ready to Experience the Spiritual Capital of India?
                    </h2>
                    <p className="text-amber-100 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
                        Let us coordinate your boat rides, temple darshan, and private transport so you can immerse yourself in the divinity of Kashi without stress.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/plan-your-trip"
                            className="w-full sm:w-auto bg-stone-950 hover:bg-stone-900 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-95 text-center"
                        >
                            Get Custom Trip Plan
                        </Link>
                        <a
                            href="https://wa.me/918149783494?text=Namaste%20Varanasi%20Yatra!%20I%20would%20like%20to%20plan%20my%20trip."
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackWhatsAppClick('final_cta')}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                            <span>Chat on WhatsApp</span>
                            <span>💬</span>
                        </a>
                    </div>
                </div>
            </section>
        </>
    );
}

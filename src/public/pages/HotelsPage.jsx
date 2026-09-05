import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../seo/SEO';
import Breadcrumb from '../components/Breadcrumb';
import SectionHeading from '../components/SectionHeading';
import { trackWhatsAppClick } from '../utils/analytics';

const AREA_GUIDES = [
    {
        area: 'Near the Ghats (Assi / Dashashwamedh)',
        badge: 'Spiritual Immersion',
        pros: 'Wake up to temple bells, step directly onto the ghats for sunrise boat rides, walking distance to Ganga Aarti.',
        cons: 'Cabs and autos cannot enter narrow alleyways. Requires 3–10 minutes of walking with luggage. Older heritage properties often lack elevators.',
        recommendedFor: 'Pilgrims, photographers, solo travelers, and couples who prioritize being on the riverfront.'
    },
    {
        area: 'Cantonment (Varanasi Cantt / Nadesar)',
        badge: 'Modern Comfort & Accessibility',
        pros: 'Direct vehicle drop-off at hotel portico, spacious rooms, elevators, secure car parking, quieter surroundings, international dining.',
        cons: 'Located 4.5–6 km away from the riverfront ghats. Requires 20–30 minutes cab or auto ride to reach Dashashwamedh or Kashi Vishwanath corridor.',
        recommendedFor: 'Elderly travelers, families with young children, corporate groups, and those wanting star-category modern luxury.'
    },
    {
        area: 'Godowlia & Chowk (Corridor Vicinity)',
        badge: 'Closest to Temple',
        pros: 'Immediate walking access to Sri Kashi Vishwanath corridor (Gate 4 / Gyanvapi) and historic Annapurna & Vishalakshi temples.',
        cons: 'Extremely busy commercial area, strict vehicle movement restrictions during daytime, persistent pedestrian foot traffic.',
        recommendedFor: 'Pilgrims whose primary focus is early morning Mangala Aarti or multiple temple visits.'
    },
    {
        area: 'Sarnath & Ring Road Outer Belt',
        badge: 'Peaceful & Green',
        pros: 'Lush Buddhist monastic surroundings, calm atmosphere, easy road connectivity to Varanasi Airport without city congestion.',
        cons: 'Located ~11 km north of main Varanasi ghats. Requires dedicated taxi transport for temple darshan and evening aarti.',
        recommendedFor: 'Meditation seekers, Buddhist circuit travelers, and travelers transiting with vehicles.'
    }
];

const PRACTICAL_STAY_TIPS = [
    {
        title: 'Vehicle Access Restrictions',
        desc: 'Vehicle traffic is prohibited or heavily restricted around Godowlia, Dashashwamedh, and Maidagin from early morning till late night. If your hotel is in an alley, arrange for our coordinator or hotel porter to assist with luggage.'
    },
    {
        title: 'Elevator & Staircase Verification',
        desc: 'Many atmospheric heritage havelis along the ghats are centuries old and have steep stone staircases with no lift. If traveling with senior citizens, verify ground floor availability or opt for Cantonment hotels.'
    },
    {
        title: 'Pure Vegetarian Dining',
        desc: 'The old city area around Kashi Vishwanath corridor is predominantly pure vegetarian and sattvic. High-quality traditional bhojanalayas serve fresh thalis without onion and garlic if requested.'
    },
    {
        title: 'Advance Booking During Auspicious Dates',
        desc: 'Peak festival periods such as Dev Deepawali, Maha Shivratri, Shravan Maas, and the winter months (November to February) experience 100% occupancy across Kashi. Always finalize your accommodation well ahead.'
    }
];

export default function HotelsPage() {
    return (
        <>
            <SEO
                title="Where to Stay in Varanasi | Ghats vs Cantt Hotels Guidance | Varanasi Yatra"
                description="Practical guidance on choosing accommodation in Varanasi. Honest pros & cons of staying near the Ghats vs Cantonment luxury hotels for families and pilgrims."
                pathname="/hotels"
            />

            <div className="bg-stone-100/60 border-b border-stone-200/80 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <Breadcrumb
                        crumbs={[
                            { label: 'Hotels & Stay Guidance' }
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="max-w-3xl mb-12">
                    <SectionHeading
                        as="h1"
                        eyebrow="Practical Stay Guidance"
                        title="Choosing Where to Stay in Varanasi"
                        description="Varanasi does not follow a conventional hotel map. Choosing the right neighborhood depends entirely on your mobility, luggage, and whether you prefer riverfront spiritual immersion or modern hotel comforts."
                    />
                </div>

                {/* Area Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {AREA_GUIDES.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                        {item.badge}
                                    </span>
                                </div>
                                <h3 className="text-xl font-serif font-bold text-stone-900 mb-3">
                                    {item.area}
                                </h3>

                                <div className="space-y-3 text-xs text-stone-700 mb-6">
                                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                                        <strong className="text-emerald-950 block mb-1">✓ The Advantages:</strong>
                                        <p className="text-stone-700">{item.pros}</p>
                                    </div>
                                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                                        <strong className="text-stone-900 block mb-1">⚠️ Practical Realities:</strong>
                                        <p className="text-stone-600">{item.cons}</p>
                                    </div>
                                    <div className="pt-2">
                                        <strong className="text-stone-800">Best For: </strong>
                                        <span className="text-stone-600">{item.recommendedFor}</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to={`/plan-your-trip?stayArea=${encodeURIComponent(item.area)}`}
                                className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1.5 transition-colors pt-3 border-t border-stone-100"
                            >
                                <span>Get Stay Recommendations for this Area</span>
                                <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Practical Advice Section */}
                <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 mb-16">
                    <div className="max-w-3xl mb-8">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block mb-2">
                            Local Insider Advice
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-black text-white">
                            Important Realities Before You Book Any Hotel in Kashi
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {PRACTICAL_STAY_TIPS.map((tip, idx) => (
                            <div key={idx} className="bg-stone-850/80 p-5 rounded-2xl border border-stone-800">
                                <h3 className="text-sm font-serif font-bold text-amber-400 mb-1.5">
                                    {tip.title}
                                </h3>
                                <p className="text-xs text-stone-300 leading-relaxed">
                                    {tip.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Need Help Choosing a Stay CTA */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-8 sm:p-12 border border-amber-200 text-center max-w-3xl mx-auto">
                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
                        Need Help Choosing the Right Stay?
                    </h2>
                    <p className="text-stone-600 text-xs sm:text-sm mb-6 max-w-xl mx-auto">
                        Tell us who is traveling with you. We will recommend hotels with confirmed elevator access, verified hygiene standards, and reliable vehicle drop-off points.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/plan-your-trip"
                            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md"
                        >
                            Plan My Trip
                        </Link>
                        <a
                            href="https://wa.me/918149783494?text=Namaste!%20I%20need%20advice%20on%20choosing%20a%20hotel%20in%20Varanasi."
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackWhatsAppClick('hotels_page_cta')}
                            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition inline-flex items-center justify-center gap-2"
                        >
                            <span>Chat on WhatsApp</span>
                            <span>💬</span>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from './SEO';
import ImageWithSkeleton from './ImageWithSkeleton';
import VaranasiDestination from './VaranasiDestination';

// Local images connection (reusing existing assets)
import ayodhyaImg from '../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaImg from '../assets/tour packege photo/BiharBuddha.png';
import nepalImg from '../assets/tour packege photo/NepalTour.png';

const destinationsData = {
    ayodhya: {
        name: "Ayodhya",
        title: "Ayodhya Tour Packages - Ram Mandir Darshan Itinerary",
        metaDesc: "Book custom travel packages to Ayodhya. Experience VIP Ram Mandir Darshan, Sarayu River Aarti, and local temple sightseeing with certified private drivers.",
        image: ayodhyaImg,
        overview: "Ayodhya is the sacred birthplace of Lord Rama, nestled along the banks of the holy Sarayu River in Uttar Pradesh. Steeped in mythological legacy, it represents devotion, culture, and ancient royal history.",
        highlights: [
            "Offer prayers at the newly constructed Shri Ram Janmabhoomi Temple.",
            "Climb the steps to the ancient fort temple of Hanuman Garhi.",
            "Participate in the beautiful evening Sarayu River sandhya aarti."
        ],
        placesCovered: [
            "Shri Ram Janmabhoomi Temple",
            "Hanuman Garhi Fort",
            "Kanak Bhawan Palace",
            "Sarayu River Ghats"
        ],
        faq: [
            { q: "How far is Ayodhya from Varanasi?", a: "Ayodhya is approximately 200 km from Varanasi, taking about 4 hours by private cab." }
        ],
        packages: [
            { name: "Ayodhya Darshan Tour", slug: "ayodhya-tour" }
        ]
    },
    "bodh-gaya": {
        name: "Bodh Gaya",
        title: "Bodh Gaya Tour Operator - Mahabodhi Temple Heritage Circuit",
        metaDesc: "Explore Bodh Gaya Buddhist heritage circuit. Secure reliable transport from Varanasi, certified local guides, and clean 3-star family hotel accommodations.",
        image: bodhgayaImg,
        overview: "Bodh Gaya is the holiest Buddhist pilgrimage site in the world. It is here, under the sacred Bodhi Tree, that Prince Siddhartha Gautama attained supreme enlightenment to become Lord Buddha.",
        highlights: [
            "Meditate under the sacred Bodhi Tree inside the Mahabodhi Temple complex.",
            "Explore diverse international monasteries built by Japan, Thailand, and Tibet.",
            "Witness the majestic 80-foot stone statue of Great Buddha."
        ],
        placesCovered: [
            "Mahabodhi Temple (UNESCO Site)",
            "The Sacred Bodhi Tree",
            "Great Buddha Statue",
            "Royal Thai and Japanese Monasteries"
        ],
        faq: [
            { q: "Do we need entry tickets for the Mahabodhi Temple?", a: "Entry is free, but cameras require a small permit fee at the counter." }
        ],
        packages: [
            { name: "Bodh Gaya Tour Package", slug: "bodh-gaya-tour" }
        ]
    },
    nepal: {
        name: "Nepal (Cross-Border)",
        title: "Varanasi to Nepal Tour Packages - Lumbini & Kathmandu Guide",
        metaDesc: "Plan cross-border spiritual tours from Varanasi to Nepal. Covers Lumbini, Pokhara, and Kathmandu with customized permits and sanitized private vehicles.",
        image: nepalImg,
        overview: "Embark on an incredible cross-border spiritual journey from the ghats of Varanasi into the majestic Himalayan foothills of Nepal, connecting Lord Shiva's holy abode with Lord Buddha's sacred birthplace.",
        highlights: [
            "Visit Maya Devi Temple in Lumbini, the birthplace of Lord Buddha.",
            "Enjoy boat rides and scenic lakeside views in Pokhara.",
            "Explore ancient heritage temples in Kathmandu Valley."
        ],
        placesCovered: [
            "Lumbini Heritage Garden",
            "Pashupatinath Temple (Kathmandu)",
            "Swayambhunath Stupa",
            "Phewa Lake (Pokhara)"
        ],
        faq: [
            { q: "Do Indian citizens need a visa for Nepal?", a: "No, Indian citizens do not need a visa, but they must carry a valid Passport or Voter ID card." }
        ],
        packages: [
            { name: "Varanasi to Nepal Tour", slug: "nepal-tour" }
        ]
    }
};

export default function DestinationTemplate() {
    const { id } = useParams();

    // 🌟 If client is accessing Kashi Varanasi, return the dedicated world-class Varanasi Destination component
    if (id === 'varanasi') {
        return <VaranasiDestination />;
    }

    const dest = destinationsData[id];

    // If destination ID is not in our detailed registry, display coming soon layout safely for SEO
    if (!dest) {
        const fallbackName = id ? id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ') : 'Destination';
        
        const fallbackSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://banarasyatra.com/" },
                { "@type": "ListItem", "position": 2, "name": "Destinations", "item": "https://banarasyatra.com/#destinations" },
                { "@type": "ListItem", "position": 3, "name": fallbackName, "item": `https://banarasyatra.com/destinations/${id}` }
            ]
        };

        return (
            <div className="bg-stone-50 min-h-screen text-stone-800">
                <SEO 
                    title={`${fallbackName} Travel Guide - Banaras Yatra`}
                    description={`Detailed local travel guide for ${fallbackName}. Custom itineraries, car rentals, and hotel coordinates coming soon.`}
                    canonicalUrl={`https://banarasyatra.com/destinations/${id}`}
                    schema={fallbackSchema}
                />
                
                {/* Breadcrumbs */}
                <div className="bg-white border-b border-stone-200 py-3.5 select-none">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-stone-500 font-medium flex items-center space-x-2">
                        <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                        <span>/</span>
                        <a href="/#destinations" className="hover:text-orange-600 transition-colors">Destinations</a>
                        <span>/</span>
                        <span className="text-stone-900 font-bold">{fallbackName}</span>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto py-24 px-4 sm:px-6 text-center space-y-6">
                    <span className="text-4xl block">🗺️</span>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">{fallbackName} Travel Guide</h1>
                    <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    <p className="text-sm text-stone-500 leading-relaxed font-medium max-w-md mx-auto">
                        Detailed guide, local places covered, hotels, and custom travel itineraries for **{fallbackName}** are coming soon.
                    </p>
                    <div className="pt-6">
                        <Link to="/" className="inline-block bg-stone-900 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md">
                            Back To Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic Schema Markup
    const schemaOrg = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://banarasyatra.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Destinations", "item": "https://banarasyatra.com/#destinations" },
                    { "@type": "ListItem", "position": 3, "name": dest.name, "item": `https://banarasyatra.com/destinations/${id}` }
                ]
            },
            {
                "@type": "TouristAttraction",
                "name": dest.name,
                "description": dest.overview,
                "image": `https://banarasyatra.com/assets/${id}.png`
            }
        ]
    };

    return (
        <div className="bg-stone-50 min-h-screen text-stone-800 text-left">
            <SEO 
                title={dest.title}
                description={dest.metaDesc}
                canonicalUrl={`https://banarasyatra.com/destinations/${id}`}
                ogImage={dest.image}
                schema={schemaOrg}
            />

            {/* Breadcrumbs */}
            <div className="bg-white border-b border-stone-200 py-3.5 select-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-stone-500 font-medium flex items-center space-x-2">
                    <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                    <span>/</span>
                    <a href="/#destinations" className="hover:text-orange-600 transition-colors">Destinations</a>
                    <span>/</span>
                    <span className="text-stone-900 font-bold">{dest.name}</span>
                </div>
            </div>

            {/* Hero Header */}
            <section className="relative bg-stone-950 text-white py-16 sm:py-24 overflow-hidden select-none">
                <div className="absolute inset-0 opacity-40">
                    <ImageWithSkeleton src={dest.image} alt={dest.name} containerClassName="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-transparent"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-wide">{dest.name} Travel Guide</h1>
                    <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    <p className="text-xs sm:text-sm text-stone-300 uppercase tracking-widest font-semibold">Explore local sights with trusted guidance</p>
                </div>
            </section>

            {/* Content Body */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Main Details Left Column */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* Overview */}
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                Destination Overview
                            </h2>
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                                {dest.overview}
                            </p>
                        </div>

                        {/* Highlights */}
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                Sightseeing Highlights
                            </h2>
                            <ul className="space-y-3 text-xs sm:text-sm text-stone-600 font-medium">
                                {dest.highlights.map((h, i) => (
                                    <li key={i} className="flex items-start space-x-2.5">
                                        <span className="text-orange-500 mt-0.5 font-bold">✓</span>
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Places Covered */}
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                Key Attractions Covered
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {dest.placesCovered.map((place, i) => (
                                    <div key={i} className="p-3.5 bg-white border border-stone-200 rounded-xl shadow-xs text-xs sm:text-sm text-stone-800 font-bold">
                                        📍 {place}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Itinerary placeholder */}
                        <div className="space-y-4 pt-4 border-t border-stone-200">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                Recommended Itinerary
                            </h2>
                            <p className="text-xs sm:text-sm text-stone-500 italic font-medium">
                                Detailed day-by-day itinerary roadmap for {dest.name} is coming soon.
                            </p>
                        </div>

                        {/* FAQs */}
                        {dest.faq && dest.faq.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-stone-200">
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                    Frequently Asked Queries
                                </h2>
                                <div className="space-y-3">
                                    {dest.faq.map((qna, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl border border-stone-200/80">
                                            <h4 className="text-xs sm:text-sm font-bold text-stone-900">{qna.q}</h4>
                                            <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium leading-relaxed">{qna.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Booking / Call To Action Right Column */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Custom CTA Box */}
                        <div className="bg-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 rounded-full blur-xl pointer-events-none"></div>
                            <div>
                                <span className="text-[9px] uppercase tracking-widest text-orange-400 font-bold block mb-1">Custom Planning</span>
                                <h3 className="text-xl font-serif font-bold text-white leading-tight">Plan a Customized Trip to {dest.name}</h3>
                                <p className="text-[11px] text-stone-400 leading-relaxed mt-2 font-medium">
                                    Want to adjust hotels, days, or add nearby sightseeing? Share details and get quotes within 15 minutes.
                                </p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <a 
                                    href="/#booking-form"
                                    className="block text-center text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl transition duration-200"
                                >
                                    Customize Itinerary ➔
                                </a>
                                <a 
                                    href="https://wa.me/918149783494"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-center text-xs font-bold uppercase tracking-wider bg-stone-900 border border-stone-800 text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 py-3.5 rounded-xl transition duration-200"
                                >
                                    💬 Chat on WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* Related Packages Link List */}
                        {dest.packages && dest.packages.length > 0 && (
                            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Related Tour Packages</h4>
                                <div className="space-y-2.5">
                                    {dest.packages.map((pkg, i) => (
                                        <Link 
                                            key={i} 
                                            to={`/packages/${pkg.slug}`}
                                            className="flex items-center justify-between p-3 bg-stone-50 hover:bg-orange-50/50 rounded-xl border border-stone-100 hover:border-orange-200 transition text-xs font-bold text-stone-900"
                                        >
                                            <span>🧳 {pkg.name}</span>
                                            <span className="text-orange-500">➔</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </section>
        </div>
    );
}

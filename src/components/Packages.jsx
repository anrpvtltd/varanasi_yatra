import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

// Local images connection
import varanasiPkg from '../assets/ExperienceVaranasi/KashiVT.png';
import ayodhyaPkg from '../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaPkg from '../assets/tour packege photo/BiharBuddha.png';
import chunarPkg from '../assets/tour packege photo/ChunarFort.png';
import nepalPkg from '../assets/tour packege photo/NepalTour.png';

export default function Packages() {
    const [activeInclusions, setActiveInclusions] = useState(null);

    const packagesList = [
        {
            title: "Varanasi Spiritual Tour",
            slug: "varanasi-tour",
            duration: "2 Nights / 3 Days",
            price: "8,999",
            details: "Comprehensive divine exploration covering Subah-e-Banaras, world-famous Ganga Aarti, Kashi Vishwanath corridor, and Sarnath Buddhist heritage site.",
            image: varanasiPkg,
            alt: "Varanasi spiritual tour kashi vishwanath darshan banaras yatra",
            isBestSeller: true,
            inclusions: [
                "🚗 Private Sanitized AC Sedan / SUV",
                "🏨 3-Star Family-Friendly Hotel Stay near Ghats",
                "🍳 Complimentary Breakfast",
                "⛵ Private Boat Ride (Sunrise & Sunset Ganga Aarti)",
                "🗺️ Certified Local Tour Guide (English/Hindi speaking)",
                "✈️ Airport / Railway Station Pickup & Drop-off",
                "🙏 VIP Darshan Facilitation assistance"
            ]
        },
        {
            title: "Ayodhya Darshan Tour",
            slug: "ayodhya-tour",
            duration: "1 Night / 2 Days",
            price: "6,999",
            details: "Immerse in devotion at Shri Ram Janmabhoomi temple, Hanuman Garhi, Kanak Bhawan palace, and participate in the evening Sarayu River beautiful sandhya aarti.",
            image: ayodhyaPkg,
            alt: "Ayodhya ram mandir package tour booking",
            isBestSeller: true,
            inclusions: [
                "🚗 Private AC Sedan / SUV for round trip",
                "🏨 Clean 3-Star Hotel Stay close to temple",
                "🍳 Complimentary Breakfast",
                "⛵ Evening Sarayu River Aarti coordination",
                "🗺️ Knowledgeable Local Guide assistance",
                "🚘 Sightseeing at Hanuman Garhi & Kanak Bhawan"
            ]
        },
        {
            title: "Bodh Gaya Tour",
            slug: "bodh-gaya-tour",
            duration: "1 Night / 2 Days",
            price: "7,999",
            details: "A peaceful journey tracing the footsteps of Lord Buddha at Mahabodhi Temple, the sacred Bodhi Tree, and spectacular multi-national monasteries.",
            image: bodhgayaPkg,
            alt: "Bodh gaya mahabodhi temple tour operator",
            isBestSeller: false,
            inclusions: [
                "🚗 Private AC Transport from Varanasi and back",
                "🏨 Clean 3-Star Hotel Accommodation in Bodh Gaya",
                "🍳 Breakfast included",
                "🗺️ Guided tour of Mahabodhi Temple & Monasteries",
                "🏯 Visit to giant Great Buddha Statue",
                "🎟️ Entrance fees assistance"
            ]
        },
        {
            title: "Mirzapur - Chunar Tour",
            slug: "mirzapur-chunar-tour",
            duration: "1 Night / 2 Days",
            price: "6,499",
            details: "Perfect historic escape showcasing the mighty stone walls of Chunar Fort on the Ganges, holy Vindhyachal Devi temple, and majestic natural waterfalls.",
            image: chunarPkg,
            alt: "Chunar fort vindhyachal temple sightseeing taxi",
            isBestSeller: false,
            inclusions: [
                "🚗 Private AC Sedan/SUV for Vindhyachal-Chunar circuit",
                "🏨 Day Hotel room coordination for families",
                "🍳 Meals / Breakfast included",
                "🗺️ Guided tour of Chunar Fort & Ganges view spots",
                "🙏 VIP Darshan entry coordination at Vindhyachal Devi",
                "⛲ Visit to local scenic waterfalls"
            ]
        },
        {
            title: "Varanasi to Nepal Tour",
            slug: "nepal-tour",
            duration: "2 Nights / 3 Days",
            price: "10,999",
            details: "An extensive cross-border premium spiritual circuit exploring Lord Buddha's birthplace in Lumbini, scenic Pokhara lakes, and Kathmandu temples.",
            image: nepalPkg,
            alt: "Varanasi to nepal lumbini kathmandu travel package",
            isBestSeller: true,
            inclusions: [
                "🚗 Private Cross-Border Permit AC Transport",
                "🏨 Premium Hotel Stays in Kathmandu & Pokhara",
                "🍳 Daily Breakfast",
                "🗺️ Guided sightseeing in Lumbini, Pokhara & Kathmandu",
                "🎟️ Cross-border customs & permit clearance assistance",
                "✈️ Hotel pickup and drop-off"
            ]
        }
    ];

    return (
        <section id="packages" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 text-center select-none">
            <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">Our Popular Tour Packages</h2>
                <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-stone-500 text-sm max-w-xl mx-auto mb-12">Select from our perfectly aligned, time-optimized spiritual itineraries curated thoughtfully for individuals, extended families, and senior citizens.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {packagesList.map((pkg, i) => (
                        <article key={i} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between text-left transform hover:scale-[1.01]">
                            <div className="h-44 bg-stone-900 overflow-hidden relative group">
                                <Link to={`/packages/${pkg.slug}`}>
                                    <ImageWithSkeleton 
                                        src={pkg.image} 
                                        alt={pkg.alt} 
                                        className="transform group-hover:scale-105 transition-transform duration-500"
                                    />
                                </Link>
                                {pkg.isBestSeller && (
                                    <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md border border-stone-800 z-10">⭐ Best Seller</div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">{pkg.duration}</span>
                                    </div>
                                    <h3 className="font-serif font-bold text-base text-stone-900 mt-3 mb-2 leading-tight min-h-[44px]">
                                        <Link to={`/packages/${pkg.slug}`} className="hover:text-orange-600 transition-colors">{pkg.title}</Link>
                                    </h3>
                                    <p className="text-xs text-stone-500 line-clamp-4 leading-relaxed mb-4">{pkg.details}</p>
                                    
                                    <button 
                                        onClick={() => setActiveInclusions(pkg)}
                                        className="text-stone-500 hover:text-orange-600 text-xs font-bold underline transition-colors cursor-pointer"
                                        aria-label={`View inclusions for ${pkg.title}`}
                                    >
                                        📋 View Inclusions
                                    </button>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col space-y-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[11px] font-medium text-stone-400">Starting at</span>
                                        <span className="text-lg font-black text-stone-900">₹{pkg.price} <span className="text-[10px] font-normal text-stone-400">/ Person</span></span>
                                    </div>
                                    <Link 
                                        to={`/packages/${pkg.slug}`} 
                                        className="block text-center text-xs font-bold bg-stone-900 hover:bg-orange-600 text-white py-3 rounded-xl transition-colors duration-200 shadow-xs hover:shadow-md uppercase tracking-wider"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {/* Inclusions Modal Overlay */}
            {activeInclusions && (
                <div 
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity duration-300"
                    onClick={() => setActiveInclusions(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div 
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 transform transition-transform duration-300 relative text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5 mb-5">
                            <h3 id="modal-title" className="font-serif font-bold text-lg text-stone-900">
                                {activeInclusions.title} Inclusions
                            </h3>
                            <button 
                                onClick={() => setActiveInclusions(null)}
                                className="text-stone-400 hover:text-stone-600 focus:outline-none"
                                aria-label="Close modal"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <ul className="space-y-3.5 text-xs sm:text-sm font-medium text-stone-600">
                            {activeInclusions.inclusions.map((item, idx) => (
                                <li key={idx} className="flex items-start space-x-2.5">
                                    <span className="mt-0.5">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-7 pt-4 border-t border-stone-100 flex flex-col space-y-2">
                            <Link
                                to={`/packages/${activeInclusions.slug}`}
                                onClick={() => setActiveInclusions(null)}
                                className="block text-center text-xs font-bold uppercase tracking-wider bg-stone-900 hover:bg-stone-850 text-white py-3 rounded-xl transition duration-200 shadow-sm"
                            >
                                Detailed Package Info ➔
                            </Link>
                            <a 
                                href="/#booking-form"
                                onClick={() => setActiveInclusions(null)}
                                className="block text-center text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl transition duration-200 shadow-sm"
                            >
                                Request Custom Quote ➔
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
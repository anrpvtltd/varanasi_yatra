import React from 'react';

// Local images connection (Spelling Fixed)
import varanasiPkg from '../assets/ExperienceVaranasi/KashiVT.png';
import ayodhyaPkg from '../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaPkg from '../assets/tour packege photo/BiharBuddha.png';
import chunarPkg from '../assets/tour packege photo/ChunarFort.png';
import nepalPkg from '../assets/tour packege photo/NepalTour.png';

export default function Packages() {
    const packagesList = [
        {
            title: "Varanasi Spiritual Tour",
            duration: "2 Nights / 3 Days",
            price: "8,999",
            details: "Comprehensive divine exploration covering Subah-e-Banaras, world-famous Ganga Aarti, Kashi Vishwanath corridor, and Sarnath Buddhist heritage site.",
            image: varanasiPkg,
            alt: "Varanasi spiritual tour kashi vishwanath darshan banaras yatra"
        },
        {
            title: "Ayodhya Darshan Tour",
            duration: "1 Night / 2 Days",
            price: "6,999",
            details: "Immerse in devotion at Shri Ram Janmabhoomi temple, Hanuman Garhi, Kanak Bhawan palace, and participate in the evening Sarayu River beautiful sandhya aarti.",
            image: ayodhyaPkg,
            alt: "Ayodhya ram mandir package tour booking"
        },
        {
            title: "Bodh Gaya Tour",
            duration: "1 Night / 2 Days",
            price: "7,999",
            details: "A peaceful journey tracing the footsteps of Lord Buddha at Mahabodhi Temple, the sacred Bodhi Tree, and spectacular multi-national monasteries.",
            image: bodhgayaPkg,
            alt: "Bodh gaya mahabodhi temple tour operator"
        },
        {
            title: "Mirzapur - Chunar Tour",
            duration: "1 Night / 2 Days",
            price: "6,499",
            details: "Perfect historic escape showcasing the mighty stone walls of Chunar Fort on the Ganges, holy Vindhyachal Devi temple, and majestic natural waterfalls.",
            image: chunarPkg,
            alt: "Chunar fort vindhyachal temple sightseeing taxi"
        },
        {
            title: "Varanasi to Nepal Tour",
            duration: "2 Nights / 3 Days",
            price: "10,999",
            details: "An extensive cross-border premium spiritual circuit exploring Lord Buddha's birthplace in Lumbini, scenic Pokhara lakes, and Kathmandu temples.",
            image: nepalPkg,
            alt: "Varanasi to nepal lumbini kathmandu travel package"
        }
    ];

    return (
        <section id="packages" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 text-center select-none">
            <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">Our Popular Tour Packages</h2>
                <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-stone-500 text-sm max-w-xl mx-auto mb-12">Select from our perfectly aligned, time-optimized spiritual itineraries curated thoughtfully for individuals, extended families, and senior citizens.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {packagesList.map((pkg, i) => (
                        <article key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between text-left transform hover:scale-[1.01]">
                            <div className="h-44 bg-stone-900 overflow-hidden relative group">
                                <img src={pkg.image} alt={pkg.alt} loading="lazy" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md border border-stone-800">⭐ Best Seller</div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded-md">{pkg.duration}</span>
                                    <h3 className="font-serif font-bold text-base text-stone-900 mt-3 mb-2 leading-tight min-h-[44px]">{pkg.title}</h3>
                                    <p className="text-xs text-stone-500 line-clamp-4 leading-relaxed">{pkg.details}</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col space-y-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[11px] font-medium text-stone-400">Starting at</span>
                                        <span className="text-lg font-black text-stone-900">₹{pkg.price} <span className="text-[10px] font-normal text-stone-400">/ Person</span></span>
                                    </div>
                                    <a href="#booking-form" className="block text-center text-xs font-bold bg-stone-900 hover:bg-orange-600 text-white py-3 rounded-lg transition-colors duration-200 shadow-xs hover:shadow-md uppercase tracking-wider">View Details</a>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
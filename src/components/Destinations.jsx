import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';

// Local images connection
import varanasiImg from '../assets/ExperienceVaranasi/KashiVT.png';
import ayodhyaImg from '../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaImg from '../assets/tour packege photo/BiharBuddha.png';
import chunarImg from '../assets/tour packege photo/ChunarFort.png';
import mirzapurImg from '../assets/tour packege photo/Mirzapur.png';
import nepalImg from '../assets/tour packege photo/NepalTour.png';

export default function Destinations() {
    const destinationList = [
        {
            name: "Varanasi",
            slug: "varanasi",
            desc: "Spiritual Capital of India — Experience Holy Ganga Aarti, ancient alleyways, and divine Kashi Vishwanath temple.",
            tag: "Local Sightseeing",
            image: varanasiImg,
            alt: "Varanasi kashi vishwanath temple local sightseeing tour"
        },
        {
            name: "Ayodhya",
            slug: "ayodhya",
            desc: "Shri Ram Janmabhoomi — Visit the majestic Ram Mandir, Hanuman Garhi, and the serene holy Sarayu River ghats.",
            tag: "4-5 Hours By Car",
            image: ayodhyaImg,
            alt: "Ayodhya ram janmabhoomi mandir darshan tour package"
        },
        {
            name: "Bodh Gaya (Bihar)",
            slug: "bodh-gaya",
            desc: "Mahabodhi Temple — Explore the sacred Buddhist heritage circuit where Prince Siddhartha attained enlightenment.",
            tag: "5-6 Hours By Car",
            image: bodhgayaImg,
            alt: "Bodh gaya mahabodhi temple bihar buddha tour"
        },
        {
            name: "Chunar Fort",
            slug: "chunar",
            desc: "Historical Fort & Views — Dive deep into rich ancient history, fort legacies, and breathtaking views of the Ganges.",
            tag: "1.5 Hours By Car",
            image: chunarImg,
            alt: "Chunar fort historical travel package from varanasi"
        },
        {
            name: "Mirzapur",
            slug: "vindhyachal",
            desc: "Scenic Beauty & Temples — Famous for Vindhyachal Dham shaktipeeth temple and beautiful natural waterfalls.",
            tag: "2.5 Hours By Car",
            image: mirzapurImg,
            alt: "Mirzapur vindhyachal dham temple sightseeing tour"
        },
        {
            name: "Nepal (Sonauli)",
            slug: "nepal",
            desc: "Spiritual & Natural Beauty — A seamless cross-border holy pilgrimage experience from Varanasi to Nepal border.",
            tag: "5-6 Hours By Car",
            image: nepalImg,
            alt: "Varanasi to nepal sonauli border tour travel package"
        }
    ];

    return (
        <section id="destinations" className="py-20 bg-stone-50 text-center px-4 sm:px-6 select-none border-b border-stone-200/50">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">Popular Destinations Nearby</h2>
                <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-stone-500 text-sm max-w-xl mx-auto mb-12">Handpicked holy, cultural and historical places near Varanasi crafted meticulously for an absolute unforgettable travel experience.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {destinationList.map((dest, idx) => (
                        <article key={idx} className="group bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
                            <div>
                                <div className="h-44 overflow-hidden relative bg-stone-900">
                                    <ImageWithSkeleton src={dest.image} alt={dest.alt} className="transform group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="p-4 text-left">
                                    <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-orange-600 transition-colors duration-200">
                                        <Link to={`/destinations/${dest.slug}`}>{dest.name}</Link>
                                    </h3>
                                    <p className="text-xs text-stone-500 mt-2 line-clamp-3 leading-relaxed">{dest.desc}</p>
                                </div>
                            </div>
                            <div className="p-4 pt-0 text-left">
                                <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md mb-3">{dest.tag}</span>
                                <Link 
                                    to={`/destinations/${dest.slug}`} 
                                    className="block text-center text-xs font-bold border border-stone-200 text-stone-700 hover:border-orange-500 hover:bg-orange-600 hover:text-white py-2.5 rounded-lg transition-all duration-200 shadow-sm"
                                >
                                    Explore Route ➔
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
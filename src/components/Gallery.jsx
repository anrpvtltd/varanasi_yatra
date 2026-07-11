import React from 'react';

// ExperienceVaranasi files imported cleanly
import assiImg from '../assets/ExperienceVaranasi/AssiMorning.png';
import aartiImg from '../assets/ExperienceVaranasi/GangaAarti.png';
import kashiImg from '../assets/ExperienceVaranasi/KashiVT.png';
import sarnathImg from '../assets/ExperienceVaranasi/sarnathStupa.png';

export default function Gallery() {
    const galleryImages = [
        {
            url: assiImg,
            caption: "Subah-E-Banaras — Sacred Morning Rituals at Assi Ghat",
            alt: "Varanasi morning rituals assi ghat banaras yatra"
        },
        {
            url: aartiImg,
            caption: "Maha Ganga Aarti — Majestic Spiritual Energy at Dashashwamedh",
            alt: "Ganga aarti varanasi kashi holy rituals"
        },
        {
            url: kashiImg,
            caption: "Kashi Vishwanath — The Sacred Golden Corridor Divine View",
            alt: "Kashi vishwanath temple corridor gate banaras"
        },
        {
            url: sarnathImg,
            caption: "Sarnath Dhamek Stupa — Ancient Buddhist Monastic Legacy Circuit",
            alt: "Sarnath dhamek stupa buddha heritage varanasi"
        }
    ];

    return (
        <section id="gallery" className="py-20 bg-stone-900 text-white text-center px-4 sm:px-6 select-none border-b border-stone-950">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 tracking-wide">Experience Varanasi Legacies</h2>
                <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                <p className="text-stone-400 text-sm max-w-xl mx-auto mb-12">A visual glimpse into the oldest living city. Real snapshots capturing divine aesthetics, holy ghats, and spiritual energy.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {galleryImages.map((img, idx) => (
                        <div key={idx} className="group relative h-64 bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                            <img src={img.url} alt={img.alt} loading="lazy" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-end p-5 text-left">
                                <span className="text-orange-400 text-[10px] uppercase font-bold tracking-widest mb-1">📸 Varanasi Assets</span>
                                <p className="text-white text-xs font-medium leading-relaxed">{img.caption}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
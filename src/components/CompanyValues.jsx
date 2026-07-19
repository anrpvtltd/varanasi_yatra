import React from 'react';

export default function CompanyValues() {
    const valuesList = [
        {
            icon: "🤝",
            title: "Customer First",
            desc: "Your spiritual peace is our highest priority. We align every itinerary to match your family's specific preferences."
        },
        {
            icon: "😇",
            title: "Honesty",
            desc: "Zero hidden charges. Clear booking confirmations, transparent rates, and honest descriptions of hotels and services."
        },
        {
            icon: "🛡️",
            title: "Safety",
            desc: "Verified local drivers, sanitized AC cabs, and local travel assistants to ensure complete protection for women and seniors."
        },
        {
            icon: "🛋️",
            title: "Comfort",
            desc: "No rushed timetables. Relaxed schedules, handpicked hotels close to temples, and premium clean transport vehicles."
        },
        {
            icon: "🕉️",
            title: "Local Expertise",
            desc: "True local guidance. We coordinate with local priests and boatmen directly, bypassing retail tourist trap rates."
        },
        {
            icon: "⏰",
            title: "Reliability",
            desc: "Punctuality is our promise. Driver pickup notifications, hotel room check-in guarantees, and 24/7 hotline standby."
        },
        {
            icon: "❤️",
            title: "Personal Attention",
            desc: "Every group has a dedicated travel assistant. We coordinate daily with you to ensure a smooth, worry-free trip."
        }
    ];

    return (
        <section className="py-20 bg-stone-50 text-stone-800 border-b border-stone-200/50 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Heading */}
                <div className="text-center mb-12">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Core Principles</span>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Our Company Values</h2>
                    <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                    <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">We do not believe in numbers or awards. We believe in running a tourism brand built on trust, respect, and local heritage guidance.</p>
                </div>

                {/* Grid (Flex layout or grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5">
                    {valuesList.map((val, idx) => (
                        <div 
                            key={idx} 
                            className="bg-white border border-stone-200/80 p-5 rounded-2xl shadow-xs text-left hover:border-orange-200 transition duration-300"
                        >
                            <span className="text-2xl block mb-3">{val.icon}</span>
                            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5">{val.title}</h3>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{val.desc}</p>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

import React from 'react';

export default function Services() {
    const servicesList = [
        { t: "Airport Pickup & Drop", d: "We receive you safely right at the terminal gate." },
        { t: "Private Car & Driver", d: "Comfortable dynamic AC cars with seasoned local drivers." },
        { t: "Stay & Food Arrangement", d: "Handpicked cozy hotels and pure delicious veg food meals." },
        { t: "Local Guide Support", d: "Professional guides to make your heritage tour completely informative." },
        { t: "Customized Packages", d: "Trips accurately aligned with your custom budget or schedule constraints." },
        { t: "24x7 Assistance", d: "Dedicated local support helpdesk working around the clock." }
    ];

    return (
        <section id="services" className="py-20 bg-stone-900 text-white text-center px-4 sm:px-6 relative">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-serif font-bold mb-2 text-white">Why Travel With Banaras Yatra?</h2>
                <div className="w-12 h-1 bg-orange-500 mx-auto mb-12 rounded"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                    {servicesList.map((f, i) => (
                        <div key={i} className="p-5 bg-stone-800/50 border border-stone-800 rounded-xl text-left hover:border-stone-700 transition flex flex-col justify-between">
                            <div>
                                <div className="text-2xl mb-3 text-orange-400">✨</div>
                                <h3 className="font-bold text-sm text-white mb-2">{f.t}</h3>
                                <p className="text-xs text-stone-400 leading-relaxed">{f.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
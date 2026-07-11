import React from 'react';

export default function Workflow() {
    const steps = [
        { step: "1. You Enquire", desc: "Share your travel plans with us via form or phone." },
        { step: "2. We Plan", desc: "We customize the absolute best itinerary matching your budget." },
        { step: "3. We Receive", desc: "Our driver picks you up safely from Varanasi Airport/Station." },
        { step: "4. You Explore", desc: "Enjoy your peaceful trip with premium stays, food & guidance." },
        { step: "5. We Drop", desc: "We drop you back safely at the airport with blissful holy memories." }
    ];

    return (
        <section className="py-20 bg-stone-50 border-t border-b border-stone-200/60 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-12">Your Journey, Simplified</h2>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-8 relative">
                    {steps.map((p, i) => (
                        <div key={i} className="relative z-10 bg-white p-5 rounded-xl border border-stone-200/80 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center mx-auto mb-3">{i + 1}</div>
                            <h3 className="font-bold text-sm text-stone-900 mb-1">{p.step}</h3>
                            <p className="text-xs text-stone-500 leading-relaxed">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
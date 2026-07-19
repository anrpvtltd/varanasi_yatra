import React from 'react';

export default function TrustSection() {
    const trustItems = [
        { title: "Transparent Pricing", desc: "No commissions, zero surprise fees, and clear pricing breakdowns." },
        { title: "100% Local Team", desc: "Native Varanasi coordinators, drivers, and temple guides who know Kashi." },
        { title: "Custom Itineraries", desc: "Flexible day-wise planning designed around family and senior comfort." },
        { title: "Private Transportation", desc: "Clean, sanitized private AC vehicles reserved exclusively for your family." },
        { title: "Direct WhatsApp Support", desc: "Connect directly with our booking desk via WhatsApp for instant edits." },
        { title: "No Hidden Commissions", desc: "We do not push you to commercial stores or lock you into forced shopping stops." }
    ];

    return (
        <section className="py-16 bg-stone-900 text-white select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-800 px-2.5 py-1 rounded-md">Transparency Promise</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-3 mb-2">Our Commitment to Trust</h2>
                    <div className="w-12 h-0.5 bg-orange-500 mx-auto rounded-full"></div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                    {trustItems.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="p-5 bg-stone-800/30 border border-stone-800/80 rounded-2xl flex items-start space-x-3.5"
                        >
                            <span className="text-orange-500 text-lg font-bold">✓</span>
                            <div>
                                <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider mb-1">{item.title}</h3>
                                <p className="text-[11px] text-stone-400 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

import React from 'react';

export default function Services() {
    const servicesList = [
        {
            icon: "🗺️",
            title: "Local Travel Experts",
            why: "Varanasi has complex alleyways and temple schedules. Our local coordinators know the exact timings to avoid crowds and guide you to authentic spiritual sites."
        },
        {
            icon: "🚗",
            title: "Personal Courteous Driver",
            why: "Navigating local traffic can be stressful. We provide polite, experienced drivers who know the regional roads and prioritize your comfort and safety."
        },
        {
            icon: "✈️",
            title: "Safe Airport Pickup",
            why: "Avoid taxi scams and long wait times at the terminal. Our driver meets you directly at the arrival gate with your name tag for a smooth transfer."
        },
        {
            icon: "🏨",
            title: "Handpicked Family Hotels",
            why: "We inspect every hotel room for cleanliness, family safety, and proximity to Kashi Vishwanath temple, selecting properties serving pure veg food."
        },
        {
            icon: "📋",
            title: "Flexible Tour Plans",
            why: "We do not believe in rigid timelines. We adjust the travel pace daily to ensure senior citizens and children explore comfortably without exhaustion."
        },
        {
            icon: "💬",
            title: "24×7 Support Team",
            why: "You are never left alone. You receive a dedicated local coordinator reachable via WhatsApp at any hour to resolve transport or hotel questions instantly."
        },
        {
            icon: "💰",
            title: "Transparent Pricing",
            why: "We provide clear quotes detailing every inclusion. There are no hidden fees, surprise charges, or forced shopping stops during your tour."
        },
        {
            icon: "🛡️",
            title: "Comfortable AC Travel",
            why: "Varanasi weather can be intense. We ensure all sightseeing is done in clean, sanitized private AC vehicles matching your exact group requirements."
        }
    ];

    return (
        <section id="services" className="py-20 bg-stone-900 text-white text-center px-4 sm:px-6 relative select-none">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-800 px-3 py-1.5 rounded-md">Why Choose Us</span>
                <h2 className="text-3xl font-serif font-bold mt-4 mb-2 text-white">Spiritual Journeys Crafted with Integrity</h2>
                <div className="w-12 h-1 bg-orange-500 mx-auto mb-12 rounded"></div>

                {/* Grid Layout (2x4 on desktops, 1 column on mobiles) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                    {servicesList.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="p-6 bg-stone-800/40 border border-stone-800/80 rounded-2xl hover:border-orange-500/30 hover:bg-stone-900/50 transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <span className="text-3xl block mb-4">{item.icon}</span>
                                <h3 className="font-serif font-bold text-base text-stone-100 mb-2.5">{item.title}</h3>
                                <p className="text-xs text-stone-400 leading-relaxed font-medium">{item.why}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
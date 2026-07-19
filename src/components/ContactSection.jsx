import React from 'react';

export default function ContactSection() {
    return (
        <section id="contact-info" className="py-20 bg-white text-stone-800 border-t border-stone-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* Heading */}
                <div className="text-center mb-12 select-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Get In Touch</span>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Contact Our Travel Desk</h2>
                    <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                    <p className="text-stone-500 text-xs sm:text-sm max-w-md mx-auto">Have questions or want to customize your spiritual itinerary? Reach out directly to our local coordinators.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                    
                    {/* Left Column: Contact Cards */}
                    <div className="lg:col-span-6 space-y-4 text-left flex flex-col justify-between">
                        
                        {/* WhatsApp Primary CTA */}
                        <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start space-x-4">
                            <span className="text-3xl">💬</span>
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Primary Support (WhatsApp)</h3>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Click to chat instantly with our booking desk. Send your dates and get custom quotes directly on your phone.</p>
                                <a 
                                    href="https://wa.me/918149783494" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition duration-200"
                                >
                                    <span>Chat on WhatsApp</span> <span>➔</span>
                                </a>
                            </div>
                        </div>

                        {/* Call Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 border border-stone-200/80 rounded-2xl space-y-1.5 bg-stone-50/30">
                                <span className="text-xl">📞</span>
                                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Phone Call</h4>
                                <a href="tel:+918400554029" className="text-sm font-bold text-stone-900 hover:text-orange-600 transition-colors font-mono">
                                    +91-8400554029
                                </a>
                            </div>
                            <div className="p-5 border border-stone-200/80 rounded-2xl space-y-1.5 bg-stone-50/30">
                                <span className="text-xl">✉️</span>
                                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Official Email</h4>
                                <a href="mailto:info.varanasi.yatra@gmail.com" className="text-xs font-bold text-stone-900 hover:text-orange-600 transition-colors break-all">
                                    info.varanasi.yatra@gmail.com
                                </a>
                            </div>
                        </div>

                        {/* Operational details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 border border-stone-200/80 rounded-2xl space-y-1.5 bg-stone-50/30">
                                <span className="text-xl">📍</span>
                                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Serving Area</h4>
                                <p className="text-xs font-bold text-stone-900">
                                    Varanasi and Nearby Destinations
                                </p>
                            </div>
                            <div className="p-5 border border-stone-200/80 rounded-2xl space-y-1.5 bg-stone-50/30">
                                <span className="text-xl">⏰</span>
                                <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Working Hours</h4>
                                <p className="text-xs font-bold text-stone-900">
                                    24 X 7 Customer Support
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Simulated Maps Card */}
                    <div className="lg:col-span-6 border border-stone-200/80 rounded-3xl overflow-hidden relative min-h-[300px] flex flex-col justify-between shadow-xs p-6 sm:p-8 bg-stone-50/30">
                        <div className="text-left space-y-2 select-none">
                            <h3 className="text-sm font-bold text-stone-900 font-serif">Varanasi Operations Coordinates</h3>
                            <p className="text-xs text-stone-500 leading-relaxed font-medium">
                                We operate directly across Varanasi, Uttar Pradesh, connecting you seamlessly with hotels near the Ganga ghats, private boats at Dashashwamedh, and pickups at Lal Bahadur Shastri International Airport.
                            </p>
                        </div>
                        
                        {/* Map Visual Box */}
                        <div className="h-44 w-full bg-stone-200 rounded-2xl border border-stone-300/60 overflow-hidden flex flex-col items-center justify-center p-4 relative select-none">
                            <div className="absolute inset-0 bg-stone-900/5 [background-size:20px_20px] bg-[radial-gradient(#d6d3d1_1px,transparent_1px)]"></div>
                            <span className="text-3xl relative z-10 mb-2">🗺️</span>
                            <span className="text-xs font-bold text-stone-700 relative z-10">Varanasi, Uttar Pradesh, India</span>
                            <span className="text-[10px] text-stone-400 mt-1 relative z-10">Google Map Coordinates Integrated</span>
                        </div>

                        <a 
                            href="https://maps.google.com/?q=Varanasi,Uttar+Pradesh,India" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="block text-center text-xs font-bold border border-stone-200 hover:border-orange-500 hover:bg-orange-600 hover:text-white bg-white text-stone-700 py-3 rounded-xl transition duration-200 uppercase tracking-wider"
                        >
                            Open in Google Maps ➔
                        </a>
                    </div>

                </div>
            </div>
        </section>
    );
}

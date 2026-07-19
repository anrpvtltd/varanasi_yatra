import React from 'react';

export default function FounderMessage() {
    return (
        <section className="py-20 bg-white text-stone-800 border-b border-stone-200/50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="bg-stone-50 border border-stone-200/80 rounded-3xl p-8 sm:p-12 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
                    
                    {/* Founder Avatar Placeholder */}
                    <div className="flex-shrink-0 text-center">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-stone-900 border border-stone-800 shadow-md flex items-center justify-center text-orange-500 font-serif font-bold text-3xl mx-auto select-none">
                            BY
                        </div>
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mt-4">Founder Desk</h4>
                        <span className="text-[9px] uppercase font-bold text-orange-600 block mt-0.5">Banaras Yatra</span>
                    </div>

                    {/* Message Box */}
                    <div className="flex-1 text-left space-y-4">
                        <span className="text-3xl text-orange-500 font-serif font-bold select-none">“</span>
                        
                        <p className="text-xs sm:text-sm text-stone-600 italic font-medium leading-relaxed mt-0">
                            Our goal is to make every visitor experience the spiritual beauty of Varanasi with comfort, transparency, and local guidance. 
                        </p>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                            Varanasi is not just a destination; it is an emotional and spiritual awakening. However, to feel that divinity, one needs a peaceful state of mind. We started Banaras Yatra to ensure that logistics, hotel bookings, and transport coordination are handled honestly, leaving you free to absorb the sacred energy of Kashi.
                        </p>
                        
                        <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                            <div>
                                <h5 className="text-xs font-bold text-stone-900">The Banaras Yatra Team</h5>
                                <span className="text-[10px] text-stone-400">Local Travel Coordinators</span>
                            </div>
                            <span className="text-orange-500 font-bold select-none text-xl">🙏</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

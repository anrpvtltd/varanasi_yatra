import React from 'react';

export default function Testimonials() {
    return (
        <section className="py-20 bg-stone-50 border-t border-b border-stone-200/50 select-none">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
                
                {/* Heading */}
                <div className="mb-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Customer Stories</span>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Traveler Experiences</h2>
                    <div className="w-12 h-1 bg-orange-500 mx-auto mb-4 rounded-full"></div>
                </div>

                {/* Professional coming soon card */}
                <div className="bg-white border border-stone-200/80 p-8 sm:p-12 rounded-3xl shadow-sm text-center space-y-4 max-w-xl mx-auto">
                    <span className="text-4xl">🌟</span>
                    <h3 className="text-lg font-serif font-bold text-stone-900">Our First Customer Stories Will Appear Here</h3>
                    <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-medium">
                        As a new local travel startup built on transparency, we are currently hosting our very first groups of spiritual pilgrims. Soon, this section will showcase their verified reviews and beautiful memories.
                    </p>
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-center space-x-2.5">
                        <span className="text-xs font-bold text-stone-700">Display Coming Soon</span>
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                    </div>
                </div>

            </div>
        </section>
    );
}
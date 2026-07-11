import React from 'react';

export default function Testimonials() {
    const reviews = [
        { name: "Rajesh Sharma", loc: "Delhi", text: "Banaras Yatra made our family trip absolutely perfect. Stays, food, and driver management were top notch. Highly recommended!" },
        { name: "Anjali Verma", loc: "Mumbai", text: "Great experience! The driver was very polite and the hotels chosen near the temple were neat and food was pure veg and tasty." },
        { name: "Sandeep Iyer", loc: "Bangalore", text: "We visited Varanasi, Ayodhya, and Bodh Gaya with them. Wonderful service, excellent local knowledge and round-the-clock support." }
    ];

    return (
        <section id="about" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                {/* Testimonials */}
                <div className="lg:col-span-8 space-y-6">
                    <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">Trusted by Travelers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {reviews.map((t, idx) => (
                            <div key={idx} className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                                <p className="text-xs text-stone-600 italic leading-relaxed">"{t.text}"</p>
                                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center space-x-2">
                                    <div className="w-7 h-7 rounded-full bg-stone-300 flex items-center justify-center text-[10px] font-bold uppercase">{t.name[0]}</div>
                                    <div>
                                        <h4 className="text-xs font-bold text-stone-900">{t.name}</h4>
                                        <span className="text-[10px] text-stone-400">{t.loc}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call To Action Box */}
                <div className="lg:col-span-4 bg-stone-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl"></div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-3">Ready to Start Your Journey?</h2>
                        <p className="text-xs text-stone-400 leading-relaxed">Let us create divine memories you and your family will cherish forever. Contact us today for special custom offers.</p>
                    </div>
                    <div className="mt-8">
                        <a href="#booking-form" className="block text-center bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition shadow-lg">
                            Plan My Trip Now ➔
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
}
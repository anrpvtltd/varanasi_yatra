import React from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';
import mainStoryImg from '../assets/ExperienceVaranasi/AssiMorning.png';

export default function AboutUs() {
    return (
        <section id="about" className="py-20 bg-white text-stone-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left Column: Story Text */}
                    <div className="lg:col-span-7 space-y-6 text-left">
                        <div className="inline-block">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Our Story</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 leading-tight">
                            Born out of a Passion to Share the Sacred Beauty of Kashi
                        </h2>
                        <div className="w-12 h-1 bg-orange-500 rounded-full"></div>
                        
                        <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                            <p>
                                Banaras Yatra began with a simple, personal observation. Over the years, we watched family, friends, and pilgrims from all parts of India arrive in Varanasi with hearts full of devotion, only to face confusion. Finding a clean, family-friendly hotel near the Ganga ghats, coordinating a trustworthy taxi driver, and securing a reliable temple guide often felt like an overwhelming task.
                            </p>
                            <p>
                                We started **Banaras Yatra** to change that. As locals who grew up listening to the temple bells and witnessing the morning Ganga Aarti at Assi Ghat, we wanted to bridge this gap. Our startup is built to replace uncertainty with warmth, comfort, and complete transparency.
                            </p>
                            <p>
                                We do not offer factory-made tours. Instead, we coordinate custom spiritual journeys designed for families and senior citizens. By working directly with trusted local transport owners, certified guides, and handpicked hotels, we make sure that your sacred pilgrimage is conducted in peace, comfort, and safety.
                            </p>
                        </div>

                        {/* Values Bullet Points */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                            <div>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">Local Guardians</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed">We guide you through the city as our guests, not just customers, ensuring safety and respect at every step.</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">Honest & Transparent</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed">With us, what you see is what you get. No hidden commissions, no pressure, and clear cancellation terms.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visual Showcase */}
                    <div className="lg:col-span-5 relative">
                        {/* Decorative background shape */}
                        <div className="absolute -inset-4 bg-orange-500/5 rounded-3xl -rotate-2 scale-95 pointer-events-none"></div>
                        
                        <div className="relative border border-stone-200 p-2.5 bg-white rounded-3xl shadow-xl overflow-hidden group">
                            <ImageWithSkeleton 
                                src={mainStoryImg} 
                                alt="Morning prayers at Assi Ghat Varanasi Banaras Yatra story" 
                                containerClassName="h-80 w-full rounded-2xl"
                                className="group-hover:scale-101 transition-transform duration-500"
                            />
                            
                            {/* Short caption card overlay */}
                            <div className="absolute bottom-6 left-6 right-6 bg-stone-950/80 backdrop-blur-md p-4 rounded-xl border border-stone-800 text-left">
                                <span className="text-[9px] uppercase tracking-widest text-orange-400 font-bold block mb-1">Varanasi, Uttar Pradesh</span>
                                <p className="text-white text-xs font-medium">"Our mission is to make every visitor experience the spiritual soul of Banaras with absolute comfort."</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

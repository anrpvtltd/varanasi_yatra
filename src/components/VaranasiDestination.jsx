import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from './ImageWithSkeleton';
import BookingForm from './BookingForm';
import SEO from './SEO';

// Local images connection
import assiImg from '../assets/ExperienceVaranasi/AssiMorning.png';
import aartiImg from '../assets/ExperienceVaranasi/GangaAarti.png';
import kashiImg from '../assets/ExperienceVaranasi/KashiVT.png';
import sarnathImg from '../assets/ExperienceVaranasi/sarnathStupa.png';
import chunarImg from '../assets/tour packege photo/ChunarFort.png';

export default function VaranasiDestination() {
    const [faqOpen, setFaqOpen] = useState(Array(20).fill(false));

    const toggleFaq = (index) => {
        setFaqOpen(prev => {
            const newState = [...prev];
            newState[index] = !newState[index];
            return newState;
        });
    };

    // Attractions List (10 items)
    const attractions = [
        { name: "Kashi Vishwanath Temple", desc: "The sacred golden spire housing one of the twelve Jyotirlingas, surrounded by a magnificent new riverfront corridor.", img: kashiImg, alt: "Kashi vishwanath temple golden dome varanasi" },
        { name: "Dashashwamedh Ghat", desc: "The main busy ghat on the Ganges where the grand spiritual evening Ganga Aarti is conducted daily.", img: aartiImg, alt: "Dashashwamedh ghat evening ganga aarti ceremony" },
        { name: "Assi Ghat", desc: "Located at the confluence of Ganges and Assi rivers, famous for Subah-e-Banaras morning rituals and yoga.", img: assiImg, alt: "Assi ghat morning sunrise ganga prayers" },
        { name: "Manikarnika Ghat", desc: "The primary cremation ghat in Varanasi, reflecting the eternal cycle of life, death, and spiritual liberation.", img: aartiImg, alt: "Manikarnika cremation ghat varanasi" },
        { name: "Sarnath Stupa Complex", desc: "The deer park site where Lord Buddha delivered his first sermon, featuring ancient monasteries and Ashoka pillars.", img: sarnathImg, alt: "Sarnath dhamek stupa buddha sightseeing heritage" },
        { name: "Sankat Mochan Temple", desc: "An ancient, highly revered temple dedicated to Lord Hanuman, founded by the saint-poet Goswami Tulsidas.", img: kashiImg, alt: "Sankat mochan hanuman mandir varanasi" },
        { name: "Durga Temple (Monkey Temple)", desc: "A striking 18th-century red-stone temple built in Nagara style, dedicated to Goddess Durga.", img: kashiImg, alt: "Durga mandir red stone temple varanasi" },
        { name: "Tulsi Manas Temple", desc: "A modern white marble temple where the holy epic Ramcharitmanas was written, engraved completely on its walls.", img: kashiImg, alt: "Tulsi manas temple marble walls varanasi" },
        { name: "Ramnagar Fort", desc: "A majestic 18th-century sandstone fortress on the eastern bank of the Ganges, housing a vintage museum.", img: chunarImg, alt: "Ramnagar fort museum riverbank varanasi" },
        { name: "Banaras Hindu University (BHU)", desc: "One of the largest residential universities in Asia, featuring the peaceful green New Vishwanath Mandir temple.", img: sarnathImg, alt: "Banaras hindu university new vishwanath temple campus" }
    ];

    // Food list
    const foodList = [
        { name: "Kachori Sabzi", desc: "Crispy, deep-fried kachoris stuffed with lentils, served with spicy potato curry and sweet jalebis.", icon: "🍛" },
        { name: "Tamatar Chaat", desc: "A unique Varanasi street food made of mashed tomatoes, potatoes, spices, and topped with sugar syrup.", icon: "🍲" },
        { name: "Banarasi Lassi", desc: "Thick, creamy yogurt blended with saffron, served in earthen clay pots (kulhads) with a thick layer of malai.", icon: "🥤" },
        { name: "Malaiyo", desc: "A delicate, seasonal winter dessert made of aerated milk foam, saffron, cardamom, and chopped pistachios.", icon: "🍧" },
        { name: "Banarasi Paan", desc: "The legendary betel leaf preparation stuffed with areca nut, gulkand, spices, and mint, melting instantly in your mouth.", icon: "🍃" }
    ];

    // Shopping List
    const shoppingList = [
        { name: "Banarasi Silk Saree", desc: "Exquisite hand-woven sarees made of fine silk and decorated with intricate gold and silver zari work.", icon: "👗" },
        { name: "Sacred Rudraksha Beads", desc: "Authentic, high-energy spiritual prayer beads sourced directly through reliable Himalayan coordinates.", icon: "📿" },
        { name: "Lacquered Wooden Toys", desc: "Brightly colored, traditional wooden dolls, animals, and toys handcrafted by local Banaras artisans.", icon: "🧸" },
        { name: "brass religious idols", desc: "Intricately detailed brass pots, bells, and spiritual deity statues molded by local metalworkers.", icon: "🔔" }
    ];

    // travel tips
    const travelTips = [
        { title: "Dress Code", desc: "Dress modestly when visiting temples. Cover shoulders and knees. Slip-on shoes are recommended as you will need to remove them frequently." },
        { title: "Corridor Rules", desc: "Mobile phones, cameras, leather belts, bags, and power banks are strictly prohibited inside the main Kashi Vishwanath temple corridors." },
        { title: "Photography Ethics", desc: "Avoid taking pictures inside temple premises and specifically at cremation ghats (Manikarnika and Harishchandra Ghats) out of respect." },
        { title: "Street Safety", desc: "Be wary of local street guides, priests, or boatmen charging excessive fees. Always rely on pre-arranged transport and guides." }
    ];

    // Related Packages list
    const relatedPkgs = [
        { title: "Varanasi Spiritual Tour", duration: "2 Nights / 3 Days", price: "8,999", slug: "varanasi-tour", image: kashiImg },
        { title: "Varanasi to Nepal Tour", duration: "2 Nights / 3 Days", price: "10,999", slug: "nepal-tour", image: assiImg }
    ];

    // 20 FAQs
    const faqs = [
        { q: "What is the spiritual significance of Varanasi?", a: "Varanasi (Kashi) is believed to be the abode of Lord Shiva. It is believed that dying here or having one's ashes immersed in the Ganges leads to Moksha (liberation from the cycle of rebirth)." },
        { q: "Where is the best view of the evening Ganga Aarti?", a: "Dashashwamedh Ghat is the main location. The best view is from a private boat anchored on the river facing the ghat, or from the reserved wooden platforms." },
        { q: "What are the timings of the Ganga Aarti?", a: "The Aarti begins around 6:30 PM in winters and 7:00 PM in summers, lasting for approximately 45 minutes." },
        { q: "Can senior citizens visit the Kashi Vishwanath temple comfortably?", a: "Yes, the new Corridor has wheelchair access and escalators from the ghat side. We also coordinate VIP darshan passes to minimize waiting times." },
        { q: "How far is Sarnath from Varanasi city center?", a: "Sarnath is about 10 km away, taking approximately 30 minutes by private car." },
        { q: "What is Subah-e-Banaras?", a: "It is a cultural and spiritual morning program at Assi Ghat featuring morning Ganga Aarti, Vedic chanting, classical music, and yoga at sunrise." },
        { q: "Is Varanasi safe for female solo travelers?", a: "Yes, Varanasi is generally safe, but we recommend avoiding empty alleyways late at night and hiring verified local drivers." },
        { q: "What local foods must we try in Varanasi?", a: "You must try Kachori Sabzi for breakfast, Tamatar Chaat, Kulhad Lassi, and the iconic Banarasi Paan." },
        { q: "Can we book a private boat for the sunrise?", a: "Yes, sunrise boat rides can be booked via our helpline. They start around 5:15 AM from Assi Ghat or Dashashwamedh Ghat." },
        { q: "How long is a standard boat ride?", a: "A standard boat ride lasts about 1 to 1.5 hours, covering major ghats from Assi Ghat to Manikarnika Ghat." },
        { q: "What is the best month to visit Varanasi?", a: "The best months are October to March when the weather is pleasant. Summers (April-June) are extremely hot." },
        { q: "Do we need a guide in Varanasi?", a: "A local guide is highly recommended to navigate the narrow alleys, explain historical contexts, and avoid temple brokers." },
        { q: "Are mobile phones allowed in Kashi Vishwanath temple?", a: "No, phones and electronic items are not allowed. Free locker facilities are available near the corridor gates." },
        { q: "How far is Varanasi airport from the ghats?", a: "Lal Bahadur Shastri International Airport in Babatpur is 24 km from the ghats, taking about 1 hour by taxi." },
        { q: "What is the significance of Manikarnika Ghat?", a: "It is the primary cremation ghat where pyres burn 24/7. It represents spiritual detachment and liberation." },
        { q: "Can we buy authentic Banarasi Sarees directly from weavers?", a: "Yes, our guides can lead you directly to weaver cooperatives in Peeli Kothi or Lallapura to purchase genuine handloom silks." },
        { q: "What should we wear while visiting temples?", a: "Wear modest Indian attire. Salwar kameez, sarees, or trousers for women, and kurtas or trousers for men." },
        { q: "Is alcohol allowed in Varanasi?", a: "Alcohol is banned within a certain radius of the temples and ghats. Only pure vegetarian food is served near sacred areas." },
        { q: "What is the cost of a private taxi for sightseeing?", a: "Private sedan taxis start around ₹2,500/day for local tours. Our packages include premium sanitized vehicles." },
        { q: "How can we book custom tour packages with Banaras Yatra?", a: "You can submit an enquiry form directly on this page, or click the WhatsApp button to chat with our travel coordinators." }
    ];

    // Schema structure for dynamic search indexing
    const schemaOrg = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://banarasyatra.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Destinations", "item": "https://banarasyatra.com/#destinations" },
                    { "@type": "ListItem", "position": 3, "name": "Varanasi", "item": "https://banarasyatra.com/destinations/varanasi" }
                ]
            },
            {
                "@type": "TouristAttraction",
                "name": "Varanasi (Kashi)",
                "description": "Varanasi is the spiritual capital of India. Explore ancient temples, holy ghats, and Ganga Aarti ceremonies with local coordinators.",
                "image": `https://banarasyatra.com/assets/KashiVT.png`,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Varanasi",
                    "addressRegion": "Uttar Pradesh",
                    "addressCountry": "IN"
                }
            }
        ]
    };

    return (
        <div className="bg-stone-50 min-h-screen text-stone-800 text-left font-sans antialiased">
            <SEO 
                title="Varanasi (Kashi) Travel Guide - Local Sightseeing & Tour Packages"
                description="Explore Varanasi (Kashi) with local experts. Complete guide to Kashi Vishwanath temple, Ganga Aarti, boat rides, foods, shopping tips, and 20 FAQs."
                canonicalUrl="https://banarasyatra.com/destinations/varanasi"
                ogImage={kashiImg}
                schema={schemaOrg}
            />

            {/* Breadcrumbs */}
            <div className="bg-white border-b border-stone-200 py-3.5 select-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-stone-500 font-medium flex items-center space-x-2">
                    <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                    <span>/</span>
                    <a href="/#destinations" className="hover:text-orange-600 transition-colors">Destinations</a>
                    <span>/</span>
                    <span className="text-stone-900 font-bold">Varanasi</span>
                </div>
            </div>

            {/* 1. Hero Section */}
            <section className="relative bg-stone-950 text-white py-20 sm:py-32 overflow-hidden select-none">
                <div className="absolute inset-0 opacity-45">
                    <ImageWithSkeleton src={aartiImg} alt="Varanasi ganga aarti travel guide" containerClassName="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent"></div>
                
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-md inline-block">The Holy City</span>
                    <h1 className="text-3xl sm:text-6xl font-serif font-bold text-white tracking-wide leading-tight">
                        Discover the Spiritual Capital of India
                    </h1>
                    <div className="w-16 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    <p className="text-xs sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed font-medium">
                        Embark on a sacred journey through Varanasi. Experience the eternal morning chants, Kashi Vishwanath corridors, and the divine evening Ganga Aarti with local guides.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        <a href="#booking-section" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-bold transition text-xs uppercase tracking-wider shadow-lg">
                            Book Tour ➔
                        </a>
                        <a href="https://wa.me/918149783494" target="_blank" rel="noreferrer" className="bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-white px-6 py-3 rounded-xl font-bold transition text-xs uppercase tracking-wider flex items-center space-x-2">
                            <span className="text-emerald-500 text-sm">💬</span> <span>WhatsApp</span>
                        </a>
                        <a href="tel:+918400554029" className="bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-white px-6 py-3 rounded-xl font-bold transition text-xs uppercase tracking-wider flex items-center space-x-2">
                            <span>📞</span> <span>Call Now</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* 2. About Varanasi */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                    <div className="md:col-span-7 space-y-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">City Insight</span>
                        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">About Varanasi (Kashi)</h2>
                        <div className="w-12 h-0.5 bg-orange-500 rounded-full"></div>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                            Varanasi, historically known as Kashi and Banaras, is revered as the spiritual center of Hinduism. Nestled along the banks of the sacred Ganges River, this city has been a witness to civilizations, philosophies, and religious lineages for over 3,000 years, making it one of the oldest continuously inhabited cities in the world.
                        </p>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                            Mark Twain famously remarked, "Benares is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together." It is the legendary city of Lord Shiva, where life and death converge seamlessly.
                        </p>
                    </div>
                    <div className="md:col-span-5 bg-stone-50 border border-stone-200/80 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xs">
                        <h3 className="font-serif font-bold text-stone-950 text-sm uppercase tracking-wider">Why Millions Visit</h3>
                        <ul className="space-y-3.5 text-xs text-stone-600 font-medium">
                            <li className="flex items-start space-x-2.5">
                                <span className="text-orange-500 mt-0.5">🕉️</span>
                                <span>**Spiritual Purification:** Immersing in the sacred waters of Ganga to wash away sins.</span>
                            </li>
                            <li className="flex items-start space-x-2.5">
                                <span className="text-orange-500 mt-0.5">🕯️</span>
                                <span>**Ganga Aarti:** Witnessing the synchronization of light and mantras at sunset.</span>
                            </li>
                            <li className="flex items-start space-x-2.5">
                                <span className="text-orange-500 mt-0.5">📿</span>
                                <span>**Liberation (Moksha):** Believing that breathing one's last in Kashi liberates the soul.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 3. Top Attractions */}
            <section className="py-20 bg-stone-50 border-t border-b border-stone-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Sightseeing</span>
                    <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Top Attractions in Varanasi</h2>
                    <div className="w-12 h-1 bg-orange-500 mx-auto mb-10 rounded-full"></div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {attractions.map((attr, idx) => (
                            <div key={idx} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group">
                                <div className="h-40 bg-stone-900 overflow-hidden relative">
                                    <ImageWithSkeleton src={attr.img} alt={attr.alt} className="transform group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-serif font-bold text-stone-900 text-sm leading-tight mb-2 group-hover:text-orange-600 transition-colors">{attr.name}</h3>
                                        <p className="text-[11px] text-stone-500 leading-relaxed font-medium line-clamp-4">{attr.desc}</p>
                                    </div>
                                    <div className="mt-4 pt-3.5 border-t border-stone-100">
                                        <span className="text-[9px] uppercase tracking-wider text-orange-600 font-black">Varanasi Landmark</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Sample One-Day Itinerary */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Plan Your Day</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Sample One-Day Itinerary</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 sm:before:left-1/2 before:w-[1.5px] before:bg-stone-200 pointer-events-none select-none">
                        
                        {/* Timeline Item 1 */}
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center relative z-10">
                            <div className="w-full sm:w-[45%] text-left sm:text-right space-y-1">
                                <span className="text-xs font-mono font-bold text-orange-600 block">05:00 AM - 07:30 AM</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Morning Ganga Aarti & Sunrise Cruise</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Witness Subah-e-Banaras prayers at Assi Ghat, followed by a private wooden boat ride to observe prayers and sunrise.</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-sm flex items-center justify-center my-3 sm:my-0"></div>
                            <div className="hidden sm:block w-[45%]"></div>
                        </div>

                        {/* Timeline Item 2 */}
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center relative z-10">
                            <div className="hidden sm:block w-[45%]"></div>
                            <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-sm flex items-center justify-center my-3 sm:my-0"></div>
                            <div className="w-full sm:w-[45%] text-left space-y-1">
                                <span className="text-xs font-mono font-bold text-orange-600 block">08:00 AM - 09:30 AM</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Traditional Breakfast</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Savor local kachori-sabzi, sweet hot jalebi, and Kulhad Lassi at local heritage street side food stalls.</p>
                            </div>
                        </div>

                        {/* Timeline Item 3 */}
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center relative z-10">
                            <div className="w-full sm:w-[45%] text-left sm:text-right space-y-1">
                                <span className="text-xs font-mono font-bold text-orange-600 block">10:00 AM - 01:00 PM</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Kashi Vishwanath Corridor Visit</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Explore Kashi Vishwanath temple, Annapurna Mandir, and adjacent historic corridors with certified guides.</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-sm flex items-center justify-center my-3 sm:my-0"></div>
                            <div className="hidden sm:block w-[45%]"></div>
                        </div>

                        {/* Timeline Item 4 */}
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center relative z-10">
                            <div className="hidden sm:block w-[45%]"></div>
                            <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-sm flex items-center justify-center my-3 sm:my-0"></div>
                            <div className="w-full sm:w-[45%] text-left space-y-1">
                                <span className="text-xs font-mono font-bold text-orange-600 block">02:00 PM - 05:00 PM</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Heritage Sightseeing in Sarnath</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Drive to Sarnath to explore the Buddhist archaeological museum, ancient Ashoka pillars, and peaceful monasteries.</p>
                            </div>
                        </div>

                        {/* Timeline Item 5 */}
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center relative z-10">
                            <div className="w-full sm:w-[45%] text-left sm:text-right space-y-1">
                                <span className="text-xs font-mono font-bold text-orange-600 block">05:30 PM - 07:30 PM</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Evening Maha Ganga Aarti</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Anchor in a private boat at Dashashwamedh Ghat to view the magnificent, synchronized holy lamp rituals.</p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-orange-500 border-4 border-white shadow-sm flex items-center justify-center my-3 sm:my-0"></div>
                            <div className="hidden sm:block w-[45%]"></div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 5. Ganga Aarti Section */}
            <section className="py-20 bg-stone-900 text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                        <div className="md:col-span-6 space-y-5 text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-800 px-2.5 py-1 rounded-md">Divine Ritual</span>
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">The Evening Ganga Aarti</h2>
                            <div className="w-12 h-0.5 bg-orange-500 rounded-full"></div>
                            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-medium">
                                The evening Ganga Aarti at Dashashwamedh Ghat is a visual spectacle. Conducted by young priests clad in saffron, the ritual involves synchronizing large multi-tiered brass lamps to the rhythm of chants, conch shells, and temple bells.
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                <div className="p-3 bg-stone-850 rounded-xl border border-stone-800">
                                    <span className="text-orange-500 block mb-1">⏰ Best Time</span>
                                    <span className="text-stone-300">6:30 PM (Winter) / 7:00 PM (Summer)</span>
                                </div>
                                <div className="p-3 bg-stone-850 rounded-xl border border-stone-800">
                                    <span className="text-orange-500 block mb-1">📍 Main Ghat</span>
                                    <span className="text-stone-300">Dashashwamedh Ghat</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-6 space-y-4 text-left">
                            <div className="p-5 bg-stone-850 rounded-2xl border border-stone-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">⛵ Boat Experience</h4>
                                <p className="text-xs text-stone-400 leading-relaxed font-medium">We anchor private wooden boats right in front of the performance stage, giving you a front-row view without the shore crowds.</p>
                            </div>
                            <div className="p-5 bg-stone-850 rounded-2xl border border-stone-800">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">👑 VIP Platform Experience</h4>
                                <p className="text-xs text-stone-400 leading-relaxed font-medium">For families and seniors, we can coordinate reserved seating on elevated wooden platforms near the stage to ensure complete comfort.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Boat Ride Section */}
            <section className="py-20 bg-white border-b border-stone-200/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Ganges Cruising</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Sacred Ganges Boat Ride</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-3.5">
                            <span className="text-2xl">🌅</span>
                            <h3 className="text-sm font-bold text-stone-950 uppercase tracking-widest">Morning Sunrise Boat Cruise</h3>
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                                Watch the city wake up during sunrise. Starting from Assi Ghat, this ride lets you witness pilgrims bathing in the holy waters, priests conducting morning Vedic prayers, and the golden sun reflecting on the Ganges.
                            </p>
                        </div>
                        <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-3.5">
                            <span className="text-2xl">🌇</span>
                            <h3 className="text-sm font-bold text-stone-950 uppercase tracking-widest">Evening Sunset Aarti Cruise</h3>
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                                A dramatic cruise timed perfectly with the setting sun. Witness the cremation ghats lit up and drift towards Dashashwamedh Ghat to view the evening Aarti directly from the river.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Best Time To Visit */}
            <section className="py-20 bg-stone-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 select-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Climate Guide</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Best Time to Visit Varanasi</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-2.5">
                            <span className="text-xs font-bold text-orange-600 block uppercase tracking-wider">❄️ Winter (Oct - Mar)</span>
                            <h4 className="text-xs font-bold text-stone-900">Highly Recommended</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Cool breeze, comfortable walking temperatures ranging between 10°C and 25°C. Best time to explore narrow alleys and Ghat walks.</p>
                        </div>
                        <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-2.5">
                            <span className="text-xs font-bold text-orange-600 block uppercase tracking-wider">☀️ Summer (Apr - Jun)</span>
                            <h4 className="text-xs font-bold text-stone-900">Hot & Quiet</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Temperatures can cross 40°C. Heavy heatwaves, but hotels are more affordable and tourist crowds are significantly smaller.</p>
                        </div>
                        <div className="p-6 bg-white border border-stone-200 rounded-2xl space-y-2.5">
                            <span className="text-xs font-bold text-orange-600 block uppercase tracking-wider">🌧️ Monsoon (Jul - Sep)</span>
                            <h4 className="text-xs font-bold text-stone-900">Humid & River Rise</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">High humidity with frequent rains. River water levels rise significantly, sometimes halting boat operations temporarily.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. How To Reach */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 select-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Logistics</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">How to Reach Varanasi</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div className="p-6 border border-stone-200 rounded-2xl bg-stone-50/50 space-y-2">
                            <span className="text-xl">✈️</span>
                            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">By Air</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Lal Bahadur Shastri International Airport (Babatpur) is 24 km from the ghats. It has daily direct flights from Delhi, Mumbai, Bengaluru, and Kolkata.</p>
                        </div>
                        <div className="p-6 border border-stone-200 rounded-2xl bg-stone-50/50 space-y-2">
                            <span className="text-xl">🚂</span>
                            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">By Train</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">Varanasi Junction (BSB) and Pt. Deen Dayal Upadhyaya Station (Mughalsarai) are well-connected by direct express and Vande Bharat trains across India.</p>
                        </div>
                        <div className="p-6 border border-stone-200 rounded-2xl bg-stone-50/50 space-y-2">
                            <span className="text-xl">🚗</span>
                            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">By Road</h4>
                            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">National Highway 19 connects Varanasi directly to Lucknow, Patna, Allahabad (Prayagraj), and Gaya. Premium taxi transfers can be booked easily.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. Local Food */}
            <section className="py-20 bg-stone-50 border-t border-b border-stone-200/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 select-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Gastronomy</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Famous Banarasi Culinary Delights</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 text-left">
                        {foodList.map((food, i) => (
                            <div key={i} className="bg-white border border-stone-200/80 p-5 rounded-2xl shadow-xs space-y-2">
                                <span className="text-2xl block mb-2">{food.icon}</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{food.name}</h4>
                                <p className="text-[10px] text-stone-500 leading-relaxed font-medium">{food.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 10. Shopping */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 select-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Souvenirs</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Varanasi Local Shopping</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                        {shoppingList.map((item, i) => (
                            <div key={i} className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                                <span className="text-2xl block mb-2">{item.icon}</span>
                                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">{item.name}</h4>
                                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 11. Travel Tips */}
            <section className="py-20 bg-stone-900 text-white select-none">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-800 px-2.5 py-1 rounded-md">Safety First</span>
                        <h2 className="text-3xl font-serif font-bold text-white mt-3 mb-2">Crucial Varanasi Travel Guidelines</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {travelTips.map((tip, i) => (
                            <div key={i} className="p-6 bg-stone-850 rounded-2xl border border-stone-800 flex items-start space-x-4">
                                <span className="text-orange-500 font-bold text-lg">💡</span>
                                <div>
                                    <h4 className="text-xs font-bold text-stone-100 uppercase tracking-wider mb-1">{tip.title}</h4>
                                    <p className="text-[11px] text-stone-400 leading-relaxed font-medium">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 12. FAQ Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Quick Answers</span>
                        <h2 className="text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Varanasi Tour FAQs</h2>
                        <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="space-y-3.5 text-left">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(i)}
                                    className="w-full flex items-center justify-between p-4 focus:outline-none text-left cursor-pointer"
                                    aria-expanded={faqOpen[i]}
                                >
                                    <span className="text-xs sm:text-sm font-bold text-stone-900 pr-4">
                                        Q{i+1}. {faq.q}
                                    </span>
                                    <span className={`text-orange-600 transform transition-transform duration-200 font-bold text-sm ${faqOpen[i] ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                                {faqOpen[i] && (
                                    <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-stone-600 font-medium leading-relaxed border-t border-stone-200/60">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 13. Related Packages */}
            <section className="py-20 bg-stone-50 border-t border-b border-stone-200/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">Vetted Itineraries</span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-3 mb-2">Related Varanasi Packages</h2>
                    <div className="w-12 h-0.5 bg-orange-500 mx-auto mb-10 rounded-full"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                        {relatedPkgs.map((pkg, i) => (
                            <div key={i} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
                                <div className="h-44 bg-stone-950 overflow-hidden relative">
                                    <ImageWithSkeleton src={pkg.image} alt={pkg.title} className="transform group-hover:scale-105 transition-transform duration-550" />
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">{pkg.duration}</span>
                                        <h3 className="font-serif font-bold text-stone-900 text-sm mt-3.5 mb-2 leading-tight">{pkg.title}</h3>
                                        <span className="text-xs font-bold text-stone-900 block mt-1">Starting from ₹{pkg.price} / Person</span>
                                    </div>
                                    <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                                        <Link to={`/packages/${pkg.slug}`} className="text-xs font-bold text-stone-900 hover:text-orange-600 transition-colors">Detailed Itinerary ➔</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 14. Contact CTA Booking Form */}
            <section id="booking-section" className="py-20 bg-stone-950 text-white relative select-none">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    
                    {/* Left Column: Direct Support coordinates */}
                    <div className="lg:col-span-7 space-y-6 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-900 px-3 py-1.5 rounded-md border border-stone-800 inline-block">Secure Booking Desk</span>
                        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white leading-tight">
                            Book Your Sacred Journey with Banaras Yatra
                        </h2>
                        <div className="w-16 h-1 bg-orange-500 rounded-full"></div>
                        <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-medium max-w-xl">
                            Ready to experience Varanasi with absolute comfort and local guidance? Request a free customized quote from our travel experts.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-4">
                            <a href="tel:+918400554029" className="p-4 bg-stone-900 hover:bg-stone-850 rounded-2xl border border-stone-800 transition duration-200 block space-y-1">
                                <span className="text-orange-500 block">📞 Direct Call Helpline</span>
                                <span className="text-stone-300 font-mono">+91-8400554029</span>
                            </a>
                            <a href="https://wa.me/918149783494" target="_blank" rel="noreferrer" className="p-4 bg-stone-900 hover:bg-stone-850 rounded-2xl border border-stone-800 transition duration-200 block space-y-1">
                                <span className="text-emerald-400 block">💬 Chat on WhatsApp</span>
                                <span className="text-stone-300 font-mono">+91-8149783494</span>
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Reused Booking Form */}
                    <div className="lg:col-span-5 w-full">
                        <BookingForm />
                    </div>

                </div>
            </section>
        </div>
    );
}

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from './SEO';
import ImageWithSkeleton from './ImageWithSkeleton';

// Local images connection
import varanasiImg from '../assets/ExperienceVaranasi/KashiVT.png';
import ayodhyaImg from '../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaImg from '../assets/tour packege photo/BiharBuddha.png';
import chunarImg from '../assets/tour packege photo/ChunarFort.png';
import nepalImg from '../assets/tour packege photo/NepalTour.png';

const packagesData = {
    "varanasi-tour": {
        title: "Varanasi (Kashi) Spiritual Tour Package - 3 Days Itinerary",
        metaDesc: "Book Varanasi Spiritual Tour Package starting at ₹8,999/person. Includes 3-star hotel stay near ghats, airport pickups, private boat rides, and guide.",
        name: "Varanasi Spiritual Tour",
        price: "8,999",
        duration: "2 Nights / 3 Days",
        image: varanasiImg,
        overview: "Experience the ultimate spiritual purification in the oldest living city. This tour package is meticulously structured for families and senior citizens, ensuring comfortable darshan at Kashi Vishwanath temple, scenic sunrise/sunset boat rides, and a Buddhist heritage tour in Sarnath.",
        destinationsCovered: "Varanasi & Sarnath",
        inclusions: [
            "Private Sanitized AC Sedan / SUV",
            "3-Star Hotel Stay close to Ganga Ghats",
            "Daily Breakfast included",
            "Morning & Evening Private Boat Rides on the Ganges",
            "Certified Local Tour Guide",
            "Airport / Station Pickup & Drop-off",
            "VIP Darshan entrance coordination support"
        ],
        exclusions: [
            "Any airfare or railway ticket charges",
            "Personal expenses (shopping, laundry, phone calls)",
            "Camera fees at monuments",
            "Any meals not specified in the inclusions"
        ],
        faq: [
            { q: "Is the Ganga Aarti boat ride private?", a: "Yes, we arrange private wooden boat rides for a peaceful experience." },
            { q: "Is this tour suitable for senior citizens?", a: "Yes, we keep the pace relaxed and arrange wheelchair assistance or guide coordinates at major spots." }
        ]
    },
    "ayodhya-tour": {
        title: "Ayodhya Ram Mandir Darshan Tour Package - 2 Days Itinerary",
        metaDesc: "Book Ayodhya Tour Package starting at ₹6,999/person. Offers Shri Ram Mandir VIP Darshan assistance, Sarayu Aarti, private taxi, and hotel accommodation.",
        name: "Ayodhya Darshan Tour",
        price: "6,999",
        duration: "1 Night / 2 Days",
        image: ayodhyaImg,
        overview: "Immerse your family in devotion at Lord Rama's holy birthplace. This tour covers the grand Shri Ram Janmabhoomi Mandir, the historic Hanuman Garhi fort temple, Kanak Bhawan Palace, and the spectacular evening Sarayu River Aarti.",
        destinationsCovered: "Ayodhya Ji",
        inclusions: [
            "Private AC Sedan / SUV for the complete round trip",
            "Clean 3-Star Hotel accommodation close to Ram Path",
            "Daily Breakfast",
            "Sarayu Aarti coordination & VIP Darshan guidance",
            "Local Guide assistance",
            "Sightseeing at major shrines"
        ],
        exclusions: [
            "Any personal offerings/donations at temples",
            "Lunch and Dinner",
            "Tips or porter charges"
        ],
        faq: [
            { q: "What is the best way to travel to Ayodhya from Varanasi?", a: "We provide a private AC cab with a professional driver, which takes about 4 hours." }
        ]
    },
    "bodh-gaya-tour": {
        title: "Bodh Gaya Pilgrimage Tour Package - 2 Days Buddhist Circuit",
        metaDesc: "Book Bodh Gaya Tour Package starting at ₹7,999/person. Includes Mahabodhi Temple guided tours, international monasteries, private transport, and stay.",
        name: "Bodh Gaya Tour",
        price: "7,999",
        duration: "1 Night / 2 Days",
        image: bodhgayaImg,
        overview: "Trace the footprints of Lord Buddha. This tour guides you to the UNESCO World Heritage Mahabodhi Temple, the sacred Bodhi Tree where Buddha attained enlightenment, and international Buddhist monasteries.",
        destinationsCovered: "Bodh Gaya (Bihar)",
        inclusions: [
            "Private AC transport from Varanasi to Bodh Gaya and back",
            "Clean 3-Star Hotel Stay in Bodh Gaya",
            "Daily Breakfast",
            "Guided sightseeing of Mahabodhi Temple & Monasteries",
            "Visit to the 80-foot Great Buddha Statue",
            "Entry coordination and parking approvals"
        ],
        exclusions: [
            "Monument camera permit fees",
            "Any airfare/train fare",
            "Lunches and Dinners"
        ],
        faq: [
            { q: "Can we extend this tour to include Rajgir or Nalanda?", a: "Yes! Connect with our travel desk via WhatsApp to customize the route." }
        ]
    },
    "mirzapur-chunar-tour": {
        title: "Chunar Fort & Vindhyachal Temple Day Tour Package",
        metaDesc: "Book Mirzapur-Chunar Tour starting at ₹6,499/person. Sightseeing at ancient Chunar Fort, Vindhyachal Shaktipeeth, and scenic local waterfalls.",
        name: "Mirzapur - Chunar Tour",
        price: "6,499",
        duration: "1 Night / 2 Days",
        image: chunarImg,
        overview: "A delightful weekend escape blending history and devotion. Explore the mighty stone ramparts of Chunar Fort overlooking the Ganges and seek blessings at the sacred Vindhyachal Vindhyavasini Devi shaktipeeth temple.",
        destinationsCovered: "Chunar Fort & Mirzapur (Vindhyachal)",
        inclusions: [
            "Private AC Sedan/SUV for the entire circuit",
            "Family Day Room hotel accommodation coordination",
            "Breakfast & Local travel guide",
            "VIP Darshan coordination at Vindhyachal Temple",
            "Sightseeing at local waterfalls and Fort spots"
        ],
        exclusions: [
            "Any personal ritual fees at the temple",
            "Meals not listed in inclusions"
        ],
        faq: [
            { q: "Is the Vindhyachal Temple crowded?", a: "Yes, during festivals it can be crowded. We coordinate VIP Darshan passes to save time." }
        ]
    },
    "nepal-tour": {
        title: "Varanasi to Nepal Spiritual Tour Package - 3 Days Itinerary",
        metaDesc: "Book Varanasi to Nepal Tour Package starting at ₹10,999/person. Explore Lumbini, Pokhara, and Kathmandu with customized private cross-border cab permit.",
        name: "Varanasi to Nepal Tour",
        price: "10,999",
        duration: "2 Nights / 3 Days",
        image: nepalImg,
        overview: "Embark on an incredible cross-border spiritual tour connecting Kashi with the sacred birthplace of Lord Buddha in Lumbini, Nepal, extending to Pokhara and Kathmandu.",
        destinationsCovered: "Lumbini, Pokhara & Kathmandu (Nepal)",
        inclusions: [
            "Private Cross-Border Permit AC Transport",
            "Comfortable Hotel Stays in Kathmandu & Pokhara",
            "Complimentary Breakfasts",
            "Sightseeing in Lumbini, Pokhara, and Kathmandu Valley",
            "Border customs permit fees and document assistance",
            "Hotel pickups and drops"
        ],
        exclusions: [
            "Any international flight / visa charges (if non-Indian)",
            "Sightseeing entry ticket fees at monuments",
            "Lunches and Dinners"
        ],
        faq: [
            { q: "What documents are required at the Sonauli border?", a: "Indian citizens need a valid Passport or original Voter ID card to cross the border." }
        ]
    }
};

export default function PackageTemplate() {
    const { id } = useParams();
    const pkg = packagesData[id];

    // Fallback coming soon layout for new packages
    if (!pkg) {
        const fallbackName = id ? id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ') : 'Package';
        
        const fallbackSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://banarasyatra.com/" },
                { "@type": "ListItem", "position": 2, "name": "Packages", "item": "https://banarasyatra.com/#packages" },
                { "@type": "ListItem", "position": 3, "name": fallbackName, "item": `https://banarasyatra.com/packages/${id}` }
            ]
        };

        return (
            <div className="bg-stone-50 min-h-screen text-stone-800">
                <SEO 
                    title={`${fallbackName} Package - Banaras Yatra`}
                    description={`Detailed tour itinerary, travel pricing, and inclusions for ${fallbackName} coming soon.`}
                    canonicalUrl={`https://banarasyatra.com/packages/${id}`}
                    schema={fallbackSchema}
                />
                
                {/* Breadcrumbs */}
                <div className="bg-white border-b border-stone-200 py-3.5 select-none">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-stone-500 font-medium flex items-center space-x-2">
                        <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                        <span>/</span>
                        <a href="/#packages" className="hover:text-orange-600 transition-colors">Tour Packages</a>
                        <span>/</span>
                        <span className="text-stone-900 font-bold">{fallbackName}</span>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto py-24 px-4 sm:px-6 text-center space-y-6">
                    <span className="text-4xl block">🧳</span>
                    <h1 className="text-3xl font-serif font-bold text-stone-900">{fallbackName} Package</h1>
                    <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    <p className="text-sm text-stone-500 leading-relaxed font-medium max-w-md mx-auto">
                        Itinerary plans, pricing, and hotel booking inclusions for **{fallbackName}** are coming soon.
                    </p>
                    <div className="pt-6">
                        <Link to="/" className="inline-block bg-stone-900 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md">
                            Back To Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic Schema Structured Data
    const schemaOrg = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://banarasyatra.com/" },
                    { "@type": "ListItem", "position": 2, "name": "Packages", "item": "https://banarasyatra.com/#packages" },
                    { "@type": "ListItem", "position": 3, "name": pkg.name, "item": `https://banarasyatra.com/packages/${id}` }
                ]
            },
            {
                "@type": "TouristTrip",
                "name": pkg.name,
                "description": pkg.overview,
                "touristType": "Pilgrims, Senior Citizens, Families",
                "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": pkg.price.replace(',', ''),
                    "priceSpecification": {
                        "@type": "UnitPriceSpecification",
                        "priceCurrency": "INR",
                        "price": pkg.price.replace(',', ''),
                        "referenceQuantity": {
                            "@type": "QuantitativeValue",
                            "value": 1,
                            "unitCode": "C62"
                        }
                    },
                    "provider": {
                        "@type": "Organization",
                        "name": "Banaras Yatra",
                        "url": "https://banarasyatra.com"
                    }
                }
            }
        ]
    };

    return (
        <div className="bg-stone-50 min-h-screen text-stone-800 text-left">
            <SEO 
                title={pkg.title}
                description={pkg.metaDesc}
                canonicalUrl={`https://banarasyatra.com/packages/${id}`}
                ogImage={pkg.image}
                schema={schemaOrg}
            />

            {/* Breadcrumbs */}
            <div className="bg-white border-b border-stone-200 py-3.5 select-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-xs text-stone-500 font-medium flex items-center space-x-2">
                    <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
                    <span>/</span>
                    <a href="/#packages" className="hover:text-orange-600 transition-colors">Tour Packages</a>
                    <span>/</span>
                    <span className="text-stone-900 font-bold">{pkg.name}</span>
                </div>
            </div>

            {/* Hero Header */}
            <section className="relative bg-stone-950 text-white py-16 sm:py-24 overflow-hidden select-none">
                <div className="absolute inset-0 opacity-40">
                    <ImageWithSkeleton src={pkg.image} alt={pkg.name} containerClassName="h-full w-full" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/65 to-transparent"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-stone-900 px-3 py-1.5 rounded-md border border-stone-800 inline-block">{pkg.duration}</span>
                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-wide">{pkg.name}</h1>
                    <div className="w-12 h-1 bg-orange-500 mx-auto rounded-full"></div>
                    <p className="text-xs sm:text-sm text-stone-300 uppercase tracking-widest font-semibold">Covering {pkg.destinationsCovered}</p>
                </div>
            </section>

            {/* Content Body */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Details */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* Overview */}
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                Package Overview
                            </h2>
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                                {pkg.overview}
                            </p>
                        </div>

                        {/* Inclusions */}
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                What is Included
                            </h2>
                            <ul className="space-y-3 text-xs sm:text-sm text-stone-600 font-medium">
                                {pkg.inclusions.map((inc, i) => (
                                    <li key={i} className="flex items-start space-x-2.5">
                                        <span className="text-emerald-500 font-bold">✓</span>
                                        <span>{inc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Exclusions */}
                        <div className="space-y-4">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                What is Excluded
                            </h2>
                            <ul className="space-y-3 text-xs sm:text-sm text-stone-600 font-medium">
                                {pkg.exclusions.map((exc, i) => (
                                    <li key={i} className="flex items-start space-x-2.5">
                                        <span className="text-red-500 font-bold">✕</span>
                                        <span>{exc}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Travel Support */}
                        <div className="space-y-4 pt-4 border-t border-stone-200">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                Local Travel Support
                            </h2>
                            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                                Every booking includes a dedicated local Varanasi coordinator standby. They coordinate directly with your driver, handle room keys at hotels, and assist senior citizens with VIP entry clearances at temples.
                            </p>
                        </div>

                        {/* FAQs */}
                        {pkg.faq && pkg.faq.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-stone-200">
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 border-l-4 border-orange-500 pl-3">
                                    Package FAQs
                                </h2>
                                <div className="space-y-3">
                                    {pkg.faq.map((qna, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl border border-stone-200/80">
                                            <h4 className="text-xs sm:text-sm font-bold text-stone-900">{qna.q}</h4>
                                            <p className="text-xs sm:text-sm text-stone-600 mt-2 font-medium leading-relaxed">{qna.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Pricing & Booking */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Price Card */}
                        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 text-center">
                            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider block">Package Base Fare</span>
                            <div className="space-y-1">
                                <span className="text-3xl font-black text-stone-900">₹{pkg.price}</span>
                                <span className="text-stone-400 text-xs block font-medium">starting per person</span>
                            </div>
                            <div className="pt-2 border-t border-stone-100 text-stone-500 text-[10px] uppercase font-bold tracking-widest leading-relaxed">
                                🛡️ No Hidden Commissions <br />
                                💬 Includes WhatsApp Coordinators
                            </div>
                        </div>

                        {/* Booking Form Connect */}
                        <div className="bg-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 rounded-full blur-xl pointer-events-none"></div>
                            <div>
                                <span className="text-[9px] uppercase tracking-widest text-orange-400 font-bold block mb-1">Secure Booking</span>
                                <h3 className="text-xl font-serif font-bold text-white leading-tight">Request Free Custom Quote</h3>
                                <p className="text-[11px] text-stone-400 leading-relaxed mt-2 font-medium">
                                    Fill our fast enquiry form to get custom travel quotes directly on your WhatsApp in 15 minutes.
                                </p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <a 
                                    href="/#booking-form"
                                    className="block text-center text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl transition duration-200"
                                >
                                    Get Quote Now ➔
                                </a>
                                <a 
                                    href="https://wa.me/918149783494"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block text-center text-xs font-bold uppercase tracking-wider bg-stone-900 border border-stone-800 text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-500 py-3.5 rounded-xl transition duration-200"
                                >
                                    💬 Chat on WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}

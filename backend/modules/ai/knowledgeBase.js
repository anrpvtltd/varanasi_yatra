/**
 * Controlled Business Knowledge Base for Customer Assistant
 * Varanasi Yatra Platform — Prompt 6
 * 
 * STRICT RULE: Only verified factual business information.
 * NO fabricated rates, NO fake live availability, NO internal margin disclosures.
 */

const KNOWLEDGE_BASE = {
    destination: {
        name: 'Varanasi (Kashi / Banaras)',
        description: 'The spiritual capital of India on the banks of River Ganga, known for ancient temples, sacred ghats, vibrant evening aartis, and centuries of cultural heritage.',
        bestTimeToVisit: 'October to March (pleasant weather for boat rides and temple visits). Summer visits are also common for early morning darshan.',
        recommendedDuration: '3 Days / 2 Nights is ideal for Kashi Vishwanath Darshan, Ganga Aarti, Ghat Boat Ride, Sarnath, and local heritage exploration.'
    },

    experiences: [
        {
            id: 'ganga-aarti',
            name: 'Ganga Aarti at Dashashwamedh / Assi Ghat',
            description: 'Mesmerizing evening prayer ceremony performed with brass lamps, chants, and conch shells by sacred priests along the riverbanks.',
            timing: 'Every evening at sunset (~6:30 PM in summer, ~5:45 PM in winter).',
            viewingOptions: 'Ghat steps or private/shared boat view on the river.',
            serviceType: 'EXPERIENCE'
        },
        {
            id: 'sunrise-boat',
            name: 'Subah-e-Banaras Sunrise Boat Ride',
            description: 'Early morning boat cruise across historical ghats (Assi to Manikarnika) as sunrise lights the ancient riverside palaces and pilgrims offer prayers.',
            timing: '5:30 AM to 7:00 AM (varies with season).',
            serviceType: 'BOAT'
        },
        {
            id: 'sarnath-tour',
            name: 'Sarnath Excursion',
            description: 'Sacred Buddhist site ~10 km from Varanasi where Lord Buddha gave his first sermon. Features Dhamek Stupa, Ashoka Pillar, and Archaeological Museum.',
            duration: 'Half-day (3 to 4 hours).',
            serviceType: 'TRANSPORT'
        },
        {
            id: 'heritage-walk',
            name: 'Old City & Ghats Heritage Walk',
            description: 'Guided walk through the ancient winding alleys (galis), historic havelis, street food stalls (kachori jalebi, Banarasi paan, malaiyo in winter).',
            serviceType: 'GUIDE'
        }
    ],

    darshan: [
        {
            id: 'kashi-vishwanath',
            name: 'Shri Kashi Vishwanath Temple (Jyotirlinga)',
            deity: 'Lord Shiva',
            corridor: 'Kashi Vishwanath Dham Corridor connects directly to Lalita Ghat on River Ganga.',
            dressCode: 'Traditional attire recommended. Dhoti-kurta for men and saree for women mandatory for Sparsh Darshan / Sugam Darshan sanctum access.',
            guidance: 'Early morning (Mangla Aarti 3 AM - 4 AM) or midday. Special assistance / Sugam Darshan depends on official temple trust availability and team assistance.'
        },
        {
            id: 'kaal-bhairav',
            name: 'Kaal Bhairav Temple',
            description: 'Known as the Kotwal (protector/governor) of Varanasi. Tradition suggests visiting Kaal Bhairav upon arriving in Kashi.',
            location: 'Visheshwarganj'
        },
        {
            id: 'sankat-mochan',
            name: 'Sankat Mochan Hanuman Temple',
            description: 'Founded by Goswami Tulsidas. Peaceful temple atmosphere with monkeys and evening prasad (Besan Laddoos).',
            location: 'Assi - Durgakund Road'
        },
        {
            id: 'annapurna',
            name: 'Maa Annapurna Temple',
            description: 'Adjacent to Kashi Vishwanath temple; dedicated to the goddess of food and nourishment.'
        },
        {
            id: 'durga-kund',
            name: 'Durga Kund Temple & Tulsi Manas Mandir',
            description: 'Historic red-stone temple and the white-marble temple where Ramcharitmanas was composed.'
        }
    ],

    services: {
        hotel: {
            categories: [
                'Budget Clean Guest Houses & Homestays (₹1,500 - ₹2,500 range indicative)',
                'Standard 3-Star Hotels (clean AC rooms, elevator, in-house dining)',
                'Deluxe 4-Star Accommodations (modern amenities, premium location)',
                'Heritage Havelis on River Ghats & 5-Star Luxury (Palaces, Nadesar / Taj properties)'
            ],
            policy: 'We coordinate clean, vetted, verified accommodations based on guest preferences (family, couple, senior citizens, river view). Live room confirmation is made directly by the Kashi-Vashi operations team.'
        },
        boat: {
            types: [
                'Traditional Hand-Rowed Wooden Boat (peaceful, eco-friendly, intimate)',
                'Private Motorboat (faster, ideal for covering all 84 ghats)',
                'Heritage Bajra / Luxury Cruiser (rooftop seating, suited for larger families and groups for Evening Aarti)'
            ],
            policy: 'Life jackets provided for safety. Boats depart from designated authorized ghats (Assi, Dashashwamedh, Rajghat).'
        },
        transport: {
            fleet: [
                'Sedan (Dzire / Etios) for 2 to 4 guests',
                'SUV (Innova / Crysta / Ertiga) for 5 to 7 guests with luggage',
                'Tempo Traveller (12 / 17 / 26 seater) for large family groups'
            ],
            transfers: 'Airport pickup/drop (Lal Bahadur Shastri International Airport, Babatpur ~26 km), Cantt / Banaras / DDU railway stations, local sightseeing, Ayodhya & Prayagraj excursions.'
        },
        pandit: {
            services: [
                'Rudrabhishek Puja at Sacred Ghats / Kashi Temple Corridor',
                'Mangla Aarti assistance and facilitation',
                'Pind Daan / Shradh / Tarpan rituals at Manikarnika / Dashashwamedh',
                'Navgrah Shanti, Ganga Pujan, and customized Vedic rituals by learned Kashi Purohits'
            ]
        },
        guide: {
            languages: ['Hindi', 'English', 'Bengali', 'Tamil', 'Telugu', 'Gujarati', 'Marathi'],
            expertise: 'Government-certified and local scholars detailing temple history, architecture, and spiritual significance.'
        }
    },

    commonItineraries: [
        {
            name: '2 Days / 1 Night Express Spiritual Tour',
            highlights: 'Arrival transfer, Evening Ganga Aarti boat ride, Early morning Kashi Vishwanath Darshan, Kaal Bhairav, Sankat Mochan, departure.'
        },
        {
            name: '3 Days / 2 Nights Classic Kashi Experience',
            highlights: 'Ganga Aarti, Subah-e-Banaras boat ride, Kashi Vishwanath Corridor, Sarnath excursion, Old City food & handloom walk, Kaal Bhairav, Sankat Mochan.'
        },
        {
            name: '4 Days / 3 Nights Kashi + Prayagraj / Ayodhya Excursion',
            highlights: 'Full Varanasi pilgrimage plus day trip to Triveni Sangam Prayagraj or Ayodhya Ram Janmabhoomi.'
        }
    ],

    pricingPolicy: {
        statement: 'Package pricing depends on customized dates, group size, hotel category, and included services. We provide transparent quotes via our team without hidden fees.'
    }
};

/**
 * Find relevant knowledge snippets for customer queries
 */
function findRelevantKnowledge(queryText = '') {
    const q = String(queryText).toLowerCase();
    const snippets = [];

    if (q.includes('darshan') || q.includes('mandir') || q.includes('temple') || q.includes('vishwanath') || q.includes('aarti')) {
        snippets.push('Kashi Vishwanath Temple, Ganga Aarti, and local temple visits are arranged with priority coordination.');
    }
    if (q.includes('boat') || q.includes('ganga') || q.includes('ghat') || q.includes('nao') || q.includes('bajra')) {
        snippets.push('We offer morning sunrise boat rides and evening Ganga Aarti boats (traditional wooden boats, motorboats, and bajras).');
    }
    if (q.includes('hotel') || q.includes('room') || q.includes('stay') || q.includes('dharamsala') || q.includes('resort')) {
        snippets.push('We arrange verified hotels ranging from budget homestays to 3-star, 4-star deluxe, and riverfront heritage properties.');
    }
    if (q.includes('car') || q.includes('taxi') || q.includes('pickup') || q.includes('airport') || q.includes('transport') || q.includes('gaadi')) {
        snippets.push('Airport and railway station pickups/drops and AC sightseeing cabs (Sedan, Innova, Tempo Traveller) are available.');
    }
    if (q.includes('pandit') || q.includes('pooja') || q.includes('puja') || q.includes('rudrabhishek') || q.includes('pind daan')) {
        snippets.push('Learned Kashi Purohits are available for Rudrabhishek, Pind Daan, and personalized Vedic rituals.');
    }
    if (q.includes('sarnath') || q.includes('ayodhya') || q.includes('prayagraj') || q.includes('sangam')) {
        snippets.push('Day excursions to Sarnath, Ayodhya, and Prayagraj Triveni Sangam can be bundled into your itinerary.');
    }

    return snippets;
}

module.exports = {
    KNOWLEDGE_BASE,
    findRelevantKnowledge
};

import varanasiPkg from '../../assets/ExperienceVaranasi/KashiVT.png';
import ayodhyaPkg from '../../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaPkg from '../../assets/tour packege photo/BiharBuddha.png';
import chunarPkg from '../../assets/tour packege photo/ChunarFort.png';
import nepalPkg from '../../assets/tour packege photo/NepalTour.png';
import sarnathImg from '../../assets/ExperienceVaranasi/sarnathStupa.png';

export const TOURS = [
    {
        slug: '1-day-varanasi',
        title: '1-Day Complete Kashi Sightseeing Tour',
        shortDesc: 'A time-optimized single-day spiritual journey covering sunrise Ganges boat ride, Kashi Vishwanath darshan, Sarnath heritage, and evening Ganga Aarti.',
        duration: '1 Day (Dawn to Night)',
        price: '3,499',
        priceNote: 'Starting price per person (group size 4+)',
        image: varanasiPkg,
        alt: '1 Day complete Kashi Varanasi tour itinerary',
        isBestSeller: true,
        destinationsCovered: 'Varanasi Ghats, Kashi Vishwanath, Sarnath, Dashashwamedh',
        overview: 'Designed specifically for pilgrims with limited time or weekend transit. This dawn-to-night itinerary ensures you experience every spiritual landmark of Varanasi comfortably with dedicated private transport, local temple coordinator, and boat ride.',
        itinerary: [
            { time: '05:30 AM', title: 'Sunrise Boat Ride at Assi Ghat', desc: 'Board your private wooden boat to witness Subah-e-Banaras and sunrise over the Ganges.' },
            { time: '08:00 AM', title: 'Traditional Banarasi Breakfast', desc: 'Savor piping hot Bedmi Kachori, spicy aloo sabzi, and fresh jalebi.' },
            { time: '09:30 AM', title: 'Shri Kashi Vishwanath Temple Corridor', desc: 'Darshan at the Jyotirlinga sanctum, Annapurna Mandir, and Vishalakshi Temple.' },
            { time: '01:30 PM', title: 'Pure Veg Lunch & Rest', desc: 'Enjoy authentic thali lunch at a verified clean restaurant.' },
            { time: '03:00 PM', title: 'Sarnath Buddhist Heritage Tour', desc: 'Explore Dhamek Stupa, Ashoka Pillar ruins, and Sarnath Archaeological Museum.' },
            { time: '06:00 PM', title: 'Maha Ganga Aarti from Reserved Boat', desc: 'Conclude your day viewing the magnificent Ganga Aarti at Dashashwamedh Ghat.' }
        ],
        inclusions: [
            'Private Sanitized AC Sedan / SUV for the full day',
            'Morning private boat ride on the Ganges',
            'Dedicated local tour coordinator and temple queue assistance',
            'Evening boat viewing coordinates for Maha Ganga Aarti',
            'Bottled water & hotel pickup/drop-off'
        ],
        exclusions: [
            'Temple VIP darshan passes (optional add-on at cost)',
            'Museum entrance ticket (₹25)',
            'Meals and personal shopping'
        ],
        idealFor: 'Transit travelers, weekend visitors, business travelers with 1 day in Kashi',
        faq: [
            { q: 'Can we get picked up directly from the airport for this tour?', a: 'Yes, our driver can receive you at Lal Bahadur Shastri Airport and start your sightseeing immediately.' },
            { q: 'Is this tour too hectic for elderly family members?', a: 'We pace the day with comfortable air-conditioned transit between stops and take ample sitting breaks.' }
        ]
    },
    {
        slug: 'varanasi-tour',
        title: 'Varanasi Spiritual Immersion (3 Days / 2 Nights)',
        shortDesc: 'Our signature peaceful journey covering Subah-e-Banaras, Kashi Vishwanath corridor, Kaal Bhairav, Sarnath, and private evening boat cruises.',
        duration: '2 Nights / 3 Days',
        price: '8,999',
        priceNote: 'Per person including 3-star hotel stay',
        image: varanasiPkg,
        alt: 'Varanasi spiritual tour kashi vishwanath darshan',
        isBestSeller: true,
        destinationsCovered: 'Varanasi, Sarnath, Ramnagar',
        overview: 'The definitive Varanasi pilgrimage. Structured meticulously for families and senior citizens, ensuring relaxed darshan at Kashi Vishwanath, private boat cruises, handpicked vegetarian hotels near the ghats, and cultural immersion without haste.',
        itinerary: [
            { day: 'Day 1', title: 'Arrival, Evening Boat Cruise & Ganga Aarti', desc: 'Airport/Station pickup in private AC cab. Hotel check-in. Evening private boat cruise to Dashashwamedh Ghat for the majestic Maha Ganga Aarti.' },
            { day: 'Day 2', title: 'Dawn Ghats, Kashi Vishwanath & Sarnath', desc: 'Sunrise boat ride from Assi to Manikarnika. Morning darshan at Kashi Vishwanath Jyotirlinga, Annapurna, and Kaal Bhairav. Afternoon excursion to ancient Sarnath.' },
            { day: 'Day 3', title: 'Ancient Temples, Handloom Weavers & Departure', desc: 'Visits to Sankat Mochan, Durga Kund, and BHU New Vishwanath Temple. Authentic Banarasi handloom weaving exploration. Airport transfer.' }
        ],
        inclusions: [
            '2 Nights in vetted 3-Star hotel close to the river ghats',
            'Daily complimentary hot breakfast',
            'Dedicated private AC Sedan / SUV with professional local driver',
            'Private wooden boat ride for Sunrise & Evening Ganga Aarti',
            'Certified local tour guide for Sarnath & Temple history',
            'All parking, tolls, fuel, and driver allowances'
        ],
        exclusions: [
            'Airfare or railway tickets',
            'Lunches and dinners',
            'Personal temple offerings or pooja donations'
        ],
        idealFor: 'Families, senior citizens, couples seeking relaxed spiritual immersion',
        faq: [
            { q: 'Are the hotel rooms wheelchair accessible?', a: 'Yes, we select properties with elevator access and ground-floor availability upon request.' },
            { q: 'Is it possible to customize the itinerary?', a: 'Yes! All tour plans can be adapted to your travel dates and group preferences.' }
        ]
    },
    {
        slug: '2-day-varanasi-sarnath',
        title: 'Varanasi & Sarnath Heritage Tour (2 Days / 1 Night)',
        shortDesc: 'A balanced 2-day circuit combining Varanasi temple darshans and river rituals with the peaceful Buddhist stupas of Sarnath.',
        duration: '1 Night / 2 Days',
        price: '5,999',
        priceNote: 'Per person with hotel accommodation',
        image: sarnathImg,
        alt: 'Varanasi Sarnath 2 day tour package',
        isBestSeller: false,
        destinationsCovered: 'Varanasi & Sarnath',
        overview: 'Perfect for travelers with 48 hours in Varanasi. Experience both the Hindu spiritual devotion of the ghats and the peaceful heritage of Sarnath with smooth private logistics and dedicated coordination.',
        itinerary: [
            { day: 'Day 1', title: 'Arrival, Kashi Vishwanath & Ganga Aarti', desc: 'Arrival pickup, check-in, Kashi Vishwanath darshan, and private boat viewing of evening Ganga Aarti at Dashashwamedh.' },
            { day: 'Day 2', title: 'Subah-e-Banaras & Sarnath Exploration', desc: 'Sunrise boat cruise at Assi Ghat. Check-out and scenic drive to Sarnath for Dhamek Stupa and museum. Afternoon airport drop.' }
        ],
        inclusions: [
            '1 Night clean 3-star hotel stay with breakfast',
            'Private AC transport for both days',
            'Sunrise and sunset boat rides',
            'Airport / railway station transfers',
            'Local guide support'
        ],
        exclusions: ['Monument camera fees', 'Personal meals'],
        idealFor: 'Short weekend getaways, couples, pilgrims in transit',
        faq: [
            { q: 'Can this tour be arranged on weekdays?', a: 'Yes, available every day of the week (note Sarnath museum is closed Fridays).' }
        ]
    },
    {
        slug: 'ayodhya-tour',
        title: 'Ayodhya Shri Ram Mandir Darshan Tour',
        shortDesc: 'A holy day or overnight pilgrimage to Shri Ram Janmabhoomi, Hanuman Garhi, Kanak Bhawan, and the evening Sarayu River Aarti.',
        duration: '1 Night / 2 Days',
        price: '6,999',
        priceNote: 'Per person from Varanasi roundtrip',
        image: ayodhyaPkg,
        alt: 'Ayodhya Ram Mandir package tour from Varanasi',
        isBestSeller: true,
        destinationsCovered: 'Ayodhya Ji (via Purvanchal Expressway)',
        overview: 'A comfortable, air-conditioned road journey from Varanasi to Lord Rama\'s sacred birthplace in Ayodhya. Covers the newly consecrated Shri Ram Janmabhoomi Mandir, Hanuman Garhi fort temple, Kanak Bhawan, and twilight Sarayu Sandhya Aarti.',
        itinerary: [
            { day: 'Day 1', title: 'Varanasi to Ayodhya, Hanuman Garhi & Sarayu Aarti', desc: 'Morning drive to Ayodhya (approx 4 hrs). Hotel check-in. Afternoon darshan at Hanuman Garhi and Kanak Bhawan. Evening Sarayu River Aarti at Naya Ghat.' },
            { day: 'Day 2', title: 'Shri Ram Janmabhoomi Darshan & Return', desc: 'Morning darshan at the grand Shri Ram Janmabhoomi Mandir. Visit to Dashrath Mahal and Ram ki Paidi. Return drive to Varanasi.' }
        ],
        inclusions: [
            'Round-trip private AC transport from Varanasi to Ayodhya',
            '1 Night hotel stay near Ram Path in Ayodhya with breakfast',
            'Darshan guidance and local coordinator assistance',
            'All highway tolls, parking, and driver allowances'
        ],
        exclusions: ['VIP entry fees (if applicable)', 'Lunch and dinner'],
        idealFor: 'Devotees wishing to combine Varanasi and Ayodhya in one pilgrimage',
        faq: [
            { q: 'How long is the drive from Varanasi to Ayodhya?', a: 'The journey takes approximately 3.5 to 4 hours via National Highway.' }
        ]
    },
    {
        slug: 'bodh-gaya-tour',
        title: 'Bodh Gaya Buddhist Circuit Pilgrimage',
        shortDesc: 'Trace the footprints of Lord Buddha to the UNESCO World Heritage Mahabodhi Temple, the sacred Bodhi Tree, and international monasteries.',
        duration: '1 Night / 2 Days',
        price: '7,999',
        priceNote: 'Per person from Varanasi roundtrip',
        image: bodhgayaPkg,
        alt: 'Bodh Gaya Mahabodhi temple tour from Varanasi',
        isBestSeller: false,
        destinationsCovered: 'Bodh Gaya & Gaya (Bihar)',
        overview: 'An enlightening 2-day pilgrimage from Varanasi to Bodh Gaya, where Prince Siddhartha attained supreme enlightenment. Visit the Mahabodhi Temple, the ancient Bodhi Tree, the 80-foot Great Buddha Statue, and unique Thai, Bhutanese, and Japanese monasteries.',
        itinerary: [
            { day: 'Day 1', title: 'Varanasi to Bodh Gaya & Monasteries', desc: 'Morning drive from Varanasi to Bodh Gaya (approx 5.5 hrs). Check-in and afternoon visits to international Buddhist monasteries.' },
            { day: 'Day 2', title: 'Mahabodhi Temple, Bodhi Tree & Return', desc: 'Peaceful morning meditation at Mahabodhi Temple and the sacred Bodhi Tree. Visit the Great Buddha statue before returning to Varanasi.' }
        ],
        inclusions: [
            'Round-trip private AC cab from Varanasi',
            '1 Night 3-star hotel stay in Bodh Gaya with breakfast',
            'Sightseeing coordinates and parking clearances',
            'Interstate road tax and driver allowances'
        ],
        exclusions: ['Camera/video permits at Mahabodhi Temple', 'Personal expenses'],
        idealFor: 'Buddhist pilgrims, meditation practitioners, history researchers',
        faq: [
            { q: 'Can we perform Pind Daan at Gaya during this trip?', a: 'Yes, we can arrange an early morning stop at Vishnupad Temple in Gaya for Pind Daan rituals.' }
        ]
    },
    {
        slug: 'mirzapur-chunar-tour',
        title: 'Chunar Fort & Vindhyachal Devi Heritage Tour',
        shortDesc: 'Discover the ancient riverside ramparts of Chunar Fort on the Ganges, seek blessings at Vindhyachal Shaktipeeth, and visit scenic waterfalls.',
        duration: '1 Day Excursion',
        price: '4,499',
        priceNote: 'Starting price per vehicle (up to 4 persons)',
        image: chunarPkg,
        alt: 'Chunar Fort Vindhyachal Temple day trip from Varanasi',
        isBestSeller: false,
        destinationsCovered: 'Chunar & Vindhyachal (Mirzapur)',
        overview: 'A captivating day excursion just 45 km from Varanasi. Explore the historic Chunar Fort overlooking the Ganges with its centuries of Mughal and British history, followed by darshan at Maa Vindhyavasini Devi Temple (one of the 51 sacred Shaktipeeths).',
        itinerary: [
            { time: '08:00 AM', title: 'Departure from Varanasi', desc: 'Pick up from your hotel in private AC vehicle.' },
            { time: '09:30 AM', title: 'Chunar Fort Heritage Exploration', desc: 'Guided walk through the ancient stone ramparts, Sonwa Mandap, and panoramic Ganges view tower.' },
            { time: '01:00 PM', title: 'Traditional Lunch at Mirzapur', desc: 'Relaxing lunch break with regional flavors.' },
            { time: '02:30 PM', title: 'Vindhyachal Dham Temple Darshan', desc: 'Prayers at Maa Vindhyavasini Temple, Kali Khoh, and Ashtabhuja Temple.' },
            { time: '06:30 PM', title: 'Return to Varanasi', desc: 'Comfortable evening return drive to your Varanasi hotel.' }
        ],
        inclusions: [
            'Full day private AC car with fuel and driver',
            'Hotel pickup and drop-off',
            'Tolls and parking'
        ],
        exclusions: ['Monument entry fees', 'Meals'],
        idealFor: 'Heritage buffs, families, travelers seeking offbeat day trips',
        faq: [
            { q: 'Is walking inside Chunar Fort easy for senior citizens?', a: 'Most paths are wide and gentle, though some viewing towers have steps.' }
        ]
    },
    {
        slug: 'nepal-tour',
        title: 'Varanasi to Nepal Cross-Border Circuit',
        shortDesc: 'A seamless international road circuit from Varanasi to Lord Buddha\'s birthplace in Lumbini, Pokhara lakes, and Kathmandu temples.',
        duration: '4 Nights / 5 Days',
        price: '18,999',
        priceNote: 'Per person with hotel accommodation',
        image: nepalPkg,
        alt: 'Varanasi to Nepal Lumbini Pokhara Kathmandu tour',
        isBestSeller: false,
        destinationsCovered: 'Lumbini, Pokhara, Kathmandu (Nepal)',
        overview: 'An extensive spiritual circuit connecting holy Kashi with the Himalayan realm of Nepal. Experience Maya Devi Temple in Lumbini, serene Phewa Lake in Pokhara, and the sacred Pashupatinath Temple in Kathmandu with verified cross-border permits.',
        itinerary: [
            { day: 'Day 1', title: 'Varanasi to Lumbini', desc: 'Drive to Indo-Nepal border at Sonauli. Customs clearance and transfer to Lumbini.' },
            { day: 'Day 2', title: 'Lumbini to Pokhara', desc: 'Visit Sacred Garden and Maya Devi temple. Scenic drive through Himalayan foothills to Pokhara.' },
            { day: 'Day 3', title: 'Pokhara Sightseeing', desc: 'Sunrise at Sarangkot, boat ride on Phewa Lake, Devi\'s Fall, and Gupteshwor Cave.' },
            { day: 'Day 4', title: 'Pokhara to Kathmandu', desc: 'Scenic mountain drive to Kathmandu valley. Evening stroll in Thamel.' },
            { day: 'Day 5', title: 'Pashupatinath Darshan & Departure', desc: 'Morning darshan at sacred Pashupatinath Temple and Boudhanath Stupa before departure.' }
        ],
        inclusions: [
            'All transport with valid cross-border permit',
            '4 Nights hotel stays with daily breakfast',
            'Customs and border crossing coordination'
        ],
        exclusions: ['Nepal visa fees (free for Indian nationals with valid Aadhaar/Passport)', 'Meals'],
        idealFor: 'Extended vacationers, international pilgrims',
        faq: [
            { q: 'Do Indian citizens require a passport for this tour?', a: 'Indian citizens can travel with a valid original Voter ID or Passport.' }
        ]
    }
];

export const getTourBySlug = (slug) => {
    return TOURS.find(t => t.slug === slug) || null;
};

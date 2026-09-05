import aartiImg from '../../assets/ExperienceVaranasi/GangaAarti.png';
import assiImg from '../../assets/ExperienceVaranasi/AssiMorning.png';
import kashiImg from '../../assets/ExperienceVaranasi/KashiVT.png';
import sarnathImg from '../../assets/ExperienceVaranasi/sarnathStupa.png';

export const EXPERIENCES = [
    {
        slug: 'ganga-aarti',
        title: 'Maha Ganga Aarti at Dashashwamedh',
        shortDesc: 'Witness the iconic evening ritual where Vedic chants, brass lamps, and river devotion illuminate the ancient steps of Dashashwamedh Ghat.',
        tag: 'Evening Spiritual Ritual',
        duration: '2 Hours (5:30 PM - 7:30 PM)',
        timing: 'Winter: 6:00 PM | Summer: 7:00 PM',
        image: aartiImg,
        alt: 'Maha Ganga Aarti Dashashwamedh Ghat Varanasi',
        heroHighlight: 'The world-famous rhythmic brass lamp ceremony on the banks of the sacred Ganges.',
        overview: 'Every evening at twilight, seven young priests clad in saffron perform the Maha Ganga Aarti at Dashashwamedh Ghat. The rhythmic ringing of bells, incense smoke drifting over the water, and hundreds of floating diya lamps make this the spiritual climax of any Varanasi journey.',
        whatToExpect: [
            'Rhythmic synchronization of heavy brass multi-tiered lamps by trained priests.',
            'Conch shell blowing (Shankhnaad), Vedic mantras, and devotional chants in unison.',
            'Option to view from a private wooden boat anchored on the river or reserved ghat seating.',
            'Float your own marigold diya boat (deepdan) with prayers onto the sacred current.'
        ],
        practicalTips: [
            'Arrive by 5:00 PM in winter or 5:45 PM in summer to secure optimal boat anchoring or front steps.',
            'Boats fill up quickly; booking a private wooden boat in advance ensures unobstructed sightlines.',
            'Dress respectfully with shoulders and knees covered.'
        ],
        idealFor: 'Families, photographers, solo pilgrims, spiritual seekers',
        highlights: ['Iconic Brass Lamps', 'Sacred Shankh Chants', 'Floating Diya Offerings', 'Boat-Side Viewing']
    },
    {
        slug: 'varanasi-boat-ride',
        title: 'Sacred Sunrise & Sunset Ganges Boat Cruise',
        shortDesc: 'Glide along 84 historic ghats as morning rays touch ancient palaces, bathers perform dawn ablutions, and temple bells echo across the water.',
        tag: 'Dawn & Dusk River Cruise',
        duration: '1.5 - 2 Hours',
        timing: 'Sunrise: 5:30 AM - 7:30 AM | Sunset: 5:00 PM - 7:00 PM',
        image: assiImg,
        alt: 'Sunrise boat ride Assi Ghat to Manikarnika Varanasi',
        heroHighlight: 'Experience Subah-e-Banaras from Assi Ghat to Manikarnika Ghat on a private wooden boat.',
        overview: 'A sunrise boat cruise is the soul of Banaras. Boarding at dawn from Assi Ghat, you drift past historic Maratha and Rajput havelis, witnessing morning prayers, yoga practitioners, yogis in meditation, and the eternal cycle of life at Harishchandra and Manikarnika Ghats.',
        whatToExpect: [
            'Private wooden rowing or motor boat dedicated solely to your family.',
            'Panoramic views of 84 ghats bathed in golden morning light.',
            'Insightful commentary from our vetted local boatman on the legends of each historic ghat.',
            'Quiet contemplation as migratory Siberian birds (in winter) circle around the boat.'
        ],
        practicalTips: [
            'Morning cruises depart early (5:30 AM in summer, 6:00 AM in winter); dress in warm layers during winter months.',
            'Always wear the life jackets provided on board.',
            'Photography is prohibited facing directly into the cremation steps at Manikarnika out of respect.'
        ],
        idealFor: 'Senior citizens, photography enthusiasts, family groups',
        highlights: ['Subah-e-Banaras Rituals', '84 Ghat Panorama', 'Manikarnika Sacred History', 'Private Sanitized Boat']
    },
    {
        slug: 'temple-darshan',
        title: 'Kashi Vishwanath & Ancient Temple Darshan',
        shortDesc: 'Offer your prayers at Shri Kashi Vishwanath Jyotirlinga, Annapurna Mandir, Kaal Bhairav, and Sankat Mochan with dedicated local guidance.',
        tag: 'Sacred Temple Circuit',
        duration: '4 - 5 Hours',
        timing: 'Morning: 6:00 AM - 11:00 AM | Evening: 4:00 PM - 8:00 PM',
        image: kashiImg,
        alt: 'Shri Kashi Vishwanath Temple Golden Corridor Varanasi',
        heroHighlight: 'Comfortable, respectful darshan at Lord Shiva\'s eternal home with local temple assistance.',
        overview: 'Varanasi is the abode of Lord Shiva. The newly developed Kashi Vishwanath Corridor links the sanctum sanctorum directly to the river ghats with wide, clean pathways. Our local coordinators assist senior citizens and families through security and darshan lines with minimal stress.',
        whatToExpect: [
            'Darshan guidance at Shri Kashi Vishwanath Temple (one of the 12 sacred Jyotirlingas).',
            'Visits to Maa Annapurna Mandir (deity of food and nourishment) and Vishalakshi Shaktipeeth.',
            'Blessings at Kaal Bhairav temple, revered as the Kotwal (protector guardian) of Kashi.',
            'Visit to Sankat Mochan Hanuman Temple founded by Goswami Tulsidas.'
        ],
        practicalTips: [
            'Mobile phones, electronic watches, pens, and leather items are strictly prohibited inside Kashi Vishwanath corridor; use official locker facilities.',
            'Carry a valid government ID (Aadhaar/Passport) for security verification.',
            'Early morning (Sparsh Darshan hours) is best for direct pooja.'
        ],
        idealFor: 'Pilgrims, senior citizens, families seeking peaceful prayer',
        highlights: ['Kashi Vishwanath Jyotirlinga', 'Kaal Bhairav Blessings', 'Annapurna Temple', 'Locker & Queue Assistance']
    },
    {
        slug: 'sarnath',
        title: 'Sarnath Buddhist Heritage & Dhamek Stupa',
        shortDesc: 'Visit the deer park where Gautama Buddha delivered his first sermon after enlightenment, featuring ancient Ashoka pillars and calm monasteries.',
        tag: 'Buddhist Heritage & History',
        duration: '3 - 4 Hours',
        timing: 'Daily: 9:00 AM - 5:00 PM (Museum closed on Fridays)',
        image: sarnathImg,
        alt: 'Sarnath Dhamek Stupa ancient archaeological park',
        heroHighlight: 'Walk the serene grounds where the Wheel of Law (Dharmachakra) was first turned.',
        overview: 'Located just 10 km from Varanasi, Sarnath is one of the four most sacred Buddhist pilgrimage destinations in the world. Here Lord Buddha preached his first sermon (Dhammacakkappavattana Sutta). The site features the towering 5th-century Dhamek Stupa, Ashoka Pillar ruins, and the world-renowned Archaeological Museum housing the Lion Capital of Ashoka.',
        whatToExpect: [
            'Circumambulating the massive cylindrical Dhamek Stupa built with carved stone reliefs.',
            'Viewing the original 3rd-century BC Lion Capital of Ashoka (India\'s national emblem).',
            'Exploring international monasteries built by Thai, Tibetan, Japanese, and Sri Lankan communities.',
            'Peaceful meditation under ancient Bodhi tree sapling planted from Anuradhapura.'
        ],
        practicalTips: [
            'The Sarnath Archaeological Museum is closed on Fridays; plan your day accordingly.',
            'Hire an approved monument guide inside the ticketed complex for deep historical context.',
            'Combine this with your airport transit route for maximum day efficiency.'
        ],
        idealFor: 'History lovers, Buddhist pilgrims, families, architecture admirers',
        highlights: ['Dhamek Stupa', 'Ashoka Lion Capital', 'Mulagandha Kuti Vihar', 'International Monasteries']
    },
    {
        slug: 'culinary-walk',
        title: 'Banarasi Food & Heritage Culinary Walk',
        shortDesc: 'Savor traditional morning Kachori-Jalebi, frothy winter Malaiyo, thick clay-pot Lassi, and world-famous Banarasi Paan in historic alleyways.',
        tag: 'Local Gastronomy',
        duration: '2.5 Hours',
        timing: 'Morning: 7:30 AM - 10:00 AM | Evening: 4:30 PM - 7:00 PM',
        image: assiImg,
        alt: 'Banarasi food kachori jalebi malaiyo and lassi',
        heroHighlight: 'Taste authentic vegetarian delicacies perfected over centuries in local gallis.',
        overview: 'Varanasi has a rich culinary heritage rooted in satvik traditions and unmatched flavors. From steaming kachoris served on leaf platters to sweet creamy lassi and saffron-infused winter malaiyo, our guided food walks introduce you to hygienic, generational family-run sweet shops.',
        whatToExpect: [
            'Freshly fried Bedmi Kachori with spicy aloo-chana sabzi and crisp jalebis at dawn.',
            'Famous Blue Lassi or Pehelwan Lassi served in traditional earthenware kulhads.',
            'Fluffy winter foam sweet Malaiyo sprinkled with pistachios and saffron.',
            'Authentic Banarasi Paan prepared with sweet gulkand and fragrant spices.'
        ],
        practicalTips: [
            'Come with a light appetite so you can taste multiple small portions.',
            'All food spots selected are pure vegetarian with decades of local reputation.',
            'Carry small cash notes for local street vendors.'
        ],
        idealFor: 'Foodies, cultural explorers, travelers wanting local flavor',
        highlights: ['Kachori Jalebi', 'Kulhad Lassi', 'Winter Malaiyo', 'Traditional Banarasi Paan']
    },
    {
        slug: 'silk-handicrafts',
        title: 'Handloom Banarasi Silk & Craft Discovery',
        shortDesc: 'Visit authentic master weavers in the heritage weaver colonies to understand genuine Kadhwa silk weaving without showroom tourist markups.',
        tag: 'Culture & Craftsmanship',
        duration: '2 - 3 Hours',
        timing: 'Daily: 11:00 AM - 6:00 PM',
        image: kashiImg,
        alt: 'Banarasi handloom silk saree weaving looms Varanasi',
        heroHighlight: 'Witness master artisans weave intricate zari patterns on generational wooden pit looms.',
        overview: 'Banarasi Silk Sarees and brocades are recognized worldwide for their gold and silver metallic zari embroidery. We take you away from aggressive commercial commission shops directly to traditional weaver colonies (Madanpura & Chowk), where you can observe the painstaking loom process.',
        whatToExpect: [
            'Live demonstration of warp and weft Jacquard pit-loom weaving by skilled master craftsmen.',
            'Learn how to distinguish pure Katan silk and certified Silk Mark fabrics from synthetic polyester.',
            'Discover local Gulabi Meenakari (pink enamel silver craft) and wooden lacquer toy art.',
            'Direct access to fair-price artisan cooperatives without middleman pressure.'
        ],
        practicalTips: [
            'Never buy silk from touts or drivers directing you to "factory outlets" near the ghats.',
            'Look for the official Silk Mark of India tag on genuine silk garments.',
            'Weavers take immense pride in explaining their craft; feel free to ask questions.'
        ],
        idealFor: 'Textile enthusiasts, shoppers, couples, wedding shoppers',
        highlights: ['Generational Pit Looms', 'Pure Silk Mark Verification', 'Gulabi Meenakari Enameling', 'Fair-Price Artisan Direct']
    }
];

export const getExperienceBySlug = (slug) => {
    return EXPERIENCES.find(exp => exp.slug === slug) || null;
};

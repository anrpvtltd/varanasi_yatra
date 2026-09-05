import varanasiImg from '../../assets/ExperienceVaranasi/KashiVT.png';
import sarnathImg from '../../assets/ExperienceVaranasi/sarnathStupa.png';
import ayodhyaImg from '../../assets/tour packege photo/ramJanmBhumi.png';
import bodhgayaImg from '../../assets/tour packege photo/BiharBuddha.png';

export const DESTINATIONS = [
    {
        slug: 'varanasi',
        name: 'Varanasi (Kashi)',
        title: 'Varanasi (Kashi) Destination & Travel Guide',
        tagline: 'The Eternal City of Light on the Sacred Ganges',
        distanceFromCenter: 'City Center',
        idealDays: '2 - 3 Days',
        bestTimeToVisit: 'October to March',
        image: varanasiImg,
        alt: 'Kashi Vishwanath temple corridor Varanasi destination',
        heroHighlight: 'The spiritual capital of India, continuously inhabited for over 3,000 years.',
        overview: 'Varanasi, also known as Kashi and Benares, is one of the world\'s oldest living cities. Situated on the crescent-shaped western banks of the sacred Ganges River in Uttar Pradesh, it represents the heart of Hindu spirituality, classical music, Vedic learning, and silk weaving.',
        attractions: [
            { name: 'Shri Kashi Vishwanath Temple', desc: 'The golden-spired sanctum housing one of the twelve sacred Jyotirlingas, connected directly to the river through the grand temple corridor.' },
            { name: 'Dashashwamedh Ghat', desc: 'The epicentre of river activity where Lord Brahma is said to have performed a grand sacrifice, and the venue for the evening Maha Ganga Aarti.' },
            { name: 'Assi Ghat', desc: 'The southernmost major ghat where the Assi River meets the Ganges, celebrated for morning yoga, Subah-e-Banaras music, and student life.' },
            { name: 'Manikarnika & Harishchandra Ghats', desc: 'The sacred cremation grounds where the holy fires have burned uninterrupted for thousands of years, reminding pilgrims of liberation (Moksha).' },
            { name: 'Kaal Bhairav Temple', desc: 'The ancient guardian deity of Kashi where pilgrims seek clearance before concluding their sacred visit.' },
            { name: 'Banaras Hindu University (BHU)', desc: 'Asia\'s largest residential university campus, home to the peaceful New Vishwanath Temple (Birla Mandir) and Bharat Kala Bhavan museum.' }
        ],
        experiences: [
            { name: 'Sunrise Ganges Boat Ride', slug: 'varanasi-boat-ride' },
            { name: 'Evening Maha Ganga Aarti', slug: 'ganga-aarti' },
            { name: 'Temple & Darshan Assistance', slug: 'temple-darshan' },
            { name: 'Heritage Culinary Walk', slug: 'culinary-walk' }
        ],
        howToReach: {
            air: 'Lal Bahadur Shastri International Airport (VNS) at Babatpur, 26 km northwest of the city, with daily direct flights from Delhi, Mumbai, Bengaluru, Hyderabad, and Kolkata.',
            train: 'Varanasi Junction (BSB), Banaras Station (BSBS), and Pt. Deen Dayal Upadhyaya Junction (DDU) provide extensive superfast and Vande Bharat connectivity.',
            road: 'Well connected via National Highway 19 (Grand Trunk Road) and Purvanchal Expressway.'
        }
    },
    {
        slug: 'sarnath',
        name: 'Sarnath',
        title: 'Sarnath Buddhist Pilgrimage & Heritage Guide',
        tagline: 'Where the Wheel of Dhamma Began to Turn',
        distanceFromCenter: '10 km from Varanasi',
        idealDays: 'Half Day (3 - 4 Hours)',
        bestTimeToVisit: 'October to March',
        image: sarnathImg,
        alt: 'Sarnath Dhamek Stupa Buddhist pilgrimage destination',
        heroHighlight: 'The sacred deer park where Lord Buddha preached his first sermon after enlightenment.',
        overview: 'Nestled in quiet parklands just 10 kilometers north of Varanasi, Sarnath holds monumental global significance as one of the four principal Buddhist pilgrimage sites. Here Gautama Buddha preached his first discourse, establishing the Buddhist Sangha.',
        attractions: [
            { name: 'Dhamek Stupa', desc: 'A massive 43.6-meter tall cylindrical stone stupa marking the exact spot where Buddha preached his first sermon to his five disciples.' },
            { name: 'Ashoka Pillar Ruins', desc: 'Fragments of the monolithic pillar erected by Emperor Ashoka in the 3rd century BC.' },
            { name: 'Archaeological Museum Sarnath', desc: 'India\'s oldest on-site museum, housing the original Lion Capital of Ashoka and exquisite Gupta-period stone sculptures.' },
            { name: 'Mulagandha Kuti Vihar', desc: 'A modern vihara built by the Maha Bodhi Society featuring stunning frescoes painted by Japanese artist Kosetsu Nosu.' },
            { name: 'Chaukhandi Stupa', desc: 'An ancient tiered brick stupa topped with an octagonal Mughal tower built to commemorate Emperor Humayun\'s visit.' }
        ],
        experiences: [
            { name: 'Sarnath Buddhist Heritage', slug: 'sarnath' },
            { name: 'Varanasi & Sarnath Tour', slug: '2-day-varanasi-sarnath' }
        ],
        howToReach: {
            air: 'Accessible via Varanasi Airport (approx 25 km).',
            train: 'Sarnath has a local railway station; Varanasi Junction is 8 km away.',
            road: 'Easily reached within 25-30 minutes by private AC taxi or auto-rickshaw from Varanasi city center.'
        }
    },
    {
        slug: 'ayodhya',
        name: 'Ayodhya Ji',
        title: 'Ayodhya Shri Ram Mandir Pilgrimage Guide',
        tagline: 'The Holy Birthplace of Maryada Purushottam Lord Rama',
        distanceFromCenter: '215 km from Varanasi (approx 3.5 - 4 Hours)',
        idealDays: '1 - 2 Days',
        bestTimeToVisit: 'October to March',
        image: ayodhyaImg,
        alt: 'Shri Ram Mandir Janmabhoomi Ayodhya destination',
        heroHighlight: 'The sacred temple city on the banks of holy Sarayu River.',
        overview: 'Ayodhya, situated along the sacred Sarayu River, is one of the seven holiest cities (Sapta Puri) in Hinduism. Renowned as the birthplace of Lord Rama and capital of the ancient Kosala Kingdom, Ayodhya has undergone massive revitalization with the grand Shri Ram Janmabhoomi Temple.',
        attractions: [
            { name: 'Shri Ram Janmabhoomi Temple', desc: 'The magnificent newly consecrated temple dedicated to Ram Lalla.' },
            { name: 'Hanuman Garhi', desc: 'A 10th-century custom fort-temple dedicated to Lord Hanuman, traditionally visited before entering Ram Janmabhoomi.' },
            { name: 'Kanak Bhawan', desc: 'The beautiful palace gifted to Mata Sita by Queen Kaikeyi, celebrated for its ornate architecture.' },
            { name: 'Sarayu River Ghats & Ram ki Paidi', desc: 'The sacred riverside steps where thousands gather at dusk for the solemn Sarayu Sandhya Aarti.' }
        ],
        experiences: [
            { name: 'Ayodhya Ram Mandir Tour', slug: 'ayodhya-tour' }
        ],
        howToReach: {
            air: 'Maharishi Valmiki International Airport (AYJ) in Ayodhya, or drive from Varanasi Airport (200 km).',
            train: 'Ayodhya Dham Junction (AY) and Ayodhya Cantt (AYC) connected with major Indian cities.',
            road: 'Direct 4-lane highway from Varanasi via NH-330 and Purvanchal Expressway link.'
        }
    },
    {
        slug: 'bodh-gaya',
        name: 'Bodh Gaya',
        title: 'Bodh Gaya Buddhist Heritage & Mahabodhi Temple',
        tagline: 'The Sacred Land of Supreme Enlightenment',
        distanceFromCenter: '250 km from Varanasi (approx 5 Hours)',
        idealDays: '1 - 2 Days',
        bestTimeToVisit: 'October to March',
        image: bodhgayaImg,
        alt: 'Mahabodhi Temple Bodh Gaya Buddha pilgrimage',
        heroHighlight: 'The UNESCO World Heritage Site where Siddhartha Gautama attained enlightenment.',
        overview: 'Bodh Gaya in Bihar is the spiritual nucleus of Buddhism. Under the sacred Bodhi Tree beside the ancient Mahabodhi Temple, the Buddha spent weeks in meditation discovering the Four Noble Truths and the Eightfold Path.',
        attractions: [
            { name: 'Mahabodhi Temple Complex', desc: 'A soaring 50-meter 5th-century stone temple and UNESCO World Heritage monument.' },
            { name: 'The Sacred Bodhi Tree', desc: 'The revered peepal tree grown from a sapling of the original tree under which the Buddha sat.' },
            { name: 'The 80-Foot Great Buddha Statue', desc: 'A towering red granite sculpture depicting Buddha in meditation posture.' },
            { name: 'International Monasteries', desc: 'Rich architectural styles built by Buddhist nations including Thailand, Bhutan, Japan, and Tibet.' }
        ],
        experiences: [
            { name: 'Bodh Gaya Buddhist Circuit', slug: 'bodh-gaya-tour' }
        ],
        howToReach: {
            air: 'Gaya International Airport (GAY) 12 km away, or private cab from Varanasi (250 km).',
            train: 'Gaya Junction (16 km) is a major stop on the Grand Chord railway line.',
            road: 'Direct route from Varanasi via NH-19 (approx 5 hours drive).'
        }
    }
];

export const getDestinationBySlug = (slug) => {
    return DESTINATIONS.find(d => d.slug === slug) || null;
};

export const PACKAGE_TYPES = {
    BASIC: 'BASIC',
    COMFORT: 'COMFORT',
    COMPLETE: 'COMPLETE',
    CUSTOM: 'CUSTOM'
};

export const PACKAGE_TEMPLATES = {
    BASIC: {
        id: 'BASIC',
        name: 'Basic Travel Package',
        icon: '🚗',
        desc: 'For self-arranging clients needing transport & local assistance.',
        defaultServices: [
            { category: 'TRANSPORT', serviceName: 'Private Car Transport', vendorName: 'Local Fleet', quantity: 3, unit: 'Days', vendorCost: 2000, customerDisplayName: 'Private AC Sedan Car (3 Days)' },
            { category: 'DRIVER', serviceName: 'Dedicated Driver', vendorName: 'Varanasi Drivers', quantity: 3, unit: 'Days', vendorCost: 500, customerDisplayName: 'Professional Local Driver (3 Days)' },
            { category: 'OTHER', serviceName: 'Temple Assistance', vendorName: 'Varanasi Yatra Team', quantity: 1, unit: 'Trip', vendorCost: 500, customerDisplayName: 'Kashi Vishwanath Temple Assistance' }
        ],
        defaultMargin: 1500
    },
    COMFORT: {
        id: 'COMFORT',
        name: 'Comfort Package',
        icon: '🏨',
        desc: 'Convenient trip with hotel accommodation & transport.',
        defaultServices: [
            { category: 'HOTEL', serviceName: '3-Star Deluxe Hotel', vendorName: 'Hotel Clarks / Similar', quantity: 2, unit: 'Nights', vendorCost: 2500, customerDisplayName: 'Deluxe AC Room with Breakfast (2 Nights)' },
            { category: 'TRANSPORT', serviceName: 'Private Car Transport', vendorName: 'Local Fleet', quantity: 3, unit: 'Days', vendorCost: 2000, customerDisplayName: 'Private AC Sedan Car (3 Days)' },
            { category: 'DRIVER', serviceName: 'Dedicated Driver', vendorName: 'Varanasi Drivers', quantity: 3, unit: 'Days', vendorCost: 500, customerDisplayName: 'Professional Local Driver (3 Days)' },
            { category: 'OTHER', serviceName: 'Temple Assistance', vendorName: 'Varanasi Yatra Team', quantity: 1, unit: 'Trip', vendorCost: 500, customerDisplayName: 'VIP Temple Facilitation' }
        ],
        defaultMargin: 2500
    },
    COMPLETE: {
        id: 'COMPLETE',
        name: 'Complete All-Inclusive Package ⭐',
        icon: '👑',
        desc: 'Hero Package — Everything handled seamlessly for the guest.',
        defaultServices: [
            { category: 'HOTEL', serviceName: 'Premium Heritage / 4-Star Hotel', vendorName: 'Hotel Taj / Clarks', quantity: 2, unit: 'Nights', vendorCost: 3500, customerDisplayName: 'Premium Heritage AC Room with Breakfast (2 Nights)' },
            { category: 'TRANSPORT', serviceName: 'Innova Crysta / AC Vehicle', vendorName: 'Varanasi Luxury Transport', quantity: 3, unit: 'Days', vendorCost: 3000, customerDisplayName: 'Innova Crysta AC Vehicle (3 Days)' },
            { category: 'DRIVER', serviceName: 'Dedicated Uniformed Driver', vendorName: 'Varanasi Drivers', quantity: 3, unit: 'Days', vendorCost: 667, customerDisplayName: 'Dedicated Experienced Driver (3 Days)' },
            { category: 'PANDIT', serviceName: 'Special Puja & Sankalp', vendorName: 'Pt. Ramesh Shastri', quantity: 1, unit: 'Session', vendorCost: 1500, customerDisplayName: 'Special Kashi Ritual Puja & Sankalp' },
            { category: 'VIP_DARSHAN', serviceName: 'Kashi Vishwanath VIP Darshan', vendorName: 'Trust VIP Pass', quantity: 2, unit: 'Passes', vendorCost: 500, customerDisplayName: 'Kashi Vishwanath Temple VIP Fast-Track Darshan' }
        ],
        defaultMargin: 3500
    },
    CUSTOM: {
        id: 'CUSTOM',
        name: 'Custom Tailored Package',
        icon: '✨',
        desc: 'Start from scratch and build customized itinerary.',
        defaultServices: [],
        defaultMargin: 2000
    }
};

export const SERVICE_CATEGORIES = {
    HOTEL: 'Hotel Accommodation',
    TRANSPORT: 'Car / Transport',
    DRIVER: 'Dedicated Driver',
    PANDIT: 'Pandit / Ritual Puja',
    VIP_DARSHAN: 'VIP Darshan Pass',
    BOAT_RIDE: 'Ganga Boat Ride',
    TOUR_GUIDE: 'Local Tour Guide',
    SHOPPING: 'Shopping Partner',
    AIRPORT_PICKUP: 'Airport Transfer',
    RAILWAY_PICKUP: 'Station Transfer',
    EXTRA_DAY: 'Extra Extension Day',
    CUSTOM_SERVICE: 'Custom Service'
};

export const VENDOR_CATEGORIES = {
    HOTEL: 'HOTEL',
    TRANSPORT: 'TRANSPORT',
    CAR: 'CAR',
    DRIVER: 'DRIVER',
    PANDIT: 'PANDIT',
    VIP_DARSHAN: 'VIP_DARSHAN',
    BOAT_RIDE: 'BOAT_RIDE',
    TOUR_GUIDE: 'TOUR_GUIDE',
    SHOPPING_PARTNER: 'SHOPPING_PARTNER',
    AIRPORT_PICKUP: 'AIRPORT_PICKUP',
    RAILWAY_PICKUP: 'RAILWAY_PICKUP',
    OTHER: 'OTHER'
};

export const VENDOR_CATEGORY_LABELS = {
    HOTEL: '🏨 Hotel Accommodation',
    TRANSPORT: '🚗 Transport Fleet',
    CAR: '🚘 Car / Cab Operator',
    DRIVER: '👨‍✈️ Dedicated Driver',
    PANDIT: '🪔 Pandit / Ritual Puja',
    VIP_DARSHAN: '🛕 VIP Darshan Facilitator',
    BOAT_RIDE: '⛵ Ganga Boat Operator',
    TOUR_GUIDE: '🚩 Local Tour Guide',
    SHOPPING_PARTNER: '🛍️ Shopping Partner',
    AIRPORT_PICKUP: '✈️ Airport Transfer Provider',
    RAILWAY_PICKUP: '🚆 Station Transfer Provider',
    OTHER: '✨ Service Partner'
};

export const VENDOR_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED'
};

export const UNIT_TYPES = {
    ROOM: 'ROOM',
    NIGHT: 'NIGHT',
    DAY: 'DAY',
    TRIP: 'TRIP',
    PERSON: 'PERSON',
    VEHICLE: 'VEHICLE',
    SESSION: 'SESSION',
    ITEM: 'ITEM',
    OTHER: 'OTHER'
};

export const COMMISSION_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED'
};

export const DEFAULT_SERVICES = [
    { id: 'HOTEL', label: 'Hotel Accommodation', icon: '🏨', defaultUnit: 'Nights' },
    { id: 'TRANSPORT', label: 'Car / Transport', icon: '🚗', defaultUnit: 'Days' },
    { id: 'DRIVER', label: 'Dedicated Driver', icon: '🚖', defaultUnit: 'Days' },
    { id: 'PANDIT', label: 'Pandit / Ritual Puja', icon: '🪔', defaultUnit: 'Session' },
    { id: 'VIP_DARSHAN', label: 'VIP Darshan Pass', icon: '🛕', defaultUnit: 'Passes' },
    { id: 'BOAT_RIDE', label: 'Ganga Boat Ride', icon: '⛵', defaultUnit: 'Ride' },
    { id: 'TOUR_GUIDE', label: 'Local Tour Guide', icon: '🚩', defaultUnit: 'Days' },
    { id: 'SHOPPING', label: 'Shopping Partner', icon: '🛍️', defaultUnit: 'Session' },
    { id: 'AIRPORT_PICKUP', label: 'Airport Transfer', icon: '✈️', defaultUnit: 'Trip' },
    { id: 'RAILWAY_PICKUP', label: 'Station Transfer', icon: '🚆', defaultUnit: 'Trip' },
    { id: 'EXTRA_DAY', label: 'Extra Extension Day', icon: '📅', defaultUnit: 'Days' },
    { id: 'CUSTOM_SERVICE', label: 'Custom Service', icon: '✨', defaultUnit: 'Item' }
];

export const LEAD_SOURCES = {
    WEBSITE: 'Website',
    WHATSAPP: 'WhatsApp',
    PHONE_CALL: 'Phone Call',
    HOTEL_REFERENCE: 'Hotel Reference',
    TRAVEL_AGENT: 'Travel Agent',
    INSTAGRAM: 'Instagram',
    FACEBOOK: 'Facebook',
    GOOGLE: 'Google',
    REFERRAL: 'Referral',
    WALK_IN: 'Walk-in',
    EXISTING_CUSTOMER: 'Existing Customer',
    OTHER: 'Other'
};

export const LEAD_STAGES = {
    NEW: 'NEW',
    CONTACTED: 'CONTACTED',
    FOLLOW_UP: 'FOLLOW_UP',
    INTERESTED: 'INTERESTED',
    REQUIREMENTS_READY: 'REQUIREMENTS_READY',
    QUOTE_READY: 'QUOTE_READY',
    QUOTED: 'QUOTED',
    WON: 'WON',
    LOST: 'LOST'
};

export const STAGE_LABELS = {
    NEW: 'New Lead',
    CONTACTED: 'Contacted',
    FOLLOW_UP: 'Follow-up Scheduled',
    INTERESTED: 'Interested',
    REQUIREMENTS_READY: 'Requirements Ready',
    QUOTE_READY: 'Ready for Quote',
    QUOTED: 'Quoted',
    WON: 'Won',
    LOST: 'Lost'
};

export const QUOTE_STATUS = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    VIEWED: 'Viewed',
    REVISED: 'Revised',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired'
};

export const BOOKING_STATUS = {
    CONFIRMED: 'Confirmed',
    TRIP_STARTED: 'Trip Started',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

export const BOOKING_LIFECYCLE_STATUS = {
    PENDING: 'PENDING',
    PREPARING: 'PREPARING',
    READY: 'READY',
    TRIP_STARTED: 'TRIP_STARTED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
};

export const BOOKING_STATUS_LABELS = {
    PENDING: 'Pending Preparation',
    PREPARING: 'In Preparation',
    READY: 'Ready for Trip',
    TRIP_STARTED: 'Trip Active',
    COMPLETED: 'Trip Completed',
    CANCELLED: 'Booking Cancelled'
};

export const CHECKLIST_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    ARRANGED: 'ARRANGED',
    CONFIRMED: 'CONFIRMED'
};

export const DEFAULT_MARGIN_CONFIG = {
    MIN_RECOMMENDED_MARGIN: 1500, // ₹1,500
    SUGGESTED_MARGIN_PERCENT: 15, // 15%
};

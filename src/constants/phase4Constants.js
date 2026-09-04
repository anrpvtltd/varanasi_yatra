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
            { category: 'TRANSPORT', commercialModel: 'FIXED_VENDOR_RATE', serviceName: 'Private Car Transport', vendorName: 'Local Fleet', quantity: 3, unit: 'Days', vendorCost: 2000, referenceCost: 2000, customerSellingPrice: 2500, customerDisplayName: 'Private AC Sedan Car (3 Days)' },
            { category: 'DRIVER', commercialModel: 'FIXED_VENDOR_RATE', serviceName: 'Dedicated Driver', vendorName: 'Varanasi Drivers', quantity: 3, unit: 'Days', vendorCost: 500, referenceCost: 500, customerSellingPrice: 500, customerDisplayName: 'Professional Local Driver (3 Days)' },
            { category: 'OTHER', commercialModel: 'SELLING_PRICE', serviceName: 'Temple Assistance', vendorName: 'Varanasi Yatra Team', quantity: 1, unit: 'Trip', vendorCost: 500, referenceCost: 500, customerSellingPrice: 1000, customerDisplayName: 'Kashi Vishwanath Temple Assistance' }
        ],
        defaultMargin: 1500
    },
    COMFORT: {
        id: 'COMFORT',
        name: 'Comfort Package',
        icon: '🏨',
        desc: 'Convenient trip with hotel accommodation & transport.',
        defaultServices: [
            { category: 'HOTEL', commercialModel: 'SELLING_PRICE', serviceName: '3-Star Deluxe Hotel', vendorName: 'Hotel Clarks / Similar', quantity: 2, unit: 'Nights', vendorCost: 2500, referenceCost: 2500, customerSellingPrice: 3200, customerDisplayName: 'Deluxe AC Room with Breakfast (2 Nights)' },
            { category: 'TRANSPORT', commercialModel: 'FIXED_VENDOR_RATE', serviceName: 'Private Car Transport', vendorName: 'Local Fleet', quantity: 3, unit: 'Days', vendorCost: 2000, referenceCost: 2000, customerSellingPrice: 2500, customerDisplayName: 'Private AC Sedan Car (3 Days)' },
            { category: 'DRIVER', commercialModel: 'FIXED_VENDOR_RATE', serviceName: 'Dedicated Driver', vendorName: 'Varanasi Drivers', quantity: 3, unit: 'Days', vendorCost: 500, referenceCost: 500, customerSellingPrice: 500, customerDisplayName: 'Professional Local Driver (3 Days)' },
            { category: 'OTHER', commercialModel: 'SELLING_PRICE', serviceName: 'Temple Assistance', vendorName: 'Varanasi Yatra Team', quantity: 1, unit: 'Trip', vendorCost: 500, referenceCost: 500, customerSellingPrice: 1000, customerDisplayName: 'VIP Temple Facilitation' }
        ],
        defaultMargin: 2500
    },
    COMPLETE: {
        id: 'COMPLETE',
        name: 'Complete All-Inclusive Package ⭐',
        icon: '👑',
        desc: 'Hero Package — Everything handled seamlessly for the guest.',
        defaultServices: [
            { category: 'HOTEL', commercialModel: 'SELLING_PRICE', serviceName: 'Premium Heritage / 4-Star Hotel', vendorName: 'Hotel Taj / Clarks', quantity: 2, unit: 'Nights', vendorCost: 3500, referenceCost: 3500, customerSellingPrice: 4200, customerDisplayName: 'Premium Heritage AC Room with Breakfast (2 Nights)' },
            { category: 'TRANSPORT', commercialModel: 'FIXED_VENDOR_RATE', serviceName: 'Innova Crysta / AC Vehicle', vendorName: 'Varanasi Luxury Transport', quantity: 3, unit: 'Days', vendorCost: 3000, referenceCost: 3000, customerSellingPrice: 3500, customerDisplayName: 'Innova Crysta AC Vehicle (3 Days)' },
            { category: 'DRIVER', commercialModel: 'FIXED_VENDOR_RATE', serviceName: 'Dedicated Uniformed Driver', vendorName: 'Varanasi Drivers', quantity: 3, unit: 'Days', vendorCost: 667, referenceCost: 667, customerSellingPrice: 800, customerDisplayName: 'Dedicated Experienced Driver (3 Days)' },
            { category: 'PANDIT', commercialModel: 'CUSTOMER_DIRECT', serviceName: 'Special Puja & Sankalp', vendorName: 'Pt. Ramesh Shastri', quantity: 1, unit: 'Session', vendorCost: 0, referenceCost: 0, customerSellingPrice: 0, customerDisplayName: 'Special Kashi Ritual Puja & Sankalp (Direct Coordination)' },
            { category: 'VIP_DARSHAN', commercialModel: 'PASS_THROUGH', serviceName: 'Kashi Vishwanath VIP Darshan', vendorName: 'Trust VIP Pass', quantity: 2, unit: 'Passes', vendorCost: 500, referenceCost: 500, passThroughAmount: 500, customerSellingPrice: 500, customerDisplayName: 'Kashi Vishwanath Temple VIP Fast-Track Darshan Pass' }
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

export const RESOURCE_CATEGORIES = {
    HOTEL: 'HOTEL',
    TRANSPORT: 'TRANSPORT',
    PANDIT: 'PANDIT',
    BOAT: 'BOAT',
    GUIDE: 'GUIDE',
    SHOPPING: 'SHOPPING',
    DARSHAN: 'DARSHAN',
    OTHER: 'OTHER',
    LEAD_PARTNER: 'LEAD_PARTNER'
};

export const RESOURCE_CATEGORY_LABELS = {
    HOTEL: '🏨 Hotels',
    TRANSPORT: '🚗 Transport',
    PANDIT: '🪔 Pandits',
    BOAT: '⛵ Boats',
    GUIDE: '🚩 Guides',
    SHOPPING: '🛍️ Shopping Partners',
    DARSHAN: '🛕 Darshan / Passes',
    OTHER: '✨ Other Services',
    LEAD_PARTNER: '🤝 Lead Partners'
};

export const CATEGORY_DEFAULT_COMMERCIAL_MODELS = {
    HOTEL: 'SELLING_PRICE',
    TRANSPORT: 'FIXED_VENDOR_RATE',
    PANDIT: 'CUSTOMER_DIRECT',
    BOAT: 'SELLING_PRICE',
    GUIDE: 'SELLING_PRICE',
    SHOPPING: 'COMMISSION',
    DARSHAN: 'PASS_THROUGH',
    OTHER: 'SELLING_PRICE',
    LEAD_PARTNER: 'COMMISSION'
};

export const VENDOR_CATEGORIES = {
    HOTEL: 'HOTEL',
    TRANSPORT: 'TRANSPORT',
    CAR: 'CAR',
    DRIVER: 'DRIVER',
    PANDIT: 'PANDIT',
    BOAT: 'BOAT',
    BOAT_RIDE: 'BOAT_RIDE',
    GUIDE: 'GUIDE',
    TOUR_GUIDE: 'TOUR_GUIDE',
    SHOPPING: 'SHOPPING',
    SHOPPING_PARTNER: 'SHOPPING_PARTNER',
    DARSHAN: 'DARSHAN',
    VIP_DARSHAN: 'VIP_DARSHAN',
    LEAD_PARTNER: 'LEAD_PARTNER',
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
    BOAT: '⛵ Ganga Boat Operator',
    BOAT_RIDE: '⛵ Ganga Boat Operator',
    GUIDE: '🚩 Local Tour Guide',
    TOUR_GUIDE: '🚩 Local Tour Guide',
    SHOPPING: '🛍️ Shopping Partner',
    SHOPPING_PARTNER: '🛍️ Shopping Partner',
    DARSHAN: '🛕 Darshan / Pass Facilitator',
    VIP_DARSHAN: '🛕 VIP Darshan Facilitator',
    LEAD_PARTNER: '🤝 Lead Partner / Travel Agent',
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

export const COMMERCIAL_MODELS = {
    SELLING_PRICE: 'SELLING_PRICE',
    FIXED_VENDOR_RATE: 'FIXED_VENDOR_RATE',
    VENDOR_QUOTE_REQUIRED: 'VENDOR_QUOTE_REQUIRED',
    CUSTOMER_DIRECT: 'CUSTOMER_DIRECT',
    COMMISSION: 'COMMISSION',
    PASS_THROUGH: 'PASS_THROUGH'
};

export const COMMERCIAL_MODEL_LABELS = {
    SELLING_PRICE: 'Selling Price (Manager Sets Rate)',
    FIXED_VENDOR_RATE: 'Fixed Vendor Rate',
    VENDOR_QUOTE_REQUIRED: 'Vendor Quote Required (Custom Route)',
    CUSTOMER_DIRECT: 'Customer Direct (₹0 in Package)',
    COMMISSION: 'Partner Commission (₹0 in Package)',
    PASS_THROUGH: 'Pass-Through (Zero Company Margin)'
};

export const DEFAULT_SERVICES = [
    { id: 'HOTEL', label: 'Hotel Accommodation', icon: '🏨', defaultUnit: 'Nights', defaultCommercialModel: 'SELLING_PRICE' },
    { id: 'TRANSPORT', label: 'Car / Transport', icon: '🚗', defaultUnit: 'Days', defaultCommercialModel: 'FIXED_VENDOR_RATE' },
    { id: 'DRIVER', label: 'Dedicated Driver', icon: '🚖', defaultUnit: 'Days', defaultCommercialModel: 'FIXED_VENDOR_RATE' },
    { id: 'PANDIT', label: 'Pandit / Ritual Puja', icon: '🪔', defaultUnit: 'Session', defaultCommercialModel: 'CUSTOMER_DIRECT' },
    { id: 'VIP_DARSHAN', label: 'VIP Darshan Pass', icon: '🛕', defaultUnit: 'Passes', defaultCommercialModel: 'PASS_THROUGH' },
    { id: 'BOAT_RIDE', label: 'Ganga Boat Ride', icon: '⛵', defaultUnit: 'Ride', defaultCommercialModel: 'SELLING_PRICE' },
    { id: 'TOUR_GUIDE', label: 'Local Tour Guide', icon: '🚩', defaultUnit: 'Days', defaultCommercialModel: 'SELLING_PRICE' },
    { id: 'SHOPPING', label: 'Shopping Partner', icon: '🛍️', defaultUnit: 'Session', defaultCommercialModel: 'COMMISSION' },
    { id: 'AIRPORT_PICKUP', label: 'Airport Transfer', icon: '✈️', defaultUnit: 'Trip', defaultCommercialModel: 'FIXED_VENDOR_RATE' },
    { id: 'RAILWAY_PICKUP', label: 'Station Transfer', icon: '🚆', defaultUnit: 'Trip', defaultCommercialModel: 'FIXED_VENDOR_RATE' },
    { id: 'EXTRA_DAY', label: 'Extra Extension Day', icon: '📅', defaultUnit: 'Days', defaultCommercialModel: 'SELLING_PRICE' },
    { id: 'CUSTOM_SERVICE', label: 'Custom Service', icon: '✨', defaultUnit: 'Item', defaultCommercialModel: 'SELLING_PRICE' }
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

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://api-gzo7qrxiuq-uc.a.run.app' : 'http://localhost:5001');

export const STATUS_GRADIENTS = {
    'Completed': 'from-teal-500 to-emerald-600',
    'Trip Started': 'from-indigo-500 to-purple-600',
    'Confirmed': 'from-emerald-500 to-teal-600',
    'In-Progress': 'from-blue-500 to-indigo-600',
    'Cancelled': 'from-rose-500 to-red-600',
    'default': 'from-amber-400 to-orange-500'
};

export const getStatusGradient = (status) => {
    return STATUS_GRADIENTS[status] || STATUS_GRADIENTS['default'];
};

export const PIPELINE_STEPS = [
    { label: "Pending", statusValue: "Pending", color: "bg-amber-500", icon: "⏳" },
    { label: "In Progress", statusValue: "In-Progress", color: "bg-blue-500", icon: "📞" },
    { label: "Confirmed", statusValue: "Confirmed", color: "bg-emerald-600", icon: "🔒" },
    { label: "Trip Started", statusValue: "Trip Started", color: "bg-purple-600", icon: "🚖" },
    { label: "Completed", statusValue: "Completed", color: "bg-teal-500", icon: "✨" },
    { label: "Cancelled", statusValue: "Cancelled", color: "bg-rose-500", icon: "❌" }
];

export const CRM_LEAD_SOURCES = ['Website', 'QR', 'Offline/Manual'];

export const INITIAL_MANUAL_LEAD = {
    name: '',
    mobile: '',
    email: '',
    date: '',
    travelers: '1',
    pickup: '',
    destination: 'Varanasi',
    leadSource: 'Offline/Manual',
    specialRequirements: '',
    status: 'Pending',
    totalAmount: '',
    advanceAmount: '',
    adminNotes: '',
    driverName: '',
    driverMobile: '',
    vehicleModel: '',
    vehicleNumber: '',
    hotelDetails: '',
    panditDetails: '',
    remarks: ''
};


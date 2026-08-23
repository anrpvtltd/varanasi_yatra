import React, { useState, useEffect, useCallback } from 'react';

const getStatusGradient = (status) => {
    switch (status) {
        case 'Completed': return 'from-teal-500 to-emerald-600';
        case 'Trip Started': return 'from-indigo-500 to-purple-600';
        case 'Confirmed': return 'from-emerald-500 to-teal-600';
        case 'In-Progress': return 'from-blue-500 to-indigo-600';
        case 'Cancelled': return 'from-rose-500 to-red-600';
        default: return 'from-amber-400 to-orange-500';
    }
};

// =========================================================================
// 🏛️ REUSABLE CRM SUB-COMPONENTS
// =========================================================================

// 1. Dashboard Header Component
function DashboardHeader({ title, subtitle, onAddLead, onSync, onLogout, userIcon }) {
    return (
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="space-y-1.5 z-10">
                <div className="flex items-center space-x-2.5">
                    <span className="text-2xl">{userIcon}</span>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                </div>
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            </div>
            <div className="mt-4 sm:mt-0 z-10 flex flex-wrap gap-3">
                <button
                    onClick={onAddLead}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm shadow-amber-600/10 flex items-center space-x-1.5"
                >
                    <span>➕</span>
                    <span>Add Manual Lead</span>
                </button>
                <button
                    onClick={onSync}
                    className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm"
                >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Sync Data</span>
                </button>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm"
                >
                    <span>🔒</span>
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
}

// 2. Executive KPI Summary Cards (CEO: 4 Cards)
function ExecutiveKPIs({ metrics }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((card) => (
                <div
                    key={card.title}
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs"
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-[10px] uppercase tracking-wider font-extrabold ${card.textColor}`}>{card.title}</p>
                        <span className="text-sm">{card.icon}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">{card.value}</p>
                </div>
            ))}
        </div>
    );
}

// 3. Operations KPI Summary Cards (Manager: 7 Cards)
function OperationsKPIs({ metrics, statusFilter, setStatusFilter }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5 mb-8">
            {metrics.map((card) => {
                const isSelected = statusFilter === card.statusValue;
                return (
                    <div
                        key={card.title}
                        onClick={() => setStatusFilter(card.statusValue)}
                        className={`bg-white p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                            isSelected
                                ? `${card.selectedBorder} shadow-sm ring-1 ${card.ringColor} ${card.selectedBg}`
                                : `border-slate-200/80 ${card.hoverBorder} shadow-xs`
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <p className={`text-[10px] uppercase tracking-wider font-bold ${card.textColor}`}>{card.title}</p>
                            <span className="text-xs">{card.icon}</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight mt-1.5">{card.value}</p>
                    </div>
                );
            })}
        </div>
    );
}

// 4. Lead Pipeline Bar Chart Component
function LeadPipelineChart({ pending, inProgress, confirmed, tripStarted, completed, cancelled }) {
    const data = [
        { label: "Pending", count: pending, color: "bg-amber-500", icon: "⏳" },
        { label: "In Progress", count: inProgress, color: "bg-blue-500", icon: "📞" },
        { label: "Confirmed", count: confirmed, color: "bg-emerald-600", icon: "🔒" },
        { label: "Trip Started", count: tripStarted, color: "bg-purple-600", icon: "🚖" },
        { label: "Completed", count: completed, color: "bg-teal-500", icon: "✨" },
        { label: "Cancelled", count: cancelled, color: "bg-rose-500", icon: "❌" }
    ];

    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-full">
            <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>📊</span>
                    <span>Lead Pipeline Distribution</span>
                </h3>
            </div>

            <div className="space-y-4 py-2">
                {data.map((item) => {
                    const widthPercent = (item.count / maxCount) * 100;
                    return (
                        <div key={item.label} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                                <span className="flex items-center space-x-1.5">
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </span>
                                <span className="font-bold text-slate-900">{item.count}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                    style={{ width: `${widthPercent}%` }}
                                    className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 5. Revenue Overview Donut Chart
function RevenueOverviewChart({ cash, outstanding }) {
    const total = cash + outstanding;
    const cashPercent = total > 0 ? Math.round((cash / total) * 100) : 0;
    const outstandingPercent = total > 0 ? Math.round((outstanding / total) * 100) : 0;

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (cash / (total || 1)) * circumference;

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex flex-col justify-between h-full">
            <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>💰</span>
                    <span>Revenue Overview</span>
                </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            className="stroke-rose-100"
                            strokeWidth="12"
                            fill="transparent"
                        />
                        {total > 0 && (
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                className="stroke-emerald-600 transition-all duration-500 ease-out"
                                strokeWidth="12"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total expected</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-0.5">₹{total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="space-y-3.5 w-full sm:w-auto min-w-[140px]">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-emerald-600 rounded-full"></span>
                            <span className="text-slate-500 font-medium">Cash Collected</span>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">₹{cash.toLocaleString()}</p>
                            <p className="text-[9px] text-emerald-600 font-semibold">{cashPercent}%</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 bg-rose-200 rounded-full"></span>
                            <span className="text-slate-500 font-medium">Outstanding</span>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-800">₹{outstanding.toLocaleString()}</p>
                            <p className="text-[9px] text-rose-600 font-semibold">{outstandingPercent}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 6. Business Attention Panel (CEO)
function BusinessAttentionPanel({ pendingCount, outstandingAmount, confirmedCount }) {
    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs mb-8">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                <span className="text-slate-900">🔔</span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Business Attention</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                <div className="flex items-center space-x-3.5 py-3.5 px-4 bg-rose-50/40 border border-rose-100/80 rounded-xl">
                    <span className="text-2xl">🔴</span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Waiting Follow-up</p>
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{pendingCount}</strong> leads waiting in queue
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3.5 py-3.5 px-4 bg-amber-50/40 border border-amber-100/80 rounded-xl">
                    <span className="text-2xl">🟡</span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Payments Outstanding</p>
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">₹{outstandingAmount.toLocaleString()}</strong> remains outstanding
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3.5 py-3.5 px-4 bg-emerald-50/40 border border-emerald-100/80 rounded-xl">
                    <span className="text-2xl">🟢</span>
                    <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Trips Confirmed</p>
                        <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{confirmedCount}</strong> bookings ready to execute
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 7. Operations Pipeline Visualizer (Manager)
function OperationsPipelineChart({ pending, inProgress, confirmed, tripStarted, completed, cancelled }) {
    const data = [
        { label: "Pending", count: pending, color: "bg-amber-500", icon: "⏳" },
        { label: "In Progress", count: inProgress, color: "bg-blue-500", icon: "📞" },
        { label: "Confirmed", count: confirmed, color: "bg-emerald-600", icon: "🔒" },
        { label: "Trip Started", count: tripStarted, color: "bg-purple-600", icon: "🚖" },
        { label: "Completed", count: completed, color: "bg-teal-500", icon: "✨" },
        { label: "Cancelled", count: cancelled, color: "bg-rose-500", icon: "❌" }
    ];

    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs mb-8">
            <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>📊</span>
                    <span>Operations Pipeline</span>
                </h3>
            </div>

            <div className="space-y-4 py-2">
                {data.map((item) => {
                    const widthPercent = (item.count / maxCount) * 100;
                    return (
                        <div key={item.label} className="space-y-1">
                            <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                                <span className="flex items-center space-x-1.5">
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </span>
                                <span className="font-bold text-slate-900">{item.count}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                    style={{ width: `${widthPercent}%` }}
                                    className={`h-full ${item.color} rounded-full transition-all duration-500 ease-out`}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 8. Manager Priority Actions Panel
function ManagerPriorityActions({ pendingCount, inProgressCount, confirmedCount }) {
    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                    <span className="text-amber-500">⚡</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Priority Actions</h3>
                </div>
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition">
                        <span className="text-lg">🔴</span>
                        <span className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{pendingCount}</strong> pending leads require follow-up
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition border-t border-slate-100 pt-3">
                        <span className="text-lg">🟡</span>
                        <span className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{inProgressCount}</strong> active leads are currently in progress
                        </span>
                    </div>
                    <div className="flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition border-t border-slate-100 pt-3">
                        <span className="text-lg">🟢</span>
                        <span className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-950 font-bold">{confirmedCount}</strong> confirmed trips require operational planning
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 9. Active / Upcoming Trips Component
function ActiveUpcomingTripsList({ leads }) {
    const activeTripsList = leads.filter(l => l.status === 'Confirmed' || l.status === 'Trip Started');

    return (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
                    <span className="text-purple-600">🚖</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active / Upcoming Trips</h3>
                </div>
                {activeTripsList.length > 0 ? (
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {activeTripsList.slice(0, 5).map((trip) => (
                            <div key={trip._id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 font-sans">
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-950">{trip.name}</p>
                                    <p className="text-[10px] text-slate-500">
                                        📍 Pickup: {trip.pickup || 'Varanasi'} ➔ Destination: {trip.destination || 'Kashi'}
                                    </p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <p className="font-bold text-slate-700">{trip.date || 'TBD'}</p>
                                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                        trip.status === 'Trip Started'
                                            ? 'bg-purple-50 text-purple-700 border border-purple-200/50'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                    }`}>
                                        {trip.status === 'Trip Started' ? 'On Road' : 'Confirmed'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                        No active or upcoming trips found.
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminCRM() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('admin_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [loginMode, setLoginMode] = useState(null); // 'CEO', 'TEAM', or null
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [profileTab, setProfileTab] = useState('overview');
    const [isSaving, setIsSaving] = useState(false);

    // States for Manual Lead creation
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);
    const [manualLead, setManualLead] = useState({
        name: '',
        mobile: '',
        email: '',
        date: '',
        travelers: '1',
        pickup: '',
        destination: 'Varanasi',
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
    });

    // Filter and Search States
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // ⚡ Dynamically reads API host from environment variables with fallback
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

    const handleLogout = useCallback(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setToken('');
        setUser(null);
        setIsAuthenticated(false);
        setLoginMode(null);
        setEmail('');
        setPassword('');
    }, []);

    const fetchLeads = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${BASE_URL}/admin/enquiries`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const resData = await response.json();
            if (resData.success) {
                setLeads(resData.data);
            } else {
                setError(resData.message || 'Data fetch error.');
                if (response.status === 401) {
                    handleLogout();
                }
            }
        } catch {
            setError('Backend engine connection failed.');
        } finally {
            setLoading(false);
        }
    }, [BASE_URL, token, handleLogout]);

    useEffect(() => {
        const verifySession = async () => {
            if (token) {
                try {
                    const response = await fetch(`${BASE_URL}/admin/verify-token`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const resData = await response.json();
                    if (response.ok && resData.success) {
                        setIsAuthenticated(true);
                        setUser(resData.user);
                        localStorage.setItem('admin_user', JSON.stringify(resData.user));
                    } else {
                        handleLogout();
                    }
                } catch {
                    // Fallback to offline local state if server fails but token exists
                    setIsAuthenticated(true);
                }
            }
        };
        verifySession();
    }, [token, BASE_URL, handleLogout]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeads();
        }
    }, [isAuthenticated, fetchLeads]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password || !loginMode) {
            alert('❌ Please enter email, password and select login type.');
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, loginType: loginMode })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                localStorage.setItem('admin_token', resData.token);
                localStorage.setItem('admin_user', JSON.stringify(resData.user));
                setToken(resData.token);
                setUser(resData.user);
                setIsAuthenticated(true);
                // Clear state
                setEmail('');
                setPassword('');
            } else {
                alert('❌ Access Denied: ' + (resData.message || 'Incorrect credentials'));
            }
        } catch {
            alert('❌ Backend authentication service connection failed.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedLead(prev => {
            if (!prev) return null;
            const updated = { ...prev, [name]: value };
            if (name === 'totalAmount' || name === 'advanceAmount') {
                const totalVal = name === 'totalAmount' ? value : updated.totalAmount;
                const advanceVal = name === 'advanceAmount' ? value : updated.advanceAmount;
                const total = Number(totalVal) || 0;
                const advance = Number(advanceVal) || 0;
                updated.remainingAmount = total - advance;
            }
            return updated;
        });
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const response = await fetch(`${BASE_URL}/admin/enquiry/update/${selectedLead._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(selectedLead)
            });
            const resData = await response.json();
            if (resData.success) {
                alert('✅ CRM Master Lead Updated Successfully!');
                setSelectedLead(null);
                fetchLeads();
            } else {
                alert('❌ Save operations error: ' + (resData.message || 'Failed'));
            }
        } catch {
            alert('❌ Engine connection failed.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleManualInputChange = (e) => {
        const { name, value } = e.target;
        setManualLead(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'totalAmount' || name === 'advanceAmount') {
                const totalVal = name === 'totalAmount' ? value : updated.totalAmount;
                const advanceVal = name === 'advanceAmount' ? value : updated.advanceAmount;
                const total = Number(totalVal) || 0;
                const advance = Number(advanceVal) || 0;
                updated.remainingAmount = total - advance;
            }
            return updated;
        });
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();

        if (!manualLead.name || !manualLead.mobile) {
            alert('❌ Name and Mobile number are required!');
            return;
        }

        try {
            setIsSavingManual(true);
            const response = await fetch(`${BASE_URL}/admin/enquiry/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(manualLead)
            });
            const resData = await response.json();
            if (resData.success) {
                alert('🎉 Offline Manual Lead Created Successfully!');
                setIsManualOpen(false);
                setManualLead({
                    name: '', mobile: '', email: '', date: '', travelers: '1', pickup: '',
                    destination: 'Varanasi', specialRequirements: '', status: 'Pending',
                    totalAmount: '', advanceAmount: '', adminNotes: '', driverName: '',
                    driverMobile: '', vehicleModel: '', vehicleNumber: '', hotelDetails: '',
                    panditDetails: '', remarks: ''
                });
                fetchLeads();
            } else {
                alert(`❌ Error creating manual lead: ${resData.message || 'Operation failed'}`);
            }
        } catch (err) {
            console.error('Manual Lead creation error:', err);
            alert('❌ Backend engine connection failed.');
        } finally {
            setIsSavingManual(false);
        }
    };

    // PART 3 & PART 15: Pure Dynamic MongoDB Metric Calculations
    const totalLeads = leads.length;
    const pendingLeads = leads.filter(l => l.status === 'Pending').length;
    const inProgressLeads = leads.filter(l => l.status === 'In-Progress').length;
    const confirmedLeads = leads.filter(l => l.status === 'Confirmed').length;
    const tripStartedLeads = leads.filter(l => l.status === 'Trip Started').length;
    const completedLeads = leads.filter(l => l.status === 'Completed').length; // PART 1: New Completed Leads Card Counter
    const cancelledLeads = leads.filter(l => l.status === 'Cancelled').length;

    // PART 10: Cash in hand & Outstanding balance auto-calculations
    const totalCashInHand = leads.reduce((sum, l) => sum + (l.advanceAmount || 0), 0);
    const totalOutstanding = leads.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

    const convertedCount = confirmedLeads + tripStartedLeads + completedLeads;
    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : "0.0";

    const ceoMetrics = [
        { title: "Total Leads", icon: "📊", value: totalLeads, textColor: "text-slate-400" },
        { title: "Conversion Rate", icon: "📈", value: `${conversionRate}%`, textColor: "text-amber-600" },
        { title: "Cash Collected", icon: "💵", value: `₹${totalCashInHand.toLocaleString()}`, textColor: "text-emerald-700" },
        { title: "Outstanding", icon: "💳", value: `₹${totalOutstanding.toLocaleString()}`, textColor: "text-rose-700" }
    ];

    const managerMetrics = [
        { title: "Total Leads", icon: "📊", value: totalLeads, textColor: "text-slate-400" },
        { title: "Action Required", icon: "⏳", value: pendingLeads, textColor: "text-amber-600" },
        { title: "In Progress", icon: "📞", value: inProgressLeads, textColor: "text-blue-600" },
        { title: "Confirmed", icon: "🔒", value: confirmedLeads, textColor: "text-emerald-600" },
        { title: "Completed", icon: "✨", value: completedLeads, textColor: "text-teal-700" }
    ];

    // PART 12: Comprehensive Search Engine & PART 13: Filters
    const filteredLeads = leads.filter(lead => {
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesStatus;

        const matchesSearch =
            (lead.name && lead.name.toLowerCase().includes(q)) ||
            (lead.mobile && lead.mobile.includes(q)) ||
            (lead.email && lead.email.toLowerCase().includes(q)) ||
            (lead.pickup && lead.pickup.toLowerCase().includes(q)) ||
            (lead.destination && lead.destination.toLowerCase().includes(q)) ||
            (lead.vehicleModel && lead.vehicleModel.toLowerCase().includes(q)) ||
            (lead.vehicleNumber && lead.vehicleNumber.toLowerCase().includes(q)) ||
            (lead.driverName && lead.driverName.toLowerCase().includes(q)) ||
            (lead.driverMobile && lead.driverMobile.includes(q)) ||
            (lead.status && lead.status.toLowerCase().includes(q)) ||
            (lead._id && lead._id.toLowerCase().includes(q));

        return matchesStatus && matchesSearch;
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 select-none">
                {loginMode === null ? (
                    <div className="w-full max-w-4xl text-center space-y-8 py-8 animate-fadeIn">
                        <div className="space-y-2">
                            <span className="text-5xl block mb-4">🚩</span>
                            <h2 className="text-3.5xl font-serif font-extrabold text-amber-100 uppercase tracking-widest">
                                Banaras Yatra
                            </h2>
                            <p className="text-amber-500 text-xs font-bold tracking-widest uppercase">
                                Operations Portal
                            </p>
                            <p className="text-stone-400 text-sm max-w-md mx-auto">
                                Select your authorized access level
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mx-auto mt-8">
                            {/* Card 1: EXECUTIVE ACCESS */}
                            <div className="bg-stone-950 p-8 rounded-3xl border border-amber-500/20 shadow-2xl flex flex-col justify-between items-center text-center hover:border-amber-500/40 transition duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all"></div>
                                <div className="space-y-4 z-10">
                                    <span className="text-5xl block">👑</span>
                                    <h3 className="text-xl font-serif font-bold text-amber-100 uppercase tracking-wider">
                                        EXECUTIVE ACCESS
                                    </h3>
                                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                                        CEO / Owner
                                    </p>
                                    <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
                                        Full operational and business oversight.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLoginMode('CEO')}
                                    className="w-full mt-8 bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer z-10 outline-none focus:ring-1 focus:ring-amber-500"
                                >
                                    PROCEED TO LOGIN
                                </button>
                            </div>

                            {/* Card 2: OPERATIONS ACCESS */}
                            <div className="bg-stone-950 p-8 rounded-3xl border border-stone-850 shadow-2xl flex flex-col justify-between items-center text-center hover:border-stone-700 transition duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-stone-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-stone-500/10 transition-all"></div>
                                <div className="space-y-4 z-10">
                                    <span className="text-5xl block">👥</span>
                                    <h3 className="text-xl font-serif font-bold text-stone-100 uppercase tracking-wider">
                                        OPERATIONS ACCESS
                                    </h3>
                                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                                        Manager / Team
                                    </p>
                                    <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
                                        Manage assigned leads and daily operations.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLoginMode('TEAM')}
                                    className="w-full mt-8 bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-750 text-stone-100 py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer border border-stone-800 z-10 outline-none focus:ring-1 focus:ring-stone-650"
                                >
                                    PROCEED TO LOGIN
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={() => {
                                    try {
                                        window.close();
                                    } catch {
                                        window.location.href = '/';
                                    }
                                    setTimeout(() => {
                                        window.location.href = '/';
                                    }, 100);
                                }}
                                className="inline-flex items-center space-x-2 text-stone-400 hover:text-orange-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer mt-8 select-none focus:outline-none focus:underline"
                            >
                                <span>← BACK TO WEBSITE</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-stone-950 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-amber-500/20 relative overflow-hidden animate-fadeIn">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                        <span className="text-4xl block mb-4">🚩</span>
                        <h2 className="text-2xl font-serif font-bold text-amber-100 uppercase tracking-widest mb-1">
                            Banaras Yatra
                        </h2>

                        {loginMode === 'CEO' ? (
                            <div className="mb-8">
                                <h3 className="text-amber-500 font-serif font-bold tracking-widest text-sm uppercase">
                                    👑 EXECUTIVE ACCESS
                                </h3>
                                <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                                    CEO / OWNER LOGIN
                                </p>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <h3 className="text-stone-300 font-serif font-bold tracking-widest text-sm uppercase">
                                    👥 OPERATIONS ACCESS
                                </h3>
                                <p className="text-stone-400 text-[10px] uppercase font-bold tracking-widest mt-1">
                                    MANAGER / TEAM LOGIN
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block ml-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter Registered Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 border border-stone-800 rounded-xl text-stone-100 bg-stone-900/60 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all text-xs placeholder-stone-600 text-left"
                                />
                            </div>

                            <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block ml-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter Access Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 border border-stone-800 rounded-xl text-stone-100 bg-stone-900/60 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all text-xs placeholder-stone-600 text-left"
                                />
                            </div>

                            <div className="pt-2">
                                {loginMode === 'CEO' ? (
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer"
                                    >
                                        [ SECURE LOGIN ]
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-600 hover:to-stone-750 text-stone-100 py-3.5 rounded-xl font-serif font-bold text-xs tracking-wider transition-all duration-300 shadow-lg cursor-pointer border border-stone-800"
                                    >
                                        [ LOGIN TO OPERATIONS ]
                                    </button>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setLoginMode(null); setEmail(''); setPassword(''); }}
                                    className="text-stone-400 hover:text-orange-400 text-xs font-bold uppercase tracking-wider transition cursor-pointer select-none focus:outline-none focus:underline"
                                >
                                    ← Back to Access Selection
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 sm:p-8 text-slate-700 text-left font-sans antialiased">
            {/* Conditional Role-Based Dashboards */}
            {user && user.role === 'CEO' ? (
                <>
                    {/* CEO DASHBOARD */}
                    <DashboardHeader
                        title="Banaras Yatra Executive Control Center"
                        subtitle="Full Executive Dashboard & Company Financial Command Panel"
                        onAddLead={() => setIsManualOpen(true)}
                        onSync={fetchLeads}
                        onLogout={handleLogout}
                        userIcon="👑"
                    />
                    <ExecutiveKPIs
                        metrics={ceoMetrics}
                    />

                    {/* Responsive Grid: Pipeline Chart + Revenue Donut */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <LeadPipelineChart
                            pending={pendingLeads}
                            inProgress={inProgressLeads}
                            confirmed={confirmedLeads}
                            tripStarted={tripStartedLeads}
                            completed={completedLeads}
                            cancelled={cancelledLeads}
                        />
                        <RevenueOverviewChart
                            cash={totalCashInHand}
                            outstanding={totalOutstanding}
                        />
                    </div>

                    <BusinessAttentionPanel
                        pendingCount={pendingLeads}
                        outstandingAmount={totalOutstanding}
                        confirmedCount={confirmedLeads}
                    />
                </>
            ) : (
                <>
                    {/* MANAGER DASHBOARD */}
                    <DashboardHeader
                        title="Banaras Yatra Operations Console"
                        subtitle="Manager Operations & Daily Dispatch Activity Control Panel"
                        onAddLead={() => setIsManualOpen(true)}
                        onSync={fetchLeads}
                        onLogout={handleLogout}
                        userIcon="👥"
                    />
                    <OperationsKPIs
                        metrics={managerMetrics}
                    />

                    <OperationsPipelineChart
                        pending={pendingLeads}
                        inProgress={inProgressLeads}
                        confirmed={confirmedLeads}
                        tripStarted={tripStartedLeads}
                        completed={completedLeads}
                        cancelled={cancelledLeads}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <ManagerPriorityActions
                            pendingCount={pendingLeads}
                            inProgressCount={inProgressLeads}
                            confirmedCount={confirmedLeads}
                        />
                        <ActiveUpcomingTripsList
                            leads={leads}
                        />
                    </div>
                </>
            )}

            {/* Filter and Search Action bar */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4.5 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
                {/* Search query box */}
                <div className="w-full md:max-w-xl relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search by customer, mobile, email, destination, pickup, vehicle, or driver..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10 transition-all text-slate-800 placeholder-slate-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer"
                        >
                            &times;
                        </button>
                    )}
                </div>

                {/* Filter and reset helpers */}
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3.5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                        Showing: <span className="text-slate-800 font-extrabold">{statusFilter}</span> ({filteredLeads.length})
                    </span>
                    {(statusFilter !== 'All' || searchQuery) && (
                        <button
                            onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
                            className="text-[10px] uppercase tracking-wider font-bold text-amber-600 hover:text-amber-800 px-3.5 py-2 bg-amber-50/60 rounded-lg transition cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Leads grid table container */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-8 h-8 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 animate-pulse">Loading Operational Grid Records...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-rose-500 text-sm font-semibold select-none">
                        ⚠️ {error}
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 text-xs font-medium leading-relaxed select-none">
                        📭 No enquiries match your active filter/search query.
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                        <table className="w-full text-left border-collapse relative">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200/85 text-slate-400 uppercase text-[10px] font-bold tracking-widest select-none sticky top-0 bg-opacity-95 backdrop-blur-xs z-10">
                                    <th className="p-5">Customer & Origin</th>
                                    <th className="p-5">Travel Plan & Destination</th>
                                    <th className="p-5">Pipeline Status</th>
                                    {user && user.role === 'CEO' && <th className="p-5">Financials</th>}
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-slate-50/40 even:bg-slate-50/10 transition duration-150">

                                        {/* Customer & Origin */}
                                        <td className="p-5 space-y-1.5">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-slate-900 text-base">{lead.name}</span>
                                                {lead.createdBy && (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                                                        lead.createdBy === 'Website' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {lead.createdBy}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.302a12.01 12.01 0 01-5.3-5.3c-.44-.441-.274-.927.102-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                    </svg>
                                                    <a href={`tel:${lead.mobile}`} className="hover:text-amber-600 hover:underline">{lead.mobile}</a>
                                                </div>

                                                {lead.email && lead.email !== 'offline-client@banarasyatra.com' && (
                                                    <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                        </svg>
                                                        <a href={`mailto:${lead.email}`} className="hover:text-amber-600 hover:underline">{lead.email}</a>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-0.5">
                                                <a
                                                    href={`https://wa.me/91${lead.mobile.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-all"
                                                >
                                                    <svg className="w-3 h-3 text-emerald-600 fill-current" viewBox="0 0 24 24">
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.845-4.414 9.848-9.847.002-2.632-1.023-5.105-2.887-6.97C17.152 1.922 14.68 .898 12.01 .898c-5.43 0-9.847 4.414-9.85 9.849-.001 1.932.501 3.815 1.455 5.421L2.642 22.28l6.005-1.574zM17.92 14.87c-.318-.16-1.877-.926-2.162-1.03-.285-.104-.493-.155-.7.156-.207.31-.8.926-.98 1.132-.18.207-.36.233-.678.074-1.69-.844-2.8-1.522-3.922-3.447-.297-.51.297-.474.85-1.583.093-.187.047-.35-.023-.454-.07-.104-.7-1.682-.958-2.306-.252-.603-.509-.522-.7-.522-.181-.001-.389-.001-.597-.001-.207 0-.544.078-.83.392-.285.31-1.088 1.065-1.088 2.597 0 1.532 1.114 3.013 1.27 3.22.155.207 2.193 3.349 5.313 4.699.742.32 1.322.512 1.774.656.745.237 1.423.204 1.959.124.598-.09 1.877-.767 2.137-1.474.26-.707.26-1.316.182-1.443-.078-.127-.285-.207-.604-.367z" />
                                                    </svg>
                                                    <span>WhatsApp Chat</span>
                                                </a>
                                            </div>
                                        </td>

                                        {/* Travel Plan & Destination */}
                                        <td className="p-5 space-y-1.5">
                                            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                                <span>{lead.date || 'Flexible Date'}</span>
                                            </div>

                                            <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                <span>📍 Pickup: <strong className="text-slate-700">{lead.pickup || 'Varanasi'}</strong></span>
                                            </div>

                                            <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                <span>🗺️ Target: <strong className="text-amber-700">{lead.destination || 'Varanasi'}</strong> ({lead.travelers || '1'} Pax)</span>
                                            </div>
                                        </td>

                                        {/* Pipeline Status */}
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all duration-150 select-none cursor-pointer ${
                                                lead.status === 'Completed' ? 'bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs' :
                                                lead.status === 'Trip Started' ? 'bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs' :
                                                lead.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs' :
                                                lead.status === 'In-Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs' :
                                                lead.status === 'Cancelled' ? 'bg-rose-50/80 text-rose-700 border border-rose-200/60 shadow-xs' :
                                                'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs'
                                            }`}>
                                                {lead.status === 'Completed' ? '✅ Completed' :
                                                 lead.status === 'Trip Started' ? '🚖 Trip Started' :
                                                 lead.status === 'Confirmed' ? '🟢 Confirmed' :
                                                 lead.status === 'In-Progress' ? '🔵 In-Progress' :
                                                 lead.status === 'Cancelled' ? '🔴 Cancelled' : '🟡 Pending'}
                                            </span>
                                        </td>

                                        {/* Financial records */}
                                        {user && user.role === 'CEO' && (
                                            <td className="p-5 space-y-1 select-none">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Package Value</span>
                                                    <span className="text-sm font-bold text-slate-900">₹{lead.totalAmount || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                                    <span>Paid: <span className="font-bold text-slate-700">₹{lead.advanceAmount || 0}</span></span>
                                                    <span className={`px-1.5 py-0.5 rounded-md border font-bold ${
                                                        lead.remainingAmount > 0
                                                            ? 'bg-rose-50 text-rose-700 border-rose-100/80'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200/60'
                                                    }`}>
                                                        Due: ₹{lead.remainingAmount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {/* Main Row CTA action */}
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => { setSelectedLead(lead); setProfileTab('overview'); }}
                                                className="bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition duration-200 cursor-pointer"
                                            >
                                                Open Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PART 7, 8, 9: Master CRM Customer Profile Side Drawer */}
            {selectedLead && (
                <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
                    {/* Backdrop closer */}
                    <div className="absolute inset-0" onClick={() => setSelectedLead(null)}></div>

                    {/* Drawer Content */}
                    <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-stone-200 relative z-10 transform translate-x-0 transition-transform duration-300">
                        {/* Header Status Accent Strip */}
                        <div className={`h-2.5 w-full bg-gradient-to-r ${getStatusGradient(selectedLead.status)}`}></div>

                        {/* Drawer Header */}
                        <div className="p-6 pb-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/15">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-lg font-serif font-bold text-stone-900">👤 Master Lead Profile</h3>
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">{selectedLead.status}</span>
                                </div>
                                <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mt-1">Single Source of Truth Operational Controls</p>
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Profile Navigation Tabs */}
                        <div className="flex border-b border-stone-200 bg-stone-50/50 px-6 pt-2 overflow-x-auto gap-2">
                            <button
                                onClick={() => setProfileTab('overview')}
                                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2 cursor-pointer ${
                                    profileTab === 'overview' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                                }`}
                            >
                                📋 Overview & Client
                            </button>
                            <button
                                onClick={() => setProfileTab('operations')}
                                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2 cursor-pointer ${
                                    profileTab === 'operations' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                                }`}
                            >
                                🚖 Transport & Vendors
                            </button>
                            {user && user.role === 'CEO' && (
                                <button
                                    onClick={() => setProfileTab('financials')}
                                    className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2 cursor-pointer ${
                                        profileTab === 'financials' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                                    }`}
                                >
                                    💰 Financials
                                </button>
                            )}
                            <button
                                onClick={() => setProfileTab('notes')}
                                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2 cursor-pointer ${
                                    profileTab === 'notes' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                                }`}
                            >
                                📝 Notes & Docs
                            </button>
                            <button
                                onClick={() => setProfileTab('history')}
                                className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2 cursor-pointer ${
                                    profileTab === 'history' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                                }`}
                            >
                                📜 Audit Log
                            </button>
                        </div>

                        {/* Drawer Form */}
                        <form onSubmit={handleSaveChanges} className="flex-1 flex flex-col justify-between overflow-hidden">
                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* TAB 1: OVERVIEW & CLIENT */}
                                {profileTab === 'overview' && (
                                    <div className="space-y-5">
                                        <div className="bg-stone-50 border border-stone-200/70 p-4 rounded-2xl space-y-3">
                                            <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest border-b border-stone-200/50 pb-1.5 flex justify-between">
                                                <span>Customer Contact Coordinates</span>
                                                <span>Created By: {selectedLead.createdBy || 'Website'}</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={selectedLead.name || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Mobile</label>
                                                    <input
                                                        type="tel"
                                                        name="mobile"
                                                        value={selectedLead.mobile || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={selectedLead.email || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50/40 border border-amber-200/60 p-4 rounded-2xl space-y-3">
                                            <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest border-b border-amber-200/50 pb-1.5">
                                                Travel Requirements & Locations
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Pickup Location</label>
                                                    <input
                                                        type="text"
                                                        name="pickup"
                                                        value={selectedLead.pickup || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Target Destination</label>
                                                    <input
                                                        type="text"
                                                        name="destination"
                                                        value={selectedLead.destination || 'Varanasi'}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Travel Date</label>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        value={selectedLead.date || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none cursor-pointer"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Travelers Count</label>
                                                    <input
                                                        type="text"
                                                        name="travelers"
                                                        value={selectedLead.travelers || '1'}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Special Requirements</label>
                                                    <textarea
                                                        name="specialRequirements"
                                                        value={selectedLead.specialRequirements || ''}
                                                        onChange={handleInputChange}
                                                        rows="2"
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-medium focus:outline-none"
                                                        placeholder="Elderly assistance, Wheelchair, Boat ride, VIP Darshan..."
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PART 2 & PART 14: Master Status Workflow Control */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Operational Pipeline Status Workflow</label>
                                            <select
                                                name="status"
                                                value={selectedLead.status}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-300 rounded-xl p-3 bg-stone-50 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer text-sm"
                                            >
                                                <option value="Pending">🟡 Pending (New Enquiry)</option>
                                                <option value="In-Progress">🔵 In-Progress (Follow-up / Quoting)</option>
                                                <option value="Confirmed">🟢 Confirmed (Package Locked & Advance Received)</option>
                                                <option value="Trip Started">🚖 Trip Started (Tour Active / Driver En Route)</option>
                                                <option value="Completed">✅ Completed (Trip Finished & Settled)</option>
                                                <option value="Cancelled">🔴 Cancelled (Dropped / Refunded)</option>
                                            </select>
                                        </div>

                                        {selectedLead.status === 'In-Progress' && (
                                            <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                                                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1.5">Next Follow-up Date</label>
                                                <input
                                                    type="date"
                                                    name="followUpDate"
                                                    value={selectedLead.followUpDate || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full border border-stone-200 focus:border-blue-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm cursor-pointer"
                                                />
                                            </div>
                                        )}

                                        {selectedLead.status === 'Cancelled' && (
                                            <div className="bg-red-50/40 p-4 rounded-2xl border border-red-100">
                                                <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1.5">Reason for Cancellation</label>
                                                <select
                                                    name="cancellationReason"
                                                    value={selectedLead.cancellationReason || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full border border-stone-200 focus:border-red-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none cursor-pointer text-xs sm:text-sm"
                                                >
                                                    <option value="">-- Select Reason --</option>
                                                    <option value="Budget Issue">💸 Budget Issue</option>
                                                    <option value="Dates Changed">📅 Dates Changed</option>
                                                    <option value="No Response">🔇 No Response / Ghosted</option>
                                                    <option value="Booked Elsewhere">🏨 Booked Elsewhere</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 2: TRANSPORT & VENDORS */}
                                {profileTab === 'operations' && (
                                    <div className="space-y-4">
                                        <div className="bg-purple-50/30 border border-purple-200/50 p-4 rounded-2xl space-y-3">
                                            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest border-b border-purple-200/40 pb-1.5">Driver & Vehicle Assignment</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Driver Name</label>
                                                    <input
                                                        type="text"
                                                        name="driverName"
                                                        value={selectedLead.driverName || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                        placeholder="e.g. Rajesh Kumar"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Driver Mobile</label>
                                                    <input
                                                        type="tel"
                                                        name="driverMobile"
                                                        value={selectedLead.driverMobile || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                        placeholder="e.g. 9876543210"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Vehicle Model / Type</label>
                                                    <input
                                                        type="text"
                                                        name="vehicleModel"
                                                        value={selectedLead.vehicleModel || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                        placeholder="e.g. Innova Crysta / Dzire"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Vehicle Number</label>
                                                    <input
                                                        type="text"
                                                        name="vehicleNumber"
                                                        value={selectedLead.vehicleNumber || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                        placeholder="e.g. UP 65 AB 1234"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-teal-50/30 border border-teal-200/50 p-4 rounded-2xl space-y-3">
                                            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-widest border-b border-teal-200/40 pb-1.5">Hotel & Guide/Pandit Allocations</h4>
                                            <div className="space-y-3 text-xs">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Hotel Accommodations & Rooms</label>
                                                    <input
                                                        type="text"
                                                        name="hotelDetails"
                                                        value={selectedLead.hotelDetails || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none"
                                                        placeholder="e.g. Hotel Clarks Varanasi (2 Deluxe Rooms, 3 Nights)"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Assigned Pandit / Tour Guide</label>
                                                    <input
                                                        type="text"
                                                        name="panditDetails"
                                                        value={selectedLead.panditDetails || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none"
                                                        placeholder="e.g. Pt. Ramesh Shastri (Special Rudrabhishek & Ganga Aarti VIP)"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: FINANCIALS */}
                                {profileTab === 'financials' && user && user.role === 'CEO' && (
                                    <div className="space-y-4">
                                        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-4">
                                            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest border-b border-emerald-200/50 pb-1.5">Package Value & Payment Ledger</h4>

                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Total Package Cost (Package Value)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        name="totalAmount"
                                                        value={selectedLead.totalAmount || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                                        placeholder="Enter total package cost"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Advance Token Received (Paid Amount)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        name="advanceAmount"
                                                        value={selectedLead.advanceAmount || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                                        placeholder="Enter advance token paid"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Balance Outstanding (Auto-Calculated 🔒)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        name="remainingAmount"
                                                        value={selectedLead.remainingAmount || 0}
                                                        readOnly
                                                        className="w-full border border-stone-200 rounded-xl pl-8 pr-4 py-2.5 bg-stone-100 text-stone-600 font-extrabold cursor-not-allowed text-xs sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: INTERNAL NOTES & DOCUMENTS */}
                                {profileTab === 'notes' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">📝 Internal Admin Notes</label>
                                            <textarea
                                                name="adminNotes"
                                                value={selectedLead.adminNotes || ''}
                                                onChange={handleInputChange}
                                                rows="6"
                                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-3.5 bg-white text-stone-900 font-semibold focus:outline-none transition-all text-xs sm:text-sm"
                                                placeholder="Add confidential operator notes, special requests, call feedback, or itinerary tweaks..."
                                            ></textarea>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: AUDIT LOG TIMELINE */}
                                {profileTab === 'history' && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-widest border-b border-stone-200 pb-2">Status Audit History Log</h4>
                                        {selectedLead.statusHistory && selectedLead.statusHistory.length > 0 ? (
                                            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-stone-200">
                                                {selectedLead.statusHistory.map((item, idx) => (
                                                    <div key={idx} className="relative pl-7 space-y-1">
                                                        <div className="absolute left-1.5 top-1.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-xs"></div>
                                                        <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="font-extrabold text-stone-900">{item.previousStatus} ➔ <span className="text-amber-700">{item.newStatus}</span></span>
                                                                <span className="text-[10px] font-bold text-stone-400">{new Date(item.updatedTime).toLocaleString()}</span>
                                                            </div>
                                                            <div className="text-[11px] text-stone-600 mt-1 font-medium">{item.remarks}</div>
                                                            <div className="text-[9px] font-bold text-stone-400 mt-1 uppercase">By: {item.updatedBy}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-stone-400 font-medium italic">No prior status audit records recorded.</p>
                                        )}
                                    </div>
                                )}

                                {/* Update Remarks Input Field */}
                                <div className="border-t border-stone-200 pt-4">
                                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1.5">Action Remarks / Log Note</label>
                                    <input
                                        type="text"
                                        name="remarks"
                                        value={selectedLead.remarks || ''}
                                        onChange={handleInputChange}
                                        className="w-full border border-stone-300 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-medium text-xs focus:outline-none"
                                        placeholder="Reason or notes for this status/profile update..."
                                    />
                                </div>

                            </div>

                            {/* Sticky Save actions Footer */}
                            <div className="p-6 border-t border-stone-100 bg-stone-50/40 flex space-x-3.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedLead(null)}
                                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-stone-900 hover:bg-amber-600 text-white py-3.5 rounded-xl font-serif font-bold uppercase tracking-widest text-xs transition duration-200 shadow-md disabled:bg-stone-300 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving Changes...' : 'Save Lead Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Slide-over Slide-in Right side manual lead creation drawer */}
            {isManualOpen && (
                <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
                    {/* Backdrop closer */}
                    <div className="absolute inset-0" onClick={() => setIsManualOpen(false)}></div>

                    {/* Drawer Content */}
                    <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-stone-200 relative z-10 transform translate-x-0 transition-transform duration-300">
                        {/* Header Status Accent Strip */}
                        <div className="h-2.5 w-full bg-gradient-to-r from-amber-500 to-orange-600"></div>

                        {/* Drawer Header */}
                        <div className="p-6 sm:p-8 pb-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/15">
                            <div>
                                <h3 className="text-lg font-serif font-bold text-stone-900">➕ Add Manual Lead</h3>
                                <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mt-1">Record Offline Booking</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsManualOpen(false)}
                                className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Drawer Form */}
                        <form onSubmit={handleManualSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Customer Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={manualLead.name}
                                        onChange={handleManualInputChange}
                                        required
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={manualLead.mobile}
                                        onChange={handleManualInputChange}
                                        required
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                        placeholder="Enter 10-digit number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={manualLead.email}
                                        onChange={handleManualInputChange}
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                        placeholder="customer@email.com (optional)"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Travel Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={manualLead.date}
                                            onChange={handleManualInputChange}
                                            className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Travelers Count</label>
                                        <input
                                            type="number"
                                            name="travelers"
                                            value={manualLead.travelers}
                                            onChange={handleManualInputChange}
                                            className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                            placeholder="1"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Pickup Location</label>
                                        <input
                                            type="text"
                                            name="pickup"
                                            value={manualLead.pickup}
                                            onChange={handleManualInputChange}
                                            className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                            placeholder="Varanasi Airport / Station"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Destination</label>
                                        <input
                                            type="text"
                                            name="destination"
                                            value={manualLead.destination}
                                            onChange={handleManualInputChange}
                                            className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                            placeholder="Varanasi / Ayodhya / Bodhgaya"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Lead Status</label>
                                    <select
                                        name="status"
                                        value={manualLead.status}
                                        onChange={handleManualInputChange}
                                        className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50 text-stone-900 font-bold focus:ring-1 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
                                    >
                                        <option value="Pending">🟡 Pending (New Enquiry)</option>
                                        <option value="In-Progress">🔵 In-Progress (Follow-up)</option>
                                        <option value="Confirmed">🟢 Confirmed (Trip Locked)</option>
                                        <option value="Trip Started">🚖 Trip Started (Active)</option>
                                        <option value="Completed">✅ Completed (Finished)</option>
                                        <option value="Cancelled">🔴 Cancelled (Dropped)</option>
                                    </select>
                                </div>

                                {user && user.role === 'CEO' && (manualLead.status === 'Confirmed' || manualLead.status === 'Trip Started' || manualLead.status === 'Completed') && (
                                    <div className="bg-emerald-50/40 p-4.5 rounded-2xl border border-emerald-100 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Total Package Cost</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    name="totalAmount"
                                                    value={manualLead.totalAmount}
                                                    onChange={handleManualInputChange}
                                                    className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0 text-xs sm:text-sm"
                                                    placeholder="Enter total amount"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Advance Token Received</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    name="advanceAmount"
                                                    value={manualLead.advanceAmount}
                                                    onChange={handleManualInputChange}
                                                    className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0 text-xs sm:text-sm"
                                                    placeholder="Enter advance received"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">📝 Internal Notes</label>
                                    <textarea
                                        name="adminNotes"
                                        value={manualLead.adminNotes}
                                        onChange={handleManualInputChange}
                                        rows="4"
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-3.5 bg-white text-stone-900 font-semibold focus:outline-none transition-all text-xs sm:text-sm"
                                        placeholder="Add booking notes, preferences, or offline context here..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Sticky Save actions Footer */}
                            <div className="p-6 border-t border-stone-100 bg-stone-50/40 flex space-x-3.5">
                                <button
                                    type="button"
                                    onClick={() => setIsManualOpen(false)}
                                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingManual}
                                    className="flex-1 bg-stone-900 hover:bg-amber-600 text-white py-3.5 rounded-xl font-serif font-bold uppercase tracking-widest text-xs transition duration-200 shadow-md disabled:bg-stone-300 disabled:cursor-not-allowed"
                                >
                                    {isSavingManual ? 'Saving...' : 'Save Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
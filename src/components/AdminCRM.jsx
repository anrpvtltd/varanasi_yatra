import React, { useState, useEffect, useCallback } from 'react';

const getStatusGradient = (status) => {
    switch (status) {
        case 'Confirmed': return 'from-emerald-500 to-teal-600';
        case 'In-Progress': return 'from-blue-500 to-indigo-600';
        case 'Cancelled': return 'from-rose-500 to-red-600';
        default: return 'from-amber-400 to-orange-500';
    }
};

export default function AdminCRM() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('admin_authenticated') === 'true';
    });
    const [pin, setPin] = useState('');
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
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
        status: 'Pending',
        totalAmount: '',
        advanceAmount: '',
        adminNotes: ''
    });


    // Filter and Search States
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // ⚡ Dynamically reads API host from environment variables with fallback
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${BASE_URL}/admin/enquiries`);
            const resData = await response.json();
            if (resData.success) {
                setLeads(resData.data);
            } else {
                setError('Data fetch error.');
            }
        } catch {
            setError('Backend engine connection failed.');
        } finally {
            setLoading(false);
        }
    }, [BASE_URL]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchLeads();
        }
    }, [isAuthenticated, fetchLeads]);

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${BASE_URL}/admin/verify-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                sessionStorage.setItem('admin_authenticated', 'true');
                setIsAuthenticated(true);
            } else {
                alert('❌ Access Denied: ' + (resData.message || 'Incorrect PIN'));
                setPin('');
            }
        } catch {
            alert('❌ Backend authentication service connection failed.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSelectedLead(prev => {
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedLead)
            });
            const resData = await response.json();
            if (resData.success) {
                alert('✅ Updates Saved & Swapped Successfully!');
                setSelectedLead(null);
                fetchLeads();
            } else {
                alert('❌ Save operations error.');
            }
        } catch {
            alert('❌ Engine connection failed.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleManualInputChange = (e) => {
        const { name, value } = e.target;
        setManualLead(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: name and mobile are required
        if (!manualLead.name || !manualLead.mobile) {
            alert('❌ Name and Mobile number are required!');
            return;
        }

        try {
            setIsSavingManual(true);
            const response = await fetch(`${BASE_URL}/admin/enquiry/manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manualLead)
            });
            const resData = await response.json();
            if (resData.success) {
                alert('🎉 Offline Manual Lead Created Successfully!');
                setIsManualOpen(false);
                setManualLead({
                    name: '',
                    mobile: '',
                    email: '',
                    date: '',
                    travelers: '1',
                    pickup: '',
                    status: 'Pending',
                    totalAmount: '',
                    advanceAmount: '',
                    adminNotes: ''
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


    // Calculate metrics based on total leads
    const totalLeads = leads.length;
    const pendingLeads = leads.filter(l => l.status === 'Pending').length;
    const inProgressLeads = leads.filter(l => l.status === 'In-Progress').length;
    const confirmedLeads = leads.filter(l => l.status === 'Confirmed').length;
    const cancelledLeads = leads.filter(l => l.status === 'Cancelled').length;
    const totalCashInHand = leads.reduce((sum, l) => sum + (l.advanceAmount || 0), 0);
    const totalOutstanding = leads.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

    // Filter leads on client side dynamically
    const filteredLeads = leads.filter(lead => {
        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
        const matchesSearch = 
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            lead.mobile.includes(searchQuery) ||
            (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (lead.pickup && lead.pickup.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
                <div className="bg-stone-950 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-amber-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    <span className="text-4xl block mb-4">🚩</span>
                    <h2 className="text-2xl font-serif font-bold text-amber-100 uppercase tracking-widest mb-2">Banaras Yatra</h2>
                    <p className="text-stone-400 text-xs tracking-wider uppercase mb-8">Admin Control Center</p>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter Access PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full px-4 py-3.5 border border-stone-800 rounded-xl text-center text-stone-100 bg-stone-900/60 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all font-bold tracking-widest placeholder-stone-600"
                        />
                        <button type="submit" className="w-full bg-gradient-to-r from-orange-700 to-amber-700 hover:from-orange-600 hover:to-amber-600 text-white py-3.5 rounded-xl font-serif font-bold tracking-wider transition-all duration-300 shadow-lg cursor-pointer">
                            🔓 Unlock Portal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 sm:p-8 text-slate-700 text-left font-sans antialiased">
            {/* Header section */}
            <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-1 z-10">
                    <div className="flex items-center space-x-2.5">
                        <span className="text-xl">🚩</span>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Banaras Yatra Operations</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Real-time Lead Inquiries & Booking Pipeline Dashboard</p>
                </div>
                <div className="mt-4 sm:mt-0 z-10 flex flex-wrap gap-3">
                    <button 
                        onClick={() => setIsManualOpen(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm shadow-amber-600/10 flex items-center space-x-1.5"
                    >
                        <span>➕</span>
                        <span>Add Manual Lead</span>
                    </button>
                    <button 
                        onClick={fetchLeads} 
                        className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-xs sm:text-sm px-4.5 py-2.5 transition duration-200 cursor-pointer shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        <span>Sync Data</span>
                    </button>
                </div>
            </div>

            {/* Metric Summary Cards / Clickable tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                {/* Total Leads */}
                <div 
                    onClick={() => setStatusFilter('All')}
                    className={`bg-white p-5 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'All' 
                            ? 'border-slate-800 shadow-sm ring-1 ring-slate-900/5 bg-slate-50/20' 
                            : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total Leads</p>
                        <span className="text-slate-400">📊</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">{totalLeads}</p>
                </div>

                {/* Pending */}
                <div 
                    onClick={() => setStatusFilter('Pending')}
                    className={`bg-white p-5 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'Pending' 
                            ? 'border-amber-500 shadow-sm ring-1 ring-amber-500/10 bg-amber-50/10' 
                            : 'border-slate-200/80 hover:border-amber-300 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600">🟡 Pending</p>
                        <span className="text-amber-400">⏳</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">{pendingLeads}</p>
                </div>

                {/* In-Progress */}
                <div 
                    onClick={() => setStatusFilter('In-Progress')}
                    className={`bg-white p-5 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'In-Progress' 
                            ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/10 bg-blue-50/10' 
                            : 'border-slate-200/80 hover:border-blue-300 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">🔵 In-Progress</p>
                        <span className="text-blue-400">📞</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">{inProgressLeads}</p>
                </div>

                {/* Confirmed */}
                <div 
                    onClick={() => setStatusFilter('Confirmed')}
                    className={`bg-white p-5 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'Confirmed' 
                            ? 'border-emerald-600 shadow-sm ring-1 ring-emerald-600/10 bg-emerald-50/10' 
                            : 'border-slate-200/80 hover:border-emerald-300 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">🟢 Confirmed</p>
                        <span className="text-emerald-500">✅</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">{confirmedLeads}</p>
                </div>

                {/* Cancelled */}
                <div 
                    onClick={() => setStatusFilter('Cancelled')}
                    className={`bg-white p-5 rounded-xl border transition-all duration-200 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'Cancelled' 
                            ? 'border-red-500 shadow-sm ring-1 ring-red-500/10 bg-red-50/10' 
                            : 'border-slate-200/80 hover:border-red-300 shadow-xs'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-red-600">🔴 Cancelled</p>
                        <span className="text-red-400">❌</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">{cancelledLeads}</p>
                </div>

                {/* Cash In-Hand */}
                <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-xs">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">💰 Cash In-Hand</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-800 tracking-tight mt-2">₹{totalCashInHand}</p>
                </div>

                {/* Outstanding */}
                <div className="bg-rose-50/40 p-5 rounded-xl border border-rose-100 shadow-xs">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-rose-700">⏳ Outstanding</p>
                    <p className="text-2xl sm:text-3xl font-bold text-rose-800 tracking-tight mt-2">₹{totalOutstanding}</p>
                </div>
            </div>

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
                        placeholder="Search by customer name, mobile, email or pickup location..."
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
                        <p className="text-xs uppercase tracking-widest font-bold text-slate-400 animate-pulse">Loading Grid Records...</p>
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
                                    <th className="p-5">Customer Details</th>
                                    <th className="p-5">Travel Plan</th>
                                    <th className="p-5">Pipeline Status</th>
                                    <th className="p-5">Financials</th>
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-slate-50/40 even:bg-slate-50/10 transition duration-150">
                                        
                                        {/* Customer Details */}
                                        <td className="p-5 space-y-1.5">
                                            <div className="font-semibold text-slate-900 text-base">{lead.name}</div>
                                            
                                            <div className="space-y-1">
                                                {/* Phone Number */}
                                                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.302a12.01 12.01 0 01-5.3-5.3c-.44-.441-.274-.927.102-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                    </svg>
                                                    <a href={`tel:${lead.mobile}`} className="hover:text-amber-600 hover:underline">{lead.mobile}</a>
                                                </div>

                                                {/* Email Address */}
                                                {lead.email && lead.email !== 'offline-client@banarasyatra.com' && (
                                                    <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                        </svg>
                                                        <a href={`mailto:${lead.email}`} className="hover:text-amber-600 hover:underline">{lead.email}</a>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chat Button */}
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

                                        {/* Travel Plan details */}
                                        <td className="p-5 space-y-1.5">
                                            {/* Travel Date */}
                                            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                                <span>{lead.date || 'Flexible Date'}</span>
                                            </div>

                                            {/* Pickup Point */}
                                            <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                                                </svg>
                                                <span>📍 {lead.pickup || 'Custom Pickup'}</span>
                                            </div>

                                            {/* Number of Travelers */}
                                            <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                </svg>
                                                <span>👤 {lead.travelers || '1'} Travelers</span>
                                            </div>
                                        </td>

                                        {/* Pipeline Status */}
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all duration-150 hover:scale-105 select-none cursor-pointer ${
                                                lead.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs' :
                                                lead.status === 'In-Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs' :
                                                lead.status === 'Cancelled' ? 'bg-rose-50/80 text-rose-700 border border-rose-200/60 shadow-xs' : 
                                                'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs'
                                            }`}>
                                                {lead.status === 'Confirmed' ? '🟢 Confirmed' :
                                                 lead.status === 'In-Progress' ? '🔵 In-Progress' :
                                                 lead.status === 'Cancelled' ? '🔴 Cancelled' : '🟡 Pending'}
                                            </span>
                                        </td>

                                        {/* Financial records */}
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

                                        {/* Main Row CTA action */}
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => setSelectedLead(lead)} 
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

            {/* Slide-over Slide-in Right side control drawer */}
            {selectedLead && (
                <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
                    {/* Backdrop closer */}
                    <div className="absolute inset-0" onClick={() => setSelectedLead(null)}></div>

                    {/* Drawer Content */}
                    <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-stone-200 relative z-10 transform translate-x-0 transition-transform duration-300">
                        {/* Header Status Accent Strip */}
                        <div className={`h-2.5 w-full bg-gradient-to-r ${getStatusGradient(selectedLead.status)}`}></div>

                        {/* Drawer Header */}
                        <div className="p-6 sm:p-8 pb-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/15">
                            <div>
                                <h3 className="text-lg font-serif font-bold text-stone-900">👤 Lead Control Center</h3>
                                <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mt-1">Configure Booking Parameters</p>
                            </div>
                            <button 
                                onClick={() => setSelectedLead(null)} 
                                className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Drawer Form */}
                        <form onSubmit={handleSaveChanges} className="flex-1 flex flex-col justify-between overflow-hidden">
                            {/* Scrollable Form Body */}
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                                
                                {/* 👤 Customer Quick Details Card */}
                                <div className="bg-stone-50 border border-stone-200/60 p-4.5 rounded-2xl space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between border-b border-stone-200/40 pb-2">
                                        <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Customer Profile</span>
                                        {selectedLead.createdAt && (
                                            <span className="text-[9px] font-bold text-stone-400">
                                                📅 {new Date(selectedLead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2.5 text-xs text-stone-600 font-semibold">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-stone-400">👤</span>
                                            <span className="text-stone-900 font-bold">{selectedLead.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-stone-400">📞</span>
                                            <a href={`tel:${selectedLead.mobile}`} className="text-amber-600 hover:underline">{selectedLead.mobile}</a>
                                        </div>
                                        {selectedLead.email && selectedLead.email !== 'offline-client@banarasyatra.com' && (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-stone-400">✉️</span>
                                                <a href={`mailto:${selectedLead.email}`} className="text-stone-700 hover:underline break-all">{selectedLead.email}</a>
                                            </div>
                                        )}
                                        <div className="flex items-start space-x-2">
                                            <span className="text-stone-400 mt-0.5">📍</span>
                                            <span className="text-stone-800 leading-tight">
                                                {selectedLead.pickup || 'Direct Visit'} • <span className="text-amber-700 font-extrabold">{selectedLead.travelers || '1'} Travelers</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pipeline status control dropdown */}
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Pipeline Status</label>
                                    <select 
                                        name="status" 
                                        value={selectedLead.status} 
                                        onChange={handleInputChange} 
                                        className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50 text-stone-900 font-bold focus:ring-1 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
                                    >
                                        <option value="Pending">🟡 Pending (New Enquiry)</option>
                                        <option value="In-Progress">🔵 In-Progress (Follow-up)</option>
                                        <option value="Confirmed">🟢 Confirmed (Trip Locked)</option>
                                        <option value="Cancelled">🔴 Cancelled (Dropped)</option>
                                    </select>
                                </div>

                                {/* Conditional confirmed financial fields */}
                                {selectedLead.status === 'Confirmed' && (
                                    <div className="bg-emerald-50/40 p-4.5 rounded-2xl border border-emerald-100 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Total Package Cost</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                                <input 
                                                    type="number" 
                                                    name="totalAmount" 
                                                    value={selectedLead.totalAmount || ''} 
                                                    onChange={handleInputChange} 
                                                    className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0 text-xs sm:text-sm" 
                                                    placeholder="Enter total quote amount"
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
                                                    value={selectedLead.advanceAmount || ''} 
                                                    onChange={handleInputChange} 
                                                    className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0 text-xs sm:text-sm" 
                                                    placeholder="Enter advance received"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Balance Outstanding (Locked 🔒)</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                                                <input 
                                                    type="number" 
                                                    name="remainingAmount" 
                                                    value={selectedLead.remainingAmount || 0} 
                                                    readOnly 
                                                    className="w-full border border-stone-200 rounded-xl pl-8 pr-4 py-2.5 bg-stone-100 text-stone-500 font-extrabold cursor-not-allowed focus:outline-none text-xs sm:text-sm" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Conditional follow-up fields */}
                                {selectedLead.status === 'In-Progress' && (
                                    <div className="bg-blue-50/40 p-4.5 rounded-2xl border border-blue-100">
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

                                {/* Conditional cancellation fields */}
                                {selectedLead.status === 'Cancelled' && (
                                    <div className="bg-red-50/40 p-4.5 rounded-2xl border border-red-100">
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
                                        </select>
                                    </div>
                                )}

                                {/* Internal notes */}
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">📝 Internal Admin Notes</label>
                                    <textarea 
                                        name="adminNotes" 
                                        value={selectedLead.adminNotes || ''} 
                                        onChange={handleInputChange} 
                                        rows="5" 
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-3.5 bg-white text-stone-900 font-semibold focus:outline-none transition-all text-xs sm:text-sm"
                                        placeholder="Add booking notes, travel preferences, or call feedback here..."
                                    ></textarea>
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
                                    {isSaving ? 'Saving...' : 'Save Changes'}
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

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Pickup Location</label>
                                    <input 
                                        type="text" 
                                        name="pickup" 
                                        value={manualLead.pickup} 
                                        onChange={handleManualInputChange} 
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm" 
                                        placeholder="e.g. Varanasi Airport, Station (optional)" 
                                    />
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
                                        <option value="Cancelled">🔴 Cancelled (Dropped)</option>
                                    </select>
                                </div>

                                {manualLead.status === 'Confirmed' && (
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
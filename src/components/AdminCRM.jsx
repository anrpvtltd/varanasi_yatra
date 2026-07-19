import React, { useState, useEffect, useCallback } from 'react';

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
        <div className="min-h-screen bg-[#faf9f6] p-4 sm:p-8 text-stone-800 text-left">
            {/* Header section */}
            <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white p-6 sm:p-8 rounded-[28px] shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border border-stone-800/80 relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-1.5 z-10">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">🚩</span>
                        <h1 className="text-2xl font-serif font-bold tracking-wider text-amber-100">Banaras Yatra Operations</h1>
                    </div>
                    <p className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-widest font-semibold">Real-time Lead Inquiries & Booking Pipeline Dashboard</p>
                </div>
                <button 
                    onClick={fetchLeads} 
                    className="mt-4 sm:mt-0 z-10 flex items-center space-x-2 bg-stone-900/80 hover:bg-amber-600/10 border border-stone-800 hover:border-amber-500/40 text-amber-400 hover:text-white px-5 py-3 rounded-xl text-xs font-serif font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-md"
                >
                    <span>🔄</span>
                    <span>Sync Data</span>
                </button>
            </div>

            {/* Metric Summary Cards / Clickable tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                {/* Total Leads */}
                <div 
                    onClick={() => setStatusFilter('All')}
                    className={`bg-white p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'All' 
                            ? 'border-stone-800 shadow-md ring-1 ring-stone-900/5 bg-stone-50/50' 
                            : 'border-stone-200/80 hover:border-stone-400 shadow-xs'
                    }`}
                >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Total Leads</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-1">{totalLeads}</p>
                </div>

                {/* Pending */}
                <div 
                    onClick={() => setStatusFilter('Pending')}
                    className={`bg-white p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'Pending' 
                            ? 'border-amber-500 shadow-md ring-1 ring-amber-500/10 bg-amber-50/10' 
                            : 'border-stone-200/80 hover:border-amber-300 shadow-xs'
                    }`}
                >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600">🟡 Pending</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-1">{pendingLeads}</p>
                </div>

                {/* In-Progress */}
                <div 
                    onClick={() => setStatusFilter('In-Progress')}
                    className={`bg-white p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'In-Progress' 
                            ? 'border-blue-500 shadow-md ring-1 ring-blue-500/10 bg-blue-50/10' 
                            : 'border-stone-200/80 hover:border-blue-300 shadow-xs'
                    }`}
                >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">🔵 In-Progress</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-1">{inProgressLeads}</p>
                </div>

                {/* Confirmed */}
                <div 
                    onClick={() => setStatusFilter('Confirmed')}
                    className={`bg-white p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'Confirmed' 
                            ? 'border-green-600 shadow-md ring-1 ring-green-600/10 bg-green-50/10' 
                            : 'border-stone-200/80 hover:border-green-300 shadow-xs'
                    }`}
                >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-green-600">🟢 Confirmed</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-1">{confirmedLeads}</p>
                </div>

                {/* Cancelled */}
                <div 
                    onClick={() => setStatusFilter('Cancelled')}
                    className={`bg-white p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none transform hover:-translate-y-0.5 ${
                        statusFilter === 'Cancelled' 
                            ? 'border-red-500 shadow-md ring-1 ring-red-500/10 bg-red-50/10' 
                            : 'border-stone-200/80 hover:border-red-300 shadow-xs'
                    }`}
                >
                    <p className="text-[10px] uppercase tracking-wider font-bold text-red-600">🔴 Cancelled</p>
                    <p className="text-3xl font-serif font-bold text-stone-900 mt-1">{cancelledLeads}</p>
                </div>

                {/* Cash In-Hand */}
                <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-100 shadow-xs">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">💰 Cash In-Hand</p>
                    <p className="text-3xl font-serif font-bold text-emerald-800 mt-1">₹{totalCashInHand}</p>
                </div>

                {/* Outstanding */}
                <div className="bg-rose-50/50 p-4.5 rounded-2xl border border-rose-100 shadow-xs">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-rose-700">⏳ Outstanding</p>
                    <p className="text-3xl font-serif font-bold text-rose-800 mt-1">₹{totalOutstanding}</p>
                </div>
            </div>

            {/* Filter and Search Action bar */}
            <div className="bg-white border border-stone-200/80 rounded-2xl p-4.5 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
                {/* Search query box */}
                <div className="w-full md:max-w-md relative">
                    <input 
                        type="text" 
                        placeholder="🔍 Search name, mobile, email or pickup point..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500/60 focus:bg-white transition-all text-stone-800 placeholder-stone-400"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                        >
                            &times;
                        </button>
                    )}
                </div>

                {/* Filter and reset helpers */}
                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3.5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                        Showing: <span className="text-stone-800 font-extrabold">{statusFilter}</span> ({filteredLeads.length})
                    </span>
                    {(statusFilter !== 'All' || searchQuery) && (
                        <button 
                            onClick={() => { setStatusFilter('All'); setSearchQuery(''); }}
                            className="text-[10px] uppercase tracking-wider font-bold text-amber-600 hover:text-amber-800 px-3.5 py-2 bg-amber-50 rounded-xl transition cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Leads grid table container */}
            <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-8 h-8 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs uppercase tracking-widest font-serif font-bold text-stone-400 animate-pulse">Loading Grid Records...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 text-center text-red-500 text-sm font-semibold select-none">
                        ⚠️ {error}
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="p-20 text-center text-stone-400 text-xs font-medium leading-relaxed select-none">
                        📭 No enquiries match your active filter/search query.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50 border-b border-stone-100 text-stone-500 uppercase text-[10px] font-bold tracking-widest select-none">
                                    <th className="p-5">Customer Details</th>
                                    <th className="p-5">Travel Plan</th>
                                    <th className="p-5">Pipeline Status</th>
                                    <th className="p-5">Financials</th>
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-stone-50/50 transition duration-150">
                                        
                                        {/* Customer Details */}
                                        <td className="p-5">
                                            <div className="font-serif font-bold text-stone-900 text-base">{lead.name}</div>
                                            
                                            {/* Clickable Quick Actions */}
                                            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 mt-1.5 text-xs text-stone-500 font-medium">
                                                {/* Call link */}
                                                <a href={`tel:${lead.mobile}`} className="hover:text-amber-600 flex items-center space-x-1 transition">
                                                    <span>📞</span>
                                                    <span className="hover:underline">{lead.mobile}</span>
                                                </a>
                                                
                                                {/* Email link */}
                                                {lead.email && lead.email !== 'offline-client@banarasyatra.com' && (
                                                    <a href={`mailto:${lead.email}`} className="hover:text-amber-600 flex items-center space-x-1 transition">
                                                        <span>✉️</span>
                                                        <span className="hover:underline">{lead.email}</span>
                                                    </a>
                                                )}

                                                {/* WhatsApp quick chat link */}
                                                <a 
                                                    href={`https://wa.me/91${lead.mobile.replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="hover:text-emerald-600 flex items-center space-x-1 text-emerald-600/90 transition font-bold"
                                                >
                                                    <span>💬</span>
                                                    <span>Chat</span>
                                                </a>
                                            </div>
                                        </td>

                                        {/* Travel Plan details */}
                                        <td className="p-5">
                                            <div className="font-bold text-stone-800">{lead.date || 'Flexible Date'}</div>
                                            <div className="text-stone-400 text-xs mt-1 font-semibold uppercase tracking-wider">
                                                📍 {lead.pickup || 'Custom Pickup'} • 👤 {lead.travelers || '1'} Travelers
                                            </div>
                                        </td>

                                        {/* Pipeline Status */}
                                        <td className="p-5">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-extrabold select-none ${
                                                lead.status === 'Confirmed' ? 'bg-green-50 text-green-700 border border-green-200/50' :
                                                lead.status === 'In-Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                                                lead.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200/50' : 
                                                'bg-amber-50 text-amber-700 border border-amber-200/50'
                                            }`}>
                                                {lead.status === 'Confirmed' ? '🟢 Confirmed' :
                                                 lead.status === 'In-Progress' ? '🔵 In-Progress' :
                                                 lead.status === 'Cancelled' ? '🔴 Cancelled' : '🟡 Pending'}
                                            </span>
                                        </td>

                                        {/* Financial records */}
                                        <td className="p-5 text-xs font-semibold text-stone-500 space-y-0.5">
                                            <div>Total Package: <span className="font-bold text-stone-900">₹{lead.totalAmount || 0}</span></div>
                                            <div>Advance Token: <span className="font-bold text-emerald-600">₹{lead.advanceAmount || 0}</span></div>
                                            <div>Balance Due: <span className={`font-extrabold ${lead.remainingAmount > 0 ? 'text-rose-600' : 'text-stone-400'}`}>₹{lead.remainingAmount || 0}</span></div>
                                        </td>

                                        {/* Main Row CTA action */}
                                        <td className="p-5 text-right">
                                            <button 
                                                onClick={() => setSelectedLead(lead)} 
                                                className="bg-stone-900 hover:bg-amber-600 text-white hover:text-white px-4 py-2.5 rounded-xl text-xs font-serif font-bold uppercase tracking-widest transition duration-200 cursor-pointer shadow-xs"
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
                    <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col border-l border-stone-200 relative z-10 transform translate-x-0 transition-transform duration-300">
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-stone-100 mb-6">
                            <div>
                                <h3 className="text-lg font-serif font-bold text-stone-900">👤 Lead Control Center</h3>
                                <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mt-1">Updates for {selectedLead.name}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedLead(null)} 
                                className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Drawer Form */}
                        <form onSubmit={handleSaveChanges} className="space-y-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-5">
                                {/* Status select */}
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
                                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Total Package Cost (INR)</label>
                                            <input 
                                                type="number" 
                                                name="totalAmount" 
                                                value={selectedLead.totalAmount || ''} 
                                                onChange={handleInputChange} 
                                                className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0" 
                                                placeholder="Enter total quote amount"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Advance Token Received (INR)</label>
                                            <input 
                                                type="number" 
                                                name="advanceAmount" 
                                                value={selectedLead.advanceAmount || ''} 
                                                onChange={handleInputChange} 
                                                className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0" 
                                                placeholder="Enter advance received"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Balance Outstanding (Locked 🔒)</label>
                                            <input 
                                                type="number" 
                                                name="remainingAmount" 
                                                value={selectedLead.remainingAmount || 0} 
                                                readOnly 
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-100 text-stone-500 font-bold cursor-not-allowed focus:outline-none" 
                                            />
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
                                            className="w-full border border-stone-200 focus:border-blue-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none" 
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
                                            className="w-full border border-stone-200 focus:border-red-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none cursor-pointer"
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
                                        rows="4" 
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-3 bg-white text-stone-900 font-semibold focus:outline-none transition-all"
                                        placeholder="Add booking notes, preferences, or call feedback here..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Save actions */}
                            <div className="pt-6 border-t border-stone-100 flex space-x-3.5 mt-8">
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
        </div>
    );
}
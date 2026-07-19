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

    // ⚡ Dynamically reads API host from environment variables with fallback
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/admin/enquiries`);
            const resData = await response.json();
            if (resData.success) setLeads(resData.data);
            else setError('Data fetch error.');
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

    const totalLeads = leads.length;
    const pendingLeads = leads.filter(l => l.status === 'Pending').length;
    const inProgressLeads = leads.filter(l => l.status === 'In-Progress').length;
    const confirmedLeads = leads.filter(l => l.status === 'Confirmed').length;
    const cancelledLeads = leads.filter(l => l.status === 'Cancelled').length;
    const totalCashInHand = leads.reduce((sum, l) => sum + (l.advanceAmount || 0), 0);
    const totalOutstanding = leads.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#fcf8f4] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-[#ebdccb]">
                    <h2 className="text-2xl font-bold text-[#7d3c16] uppercase tracking-wider mb-6">Banaras Yatra</h2>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter Access PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full px-4 py-3 border rounded-xl text-center text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#7d3c16]"
                        />
                        <button type="submit" className="w-full bg-[#7d3c16] text-white py-3 rounded-xl font-bold hover:bg-[#653011]">
                            🔓 Unlock Portal
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900">
            <div className="bg-[#7d3c16] text-white p-6 rounded-2xl shadow-md flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider">🚩 Banaras Yatra Operations</h1>
                    <p className="text-xs opacity-80 mt-1">Multi-Collection Segment Balanced Grid</p>
                </div>
                <button onClick={fetchLeads} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm border border-white/20">
                    🔄 Sync Data
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border"><p className="text-xs font-semibold text-gray-400">Total Leads</p><p className="text-2xl font-bold text-gray-800 mt-1">{totalLeads}</p></div>
                <div className="bg-white p-4 rounded-xl border border-l-4 border-l-amber-500"><p className="text-xs font-semibold text-amber-600">🟡 Pending</p><p className="text-2xl font-bold text-gray-800 mt-1">{pendingLeads}</p></div>
                <div className="bg-white p-4 rounded-xl border border-l-4 border-l-blue-500"><p className="text-xs font-semibold text-blue-600">🔵 In-Progress</p><p className="text-2xl font-bold text-gray-800 mt-1">{inProgressLeads}</p></div>
                <div className="bg-white p-4 rounded-xl border border-l-4 border-l-green-500"><p className="text-xs font-semibold text-green-600">🟢 Confirmed</p><p className="text-2xl font-bold text-gray-800 mt-1">{confirmedLeads}</p></div>
                <div className="bg-white p-4 rounded-xl border border-l-4 border-l-red-500"><p className="text-xs font-semibold text-red-600">🔴 Cancelled</p><p className="text-2xl font-bold text-gray-800 mt-1">{cancelledLeads}</p></div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200"><p className="text-xs font-semibold text-emerald-700">💰 Cash In-Hand</p><p className="text-2xl font-bold text-emerald-800 mt-1">₹{totalCashInHand}</p></div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200"><p className="text-xs font-semibold text-rose-700">⏳ Outstanding</p><p className="text-2xl font-bold text-rose-800 mt-1">₹{totalOutstanding}</p></div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading Grid Records...</div>
                ) : error ? (
                    <div className="p-12 text-center text-red-500">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-bold border-b">
                                    <th className="p-4">Customer Details</th>
                                    <th className="p-4">Travel Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Financials</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm">
                                {leads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-slate-50/80 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 text-base">{lead.name}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">📞 {lead.mobile} | 📧 {lead.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-700">{lead.date}</div>
                                            <div className="text-gray-400 text-xs mt-0.5">📍 {lead.pickup} ({lead.travelers} Pax)</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                                lead.status === 'In-Progress' ? 'bg-blue-100 text-blue-700' :
                                                    lead.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>{lead.status}</span>
                                        </td>
                                        <td className="p-4 text-xs space-y-0.5 text-slate-600">
                                            <div>Total: <span className="font-semibold text-slate-800">₹{lead.totalAmount || 0}</span></div>
                                            <div>Adv: <span className="font-semibold text-emerald-600">₹{lead.advanceAmount || 0}</span></div>
                                            <div>Due: <span className="font-bold text-rose-600">₹{lead.remainingAmount || 0}</span></div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => setSelectedLead(lead)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700">
                                                📄 Open Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedLead && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
                    <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col border-l">
                        <div className="flex justify-between items-center pb-4 border-b mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">👤 Lead Control Center</h3>
                                <p className="text-xs text-gray-500">Edit updates for {selectedLead.name}</p>
                            </div>
                            <button onClick={() => setSelectedLead(null)} className="text-gray-400 text-2xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-5 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Change Lead Status</label>
                                <select name="status" value={selectedLead.status} onChange={handleInputChange} className="w-full border rounded-xl p-3 bg-gray-50 text-slate-900 font-semibold focus:ring-2 focus:ring-[#7d3c16]">
                                    <option value="Pending">🟡 Pending (New Lead)</option>
                                    <option value="In-Progress">🔵 In-Progress (Follow-up)</option>
                                    <option value="Confirmed">🟢 Confirmed (Trip Locked)</option>
                                    <option value="Cancelled">🔴 Cancelled (Dropped)</option>
                                </select>
                            </div>

                            {selectedLead.status === 'Confirmed' && (
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-800 mb-1">Total Package Cost (INR)</label>
                                        <input type="number" name="totalAmount" value={selectedLead.totalAmount || ''} onChange={handleInputChange} className="w-full border rounded-xl p-2.5 bg-white text-slate-900 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-800 mb-1">Advance Token Received (INR)</label>
                                        <input type="number" name="advanceAmount" value={selectedLead.advanceAmount || ''} onChange={handleInputChange} className="w-full border rounded-xl p-2.5 bg-white text-slate-900 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Balance Outstanding (Locked 🔒)</label>
                                        <input type="number" name="remainingAmount" value={selectedLead.remainingAmount || 0} readOnly className="w-full border rounded-xl p-2.5 bg-gray-100 text-slate-800 font-bold cursor-not-allowed" />
                                    </div>
                                </div>
                            )}

                            {selectedLead.status === 'In-Progress' && (
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <label className="block text-xs font-bold text-blue-800 mb-1">Next Follow-up Date</label>
                                    <input type="date" name="followUpDate" value={selectedLead.followUpDate || ''} onChange={handleInputChange} className="w-full border rounded-xl p-2.5 bg-white text-slate-900 font-medium" />
                                </div>
                            )}

                            {selectedLead.status === 'Cancelled' && (
                                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                    <label className="block text-xs font-bold text-red-800 mb-1">Reason for Cancellation</label>
                                    <select name="cancellationReason" value={selectedLead.cancellationReason || ''} onChange={handleInputChange} className="w-full border rounded-xl p-2.5 bg-white text-slate-900 font-medium">
                                        <option value="">-- Select Reason --</option>
                                        <option value="Budget Issue">💸 Budget Issue</option>
                                        <option value="Dates Changed">📅 Dates Changed</option>
                                        <option value="No Response">🔇 No Response / Ghosted</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">📝 Internal Admin Notes</label>
                                <textarea name="adminNotes" value={selectedLead.adminNotes || ''} onChange={handleInputChange} rows="4" className="w-full border rounded-xl p-3 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#7d3c16]"></textarea>
                            </div>

                            <div className="pt-4 border-t flex space-x-3">
                                <button type="button" onClick={() => setSelectedLead(null)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-[#7d3c16] text-white py-3 rounded-xl font-bold hover:bg-[#653011] disabled:bg-gray-400">
                                    {isSaving ? 'Saving...' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
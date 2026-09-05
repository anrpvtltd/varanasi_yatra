import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { generateQRSvgString, generateQRPngDataUrl } from '../../../utils/qrCodeGenerator';

export default function HotelPartnerWorkspace({ token, user }) {
    const [partners, setPartners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal States
    const [selectedQRPartner, setSelectedQRPartner] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        partnerCode: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        active: true
    });
    const [isSaving, setIsSaving] = useState(false);

    const loadPartners = useCallback(async () => {
        if (!token || user?.role !== 'CEO') return;
        setIsLoading(true);
        setError('');
        try {
            const res = await crmApi.fetchHotelPartners(token);
            if (res.success && Array.isArray(res.data)) {
                setPartners(res.data);
            }
        } catch (err) {
            setError(err.message || 'Failed to load hotel partners');
        } finally {
            setIsLoading(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadPartners();
    }, [loadPartners]);

    // Handle Add / Edit submit
    const handleSavePartner = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Hotel Name is required.');
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            if (editingPartner) {
                const res = await crmApi.updateHotelPartner(token, editingPartner._id, formData);
                if (res.success) {
                    setSuccessMessage(`Updated ${formData.name} successfully.`);
                    setIsAddModalOpen(false);
                    setEditingPartner(null);
                    await loadPartners();
                }
            } else {
                const res = await crmApi.createHotelPartner(token, formData);
                if (res.success) {
                    setSuccessMessage(`Added ${formData.name} successfully.`);
                    setIsAddModalOpen(false);
                    await loadPartners();
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to save partner.');
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle active status
    const handleToggleActive = async (partner) => {
        try {
            const res = await crmApi.updateHotelPartner(token, partner._id, { active: !partner.active });
            if (res.success) {
                setPartners(prev => prev.map(p => p._id === partner._id ? { ...p, active: !partner.active } : p));
            }
        } catch (err) {
            setError(err.message || 'Failed to toggle partner status.');
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (partner) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.name || '',
            partnerCode: partner.partnerCode || '',
            contactName: partner.contactName || '',
            phone: partner.phone || '',
            email: partner.email || '',
            address: partner.address || '',
            notes: partner.notes || '',
            active: partner.active ?? true
        });
        setIsAddModalOpen(true);
    };

    // Open Add Modal
    const handleOpenAdd = () => {
        setEditingPartner(null);
        setFormData({
            name: '',
            partnerCode: '',
            contactName: '',
            phone: '',
            email: '',
            address: '',
            notes: '',
            active: true
        });
        setIsAddModalOpen(true);
    };

    // Download QR Code as SVG
    const handleDownloadSvg = (partner) => {
        const destUrl = `${window.location.origin}/p/${partner.partnerCode}`;
        const svgString = generateQRSvgString(destUrl, { size: 600, margin: 4 });
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VaranasiYatra_QR_${partner.partnerCode}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Download QR Code as PNG
    const handleDownloadPng = (partner) => {
        const destUrl = `${window.location.origin}/p/${partner.partnerCode}`;
        const dataUrl = generateQRPngDataUrl(destUrl, 600);
        if (!dataUrl) return;
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `VaranasiYatra_QR_${partner.partnerCode}.png`;
        link.click();
    };

    // Copy Link to Clipboard
    const handleCopyLink = (partner) => {
        const destUrl = `${window.location.origin}/p/${partner.partnerCode}`;
        navigator.clipboard.writeText(destUrl).then(() => {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2500);
        });
    };

    // Summary KPIs
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.active).length;
    const totalLeads = partners.reduce((sum, p) => sum + (p.leadsCount || 0), 0);
    const totalScans = partners.reduce((sum, p) => sum + (p.scansCount || 0), 0);

    if (user?.role !== 'CEO') {
        return (
            <div className="p-8 text-center text-stone-500">
                ⚠️ Hotel Partner management is restricted to CEO role.
            </div>
        );
    }

    return (
        <div className="space-y-6 select-none">
            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-serif font-black tracking-wider uppercase text-amber-400 flex items-center space-x-2">
                        <span>🏨</span>
                        <span>Hotel Partner & QR Concierge Management</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Configure hotel concierge desks, generate unique trackable QR destinations, and review real acquisition metrics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={loadPartners}
                        disabled={isLoading}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                        {isLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>+</span>
                        <span>Add Hotel Partner</span>
                    </button>
                </div>
            </div>

            {/* Notification Messages */}
            {error && (
                <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center justify-between">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-200 font-bold">✕</button>
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
                    <span>✓ {successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200 font-bold">✕</button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Hotel Partners</span>
                    <span className="text-2xl font-bold text-slate-100 mt-1 block">{totalPartners}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Registered in Master</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Concierge Desks</span>
                    <span className="text-2xl font-bold text-emerald-400 mt-1 block">{activePartners}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">{totalPartners - activePartners} Inactive</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Real QR Leads Captured</span>
                    <span className="text-2xl font-bold text-amber-400 mt-1 block">{totalLeads}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Verified In Database</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Recorded QR Scans</span>
                    <span className="text-2xl font-bold text-indigo-400 mt-1 block">{totalScans}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Verified Event Scans</span>
                </div>
            </div>

            {/* Partner Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">Hotel Partners Directory</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Live status, landing endpoints, and lead acquisition</p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        {partners.length} {partners.length === 1 ? 'Partner' : 'Partners'}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider border-b border-slate-200">
                                <th className="p-4">Hotel / Partner</th>
                                <th className="p-4">Concierge Contact</th>
                                <th className="p-4">Destination URL</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Leads</th>
                                <th className="p-4 text-center">Scans</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {partners.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                                        {isLoading ? 'Loading hotel partners...' : 'No hotel partners configured yet. Click "+ Add Hotel Partner" to register your first hotel.'}
                                    </td>
                                </tr>
                            ) : (
                                partners.map((p) => {
                                    const destUrl = `${window.location.origin}/p/${p.partnerCode}`;
                                    return (
                                        <tr key={p._id} className="hover:bg-slate-50/70 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                                                <div className="text-[11px] font-mono text-slate-500 mt-0.5">Code: {p.partnerCode}</div>
                                                {p.address && <div className="text-[11px] text-slate-400 mt-0.5">{p.address}</div>}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">{p.contactName || 'Desk Coordinator'}</div>
                                                {p.phone && <div className="text-[11px] text-slate-500 font-mono">{p.phone}</div>}
                                                {p.email && <div className="text-[11px] text-slate-400">{p.email}</div>}
                                            </td>
                                            <td className="p-4">
                                                <a
                                                    href={destUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-mono text-[11px] text-amber-700 hover:text-amber-800 underline block truncate max-w-[200px]"
                                                >
                                                    /p/{p.partnerCode}
                                                </a>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(p)}
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                                        p.active
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            : 'bg-slate-100 text-slate-500 border border-slate-300'
                                                    }`}
                                                >
                                                    {p.active ? '● Active' : '○ Inactive'}
                                                </button>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-900">
                                                <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                                                    {p.leadsCount || 0}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-700">
                                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                                    {p.scansCount || 0}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedQRPartner(p)}
                                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg border border-amber-200 transition cursor-pointer"
                                                >
                                                    📱 View QR
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(p)}
                                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                                                >
                                                    ✏️ Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QR Code Modal */}
            {selectedQRPartner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-150">
                        <button
                            type="button"
                            onClick={() => setSelectedQRPartner(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-6">
                            <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block mb-2">
                                Official Guest QR Code
                            </span>
                            <h3 className="text-xl font-serif font-black text-slate-900">
                                {selectedQRPartner.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Unique Concierge Landing Destination
                            </p>
                        </div>

                        {/* QR Code Graphic Box */}
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner mb-6">
                            <div
                                className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm"
                                dangerouslySetInnerHTML={{
                                    __html: generateQRSvgString(`${window.location.origin}/p/${selectedQRPartner.partnerCode}`, { size: 220, margin: 3 })
                                }}
                            />
                            <p className="font-mono text-[11px] text-stone-600 mt-3 break-all text-center">
                                {`${window.location.origin}/p/${selectedQRPartner.partnerCode}`}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleDownloadSvg(selectedQRPartner)}
                                    className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>⬇️</span>
                                    <span>Download SVG</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDownloadPng(selectedQRPartner)}
                                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>🖼️</span>
                                    <span>Download PNG</span>
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleCopyLink(selectedQRPartner)}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>{copiedUrl ? '✓ Link Copied!' : '📋 Copy Destination Link'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Hotel Partner Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-serif font-black text-slate-900 mb-1">
                            {editingPartner ? 'Edit Hotel Partner' : 'Register New Hotel Partner'}
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">
                            Configure partnership details for local guest concierge attribution.
                        </p>

                        <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Hotel Name <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Hotel Taj Ganges"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Partner URL Code (Slug)
                                </label>
                                <input
                                    type="text"
                                    value={formData.partnerCode}
                                    onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                                    placeholder="e.g. hotel-taj-ganges (leave empty to auto-generate)"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        placeholder="e.g. Front Desk Manager"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 9876543210"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="concierge@hotel.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Hotel Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="e.g. Nadesar Palace Grounds, Varanasi"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Private CEO Notes</label>
                                <textarea
                                    rows="2"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Internal notes (never visible to public)"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="partner_active"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                                <label htmlFor="partner_active" className="font-bold text-slate-700">
                                    Concierge Desk Active (Guests can scan & submit requests)
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-1/2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                                >
                                    {isSaving ? 'Saving...' : (editingPartner ? 'Update Partner' : 'Register Partner')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

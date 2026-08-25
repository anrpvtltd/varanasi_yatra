import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from '../../../constants/phase4Constants';
import { calculateVendorPerformance } from '../../../utils/vendorPerformanceCalculator';
import VendorFormModal from '../shared/VendorFormModal';
import VendorProfileDrawer from '../shared/VendorProfileDrawer';

export default function VendorManagement({ token, user }) {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);

    const loadVendors = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await crmApi.fetchVendors(token, categoryFilter, statusFilter, searchQuery);
            if (res.success && res.vendors) {
                setVendors(res.vendors);
            }
        } catch (err) {
            console.error('Failed to load vendors:', err);
        } finally {
            setLoading(false);
        }
    }, [token, categoryFilter, statusFilter, searchQuery]);

    useEffect(() => {
        loadVendors();
    }, [loadVendors]);

    const handleOpenForm = (vendorToEdit = null) => {
        setEditingVendor(vendorToEdit);
        setIsFormOpen(true);
    };

    const handleOpenProfile = (vendor) => {
        setSelectedVendor(vendor);
        setIsProfileOpen(true);
    };

    const categoryCounts = Object.keys(VENDOR_CATEGORIES).reduce((acc, catKey) => {
        acc[catKey] = vendors.filter(v => (v.category || '').toUpperCase() === catKey).length;
        return acc;
    }, {});

    return (
        <div className="space-y-6">

            {/* MANAGEMENT HEADER & ACTION BAR */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🏨</span>
                        <h2 className="text-xl font-serif font-extrabold text-stone-900">Vendor & Service Management Master</h2>
                    </div>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">Manage external hotels, transport fleets, drivers, pandits, boat operators & shopping partners.</p>
                </div>

                <button
                    type="button"
                    onClick={() => handleOpenForm(null)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-serif font-bold text-xs rounded-xl uppercase tracking-widest transition shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                    <span>+ Add Master Vendor</span>
                </button>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-wrap gap-3 items-center justify-between text-xs">
                <div className="flex-1 min-w-[240px]">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search vendors by business name, contact person, or phone..."
                        className="w-full bg-white border border-stone-300 font-medium text-stone-900 rounded-xl px-3.5 py-2 text-xs"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white border border-stone-300 font-bold text-stone-800 rounded-xl px-3 py-2 text-xs"
                    >
                        <option value="ALL">All Categories ({vendors.length})</option>
                        {Object.entries(VENDOR_CATEGORIES).map(([key, val]) => (
                            <option key={key} value={val}>
                                {VENDOR_CATEGORY_LABELS[key] || val} ({categoryCounts[key] || 0})
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-stone-300 font-bold text-stone-800 rounded-xl px-3 py-2 text-xs"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">🟢 Active</option>
                        <option value="INACTIVE">🔴 Inactive</option>
                        <option value="SUSPENDED">⚠️ Suspended</option>
                    </select>
                </div>
            </div>

            {/* VENDOR CARDS DIRECTORY GRID */}
            {loading ? (
                <div className="text-center py-12 text-stone-400 font-bold text-xs animate-pulse">Loading Vendor Inventory...</div>
            ) : vendors.length === 0 ? (
                <div className="bg-stone-50 border-2 border-dashed border-stone-200 p-8 rounded-3xl text-center space-y-2">
                    <span className="text-3xl">🏨</span>
                    <h3 className="text-sm font-extrabold text-stone-800">No Vendors Found</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">No master vendors match the active filter criteria. Add a vendor to begin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendors.map((v) => {
                        const perf = calculateVendorPerformance(v.performance);
                        return (
                            <div
                                key={v._id}
                                onClick={() => handleOpenProfile(v)}
                                className="bg-white border border-stone-200 hover:border-amber-400 p-4 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">
                                            {v.category}
                                        </span>
                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                            v.status === 'ACTIVE' || v.availabilityStatus === 'Active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-stone-100 text-stone-600'
                                        }`}>
                                            {v.status || v.availabilityStatus}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-extrabold text-stone-900 mt-2">{v.businessName || v.name}</h3>
                                    <p className="text-xs text-stone-500 font-medium">📍 {v.city || v.location} · 📞 {v.phone || v.mobile}</p>
                                </div>

                                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-xs">
                                    <span className="font-extrabold text-stone-800">
                                        ₹{(v.baseRate || 0).toLocaleString('en-IN')} <span className="text-[10px] text-stone-400 font-normal">Base Rate</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-amber-700">
                                        {perf.isNewVendor ? '🆕 New Vendor' : `⭐ ${perf.reliabilityScore}/100`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODALS AND DRAWERS */}
            <VendorFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                vendor={editingVendor}
                token={token}
                user={user}
                onVendorSaved={() => loadVendors()}
            />

            <VendorProfileDrawer
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                vendor={selectedVendor}
                token={token}
                user={user}
                onVendorUpdated={() => loadVendors()}
                onEditVendor={(v) => { setIsProfileOpen(false); handleOpenForm(v); }}
            />

        </div>
    );
}

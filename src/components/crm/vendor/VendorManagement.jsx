import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { RESOURCE_CATEGORIES, RESOURCE_CATEGORY_LABELS, COMMERCIAL_MODEL_LABELS } from '../../../constants/phase4Constants';
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

    const isCEO = user?.role === 'CEO';

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
        if (!isCEO) return;
        setEditingVendor(vendorToEdit);
        setIsFormOpen(true);
    };

    const handleOpenProfile = (vendor) => {
        setSelectedVendor(vendor);
        setIsProfileOpen(true);
    };

    const normalizeCategory = (cat) => {
        if (!cat) return 'OTHER';
        const upper = cat.toUpperCase();
        if (upper === 'BOAT_RIDE') return 'BOAT';
        if (upper === 'TOUR_GUIDE') return 'GUIDE';
        if (upper === 'SHOPPING_PARTNER') return 'SHOPPING';
        if (upper === 'VIP_DARSHAN') return 'DARSHAN';
        return upper;
    };

    const categoryCounts = Object.keys(RESOURCE_CATEGORIES).reduce((acc, catKey) => {
        acc[catKey] = vendors.filter(v => normalizeCategory(v.category) === catKey).length;
        return acc;
    }, {});

    return (
        <div className="space-y-6">

            {/* MANAGEMENT HEADER & ACTION BAR */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-wrap gap-4 justify-between items-center">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">🏛️</span>
                        <h2 className="text-xl font-serif font-extrabold text-stone-900">
                            CEO Resource Master & Rates
                        </h2>
                        {!isCEO && (
                            <span className="bg-stone-100 text-stone-600 border border-stone-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                Manager View (Read Only)
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                        Central directory of approved hotels, transport, pandits, boats, guides, shopping partners, darshan passes, and lead agents.
                    </p>
                </div>

                {isCEO ? (
                    <button
                        type="button"
                        onClick={() => handleOpenForm(null)}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-serif font-bold text-xs rounded-xl uppercase tracking-widest transition shadow-md cursor-pointer flex items-center space-x-1.5"
                    >
                        <span>+ Add Resource / Vendor</span>
                    </button>
                ) : (
                    <div className="text-xs text-stone-400 italic">
                        Viewing active vendor database
                    </div>
                )}
            </div>

            {/* CATEGORY QUICK FILTER PILLS */}
            <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-2xl border border-stone-200 shadow-xs">
                <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        categoryFilter === 'ALL'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                >
                    All Resources ({vendors.length})
                </button>
                {Object.entries(RESOURCE_CATEGORIES).map(([key, val]) => {
                    const count = categoryCounts[key] || 0;
                    const isActive = categoryFilter === val;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCategoryFilter(val)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                                isActive
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                            }`}
                        >
                            <span>{RESOURCE_CATEGORY_LABELS[key] || val}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-amber-800 text-amber-100' : 'bg-stone-200 text-stone-600'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* SEARCH & STATUS FILTERS BAR */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-wrap gap-3 items-center justify-between text-xs">
                <div className="flex-1 min-w-[240px]">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resources by name, contact person, or phone..."
                        className="w-full bg-white border border-stone-300 font-medium text-stone-900 rounded-xl px-3.5 py-2 text-xs"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-stone-300 font-bold text-stone-800 rounded-xl px-3 py-2 text-xs"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">🟢 Active Only</option>
                        <option value="INACTIVE">🔴 Inactive</option>
                        <option value="SUSPENDED">⚠️ Suspended</option>
                    </select>
                </div>
            </div>

            {/* RESOURCE CARDS DIRECTORY GRID */}
            {loading ? (
                <div className="text-center py-12 text-stone-400 font-bold text-xs animate-pulse">Loading Resource Inventory...</div>
            ) : vendors.length === 0 ? (
                <div className="bg-stone-50 border-2 border-dashed border-stone-200 p-8 rounded-3xl text-center space-y-2">
                    <span className="text-3xl">📂</span>
                    <h3 className="text-sm font-extrabold text-stone-800">No Resources Found</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        {isCEO
                            ? "No resources match the selected filters. Click '+ Add Resource / Vendor' to configure."
                            : "No active resources match your search query."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendors.map((v) => {
                        const perf = calculateVendorPerformance(v.performance);
                        const normCat = normalizeCategory(v.category);
                        const catLabel = RESOURCE_CATEGORY_LABELS[normCat] || v.category;
                        const commModel = v.commercialModel || 'SELLING_PRICE';
                        const ruleCount = (v.rateRules && v.rateRules.length) || 0;

                        return (
                            <div
                                key={v._id}
                                onClick={() => handleOpenProfile(v)}
                                className="bg-white border border-stone-200 hover:border-amber-400 p-4 rounded-3xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                            {catLabel}
                                        </span>
                                        <div className="flex items-center space-x-1.5">
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                                v.status === 'ACTIVE' || v.availabilityStatus === 'Active'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-stone-100 text-stone-600'
                                            }`}>
                                                {v.status || v.availabilityStatus}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-extrabold text-stone-900 mt-2">
                                        {v.businessName || v.name}
                                    </h3>
                                    <p className="text-xs text-stone-500 font-medium">
                                        📍 {v.city || v.location || 'Varanasi'} · 📞 {v.phone || v.mobile || 'No contact'}
                                    </p>

                                    {/* Category Specific Highlights */}
                                    <div className="mt-2 text-[11px] text-stone-600 bg-stone-50 p-2 rounded-xl border border-stone-100">
                                        {normCat === 'HOTEL' && (
                                            <div>
                                                <span className="font-bold text-amber-800">⭐ {v.metadata?.starCategory || 'Standard'} Hotel</span>
                                                {ruleCount > 0 ? (
                                                    <span className="text-stone-500 block">{ruleCount} Room Type Rates configured</span>
                                                ) : (
                                                    <span className="text-stone-500 block">Base: ₹{v.baseRate?.toLocaleString('en-IN')}/night</span>
                                                )}
                                            </div>
                                        )}
                                        {normCat === 'TRANSPORT' && (
                                            <div>
                                                <span className="font-bold text-sky-800">🚗 Transporter Fleet</span>
                                                {ruleCount > 0 ? (
                                                    <span className="text-stone-500 block">{ruleCount} Vehicle/Route Rules</span>
                                                ) : (
                                                    <span className="text-stone-500 block">Base: ₹{v.baseRate?.toLocaleString('en-IN')}</span>
                                                )}
                                            </div>
                                        )}
                                        {normCat === 'PANDIT' && (
                                            <div>
                                                <span className="font-bold text-orange-800">🪔 Ritual Services</span>
                                                <span className="text-stone-500 block">Direct Guest Settlement (₹0 in package)</span>
                                            </div>
                                        )}
                                        {normCat === 'BOAT' && (
                                            <div>
                                                <span className="font-bold text-cyan-800">⛵ Boat Operator</span>
                                                {ruleCount > 0 ? (
                                                    <span className="text-stone-500 block">{ruleCount} Route & Slot Rules</span>
                                                ) : (
                                                    <span className="text-stone-500 block">Base: ₹{v.baseRate?.toLocaleString('en-IN')}</span>
                                                )}
                                            </div>
                                        )}
                                        {normCat === 'GUIDE' && (
                                            <div>
                                                <span className="font-bold text-purple-800">🚩 Tour Guide</span>
                                                <span className="text-stone-500 block">
                                                    Languages: {(v.metadata?.languages || ['Hindi']).join(', ')} · ₹{v.baseRate?.toLocaleString('en-IN')}/day
                                                </span>
                                            </div>
                                        )}
                                        {normCat === 'SHOPPING' && (
                                            <div>
                                                <span className="font-bold text-rose-800">🛍️ Shopping Partner</span>
                                                <span className="text-stone-500 block">
                                                    Commission: {v.metadata?.commissionRate || 0}% · Guide Share: {v.metadata?.guideSharePercent || 0}%
                                                </span>
                                            </div>
                                        )}
                                        {normCat === 'DARSHAN' && (
                                            <div>
                                                <span className="font-bold text-amber-800">🛕 Pass Facilitator</span>
                                                <span className="text-stone-500 block">
                                                    Pass Cost: ₹{(v.metadata?.passCost || v.baseRate || 0).toLocaleString('en-IN')} (Pass-Through)
                                                </span>
                                            </div>
                                        )}
                                        {normCat === 'LEAD_PARTNER' && (
                                            <div>
                                                <span className="font-bold text-emerald-800">🤝 Travel Agent / Partner</span>
                                                <span className="text-stone-500 block">
                                                    Agency: {v.metadata?.agencyName || 'Direct'} · Terms: {v.metadata?.commissionTerms || 'Agreed Rate'}
                                                </span>
                                            </div>
                                        )}
                                        {normCat === 'OTHER' && (
                                            <div>
                                                <span className="font-bold text-stone-800">✨ Service Partner</span>
                                                <span className="text-stone-500 block">Rate: ₹{v.baseRate?.toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-xs">
                                    <span className="text-[10px] font-bold text-stone-500 uppercase">
                                        Model: <span className="text-amber-800 font-extrabold">{COMMERCIAL_MODEL_LABELS[commModel] || commModel}</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-amber-700">
                                        {perf.isNewVendor ? '🆕 Resource' : `⭐ ${perf.reliabilityScore}/100`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODALS AND DRAWERS */}
            {isCEO && (
                <VendorFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    vendor={editingVendor}
                    token={token}
                    user={user}
                    onVendorSaved={() => loadVendors()}
                />
            )}

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

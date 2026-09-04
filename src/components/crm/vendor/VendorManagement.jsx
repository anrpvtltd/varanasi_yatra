import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { RESOURCE_CATEGORIES, RESOURCE_CATEGORY_LABELS, COMMERCIAL_MODEL_LABELS } from '../../../constants/phase4Constants';
import { calculateVendorPerformance } from '../../../utils/vendorPerformanceCalculator';
import VendorFormModal from '../shared/VendorFormModal';
import VendorProfileDrawer from '../shared/VendorProfileDrawer';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';
import { SearchInput, Select } from '../ui/Input';

export default function VendorManagement({ token, user }) {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('TABLE'); // 'TABLE' or 'CARDS'
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

    // Category counts for filter tabs
    const categoryCounts = useMemo(() => {
        return Object.keys(RESOURCE_CATEGORIES).reduce((acc, catKey) => {
            acc[catKey] = vendors.filter((v) => normalizeCategory(v.category) === catKey).length;
            return acc;
        }, {});
    }, [vendors]);

    // Handle Quick Status Toggle from Table
    const handleToggleStatus = async (vendor, newStatus, e) => {
        if (e) e.stopPropagation();
        if (!isCEO) return;
        try {
            const res = await crmApi.updateVendorStatus(token, vendor._id, newStatus);
            if (res.success) {
                loadVendors();
            }
        } catch (err) {
            alert('Failed to update vendor status: ' + err.message);
        }
    };

    return (
        <div className="space-y-5">
            {/* WORKSPACE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Resource Master</span>
                        <Badge variant="blue">Central Operations Control</Badge>
                        {!isCEO && <Badge variant="default">Read Only</Badge>}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Central operational directory of approved hotels, transport, pandits, boats, guides, shopping partners, passes &amp; lead agents.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('TABLE')}
                            className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                viewMode === 'TABLE' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Table
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('CARDS')}
                            className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                                viewMode === 'CARDS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Cards
                        </button>
                    </div>

                    {isCEO && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenForm(null)}
                        >
                            + Add Resource / Vendor
                        </Button>
                    )}
                </div>
            </div>

            {/* SNAPSHOT PROTECTION NOTICE */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span>🛡️</span>
                    <span>
                        <strong>Historical Rate Snapshot Protection Active:</strong> Rate changes made here only affect future quotes. All existing quotes, bookings and trip records remain immutably preserved.
                    </span>
                </div>
                <Badge variant="blue">Accrual Safe</Badge>
            </div>

            {/* CATEGORY FILTER TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        categoryFilter === 'ALL'
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                    <span>All Resources</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        categoryFilter === 'ALL' ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {vendors.length}
                    </span>
                </button>

                {Object.entries(RESOURCE_CATEGORIES).map(([key, val]) => {
                    const count = categoryCounts[key] || 0;
                    const isActive = categoryFilter === val;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setCategoryFilter(val)}
                            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                                isActive
                                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <span>{RESOURCE_CATEGORY_LABELS[key] || val}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isActive ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* SEARCH & STATUS FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                <div className="w-full sm:w-80">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder="Search by resource name, contact, or phone..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                    </Select>
                </div>
            </div>

            {/* CONTENT: TABLE VIEW OR CARDS VIEW */}
            {loading ? (
                <div className="py-12 text-center text-xs text-gray-400">
                    Loading verified resource database...
                </div>
            ) : vendors.length === 0 ? (
                <div className="p-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl space-y-2">
                    <span className="text-3xl block">🏛️</span>
                    <h3 className="text-sm font-bold text-gray-800">No Resources Found</h3>
                    <p className="text-xs text-gray-500">
                        {isCEO
                            ? "No vendors found matching your current filter. Click '+ Add Resource / Vendor' to configure."
                            : 'No active resources match your search query.'}
                    </p>
                </div>
            ) : viewMode === 'TABLE' ? (
                <TableContainer>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Resource / Partner</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Contact Person</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Commercial Model</TableHead>
                                <TableHead align="right">Rates / Rules</TableHead>
                                <TableHead align="center">Reliability</TableHead>
                                <TableHead align="center">Status</TableHead>
                                <TableHead align="center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vendors.map((v) => {
                                const normCat = normalizeCategory(v.category);
                                const catLabel = RESOURCE_CATEGORY_LABELS[normCat] || v.category;
                                const perf = calculateVendorPerformance(v.performance);
                                const commModel = v.commercialModel || 'SELLING_PRICE';
                                const rulesCount = (v.rateRules && v.rateRules.length) || 0;
                                const isActive = v.status === 'ACTIVE' || v.availabilityStatus === 'Active';

                                return (
                                    <TableRow
                                        key={v._id}
                                        hover
                                        className="cursor-pointer"
                                        onClick={() => handleOpenProfile(v)}
                                    >
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">{v.businessName || v.name}</div>
                                            <div className="text-[11px] text-gray-500 font-mono">
                                                Code: #{v.vendorCode || 'VY-V-0000'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-100">
                                                {catLabel}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-800 font-medium">{v.contactPerson || 'Direct'}</div>
                                            <div className="text-[11px] text-gray-500 font-mono">{v.phone || v.mobile || 'No contact'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-gray-700">{v.city || v.location || 'Varanasi'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-semibold text-gray-800">
                                                {COMMERCIAL_MODEL_LABELS[commModel] || commModel}
                                            </span>
                                        </TableCell>
                                        <TableCell align="right">
                                            {rulesCount > 0 ? (
                                                <span className="text-xs font-bold text-gray-900">
                                                    {rulesCount} Rules Configured
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-900">
                                                    ₹{(v.baseRate || 0).toLocaleString('en-IN')} Base
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {perf.isNewVendor ? (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">New</span>
                                            ) : (
                                                <span className="text-xs font-bold text-emerald-700">
                                                    {perf.reliabilityScore}/100
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Badge variant={isActive ? 'success' : 'default'}>
                                                {v.status || v.availabilityStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Button
                                                    variant="secondary"
                                                    size="xs"
                                                    onClick={() => handleOpenProfile(v)}
                                                >
                                                    View
                                                </Button>
                                                {isCEO && (
                                                    <Button
                                                        variant={isActive ? 'danger' : 'primary'}
                                                        size="xs"
                                                        onClick={(e) => handleToggleStatus(v, isActive ? 'INACTIVE' : 'ACTIVE', e)}
                                                    >
                                                        {isActive ? 'Deactivate' : 'Reactivate'}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                /* CARDS VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendors.map((v) => {
                        const normCat = normalizeCategory(v.category);
                        const catLabel = RESOURCE_CATEGORY_LABELS[normCat] || v.category;
                        const commModel = v.commercialModel || 'SELLING_PRICE';
                        const ruleCount = (v.rateRules && v.rateRules.length) || 0;
                        const isActive = v.status === 'ACTIVE' || v.availabilityStatus === 'Active';

                        return (
                            <div
                                key={v._id}
                                onClick={() => handleOpenProfile(v)}
                                className="bg-white border border-gray-200 hover:border-blue-400 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
                            >
                                <div>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                            {catLabel}
                                        </span>
                                        <Badge variant={isActive ? 'success' : 'default'}>
                                            {v.status || v.availabilityStatus}
                                        </Badge>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-900 mt-2">
                                        {v.businessName || v.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        📍 {v.city || v.location || 'Varanasi'} · 📞 {v.phone || v.mobile || 'No contact'}
                                    </p>

                                    {/* Category Specific Highlights */}
                                    <div className="mt-2 text-[11px] text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                        {normCat === 'HOTEL' && (
                                            <div>
                                                <span className="font-bold text-amber-800">⭐ {v.metadata?.starCategory || 'Standard'} Hotel</span>
                                                {ruleCount > 0 ? (
                                                    <span className="text-gray-500 block">{ruleCount} Room Type Rates Configured</span>
                                                ) : (
                                                    <span className="text-gray-500 block">Base: ₹{(v.baseRate || 0).toLocaleString('en-IN')}/night</span>
                                                )}
                                            </div>
                                        )}
                                        {normCat === 'TRANSPORT' && (
                                            <div>
                                                <span className="font-bold text-blue-800">🚗 Fleet Transporter</span>
                                                <span className="text-gray-500 block">Model: {commModel}</span>
                                            </div>
                                        )}
                                        {normCat === 'PANDIT' && (
                                            <div>
                                                <span className="font-bold text-orange-800">🙏 Verified Priest / Pandit</span>
                                                <span className="text-gray-500 block">Customer Direct (₹0 in package)</span>
                                            </div>
                                        )}
                                        {normCat === 'BOAT' && (
                                            <div>
                                                <span className="font-bold text-teal-800">⛵ Ganga Boat Service</span>
                                                <span className="text-gray-500 block">{ruleCount} Route &amp; Slot Rules</span>
                                            </div>
                                        )}
                                        {normCat === 'DARSHAN' && (
                                            <div>
                                                <span className="font-bold text-purple-800">🎟️ VIP Darshan Pass-Through</span>
                                                <span className="text-gray-500 block">Exact pass cost · 0% company margin</span>
                                            </div>
                                        )}
                                        {normCat === 'SHOPPING' && (
                                            <div>
                                                <span className="font-bold text-emerald-800">🛍️ Shopping Partner</span>
                                                <span className="text-gray-500 block">Commission Based · Customer Direct</span>
                                            </div>
                                        )}
                                        {normCat !== 'HOTEL' && normCat !== 'TRANSPORT' && normCat !== 'PANDIT' && normCat !== 'BOAT' && normCat !== 'DARSHAN' && normCat !== 'SHOPPING' && (
                                            <div>
                                                <span className="font-bold text-gray-800">{catLabel}</span>
                                                <span className="text-gray-500 block">Base: ₹{(v.baseRate || 0).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <span className="text-gray-400 font-mono text-[10px]">#{v.vendorCode || 'VY-V-0000'}</span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            size="xs"
                                            variant="secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenProfile(v);
                                            }}
                                        >
                                            View Details →
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* RESOURCE DETAIL DRAWER */}
            <VendorProfileDrawer
                isOpen={isProfileOpen}
                onClose={() => {
                    setIsProfileOpen(false);
                    setSelectedVendor(null);
                }}
                vendor={selectedVendor}
                token={token}
                user={user}
                onVendorUpdated={() => {
                    loadVendors();
                }}
                onEditVendor={(vendorToEdit) => {
                    setIsProfileOpen(false);
                    handleOpenForm(vendorToEdit);
                }}
            />

            {/* RESOURCE CREATE / EDIT MODAL */}
            <VendorFormModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingVendor(null);
                }}
                vendor={editingVendor}
                token={token}
                user={user}
                onVendorSaved={() => {
                    loadVendors();
                }}
            />
        </div>
    );
}

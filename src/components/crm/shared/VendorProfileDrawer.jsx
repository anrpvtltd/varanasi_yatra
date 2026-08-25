import React, { useState } from 'react';
import { crmApi } from '../../../services/crmApi';
import { calculateVendorPerformance } from '../../../utils/vendorPerformanceCalculator';

export default function VendorProfileDrawer({
    isOpen,
    onClose,
    vendor,
    token,
    user,
    onVendorUpdated,
    onEditVendor
}) {
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen || !vendor) return null;

    const perf = calculateVendorPerformance(vendor.performance);

    const handleStatusToggle = async (newStatus) => {
        setIsUpdating(true);
        try {
            const res = await crmApi.updateVendorStatus(token, vendor._id, newStatus);
            if (res.success && onVendorUpdated) {
                onVendorUpdated(res.vendor);
            }
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete/archive ${vendor.businessName || vendor.name}?`)) return;
        setIsUpdating(true);
        try {
            const res = await crmApi.deleteVendor(token, vendor._id);
            if (res.success) {
                alert(res.message);
                if (onVendorUpdated) onVendorUpdated(null);
                onClose();
            }
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex justify-end transition-opacity">
            <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">

                {/* HEADER */}
                <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">🏨</span>
                            <h2 className="text-lg font-serif font-extrabold">{vendor.businessName || vendor.name}</h2>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{vendor.category} · Code: #{vendor.vendorCode || 'VY-V-0000'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center font-bold">✕</button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">

                    {/* STATUS & CONTACT CARD */}
                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">Master Vendor Profile</span>
                            <span className={`px-3 py-1 rounded-full font-extrabold text-xs uppercase ${
                                vendor.status === 'ACTIVE' || vendor.availabilityStatus === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                                {vendor.status || vendor.availabilityStatus}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-stone-900">
                            <div>
                                <span className="text-[10px] text-stone-400 uppercase block font-semibold">Contact Person</span>
                                {vendor.contactPerson || 'Not Specified'}
                            </div>
                            <div>
                                <span className="text-[10px] text-stone-400 uppercase block font-semibold">Phone / Mobile</span>
                                📞 {vendor.phone || vendor.mobile}
                            </div>
                            <div>
                                <span className="text-[10px] text-stone-400 uppercase block font-semibold">City / Location</span>
                                📍 {vendor.city || vendor.location}
                            </div>
                            <div>
                                <span className="text-[10px] text-stone-400 uppercase block font-semibold">Base Rate</span>
                                ₹{(vendor.baseRate || 0).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    {/* PERFORMANCE SCORE CARD */}
                    <div className="bg-stone-900 text-white p-5 rounded-2xl space-y-3 shadow-md">
                        <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">Vendor Performance Engine</span>
                        {perf.isNewVendor ? (
                            <div className="bg-stone-800/90 border border-stone-700 p-3.5 rounded-xl text-center font-bold text-amber-300">
                                🆕 NEW VENDOR · Not enough performance data
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 bg-stone-800/80 p-3.5 rounded-xl border border-stone-700 text-center">
                                <div>
                                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Reliability Score</span>
                                    <span className="text-xl font-extrabold text-emerald-400">{perf.reliabilityScore} / 100</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Total Trips</span>
                                    <span className="text-xl font-extrabold text-white">{perf.totalAssignments}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Success Rate</span>
                                    <span className="text-xl font-extrabold text-amber-400">{perf.successRate}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SERVICES & RATES */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-extrabold uppercase text-stone-900 tracking-wider">Configured Services & Rates ({vendor.services?.length || 0})</h3>
                        <div className="space-y-2">
                            {(vendor.services || []).map((srv, idx) => (
                                <div key={idx} className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between text-xs">
                                    <span className="font-bold text-stone-900">{srv.serviceName}</span>
                                    <span className="font-extrabold text-amber-800">₹{srv.baseRate?.toLocaleString('en-IN')} / {srv.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200 space-y-2">
                        <span className="text-[11px] font-extrabold text-stone-600 uppercase tracking-widest block">Vendor Actions</span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => onEditVendor(vendor)}
                                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-extrabold rounded-xl uppercase"
                            >
                                ✏️ Edit Vendor
                            </button>

                            {vendor.status === 'ACTIVE' ? (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleStatusToggle('INACTIVE')}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl uppercase"
                                >
                                    ⚠️ Disable Vendor
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleStatusToggle('ACTIVE')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl uppercase"
                                >
                                    ✅ Activate Vendor
                                </button>
                            )}

                            {user?.role === 'CEO' && (
                                <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl uppercase"
                                >
                                    🗑️ Delete / Archive
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

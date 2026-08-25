import React, { useState, useEffect } from 'react';
import { crmApi } from '../../../services/crmApi';
import { recommendVendors } from '../../../utils/smartVendorRecommender';

export default function VendorSelector({
    category,
    token,
    selectedVendorId,
    selectedVendorCost,
    onSelectVendor,
    onOverrideCost
}) {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOverridden, setIsOverridden] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [customCost, setCustomCost] = useState(selectedVendorCost || 0);

    useEffect(() => {
        const loadCategoryVendors = async () => {
            if (!category || !token) return;
            setLoading(true);
            try {
                const res = await crmApi.fetchVendorsByCategory(token, category);
                if (res.success && res.vendors) {
                    const ranked = recommendVendors(res.vendors, category);
                    setVendors(ranked);
                }
            } catch (err) {
                console.warn('Failed to load vendors for category', category, err);
            } finally {
                setLoading(false);
            }
        };
        loadCategoryVendors();
    }, [category, token]);

    const handleVendorPick = (e) => {
        const vendorId = e.target.value;
        const vendor = vendors.find(v => v._id === vendorId);
        if (vendor) {
            const cost = vendor.baseRate || 0;
            setCustomCost(cost);
            setIsOverridden(false);
            onSelectVendor(vendor, cost);
        } else {
            onSelectVendor(null, customCost);
        }
    };

    const handleCostChange = (val) => {
        const num = Number(val) || 0;
        setCustomCost(num);
        setIsOverridden(true);
        if (onOverrideCost) {
            onOverrideCost(num, overrideReason || 'Manual Rate Override');
        }
    };

    const handleReasonChange = (val) => {
        setOverrideReason(val);
        if (onOverrideCost) {
            onOverrideCost(customCost, val);
        }
    };

    return (
        <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-2 text-xs">
            <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2">
                <div className="flex-1">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">
                        Select Vendor ({category})
                    </label>
                    <select
                        value={selectedVendorId || ''}
                        onChange={handleVendorPick}
                        disabled={loading}
                        className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer"
                    >
                        <option value="">-- Select Master Vendor --</option>
                        {vendors.map((v) => (
                            <option key={v._id} value={v._id}>
                                {v.recommendationBadge ? '⭐ ' : ''}{v.businessName || v.name} · ₹{v.baseRate?.toLocaleString('en-IN')} ({v.reliabilityLabel})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-32">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">
                        Rate (₹)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={customCost}
                        onChange={(e) => handleCostChange(e.target.value)}
                        className={`w-full border font-extrabold text-right px-2.5 py-1.5 rounded-xl text-xs ${
                            isOverridden
                                ? 'bg-amber-50 border-amber-500 text-amber-900'
                                : 'bg-white border-stone-300 text-stone-900'
                        }`}
                    />
                </div>
            </div>

            {isOverridden && (
                <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Override Reason:</span>
                    <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        placeholder="e.g. Peak Season Rate / Special Discount"
                        className="flex-1 bg-white border border-amber-300 text-[11px] font-medium text-stone-800 px-2 py-1 rounded-lg"
                    />
                </div>
            )}
        </div>
    );
}

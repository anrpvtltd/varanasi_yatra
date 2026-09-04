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
    const [selectedRuleId, setSelectedRuleId] = useState('');

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

    const activeVendor = vendors.find(v => v._id === selectedVendorId);

    const handleVendorPick = (e) => {
        const vendorId = e.target.value;
        const vendor = vendors.find(v => v._id === vendorId);
        if (vendor) {
            let cost = vendor.baseRate || 0;
            let ruleId = '';
            let firstRule = null;
            if (vendor.rateRules && vendor.rateRules.length > 0) {
                firstRule = vendor.rateRules[0];
                ruleId = firstRule.ruleId || '0';
                cost = firstRule.referenceRate || 0;
            }
            setSelectedRuleId(ruleId);
            setCustomCost(cost);
            setIsOverridden(false);
            onSelectVendor(vendor, cost, firstRule);
        } else {
            setSelectedRuleId('');
            onSelectVendor(null, customCost, null);
        }
    };

    const handleRulePick = (e) => {
        const ruleId = e.target.value;
        setSelectedRuleId(ruleId);
        if (activeVendor && activeVendor.rateRules) {
            const rule = activeVendor.rateRules.find(r => (r.ruleId || '') === ruleId);
            if (rule) {
                const cost = rule.referenceRate || 0;
                setCustomCost(cost);
                setIsOverridden(false);
                onSelectVendor(activeVendor, cost, rule);
            }
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

    const handleCopyPhone = (phone) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        alert(`📋 Copied provider contact: ${phone}`);
    };

    return (
        <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-2 text-xs">
            <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2">
                <div className="flex-1">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">
                        Select Resource ({category})
                    </label>
                    <select
                        value={selectedVendorId || ''}
                        onChange={handleVendorPick}
                        disabled={loading}
                        className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer"
                    >
                        <option value="">-- Select Master Resource --</option>
                        {vendors.map((v) => (
                            <option key={v._id} value={v._id}>
                                {v.recommendationBadge ? '⭐ ' : ''}{v.businessName || v.name} · ₹{(v.baseRate || 0).toLocaleString('en-IN')} ({v.reliabilityLabel || 'Active'})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="w-32">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block mb-1">
                        Vendor Cost (₹)
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

            {/* SECONDARY RATE RULE SELECTION IF CONFIGURED */}
            {activeVendor && activeVendor.rateRules && activeVendor.rateRules.length > 0 && (
                <div className="bg-white border border-stone-200 p-2 rounded-xl flex items-center gap-2">
                    <label className="text-[10px] font-bold text-stone-500 whitespace-nowrap">
                        Rate Rule:
                    </label>
                    <select
                        value={selectedRuleId}
                        onChange={handleRulePick}
                        className="flex-1 bg-stone-50 border border-stone-300 font-semibold text-stone-900 rounded-lg px-2 py-1 text-xs"
                    >
                        {activeVendor.rateRules.map((r, i) => (
                            <option key={r.ruleId || i} value={r.ruleId || ''}>
                                {r.ruleName || r.roomType || r.vehicleName || `Rule #${i + 1}`}
                                {r.acType ? ` (${r.acType})` : ''}
                                {r.slot ? ` [${r.slot}]` : ''}
                                {r.commercialModel === 'VENDOR_QUOTE_REQUIRED'
                                    ? ' · [Vendor Quote Required]'
                                    : ` · ₹${(r.referenceRate || 0).toLocaleString('en-IN')}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* CATEGORY-SPECIFIC HELPER: PANDIT CUSTOMER DIRECT ACTIONS */}
            {activeVendor && (category === 'PANDIT' || activeVendor.commercialModel === 'CUSTOMER_DIRECT') && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                            <span>🪔</span>
                            <span>{activeVendor.contactPerson || activeVendor.businessName || 'Pandit Ji'}</span>
                            <span className="text-stone-500 font-normal">({activeVendor.phone || activeVendor.mobile})</span>
                        </div>
                        {activeVendor.metadata?.rituals && activeVendor.metadata.rituals.length > 0 && (
                            <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                                Rituals: {activeVendor.metadata.rituals.join(', ')}
                            </div>
                        )}
                        <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wide block mt-0.5">
                            Customer Direct Pay · Direct guest dakshina settlement (₹0 in package total)
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {activeVendor.phone && (
                            <>
                                <a
                                    href={`tel:${activeVendor.phone}`}
                                    className="px-2 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded text-[10px] font-bold"
                                    title="Call Pandit"
                                >
                                    📞 Call
                                </a>
                                <a
                                    href={`https://wa.me/91${(activeVendor.phone || '').replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                                    title="WhatsApp Pandit"
                                >
                                    💬 WA
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleCopyPhone(activeVendor.phone)}
                                    className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-[10px] font-bold cursor-pointer"
                                    title="Copy Contact Number"
                                >
                                    📋 Copy
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* CATEGORY-SPECIFIC HELPER: SHOPPING PARTNER COMMISSION */}
            {activeVendor && (category === 'SHOPPING' || activeVendor.commercialModel === 'COMMISSION') && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span>🛍️</span>
                            <span>{activeVendor.businessName}</span>
                            <span className="text-emerald-700 font-semibold text-[10px]">
                                · Comm: {activeVendor.metadata?.commissionRate || 15}%
                                {activeVendor.metadata?.guideSharePercent ? ` (Guide: ${activeVendor.metadata.guideSharePercent}%)` : ''}
                            </span>
                        </div>
                        <span className="text-[10px] text-emerald-800 block mt-0.5">
                            Direct Guest Visit · ₹0 in customer package total · Commission tracked separately
                        </span>
                    </div>
                </div>
            )}

            {/* CATEGORY-SPECIFIC HELPER: DARSHAN PASS-THROUGH */}
            {activeVendor && (category === 'DARSHAN' || category === 'VIP_DARSHAN' || activeVendor.commercialModel === 'PASS_THROUGH') && (
                <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-xs">
                    <div className="font-bold text-sky-950 flex items-center gap-1.5">
                        <span>🛕</span>
                        <span>{activeVendor.metadata?.templeName || 'Kashi Vishwanath'}</span>
                        <span className="text-sky-700 font-semibold text-[10px]">· {activeVendor.metadata?.passName || 'VIP Pass'}</span>
                    </div>
                    <span className="text-[10px] text-sky-800 font-extrabold uppercase tracking-wide block mt-0.5">
                        At-Cost Pass-Through · Billed at exact pass cost (0% company margin)
                    </span>
                </div>
            )}

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

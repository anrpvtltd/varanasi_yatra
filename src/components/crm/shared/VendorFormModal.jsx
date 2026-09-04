import React, { useState, useEffect } from 'react';
import { crmApi } from '../../../services/crmApi';
import {
    RESOURCE_CATEGORIES,
    RESOURCE_CATEGORY_LABELS,
    CATEGORY_DEFAULT_COMMERCIAL_MODELS,
    COMMERCIAL_MODELS,
    COMMERCIAL_MODEL_LABELS
} from '../../../constants/phase4Constants';

export default function VendorFormModal({
    isOpen,
    onClose,
    vendor,
    token,
    user: _user,
    onVendorSaved
}) {
    const [category, setCategory] = useState('HOTEL');
    const [businessName, setBusinessName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [alternatePhone, setAlternatePhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('Varanasi');
    const [address, setAddress] = useState('');
    const [baseRate, setBaseRate] = useState(0);
    const [commercialModel, setCommercialModel] = useState('SELLING_PRICE');
    const [notes, setNotes] = useState('');
    const [ceoOnlyNotes, setCeoOnlyNotes] = useState('');
    const [rateRules, setRateRules] = useState([]);
    const [metadata, setMetadata] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (vendor) {
            let cat = (vendor.category || 'HOTEL').toUpperCase();
            if (cat === 'BOAT_RIDE') cat = 'BOAT';
            if (cat === 'TOUR_GUIDE') cat = 'GUIDE';
            if (cat === 'SHOPPING_PARTNER') cat = 'SHOPPING';
            if (cat === 'VIP_DARSHAN') cat = 'DARSHAN';

            setCategory(cat);
            setBusinessName(vendor.businessName || vendor.name || '');
            setContactPerson(vendor.contactPerson || '');
            setPhone(vendor.phone || vendor.mobile || '');
            setAlternatePhone(vendor.alternatePhone || '');
            setEmail(vendor.email || '');
            setCity(vendor.city || vendor.location || 'Varanasi');
            setAddress(vendor.address || '');
            setBaseRate(vendor.baseRate || 0);
            setCommercialModel(vendor.commercialModel || CATEGORY_DEFAULT_COMMERCIAL_MODELS[cat] || 'SELLING_PRICE');
            setNotes(vendor.notes || '');
            setCeoOnlyNotes(vendor.metadata?.ceoOnlyNotes || '');
            setRateRules(vendor.rateRules || []);
            setMetadata(vendor.metadata || {});
        } else {
            const defCat = 'HOTEL';
            setCategory(defCat);
            setBusinessName('');
            setContactPerson('');
            setPhone('');
            setAlternatePhone('');
            setEmail('');
            setCity('Varanasi');
            setAddress('');
            setBaseRate(0);
            setCommercialModel(CATEGORY_DEFAULT_COMMERCIAL_MODELS[defCat] || 'SELLING_PRICE');
            setNotes('');
            setCeoOnlyNotes('');
            setRateRules([]);
            setMetadata({
                starCategory: '3-Star',
                rituals: ['Rudrabhishek', 'Mangla Aarti Sankalp'],
                languages: ['Hindi', 'English'],
                guideType: 'DIRECT_SERVICE',
                commissionRate: 15,
                guideSharePercent: 5,
                passCost: 500,
                templeName: 'Kashi Vishwanath',
                passName: 'Sugam Darshan VIP Pass'
            });
        }
    }, [vendor, isOpen]);

    if (!isOpen) return null;

    const handleCategoryChange = (newCat) => {
        setCategory(newCat);
        setCommercialModel(CATEGORY_DEFAULT_COMMERCIAL_MODELS[newCat] || 'SELLING_PRICE');
        // Reset rate rules for new category if empty
        if (rateRules.length === 0) {
            if (newCat === 'HOTEL') {
                setRateRules([
                    { ruleId: `rule_${Date.now()}_1`, ruleName: 'Deluxe Room AC', roomType: 'Deluxe Room', acType: 'AC', referenceRate: 2200, unit: 'Night' },
                    { ruleId: `rule_${Date.now()}_2`, ruleName: 'Standard Non-AC', roomType: 'Standard Room', acType: 'Non-AC', referenceRate: 1500, unit: 'Night' }
                ]);
            } else if (newCat === 'TRANSPORT') {
                setRateRules([
                    { ruleId: `rule_${Date.now()}_1`, ruleName: 'Local Sedan', vehicleType: 'Sedan', seatingCapacity: 4, vehicleName: 'Dzire', route: 'Varanasi Local 8hr/80km', commercialModel: 'FIXED_VENDOR_RATE', referenceRate: 3500, unit: 'Day' },
                    { ruleId: `rule_${Date.now()}_2`, ruleName: 'Airport Transfer', vehicleType: 'Sedan', seatingCapacity: 4, vehicleName: 'Dzire', route: 'Airport Transfer', commercialModel: 'FIXED_VENDOR_RATE', referenceRate: 1500, unit: 'Trip' },
                    { ruleId: `rule_${Date.now()}_3`, ruleName: 'Custom Multi-City Tour', vehicleType: 'Innova Crysta', seatingCapacity: 6, vehicleName: 'Crysta', route: 'Multi-City (Varanasi-Ayodhya-Gaya)', commercialModel: 'VENDOR_QUOTE_REQUIRED', referenceRate: 0, unit: 'Trip' }
                ]);
            } else if (newCat === 'BOAT') {
                setRateRules([
                    { ruleId: `rule_${Date.now()}_1`, ruleName: '7-Seater 0-2km Morning', seatingCapacity: 7, route: '0-2 km (Assi to Dashashwamedh)', slot: 'Morning', referenceRate: 2000, unit: 'Ride' },
                    { ruleId: `rule_${Date.now()}_2`, ruleName: '7-Seater 2-4km Ganga Aarti', seatingCapacity: 7, route: '2-4 km (Full Ghats)', slot: 'Evening Ganga Aarti', referenceRate: 2300, unit: 'Ride' }
                ]);
            }
        }
    };

    const handleAddRateRule = () => {
        const newId = `rule_${Date.now()}`;
        if (category === 'HOTEL') {
            setRateRules([...rateRules, { ruleId: newId, ruleName: 'Deluxe Room', roomType: 'Deluxe Room', acType: 'AC', referenceRate: 2000, unit: 'Night' }]);
        } else if (category === 'TRANSPORT') {
            setRateRules([...rateRules, { ruleId: newId, ruleName: 'Transport Service', vehicleType: 'Sedan', seatingCapacity: 4, vehicleName: 'Dzire', route: 'Varanasi Local', commercialModel: 'FIXED_VENDOR_RATE', referenceRate: 3000, unit: 'Day' }]);
        } else if (category === 'BOAT') {
            setRateRules([...rateRules, { ruleId: newId, ruleName: 'Boat Ride', seatingCapacity: 7, route: '0-2 km', slot: 'Morning', referenceRate: 1800, unit: 'Ride' }]);
        } else {
            setRateRules([...rateRules, { ruleId: newId, ruleName: 'Service Rate', referenceRate: 1000, unit: 'Item' }]);
        }
    };

    const handleUpdateRateRule = (idx, field, val) => {
        const copy = [...rateRules];
        copy[idx] = { ...copy[idx], [field]: val };
        setRateRules(copy);
    };

    const handleRemoveRateRule = (idx) => {
        setRateRules(rateRules.filter((_, i) => i !== idx));
    };

    const handleMetaChange = (field, val) => {
        setMetadata(prev => ({ ...prev, [field]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!businessName || !phone) {
            alert('Business Name and Phone are required.');
            return;
        }

        // Validate that paid categories don't have invalid 0 or negative reference rates
        for (const rule of rateRules) {
            if (['HOTEL', 'BOAT'].includes(category) && Number(rule.referenceRate) <= 0) {
                alert(`❌ Reference rate for "${rule.ruleName || 'item'}" must be greater than ₹0.`);
                return;
            }
            if (category === 'TRANSPORT' && rule.commercialModel === 'FIXED_VENDOR_RATE' && Number(rule.referenceRate) <= 0) {
                alert(`❌ Fixed route reference rate for "${rule.ruleName || 'item'}" must be greater than ₹0.`);
                return;
            }
        }

        setIsSaving(true);
        const payload = {
            category,
            businessName,
            name: businessName,
            contactPerson,
            phone,
            mobile: phone,
            alternatePhone,
            email,
            city,
            location: city,
            address,
            baseRate: Number(baseRate) || (rateRules[0]?.referenceRate || 0),
            commercialModel,
            notes,
            rateRules,
            metadata: {
                ...metadata,
                ceoOnlyNotes
            }
        };

        try {
            let res;
            if (vendor && vendor._id) {
                res = await crmApi.updateVendor(token, vendor._id, payload);
            } else {
                res = await crmApi.createVendor(token, payload);
            }

            if (res.success) {
                if (onVendorSaved) onVendorSaved(res.vendor);
                onClose();
            } else {
                alert('Save failed: ' + (res.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Save failed: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn">
                
                {/* MODAL HEADER */}
                <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
                    <div className="flex items-center space-x-2.5">
                        <span className="text-2xl">🏛️</span>
                        <div>
                            <h2 className="text-lg font-serif font-extrabold">
                                {vendor ? `Edit Resource: ${vendor.businessName || vendor.name}` : 'Create CEO Master Resource'}
                            </h2>
                            <p className="text-[11px] text-stone-400">Configure approved vendor details, commercial model, and immutable reference rates.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                    
                    {/* CATEGORY & COMMERCIAL MODEL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Resource Category *
                            </label>
                            <select
                                value={category}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            >
                                {Object.entries(RESOURCE_CATEGORIES).map(([key, val]) => (
                                    <option key={key} value={val}>
                                        {RESOURCE_CATEGORY_LABELS[key] || val}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Commercial Model *
                            </label>
                            <select
                                value={commercialModel}
                                onChange={(e) => setCommercialModel(e.target.value)}
                                className="w-full bg-white border border-stone-300 font-bold text-amber-900 rounded-xl px-3 py-2 text-xs"
                            >
                                {Object.entries(COMMERCIAL_MODELS).map(([key, val]) => (
                                    <option key={key} value={val}>
                                        {COMMERCIAL_MODEL_LABELS[key] || val}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* BASIC DETAILS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Resource / Business Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="e.g. Hotel Heritage Kashi / Banaras Cabs"
                                className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Contact Person
                            </label>
                            <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                placeholder="e.g. Anand Mishra"
                                className="w-full bg-white border border-stone-300 font-medium text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Phone Number *
                            </label>
                            <input
                                type="text"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Alternate Phone
                            </label>
                            <input
                                type="text"
                                value={alternatePhone}
                                onChange={(e) => setAlternatePhone(e.target.value)}
                                placeholder="e.g. 9876543211"
                                className="w-full bg-white border border-stone-300 font-medium text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                City / Location
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Varanasi"
                                className="w-full bg-white border border-stone-300 font-medium text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* CATEGORY-SPECIFIC SECTIONS */}
                    {/* ========================================================================= */}

                    {/* 1. HOTEL SECTION */}
                    {category === 'HOTEL' && (
                        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-extrabold text-amber-900 text-xs">🏨 Hotel Star & Room Rates</span>
                                    <p className="text-[11px] text-stone-500">Commercial model: SELLING_PRICE (Base rate is CEO reference cost; Manager decides package selling price).</p>
                                </div>
                                <div className="w-36">
                                    <select
                                        value={metadata.starCategory || '3-Star'}
                                        onChange={(e) => handleMetaChange('starCategory', e.target.value)}
                                        className="w-full bg-white border border-amber-300 font-bold rounded-xl px-2 py-1 text-xs"
                                    >
                                        <option value="Budget">Budget</option>
                                        <option value="3-Star">⭐ 3-Star</option>
                                        <option value="4-Star">⭐⭐ 4-Star</option>
                                        <option value="5-Star">⭐⭐⭐ 5-Star</option>
                                        <option value="Heritage">🏰 Heritage</option>
                                    </select>
                                </div>
                            </div>

                            {/* Room Rates Table */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider">Room Type Entries</span>
                                    <button
                                        type="button"
                                        onClick={handleAddRateRule}
                                        className="text-[11px] bg-amber-800 hover:bg-amber-900 text-white font-bold px-2.5 py-1 rounded-lg"
                                    >
                                        + Add Room Rate
                                    </button>
                                </div>
                                {rateRules.map((rule, idx) => (
                                    <div key={idx} className="bg-white border border-stone-200 p-2.5 rounded-xl flex flex-wrap sm:flex-nowrap gap-2 items-center text-xs">
                                        <input
                                            type="text"
                                            value={rule.roomType || ''}
                                            onChange={(e) => handleUpdateRateRule(idx, 'roomType', e.target.value)}
                                            placeholder="Room Type (e.g. Deluxe, Suite)"
                                            className="flex-1 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-bold"
                                        />
                                        <select
                                            value={rule.acType || 'AC'}
                                            onChange={(e) => handleUpdateRateRule(idx, 'acType', e.target.value)}
                                            className="w-24 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-semibold"
                                        >
                                            <option value="AC">AC</option>
                                            <option value="Non-AC">Non-AC</option>
                                        </select>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-stone-400">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={rule.referenceRate || 0}
                                                onChange={(e) => handleUpdateRateRule(idx, 'referenceRate', Number(e.target.value))}
                                                placeholder="Rate/Night"
                                                className="w-24 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-extrabold text-right text-stone-900"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRateRule(idx)}
                                            className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. TRANSPORT SECTION */}
                    {category === 'TRANSPORT' && (
                        <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-2xl space-y-3">
                            <div>
                                <span className="font-extrabold text-sky-900 text-xs">🚗 Transport Fleets & Route Pricing Rules</span>
                                <p className="text-[11px] text-stone-500">
                                    Support both <b>FIXED_VENDOR_RATE</b> (e.g. Sedan Local ₹3500/day, Airport Transfer ₹1500) and <b>VENDOR_QUOTE_REQUIRED</b> (custom multi-city tours).
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider">Vehicles & Routes</span>
                                    <button
                                        type="button"
                                        onClick={handleAddRateRule}
                                        className="text-[11px] bg-sky-800 hover:bg-sky-900 text-white font-bold px-2.5 py-1 rounded-lg"
                                    >
                                        + Add Vehicle/Route
                                    </button>
                                </div>
                                {rateRules.map((rule, idx) => (
                                    <div key={idx} className="bg-white border border-stone-200 p-2.5 rounded-xl space-y-2 text-xs">
                                        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                                            <select
                                                value={rule.vehicleType || 'Sedan'}
                                                onChange={(e) => handleUpdateRateRule(idx, 'vehicleType', e.target.value)}
                                                className="bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-bold"
                                            >
                                                <option value="Sedan">Sedan (Dzire/Etios)</option>
                                                <option value="SUV">SUV (Ertiga)</option>
                                                <option value="Innova Crysta">Innova Crysta</option>
                                                <option value="Tempo Traveller">Tempo Traveller</option>
                                                <option value="Mini Bus">Mini Bus</option>
                                                <option value="Coach">Coach Bus</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={rule.route || ''}
                                                onChange={(e) => handleUpdateRateRule(idx, 'route', e.target.value)}
                                                placeholder="Route / Scope (e.g. Local 8hr/80km, Airport Transfer)"
                                                className="flex-1 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-medium"
                                            />
                                            <select
                                                value={rule.commercialModel || 'FIXED_VENDOR_RATE'}
                                                onChange={(e) => handleUpdateRateRule(idx, 'commercialModel', e.target.value)}
                                                className="bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-bold text-amber-900"
                                            >
                                                <option value="FIXED_VENDOR_RATE">FIXED_VENDOR_RATE</option>
                                                <option value="VENDOR_QUOTE_REQUIRED">VENDOR_QUOTE_REQUIRED</option>
                                            </select>
                                            {rule.commercialModel !== 'VENDOR_QUOTE_REQUIRED' && (
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-stone-400">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={rule.referenceRate || 0}
                                                        onChange={(e) => handleUpdateRateRule(idx, 'referenceRate', Number(e.target.value))}
                                                        placeholder="Rate"
                                                        className="w-20 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-extrabold text-right"
                                                    />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRateRule(idx)}
                                                className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. PANDIT SECTION */}
                    {category === 'PANDIT' && (
                        <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl space-y-3">
                            <div className="bg-orange-100/70 text-orange-900 p-2.5 rounded-xl border border-orange-200 text-xs">
                                <b>🪔 CUSTOMER_DIRECT Model:</b> Pandit services are direct rituals. The price does <b>NOT</b> become customer package price. Guest pays Pandit directly at the ghat/temple. Manager will copy contact to guest.
                            </div>
                            <div>
                                <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                    Rituals / Puja Services Offered
                                </label>
                                <input
                                    type="text"
                                    value={Array.isArray(metadata.rituals) ? metadata.rituals.join(', ') : (metadata.rituals || '')}
                                    onChange={(e) => handleMetaChange('rituals', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="e.g. Rudrabhishek, Mangla Aarti, Pind Daan, Shradh Karma, Kashi Sankalp"
                                    className="w-full bg-white border border-stone-300 font-semibold text-stone-900 rounded-xl px-3 py-2 text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {/* 4. BOAT SECTION */}
                    {category === 'BOAT' && (
                        <div className="bg-cyan-50/70 border border-cyan-200 p-4 rounded-2xl space-y-3">
                            <div>
                                <span className="font-extrabold text-cyan-900 text-xs">⛵ Boat Operators & Rate Rules</span>
                                <p className="text-[11px] text-stone-500">Configure rate rules by capacity (7-seater, 8-seater, Bajra), distance/route, and slot (Morning, Evening Aarti).</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-extrabold text-stone-600 uppercase tracking-wider">Boat Pricing Table</span>
                                    <button
                                        type="button"
                                        onClick={handleAddRateRule}
                                        className="text-[11px] bg-cyan-800 hover:bg-cyan-900 text-white font-bold px-2.5 py-1 rounded-lg"
                                    >
                                        + Add Boat Rule
                                    </button>
                                </div>
                                {rateRules.map((rule, idx) => (
                                    <div key={idx} className="bg-white border border-stone-200 p-2.5 rounded-xl flex flex-wrap sm:flex-nowrap gap-2 items-center text-xs">
                                        <select
                                            value={rule.seatingCapacity || 7}
                                            onChange={(e) => handleUpdateRateRule(idx, 'seatingCapacity', Number(e.target.value))}
                                            className="bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-bold"
                                        >
                                            <option value={7}>7-Seater</option>
                                            <option value={8}>8-Seater</option>
                                            <option value={12}>12-Seater</option>
                                            <option value={20}>20-Seater Bajra</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={rule.route || ''}
                                            onChange={(e) => handleUpdateRateRule(idx, 'route', e.target.value)}
                                            placeholder="Route / Distance (e.g. 0-2 km Assi-Dashashwamedh)"
                                            className="flex-1 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-medium"
                                        />
                                        <select
                                            value={rule.slot || 'Morning'}
                                            onChange={(e) => handleUpdateRateRule(idx, 'slot', e.target.value)}
                                            className="bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-semibold"
                                        >
                                            <option value="Morning">Morning</option>
                                            <option value="Subah-e-Banaras">Subah-e-Banaras</option>
                                            <option value="Evening Ganga Aarti">Evening Ganga Aarti</option>
                                            <option value="Night Ride">Night Ride</option>
                                        </select>
                                        <div className="flex items-center space-x-1">
                                            <span className="text-stone-400">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={rule.referenceRate || 0}
                                                onChange={(e) => handleUpdateRateRule(idx, 'referenceRate', Number(e.target.value))}
                                                placeholder="Rate"
                                                className="w-20 bg-stone-50 border border-stone-200 px-2 py-1 rounded-lg font-extrabold text-right"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRateRule(idx)}
                                            className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5. GUIDE SECTION */}
                    {category === 'GUIDE' && (
                        <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-3">
                            <div>
                                <span className="font-extrabold text-purple-900 text-xs">🚩 Local Tour Guide Configuration</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Languages Spoken</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(metadata.languages) ? metadata.languages.join(', ') : (metadata.languages || '')}
                                        onChange={(e) => handleMetaChange('languages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                        placeholder="e.g. Hindi, English, Bengali, Tamil"
                                        className="w-full bg-white border border-stone-300 font-semibold rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Guide Type</label>
                                    <select
                                        value={metadata.guideType || 'DIRECT_SERVICE'}
                                        onChange={(e) => handleMetaChange('guideType', e.target.value)}
                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2.5 py-1.5 text-xs"
                                    >
                                        <option value="DIRECT_SERVICE">Direct Service Only</option>
                                        <option value="SHOPPING_PARTNER_LINKED">Shopping Partner Linked</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. SHOPPING PARTNER SECTION */}
                    {category === 'SHOPPING' && (
                        <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-3">
                            <div className="bg-rose-100/70 text-rose-900 p-2.5 rounded-xl border border-rose-200 text-xs">
                                <b>🛍️ COMMISSION Model:</b> Customer pays the shop directly for saree/handicraft purchases. Package price is ₹0. Business receives commission, and guide share is tracked separately.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Business Commission Rate (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={metadata.commissionRate || 15}
                                        onChange={(e) => handleMetaChange('commissionRate', Number(e.target.value))}
                                        className="w-full bg-white border border-stone-300 font-extrabold text-rose-900 rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Guide Share (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={metadata.guideSharePercent || 5}
                                        onChange={(e) => handleMetaChange('guideSharePercent', Number(e.target.value))}
                                        className="w-full bg-white border border-stone-300 font-extrabold text-stone-800 rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Associated Guide Name</label>
                                    <input
                                        type="text"
                                        value={metadata.associatedGuideName || ''}
                                        onChange={(e) => handleMetaChange('associatedGuideName', e.target.value)}
                                        placeholder="e.g. Ramesh Guide"
                                        className="w-full bg-white border border-stone-300 font-medium rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. DARSHAN / PASS SECTION */}
                    {category === 'DARSHAN' && (
                        <div className="bg-amber-50/70 border border-amber-300 p-4 rounded-2xl space-y-3">
                            <div className="bg-amber-100/70 text-amber-900 p-2.5 rounded-xl border border-amber-200 text-xs">
                                <b>🛕 PASS_THROUGH Model:</b> Official temple passes/tickets have 0% company margin. Actual pass cost is charged directly to customer package.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Temple / Place</label>
                                    <input
                                        type="text"
                                        value={metadata.templeName || 'Kashi Vishwanath'}
                                        onChange={(e) => handleMetaChange('templeName', e.target.value)}
                                        placeholder="e.g. Kashi Vishwanath"
                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Pass Name</label>
                                    <input
                                        type="text"
                                        value={metadata.passName || 'Sugam Darshan VIP Pass'}
                                        onChange={(e) => handleMetaChange('passName', e.target.value)}
                                        placeholder="e.g. Sugam Darshan Pass"
                                        className="w-full bg-white border border-stone-300 font-medium rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Ticket / Pass Cost (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={metadata.passCost || 500}
                                        onChange={(e) => {
                                            const num = Number(e.target.value);
                                            handleMetaChange('passCost', num);
                                            setBaseRate(num);
                                        }}
                                        className="w-full bg-white border border-stone-300 font-extrabold text-right text-stone-900 rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 8. LEAD PARTNER SECTION */}
                    {category === 'LEAD_PARTNER' && (
                        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
                            <div>
                                <span className="font-extrabold text-emerald-900 text-xs">🤝 Travel Agent / Referral Partner Agreement</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Agency Name</label>
                                    <input
                                        type="text"
                                        value={metadata.agencyName || ''}
                                        onChange={(e) => handleMetaChange('agencyName', e.target.value)}
                                        placeholder="e.g. Royal India Holidays"
                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Commission Agreement Terms</label>
                                    <input
                                        type="text"
                                        value={metadata.commissionTerms || ''}
                                        onChange={(e) => handleMetaChange('commissionTerms', e.target.value)}
                                        placeholder="e.g. 10% referral on net profit margin"
                                        className="w-full bg-white border border-stone-300 font-medium rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 9. OTHER SERVICES SECTION */}
                    {category === 'OTHER' && (
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-3">
                            <span className="font-extrabold text-stone-800 text-xs">✨ Custom / Other Service Details</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Reference Base Rate (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={baseRate}
                                        onChange={(e) => setBaseRate(Number(e.target.value))}
                                        className="w-full bg-white border border-stone-300 font-extrabold text-stone-900 rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTES & CEO-ONLY CONFIDENTIAL NOTES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">
                                Operational Notes (Visible to Manager)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Contact instructions, landmark, payment terms..."
                                className="w-full bg-white border border-stone-300 rounded-xl p-2 text-xs font-medium text-stone-800"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block mb-1">
                                🔒 CEO-Only Notes (Strictly Confidential)
                            </label>
                            <textarea
                                value={ceoOnlyNotes}
                                onChange={(e) => setCeoOnlyNotes(e.target.value)}
                                rows={2}
                                placeholder="Confidential contract terms, private commission, internal notes..."
                                className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2 text-xs font-medium text-amber-950"
                            />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end space-x-2 rounded-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl uppercase tracking-wider"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl uppercase tracking-wider shadow cursor-pointer"
                        >
                            {isSaving ? 'Saving...' : vendor ? 'Update Resource' : 'Save Master Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

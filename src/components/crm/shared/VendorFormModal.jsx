import React, { useState, useEffect } from 'react';
import { crmApi } from '../../../services/crmApi';
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, UNIT_TYPES, COMMISSION_TYPES } from '../../../constants/phase4Constants';

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
    const [notes, setNotes] = useState('');
    const [services, setServices] = useState([]);
    const [commissionType, setCommissionType] = useState('PERCENTAGE');
    const [commissionValue, setCommissionValue] = useState(5);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (vendor) {
            setCategory(vendor.category || 'HOTEL');
            setBusinessName(vendor.businessName || vendor.name || '');
            setContactPerson(vendor.contactPerson || '');
            setPhone(vendor.phone || vendor.mobile || '');
            setAlternatePhone(vendor.alternatePhone || '');
            setEmail(vendor.email || '');
            setCity(vendor.city || vendor.location || 'Varanasi');
            setAddress(vendor.address || '');
            setBaseRate(vendor.baseRate || 0);
            setNotes(vendor.notes || '');
            setServices(vendor.services || []);
            setCommissionType(vendor.metadata?.commissionType || 'PERCENTAGE');
            setCommissionValue(vendor.metadata?.commissionValue || 5);
        } else {
            setCategory('HOTEL');
            setBusinessName('');
            setContactPerson('');
            setPhone('');
            setAlternatePhone('');
            setEmail('');
            setCity('Varanasi');
            setAddress('');
            setBaseRate(0);
            setNotes('');
            setServices([]);
            setCommissionType('PERCENTAGE');
            setCommissionValue(5);
        }
    }, [vendor, isOpen]);

    if (!isOpen) return null;

    const handleAddServiceItem = () => {
        setServices([
            ...services,
            {
                serviceId: `srv_${Date.now()}`,
                serviceCategory: category,
                serviceName: 'Standard Service Rate',
                description: '',
                unit: 'DAY',
                baseRate: 1000,
                currency: 'INR',
                isActive: true
            }
        ]);
    };

    const handleServiceChange = (idx, field, val) => {
        const updated = [...services];
        updated[idx][field] = val;
        setServices(updated);
    };

    const handleRemoveService = (idx) => {
        setServices(services.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!businessName || !phone) {
            alert('Business Name and Phone Number are required.');
            return;
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
            baseRate: Number(baseRate) || 0,
            notes,
            services,
            metadata: {
                commissionType,
                commissionValue: Number(commissionValue) || 0
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
            }
        } catch (err) {
            alert('Failed to save vendor: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-stone-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-fadeIn">
                
                <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
                    <div className="flex items-center space-x-2.5">
                        <span className="text-2xl">🏨</span>
                        <h2 className="text-lg font-serif font-extrabold">{vendor ? 'Edit Vendor Details' : 'Add New Vendor'}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">Vendor Category *</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            >
                                {Object.entries(VENDOR_CATEGORIES).map(([key, val]) => (
                                    <option key={key} value={val}>{VENDOR_CATEGORY_LABELS[key] || val}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">Business Name *</label>
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="e.g. Hotel Ganga View / Sharma Travels"
                                className="w-full bg-white border border-stone-300 font-bold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">Contact Person</label>
                            <input
                                type="text"
                                value={contactPerson}
                                onChange={(e) => setContactPerson(e.target.value)}
                                placeholder="e.g. Rajesh Kumar"
                                className="w-full bg-white border border-stone-300 font-semibold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">Phone Number *</label>
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
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest block mb-1">Base Rate (₹)</label>
                            <input
                                type="number"
                                min="0"
                                value={baseRate}
                                onChange={(e) => setBaseRate(e.target.value)}
                                className="w-full bg-white border border-stone-300 font-extrabold text-stone-900 rounded-xl px-3 py-2 text-xs"
                            />
                        </div>
                    </div>

                    {category === 'SHOPPING_PARTNER' && (
                        <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl space-y-2">
                            <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider block">Shopping Partner Commission Settings</span>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Commission Type</label>
                                    <select
                                        value={commissionType}
                                        onChange={(e) => setCommissionType(e.target.value)}
                                        className="w-full bg-white border border-stone-300 font-bold rounded-xl px-2.5 py-1.5 text-xs"
                                    >
                                        <option value={COMMISSION_TYPES.PERCENTAGE}>Percentage (%)</option>
                                        <option value={COMMISSION_TYPES.FIXED}>Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-extrabold text-stone-500 uppercase block mb-1">Commission Value</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={commissionValue}
                                        onChange={(e) => setCommissionValue(e.target.value)}
                                        className="w-full bg-white border border-stone-300 font-extrabold text-amber-900 rounded-xl px-2.5 py-1.5 text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SERVICES & RATES LINE ITEMS */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest">Specific Services & Rates ({services.length})</label>
                            <button
                                type="button"
                                onClick={handleAddServiceItem}
                                className="text-[11px] bg-stone-800 hover:bg-stone-900 text-white font-bold px-2.5 py-1 rounded-lg uppercase"
                            >
                                + Add Service Rate
                            </button>
                        </div>

                        <div className="space-y-2">
                            {services.map((srv, idx) => (
                                <div key={idx} className="bg-stone-50 border border-stone-200 p-3 rounded-2xl flex flex-wrap sm:flex-nowrap gap-2 items-center">
                                    <input
                                        type="text"
                                        value={srv.serviceName}
                                        onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
                                        placeholder="Service Name (e.g. Deluxe Room)"
                                        className="flex-1 bg-white border border-stone-200 px-2.5 py-1 rounded-lg font-bold text-xs"
                                    />
                                    <select
                                        value={srv.unit}
                                        onChange={(e) => handleServiceChange(idx, 'unit', e.target.value)}
                                        className="w-24 bg-white border border-stone-200 px-2 py-1 rounded-lg font-semibold text-xs"
                                    >
                                        {Object.values(UNIT_TYPES).map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        min="0"
                                        value={srv.baseRate}
                                        onChange={(e) => handleServiceChange(idx, 'baseRate', Number(e.target.value))}
                                        className="w-24 bg-white border border-stone-200 px-2 py-1 rounded-lg font-extrabold text-right text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveService(idx)}
                                        className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end space-x-2 rounded-2xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl uppercase">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl uppercase shadow">{isSaving ? 'Saving...' : 'Save Vendor'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

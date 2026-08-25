import React, { useState, useEffect } from 'react';
import { PACKAGE_TEMPLATES, DEFAULT_SERVICES } from '../../../constants/phase4Constants';
import { calculateQuoteFinancials, formatWhatsAppQuoteText } from '../../../utils/quoteCalculator';
import { crmApi } from '../../../services/crmApi';
import VendorSelector from './VendorSelector';

export default function QuoteBuilderModal({
    isOpen,
    onClose,
    lead,
    token,
    user: _user,
    onQuoteGenerated,
    onOpenBooking
}) {
    const [selectedPackage, setSelectedPackage] = useState('COMPLETE');
    const [servicesList, setServicesList] = useState([]);
    const [marginType, setMarginType] = useState('FIXED');
    const [marginValue, setMarginValue] = useState(2500);
    const [discount, setDiscount] = useState(0);
    const [travelDate, setTravelDate] = useState('');
    const [travelers, setTravelers] = useState('1');
    const [tripDuration, setTripDuration] = useState('3 Days / 2 Nights');
    const [inclusions] = useState([
        'AC Transport & Professional Driver',
        'Hotel Accommodation with Breakfast',
        'Kashi Vishwanath Fast-Track VIP Darshan'
    ]);
    const [exclusions] = useState([
        'Personal Shopping & Gratuities',
        'Flight / Railway Tickets'
    ]);
    const [termsNotes] = useState('50% Token advance required to lock dates & hotel booking.');
    const [viewTab, setViewTab] = useState('internal'); // 'internal' | 'customer'
    const [isSaving, setIsSaving] = useState(false);
    const [quoteHistory, setQuoteHistory] = useState([]);
    const [newServiceCategory, setNewServiceCategory] = useState('CUSTOM_SERVICE');


    // Populate initial state when modal opens or lead changes
    useEffect(() => {
        if (lead) {
            setTravelDate(lead.date || '');
            setTravelers(lead.travelers || '1');
            setTripDuration(lead.tripDuration || '3 Days / 2 Nights');

            // Load default package template
            applyPackageTemplate('COMPLETE');

            // Fetch existing quote history for versioning
            if (token && lead._id) {
                crmApi.fetchQuotes(token, lead._id).then(res => {
                    if (res && res.quotes) {
                        setQuoteHistory(res.quotes);
                    }
                }).catch(err => console.error("Error loading quote history:", err));
            }
        }
    }, [lead, token]);

    if (!isOpen || !lead) return null;

    const applyPackageTemplate = (pkgKey) => {
        setSelectedPackage(pkgKey);
        const template = PACKAGE_TEMPLATES[pkgKey] || PACKAGE_TEMPLATES.COMPLETE;
        setServicesList(template.defaultServices.map(s => ({ ...s })));
        setMarginType('FIXED');
        setMarginValue(template.defaultMargin || 2500);
        setDiscount(0);
    };

    const handleServiceChange = (index, field, value) => {
        setServicesList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddService = () => {
        const catInfo = DEFAULT_SERVICES.find(s => s.id === newServiceCategory) || {
            label: 'Custom Service',
            defaultUnit: 'Item'
        };
        const newService = {
            category: newServiceCategory,
            serviceName: catInfo.label,
            vendorName: 'Local Vendor',
            quantity: 1,
            unit: catInfo.defaultUnit || 'Item',
            vendorCost: 1000,
            customerDisplayName: catInfo.label,
            notes: ''
        };
        setServicesList(prev => [...prev, newService]);
    };

    const handleRemoveService = (index) => {
        setServicesList(prev => prev.filter((_, i) => i !== index));
    };

    const financials = calculateQuoteFinancials(servicesList, marginType, marginValue, discount);
    const nextVersion = quoteHistory.length + 1;

    const handleSaveQuote = async (status = 'SENT') => {
        try {
            setIsSaving(true);
            const payload = {
                leadId: lead._id,
                packageType: selectedPackage,
                travelDate,
                travelers,
                tripDuration,
                servicesList,
                marginType,
                marginValue,
                discount,
                inclusions,
                exclusions,
                termsNotes,
                status
            };

            const res = await crmApi.createQuote(token, payload);
            if (res && res.success) {
                alert(`🎉 Quote Version ${res.quote?.version || nextVersion} Generated Successfully!\nQuote #: ${res.quote?.quoteNumber || 'VY-Q-2026'}`);
                if (onQuoteGenerated) onQuoteGenerated(res.quote);
                onClose();
            } else {
                alert(`❌ Failed to save quote: ${res?.message || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`❌ Error creating quote: ${err.message || 'Server error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleWhatsAppShare = () => {
        const currentQuoteObj = {
            travelDate,
            travelers,
            tripDuration,
            servicesList,
            finalCustomerPrice: financials.finalCustomerPrice
        };
        const text = formatWhatsAppQuoteText(currentQuoteObj, lead);
        navigator.clipboard.writeText(text);
        const encoded = encodeURIComponent(text);
        const cleanMobile = (lead.mobile || '').replace(/\D/g, '');
        window.open(`https://wa.me/91${cleanMobile}?text=${encoded}`, '_blank');
    };

    const handleCopyText = () => {
        const currentQuoteObj = {
            travelDate,
            travelers,
            tripDuration,
            servicesList,
            finalCustomerPrice: financials.finalCustomerPrice
        };
        const text = formatWhatsAppQuoteText(currentQuoteObj, lead);
        navigator.clipboard.writeText(text);
        alert('📋 Customer Quote Text copied to clipboard!');
    };

    const handlePrintPDF = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=900');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Quote Proposal - ${lead.name} - Varanasi Yatra</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
                        .header { border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-space-between; align-items: center; }
                        h1 { color: #ea580c; margin: 0; font-size: 24px; }
                        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
                        .service-item { border-bottom: 1px solid #f1f5f9; padding: 10px 0; font-size: 14px; }
                        .price-box { background: #fff7ed; border: 2px dashed #f97316; padding: 20px; border-radius: 12px; text-align: center; margin-top: 30px; }
                        .price { font-size: 28px; font-weight: bold; color: #c2410c; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>VARANASI YATRA</h1>
                            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Premium Travel & Pilgrimage Services · Varanasi</p>
                        </div>
                        <div style="text-align:right;">
                            <h3 style="margin:0;">TRAVEL PROPOSAL</h3>
                            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Ref: ${lead.quoteNumber || 'VY-Q-2026'}</p>
                        </div>
                    </div>
                    <div class="meta-box">
                        <div><strong>Customer:</strong> ${lead.name} (${lead.mobile})</div>
                        <div><strong>Travel Date:</strong> ${travelDate}</div>
                        <div><strong>Travelers:</strong> ${travelers} Pax</div>
                        <div><strong>Trip Duration:</strong> ${tripDuration}</div>
                    </div>
                    <h3>PACKAGE INCLUSIONS</h3>
                    ${servicesList.map(s => `<div class="service-item">✓ <strong>${s.customerDisplayName || s.serviceName}</strong> (${s.quantity} ${s.unit})</div>`).join('')}
                    
                    <div class="price-box">
                        <div style="font-size:12px; font-weight:bold; color:#9a3412; text-transform:uppercase;">TOTAL ALL-INCLUSIVE PACKAGE PRICE</div>
                        <div class="price">₹${financials.finalCustomerPrice.toLocaleString('en-IN')}</div>
                    </div>

                    <div style="margin-top:30px; font-size:12px; color:#64748b;">
                        <p><strong>Terms:</strong> ${termsNotes}</p>
                        <p>For bookings & support: 📞 +91 9876543210 · www.banarasyatra.com</p>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
                
                {/* MODAL HEADER */}
                <div className="bg-gradient-to-r from-stone-900 to-amber-950 text-white p-5 flex justify-between items-center border-b border-stone-800">
                    <div>
                        <div className="flex items-center space-x-2.5">
                            <span className="text-xl">🧮</span>
                            <h2 className="text-lg font-serif font-bold">Interactive Quote & Package Builder</h2>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-stone-950 uppercase tracking-wider">
                                {quoteHistory.length > 0 ? `Revision V${nextVersion}` : 'New Quote V1'}
                            </span>
                        </div>
                        <p className="text-xs text-amber-200/80 font-medium mt-0.5">
                            Customer: <strong>{lead.name}</strong> ({lead.mobile}) · Travel Date: {travelDate || 'Flexible'} ({travelers} Pax)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white text-2xl font-bold p-1 cursor-pointer transition"
                    >
                        &times;
                    </button>
                </div>

                {/* INTERNAL VS CUSTOMER VIEW TAB SWITCHER */}
                <div className="bg-stone-100 border-b border-stone-200 px-6 pt-2 flex justify-between items-center">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setViewTab('internal')}
                            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                                viewTab === 'internal' ? 'border-amber-600 text-amber-800 font-extrabold' : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            🛠️ Internal Cost & Margin Controls
                        </button>
                        <button
                            onClick={() => setViewTab('customer')}
                            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                                viewTab === 'customer' ? 'border-amber-600 text-amber-800 font-extrabold' : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            👁️ Customer View Preview
                        </button>
                    </div>
                    <div className="text-[11px] text-stone-500 font-semibold hidden sm:block">
                        {quoteHistory.length > 0 ? `📜 ${quoteHistory.length} Prior Version(s)` : '🆕 Initial Proposal'}
                    </div>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* ASSOCIATED BOOKING BANNER */}
                    {associatedBooking && (
                        <div className="bg-emerald-50 border-2 border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">🎉</span>
                                <div>
                                    <span className="font-extrabold text-emerald-900 uppercase">Booking Created Successfully</span>
                                    <p className="font-bold text-emerald-800">Booking Ref: #{associatedBooking.bookingNumber} · Status: {associatedBooking.bookingStatus}</p>
                                </div>
                            </div>
                            {onOpenBooking && (
                                <button
                                    type="button"
                                    onClick={() => { onClose(); onOpenBooking(associatedBooking); }}
                                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                                >
                                    [ OPEN BOOKING ]
                                </button>
                            )}
                        </div>
                    )}

                    {/* TAB 1: INTERNAL COST & MARGIN CONTROLS */}
                    {viewTab === 'internal' && (
                        <div className="space-y-6">


                            {/* PACKAGE TEMPLATE SELECTOR */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                                    Step 1: Select Package Template
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {Object.entries(PACKAGE_TEMPLATES).map(([key, tpl]) => {
                                        const isSelected = selectedPackage === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applyPackageTemplate(key)}
                                                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-2 ${
                                                    isSelected
                                                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 text-amber-950 font-bold shadow-sm'
                                                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xl">{tpl.icon}</span>
                                                    {isSelected && <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-extrabold uppercase">Active</span>}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold">{tpl.name}</p>
                                                    <p className="text-[10px] text-stone-400 font-normal leading-snug line-clamp-2">{tpl.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* INCLUDED SERVICES EDITABLE TABLE */}
                            <div className="bg-white border border-stone-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
                                <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                    <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest">
                                        Step 2: Custom Service Line Items & Vendor Costs
                                    </h4>
                                    <span className="text-[11px] font-bold text-stone-500">
                                        {servicesList.length} Item(s) Selected
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {servicesList.map((item, idx) => (
                                        <div key={idx} className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-2 text-xs">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-[9px] font-bold text-stone-400 uppercase">Customer Display Name</label>
                                                        <input
                                                            type="text"
                                                            value={item.customerDisplayName || item.serviceName}
                                                            onChange={(e) => handleServiceChange(idx, 'customerDisplayName', e.target.value)}
                                                            className="w-full border border-stone-200 rounded-lg p-2 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-stone-400 uppercase">Qty / Unit</label>
                                                        <div className="flex space-x-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity || 1}
                                                                onChange={(e) => handleServiceChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-14 border border-stone-200 rounded-lg p-2 bg-white text-stone-900 font-bold focus:outline-none text-center"
                                                            />
                                                            <select
                                                                value={item.unit || 'Item'}
                                                                onChange={(e) => handleServiceChange(idx, 'unit', e.target.value)}
                                                                className="flex-1 border border-stone-200 rounded-lg p-2 bg-white text-stone-800 font-medium focus:outline-none text-[11px]"
                                                            >
                                                                <option value="Nights">Nights</option>
                                                                <option value="Days">Days</option>
                                                                <option value="Passes">Passes</option>
                                                                <option value="Session">Session</option>
                                                                <option value="Trip">Trip</option>
                                                                <option value="Item">Item</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-bold text-stone-400 uppercase">Unit Cost (₹)</label>
                                                        <input
                                                            type="number"
                                                            value={item.vendorCost || 0}
                                                            onChange={(e) => handleServiceChange(idx, 'vendorCost', Number(e.target.value) || 0)}
                                                            className="w-full border border-stone-200 rounded-lg p-2 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500 text-right"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveService(idx)}
                                                    className="text-rose-500 hover:text-rose-700 p-2 font-bold cursor-pointer transition self-end sm:self-center"
                                                    title="Remove Item"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {/* MASTER VENDOR SELECTOR */}
                                            <VendorSelector
                                                category={item.category}
                                                token={token}
                                                selectedVendorId={item.vendorId}
                                                selectedVendorCost={item.vendorCost}
                                                onSelectVendor={(v, cost) => {
                                                    const updated = [...servicesList];
                                                    updated[idx].vendorId = v?._id || '';
                                                    updated[idx].vendorName = v?.businessName || v?.name || 'Custom';
                                                    updated[idx].vendorCost = cost;
                                                    setServicesList(updated);
                                                }}
                                                onOverrideCost={(cost, reason) => {
                                                    const updated = [...servicesList];
                                                    updated[idx].vendorCost = cost;
                                                    updated[idx].isOverridden = true;
                                                    updated[idx].overrideReason = reason;
                                                    setServicesList(updated);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>


                                {/* ADD SERVICE BAR */}
                                <div className="pt-2 flex items-center space-x-2 border-t border-stone-100">
                                    <select
                                        value={newServiceCategory}
                                        onChange={(e) => setNewServiceCategory(e.target.value)}
                                        className="flex-1 border border-stone-300 rounded-xl p-2.5 bg-white text-stone-900 font-semibold text-xs focus:outline-none cursor-pointer"
                                    >
                                        {DEFAULT_SERVICES.map(s => (
                                            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddService}
                                        className="px-4 py-2.5 bg-stone-900 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                                    >
                                        + Add Service
                                    </button>
                                </div>
                            </div>

                            {/* COST ENGINE & FINANCIAL CALCULATOR PANEL */}
                            <div className="bg-gradient-to-br from-stone-900 to-amber-950 text-white p-5 rounded-3xl space-y-4 shadow-lg">
                                <h4 className="text-xs font-serif font-bold uppercase tracking-widest text-amber-400 border-b border-stone-800 pb-2">
                                    Step 3: Financial Profit & Price Engine
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                    {/* Total Vendor Cost */}
                                    <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                                        <span className="text-[10px] text-stone-400 font-extrabold uppercase">Total Vendor Cost</span>
                                        <p className="text-xl font-extrabold text-white">₹{financials.totalVendorCost.toLocaleString('en-IN')}</p>
                                    </div>

                                    {/* Company Margin Control */}
                                    <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-stone-400 font-extrabold uppercase">Company Margin</span>
                                            <div className="flex space-x-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setMarginType('FIXED')}
                                                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${marginType === 'FIXED' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}
                                                >
                                                    ₹ Fixed
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMarginType('PERCENTAGE')}
                                                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${marginType === 'PERCENTAGE' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'}`}
                                                >
                                                    % Percent
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                value={marginValue}
                                                onChange={(e) => setMarginValue(Number(e.target.value) || 0)}
                                                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-amber-400 font-bold focus:outline-none"
                                            />
                                            <span className="text-xs text-stone-400 font-semibold">
                                                (= ₹{financials.companyMargin.toLocaleString('en-IN')})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Customer Discount Input */}
                                    <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                                        <span className="text-[10px] text-rose-300 font-extrabold uppercase">Customer Bargain Discount (₹)</span>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                            className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-rose-400 font-bold focus:outline-none"
                                            placeholder="Enter discount amount"
                                        />
                                    </div>
                                </div>

                                {/* FINAL PRICE & EXPECTED PROFIT HIGHLIGHT CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="bg-amber-500/20 border border-amber-500/50 p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] text-amber-300 uppercase font-extrabold tracking-widest block">Final Package Price</span>
                                            <p className="text-2xl font-extrabold text-amber-400">₹{financials.finalCustomerPrice.toLocaleString('en-IN')}</p>
                                        </div>
                                        <span className="text-xs text-amber-200/70 font-semibold">Customer Payable</span>
                                    </div>

                                    <div className={`border p-4 rounded-2xl flex items-center justify-between ${
                                        financials.isLowProfitWarning ? 'bg-rose-500/20 border-rose-500/50' : 'bg-emerald-500/20 border-emerald-500/50'
                                    }`}>
                                        <div>
                                            <span className="text-[10px] uppercase font-extrabold tracking-widest block text-stone-300">Expected Net Profit</span>
                                            <p className={`text-2xl font-extrabold ${financials.isLowProfitWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                ₹{financials.expectedProfit.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold uppercase">{financials.isLowProfitWarning ? '⚠️ Low Profit' : 'Safe Margin ✓'}</span>
                                    </div>
                                </div>

                                {/* LOW PROFIT WARNING CARD */}
                                {financials.isLowProfitWarning && (
                                    <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-2xl flex items-center justify-between text-xs text-rose-200">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-base">⚠️</span>
                                            <span><strong>Low Profit Warning:</strong> Profit ₹{financials.expectedProfit} is below safe recommended margin ₹{financials.minRecommendedMargin}.</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDiscount(0)}
                                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                                        >
                                            Reset Discount
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* TAB 2: CUSTOMER VIEW PREVIEW */}
                    {viewTab === 'customer' && (
                        <div className="space-y-5">
                            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 border-2 border-amber-500/40 p-6 rounded-3xl space-y-5">
                                <div className="flex justify-between items-start border-b border-amber-200/60 pb-4">
                                    <div>
                                        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Official Travel Proposal</span>
                                        <h3 className="text-xl font-serif font-extrabold text-stone-900 mt-1">VARANASI YATRA</h3>
                                        <p className="text-xs text-stone-500 font-medium">www.banarasyatra.com · Kashi Pilgrimage & Tours</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                            Quote Ref: #{lead.quoteNumber || 'VY-Q-2026'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-stone-200/70 text-xs">
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase">Guest Name</span>
                                        <p className="font-extrabold text-stone-900">{lead.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase">Travel Date</span>
                                        <p className="font-extrabold text-stone-900">{travelDate || 'Flexible'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase">Travelers</span>
                                        <p className="font-extrabold text-stone-900">{travelers} Person(s)</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase">Duration</span>
                                        <p className="font-extrabold text-stone-900">{tripDuration}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">Included Package Facilities</h4>
                                    <div className="space-y-2">
                                        {servicesList.map((s, idx) => (
                                            <div key={idx} className="bg-white border border-stone-200/80 p-3 rounded-xl flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2.5">
                                                    <span className="text-emerald-600 font-extrabold">✓</span>
                                                    <span className="font-bold text-stone-900">{s.customerDisplayName || s.serviceName}</span>
                                                </div>
                                                <span className="text-stone-500 font-semibold bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                                                    {s.quantity} {s.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-amber-500 text-stone-950 p-5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-950 block">All-Inclusive Package Rate</span>
                                        <p className="text-3xl font-extrabold">₹{financials.finalCustomerPrice.toLocaleString('en-IN')}</p>
                                    </div>
                                    <span className="text-xs font-extrabold border border-amber-950 px-3 py-1.5 rounded-xl uppercase">Taxes & Transfers Included</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* MODAL FOOTER & ACTION BUTTONS */}
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap gap-2.5 justify-between items-center">
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleWhatsAppShare}
                            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5"
                        >
                            <span>📲</span>
                            <span>Send WhatsApp</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrintPDF}
                            className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5"
                        >
                            <span>📄</span>
                            <span>Print / PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyText}
                            className="px-3.5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                        >
                            📋 Copy Text
                        </button>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveQuote('SENT')}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-serif font-bold text-xs rounded-xl uppercase tracking-widest transition shadow-md disabled:bg-stone-300 cursor-pointer"
                        >
                            {isSaving ? 'Saving Quote...' : `🚀 Generate & Lock Quote (${quoteHistory.length > 0 ? `V${nextVersion}` : 'V1'})`}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

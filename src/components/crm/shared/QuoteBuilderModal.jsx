import React, { useState, useEffect, useCallback } from 'react';
import { PACKAGE_TEMPLATES, DEFAULT_SERVICES, COMMERCIAL_MODELS, COMMERCIAL_MODEL_LABELS } from '../../../constants/phase4Constants';
import { calculateQuoteFinancials, formatWhatsAppQuoteText } from '../../../utils/quoteCalculator';
import { crmApi } from '../../../services/crmApi';
import VendorSelector from './VendorSelector';

const MODEL_BADGE_INFO = {
    [COMMERCIAL_MODELS.SELLING_PRICE]: { label: 'SET SELLING PRICE', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
    [COMMERCIAL_MODELS.FIXED_VENDOR_RATE]: { label: 'FIXED RATE', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300' },
    [COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED]: { label: 'VENDOR QUOTE', badgeClass: 'bg-purple-100 text-purple-900 border-purple-300' },
    [COMMERCIAL_MODELS.CUSTOMER_DIRECT]: { label: 'CUSTOMER DIRECT', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    [COMMERCIAL_MODELS.COMMISSION]: { label: 'COMMISSION', badgeClass: 'bg-teal-100 text-teal-900 border-teal-300' },
    [COMMERCIAL_MODELS.PASS_THROUGH]: { label: 'PASS-THROUGH', badgeClass: 'bg-sky-100 text-sky-900 border-sky-300' }
};

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
    const [associatedBooking, setAssociatedBooking] = useState(lead?.associatedBooking || null);


    const loadQuoteIntoBuilder = useCallback((q) => {
        if (!q) return;
        if (q.packageType) setSelectedPackage(q.packageType);
        if (q.travelDate) setTravelDate(q.travelDate);
        if (q.travelers) setTravelers(q.travelers);
        if (q.tripDuration) setTripDuration(q.tripDuration);
        if (q.services && q.services.length > 0) {
            setServicesList(q.services.map(s => ({ ...s })));
        }
        if (q.marginType) setMarginType(q.marginType);
        if (q.marginValue !== undefined) setMarginValue(q.marginValue);
        if (q.discount !== undefined) setDiscount(q.discount);
    }, []);

    const applyPackageTemplate = useCallback((pkgKey) => {
        setSelectedPackage(pkgKey);
        const template = PACKAGE_TEMPLATES[pkgKey] || PACKAGE_TEMPLATES.COMPLETE;
        setServicesList(template.defaultServices.map(s => ({ ...s })));
        setMarginType('FIXED');
        setMarginValue(template.defaultMargin || 2500);
        setDiscount(0);
    }, []);

    const buildServicesFromLeadRequirements = useCallback((targetLead) => {
        const reqs = targetLead?.requirements || {};
        const items = [];
        const pax = Number(targetLead?.travelers) || 1;

        if (reqs.hotel) {
            items.push({
                category: 'HOTEL',
                commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
                serviceName: 'Hotel Accommodation',
                customerDisplayName: 'Heritage Hotel Accommodation (AC Deluxe)',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 2,
                unit: 'Nights',
                referenceCost: 2200,
                customerSellingPrice: 2500,
                customerCharge: 5000,
                vendorCost: 2200
            });
        }

        if (reqs.transport || reqs.car) {
            const hasOutside = Boolean(targetLead?.outsideDestinations);
            items.push({
                category: 'TRANSPORT',
                commercialModel: hasOutside ? COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED : COMMERCIAL_MODELS.FIXED_VENDOR_RATE,
                serviceName: hasOutside ? 'Custom Multi-City Transport' : 'AC Sedan Local Transport',
                customerDisplayName: hasOutside ? `Dedicated Transport (${targetLead.outsideDestinations})` : 'AC Sedan Local Sightseeing & Transfers',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 3,
                unit: 'Days',
                referenceCost: hasOutside ? 0 : 3500,
                negotiatedVendorCost: hasOutside ? 0 : 3500,
                customerSellingPrice: hasOutside ? 0 : 3500,
                customerCharge: hasOutside ? 0 : 10500,
                vendorCost: hasOutside ? 0 : 3500
            });
        }

        if (reqs.boat) {
            items.push({
                category: 'BOAT',
                commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
                serviceName: 'Ganga Boat Ride',
                customerDisplayName: 'Ganga Sunrise / Evening Aarti Boat Ride',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 1,
                unit: 'Ride',
                referenceCost: 2000,
                customerSellingPrice: 2500,
                customerCharge: 2500,
                vendorCost: 2000
            });
        }

        if (reqs.guide) {
            items.push({
                category: 'GUIDE',
                commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
                serviceName: 'Local Tour Guide',
                customerDisplayName: 'Approved Heritage Tour Guide',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 1,
                unit: 'Days',
                referenceCost: 1500,
                customerSellingPrice: 1800,
                customerCharge: 1800,
                vendorCost: 1500
            });
        }

        if (reqs.darshan) {
            items.push({
                category: 'DARSHAN',
                commercialModel: COMMERCIAL_MODELS.PASS_THROUGH,
                serviceName: 'VIP Darshan Pass',
                customerDisplayName: 'Kashi Vishwanath Sugam Darshan VIP Pass',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: pax,
                unit: 'Passes',
                referenceCost: 500,
                passThroughAmount: 500,
                customerSellingPrice: 500,
                customerCharge: 500 * pax,
                vendorCost: 500
            });
        }

        if (reqs.pandit) {
            items.push({
                category: 'PANDIT',
                commercialModel: COMMERCIAL_MODELS.CUSTOMER_DIRECT,
                serviceName: 'Pandit Ji / Ritual Puja',
                customerDisplayName: 'Special Ritual Puja Coordination (Pandit Ji)',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 1,
                unit: 'Session',
                referenceCost: 0,
                customerSellingPrice: 0,
                customerCharge: 0,
                vendorCost: 0
            });
        }

        if (reqs.shopping) {
            items.push({
                category: 'SHOPPING',
                commercialModel: COMMERCIAL_MODELS.COMMISSION,
                serviceName: 'Shopping Partner Visit',
                customerDisplayName: 'Authentic Banarasi Handloom & Silk Visit',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 1,
                unit: 'Session',
                referenceCost: 0,
                customerSellingPrice: 0,
                customerCharge: 0,
                vendorCost: 0,
                commissionRate: 15,
                commissionAmount: 500
            });
        }

        if (reqs.other) {
            items.push({
                category: 'OTHER',
                commercialModel: COMMERCIAL_MODELS.SELLING_PRICE,
                serviceName: 'Custom Pilgrim Assistance',
                customerDisplayName: 'Custom Pilgrim Assistance & Facilitation',
                vendorName: '',
                vendorId: '',
                resourceId: '',
                quantity: 1,
                unit: 'Item',
                referenceCost: 1000,
                customerSellingPrice: 1200,
                customerCharge: 1200,
                vendorCost: 1000
            });
        }

        return items;
    }, []);

    // Populate initial state when modal opens or lead changes
    useEffect(() => {
        if (lead) {
            setTravelDate(lead.date || '');
            setTravelers(lead.travelers || '1');
            setTripDuration(lead.tripDuration || '3 Days / 2 Nights');
            setAssociatedBooking(lead.associatedBooking || null);

            // Fetch existing quote history for versioning; preload latest or fallback to requirements / template
            if (token && lead._id) {
                crmApi.fetchQuotes(token, lead._id).then(res => {
                    if (res && res.quotes && res.quotes.length > 0) {
                        setQuoteHistory(res.quotes);
                        const latest = res.quotes[0];
                        if (latest) {
                            loadQuoteIntoBuilder(latest);
                        }
                    } else {
                        const customItems = buildServicesFromLeadRequirements(lead);
                        if (customItems.length > 0) {
                            setSelectedPackage('CUSTOM');
                            setServicesList(customItems);
                            setDiscount(0);
                        } else {
                            applyPackageTemplate('COMPLETE');
                        }
                    }
                }).catch(err => {
                    console.error("Error loading quote history:", err);
                    applyPackageTemplate('COMPLETE');
                });
            } else {
                applyPackageTemplate('COMPLETE');
            }
        }
    }, [lead, token, loadQuoteIntoBuilder, applyPackageTemplate, buildServicesFromLeadRequirements]);

    if (!isOpen || !lead) return null;

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
            defaultUnit: 'Item',
            defaultCommercialModel: COMMERCIAL_MODELS.SELLING_PRICE
        };
        const model = catInfo.defaultCommercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
        const isFreeInPackage = model === COMMERCIAL_MODELS.CUSTOMER_DIRECT || model === COMMERCIAL_MODELS.COMMISSION;
        const newService = {
            category: newServiceCategory,
            commercialModel: model,
            serviceName: catInfo.label,
            vendorName: 'Local Vendor',
            quantity: 1,
            unit: catInfo.defaultUnit || 'Item',
            referenceCost: isFreeInPackage ? 0 : 1000,
            negotiatedVendorCost: isFreeInPackage ? 0 : 1000,
            customerSellingPrice: isFreeInPackage ? 0 : 1200,
            customerCharge: isFreeInPackage ? 0 : 1200,
            passThroughAmount: model === COMMERCIAL_MODELS.PASS_THROUGH ? 500 : 0,
            commissionRate: model === COMMERCIAL_MODELS.COMMISSION ? 20 : 0,
            commissionAmount: model === COMMERCIAL_MODELS.COMMISSION ? 500 : 0,
            vendorCost: isFreeInPackage ? 0 : 1000,
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

    const directServicesList = servicesList.filter(s => (s.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE) === COMMERCIAL_MODELS.CUSTOMER_DIRECT);
    const directServicesNames = directServicesList.map(s => s.vendorName || s.customerDisplayName || s.serviceName || s.category).join(', ') || 'None';

    const commissionServicesList = servicesList.filter(s => (s.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE) === COMMERCIAL_MODELS.COMMISSION);
    const commissionServicesNames = commissionServicesList.map(s => s.vendorName || s.customerDisplayName || s.serviceName || s.category).join(', ') || 'None';

    const passThroughServicesList = servicesList.filter(s => (s.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE) === COMMERCIAL_MODELS.PASS_THROUGH);
    const passThroughServicesNames = passThroughServicesList.map(s => s.customerDisplayName || s.serviceName || s.category).join(', ') || 'None';

    const handleSaveQuote = async (status = 'SENT') => {
        try {
            setIsSaving(true);
            const sanitizedServices = servicesList.map(s => {
                const model = s.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
                const qty = Number(s.quantity) || 1;
                let customerCharge = 0;
                if (model === COMMERCIAL_MODELS.SELLING_PRICE) {
                    customerCharge = (Number(s.customerSellingPrice !== undefined ? s.customerSellingPrice : (s.referenceCost || s.vendorCost || 0))) * qty;
                } else if (model === COMMERCIAL_MODELS.FIXED_VENDOR_RATE) {
                    customerCharge = (Number(s.customerSellingPrice !== undefined ? s.customerSellingPrice : (s.referenceCost || s.vendorCost || 0))) * qty;
                } else if (model === COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED) {
                    customerCharge = (Number(s.customerSellingPrice || 0)) * qty;
                } else if (model === COMMERCIAL_MODELS.PASS_THROUGH) {
                    customerCharge = (Number(s.passThroughAmount !== undefined ? s.passThroughAmount : (s.referenceCost || s.vendorCost || 0))) * qty;
                }
                return {
                    category: s.category,
                    resourceId: s.resourceId || s.vendorId || '',
                    vendorId: s.vendorId || '',
                    vendorName: s.vendorName || '',
                    serviceName: s.serviceName || s.category,
                    customerDisplayName: s.customerDisplayName || s.serviceName || s.category,
                    commercialModel: model,
                    referenceCost: Number(s.referenceCost !== undefined ? s.referenceCost : (s.vendorCost || 0)),
                    negotiatedVendorCost: Number(s.negotiatedVendorCost || 0),
                    customerSellingPrice: Number(s.customerSellingPrice !== undefined ? s.customerSellingPrice : (s.referenceCost || s.vendorCost || 0)),
                    customerCharge: customerCharge,
                    commissionRate: Number(s.commissionRate || 0),
                    commissionAmount: Number(s.commissionAmount || 0),
                    passThroughAmount: Number(s.passThroughAmount || 0),
                    quantity: qty,
                    unit: s.unit || 'Item',
                    rateRuleId: s.rateRuleId || '',
                    vendorCost: Number(s.negotiatedVendorCost || s.referenceCost || s.vendorCost || 0),
                    notes: s.notes || ''
                };
            });

            const payload = {
                leadId: lead._id,
                packageType: selectedPackage,
                travelDate,
                travelers,
                tripDuration,
                servicesList: sanitizedServices,
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
                if (status === 'ACCEPTED') {
                    // Immediately convert ACCEPTED quote to Booking
                    try {
                        const bookingRes = await crmApi.createBooking(token, res.quote._id);
                        if (bookingRes && bookingRes.success && bookingRes.booking) {
                            setAssociatedBooking(bookingRes.booking);
                            alert(`🎉 Quote Version ${res.quote?.version || nextVersion} Accepted & Booking Created!\nBooking #: ${bookingRes.booking.bookingNumber}`);
                            if (onQuoteGenerated) onQuoteGenerated(res.quote);
                            if (onOpenBooking) {
                                onClose();
                                onOpenBooking(bookingRes.booking);
                                return;
                            }
                        }
                    } catch (bErr) {
                        console.warn("Auto-booking notice:", bErr);
                    }
                }

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

    const handleAcceptQuoteFromHistory = async (q) => {
        try {
            setIsSaving(true);
            if (q.status !== 'ACCEPTED') {
                await crmApi.updateQuote(token, q._id, { status: 'ACCEPTED' });
            }
            const bookingRes = await crmApi.createBooking(token, q._id);
            if (bookingRes && bookingRes.success && bookingRes.booking) {
                setAssociatedBooking(bookingRes.booking);
                alert(`🎉 Quote ${q.quoteNumber} Accepted & Booking Created!\nBooking #: ${bookingRes.booking.bookingNumber}`);
                if (onQuoteGenerated) onQuoteGenerated();
                if (onOpenBooking) {
                    onClose();
                    onOpenBooking(bookingRes.booking);
                }
            } else {
                alert(`❌ Booking creation failed: ${bookingRes?.message || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`❌ Error accepting quote: ${err.message || 'Server error'}`);
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
            finalCustomerPrice: financials.finalCustomerPrice,
            passThroughTotal: financials.passThroughTotal
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
            finalCustomerPrice: financials.finalCustomerPrice,
            passThroughTotal: financials.passThroughTotal
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
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                        .header { border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-space-between; align-items: center; }
                        h1 { color: #ea580c; margin: 0; font-size: 24px; }
                        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
                        .service-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
                        .service-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }
                        .service-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                        .price-box { background: #fff7ed; border: 2px dashed #f97316; padding: 20px; border-radius: 12px; text-align: center; margin-top: 25px; }
                        .price { font-size: 28px; font-weight: bold; color: #c2410c; }
                        .note-box { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px; border-radius: 8px; margin-top: 15px; font-size: 12px; color: #92400e; }
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
                        <div><strong>Travel Date:</strong> ${travelDate || 'Flexible'}</div>
                        <div><strong>Travelers:</strong> ${travelers} Pax</div>
                        <div><strong>Trip Duration:</strong> ${tripDuration}</div>
                    </div>
                    <h3>PACKAGE INCLUSIONS & FACILITATION</h3>
                    <table class="service-table">
                        <thead>
                            <tr>
                                <th>Service / Facility</th>
                                <th>Resource Details</th>
                                <th style="text-align:center;">Qty</th>
                                <th style="text-align:right;">Customer Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${servicesList.map(s => {
                                const model = s.commercialModel || 'SELLING_PRICE';
                                const qty = Number(s.quantity) || 1;
                                let priceText = '';
                                let typeLabel = 'Included in Package';
                                if (model === 'CUSTOMER_DIRECT') {
                                    priceText = 'Direct Dakshina / Pay';
                                    typeLabel = 'Direct Guest Settlement (₹0 in package)';
                                } else if (model === 'COMMISSION') {
                                    priceText = 'Complimentary Facilitation';
                                    typeLabel = 'Partner Visit (₹0 in package)';
                                } else if (model === 'PASS_THROUGH') {
                                    priceText = `₹${((Number(s.passThroughAmount !== undefined ? s.passThroughAmount : (s.referenceCost || s.vendorCost || 0))) * qty).toLocaleString('en-IN')}`;
                                    typeLabel = 'Official Govt/Trust Pass (At-Cost)';
                                } else {
                                    priceText = `₹${((Number(s.customerSellingPrice !== undefined ? s.customerSellingPrice : (s.referenceCost || s.vendorCost || 0))) * qty).toLocaleString('en-IN')}`;
                                }
                                return `
                                    <tr>
                                        <td><strong>${s.customerDisplayName || s.serviceName}</strong><br><small style="color:#64748b;">${typeLabel}</small></td>
                                        <td style="color:#475569;">${s.vendorName || 'Varanasi Yatra Team'}</td>
                                        <td style="text-align:center;">${qty} ${s.unit || 'Item'}</td>
                                        <td style="text-align:right; font-weight:bold; color:#0f172a;">${priceText}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <div class="price-box">
                        <div style="font-size:12px; font-weight:bold; color:#9a3412; text-transform:uppercase;">TOTAL ALL-INCLUSIVE PACKAGE PRICE</div>
                        <div class="price">₹${financials.finalCustomerPrice.toLocaleString('en-IN')}</div>
                        ${financials.passThroughTotal > 0 ? `<div style="font-size:12px; color:#475569; margin-top:6px;">(Includes ₹${financials.passThroughTotal.toLocaleString('en-IN')} official statutory passes)</div>` : ''}
                    </div>

                    ${directServicesList.length > 0 ? `
                        <div class="note-box">
                            <strong>Direct Facilitation:</strong> For services like ${directServicesNames}, guest can offer dakshina directly to the provider during the yatra.
                        </div>
                    ` : ''}

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
                            type="button"
                            onClick={() => setViewTab('internal')}
                            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                                viewTab === 'internal' ? 'border-amber-600 text-amber-900 font-extrabold bg-amber-50/60 rounded-t-lg' : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            <span>🔒</span>
                            <span>Internal Cost & Margin Controls</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewTab('customer')}
                            className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                                viewTab === 'customer' ? 'border-blue-600 text-blue-900 font-extrabold bg-blue-50/60 rounded-t-lg' : 'border-transparent text-stone-500 hover:text-stone-800'
                            }`}
                        >
                            <span>👁️</span>
                            <span>Customer View Preview</span>
                        </button>
                    </div>
                    <div className="text-[11px] text-stone-500 font-semibold hidden sm:block">
                        {quoteHistory.length > 0 ? `📜 ${quoteHistory.length} Prior Version(s)` : '🆕 Initial Proposal'}
                    </div>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* VIEW ORIENTATION BANNER */}
                    {viewTab === 'internal' ? (
                        <div className="bg-amber-50/90 border border-amber-300/80 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-amber-950 shadow-2xs">
                            <div className="flex items-center space-x-2.5">
                                <span className="text-base">🔒</span>
                                <div>
                                    <span className="font-extrabold text-amber-900 uppercase tracking-wide">CONFIDENTIAL OPERATIONAL PRICING:</span>
                                    <span className="font-medium text-stone-600 text-[11px] ml-1.5">Manage base costs, negotiated rates, and customer selling markup. These values are strictly hidden from clients.</span>
                                </div>
                            </div>
                            <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-950 border border-amber-300">Internal Only</span>
                        </div>
                    ) : (
                        <div className="bg-blue-50/90 border border-blue-300/80 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs text-blue-950 shadow-2xs">
                            <div className="flex items-center space-x-2.5">
                                <span className="text-base">📄</span>
                                <div>
                                    <span className="font-extrabold text-blue-900 uppercase tracking-wide">GUEST PROPOSAL PREVIEW:</span>
                                    <span className="font-medium text-stone-600 text-[11px] ml-1.5">Exact proposal format presented to the customer. All internal vendor costs and margins are completely scrubbed.</span>
                                </div>
                            </div>
                            <span className="text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full bg-blue-200/80 text-blue-950 border border-blue-300">Guest Facing</span>
                        </div>
                    )}

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

                    {/* QUOTE HISTORY VERSIONS ACCORDION / LIST */}
                    {quoteHistory.length > 0 && (
                        <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-widest">
                                    Quote History Versions ({quoteHistory.length})
                                </span>
                                <span className="text-[10px] text-amber-700 font-bold">
                                    Current Lead Status: {lead.status || 'Pending'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {quoteHistory.map((q) => (
                                    <div key={q._id} className="bg-white border border-stone-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                                        <div className="flex items-center space-x-2.5">
                                            <span className="font-extrabold text-stone-900 text-xs">V{q.version}</span>
                                            <span className="text-stone-400">·</span>
                                            <span className="text-stone-700 font-bold">₹{q.finalCustomerPrice?.toLocaleString('en-IN')}</span>
                                            <span className="text-stone-400">·</span>
                                            <span className="text-[11px] text-stone-600">{q.packageType}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                q.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {q.status || 'SENT'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => loadQuoteIntoBuilder(q)}
                                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center space-x-1"
                                                title="Load this revision into the editor to modify"
                                            >
                                                <span>📝</span>
                                                <span>Load Revision</span>
                                            </button>
                                            {q.status !== 'ACCEPTED' && !associatedBooking && (
                                                <button
                                                    type="button"
                                                    disabled={isSaving}
                                                    onClick={() => handleAcceptQuoteFromHistory(q)}
                                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-lg uppercase tracking-wider transition cursor-pointer"
                                                >
                                                    {isSaving ? 'Processing...' : 'Accept & Book'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                    {servicesList.map((item, idx) => {
                                        const model = item.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
                                        const qty = Number(item.quantity) || 1;
                                        return (
                                            <div key={idx} className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-3 text-xs shadow-xs">
                                                {/* ITEM HEADER & COMMERCIAL MODEL SELECTOR */}
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 pb-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                                                            {item.category}
                                                        </span>
                                                        <select
                                                            value={model}
                                                            onChange={(e) => {
                                                                const newM = e.target.value;
                                                                const updated = [...servicesList];
                                                                updated[idx].commercialModel = newM;
                                                                if (newM === COMMERCIAL_MODELS.CUSTOMER_DIRECT || newM === COMMERCIAL_MODELS.COMMISSION) {
                                                                    updated[idx].customerSellingPrice = 0;
                                                                    updated[idx].customerCharge = 0;
                                                                    updated[idx].vendorCost = 0;
                                                                }
                                                                setServicesList(updated);
                                                            }}
                                                            className="bg-white border border-stone-300 font-bold rounded-lg px-2 py-1 text-[10px] text-stone-800 cursor-pointer"
                                                        >
                                                            {Object.entries(COMMERCIAL_MODELS).map(([k, val]) => (
                                                                <option key={k} value={val}>
                                                                    {COMMERCIAL_MODEL_LABELS[k] || val}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <span className={`border text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${MODEL_BADGE_INFO[model]?.badgeClass || 'bg-stone-100 text-stone-800'}`}>
                                                            [{MODEL_BADGE_INFO[model]?.label || model}]
                                                        </span>
                                                        {item.vendorName && (
                                                            <span className="text-[11px] text-stone-600 font-medium">
                                                                · Resource: <strong className="text-stone-900">{item.vendorName}</strong>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-[11px] font-extrabold text-stone-700">
                                                            Line Total: <strong className="text-stone-950 font-black">
                                                                {model === COMMERCIAL_MODELS.CUSTOMER_DIRECT 
                                                                    ? '₹0 (Direct)' 
                                                                    : (model === COMMERCIAL_MODELS.COMMISSION 
                                                                        ? `₹0 (+₹${item.commissionAmount || 0} Comm)`
                                                                        : `₹${(
                                                                            model === COMMERCIAL_MODELS.PASS_THROUGH
                                                                                ? (Number(item.passThroughAmount !== undefined ? item.passThroughAmount : (item.referenceCost || item.vendorCost || 0))) * qty
                                                                                : (Number(item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.referenceCost || item.vendorCost || 0))) * qty
                                                                        ).toLocaleString('en-IN')}`)}
                                                            </strong>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveService(idx)}
                                                            className="text-rose-500 hover:text-rose-700 font-bold px-2 py-0.5 rounded cursor-pointer transition text-xs"
                                                            title="Remove Item"
                                                        >
                                                            ✕ Remove
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* DISPLAY NAME & QUANTITY */}
                                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full">
                                                    <div className="sm:col-span-3">
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
                                                </div>

                                                {/* DYNAMIC COMMERCIAL MODEL PRICING ROW */}
                                                {model === COMMERCIAL_MODELS.SELLING_PRICE && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-stone-200/80 items-center">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-stone-400 uppercase block">Base Ref Cost</span>
                                                            <span className="font-extrabold text-stone-700">₹{(Number(item.referenceCost || item.vendorCost) || 0).toLocaleString('en-IN')} / {item.unit || 'Unit'}</span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-amber-700 uppercase">Manager Selling Price (₹) *</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.customerCharge !== undefined ? item.customerCharge : (item.referenceCost || item.vendorCost || 0))}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    const updated = [...servicesList];
                                                                    updated[idx].customerSellingPrice = val;
                                                                    updated[idx].customerCharge = val * qty;
                                                                    setServicesList(updated);
                                                                }}
                                                                className="w-full border border-amber-300 rounded-lg p-1.5 bg-amber-50/50 text-amber-950 font-extrabold text-right focus:outline-none"
                                                                placeholder="e.g. 2500"
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold text-stone-400 uppercase block">Customer Charge</span>
                                                            <span className="font-extrabold text-emerald-700 text-sm">
                                                                ₹{((Number(item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.referenceCost || item.vendorCost || 0))) * qty).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {model === COMMERCIAL_MODELS.FIXED_VENDOR_RATE && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-stone-200/80 items-center">
                                                        <div>
                                                            <span className="text-[9px] font-bold text-stone-400 uppercase block">Fixed Vendor Rate</span>
                                                            <span className="font-extrabold text-stone-700">₹{(Number(item.referenceCost || item.vendorCost) || 0).toLocaleString('en-IN')} / {item.unit || 'Unit'}</span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-stone-600 uppercase">Customer Rate (₹)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.referenceCost || item.vendorCost || 0)}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    const updated = [...servicesList];
                                                                    updated[idx].customerSellingPrice = val;
                                                                    updated[idx].customerCharge = val * qty;
                                                                    setServicesList(updated);
                                                                }}
                                                                className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-stone-900 font-bold text-right focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold text-stone-400 uppercase block">Customer Charge</span>
                                                            <span className="font-extrabold text-emerald-700 text-sm">
                                                                ₹{((Number(item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.referenceCost || item.vendorCost || 0))) * qty).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {model === COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-purple-50/50 p-2.5 rounded-xl border border-purple-200 items-center">
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-purple-800 uppercase">Negotiated Vendor Cost (₹)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.negotiatedVendorCost !== undefined ? item.negotiatedVendorCost : (item.vendorCost || 0)}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    const updated = [...servicesList];
                                                                    updated[idx].negotiatedVendorCost = val;
                                                                    updated[idx].vendorCost = val;
                                                                    setServicesList(updated);
                                                                }}
                                                                className="w-full border border-purple-300 rounded-lg p-1.5 bg-white text-purple-950 font-bold text-right focus:outline-none"
                                                                placeholder="e.g. 18000"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-purple-800 uppercase">Manager Selling Price (₹) *</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.negotiatedVendorCost || item.vendorCost || 0)}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    const updated = [...servicesList];
                                                                    updated[idx].customerSellingPrice = val;
                                                                    updated[idx].customerCharge = val * qty;
                                                                    setServicesList(updated);
                                                                }}
                                                                className="w-full border border-purple-400 rounded-lg p-1.5 bg-white text-purple-950 font-extrabold text-right focus:outline-none"
                                                                placeholder="e.g. 21000"
                                                            />
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold text-purple-500 uppercase block">Customer Charge</span>
                                                            <span className="font-extrabold text-purple-900 text-sm">
                                                                ₹{((Number(item.customerSellingPrice || 0)) * qty).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {model === COMMERCIAL_MODELS.CUSTOMER_DIRECT && (
                                                    <div className="bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-base">🤝</span>
                                                            <span className="text-amber-900 font-semibold">
                                                                <strong>Customer Direct Pay:</strong> Guest coordinates and pays provider directly. <strong>₹0 added to package.</strong>
                                                            </span>
                                                        </div>
                                                        <span className="font-extrabold text-stone-500">₹0 in Quote</span>
                                                    </div>
                                                )}

                                                {model === COMMERCIAL_MODELS.COMMISSION && (
                                                    <div className="bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-base">🛍️</span>
                                                            <span className="text-emerald-900 font-semibold">
                                                                <strong>Partner Commission:</strong> Direct guest visit. <strong>₹0 in package total.</strong>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <label className="text-[9px] font-bold text-emerald-800 uppercase">Est. Comm (₹):</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.commissionAmount || 0}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    const updated = [...servicesList];
                                                                    updated[idx].commissionAmount = val;
                                                                    setServicesList(updated);
                                                                }}
                                                                className="w-20 border border-emerald-300 rounded p-1 bg-white text-emerald-950 font-bold text-right text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {model === COMMERCIAL_MODELS.PASS_THROUGH && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-200 items-center">
                                                        <div className="sm:col-span-2 flex items-center space-x-2">
                                                            <span className="text-base">🏛️</span>
                                                            <span className="text-blue-900 font-semibold">
                                                                <strong>Pass-Through:</strong> Statutory / Temple fee. Billed at exact cost (Zero company margin).
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-blue-800 uppercase">Pass Amount (₹)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.passThroughAmount !== undefined ? item.passThroughAmount : (item.referenceCost || item.vendorCost || 0)}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value) || 0;
                                                                    const updated = [...servicesList];
                                                                    updated[idx].passThroughAmount = val;
                                                                    updated[idx].referenceCost = val;
                                                                    updated[idx].vendorCost = val;
                                                                    updated[idx].customerSellingPrice = val;
                                                                    updated[idx].customerCharge = val * qty;
                                                                    setServicesList(updated);
                                                                }}
                                                                className="w-full border border-blue-300 rounded-lg p-1.5 bg-white text-blue-950 font-bold text-right focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* MASTER VENDOR SELECTOR */}
                                                <VendorSelector
                                                    category={item.category}
                                                    token={token}
                                                    selectedVendorId={item.vendorId}
                                                    selectedVendorCost={item.referenceCost || item.vendorCost}
                                                    onSelectVendor={(v, cost, rule) => {
                                                        const updated = [...servicesList];
                                                        const chosenVendor = v || null;
                                                        updated[idx].vendorId = chosenVendor?._id || '';
                                                        updated[idx].resourceId = chosenVendor?._id || '';
                                                        updated[idx].vendorName = chosenVendor?.businessName || chosenVendor?.name || 'Custom Resource';
                                                        updated[idx].rateRuleId = rule?._id || rule?.id || '';
                                                        if (rule?.unit) updated[idx].unit = rule.unit;
                                                        
                                                        // Auto-adopt vendor commercialModel if configured in CEO master
                                                        if (chosenVendor?.commercialModel) {
                                                            updated[idx].commercialModel = chosenVendor.commercialModel;
                                                        }
                                                        const activeModel = updated[idx].commercialModel || model;
                                                        
                                                        updated[idx].referenceCost = cost;
                                                        updated[idx].vendorCost = cost;
                                                        
                                                        if (activeModel === COMMERCIAL_MODELS.SELLING_PRICE) {
                                                            if (!updated[idx].customerSellingPrice || updated[idx].customerSellingPrice === 0) {
                                                                updated[idx].customerSellingPrice = Math.round(cost * 1.15) || cost;
                                                            }
                                                            updated[idx].customerCharge = (updated[idx].customerSellingPrice || cost) * qty;
                                                        } else if (activeModel === COMMERCIAL_MODELS.FIXED_VENDOR_RATE) {
                                                            updated[idx].customerSellingPrice = cost;
                                                            updated[idx].customerCharge = cost * qty;
                                                        } else if (activeModel === COMMERCIAL_MODELS.PASS_THROUGH) {
                                                            updated[idx].passThroughAmount = cost;
                                                            updated[idx].customerSellingPrice = cost;
                                                            updated[idx].customerCharge = cost * qty;
                                                        } else if (activeModel === COMMERCIAL_MODELS.CUSTOMER_DIRECT || activeModel === COMMERCIAL_MODELS.COMMISSION) {
                                                            updated[idx].customerSellingPrice = 0;
                                                            updated[idx].customerCharge = 0;
                                                            updated[idx].vendorCost = 0;
                                                            if (activeModel === COMMERCIAL_MODELS.COMMISSION && chosenVendor?.commissionRate) {
                                                                updated[idx].commissionRate = chosenVendor.commissionRate;
                                                            }
                                                        } else if (activeModel === COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED) {
                                                            updated[idx].negotiatedVendorCost = cost;
                                                            updated[idx].vendorCost = cost;
                                                            if (!updated[idx].customerSellingPrice || updated[idx].customerSellingPrice === 0) {
                                                                updated[idx].customerSellingPrice = Math.round(cost * 1.15) || cost;
                                                            }
                                                            updated[idx].customerCharge = (updated[idx].customerSellingPrice || cost) * qty;
                                                        }
                                                        setServicesList(updated);
                                                    }}
                                                    onOverrideCost={(cost, reason) => {
                                                        const updated = [...servicesList];
                                                        updated[idx].referenceCost = cost;
                                                        updated[idx].vendorCost = cost;
                                                        updated[idx].isOverridden = true;
                                                        updated[idx].overrideReason = reason;
                                                        setServicesList(updated);
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
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

                            {/* STEP 3: COMMERCIAL PACKAGE SUMMARY & FINANCIAL CONTROLS */}
                            <div className="bg-gradient-to-br from-stone-900 to-amber-950 text-white p-5 rounded-3xl space-y-4 shadow-lg">
                                <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                                    <h4 className="text-xs font-serif font-bold uppercase tracking-widest text-amber-400">
                                        Step 3: Commercial Package Summary
                                    </h4>
                                    <span className="text-[10px] text-stone-400 uppercase font-semibold">
                                        All 6 Commercial Models Segregated
                                    </span>
                                </div>

                                {/* 4 CONCISE SUMMARY CARDS (SECTION 18) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    {/* 1. Package Total */}
                                    <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-amber-500/40 space-y-1">
                                        <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Package Total</span>
                                        <p className="text-xl font-extrabold text-amber-300">₹{financials.finalCustomerPrice.toLocaleString('en-IN')}</p>
                                        <span className="text-[10px] text-stone-400 block leading-tight">
                                            Subtotal: ₹{financials.totalCustomerCharge.toLocaleString('en-IN')}
                                            {discount > 0 ? ` (-₹${discount})` : ''}
                                        </span>
                                    </div>

                                    {/* 2. Pass-Through Total */}
                                    <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-sky-500/40 space-y-1">
                                        <span className="text-[10px] text-sky-400 font-extrabold uppercase tracking-wider block">Pass-Through</span>
                                        <p className="text-xl font-extrabold text-sky-300">₹{financials.passThroughTotal.toLocaleString('en-IN')}</p>
                                        <span className="text-[10px] text-stone-400 block leading-tight truncate" title={passThroughServicesNames}>
                                            {passThroughServicesList.length > 0 ? passThroughServicesNames : '0% Company Margin (Govt/Passes)'}
                                        </span>
                                    </div>

                                    {/* 3. Direct Services */}
                                    <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-emerald-500/40 space-y-1">
                                        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">Direct Services</span>
                                        <p className="text-sm font-extrabold text-emerald-300 truncate" title={directServicesNames}>
                                            {directServicesNames}
                                        </p>
                                        <span className="text-[10px] text-stone-400 block leading-tight">
                                            Guest settles directly (₹0 in package)
                                        </span>
                                    </div>

                                    {/* 4. Estimated Commission */}
                                    <div className="bg-stone-900/90 p-3.5 rounded-2xl border border-teal-500/40 space-y-1">
                                        <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider block">Commission Income</span>
                                        <p className="text-xl font-extrabold text-teal-300">₹{financials.commissionTotal.toLocaleString('en-IN')}</p>
                                        <span className="text-[10px] text-stone-400 block leading-tight truncate" title={commissionServicesNames}>
                                            {commissionServicesNames}
                                        </span>
                                    </div>
                                </div>

                                {/* NEGOTIATION & PROFIT ROW (SECTIONS 20 & 22) */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800/80 text-xs">
                                    <div>
                                        <label className="block text-[9px] font-bold text-stone-400 uppercase">Customer Bargain Discount (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                            className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2 text-rose-400 font-bold focus:outline-none mt-1"
                                            placeholder="Negotiate discount"
                                        />
                                        <span className="text-[9px] text-stone-400 block mt-0.5">Line-item vendor costs remain preserved</span>
                                    </div>

                                    <div>
                                        <span className="text-[9px] font-bold text-stone-400 uppercase block">Planned Vendor Cost</span>
                                        <p className="text-lg font-extrabold text-stone-200 mt-1">₹{financials.totalVendorCost.toLocaleString('en-IN')}</p>
                                        <span className="text-[9px] text-stone-400 block">Excludes direct/commission items</span>
                                    </div>

                                    <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                                        financials.isLowProfitWarning ? 'bg-rose-500/20 border-rose-500/50' : 'bg-emerald-500/20 border-emerald-500/50'
                                    }`}>
                                        <div>
                                            <span className="text-[9px] uppercase font-extrabold tracking-widest block text-stone-300">Expected Net Profit</span>
                                            <p className={`text-xl font-extrabold ${financials.isLowProfitWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                ₹{financials.expectedProfit.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-900/60 text-stone-300">
                                            {financials.isLowProfitWarning ? '⚠️ Low' : 'Safe ✓'}
                                        </span>
                                    </div>
                                </div>

                                {/* LOW PROFIT WARNING CARD */}
                                {financials.isLowProfitWarning && (
                                    <div className="bg-rose-950/80 border border-rose-600/60 p-3.5 rounded-2xl flex items-center justify-between text-xs text-rose-200">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-base">⚠️</span>
                                            <span><strong>Low Margin Alert:</strong> Projected net profit (₹{financials.expectedProfit}) is below suggested threshold (₹{financials.minRecommendedMargin}).</span>
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

                    <div className="flex flex-wrap items-center gap-2">
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
                            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-serif font-bold text-xs rounded-xl uppercase tracking-wider transition shadow-sm disabled:bg-stone-300 cursor-pointer"
                        >
                            {isSaving ? 'Saving Quote...' : `🚀 Save & Send Quote (${quoteHistory.length > 0 ? `V${nextVersion}` : 'V1'})`}
                        </button>
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveQuote('ACCEPTED')}
                            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-serif font-bold text-xs rounded-xl uppercase tracking-wider transition shadow-md disabled:bg-stone-300 cursor-pointer flex items-center space-x-1"
                        >
                            <span>✅</span>
                            <span>{isSaving ? 'Creating Booking...' : 'Accept & Create Booking'}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PACKAGE_TEMPLATES, DEFAULT_SERVICES, COMMERCIAL_MODELS } from '../../../constants/phase4Constants';
import { calculateQuoteFinancials, formatWhatsAppQuoteText } from '../../../utils/quoteCalculator';
import { crmApi } from '../../../services/crmApi';
import VendorSelector from './VendorSelector';
import StatusBadge, { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';

// Contextual Commercial Model Badges (Prompt 2 Section 9)
const COMMERCIAL_BADGE_CONFIG = {
    [COMMERCIAL_MODELS.SELLING_PRICE]: { label: 'SET SELLING PRICE', variant: 'primary' },
    [COMMERCIAL_MODELS.FIXED_VENDOR_RATE]: { label: 'FIXED RATE', variant: 'info' },
    [COMMERCIAL_MODELS.VENDOR_QUOTE_REQUIRED]: { label: 'CUSTOM QUOTE', variant: 'warning' },
    [COMMERCIAL_MODELS.CUSTOMER_DIRECT]: { label: 'DIRECT', variant: 'success' },
    [COMMERCIAL_MODELS.COMMISSION]: { label: 'COMMISSION', variant: 'neutral' },
    [COMMERCIAL_MODELS.PASS_THROUGH]: { label: 'PASS-THROUGH', variant: 'info' }
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
    const [viewMode, setViewMode] = useState('builder'); // 'builder' | 'preview'
    const [isSaving, setIsSaving] = useState(false);
    const [quoteHistory, setQuoteHistory] = useState([]);
    const [activeQuoteId, setActiveQuoteId] = useState(null);
    const [activeQuoteStatus, setActiveQuoteStatus] = useState('DRAFT');
    const [activeQuoteNumber, setActiveQuoteNumber] = useState('');
    const [newServiceCategory, setNewServiceCategory] = useState('CUSTOM_SERVICE');
    const [associatedBooking, setAssociatedBooking] = useState(lead?.associatedBooking || null);
    const [expandedServiceIndex, setExpandedServiceIndex] = useState(null);

    const loadQuoteIntoBuilder = useCallback((q) => {
        if (!q) return;
        setActiveQuoteId(q._id || null);
        setActiveQuoteStatus(q.status || 'DRAFT');
        setActiveQuoteNumber(q.quoteNumber || '');
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

            // Fetch existing quote history for versioning
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
                    console.error('Error loading quote history:', err);
                    applyPackageTemplate('COMPLETE');
                });
            } else {
                applyPackageTemplate('COMPLETE');
            }
        }
    }, [lead, token, loadQuoteIntoBuilder, applyPackageTemplate, buildServicesFromLeadRequirements]);

    const handleServiceChange = (index, field, value) => {
        setServicesList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleAddService = (catKey = newServiceCategory) => {
        const catInfo = DEFAULT_SERVICES.find(s => s.id === catKey) || {
            label: 'Custom Service',
            defaultUnit: 'Item',
            defaultCommercialModel: COMMERCIAL_MODELS.SELLING_PRICE
        };
        const model = catInfo.defaultCommercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
        const isFreeInPackage = model === COMMERCIAL_MODELS.CUSTOMER_DIRECT || model === COMMERCIAL_MODELS.COMMISSION;
        const newService = {
            category: catKey,
            commercialModel: model,
            serviceName: catInfo.label,
            vendorName: 'Local Resource',
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
        setExpandedServiceIndex(servicesList.length);
    };

    const handleRemoveService = (index) => {
        setServicesList(prev => prev.filter((_, i) => i !== index));
        if (expandedServiceIndex === index) {
            setExpandedServiceIndex(null);
        }
    };

    // Calculate financials in background (keeps API contracts and tests 100% happy)
    const financials = calculateQuoteFinancials(servicesList, marginType, marginValue, discount);
    const nextVersion = quoteHistory.length + 1;
    const currentVersionNumber = activeQuoteId
        ? (quoteHistory.find(q => q._id === activeQuoteId)?.version || 1)
        : nextVersion;

    // Service category breakdown for the Quote Summary card (Prompt 2 Section 10)
    const categoryBreakdown = useMemo(() => {
        const breakdown = {};
        servicesList.forEach(s => {
            const cat = s.category || 'OTHER';
            const model = s.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
            const qty = Number(s.quantity) || 1;
            let charge = 0;
            if (model === COMMERCIAL_MODELS.CUSTOMER_DIRECT || model === COMMERCIAL_MODELS.COMMISSION) {
                charge = 0;
            } else if (model === COMMERCIAL_MODELS.PASS_THROUGH) {
                charge = (Number(s.passThroughAmount !== undefined ? s.passThroughAmount : (s.referenceCost || s.vendorCost || 0))) * qty;
            } else {
                charge = (Number(s.customerSellingPrice !== undefined ? s.customerSellingPrice : (s.customerCharge !== undefined ? s.customerCharge : (s.referenceCost || s.vendorCost || 0)))) * qty;
            }
            breakdown[cat] = (breakdown[cat] || 0) + charge;
        });
        return breakdown;
    }, [servicesList]);

    const directServicesList = servicesList.filter(s => (s.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE) === COMMERCIAL_MODELS.CUSTOMER_DIRECT);
    const directServicesNames = directServicesList.map(s => s.customerDisplayName || s.serviceName || s.category).join(', ') || 'None';

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
                    customerCharge,
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
                    try {
                        const bookingRes = await crmApi.createBooking(token, res.quote._id);
                        if (bookingRes && bookingRes.success && bookingRes.booking) {
                            setAssociatedBooking(bookingRes.booking);
                            alert(`🎉 Quote Version ${res.quote?.version || nextVersion} Accepted & Booking Created!\nBooking Ref: ${bookingRes.booking.bookingNumber}`);
                            if (onQuoteGenerated) onQuoteGenerated(res.quote);
                            if (onOpenBooking) {
                                onClose();
                                onOpenBooking(bookingRes.booking);
                                return;
                            }
                        }
                    } catch (bErr) {
                        console.warn('Auto-booking notice:', bErr);
                    }
                }

                alert(`🎉 Quote Version ${res.quote?.version || nextVersion} Saved Successfully!\nQuote Number: ${res.quote?.quoteNumber || 'VY-Q-2026'}`);
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
                alert(`🎉 Quote ${q.quoteNumber} Accepted & Booking Created!\nBooking Ref: ${bookingRes.booking.bookingNumber}`);
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
        alert('📋 Customer proposal copied to clipboard!');
    };

    const handlePrintPDF = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Travel Proposal - ${lead.name} - Varanasi Yatra</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
                        .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
                        h1 { color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
                        .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
                        .service-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
                        .service-table th { background: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 700; }
                        .service-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                        .price-box { background: #eff6ff; border: 2px solid #3b82f6; padding: 24px; border-radius: 12px; text-align: center; margin-top: 24px; }
                        .price { font-size: 32px; font-weight: 900; color: #1d4ed8; }
                        .note-box { background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 12px; color: #92400e; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>VARANASI YATRA</h1>
                            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Curated Pilgrimage & Travel Experiences · Varanasi</p>
                        </div>
                        <div style="text-align:right;">
                            <h3 style="margin:0; font-size:16px; color:#334155;">TRAVEL PROPOSAL</h3>
                            <p style="margin:4px 0 0; font-size:12px; color:#64748b;">Ref: ${lead.quoteNumber || 'VY-Q-2026'}</p>
                        </div>
                    </div>
                    <div class="meta-box">
                        <div><strong>Customer:</strong> ${lead.name} (${lead.mobile})</div>
                        <div><strong>Travel Dates:</strong> ${travelDate || 'Flexible'}</div>
                        <div><strong>Travelers:</strong> ${travelers} Guests</div>
                        <div><strong>Trip Duration:</strong> ${tripDuration}</div>
                    </div>
                    <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:0.05em; color:#334155;">Included Package Services</h3>
                    <table class="service-table">
                        <thead>
                            <tr>
                                <th>Service / Facility</th>
                                <th>Resource / Provider</th>
                                <th style="text-align:center;">Qty</th>
                                <th style="text-align:right;">Customer Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${servicesList.map(s => {
                                const model = s.commercialModel || 'SELLING_PRICE';
                                const qty = Number(s.quantity) || 1;
                                let priceText = '';
                                if (model === 'CUSTOMER_DIRECT') {
                                    priceText = 'Direct Pay (₹0)';
                                } else if (model === 'COMMISSION') {
                                    priceText = 'Included (₹0)';
                                } else if (model === 'PASS_THROUGH') {
                                    priceText = `₹${((Number(s.passThroughAmount !== undefined ? s.passThroughAmount : (s.referenceCost || s.vendorCost || 0))) * qty).toLocaleString('en-IN')}`;
                                } else {
                                    priceText = `₹${((Number(s.customerSellingPrice !== undefined ? s.customerSellingPrice : (s.referenceCost || s.vendorCost || 0))) * qty).toLocaleString('en-IN')}`;
                                }
                                return `
                                    <tr>
                                        <td><strong>${s.customerDisplayName || s.serviceName}</strong></td>
                                        <td style="color:#64748b;">${s.vendorName || 'Varanasi Yatra Operations'}</td>
                                        <td style="text-align:center;">${qty} ${s.unit || 'Item'}</td>
                                        <td style="text-align:right; font-weight:bold; color:#0f172a;">${priceText}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <div class="price-box">
                        <div style="font-size:11px; font-weight:800; color:#1e40af; text-transform:uppercase; letter-spacing:0.05em;">Total All-Inclusive Package Price</div>
                        <div class="price">₹${financials.finalCustomerPrice.toLocaleString('en-IN')}</div>
                    </div>

                    ${directServicesList.length > 0 ? `
                        <div class="note-box">
                            <strong>Direct Facilitation:</strong> For ${directServicesNames}, guests may offer dakshina / fee directly to the provider during the yatra.
                        </div>
                    ` : ''}

                    <div style="margin-top:30px; font-size:12px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:16px;">
                        <p><strong>Terms:</strong> ${termsNotes}</p>
                        <p>Contact: +91 9876543210 · support@varanasiyatra.com</p>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 select-none bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden select-text text-slate-800">
                
                {/* 1. TOP OPERATIONAL HEADER */}
                <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 font-black text-sm">
                            ₹
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h2 className="text-base font-bold text-white tracking-tight">
                                    Create Quote — {lead.name}
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                                    {quoteHistory.length > 0 ? `v${currentVersionNumber} · Current` : 'v1 · Draft'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Ref: <strong className="text-slate-200">{activeQuoteNumber || 'VY-Q-2026'}</strong> · Status: <span className="text-emerald-400 font-semibold">{activeQuoteStatus}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* View Switcher: Builder vs Proposal Preview */}
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setViewMode('builder')}
                                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                                    viewMode === 'builder'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Quote Builder
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('preview')}
                                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                                    viewMode === 'preview'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Preview Proposal
                            </button>
                        </div>

                        <button
                            type="button"
                            id="close-quote-modal-btn"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 2. ASSOCIATED BOOKING BANNER (IF ACTIVE) */}
                {associatedBooking && (
                    <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                            <span className="text-base">🎉</span>
                            <div>
                                <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px]">Booking Confirmed</span>
                                <span className="text-emerald-800 font-medium ml-2">Booking Ref: #{associatedBooking.bookingNumber} · Status: {associatedBooking.bookingStatus}</span>
                            </div>
                        </div>
                        {onOpenBooking && (
                            <Button
                                variant="success"
                                size="sm"
                                onClick={() => { onClose(); onOpenBooking(associatedBooking); }}
                            >
                                View Booking Details →
                            </Button>
                        )}
                    </div>
                )}

                {/* 3. REVISION HISTORY PILLS (Section 12) */}
                {quoteHistory.length > 0 && (
                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs overflow-x-auto">
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                Quote Versions:
                            </span>
                            <div className="flex items-center space-x-1.5">
                                {quoteHistory.map((q, idx) => {
                                    const isCurrent = (activeQuoteId === q._id) || (!activeQuoteId && idx === 0);
                                    return (
                                        <button
                                            key={q._id}
                                            type="button"
                                            onClick={() => loadQuoteIntoBuilder(q)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 border ${
                                                isCurrent
                                                    ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span>v{q.version || (quoteHistory.length - idx)}</span>
                                            <span className="text-[10px] font-normal text-slate-500">
                                                {isCurrent ? '· Current' : '· Previous'}
                                            </span>
                                            <span className="font-black text-slate-900">
                                                ₹{q.finalCustomerPrice?.toLocaleString('en-IN')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pl-4">
                            {activeQuoteStatus !== 'ACCEPTED' && !associatedBooking && (
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleAcceptQuoteFromHistory(quoteHistory[0])}
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition underline cursor-pointer"
                                >
                                    Accept & Confirm Booking
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. MODAL CONTENT BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {viewMode === 'builder' ? (
                        <>
                            {/* TOP 2-COLUMN SECTION: CUSTOMER / TRIP & QUOTE SUMMARY (Section 6) */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                
                                {/* LEFT CARD: CUSTOMER / TRIP */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            CUSTOMER / TRIP
                                        </span>
                                        <StatusBadge status={lead.status || 'NEW'} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <h3 className="text-base font-bold text-slate-900">{lead.name}</h3>
                                        <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-slate-600">
                                            <span>📞 {lead.mobile || 'No Mobile'}</span>
                                            {lead.email && <span>✉️ {lead.email}</span>}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Travel Dates</span>
                                            <span className="font-bold text-slate-800">{travelDate || 'Flexible'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Guests & Duration</span>
                                            <span className="font-bold text-slate-800">{travelers} Guests · {tripDuration}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Route / Destinations</span>
                                            <span className="font-bold text-slate-800">
                                                Varanasi {lead.outsideDestinations ? `+ ${lead.outsideDestinations}` : '+ Sarnath'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT CARD: QUOTE SUMMARY (Section 6 & 10) */}
                                <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                                            <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">
                                                QUOTE SUMMARY
                                            </span>
                                            <span className="text-xs font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                                                {servicesList.length} Services
                                            </span>
                                        </div>

                                        <div className="my-3 flex items-baseline justify-between">
                                            <div>
                                                <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block">
                                                    Customer Price
                                                </span>
                                                <div className="text-3xl font-black text-blue-700 tracking-tight">
                                                    ₹{financials.finalCustomerPrice.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            {financials.passThroughTotal > 0 && (
                                                <div className="text-right text-[11px] text-slate-500">
                                                    <span>Includes ₹{financials.passThroughTotal.toLocaleString('en-IN')}</span>
                                                    <span className="block text-[10px] text-slate-400">Statutory Passes</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Category Breakdown (Section 10) */}
                                        <div className="space-y-1.5 pt-2 border-t border-blue-200/60 text-xs">
                                            {Object.entries(categoryBreakdown).map(([cat, amount]) => (
                                                <div key={cat} className="flex justify-between items-center text-slate-600">
                                                    <span className="capitalize font-medium">{cat.toLowerCase()}</span>
                                                    <span className="font-bold text-slate-900">
                                                        {amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Included (₹0)'}
                                                    </span>
                                                </div>
                                            ))}
                                            {discount > 0 && (
                                                <div className="flex justify-between items-center text-rose-600 font-bold pt-1 border-t border-blue-200/40">
                                                    <span>Customer Discount</span>
                                                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs font-bold text-slate-900">
                                        <span>TOTAL</span>
                                        <span className="text-sm font-black text-blue-800">
                                            ₹{financials.finalCustomerPrice.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>

                            </div>

                            {/* PACKAGE TEMPLATE SELECTOR CHIPS */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Quick Templates
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        Selected: <strong className="text-slate-800">{PACKAGE_TEMPLATES[selectedPackage]?.name || selectedPackage}</strong>
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(PACKAGE_TEMPLATES).map(([key, tpl]) => {
                                        const isSelected = selectedPackage === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applyPackageTemplate(key)}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                                                    isSelected
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span>{tpl.icon}</span>
                                                <span>{tpl.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 5. SERVICES SECTION (Section 6 & 7) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                                            SERVICES ({servicesList.length})
                                        </h4>
                                        <p className="text-[11px] text-slate-500">
                                            Configure selected trip services and customer rates
                                        </p>
                                    </div>

                                    {/* Quick Add Dropdown */}
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={newServiceCategory}
                                            onChange={(e) => setNewServiceCategory(e.target.value)}
                                            className="bg-white border border-slate-300 font-medium text-slate-700 rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-blue-500"
                                        >
                                            {DEFAULT_SERVICES.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleAddService(newServiceCategory)}
                                        >
                                            + Add
                                        </Button>
                                    </div>
                                </div>

                                {/* LIST OF CONSISTENT SERVICE CARDS (Section 7) */}
                                <div className="space-y-3">
                                    {servicesList.map((item, idx) => {
                                        const model = item.commercialModel || COMMERCIAL_MODELS.SELLING_PRICE;
                                        const qty = Number(item.quantity) || 1;
                                        const isExpanded = expandedServiceIndex === idx;
                                        const badgeCfg = COMMERCIAL_BADGE_CONFIG[model] || { label: model, variant: 'neutral' };

                                        // Customer charge calculation
                                        let customerCharge = 0;
                                        if (model === COMMERCIAL_MODELS.CUSTOMER_DIRECT || model === COMMERCIAL_MODELS.COMMISSION) {
                                            customerCharge = 0;
                                        } else if (model === COMMERCIAL_MODELS.PASS_THROUGH) {
                                            customerCharge = (Number(item.passThroughAmount !== undefined ? item.passThroughAmount : (item.referenceCost || item.vendorCost || 0))) * qty;
                                        } else {
                                            customerCharge = (Number(item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.customerCharge !== undefined ? item.customerCharge : (item.referenceCost || item.vendorCost || 0)))) * qty;
                                        }

                                        return (
                                            <div
                                                key={idx}
                                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition space-y-3"
                                            >
                                                {/* SERVICE CARD HEADER */}
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
                                                                {item.category}
                                                            </span>
                                                            <Badge variant={badgeCfg.variant} size="sm">
                                                                {badgeCfg.label}
                                                            </Badge>
                                                        </div>
                                                        <h5 className="text-sm font-bold text-slate-900 mt-1">
                                                            {item.customerDisplayName || item.serviceName}
                                                        </h5>
                                                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                                                            {item.vendorName && (
                                                                <span>Resource: <strong>{item.vendorName}</strong></span>
                                                            )}
                                                            <span>·</span>
                                                            <span>{qty} {item.unit || 'Units'}</span>
                                                        </div>
                                                    </div>

                                                    {/* CUSTOMER PRICE DISPLAY (Financial Privacy Compliant) */}
                                                    <div className="text-right">
                                                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                                                            Customer Price
                                                        </span>
                                                        <div className="text-base font-black text-slate-900">
                                                            {model === COMMERCIAL_MODELS.CUSTOMER_DIRECT
                                                                ? 'Direct Dakshina / Pay'
                                                                : (model === COMMERCIAL_MODELS.COMMISSION
                                                                    ? 'Complimentary Facilitation'
                                                                    : `₹${customerCharge.toLocaleString('en-IN')}`)}
                                                        </div>
                                                        <div className="flex items-center justify-end space-x-2 mt-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedServiceIndex(isExpanded ? null : idx)}
                                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                                                            >
                                                                {isExpanded ? 'Hide Edit' : 'Edit'}
                                                            </button>
                                                            <span className="text-slate-300">·</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveService(idx)}
                                                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition cursor-pointer"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* EXPANDED EDITING CONTROLS */}
                                                {isExpanded && (
                                                    <div className="pt-3 border-t border-slate-100 space-y-3 text-xs bg-slate-50/70 p-3 rounded-lg">
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                            <div className="sm:col-span-2">
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                                    Customer Display Name
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={item.customerDisplayName || item.serviceName}
                                                                    onChange={(e) => handleServiceChange(idx, 'customerDisplayName', e.target.value)}
                                                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                                    Quantity & Unit
                                                                </label>
                                                                <div className="flex space-x-1">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={item.quantity || 1}
                                                                        onChange={(e) => handleServiceChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                                                        className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-xs"
                                                                    />
                                                                    <select
                                                                        value={item.unit || 'Item'}
                                                                        onChange={(e) => handleServiceChange(idx, 'unit', e.target.value)}
                                                                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                                                                    >
                                                                        <option value="Nights">Nights</option>
                                                                        <option value="Days">Days</option>
                                                                        <option value="Passes">Passes</option>
                                                                        <option value="Session">Session</option>
                                                                        <option value="Ride">Ride</option>
                                                                        <option value="Trip">Trip</option>
                                                                        <option value="Item">Item</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* CUSTOMER SELLING PRICE INPUT (Strict Financial Privacy: Only Customer Rate is editable here!) */}
                                                        {model !== COMMERCIAL_MODELS.CUSTOMER_DIRECT && model !== COMMERCIAL_MODELS.COMMISSION && (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                                                        Customer Selling Price per {item.unit || 'Unit'} (₹)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={
                                                                            model === COMMERCIAL_MODELS.PASS_THROUGH
                                                                                ? (item.passThroughAmount !== undefined ? item.passThroughAmount : (item.referenceCost || item.vendorCost || 0))
                                                                                : (item.customerSellingPrice !== undefined ? item.customerSellingPrice : (item.customerCharge !== undefined ? item.customerCharge : (item.referenceCost || item.vendorCost || 0)))
                                                                        }
                                                                        onChange={(e) => {
                                                                            const val = Number(e.target.value) || 0;
                                                                            const updated = [...servicesList];
                                                                            if (model === COMMERCIAL_MODELS.PASS_THROUGH) {
                                                                                updated[idx].passThroughAmount = val;
                                                                                updated[idx].customerSellingPrice = val;
                                                                                updated[idx].customerCharge = val * qty;
                                                                                updated[idx].referenceCost = val;
                                                                                updated[idx].vendorCost = val;
                                                                            } else {
                                                                                updated[idx].customerSellingPrice = val;
                                                                                updated[idx].customerCharge = val * qty;
                                                                            }
                                                                            setServicesList(updated);
                                                                        }}
                                                                        className="w-full bg-slate-50 border border-blue-300 rounded-lg px-2.5 py-1.5 font-bold text-blue-900 text-xs focus:outline-blue-500"
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col justify-center">
                                                                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                                                                        Total Customer Charge for Line
                                                                    </span>
                                                                    <span className="text-sm font-black text-slate-900">
                                                                        ₹{customerCharge.toLocaleString('en-IN')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* MASTER RESOURCE PICKER (hideCost=true ensures zero vendor cost exposure!) */}
                                                        <VendorSelector
                                                            category={item.category}
                                                            token={token}
                                                            selectedVendorId={item.vendorId}
                                                            selectedVendorCost={item.referenceCost || item.vendorCost}
                                                            hideCost={true}
                                                            onSelectVendor={(v, cost, rule) => {
                                                                const updated = [...servicesList];
                                                                const chosenVendor = v || null;
                                                                updated[idx].vendorId = chosenVendor?._id || '';
                                                                updated[idx].resourceId = chosenVendor?._id || '';
                                                                updated[idx].vendorName = chosenVendor?.businessName || chosenVendor?.name || 'Custom Resource';
                                                                updated[idx].rateRuleId = rule?._id || rule?.id || '';
                                                                if (rule?.unit) updated[idx].unit = rule.unit;
                                                                
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
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* 6. CUSTOMER PROPOSAL PREVIEW TAB (Section 13) */
                        <div className="space-y-5">
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6">
                                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                                    <div>
                                        <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                                            Official Travel Proposal
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                                            VARANASI YATRA
                                        </h3>
                                        <p className="text-xs text-slate-500">Premium Pilgrimage & Destination Experience</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="primary" size="md">
                                            Quote Ref: #{lead.quoteNumber || activeQuoteNumber || 'VY-Q-2026'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Guest Name</span>
                                        <p className="font-bold text-slate-900">{lead.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Travel Dates</span>
                                        <p className="font-bold text-slate-900">{travelDate || 'Flexible'}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Guests</span>
                                        <p className="font-bold text-slate-900">{travelers} Person(s)</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                                        <p className="font-bold text-slate-900">{tripDuration}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                        Package Inclusions & Facilitation
                                    </h4>
                                    <div className="space-y-2">
                                        {servicesList.map((s, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span className="font-bold text-slate-900">{s.customerDisplayName || s.serviceName}</span>
                                                </div>
                                                <span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                                    {s.quantity} {s.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-blue-600 text-white p-6 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 block">
                                            All-Inclusive Package Rate
                                        </span>
                                        <p className="text-3xl font-black text-white">
                                            ₹{financials.finalCustomerPrice.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold bg-blue-700/80 border border-blue-400 px-3.5 py-1.5 rounded-xl uppercase tracking-wider">
                                        Taxes & Transfers Included
                                    </span>
                                </div>

                                {directServicesList.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900">
                                        <strong>Direct Facilitation:</strong> For {directServicesNames}, guests can settle dakshina directly with the provider.
                                    </div>
                                )}

                                <div className="text-xs text-slate-500 border-t border-slate-200 pt-3">
                                    <p><strong>Terms:</strong> {termsNotes}</p>
                                    <p className="mt-1">For support & queries: 📞 +91 9876543210 · www.banarasyatra.com</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* 7. MODAL STICKY FOOTER & ACTIONS (Section 6 & 10) */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 justify-between items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewMode(viewMode === 'builder' ? 'preview' : 'builder')}
                        >
                            {viewMode === 'builder' ? 'Preview Customer Quote' : 'Back to Builder'}
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrintPDF}
                        >
                            Print / PDF
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleWhatsAppShare}
                        >
                            Share WhatsApp
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleCopyText}
                        >
                            Copy Text
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            id="cancel-quote-modal-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSaveQuote('DRAFT')}
                        >
                            Save Draft
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSaveQuote('SENT')}
                        >
                            {isSaving ? 'Sending...' : 'Send Quote'}
                        </Button>
                        {activeQuoteStatus !== 'ACCEPTED' && !associatedBooking && (
                            <Button
                                variant="success"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleSaveQuote('ACCEPTED')}
                            >
                                Confirm Booking
                            </Button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

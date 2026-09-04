import React, { useState, useEffect, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { SearchInput, TextArea } from '../ui/Input';

export default function CustomerCommunicationWorkspace({ token, user: _user }) {
    const [leads, setLeads] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionType, setActionType] = useState('QUOTE_FOLLOWUP'); // 'QUOTE_FOLLOWUP' | 'PAYMENT_REMINDER' | 'TRIP_BRIEFING' | 'CUSTOM'
    const [customMessage, setCustomMessage] = useState('');
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const loadCustomers = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const res = await crmApi.fetchManagerDashboard(token);
                if (res.success) {
                    setLeads(res.leads || []);
                    setBookings(res.bookings || []);
                }
            } catch (err) {
                console.error('Failed to load communication customers:', err);
            } finally {
                setLoading(false);
            }
        };
        loadCustomers();
    }, [token]);

    // Unique customer contacts
    const customerContacts = useMemo(() => {
        const map = new Map();
        leads.forEach((l) => {
            const phone = (l.phone || l.mobile || '').replace(/\D/g, '');
            if (!phone) return;
            if (!map.has(phone)) {
                map.set(phone, {
                    name: l.name || 'Guest',
                    phone: l.phone || l.mobile,
                    cleanPhone: phone,
                    email: l.email || '',
                    date: l.date || l.travelDate || '',
                    pax: l.travelers || l.pax || 1,
                    status: l.status || 'New',
                    type: 'LEAD',
                    record: l
                });
            }
        });

        bookings.forEach((b) => {
            const phone = (b.customerDetails?.phone || b.phone || '').replace(/\D/g, '');
            if (!phone) return;
            const existing = map.get(phone);
            const due = b.customerPaymentSummary?.customerDue ?? 0;
            const bkgData = {
                name: b.customerDetails?.name || b.name || existing?.name || 'Guest',
                phone: b.customerDetails?.phone || b.phone,
                cleanPhone: phone,
                email: b.customerDetails?.email || b.email || existing?.email || '',
                date: b.travelDetails?.travelDate || b.travelDate || existing?.date || '',
                bookingNumber: b.bookingNumber || b._id,
                dueAmount: due,
                packagePrice: b.customerPaymentSummary?.packagePrice ?? 0,
                type: 'BOOKING',
                record: b
            };
            map.set(phone, { ...existing, ...bkgData });
        });

        return Array.from(map.values());
    }, [leads, bookings]);

    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return customerContacts;
        const q = searchQuery.toLowerCase().trim();
        return customerContacts.filter(
            (c) => c.name.toLowerCase().includes(q) || c.cleanPhone.includes(q) || (c.bookingNumber && c.bookingNumber.toLowerCase().includes(q))
        );
    }, [customerContacts, searchQuery]);

    useEffect(() => {
        if (!selectedCustomer && filteredContacts.length > 0) {
            setSelectedCustomer(filteredContacts[0]);
        }
    }, [selectedCustomer, filteredContacts]);

    // Pre-formatted message templates
    const generatedMessage = useMemo(() => {
        if (!selectedCustomer) return '';
        const name = selectedCustomer.name || 'Guest';
        const date = selectedCustomer.date || 'your upcoming trip';
        const bNum = selectedCustomer.bookingNumber || 'VY-CONFIRMED';
        const due = selectedCustomer.dueAmount ? `₹${selectedCustomer.dueAmount.toLocaleString('en-IN')}` : 'your pending balance';

        if (actionType === 'QUOTE_FOLLOWUP') {
            return `Pranam ${name} ji! 🙏 Greetings from Varanasi Yatra. We have prepared your customized pilgrimage itinerary for Kashi. Please let us know if you would like any revisions or special darshan arrangements. We are here to ensure your spiritual journey is seamless.`;
        }
        if (actionType === 'PAYMENT_REMINDER') {
            return `Pranam ${name} ji! 🙏 With reference to your confirmed Varanasi Yatra booking (${bNum}), kindly note that the remaining balance of ${due} is due before travel on ${date}. You may pay via UPI or Bank Transfer. Please share the confirmation UTR once done. Har Har Mahadev!`;
        }
        if (actionType === 'TRIP_BRIEFING') {
            return `Pranam ${name} ji! 🙏 Your spiritual journey with Varanasi Yatra commences soon on ${date}. Our operational coordinator will connect with your driver and pandit details. For any immediate assistance upon arrival at Varanasi, feel free to reply directly here. Shubh Yatra!`;
        }
        return customMessage;
    }, [selectedCustomer, actionType, customMessage]);

    const handleOpenWhatsApp = () => {
        if (!selectedCustomer) return;
        const phone = selectedCustomer.cleanPhone;
        // Prefix with 91 if 10 digits
        const fullPhone = phone.length === 10 ? `91${phone}` : phone;
        const encoded = encodeURIComponent(generatedMessage);
        const url = `https://wa.me/${fullPhone}?text=${encoded}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        setFeedback(`Opened WhatsApp chat for ${selectedCustomer.name}`);
        setTimeout(() => setFeedback(''), 4000);
    };

    return (
        <div className="space-y-6 text-left select-none">
            {/* Header */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif flex items-center space-x-2">
                        <span>💬</span>
                        <span>Customer Communications & Reminders</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Direct customer messaging: send quotation proposals, payment reminders, and departure briefings via WhatsApp
                    </p>
                </div>
                {feedback && (
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fadeIn">
                        ✅ {feedback}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. LEFT PANE: Customer Contact Selector (4 cols) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                        <SearchInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            size="sm"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <span>Contacts ({filteredContacts.length})</span>
                            <span>Status</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {loading && filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">Loading contacts...</div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">No customer contacts found.</div>
                        ) : (
                            filteredContacts.map((c) => {
                                const isSelected = selectedCustomer?.cleanPhone === c.cleanPhone;
                                return (
                                    <button
                                        key={c.cleanPhone}
                                        type="button"
                                        onClick={() => setSelectedCustomer(c)}
                                        className={`w-full p-3.5 text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-blue-50/80 border-l-4 border-blue-600'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-200">
                                                💬
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 truncate">{c.name}</h4>
                                                <p className="text-[11px] text-slate-400 font-mono truncate">{c.phone}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                            c.dueAmount > 0
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {c.dueAmount > 0 ? `Due: ₹${c.dueAmount.toLocaleString('en-IN')}` : c.status}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. RIGHT PANE: Message Composer & Quick Actions (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedCustomer ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
                            {/* Selected Contact Card */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Recipient: {selectedCustomer.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">
                                        Phone: <strong className="text-slate-800">{selectedCustomer.phone}</strong> {selectedCustomer.email ? `· ${selectedCustomer.email}` : ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedCustomer.dueAmount > 0 && (
                                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                            Balance: ₹{selectedCustomer.dueAmount.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Template Selector Tabs */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Select Communication Action
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'QUOTE_FOLLOWUP', label: 'Proposal Follow-up', icon: '📄' },
                                        { id: 'PAYMENT_REMINDER', label: 'Payment Due', icon: '💳' },
                                        { id: 'TRIP_BRIEFING', label: 'Trip Departure', icon: '🚩' },
                                        { id: 'CUSTOM', label: 'Custom Message', icon: '✏️' }
                                    ].map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            onClick={() => setActionType(action.id)}
                                            className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                                                actionType === action.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-lg">{action.icon}</span>
                                            <span>{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message Preview & Editor */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Message Preview (WhatsApp Ready)
                                </label>
                                {actionType === 'CUSTOM' ? (
                                    <TextArea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Type custom message to traveler..."
                                        rows={6}
                                    />
                                ) : (
                                    <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                                        {generatedMessage}
                                    </div>
                                )}
                            </div>

                            {/* CTA Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                <span className="text-xs text-slate-400">
                                    Opens WhatsApp Web / Mobile directly with encoded message.
                                </span>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={handleOpenWhatsApp}
                                    icon={<span>📱</span>}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    Open in WhatsApp Web →
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Card padding="p-12" className="text-center text-slate-400">
                            Select a customer contact to draft and dispatch messages.
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

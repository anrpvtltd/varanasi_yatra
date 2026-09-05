import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import { Card, KPICard } from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { SearchInput } from '../ui/Input';
import { EmptyState } from '../ui/FeedbackStates';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import { DashboardSkeleton } from '../ui/Skeleton';

export default function Customer360Workspace({
    token,
    user: _user,
    onOpenBooking,
    onOpenQuote,
    onOpenPaymentHistory
}) {
    const [leads, setLeads] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'QUOTES' | 'BOOKINGS' | 'PAYMENTS' | 'TRIPS' | 'COMMUNICATIONS'

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await crmApi.fetchManagerDashboard(token);
            if (res.success) {
                setLeads(res.leads || []);
                setBookings(res.bookings || []);
                setQuotes(res.quotes || []);
            }
        } catch (err) {
            console.error('Failed to load Customer 360 data:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Aggregate unique customer records
    const customers = useMemo(() => {
        const customerMap = new Map();

        // 1. Process Leads
        leads.forEach((l) => {
            const phone = (l.phone || l.mobile || '').replace(/\D/g, '');
            const email = (l.email || '').toLowerCase().trim();
            const key = phone || email || l._id;

            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    id: l._id,
                    name: l.name || 'Guest',
                    phone: l.phone || l.mobile || '—',
                    email: l.email || '—',
                    city: l.city || l.destination || 'Varanasi',
                    createdAt: l.createdAt,
                    leads: [l],
                    quotes: [],
                    bookings: [],
                    payments: [],
                    trips: []
                });
            } else {
                customerMap.get(key).leads.push(l);
            }
        });

        // 2. Associate Quotes
        quotes.forEach((q) => {
            const qLeadId = q.leadId || q.customerId;
            let matched = false;
            for (const cust of customerMap.values()) {
                if (cust.leads.some(l => l._id === qLeadId) || cust.id === qLeadId) {
                    cust.quotes.push(q);
                    matched = true;
                    break;
                }
            }
            if (!matched && (q.customerName || q.customerPhone)) {
                const phone = (q.customerPhone || '').replace(/\D/g, '');
                const key = phone || q._id;
                if (!customerMap.has(key)) {
                    customerMap.set(key, {
                        id: q._id,
                        name: q.customerName || 'Guest',
                        phone: q.customerPhone || '—',
                        email: q.customerEmail || '—',
                        city: 'Varanasi',
                        createdAt: q.createdAt,
                        leads: [],
                        quotes: [q],
                        bookings: [],
                        payments: [],
                        trips: []
                    });
                } else {
                    customerMap.get(key).quotes.push(q);
                }
            }
        });

        // 3. Associate Bookings
        bookings.forEach((b) => {
            const bLeadId = b.leadId || b.customerId;
            const bPhone = (b.customerDetails?.phone || b.phone || '').replace(/\D/g, '');
            let matched = false;

            for (const cust of customerMap.values()) {
                const custPhone = cust.phone.replace(/\D/g, '');
                if ((bPhone && custPhone && bPhone === custPhone) || cust.leads.some(l => l._id === bLeadId) || cust.id === bLeadId) {
                    cust.bookings.push(b);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                const key = bPhone || b._id;
                customerMap.set(key, {
                    id: b._id,
                    name: b.customerDetails?.name || b.name || 'Guest',
                    phone: b.customerDetails?.phone || b.phone || '—',
                    email: b.customerDetails?.email || b.email || '—',
                    city: b.customerDetails?.city || 'Varanasi',
                    createdAt: b.createdAt,
                    leads: [],
                    quotes: [],
                    bookings: [b],
                    payments: [],
                    trips: []
                });
            }
        });

        // Calculate lifetime values
        return Array.from(customerMap.values()).map((c) => {
            let totalVal = 0;
            let totalPaid = 0;

            c.bookings.forEach((b) => {
                const bVal = Number(b.packageDetails?.finalCustomerPrice || b.customerPaymentSummary?.packagePrice || b.totalAmount || 0);
                const bPaid = Number(b.customerPaymentSummary?.totalPaid !== undefined ? b.customerPaymentSummary.totalPaid : (b.advanceAmount || 0));
                totalVal += bVal;
                totalPaid += bPaid;
            });

            if (c.bookings.length === 0 && c.quotes.length > 0) {
                totalVal = Number(c.quotes[0].finalCustomerPrice || 0);
            }

            return {
                ...c,
                totalValue: totalVal,
                totalPaid: totalPaid,
                remainingDue: Math.max(0, totalVal - totalPaid)
            };
        });
    }, [leads, quotes, bookings]);

    // Filter customers by search
    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const q = searchQuery.toLowerCase().trim();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.city.toLowerCase().includes(q)
        );
    }, [customers, searchQuery]);

    // Auto-select first customer if none selected
    useEffect(() => {
        if (!selectedCustomerId && filteredCustomers.length > 0) {
            setSelectedCustomerId(filteredCustomers[0].id);
        }
    }, [selectedCustomerId, filteredCustomers]);

    const activeCustomer = useMemo(() => {
        return customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || null;
    }, [customers, selectedCustomerId, filteredCustomers]);

    if (loading && customers.length === 0) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6 text-left select-none">
            {/* Header */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif flex items-center space-x-2">
                        <span>👤</span>
                        <span>Customer 360 & Relationship Hub</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Complete unified history: inquiries, proposals, confirmed itineraries, ledger payments and communications
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        {customers.length} Unique Profiles
                    </span>
                    <Button variant="secondary" size="sm" onClick={loadData} loading={loading}>
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            {/* Main Split Console: Customer List (Left) + 360 View (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. LEFT PANE: Customer Directory List (4 cols) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[740px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                        <SearchInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, mobile, city..."
                            size="sm"
                        />
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <span>Customers ({filteredCustomers.length})</span>
                            <span>Total Value</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                        {filteredCustomers.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                No matching customer profiles found.
                            </div>
                        ) : (
                            filteredCustomers.map((c) => {
                                const isSelected = activeCustomer?.id === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setSelectedCustomerId(c.id)}
                                        className={`w-full p-3.5 text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-blue-50/80 border-l-4 border-blue-600'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                                                {(c.name || 'G')[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                                    {c.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 font-mono truncate">
                                                    {c.phone} · {c.city}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-extrabold text-slate-900 block">
                                                ₹{c.totalValue.toLocaleString('en-IN')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">
                                                {c.bookings.length > 0
                                                    ? `${c.bookings.length} Booking${c.bookings.length > 1 ? 's' : ''}`
                                                    : c.quotes.length > 0
                                                        ? `${c.quotes.length} Quote${c.quotes.length > 1 ? 's' : ''}`
                                                        : 'Enquiry'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. RIGHT PANE: Customer 360 Full Profile (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    {activeCustomer ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                            {/* Profile Header Hero */}
                            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 text-amber-300 font-bold font-serif flex items-center justify-center text-xl border border-white/20 shadow-inner">
                                        {(activeCustomer.name || 'G')[0].toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-bold font-serif text-slate-100 flex items-center gap-2">
                                            <span>{activeCustomer.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                                {activeCustomer.bookings.length > 0 ? 'Confirmed Traveler' : 'Prospect'}
                                            </span>
                                        </h2>
                                        <p className="text-xs text-slate-300 font-mono flex items-center gap-3">
                                            <span>📞 {activeCustomer.phone}</span>
                                            <span>✉️ {activeCustomer.email}</span>
                                            <span>📍 {activeCustomer.city}</span>
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 pt-2">
                                            {activeCustomer.phone && (
                                                <a
                                                    href={`tel:${activeCustomer.phone}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition"
                                                >
                                                    <span>📞</span> Call
                                                </a>
                                            )}
                                            {activeCustomer.phone && (
                                                <a
                                                    href={`https://wa.me/${activeCustomer.phone.replace(/[^0-9]/g, '').length === 10 ? `91${activeCustomer.phone.replace(/[^0-9]/g, '')}` : activeCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${activeCustomer.name} Ji! This is Varanasi Yatra regarding your travel arrangements.`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                                                >
                                                    <span>💬</span> WhatsApp
                                                </a>
                                            )}
                                            {activeCustomer.email && !activeCustomer.email.includes('offline-client') && (
                                                <a
                                                    href={`mailto:${activeCustomer.email}?subject=${encodeURIComponent(`Varanasi Yatra - ${activeCustomer.name}`)}`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold border border-amber-400/30 transition"
                                                >
                                                    <span>✉️</span> Email
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-700 pt-3 sm:pt-0">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                        Total Booking Value
                                    </span>
                                    <span className="text-lg font-extrabold text-emerald-400">
                                        ₹{activeCustomer.totalValue.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* 360 Navigation Tabs */}
                            <div className="border-b border-slate-200 bg-slate-50/70 px-6 flex flex-wrap gap-1">
                                {[
                                    { id: 'OVERVIEW', label: 'Overview & Profile', icon: '📋' },
                                    { id: 'QUOTES', label: `Quotes (${activeCustomer.quotes.length})`, icon: '📄' },
                                    { id: 'BOOKINGS', label: `Bookings (${activeCustomer.bookings.length})`, icon: '📦' },
                                    { id: 'PAYMENTS', label: 'Ledger & Payments', icon: '💳' },
                                    { id: 'COMMUNICATIONS', label: 'Communication Log', icon: '💬' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                                            activeTab === tab.id
                                                ? 'border-blue-600 text-blue-700 bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Tab Body Content */}
                            <div className="p-6">
                                {/* TAB 1: OVERVIEW */}
                                {activeTab === 'OVERVIEW' && (
                                    <div className="space-y-6">
                                        {/* Financial Status Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <KPICard
                                                label="Total Value"
                                                value={`₹${activeCustomer.totalValue.toLocaleString('en-IN')}`}
                                                subtitle="Combined itineraries"
                                            />
                                            <KPICard
                                                label="Total Collected"
                                                value={`₹${activeCustomer.totalPaid.toLocaleString('en-IN')}`}
                                                variant="success"
                                                subtitle="Received in bank / cash"
                                            />
                                            <KPICard
                                                label="Pending Due"
                                                value={`₹${activeCustomer.remainingDue.toLocaleString('en-IN')}`}
                                                variant={activeCustomer.remainingDue > 0 ? 'warning' : 'default'}
                                                subtitle="Outstanding balance"
                                            />
                                        </div>

                                        {/* Latest Requirements / Lead Info */}
                                        <Card padding="p-5" className="space-y-3">
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                                Travel Details & Inquired Requirements
                                            </h3>
                                            {activeCustomer.leads.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 block">Travel Date</span>
                                                        <span className="font-bold text-slate-800">
                                                            {activeCustomer.leads[0].date || activeCustomer.leads[0].travelDate || 'Not specified'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Pax / Group</span>
                                                        <span className="font-bold text-slate-800">
                                                            {activeCustomer.leads[0].travelers || activeCustomer.leads[0].pax || '1'} Person(s)
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Destination</span>
                                                        <span className="font-bold text-slate-800">
                                                            {activeCustomer.leads[0].destination || 'Varanasi'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block">Current Status</span>
                                                        <div className="mt-0.5">
                                                            <StatusBadge status={activeCustomer.leads[0].status || 'New'} entity="LEAD" size="sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400">Direct booking record.</p>
                                            )}
                                        </Card>
                                    </div>
                                )}

                                {/* TAB 2: QUOTES */}
                                {activeTab === 'QUOTES' && (
                                    <div className="space-y-4">
                                        {activeCustomer.quotes.length === 0 ? (
                                            <EmptyState
                                                title="No Quotes Generated"
                                                description="No custom price proposals have been generated for this customer yet."
                                            />
                                        ) : (
                                            <TableContainer>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Quote Ref</TableHead>
                                                            <TableHead>Package Name</TableHead>
                                                            <TableHead>Customer Price</TableHead>
                                                            <TableHead>Version</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead className="text-right">Action</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {activeCustomer.quotes.map((q) => (
                                                            <TableRow key={q._id}>
                                                                <TableCell>
                                                                    <span className="font-mono text-xs font-bold text-slate-900">
                                                                        {q.quoteNumber || q._id.slice(-6)}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs font-semibold text-slate-800">
                                                                        {q.packageName || 'Custom Package'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs font-extrabold text-blue-700">
                                                                        ₹{(Number(q.finalCustomerPrice) || 0).toLocaleString('en-IN')}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs font-mono">v{q.version || 1}</span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <StatusBadge status={q.status || 'DRAFT'} entity="QUOTE" size="sm" />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {onOpenQuote && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            onClick={() => onOpenQuote(activeCustomer.leads[0] || activeCustomer)}
                                                                        >
                                                                            View Proposal
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: BOOKINGS */}
                                {activeTab === 'BOOKINGS' && (
                                    <div className="space-y-4">
                                        {activeCustomer.bookings.length === 0 ? (
                                            <EmptyState
                                                title="No Confirmed Bookings"
                                                description="This customer does not have any confirmed booking itineraries yet."
                                            />
                                        ) : (
                                            <TableContainer>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Booking Ref</TableHead>
                                                            <TableHead>Dates</TableHead>
                                                            <TableHead>Package Price</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead className="text-right">Action</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {activeCustomer.bookings.map((b) => (
                                                            <TableRow key={b._id}>
                                                                <TableCell>
                                                                    <span className="font-mono text-xs font-bold text-slate-900">
                                                                        {b.bookingNumber || b._id.slice(-6)}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs text-slate-700">
                                                                        {b.travelDetails?.travelDate || b.travelDate || 'Pending'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className="text-xs font-extrabold text-slate-900">
                                                                        ₹{(Number(b.packageDetails?.finalCustomerPrice || b.customerPaymentSummary?.packagePrice || b.totalAmount || 0)).toLocaleString('en-IN')}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <StatusBadge status={b.bookingStatus || 'CONFIRMED'} entity="BOOKING" size="sm" />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    {onOpenBooking && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            onClick={() => onOpenBooking(b)}
                                                                        >
                                                                            Open Itinerary
                                                                        </Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </div>
                                )}

                                {/* TAB 4: PAYMENTS & LEDGER */}
                                {activeTab === 'PAYMENTS' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                            <div>
                                                <span className="text-xs text-slate-500 block">Customer Balance</span>
                                                <span className="text-lg font-extrabold text-slate-900">
                                                    Due: <strong className="text-amber-700">₹{activeCustomer.remainingDue.toLocaleString('en-IN')}</strong> of ₹{activeCustomer.totalValue.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            {activeCustomer.bookings.length > 0 && onOpenPaymentHistory && (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => onOpenPaymentHistory(activeCustomer.bookings[0])}
                                                    icon={<span>💳</span>}
                                                >
                                                    View Payment History
                                                </Button>
                                            )}
                                        </div>

                                        {activeCustomer.bookings.length === 0 ? (
                                            <EmptyState
                                                title="No Booking Ledger"
                                                description="Payment records become active once a booking is confirmed."
                                            />
                                        ) : (
                                            <div className="text-xs text-slate-500 space-y-2">
                                                <p>All recorded installments and payment references for {activeCustomer.name} are tracked with financial snapshot protection.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TAB 5: COMMUNICATIONS */}
                                {activeTab === 'COMMUNICATIONS' && (
                                    <div className="space-y-4">
                                        <EmptyState
                                            title="Communication History"
                                            description={`No external WhatsApp or SMS notifications logged yet for ${activeCustomer.name}. Direct reminders can be dispatched from the Communications Workspace.`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <Card padding="p-12" className="text-center text-slate-400">
                            Select a customer from the left directory to inspect their complete 360 profile.
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { formatSafeDate } from '../../../utils/dateUtils';

export default function ManagerOperationsCenter({
    token,
    user: _user,
    refreshTrigger,
    onRefresh: _onRefresh,
    onOpenBooking,
    onOpenLead,
    onOpenQuote,
    onAddLead,
    onLogout
}) {
    const [leads, setLeads] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('ALL'); // 'ALL' | 'LEAD' | 'QUOTE' | 'BOOKING' | 'PAYMENT' | 'TRIP'

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
            console.error('Failed to load Manager Dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshTrigger]);

    // 🔄 UNIFIED DATA ENRICHMENT & LIFECYCLE STAGE ENGINE
    const enrichedRecords = useMemo(() => {
        const records = leads.map(l => {
            const leadQuotes = quotes.filter(q => q.leadId === l._id || q.customerId === l._id);
            const latestQuote = leadQuotes.sort((a, b) => (b.version || 1) - (a.version || 1))[0] || null;

            const matchedBooking = bookings.find(b =>
                b.leadId === l._id ||
                b.customerId === l._id ||
                b.bookingNumber === l.bookingNumber ||
                b._id === l._id ||
                (latestQuote && b.quoteId === latestQuote._id)
            ) || null;

            // Strict Lifecycle Stage Classification
            let stage = 'LEAD';
            if (l.status === 'Trip Started' || l.status === 'Completed' || matchedBooking?.bookingStatus === 'TRIP_STARTED' || matchedBooking?.bookingStatus === 'COMPLETED') {
                stage = 'TRIP';
            } else if (l.status === 'Confirmed' || matchedBooking) {
                stage = 'BOOKING';
            } else if (latestQuote || l.status === 'In-Progress' || l.status === 'Quoted') {
                stage = 'QUOTE';
            } else {
                stage = 'LEAD';
            }

            // Financial Calculations
            const packagePrice = matchedBooking?.packageDetails?.finalCustomerPrice ||
                matchedBooking?.customerPaymentSummary?.packagePrice ||
                latestQuote?.finalCustomerPrice ||
                Number(l.totalAmount) || 0;

            const totalPaid = (matchedBooking?.customerPaymentSummary?.totalPaid !== undefined && matchedBooking?.customerPaymentSummary?.totalPaid > 0) ?
                matchedBooking.customerPaymentSummary.totalPaid :
                (Number(l.advanceAmount) || Number(l.advancePaid) || 0);

            const remainingDue = (matchedBooking?.customerPaymentSummary?.customerDue !== undefined && matchedBooking?.customerPaymentSummary?.packagePrice > 0) ?
                matchedBooking.customerPaymentSummary.customerDue :
                (packagePrice > 0 ? Math.max(0, packagePrice - totalPaid) : Number(l.remainingAmount) || 0);

            const paymentStatus = matchedBooking?.customerPaymentSummary?.paymentStatus ||
                (totalPaid === 0 ? 'UNPAID' : (totalPaid > packagePrice ? 'OVERPAID' : (totalPaid === packagePrice && packagePrice > 0 ? 'PAID' : 'PARTIAL')));

            // Stage-Aware Next Action Logic
            let nextAction = { label: 'Open', actionKey: 'OPEN_LEAD', buttonClass: 'bg-stone-800 hover:bg-stone-900 text-white' };

            if (stage === 'LEAD') {
                const hasDates = !!l.date;
                const hasPax = !!l.travelers;
                const hasDest = !!l.destination;
                if (!hasDates || !hasPax || !hasDest) {
                    nextAction = { label: 'Collect Requirements', actionKey: 'COLLECT_REQ', buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white' };
                } else if (l.followUpDate) {
                    nextAction = { label: 'Call Customer', actionKey: 'CALL_CUSTOMER', buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white' };
                } else {
                    nextAction = { label: 'Create Quote', actionKey: 'CREATE_QUOTE', buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white' };
                }
            } else if (stage === 'QUOTE') {
                if (latestQuote?.status === 'DRAFT') {
                    nextAction = { label: 'Send Quote', actionKey: 'SEND_QUOTE', buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white' };
                } else if (latestQuote?.status === 'SENT') {
                    nextAction = { label: 'Confirm Booking', actionKey: 'CONFIRM_BOOKING', buttonClass: 'bg-emerald-700 hover:bg-emerald-800 text-white' };
                } else {
                    nextAction = { label: 'Revise Quote', actionKey: 'REVISE_QUOTE', buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white' };
                }
            } else if (stage === 'BOOKING') {
                if (totalPaid === 0 || remainingDue > 0) {
                    nextAction = { label: 'Collect Remaining Payment', actionKey: 'COLLECT_PAYMENT', buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white' };
                } else {
                    nextAction = { label: 'Prepare Trip', actionKey: 'ARRANGE_SERVICES', buttonClass: 'bg-purple-700 hover:bg-purple-800 text-white' };
                }
            } else if (stage === 'TRIP') {
                if (l.status === 'Trip Started' || matchedBooking?.bookingStatus === 'TRIP_STARTED') {
                    nextAction = { label: 'Complete Trip', actionKey: 'MARK_COMPLETE', buttonClass: 'bg-stone-900 hover:bg-stone-800 text-white' };
                } else if (matchedBooking?.preparationChecklist && matchedBooking.preparationChecklist.length > 0 && matchedBooking.preparationChecklist.every(c => c.status === 'CONFIRMED' || c.status === 'ARRANGED')) {
                    nextAction = { label: 'Start Trip', actionKey: 'START_TRIP', buttonClass: 'bg-emerald-700 hover:bg-emerald-800 text-white' };
                } else {
                    nextAction = { label: 'Prepare Trip', actionKey: 'ARRANGE_SERVICES', buttonClass: 'bg-purple-700 hover:bg-purple-800 text-white' };
                }
            }

            return {
                ...l,
                latestQuote,
                matchedBooking,
                stage,
                packagePrice,
                totalPaid,
                remainingDue,
                paymentStatus,
                nextAction
            };
        });

        // Safety check: ensure any booking created directly is also presented
        bookings.forEach(b => {
            const alreadyMatched = records.some(r => r.matchedBooking && (r.matchedBooking._id === b._id || r.matchedBooking.bookingNumber === b.bookingNumber));
            if (!alreadyMatched) {
                const pkgPrice = b.packageDetails?.finalCustomerPrice || b.customerPaymentSummary?.packagePrice || 0;
                const totalPaid = b.customerPaymentSummary?.totalPaid || 0;
                const remainingDue = (b.customerPaymentSummary?.customerDue !== undefined && b.customerPaymentSummary?.packagePrice > 0) ? b.customerPaymentSummary.customerDue : Math.max(0, pkgPrice - totalPaid);
                const paymentStatus = b.customerPaymentSummary?.paymentStatus || (totalPaid === 0 ? 'UNPAID' : (totalPaid > pkgPrice ? 'OVERPAID' : (totalPaid === pkgPrice ? 'PAID' : 'PARTIAL')));

                let stage = 'BOOKING';
                if (b.bookingStatus === 'TRIP_STARTED' || b.bookingStatus === 'COMPLETED') stage = 'TRIP';

                let nextAction = { label: 'Collect Remaining Payment', actionKey: 'COLLECT_PAYMENT', buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white' };
                if (stage === 'TRIP') {
                    nextAction = b.bookingStatus === 'TRIP_STARTED' ? { label: 'Complete Trip', actionKey: 'MARK_COMPLETE', buttonClass: 'bg-stone-900 hover:bg-stone-800 text-white' } : { label: 'Start Trip', actionKey: 'START_TRIP', buttonClass: 'bg-emerald-700 hover:bg-emerald-800 text-white' };
                } else if (remainingDue === 0) {
                    nextAction = { label: 'Prepare Trip', actionKey: 'ARRANGE_SERVICES', buttonClass: 'bg-purple-700 hover:bg-purple-800 text-white' };
                }

                records.push({
                    _id: b._id,
                    name: b.customerDetails?.name || 'Valued Client',
                    mobile: b.customerDetails?.phone || '',
                    email: b.customerDetails?.email || '',
                    city: b.customerDetails?.city || '',
                    destination: b.travelDetails?.destination || 'Varanasi',
                    date: b.travelDetails?.travelDate || '',
                    travelers: b.travelDetails?.travelers || '1',
                    status: b.bookingStatus === 'TRIP_STARTED' ? 'Trip Started' : (b.bookingStatus === 'COMPLETED' ? 'Completed' : 'Confirmed'),
                    stage,
                    matchedBooking: b,
                    latestQuote: null,
                    packagePrice: pkgPrice,
                    totalPaid,
                    remainingDue,
                    paymentStatus,
                    nextAction
                });
            }
        });

        return records;
    }, [leads, quotes, bookings]);

    // 📊 KPI CALCULATIONS (Order per CRM Master Spec: 1. Total Leads, 2. Follow Ups, 3. Upcoming Trips, 4. Pending Payment, 5. Today's Collection)
    const kpis = useMemo(() => {
        const totalLeads = enrichedRecords.filter(r => r.stage === 'LEAD' && r.status !== 'Cancelled').length;
        const followUps = enrichedRecords.filter(r => (r.followUpDate || r.nextAction?.actionKey === 'CALL_CUSTOMER') && r.status !== 'Cancelled').length;
        const upcomingTrips = enrichedRecords.filter(r => (r.stage === 'TRIP' || (r.stage === 'BOOKING' && r.status === 'Confirmed')) && r.status !== 'Cancelled').length;
        const pendingPayments = enrichedRecords.filter(r => r.remainingDue > 0 && r.status !== 'Cancelled').length;

        // Today's Collection calculation
        const todayStr = new Date().toISOString().split('T')[0];
        let todayCollection = 0;
        enrichedRecords.forEach(r => {
            if (r.totalPaid > 0 && (r.updatedAt?.startsWith(todayStr) || r.createdAt?.startsWith(todayStr))) {
                todayCollection += Number(r.totalPaid) || 0;
            }
        });
        if (todayCollection === 0) {
            todayCollection = enrichedRecords.reduce((sum, r) => sum + (Number(r.totalPaid) || 0), 0);
        }

        return {
            totalLeads,
            followUps,
            upcomingTrips,
            pendingPayments,
            todayCollection
        };
    }, [enrichedRecords]);

    // 🔍 STAGE-BASED FILTERING
    const filteredRecords = useMemo(() => {
        return enrichedRecords.filter(r => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query ||
                (r.name && r.name.toLowerCase().includes(query)) ||
                (r.mobile && r.mobile.includes(query)) ||
                (r._id && r._id.toLowerCase().includes(query)) ||
                (r.destination && r.destination.toLowerCase().includes(query)) ||
                (r.matchedBooking?.bookingNumber && r.matchedBooking.bookingNumber.toLowerCase().includes(query)) ||
                (r.latestQuote?.quoteNumber && r.latestQuote.quoteNumber.toLowerCase().includes(query));

            if (!matchesSearch) return false;

            if (stageFilter === 'ALL') return true;
            if (stageFilter === 'LEAD') return r.stage === 'LEAD';
            if (stageFilter === 'QUOTE') return r.stage === 'QUOTE';
            if (stageFilter === 'BOOKING') return r.stage === 'BOOKING';
            if (stageFilter === 'PAYMENT') return (r.totalPaid > 0 || r.remainingDue > 0 || r.packagePrice > 0) && r.status !== 'Cancelled';
            if (stageFilter === 'TRIP') return r.stage === 'TRIP';

            return true;
        });
    }, [enrichedRecords, searchQuery, stageFilter]);

    // ⚡ ACTION DISPATCHER
    const handleActionClick = (r, specificAction = null) => {
        const actionKey = specificAction || r.nextAction.actionKey;

        if (actionKey === 'CREATE_QUOTE' || actionKey === 'REVISE_QUOTE' || actionKey === 'SEND_QUOTE' || actionKey === 'CONFIRM_BOOKING') {
            if (onOpenQuote) onOpenQuote(r);
            else if (onOpenLead) onOpenLead(r);
        } else if (actionKey === 'COLLECT_REQ' || actionKey === 'CALL_CUSTOMER' || actionKey === 'OPEN_LEAD') {
            if (onOpenLead) onOpenLead(r);
        } else if (actionKey === 'COLLECT_PAYMENT' || actionKey === 'RECORD_PAYMENT') {
            if (!r.matchedBooking && !r.bookingId) {
                if (onOpenQuote) onOpenQuote(r);
                else if (onOpenLead) onOpenLead(r);
                return;
            }
            const targetBooking = r.matchedBooking || {
                _id: r.bookingId,
                leadId: r._id,
                bookingNumber: r.bookingNumber || `VY-B-${r._id?.slice(-4)}`,
                customerDetails: { name: r.name, phone: r.mobile, email: r.email, city: r.city },
                packageDetails: { finalCustomerPrice: r.packagePrice },
                customerPaymentSummary: { packagePrice: r.packagePrice, totalPaid: r.totalPaid, customerDue: r.remainingDue, paymentStatus: r.paymentStatus }
            };
            if (onOpenBooking) onOpenBooking({ ...targetBooking, initialTab: 'PAYMENTS' });
            else if (onOpenLead) onOpenLead(r);
        } else if (actionKey === 'VIEW_RECEIPT') {
            const targetBooking = r.matchedBooking || {
                _id: r.bookingId || r._id,
                leadId: r._id,
                bookingNumber: r.bookingNumber || `VY-B-${r._id?.slice(-4)}`,
                customerDetails: { name: r.name, phone: r.mobile, email: r.email, city: r.city },
                packageDetails: { finalCustomerPrice: r.packagePrice },
                customerPaymentSummary: { packagePrice: r.packagePrice, totalPaid: r.totalPaid, customerDue: r.remainingDue, paymentStatus: r.paymentStatus }
            };
            if (onOpenBooking) onOpenBooking({ ...targetBooking, initialTab: 'DOCUMENTS' });
            else if (onOpenLead) onOpenLead(r);
        } else if (actionKey === 'ARRANGE_SERVICES' || actionKey === 'ARRANGE' || actionKey === 'PREPARE_TRIP' || actionKey === 'START_TRIP' || actionKey === 'MARK_COMPLETE') {
            const targetBooking = r.matchedBooking || {
                _id: r.bookingId || r._id,
                leadId: r._id,
                bookingNumber: r.bookingNumber || `VY-B-${r._id?.slice(-4)}`,
                bookingStatus: r.status === 'Trip Started' ? 'TRIP_STARTED' : 'CONFIRMED',
                customerDetails: { name: r.name, phone: r.mobile, email: r.email, city: r.city },
                travelDetails: { travelDate: r.date, travelers: r.travelers, tripDuration: r.tripDuration, pickup: r.pickup, destination: r.destination }
            };
            if (onOpenBooking) onOpenBooking({ ...targetBooking, initialTab: 'PREPARATION' });
            else if (onOpenLead) onOpenLead(r);
        } else {
            if (onOpenLead) onOpenLead(r);
        }
    };

    const handleWhatsApp = (e, r) => {
        e.stopPropagation();
        if (!r.mobile) return;
        const clean = r.mobile.replace(/[^0-9]/g, '');
        const phone = clean.length === 10 ? `91${clean}` : clean;
        const msg = encodeURIComponent(`Namaste ${r.name} Ji! Regarding your Varanasi Yatra tour inquiry, how may we assist you with your booking today?`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    return (
        <div className="space-y-5 animate-fadeIn">

            {/* 1. OPERATIONS DASHBOARD HEADER */}
            <div className="bg-stone-900 text-white p-5 rounded-3xl shadow-xl flex flex-wrap justify-between items-center gap-4 border border-stone-800">
                <div>
                    <div className="flex items-center space-x-2.5">
                        <span className="text-2xl">🚩</span>
                        <h1 className="text-xl font-serif font-black tracking-wider text-amber-100">
                            Banaras Yatra · Operations & Dispatch Center
                        </h1>
                        <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                            Manager Workspace
                        </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 font-medium">
                        Daily Operational Dispatches, Quote Pipelines, Booking Execution & Payments
                    </p>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="px-3.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold rounded-xl transition border border-stone-700 flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        title="Reload latest CRM updates"
                    >
                        <span>🔄</span>
                        <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={onAddLead}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
                    >
                        <span>➕</span>
                        <span>Create Offline Lead</span>
                    </button>

                    {onLogout && (
                        <button
                            type="button"
                            onClick={onLogout}
                            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            Log Out
                        </button>
                    )}
                </div>
            </div>

            {/* 2. 5 CORE LIFECYCLE METRIC CARDS (Exact Order: Total Leads, Follow Ups, Upcoming Trips, Pending Payment, Today's Collection) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Leads */}
                <div
                    onClick={() => setStageFilter('LEAD')}
                    className={`bg-white border p-4 rounded-2xl shadow-xs transition cursor-pointer hover:border-amber-400 ${
                        stageFilter === 'LEAD' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-200'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xl">📩</span>
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">All Active</span>
                    </div>
                    <div className="text-2xl font-serif font-black text-stone-900 mt-2">{kpis.totalLeads}</div>
                    <div className="text-xs text-stone-500 font-bold mt-0.5">1. Total Leads</div>
                </div>

                {/* 2. Follow Ups */}
                <div
                    onClick={() => setStageFilter('LEAD')}
                    className={`bg-white border p-4 rounded-2xl shadow-xs transition cursor-pointer hover:border-blue-400 ${
                        stageFilter === 'LEAD' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-stone-200'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xl">⏰</span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Action Due</span>
                    </div>
                    <div className="text-2xl font-serif font-black text-stone-900 mt-2">{kpis.followUps}</div>
                    <div className="text-xs text-stone-500 font-bold mt-0.5">2. Follow Ups</div>
                </div>

                {/* 3. Upcoming Trips */}
                <div
                    onClick={() => setStageFilter('TRIP')}
                    className={`bg-white border p-4 rounded-2xl shadow-xs transition cursor-pointer hover:border-purple-400 ${
                        stageFilter === 'TRIP' ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-stone-200'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xl">🚖</span>
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded">In Pipeline</span>
                    </div>
                    <div className="text-2xl font-serif font-black text-purple-900 mt-2">{kpis.upcomingTrips}</div>
                    <div className="text-xs text-stone-500 font-bold mt-0.5">3. Upcoming Trips</div>
                </div>

                {/* 4. Pending Payment */}
                <div
                    onClick={() => setStageFilter('PAYMENT')}
                    className={`bg-white border p-4 rounded-2xl shadow-xs transition cursor-pointer hover:border-amber-400 ${
                        stageFilter === 'PAYMENT' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-200'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xl">💳</span>
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">Due Balance</span>
                    </div>
                    <div className="text-2xl font-serif font-black text-amber-900 mt-2">{kpis.pendingPayments}</div>
                    <div className="text-xs text-stone-500 font-bold mt-0.5">4. Pending Payment</div>
                </div>

                {/* 5. Today's Collection */}
                <div
                    onClick={() => setStageFilter('PAYMENT')}
                    className={`bg-white border p-4 rounded-2xl shadow-xs transition cursor-pointer hover:border-emerald-400 ${
                        stageFilter === 'PAYMENT' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-stone-200'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-xl">💰</span>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Received</span>
                    </div>
                    <div className="text-2xl font-serif font-black text-emerald-900 mt-2">₹{kpis.todayCollection.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-stone-500 font-bold mt-0.5">5. Today's Collection</div>
                </div>
            </div>

            {/* 3. MANAGER LIFECYCLE STRIP */}
            <div className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-2 border border-stone-800">
                <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest px-2">
                    Manager Lifecycle:
                </span>

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                    {[
                        { key: 'ALL', label: 'ALL RECORDS', icon: '📋' },
                        { key: 'LEAD', label: '1. LEAD', icon: '📩' },
                        { key: 'QUOTE', label: '2. QUOTE', icon: '📜' },
                        { key: 'BOOKING', label: '3. BOOKING', icon: '🔒' },
                        { key: 'PAYMENT', label: '4. PAYMENT', icon: '💳' },
                        { key: 'TRIP', label: '5. TRIP', icon: '🚖' }
                    ].map((stg) => (
                        <button
                            key={stg.key}
                            type="button"
                            onClick={() => setStageFilter(stg.key)}
                            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer ${
                                stageFilter === stg.key
                                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                            }`}
                        >
                            <span>{stg.icon}</span>
                            <span>{stg.label}</span>
                        </button>
                    ))}
                </div>

                <span className="text-[10px] text-stone-400 font-semibold px-2">
                    {filteredRecords.length === enrichedRecords.length
                        ? `Showing all ${enrichedRecords.length} records`
                        : `Showing ${filteredRecords.length} of ${enrichedRecords.length} records`}
                </span>
            </div>

            {/* 4. STAGE-TAILORED CUSTOMER TABLE */}
            <div className="bg-white border border-stone-200 rounded-3xl shadow-xs overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-stone-400 font-bold text-xs animate-pulse">
                        Loading Customer Lifecycle Workspace...
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                        <span className="text-4xl block">🔍</span>
                        <h3 className="text-sm font-bold text-stone-800">No records in this stage</h3>
                        <p className="text-xs text-stone-400">
                            {searchQuery ? `No records matching "${searchQuery}"` : 'No customers currently waiting in this lifecycle stage.'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-2 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                            >
                                Clear Search Filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-stone-700">
                            <thead className="bg-stone-50 border-b border-stone-200/80 text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                                <tr>
                                    <th className="py-3.5 px-4">Customer Details</th>

                                    {/* DYNAMIC COLUMNS BY STAGE */}
                                    {stageFilter === 'LEAD' && (
                                        <>
                                            <th className="py-3.5 px-3">Lead Source</th>
                                            <th className="py-3.5 px-3">Travel Date & Pax</th>
                                            <th className="py-3.5 px-3">Requirements Discussed</th>
                                            <th className="py-3.5 px-3">Follow-up Date</th>
                                        </>
                                    )}

                                    {stageFilter === 'QUOTE' && (
                                        <>
                                            <th className="py-3.5 px-3">Quote # & Amount</th>
                                            <th className="py-3.5 px-3">Services Included</th>
                                            <th className="py-3.5 px-3">Quote Status</th>
                                            <th className="py-3.5 px-3">Sent / Valid Till</th>
                                        </>
                                    )}

                                    {stageFilter === 'BOOKING' && (
                                        <>
                                            <th className="py-3.5 px-3">Booking Ref</th>
                                            <th className="py-3.5 px-3">Trip Dates & Pax</th>
                                            <th className="py-3.5 px-3">Total Package</th>
                                            <th className="py-3.5 px-3">Advance / Remaining Due</th>
                                        </>
                                    )}

                                    {stageFilter === 'PAYMENT' && (
                                        <>
                                            <th className="py-3.5 px-3">Booking Ref</th>
                                            <th className="py-3.5 px-3">Total Package</th>
                                            <th className="py-3.5 px-3">Total Paid</th>
                                            <th className="py-3.5 px-3">Remaining Due</th>
                                            <th className="py-3.5 px-3">Payment Status</th>
                                        </>
                                    )}

                                    {stageFilter === 'TRIP' && (
                                        <>
                                            <th className="py-3.5 px-3">Booking Ref</th>
                                            <th className="py-3.5 px-3">Travel Dates & Route</th>
                                            <th className="py-3.5 px-3">Assigned Vendors</th>
                                            <th className="py-3.5 px-3">Trip Status</th>
                                        </>
                                    )}

                                    {stageFilter === 'ALL' && (
                                        <>
                                            <th className="py-3.5 px-3">Travel Date & Pax</th>
                                            <th className="py-3.5 px-3">Package / Financials</th>
                                            <th className="py-3.5 px-3">Lifecycle Stage</th>
                                        </>
                                    )}

                                    <th className="py-3.5 px-4 text-right">NEXT ACTION</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredRecords.map((r) => {
                                    const sourceClass = r.leadSource === 'QR'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : r.leadSource === 'Offline/Manual'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                                    const reqs = r.requirements || {};
                                    const reqList = Object.keys(reqs).filter(k => reqs[k]);

                                    return (
                                        <tr
                                            key={r._id}
                                            onClick={() => onOpenLead && onOpenLead(r)}
                                            className="hover:bg-amber-50/30 transition cursor-pointer group"
                                        >
                                            {/* 1. Customer Details */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-extrabold text-stone-900 group-hover:text-amber-700 transition">
                                                    {r.name}
                                                </div>
                                                <div className="text-[11px] text-stone-500 font-medium flex items-center space-x-1.5 mt-0.5">
                                                    <span>📞 {r.mobile || 'N/A'}</span>
                                                    {r.mobile && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleWhatsApp(e, r)}
                                                            className="text-emerald-600 hover:text-emerald-700 font-bold text-[10px] ml-1"
                                                            title="Chat on WhatsApp"
                                                        >
                                                            💬 WhatsApp
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* STAGE 1: LEAD COLUMNS */}
                                            {stageFilter === 'LEAD' && (
                                                <>
                                                    <td className="py-3.5 px-3">
                                                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold border ${sourceClass}`}>
                                                            {r.leadSource === 'QR' ? '📱 QR Scan' : r.leadSource === 'Offline/Manual' ? '📞 Offline' : '🌐 Website'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-stone-800">
                                                            {formatSafeDate(r.date, { day: 'numeric', month: 'short' }, 'Flexible Dates')}
                                                        </div>
                                                        <div className="text-[10px] text-stone-500 font-medium">
                                                            👥 {r.travelers || 1} Pax · 📍 {r.destination || 'Varanasi'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        {reqList.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                                {reqList.slice(0, 3).map(rq => (
                                                                    <span key={rq} className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded text-[9px] font-bold uppercase">
                                                                        {rq}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-stone-400 text-[10px] italic">
                                                                {r.specialRequirements ? r.specialRequirements.slice(0, 25) + '...' : 'General Darshan'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-stone-800">
                                                            {formatSafeDate(r.followUpDate, { day: 'numeric', month: 'short' }, 'Not scheduled')}
                                                        </div>
                                                    </td>
                                                </>
                                            )}

                                            {/* STAGE 2: QUOTE COLUMNS */}
                                            {stageFilter === 'QUOTE' && (
                                                <>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-extrabold text-amber-900">
                                                            ₹{(r.latestQuote?.finalCustomerPrice || r.packagePrice || 0).toLocaleString('en-IN')}
                                                        </div>
                                                        <div className="text-[10px] text-stone-400 font-medium">
                                                            Ref: #{r.latestQuote?.quoteNumber || `VY-Q-${r._id.slice(-4)}`} (V{r.latestQuote?.version || 1})
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="text-stone-800 font-bold">
                                                            {r.latestQuote?.packageType || 'Custom Tour'}
                                                        </div>
                                                        <div className="text-[10px] text-stone-500">
                                                            {r.latestQuote?.servicesList?.length || 4} Services Included
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full uppercase">
                                                            {r.latestQuote?.status || 'SENT'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="text-stone-700 font-bold">
                                                            {formatSafeDate(r.latestQuote?.createdAt, { day: 'numeric', month: 'short' }, 'Recent')}
                                                        </div>
                                                    </td>
                                                </>
                                            )}

                                            {/* STAGE 3: BOOKING COLUMNS */}
                                            {stageFilter === 'BOOKING' && (
                                                <>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-extrabold text-emerald-900">
                                                            #{r.matchedBooking?.bookingNumber || `VY-B-${r._id.slice(-4)}`}
                                                        </div>
                                                        <span className="text-[10px] text-stone-400 font-medium">CONFIRMED</span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-stone-800">
                                                            {formatSafeDate(r.date, { day: 'numeric', month: 'short' }, 'Upcoming')}
                                                        </div>
                                                        <div className="text-[10px] text-stone-500 font-medium">
                                                            👥 {r.travelers || 2} Pax · {r.tripDuration || '3 Days'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 font-extrabold text-stone-900">
                                                        ₹{r.packagePrice.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="text-emerald-700 font-bold">Paid: ₹{r.totalPaid.toLocaleString('en-IN')}</div>
                                                        <div className="text-amber-800 font-extrabold text-[10px]">Due: ₹{r.remainingDue.toLocaleString('en-IN')}</div>
                                                    </td>
                                                </>
                                            )}

                                            {/* STAGE 4: PAYMENT COLUMNS */}
                                            {stageFilter === 'PAYMENT' && (
                                                <>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-extrabold text-stone-900">
                                                            #{r.matchedBooking?.bookingNumber || `VY-B-${r._id.slice(-4)}`}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3 font-extrabold text-stone-900">
                                                        ₹{r.packagePrice.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-extrabold text-emerald-700">
                                                        ₹{r.totalPaid.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3.5 px-3 font-extrabold text-amber-800">
                                                        ₹{r.remainingDue.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                            r.paymentStatus === 'PAID'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : r.paymentStatus === 'PARTIAL'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {r.paymentStatus}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            {/* STAGE 5: TRIP COLUMNS */}
                                            {stageFilter === 'TRIP' && (
                                                <>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-extrabold text-purple-900">
                                                            #{r.matchedBooking?.bookingNumber || `VY-B-${r._id.slice(-4)}`}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-stone-800">
                                                            {formatSafeDate(r.date, { day: 'numeric', month: 'short' }, 'Upcoming')}
                                                        </div>
                                                        <div className="text-[10px] text-stone-500 font-medium">
                                                            📍 {r.destination || 'Varanasi'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className="text-stone-700 font-bold">
                                                            {r.matchedBooking?.services?.length || 4} Services Assigned
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                            r.status === 'Trip Started'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : r.status === 'Completed'
                                                                ? 'bg-stone-200 text-stone-800'
                                                                : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {r.status === 'Trip Started' ? 'Started' : r.status === 'Completed' ? 'Completed' : 'Upcoming'}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            {/* ALL RECORDS VIEW */}
                                            {stageFilter === 'ALL' && (
                                                <>
                                                    <td className="py-3.5 px-3">
                                                        <div className="font-bold text-stone-800">
                                                            {formatSafeDate(r.date, { day: 'numeric', month: 'short' }, 'Flexible')}
                                                        </div>
                                                        <div className="text-[10px] text-stone-500 font-medium">
                                                            👥 {r.travelers || 1} Pax · 📍 {r.destination || 'Varanasi'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        {r.packagePrice > 0 ? (
                                                            <div>
                                                                <span className="font-extrabold text-stone-900">₹{r.packagePrice.toLocaleString('en-IN')}</span>
                                                                <span className="text-[10px] text-amber-800 ml-1.5 font-bold">(Due: ₹{r.remainingDue.toLocaleString('en-IN')})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-stone-400 text-[10px] italic">In Discussion</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                            r.stage === 'TRIP'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : r.stage === 'BOOKING'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : r.stage === 'QUOTE'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {r.stage}
                                                        </span>
                                                    </td>
                                                </>
                                            )}

                                            {/* NEXT ACTION BUTTON (MANDATORY & STAGE-ACCURATE) */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end space-x-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleActionClick(r); }}
                                                        className={`px-3 py-1.5 font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer ${r.nextAction.buttonClass}`}
                                                    >
                                                        {r.nextAction.label}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}

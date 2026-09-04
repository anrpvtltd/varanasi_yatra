import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { formatSafeDate } from '../../../utils/dateUtils';
import { KPICard } from '../ui/Card';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/Table';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { SearchInput, TextArea } from '../ui/Input';
import { EmptyState, LoadingState } from '../ui/FeedbackStates';
import RecordPaymentModal from '../shared/RecordPaymentModal';
import PaymentHistoryDrawer from '../shared/PaymentHistoryDrawer';

function formatLastActivity(dateStr) {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    const now = new Date();
    const diffMs = now - d;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return 'Today';
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatRequirementSummary(r) {
    const reqs = r.requirements || {};
    const services = [];
    if (reqs.hotel) services.push('Hotel');
    if (reqs.transport || reqs.car) services.push('Cab');
    if (reqs.darshan) services.push('Darshan');
    if (reqs.boat) services.push('Boat');
    if (reqs.guide) services.push('Guide');
    if (reqs.pandit) services.push('Pandit');
    if (reqs.shopping) services.push('Shopping');
    if (reqs.other) services.push('Custom');

    const paxText = r.travelers ? `${r.travelers} Persons` : (r.travelDetails?.travelers ? `${r.travelDetails.travelers} Persons` : '');

    if (services.length > 0) {
        const servText = services.slice(0, 3).join(' + ') + (services.length > 3 ? ` +${services.length - 3}` : '');
        return paxText ? `${paxText} · ${servText}` : servText;
    }
    if (paxText && (r.destination || r.travelDetails?.destination)) {
        return `${paxText} · ${r.destination || r.travelDetails.destination}`;
    }
    return r.destination || 'General Enquiry';
}

export default function ManagerOperationsCenter({
    token,
    user: _user,
    refreshTrigger,
    onRefresh: _onRefresh,
    onOpenBooking,
    onOpenLead,
    onOpenQuote,
    onAddLead,
    onLogout: _onLogout,
    externalStageFilter,
    externalSearchQuery
}) {
    const [leads, setLeads] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('ALL'); // 'ALL' | 'LEAD' | 'QUOTE' | 'BOOKING' | 'PAYMENT' | 'TRIP'

    // Sub-filters for each stage
    const [leadSubFilter, setLeadSubFilter] = useState('ALL'); // 'ALL' | 'NEW' | 'FOLLOW_UP' | 'HOT' | 'WON' | 'LOST'
    const [bookingSubFilter, setBookingSubFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'UPCOMING' | 'PAYMENT_DUE' | 'PREPARING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    const [paymentSubFilter, setPaymentSubFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID'
    const [tripSubFilter, setTripSubFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'PREPARING' | 'TODAY' | 'IN_PROGRESS' | 'COMPLETED'

    // Direct Modals state
    const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
    const [selectedPaymentHistoryRecord, setSelectedPaymentHistoryRecord] = useState(null);
    const [startTripRecord, setStartTripRecord] = useState(null);
    const [completeTripRecord, setCompleteTripRecord] = useState(null);
    const [completeNotes, setCompleteNotes] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        if (externalStageFilter) {
            setStageFilter(externalStageFilter);
        }
    }, [externalStageFilter]);

    useEffect(() => {
        if (externalSearchQuery !== undefined) {
            setSearchQuery(externalSearchQuery);
        }
    }, [externalSearchQuery]);

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

            // Financial Calculations (Customer-facing only)
            const packagePrice = matchedBooking?.packageDetails?.finalCustomerPrice ||
                matchedBooking?.customerPaymentSummary?.packagePrice ||
                latestQuote?.finalCustomerPrice ||
                Number(l.totalAmount) || 0;

            const totalPaid = (matchedBooking?.customerPaymentSummary?.totalPaid !== undefined && matchedBooking?.customerPaymentSummary?.totalPaid > 0)
                ? matchedBooking.customerPaymentSummary.totalPaid
                : (Number(l.advanceAmount) || Number(l.advancePaid) || 0);

            const remainingDue = (matchedBooking?.customerPaymentSummary?.customerDue !== undefined && packagePrice > 0)
                ? matchedBooking.customerPaymentSummary.customerDue
                : (packagePrice > 0 ? Math.max(0, packagePrice - totalPaid) : Number(l.remainingAmount) || 0);

            const paymentStatus = matchedBooking?.customerPaymentSummary?.paymentStatus ||
                (totalPaid === 0 ? 'UNPAID' : (totalPaid > packagePrice ? 'OVERPAID' : (totalPaid === packagePrice && packagePrice > 0 ? 'PAID' : 'PARTIAL')));

            // Booking & Trip Status
            const bookingStatus = matchedBooking?.bookingStatus ||
                (l.status === 'Trip Started' ? 'TRIP_STARTED' : (l.status === 'Completed' ? 'COMPLETED' : (l.status === 'Confirmed' ? 'CONFIRMED' : 'UPCOMING')));

            // Stage-Aware Next Action Logic
            let nextAction = { label: 'Open', actionKey: 'OPEN_LEAD', variant: 'secondary' };

            if (stage === 'LEAD') {
                const hasDates = !!l.date;
                const hasPax = !!l.travelers;
                const hasDest = !!l.destination;
                if (!hasDates || !hasPax || !hasDest) {
                    nextAction = { label: 'Collect Requirements', actionKey: 'COLLECT_REQ', variant: 'secondary' };
                } else if (l.followUpDate) {
                    nextAction = { label: 'Follow Up', actionKey: 'CALL_CUSTOMER', variant: 'ghost' };
                } else {
                    nextAction = { label: 'Create Quote', actionKey: 'CREATE_QUOTE', variant: 'primary' };
                }
            } else if (stage === 'QUOTE') {
                if (latestQuote?.status === 'DRAFT') {
                    nextAction = { label: 'Send Quote', actionKey: 'SEND_QUOTE', variant: 'primary' };
                } else if (latestQuote?.status === 'SENT' || latestQuote?.status === 'ACCEPTED') {
                    nextAction = { label: 'Confirm Booking', actionKey: 'CONFIRM_BOOKING', variant: 'primary' };
                } else {
                    nextAction = { label: 'Revise Quote', actionKey: 'REVISE_QUOTE', variant: 'secondary' };
                }
            } else if (stage === 'BOOKING') {
                if (totalPaid === 0 || remainingDue > 0) {
                    nextAction = { label: remainingDue > 0 ? `Collect ₹${remainingDue.toLocaleString('en-IN')}` : 'Collect Payment', actionKey: 'COLLECT_PAYMENT', variant: 'primary' };
                } else {
                    nextAction = { label: 'Prepare Trip', actionKey: 'ARRANGE_SERVICES', variant: 'navy' };
                }
            } else if (stage === 'TRIP') {
                if (bookingStatus === 'TRIP_STARTED') {
                    nextAction = { label: 'Complete Trip', actionKey: 'MARK_COMPLETE', variant: 'success' };
                } else if (matchedBooking?.preparationChecklist && matchedBooking.preparationChecklist.length > 0 && matchedBooking.preparationChecklist.every(c => c.status === 'CONFIRMED' || c.status === 'ARRANGED')) {
                    nextAction = { label: 'Start Trip', actionKey: 'START_TRIP', variant: 'primary' };
                } else {
                    nextAction = { label: 'Prepare Trip', actionKey: 'ARRANGE_SERVICES', variant: 'navy' };
                }
            }

            const bookingNumber = matchedBooking?.bookingNumber || `BKG-${l._id?.slice(-4) || '1024'}`;

            return {
                ...l,
                bookingNumber,
                bookingStatus,
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
                const remainingDue = (b.customerPaymentSummary?.customerDue !== undefined && b.customerPaymentSummary?.packagePrice > 0)
                    ? b.customerPaymentSummary.customerDue
                    : Math.max(0, pkgPrice - totalPaid);
                const paymentStatus = b.customerPaymentSummary?.paymentStatus || (totalPaid === 0 ? 'UNPAID' : (totalPaid > pkgPrice ? 'OVERPAID' : (totalPaid === pkgPrice ? 'PAID' : 'PARTIAL')));

                let stage = 'BOOKING';
                if (b.bookingStatus === 'TRIP_STARTED' || b.bookingStatus === 'COMPLETED') stage = 'TRIP';

                let nextAction = { label: 'Collect Payment', actionKey: 'COLLECT_PAYMENT', variant: 'primary' };
                if (stage === 'TRIP') {
                    nextAction = b.bookingStatus === 'TRIP_STARTED' ? { label: 'Complete Trip', actionKey: 'MARK_COMPLETE', variant: 'success' } : { label: 'Start Trip', actionKey: 'START_TRIP', variant: 'primary' };
                } else if (remainingDue === 0) {
                    nextAction = { label: 'Prepare Trip', actionKey: 'ARRANGE_SERVICES', variant: 'navy' };
                }

                records.push({
                    _id: b._id,
                    bookingNumber: b.bookingNumber || `BKG-${b._id?.slice(-4)}`,
                    bookingStatus: b.bookingStatus || 'CONFIRMED',
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

    // 📊 GLOBAL DASHBOARD KPIS (Prompt 1)
    const kpis = useMemo(() => {
        const totalLeads = enrichedRecords.filter(r => r.stage === 'LEAD' && r.status !== 'Cancelled').length;
        const followUps = enrichedRecords.filter(r => (r.followUpDate || r.nextAction?.actionKey === 'CALL_CUSTOMER') && r.status !== 'Cancelled').length;
        const upcomingTrips = enrichedRecords.filter(r => (r.stage === 'TRIP' || (r.stage === 'BOOKING' && r.status === 'Confirmed')) && r.status !== 'Cancelled').length;
        const pendingPayments = enrichedRecords.filter(r => r.remainingDue > 0 && r.status !== 'Cancelled').length;

        const totalPackageRevenue = enrichedRecords.reduce((sum, r) => sum + (Number(r.packagePrice) || 0), 0);
        const totalCollected = enrichedRecords.reduce((sum, r) => sum + (Number(r.totalPaid) || 0), 0);
        const totalOutstandingDue = enrichedRecords.reduce((sum, r) => sum + (Number(r.remainingDue) || 0), 0);

        return {
            totalLeads,
            followUps,
            upcomingTrips,
            pendingPayments,
            totalPackageRevenue,
            totalCollected,
            totalOutstandingDue
        };
    }, [enrichedRecords]);

    // 🏷️ SUB-FILTER COUNTS
    const leadSubCounts = useMemo(() => {
        const list = enrichedRecords.filter(r => r.stage === 'LEAD');
        return {
            ALL: list.length,
            NEW: list.filter(r => r.status === 'New' || !r.status || (!r.followUpDate && r.nextAction?.actionKey === 'COLLECT_REQ')).length,
            FOLLOW_UP: list.filter(r => r.followUpDate || r.status === 'Follow-Up' || r.nextAction?.actionKey === 'CALL_CUSTOMER').length,
            HOT: list.filter(r => r.status === 'Hot' || r.tag === 'Hot' || (r.requirements && Object.keys(r.requirements).length >= 3)).length,
            WON: list.filter(r => r.status === 'Won' || r.status === 'Confirmed').length,
            LOST: list.filter(r => r.status === 'Lost' || r.status === 'Cancelled').length
        };
    }, [enrichedRecords]);

    const bookingSubCounts = useMemo(() => {
        const list = enrichedRecords.filter(r => r.stage === 'BOOKING' || r.matchedBooking);
        return {
            ALL: list.length,
            CONFIRMED: list.filter(r => r.bookingStatus === 'CONFIRMED' || r.status === 'Confirmed').length,
            UPCOMING: list.filter(r => r.bookingStatus === 'UPCOMING' || (r.bookingStatus === 'CONFIRMED' && r.status !== 'Completed')).length,
            PAYMENT_DUE: list.filter(r => r.remainingDue > 0).length,
            PREPARING: list.filter(r => r.bookingStatus === 'PREPARING' || r.nextAction?.actionKey === 'ARRANGE_SERVICES').length,
            IN_PROGRESS: list.filter(r => r.bookingStatus === 'TRIP_STARTED' || r.status === 'Trip Started').length,
            COMPLETED: list.filter(r => r.bookingStatus === 'COMPLETED' || r.status === 'Completed').length,
            CANCELLED: list.filter(r => r.bookingStatus === 'CANCELLED' || r.status === 'Cancelled').length
        };
    }, [enrichedRecords]);

    const paymentSubCounts = useMemo(() => {
        const list = enrichedRecords.filter(r => r.packagePrice > 0 || r.totalPaid > 0);
        return {
            ALL: list.length,
            UNPAID: list.filter(r => r.paymentStatus === 'UNPAID').length,
            PARTIAL: list.filter(r => r.paymentStatus === 'PARTIAL').length,
            PAID: list.filter(r => r.paymentStatus === 'PAID').length,
            OVERPAID: list.filter(r => r.paymentStatus === 'OVERPAID').length
        };
    }, [enrichedRecords]);

    const tripSubCounts = useMemo(() => {
        const list = enrichedRecords.filter(r => r.stage === 'TRIP' || r.matchedBooking || r.status === 'Confirmed');
        const todayStr = new Date().toISOString().split('T')[0];
        return {
            ALL: list.length,
            UPCOMING: list.filter(r => r.bookingStatus !== 'COMPLETED' && r.bookingStatus !== 'CANCELLED' && (!r.date || r.date >= todayStr)).length,
            PREPARING: list.filter(r => r.bookingStatus === 'PREPARING' || r.nextAction?.actionKey === 'ARRANGE_SERVICES').length,
            TODAY: list.filter(r => r.date && r.date.startsWith(todayStr)).length,
            IN_PROGRESS: list.filter(r => r.bookingStatus === 'TRIP_STARTED' || r.status === 'Trip Started').length,
            COMPLETED: list.filter(r => r.bookingStatus === 'COMPLETED' || r.status === 'Completed').length
        };
    }, [enrichedRecords]);

    // 🔍 STAGE-BASED & SEARCH FILTERING
    const filteredRecords = useMemo(() => {
        return enrichedRecords.filter(r => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query ||
                (r.name && r.name.toLowerCase().includes(query)) ||
                (r.mobile && r.mobile.includes(query)) ||
                (r._id && r._id.toLowerCase().includes(query)) ||
                (r.destination && r.destination.toLowerCase().includes(query)) ||
                (r.bookingNumber && r.bookingNumber.toLowerCase().includes(query)) ||
                (r.latestQuote?.quoteNumber && r.latestQuote.quoteNumber.toLowerCase().includes(query));

            if (!matchesSearch) return false;

            if (stageFilter === 'ALL') return true;

            if (stageFilter === 'LEAD') {
                if (r.stage !== 'LEAD') return false;
                if (leadSubFilter === 'ALL') return true;
                if (leadSubFilter === 'NEW') return r.status === 'New' || !r.status || (!r.followUpDate && r.nextAction?.actionKey === 'COLLECT_REQ');
                if (leadSubFilter === 'FOLLOW_UP') return r.followUpDate || r.status === 'Follow-Up' || r.nextAction?.actionKey === 'CALL_CUSTOMER';
                if (leadSubFilter === 'HOT') return r.status === 'Hot' || r.tag === 'Hot' || (r.requirements && Object.keys(r.requirements).length >= 3);
                if (leadSubFilter === 'WON') return r.status === 'Won' || r.status === 'Confirmed';
                if (leadSubFilter === 'LOST') return r.status === 'Lost' || r.status === 'Cancelled';
                return true;
            }

            if (stageFilter === 'QUOTE') return r.stage === 'QUOTE';

            if (stageFilter === 'BOOKING') {
                const isBooking = r.stage === 'BOOKING' || r.matchedBooking;
                if (!isBooking) return false;
                if (bookingSubFilter === 'ALL') return true;
                if (bookingSubFilter === 'CONFIRMED') return r.bookingStatus === 'CONFIRMED' || r.status === 'Confirmed';
                if (bookingSubFilter === 'UPCOMING') return r.bookingStatus === 'UPCOMING' || (r.bookingStatus === 'CONFIRMED' && r.status !== 'Completed');
                if (bookingSubFilter === 'PAYMENT_DUE') return r.remainingDue > 0;
                if (bookingSubFilter === 'PREPARING') return r.bookingStatus === 'PREPARING' || r.nextAction?.actionKey === 'ARRANGE_SERVICES';
                if (bookingSubFilter === 'IN_PROGRESS') return r.bookingStatus === 'TRIP_STARTED' || r.status === 'Trip Started';
                if (bookingSubFilter === 'COMPLETED') return r.bookingStatus === 'COMPLETED' || r.status === 'Completed';
                if (bookingSubFilter === 'CANCELLED') return r.bookingStatus === 'CANCELLED' || r.status === 'Cancelled';
                return true;
            }

            if (stageFilter === 'PAYMENT') {
                const isPayable = r.packagePrice > 0 || r.totalPaid > 0;
                if (!isPayable) return false;
                if (paymentSubFilter === 'ALL') return true;
                if (paymentSubFilter === 'UNPAID') return r.paymentStatus === 'UNPAID';
                if (paymentSubFilter === 'PARTIAL') return r.paymentStatus === 'PARTIAL';
                if (paymentSubFilter === 'PAID') return r.paymentStatus === 'PAID';
                if (paymentSubFilter === 'OVERPAID') return r.paymentStatus === 'OVERPAID';
                return true;
            }

            if (stageFilter === 'TRIP') {
                const isTrip = r.stage === 'TRIP' || r.matchedBooking || r.status === 'Confirmed';
                if (!isTrip) return false;
                const todayStr = new Date().toISOString().split('T')[0];
                if (tripSubFilter === 'ALL') return true;
                if (tripSubFilter === 'UPCOMING') return r.bookingStatus !== 'COMPLETED' && r.bookingStatus !== 'CANCELLED' && (!r.date || r.date >= todayStr);
                if (tripSubFilter === 'PREPARING') return r.bookingStatus === 'PREPARING' || r.nextAction?.actionKey === 'ARRANGE_SERVICES';
                if (tripSubFilter === 'TODAY') return r.date && r.date.startsWith(todayStr);
                if (tripSubFilter === 'IN_PROGRESS') return r.bookingStatus === 'TRIP_STARTED' || r.status === 'Trip Started';
                if (tripSubFilter === 'COMPLETED') return r.bookingStatus === 'COMPLETED' || r.status === 'Completed';
                return true;
            }

            return true;
        });
    }, [enrichedRecords, searchQuery, stageFilter, leadSubFilter, bookingSubFilter, paymentSubFilter, tripSubFilter]);

    // ⚡ ACTION DISPATCHER
    const handleActionClick = (r, specificAction = null) => {
        const actionKey = specificAction || r.nextAction.actionKey;

        if (actionKey === 'CREATE_QUOTE' || actionKey === 'REVISE_QUOTE' || actionKey === 'SEND_QUOTE' || actionKey === 'CONFIRM_BOOKING') {
            if (onOpenQuote) onOpenQuote(r);
            else if (onOpenLead) onOpenLead(r);
        } else if (actionKey === 'COLLECT_REQ' || actionKey === 'CALL_CUSTOMER' || actionKey === 'OPEN_LEAD') {
            if (onOpenLead) onOpenLead(r);
        } else if (actionKey === 'COLLECT_PAYMENT' || actionKey === 'RECORD_PAYMENT') {
            const targetBooking = r.matchedBooking || {
                _id: r.bookingId || r._id,
                leadId: r._id,
                bookingNumber: r.bookingNumber || `VY-B-${r._id?.slice(-4)}`,
                customerDetails: { name: r.name, phone: r.mobile, email: r.email, city: r.city },
                packageDetails: { finalCustomerPrice: r.packagePrice },
                customerPaymentSummary: { packagePrice: r.packagePrice, totalPaid: r.totalPaid, customerDue: r.remainingDue, paymentStatus: r.paymentStatus }
            };
            setSelectedPaymentRecord(targetBooking);
        } else if (actionKey === 'START_TRIP') {
            setStartTripRecord(r);
        } else if (actionKey === 'MARK_COMPLETE' || actionKey === 'COMPLETE_TRIP') {
            setCompleteTripRecord(r);
        } else if (actionKey === 'ARRANGE_SERVICES' || actionKey === 'PREPARE_TRIP') {
            const targetBooking = r.matchedBooking || {
                _id: r.bookingId || r._id,
                leadId: r._id,
                bookingNumber: r.bookingNumber || `VY-B-${r._id?.slice(-4)}`,
                bookingStatus: r.bookingStatus || 'CONFIRMED',
                customerDetails: { name: r.name, phone: r.mobile, email: r.email, city: r.city },
                travelDetails: { travelDate: r.date, travelers: r.travelers, tripDuration: r.tripDuration, destination: r.destination }
            };
            if (onOpenBooking) onOpenBooking({ ...targetBooking, initialTab: 'PREPARATION' });
            else if (onOpenLead) onOpenLead(r);
        } else {
            if (onOpenLead) onOpenLead(r);
        }
    };

    const handleRowClick = (r) => {
        if (stageFilter === 'BOOKING' || stageFilter === 'TRIP' || stageFilter === 'PAYMENT' || r.matchedBooking) {
            const targetBooking = r.matchedBooking || {
                _id: r.bookingId || r._id,
                leadId: r._id,
                bookingNumber: r.bookingNumber || `VY-B-${r._id?.slice(-4)}`,
                bookingStatus: r.bookingStatus || 'CONFIRMED',
                customerDetails: { name: r.name, phone: r.mobile, email: r.email, city: r.city },
                travelDetails: { travelDate: r.date, travelers: r.travelers, tripDuration: r.tripDuration, destination: r.destination },
                packageDetails: { finalCustomerPrice: r.packagePrice },
                customerPaymentSummary: { packagePrice: r.packagePrice, totalPaid: r.totalPaid, customerDue: r.remainingDue, paymentStatus: r.paymentStatus }
            };
            if (onOpenBooking) {
                onOpenBooking(targetBooking);
                return;
            }
        }
        if (onOpenLead) onOpenLead(r);
    };

    const handleWhatsApp = (e, r) => {
        e.stopPropagation();
        if (!r.mobile) return;
        const clean = r.mobile.replace(/[^0-9]/g, '');
        const phone = clean.length === 10 ? `91${clean}` : clean;
        const msg = encodeURIComponent(`Namaste ${r.name} Ji! Regarding your Varanasi Yatra booking, how may we assist you today?`);
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    const handleCall = (e, r) => {
        e.stopPropagation();
        if (!r.mobile) return;
        window.open(`tel:${r.mobile}`, '_self');
    };

    // Lifecycle Status Mutators
    const handleConfirmStartTrip = async () => {
        if (!startTripRecord) return;
        setIsUpdatingStatus(true);
        try {
            const targetId = startTripRecord.matchedBooking?._id || startTripRecord._id;
            const res = await crmApi.updateBookingStatus(token, targetId, 'TRIP_STARTED');
            if (res.success) {
                setStartTripRecord(null);
                loadData();
            } else {
                alert(res.message || 'Failed to start trip.');
            }
        } catch (err) {
            alert(err.message || 'Error updating status.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleConfirmCompleteTrip = async () => {
        if (!completeTripRecord) return;
        setIsUpdatingStatus(true);
        try {
            const targetId = completeTripRecord.matchedBooking?._id || completeTripRecord._id;
            const res = await crmApi.updateBookingStatus(token, targetId, 'COMPLETED');
            if (res.success) {
                setCompleteTripRecord(null);
                setCompleteNotes('');
                loadData();
            } else {
                alert(res.message || 'Failed to complete trip.');
            }
        } catch (err) {
            alert(err.message || 'Error updating status.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Action Center Section 1: SERVICES TO ARRANGE
    const servicesToArrange = useMemo(() => {
        const list = [];
        bookings.forEach((b) => {
            if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'COMPLETED') return;
            const svcs = b.services || b.servicesList || [];
            if (svcs.length > 0) {
                svcs.forEach((s) => {
                    if (s.commercialModel !== 'CUSTOMER_DIRECT' && !s.isAssigned && s.readinessStatus !== 'READY') {
                        list.push({
                            id: `${b._id}_${s._id || s.serviceType || s.name}`,
                            bookingNumber: b.bookingNumber,
                            customerName: b.customerDetails?.name || 'Customer',
                            customerMobile: b.customerDetails?.mobile,
                            serviceType: s.serviceType || s.category || s.name || 'Service',
                            travelDate: b.travelDetails?.travelDate || b.date,
                            status: 'Arrangement Needed',
                            booking: b
                        });
                    }
                });
            } else {
                const reqs = b.requirements || {};
                const checkReq = (key, label) => {
                    if (reqs[key]) {
                        list.push({
                            id: `${b._id}_${key}`,
                            bookingNumber: b.bookingNumber,
                            customerName: b.customerDetails?.name || 'Customer',
                            customerMobile: b.customerDetails?.mobile,
                            serviceType: label,
                            travelDate: b.travelDetails?.travelDate || b.date,
                            status: 'Pending Setup',
                            booking: b
                        });
                    }
                };
                checkReq('hotel', 'Hotel Booking');
                checkReq('transport', 'Cab / Transport');
                checkReq('boat', 'Boat Ride');
                checkReq('guide', 'Certified Guide');
                checkReq('pandit', 'Vedic Pandit');
            }
        });
        return list.slice(0, 8);
    }, [bookings]);

    // Action Center Section 2: CUSTOMER ATTENTION / PENDING ACTION
    const pendingActions = useMemo(() => {
        const list = [];
        // Leads follow up
        leads.forEach((l) => {
            if (l.status === 'FOLLOW_UP' || l.status === 'HOT') {
                list.push({
                    id: `lead_${l._id}`,
                    type: 'LEAD',
                    title: `Follow Up: ${l.name}`,
                    subtitle: `Enquiry for ${l.destination || 'Varanasi'} · ${l.mobile || ''}`,
                    badge: l.status === 'HOT' ? '🔥 Hot Lead' : 'Follow Up Due',
                    badgeVariant: l.status === 'HOT' ? 'danger' : 'warning',
                    actionLabel: 'Open Lead',
                    onAction: () => onOpenLead && onOpenLead(l)
                });
            }
        });
        // Quotes sent awaiting response
        quotes.forEach((q) => {
            if (q.status === 'SENT' || q.status === 'DRAFT') {
                list.push({
                    id: `quote_${q._id}`,
                    type: 'QUOTE',
                    title: `Quote Sent: ${q.quoteNumber}`,
                    subtitle: `${q.customerDetails?.name || 'Customer'} · ₹${(q.packageDetails?.finalCustomerPrice || 0).toLocaleString('en-IN')}`,
                    badge: q.status === 'SENT' ? 'Awaiting Acceptance' : 'Draft Proposal',
                    badgeVariant: 'neutral',
                    actionLabel: 'View Quote',
                    onAction: () => onOpenQuote && onOpenQuote(q)
                });
            }
        });
        // Payments due
        bookings.forEach((b) => {
            const due = b.customerPaymentSummary?.customerDue ?? 0;
            if (due > 0 && b.bookingStatus !== 'CANCELLED') {
                list.push({
                    id: `pay_${b._id}`,
                    type: 'PAYMENT',
                    title: `Balance Due: ₹${due.toLocaleString('en-IN')}`,
                    subtitle: `${b.customerDetails?.name || 'Customer'} (${b.bookingNumber})`,
                    badge: 'Payment Due',
                    badgeVariant: 'warning',
                    actionLabel: 'Record Payment',
                    onAction: () => {
                        const matchedRecord = enrichedRecords.find((r) => r.matchedBooking?._id === b._id || r._id === b._id);
                        if (matchedRecord) setSelectedPaymentRecord(matchedRecord);
                        else if (onOpenBooking) onOpenBooking(b);
                    }
                });
            }
        });
        return list.slice(0, 8);
    }, [leads, quotes, bookings, enrichedRecords, onOpenLead, onOpenQuote, onOpenBooking]);

    // Action Center Section 3: UPCOMING TRIPS / IMMEDIATE OPERATIONS
    const upcomingTripsList = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return bookings
            .filter((b) => {
                if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'COMPLETED') return false;
                const dStr = b.travelDetails?.travelDate;
                if (!dStr) return true;
                const tDate = new Date(dStr);
                return isNaN(tDate.getTime()) || tDate >= today;
            })
            .sort((a, b) => {
                const da = new Date(a.travelDetails?.travelDate || 0).getTime();
                const db = new Date(b.travelDetails?.travelDate || 0).getTime();
                return da - db;
            })
            .slice(0, 6);
    }, [bookings]);

    return (
        <div className="space-y-6 select-none animate-fadeIn text-left">

            {/* 1. OPERATIONS DASHBOARD KPI CARDS (Displayed in ALL mode) */}
            {stageFilter === 'ALL' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        <KPICard
                            title="Total Leads"
                            value={kpis.totalLeads}
                            icon={<span>📩</span>}
                            badge="All Active"
                            badgeVariant="primary"
                            onClick={() => setStageFilter('LEAD')}
                        />
                        <KPICard
                            title="Follow Ups"
                            value={kpis.followUps}
                            icon={<span>⏰</span>}
                            badge="Action Due"
                            badgeVariant="warning"
                            onClick={() => setStageFilter('LEAD')}
                        />
                        <KPICard
                            title="Upcoming Trips"
                            value={kpis.upcomingTrips}
                            icon={<span>🚖</span>}
                            badge="In Pipeline"
                            badgeVariant="neutral"
                            onClick={() => setStageFilter('TRIP')}
                        />
                        <KPICard
                            title="Pending Payment"
                            value={kpis.pendingPayments}
                            icon={<span>💳</span>}
                            badge="Due Balance"
                            badgeVariant="danger"
                            onClick={() => setStageFilter('PAYMENT')}
                        />
                        <KPICard
                            title="Total Collected"
                            value={`₹${kpis.totalCollected.toLocaleString('en-IN')}`}
                            icon={<span>💰</span>}
                            badge="Received"
                            badgeVariant="success"
                            onClick={() => setStageFilter('PAYMENT')}
                        />
                    </div>

                    {/* ACTION CENTER CONTENT */}
                    <div className="space-y-6 pt-2">
                        {/* ACTION CENTER SECTION 1: SERVICES TO ARRANGE */}
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <span>🛎️</span>
                                        <span>Services To Arrange</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                            {servicesToArrange.length} Pending
                                        </span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Booked customer journeys awaiting vendor allocation (hotel, cab, boat, guide, pandit)
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={loadData}
                                    loading={loading}
                                    icon={<span>🔄</span>}
                                >
                                    Refresh Operations
                                </Button>
                            </div>

                            {servicesToArrange.length === 0 ? (
                                <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-medium">
                                    ✨ All booked customer services are currently allocated and confirmed. No pending vendor actions.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {servicesToArrange.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-slate-50/70 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition group"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                        {item.bookingNumber}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                                    {item.customerName}
                                                </h4>
                                                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                                    <span className="text-blue-600">📌</span>
                                                    <span>{item.serviceType}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">
                                                    Travel: {formatSafeDate(item.travelDate, { month: 'short', day: 'numeric' }, 'Dates Flexible')}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="primary"
                                                className="w-full text-xs font-semibold"
                                                onClick={() => onOpenBooking && onOpenBooking(item.booking)}
                                            >
                                                Arrange Service →
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2-COLUMN GRID: CUSTOMER ATTENTION & UPCOMING TRIPS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* ACTION CENTER SECTION 2: CUSTOMER ATTENTION / PENDING ACTION */}
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <span>⚡</span>
                                            <span>Customer Attention &amp; Follow-ups</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Urgent enquiries, quote proposals, and overdue collections</p>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                        {pendingActions.length} Items
                                    </span>
                                </div>

                                {pendingActions.length === 0 ? (
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                        No pending customer follow-ups or overdue balances at this moment.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {pendingActions.map((act) => (
                                            <div
                                                key={act.id}
                                                className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                                            >
                                                <div className="space-y-0.5 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-xs text-slate-900 truncate">{act.title}</span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                            act.badgeVariant === 'danger' ? 'bg-rose-100 text-rose-800' :
                                                            act.badgeVariant === 'warning' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-slate-200 text-slate-800'
                                                        }`}>
                                                            {act.badge}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 truncate">{act.subtitle}</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    className="text-xs font-semibold shrink-0"
                                                    onClick={act.onAction}
                                                >
                                                    {act.actionLabel}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ACTION CENTER SECTION 3: UPCOMING TRIPS / IMMEDIATE OPERATIONS */}
                            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <span>🚖</span>
                                            <span>Upcoming Trips &amp; Operations</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Departing traveler groups in the immediate departure window</p>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        {upcomingTripsList.length} Departures
                                    </span>
                                </div>

                                {upcomingTripsList.length === 0 ? (
                                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                        No upcoming trips scheduled in the near-term timeline.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {upcomingTripsList.map((bkg) => {
                                            const dateFormatted = formatSafeDate(bkg.travelDetails?.travelDate || bkg.date, { month: 'short', day: 'numeric', year: 'numeric' }, 'Dates Flexible');
                                            const pax = bkg.travelDetails?.travelers || bkg.requirements?.pax || '2';
                                            return (
                                                <div
                                                    key={bkg._id}
                                                    className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                                                >
                                                    <div className="space-y-0.5 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-xs text-slate-900 truncate">
                                                                {bkg.customerDetails?.name || 'Traveler'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-500 bg-white px-1 py-0.2 rounded border border-slate-200">
                                                                {bkg.bookingNumber}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 truncate">
                                                            📅 {dateFormatted} · 👥 {pax} Guests · 📍 {bkg.travelDetails?.destination || 'Varanasi'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            className="text-xs font-semibold"
                                                            onClick={() => onOpenBooking && onOpenBooking(bkg)}
                                                        >
                                                            View Booking
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. SPECIFIC LEADS VIEW HEADER & SUB-FILTERS (Prompt 2) */}
            {stageFilter === 'LEAD' && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Leads</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Manage customer enquiries and move them toward confirmed quotes</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-64">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search customer, mobile, booking ID..."
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        {[
                            { id: 'ALL', label: 'All Leads', count: leadSubCounts.ALL },
                            { id: 'NEW', label: 'New', count: leadSubCounts.NEW },
                            { id: 'FOLLOW_UP', label: 'Follow Up', count: leadSubCounts.FOLLOW_UP },
                            { id: 'HOT', label: '🔥 Hot', count: leadSubCounts.HOT },
                            { id: 'WON', label: 'Won', count: leadSubCounts.WON },
                            { id: 'LOST', label: 'Lost', count: leadSubCounts.LOST }
                        ].map((sub) => {
                            const isSubActive = leadSubFilter === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setLeadSubFilter(sub.id)}
                                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                                        isSubActive
                                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 font-medium'
                                    }`}
                                >
                                    <span>{sub.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        isSubActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {sub.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. MANAGER BOOKING WORKSPACE (Prompt 3 Sections 1 & 2) */}
            {stageFilter === 'BOOKING' && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Bookings</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Manage confirmed customer trips and service execution</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="w-64">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search customer, mobile, booking ID..."
                                    size="sm"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={onAddLead}
                                icon={<span>➕</span>}
                            >
                                + New Booking
                            </Button>
                        </div>
                    </div>

                    {/* Filter Tabs: All, Confirmed, Upcoming, Payment Due, Preparing, In Progress, Completed, Cancelled */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        {[
                            { id: 'ALL', label: 'All', count: bookingSubCounts.ALL },
                            { id: 'CONFIRMED', label: 'Confirmed', count: bookingSubCounts.CONFIRMED },
                            { id: 'UPCOMING', label: 'Upcoming', count: bookingSubCounts.UPCOMING },
                            { id: 'PAYMENT_DUE', label: 'Payment Due', count: bookingSubCounts.PAYMENT_DUE },
                            { id: 'PREPARING', label: 'Preparing', count: bookingSubCounts.PREPARING },
                            { id: 'IN_PROGRESS', label: 'In Progress', count: bookingSubCounts.IN_PROGRESS },
                            { id: 'COMPLETED', label: 'Completed', count: bookingSubCounts.COMPLETED },
                            { id: 'CANCELLED', label: 'Cancelled', count: bookingSubCounts.CANCELLED }
                        ].map((sub) => {
                            const isSubActive = bookingSubFilter === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setBookingSubFilter(sub.id)}
                                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                                        isSubActive
                                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 font-medium'
                                    }`}
                                >
                                    <span>{sub.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        isSubActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {sub.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. PAYMENT WORKSPACE (Prompt 3 Sections 5 & 6) */}
            {stageFilter === 'PAYMENT' && (
                <div className="space-y-4">
                    {/* Header */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 tracking-tight">Payments</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Track customer collections and outstanding dues</p>
                            </div>

                            <div className="w-64">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search customer, mobile, booking ID..."
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* Payment Summary Cards (Prompt 3 Section 6) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-left">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Package Price</span>
                                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                                    ₹{kpis.totalPackageRevenue.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Total Confirmed Value</span>
                            </div>

                            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 text-left">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Received Collections</span>
                                <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                                    ₹{kpis.totalCollected.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-emerald-600 block mt-0.5">Cash & Digital Inflow</span>
                            </div>

                            {/* DOMINANT OUTSTANDING DUE CARD (Prompt 3 Section 6) */}
                            <div className="bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/50 rounded-xl p-3 text-left shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Remaining Due</span>
                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-600 text-white">COLLECT</span>
                                </div>
                                <span className="text-xl font-black text-amber-900 mt-0.5 block">
                                    ₹{kpis.totalOutstandingDue.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] font-bold text-amber-800 block mt-0.5">
                                    {paymentSubCounts.PARTIAL + paymentSubCounts.UNPAID} Pending Dues
                                </span>
                            </div>

                            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3 text-left">
                                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Fully Paid Trips</span>
                                <span className="text-base font-extrabold text-blue-800 mt-0.5 block">
                                    {paymentSubCounts.PAID} Bookings
                                </span>
                                <span className="text-[10px] text-blue-600 block mt-0.5">100% Cleared Accounts</span>
                            </div>
                        </div>

                        {/* Filter Tabs: All, Unpaid, Partial, Paid, Overpaid */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                            {[
                                { id: 'ALL', label: 'All', count: paymentSubCounts.ALL },
                                { id: 'UNPAID', label: 'Unpaid', count: paymentSubCounts.UNPAID },
                                { id: 'PARTIAL', label: 'Partial', count: paymentSubCounts.PARTIAL },
                                { id: 'PAID', label: 'Paid', count: paymentSubCounts.PAID },
                                { id: 'OVERPAID', label: 'Overpaid', count: paymentSubCounts.OVERPAID }
                            ].map((sub) => {
                                const isSubActive = paymentSubFilter === sub.id;
                                return (
                                    <button
                                        key={sub.id}
                                        type="button"
                                        onClick={() => setPaymentSubFilter(sub.id)}
                                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                                            isSubActive
                                                ? 'bg-slate-900 text-white font-bold shadow-xs'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 font-medium'
                                        }`}
                                    >
                                        <span>{sub.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                            isSubActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                            {sub.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 5. TRIP OPERATIONS WORKSPACE (Prompt 3 Section 10) */}
            {stageFilter === 'TRIP' && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Trips</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Prepare, start and complete customer journeys</p>
                        </div>

                        <div className="w-64">
                            <SearchInput
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search customer, mobile, booking ID..."
                                size="sm"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs: All, Upcoming, Preparing, Today, In Progress, Completed */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        {[
                            { id: 'ALL', label: 'All', count: tripSubCounts.ALL },
                            { id: 'UPCOMING', label: 'Upcoming', count: tripSubCounts.UPCOMING },
                            { id: 'PREPARING', label: 'Preparing', count: tripSubCounts.PREPARING },
                            { id: 'TODAY', label: 'Today', count: tripSubCounts.TODAY },
                            { id: 'IN_PROGRESS', label: 'In Progress', count: tripSubCounts.IN_PROGRESS },
                            { id: 'COMPLETED', label: 'Completed', count: tripSubCounts.COMPLETED }
                        ].map((sub) => {
                            const isSubActive = tripSubFilter === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => setTripSubFilter(sub.id)}
                                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                                        isSubActive
                                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 font-medium'
                                    }`}
                                >
                                    <span>{sub.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        isSubActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                        {sub.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 6. DENSE-BUT-READABLE SAAS TABLES (Rendered for specific workspaces) */}
            {stageFilter !== 'ALL' && (
                <TableContainer>
                {loading ? (
                    <LoadingState message="Loading Operations Workspace..." />
                ) : filteredRecords.length === 0 ? (
                    <EmptyState
                        title={
                            stageFilter === 'PAYMENT' ? 'No outstanding payments' :
                            stageFilter === 'TRIP' ? 'No scheduled trips' :
                            stageFilter === 'BOOKING' ? 'No bookings found' :
                            'No matching records'
                        }
                        message={
                            searchQuery ? `No records matching "${searchQuery}". Try another name or number.` :
                            stageFilter === 'PAYMENT' ? 'All customer collections are currently up to date.' :
                            stageFilter === 'TRIP' ? 'There are no trips scheduled for this filter period.' :
                            stageFilter === 'BOOKING' ? 'Confirmed customer trips will appear here.' :
                            'No enquiries found in this category.'
                        }
                        actionLabel={stageFilter === 'LEAD' ? '+ Add Lead' : undefined}
                        onAction={stageFilter === 'LEAD' ? onAddLead : undefined}
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            {stageFilter === 'BOOKING' ? (
                                /* PROMPT 3 SECTION 2: BOOKING TABLE COLUMNS */
                                <TableRow>
                                    <TableHead className="w-56">Customer</TableHead>
                                    <TableHead className="w-48">Trip</TableHead>
                                    <TableHead className="w-32">Booking</TableHead>
                                    <TableHead className="w-28">Package</TableHead>
                                    <TableHead className="w-44">Payment</TableHead>
                                    <TableHead className="w-32">Trip Status</TableHead>
                                    <TableHead className="w-36 text-right">Next Action</TableHead>
                                </TableRow>
                            ) : stageFilter === 'PAYMENT' ? (
                                /* PROMPT 3 SECTION 5: PAYMENT TABLE COLUMNS */
                                <TableRow>
                                    <TableHead className="w-56">Customer</TableHead>
                                    <TableHead className="w-32">Booking</TableHead>
                                    <TableHead className="w-28">Package</TableHead>
                                    <TableHead className="w-28">Received</TableHead>
                                    <TableHead className="w-32">Due</TableHead>
                                    <TableHead className="w-28">Status</TableHead>
                                    <TableHead className="w-28">Last Payment</TableHead>
                                    <TableHead className="w-36 text-right">Action</TableHead>
                                </TableRow>
                            ) : stageFilter === 'TRIP' ? (
                                /* PROMPT 3 SECTION 10: TRIP TABLE COLUMNS */
                                <TableRow>
                                    <TableHead className="w-52">Customer</TableHead>
                                    <TableHead className="w-44">Dates</TableHead>
                                    <TableHead className="w-24">Guests</TableHead>
                                    <TableHead className="w-40">Route</TableHead>
                                    <TableHead>Services</TableHead>
                                    <TableHead className="w-28">Trip Status</TableHead>
                                    <TableHead className="w-36 text-right">Next Action</TableHead>
                                </TableRow>
                            ) : (
                                /* DEFAULT / LEAD TABLE COLUMNS */
                                <TableRow>
                                    <TableHead className="w-60">Customer</TableHead>
                                    <TableHead className="w-44">Contact</TableHead>
                                    <TableHead className="w-44">Travel</TableHead>
                                    <TableHead>Requirement</TableHead>
                                    <TableHead className="w-28">Status</TableHead>
                                    <TableHead className="w-28">Last Activity</TableHead>
                                    <TableHead className="w-36 text-right">Next Action</TableHead>
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {filteredRecords.map((r) => {
                                const lastAct = formatLastActivity(r.updatedAt || r.createdAt);
                                const reqSummary = formatRequirementSummary(r);
                                const travelDateFormatted = formatSafeDate(r.date, { day: 'numeric', month: 'short' }, 'Dates Flexible');

                                return (
                                    <TableRow
                                        key={r._id}
                                        onClick={() => handleRowClick(r)}
                                        className="hover:bg-blue-50/40 group cursor-pointer"
                                    >
                                        {/* ======================= CASE A: BOOKING TABLE ROW ======================= */}
                                        {stageFilter === 'BOOKING' ? (
                                            <>
                                                {/* 1. Customer */}
                                                <TableCell>
                                                    <div className="flex items-center space-x-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                                                            {(r.name || 'C')[0].toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition">
                                                                {r.name}
                                                            </span>
                                                            <div className="flex items-center space-x-2 mt-0.5">
                                                                <span className="text-[11px] text-slate-400 font-mono">
                                                                    {r.mobile || '—'}
                                                                </span>
                                                                {r.mobile && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleWhatsApp(e, r)}
                                                                        className="text-[10px] font-bold text-emerald-600 hover:underline"
                                                                    >
                                                                        WA
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* 2. Trip */}
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <span className="font-semibold text-slate-800 block text-xs">
                                                            {r.travelers || 4} Guests · {travelDateFormatted}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 block truncate">
                                                            {r.tripDuration || '3 Nights'} · {r.destination || 'Varanasi'}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* 3. Booking */}
                                                <TableCell>
                                                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {r.bookingNumber}
                                                    </span>
                                                </TableCell>

                                                {/* 4. Package */}
                                                <TableCell>
                                                    <span className="font-bold text-slate-900 text-xs">
                                                        ₹{r.packagePrice.toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>

                                                {/* 5. Payment (Paid & Due with strong visual contrast) */}
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center space-x-1 text-xs">
                                                            <span className="text-emerald-700 font-bold">
                                                                ₹{r.totalPaid.toLocaleString('en-IN')} Paid
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px]">
                                                            {r.remainingDue > 0 ? (
                                                                <span className="text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                                    ₹{r.remainingDue.toLocaleString('en-IN')} Due
                                                                </span>
                                                            ) : (
                                                                <span className="text-emerald-600 font-semibold">
                                                                    ✓ Fully Paid
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* 6. Trip Status */}
                                                <TableCell>
                                                    <StatusBadge status={r.bookingStatus || 'CONFIRMED'} entity="BOOKING" size="sm" />
                                                </TableCell>

                                                {/* 7. Next Action */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={r.nextAction.variant || 'primary'}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActionClick(r);
                                                            }}
                                                            className="shadow-2xs text-xs font-semibold whitespace-nowrap"
                                                        >
                                                            {r.nextAction.label}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : stageFilter === 'PAYMENT' ? (
                                            /* ======================= CASE B: PAYMENT TABLE ROW ======================= */
                                            <>
                                                {/* 1. Customer */}
                                                <TableCell>
                                                    <div className="flex items-center space-x-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                                                            {(r.name || 'C')[0].toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition">
                                                                {r.name}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono block">
                                                                {r.mobile || '—'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* 2. Booking */}
                                                <TableCell>
                                                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                        {r.bookingNumber}
                                                    </span>
                                                </TableCell>

                                                {/* 3. Package */}
                                                <TableCell>
                                                    <span className="font-semibold text-slate-700 text-xs">
                                                        ₹{r.packagePrice.toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>

                                                {/* 4. Received */}
                                                <TableCell>
                                                    <span className="font-bold text-emerald-700 text-xs">
                                                        ₹{r.totalPaid.toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>

                                                {/* 5. Due (Visual Alert) */}
                                                <TableCell>
                                                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full inline-block ${
                                                        r.remainingDue > 0
                                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        ₹{r.remainingDue.toLocaleString('en-IN')}
                                                    </span>
                                                </TableCell>

                                                {/* 6. Status */}
                                                <TableCell>
                                                    <StatusBadge status={r.paymentStatus} entity="PAYMENT" size="sm" />
                                                </TableCell>

                                                {/* 7. Last Payment */}
                                                <TableCell>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {lastAct}
                                                    </span>
                                                </TableCell>

                                                {/* 8. Action: Record Payment & Payment History */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPaymentHistoryRecord(r);
                                                            }}
                                                            className="text-xs font-medium whitespace-nowrap"
                                                        >
                                                            Payment History
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPaymentRecord(r);
                                                            }}
                                                            icon={<span>💳</span>}
                                                            className="shadow-2xs text-xs font-semibold whitespace-nowrap"
                                                        >
                                                            Record Payment
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : stageFilter === 'TRIP' ? (
                                            /* ======================= CASE C: TRIP TABLE ROW ======================= */
                                            <>
                                                {/* 1. Customer */}
                                                <TableCell>
                                                    <div className="flex items-center space-x-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                                                            {(r.name || 'C')[0].toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition">
                                                                {r.name}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 block truncate">
                                                                {r.city || 'Varanasi'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* 2. Dates */}
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <span className="font-bold text-slate-800 block text-xs">
                                                            {travelDateFormatted}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 block">
                                                            {r.tripDuration || '3 Nights'}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* 3. Guests */}
                                                <TableCell>
                                                    <span className="text-xs font-semibold text-slate-700">
                                                        {r.travelers || 4} Guests
                                                    </span>
                                                </TableCell>

                                                {/* 4. Route */}
                                                <TableCell>
                                                    <span className="text-xs font-medium text-slate-700 truncate block">
                                                        {r.destination || 'Varanasi + Sarnath'}
                                                    </span>
                                                </TableCell>

                                                {/* 5. Services Chips */}
                                                <TableCell>
                                                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">Hotel ✓</span>
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">Cab ✓</span>
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">Boat ○</span>
                                                        <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">Darshan ✓</span>
                                                    </div>
                                                </TableCell>

                                                {/* 6. Trip Status */}
                                                <TableCell>
                                                    <StatusBadge status={r.bookingStatus || 'UPCOMING'} entity="BOOKING" size="sm" />
                                                </TableCell>

                                                {/* 7. Next Action */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={r.nextAction.variant || 'navy'}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActionClick(r);
                                                            }}
                                                            className="shadow-2xs text-xs font-semibold whitespace-nowrap"
                                                        >
                                                            {r.nextAction.label}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        ) : (
                                            /* ======================= CASE D: DEFAULT / LEAD ROW ======================= */
                                            <>
                                                {/* 1. Customer */}
                                                <TableCell>
                                                    <div className="flex items-center space-x-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                                                            {(r.name || 'C')[0].toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="font-bold text-slate-900 block truncate group-hover:text-blue-600 transition">
                                                                {r.name}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 block truncate">
                                                                {r.city || r.destination || 'Varanasi'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* 2. Contact */}
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <span className="font-mono text-xs font-semibold text-slate-700 block">
                                                            {r.mobile || '—'}
                                                        </span>
                                                        <div className="flex items-center space-x-2">
                                                            {r.mobile && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleWhatsApp(e, r)}
                                                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-0.5 cursor-pointer"
                                                                >
                                                                    <span>💬</span>
                                                                    <span>WhatsApp</span>
                                                                </button>
                                                            )}
                                                            {r.mobile && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleCall(e, r)}
                                                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline flex items-center space-x-0.5 cursor-pointer"
                                                                >
                                                                    <span>📞</span>
                                                                    <span>Call</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* 3. Travel */}
                                                <TableCell>
                                                    <div className="space-y-0.5">
                                                        <span className="font-semibold text-slate-800 block text-xs">
                                                            {travelDateFormatted}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 block">
                                                            {r.travelers || 1} Guests · {r.tripDuration || '3 Days'}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* 4. Requirement */}
                                                <TableCell>
                                                    <div className="max-w-md truncate">
                                                        <span className="text-xs font-medium text-slate-700 block truncate" title={reqSummary}>
                                                            {reqSummary}
                                                        </span>
                                                        {r.packagePrice > 0 && (
                                                            <span className="text-[11px] text-blue-600 font-bold block mt-0.5">
                                                                Quote: ₹{r.packagePrice.toLocaleString('en-IN')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>

                                                {/* 5. Status */}
                                                <TableCell>
                                                    <StatusBadge status={r.status || 'NEW'} entity={r.stage === 'LEAD' ? 'LEAD' : r.stage} size="sm" />
                                                </TableCell>

                                                {/* 6. Last Activity */}
                                                <TableCell>
                                                    <span className="text-xs font-medium text-slate-500">
                                                        {lastAct}
                                                    </span>
                                                </TableCell>

                                                {/* 7. Next Action */}
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant={r.nextAction.variant || 'primary'}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActionClick(r);
                                                            }}
                                                            className="shadow-2xs text-xs font-semibold whitespace-nowrap"
                                                        >
                                                            {r.nextAction.label}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>
            )}

            {/* RECORD PAYMENT MODAL TRIGGERED FROM PAYMENTS OR BOOKING ROW */}
            <RecordPaymentModal
                isOpen={!!selectedPaymentRecord}
                onClose={() => setSelectedPaymentRecord(null)}
                booking={selectedPaymentRecord}
                token={token}
                onPaymentRecorded={() => {
                    setSelectedPaymentRecord(null);
                    loadData();
                }}
            />

            {/* START TRIP CONFIRMATION MODAL */}
            <Modal
                isOpen={!!startTripRecord}
                onClose={() => setStartTripRecord(null)}
                title="Start Trip?"
                subtitle={`Customer: ${startTripRecord?.name} · ${startTripRecord?.travelers || 4} Guests`}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setStartTripRecord(null)}
                            disabled={isUpdatingStatus}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            loading={isUpdatingStatus}
                            onClick={handleConfirmStartTrip}
                            icon={<span>🚀</span>}
                        >
                            Start Trip
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">
                        This will mark the journey as active and notify operational coordinators.
                    </p>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                        <p><strong>Customer:</strong> {startTripRecord?.name}</p>
                        <p><strong>Travel Date:</strong> {startTripRecord?.date || 'Today'}</p>
                        <p><strong>Route:</strong> {startTripRecord?.destination || 'Varanasi'}</p>
                    </div>
                </div>
            </Modal>

            {/* COMPLETE TRIP CONFIRMATION MODAL */}
            <Modal
                isOpen={!!completeTripRecord}
                onClose={() => setCompleteTripRecord(null)}
                title="Complete Trip"
                subtitle={`Booking #${completeTripRecord?.bookingNumber || 'BKG'} · ${completeTripRecord?.name}`}
                maxWidth="max-w-md"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setCompleteTripRecord(null)}
                            disabled={isUpdatingStatus}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            loading={isUpdatingStatus}
                            onClick={handleConfirmCompleteTrip}
                            icon={<span>🏁</span>}
                        >
                            Complete Trip
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">
                        Mark this journey as completed. Outstanding reviews and post-trip feedback will be logged.
                    </p>
                    <TextArea
                        label="Trip Completion Notes"
                        rows={3}
                        value={completeNotes}
                        onChange={(e) => setCompleteNotes(e.target.value)}
                        placeholder="e.g. Tour completed successfully with positive darshan feedback."
                    />
                </div>
            </Modal>

            {/* PAYMENT HISTORY DRAWER */}
            <PaymentHistoryDrawer
                isOpen={!!selectedPaymentHistoryRecord}
                onClose={() => setSelectedPaymentHistoryRecord(null)}
                record={selectedPaymentHistoryRecord}
                token={token}
                onRecordPayment={(rec) => {
                    setSelectedPaymentHistoryRecord(null);
                    setSelectedPaymentRecord(rec);
                }}
            />

            {/* SINGLE PRIMARY STICKY ADD LEAD BUTTON (Visible in Lead Workspace) */}
            {stageFilter === 'LEAD' && (
                <button
                    type="button"
                    onClick={onAddLead}
                    className="fixed bottom-6 right-6 z-30 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm transition-all transform hover:scale-105 cursor-pointer border border-blue-500/30"
                >
                    <span className="text-base">➕</span>
                    <span>Add Lead</span>
                </button>
            )}

        </div>
    );
}

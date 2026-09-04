import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';
import { TableContainer, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableEmpty } from '../ui/Table';
import StatusBadge, { Badge } from '../ui/StatusBadge';
import Button from '../ui/Button';
import { SearchInput } from '../ui/Input';
import CEOBookingDrawer from './CEOBookingDrawer';

const STAGE_FILTERS = [
    { id: 'ALL', label: 'All' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'PAYMENT_DUE', label: 'Payment Due' },
    { id: 'PREPARING', label: 'Preparing' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' }
];

export default function CEOBookingWorkspace({
    token,
    user,
    refreshTrigger,
    onRefresh
}) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadBookings = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await crmApi.fetchBookings(token);
            if (res.success && res.bookings) {
                setBookings(res.bookings);
            }
        } catch (err) {
            console.error('Failed to load CEO bookings:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings, refreshTrigger]);

    // Filtering logic
    const filteredBookings = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return bookings.filter((b) => {
            // Search Query: Customer, Mobile, Booking ID
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const bNum = (b.bookingNumber || '').toLowerCase();
                const cName = (b.customerDetails?.name || '').toLowerCase();
                const cPhone = (b.customerDetails?.phone || b.customerDetails?.mobile || '').toLowerCase();
                const match = bNum.includes(q) || cName.includes(q) || cPhone.includes(q);
                if (!match) return false;
            }

            // Stage Filter
            if (activeFilter === 'ALL') return true;
            if (activeFilter === 'CONFIRMED') return b.bookingStatus === 'CONFIRMED';
            if (activeFilter === 'PREPARING') return b.bookingStatus === 'PREPARING';
            if (activeFilter === 'IN_PROGRESS') return b.bookingStatus === 'IN_PROGRESS' || b.bookingStatus === 'TRIP_STARTED';
            if (activeFilter === 'COMPLETED') return b.bookingStatus === 'COMPLETED';
            if (activeFilter === 'CANCELLED') return b.bookingStatus === 'CANCELLED';

            if (activeFilter === 'PAYMENT_DUE') {
                const due = b.customerPaymentSummary?.customerDue ?? 0;
                return due > 0 && b.bookingStatus !== 'CANCELLED';
            }

            if (activeFilter === 'UPCOMING') {
                if (b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'COMPLETED') return false;
                const tDateStr = b.travelDetails?.travelDate;
                if (!tDateStr) return true;
                const tDate = new Date(tDateStr);
                return !isNaN(tDate.getTime()) && tDate >= today;
            }

            return true;
        });
    }, [bookings, searchQuery, activeFilter]);

    // Counts per tab
    const tabCounts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const counts = {
            ALL: bookings.length,
            CONFIRMED: 0,
            UPCOMING: 0,
            PAYMENT_DUE: 0,
            PREPARING: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            CANCELLED: 0
        };

        bookings.forEach((b) => {
            if (b.bookingStatus === 'CONFIRMED') counts.CONFIRMED++;
            if (b.bookingStatus === 'PREPARING') counts.PREPARING++;
            if (b.bookingStatus === 'IN_PROGRESS' || b.bookingStatus === 'TRIP_STARTED') counts.IN_PROGRESS++;
            if (b.bookingStatus === 'COMPLETED') counts.COMPLETED++;
            if (b.bookingStatus === 'CANCELLED') counts.CANCELLED++;

            const due = b.customerPaymentSummary?.customerDue ?? 0;
            if (due > 0 && b.bookingStatus !== 'CANCELLED') counts.PAYMENT_DUE++;

            if (b.bookingStatus !== 'CANCELLED' && b.bookingStatus !== 'COMPLETED') {
                const tDateStr = b.travelDetails?.travelDate;
                if (!tDateStr || new Date(tDateStr) >= today) counts.UPCOMING++;
            }
        });

        return counts;
    }, [bookings]);

    const handleRowClick = (booking) => {
        setSelectedBooking(booking);
        setIsDrawerOpen(true);
    };

    return (
        <div className="space-y-5">
            {/* WORKSPACE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <span>Bookings</span>
                        <Badge variant="blue">Executive Financial View</Badge>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Monitor confirmed trips, collections and business value
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                            loadBookings();
                            if (onRefresh) onRefresh();
                        }}
                    >
                        🔄 Refresh
                    </Button>
                </div>
            </div>

            {/* STAGE FILTERS BAR */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-gray-200 text-xs font-semibold">
                {STAGE_FILTERS.map((tab) => {
                    const isActive = activeFilter === tab.id;
                    const count = tabCounts[tab.id] || 0;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                                isActive
                                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isActive ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* SEARCH BAR */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-96">
                    <SearchInput
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        placeholder="Search by customer, mobile or booking ID..."
                    />
                </div>
                <div className="text-xs text-gray-500 font-medium ml-auto">
                    Showing <strong className="text-gray-900">{filteredBookings.length}</strong> of {bookings.length} bookings
                </div>
            </div>

            {/* 11-COLUMN CEO FINANCIALS TABLE */}
            <TableContainer>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Trip</TableHead>
                            <TableHead>Booking ID</TableHead>
                            <TableHead align="right">Package Value</TableHead>
                            <TableHead align="right">Collected</TableHead>
                            <TableHead align="right">Customer Due</TableHead>
                            <TableHead align="right">Vendor Cost</TableHead>
                            <TableHead align="right">Vendor Payable</TableHead>
                            <TableHead align="right">Profit</TableHead>
                            <TableHead align="center">Trip Status</TableHead>
                            <TableHead align="center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="py-12 text-center text-xs text-gray-400">
                                    Loading CEO booking inventory and financial metrics...
                                </TableCell>
                            </TableRow>
                        ) : filteredBookings.length === 0 ? (
                            <TableEmpty
                                colSpan={11}
                                message="No bookings found matching the current search or filters."
                            />
                        ) : (
                            filteredBookings.map((b) => {
                                const cust = b.customerDetails || {};
                                const trip = b.travelDetails || {};
                                const pkgPrice = b.customerPaymentSummary?.packagePrice ?? b.packageDetails?.finalCustomerPrice ?? 0;
                                const collected = b.customerPaymentSummary?.totalPaid ?? 0;
                                const due = b.customerPaymentSummary?.customerDue ?? Math.max(0, pkgPrice - collected);

                                // Vendor Costs
                                const vCost = b.vendorPaymentSummary?.plannedVendorCost ?? 0;
                                const vPaid = b.vendorPaymentSummary?.totalPaidToVendors ?? 0;
                                const vPayable = b.vendorPaymentSummary?.vendorDue ?? Math.max(0, vCost - vPaid);

                                // Profit
                                const comm = b.profitSummary?.commissionIncome ?? 0;
                                const profit = pkgPrice - vCost + comm;
                                const marginPct = pkgPrice > 0 ? Math.round((profit / pkgPrice) * 100) : 0;

                                return (
                                    <TableRow
                                        key={b._id}
                                        hover
                                        className="cursor-pointer"
                                        onClick={() => handleRowClick(b)}
                                    >
                                        {/* 1. Customer */}
                                        <TableCell>
                                            <div className="font-semibold text-gray-900">{cust.name || 'Guest'}</div>
                                            <div className="text-[11px] text-gray-500 font-mono">{cust.phone || cust.mobile || 'No phone'}</div>
                                        </TableCell>

                                        {/* 2. Trip */}
                                        <TableCell>
                                            <div className="text-gray-900 font-medium whitespace-nowrap">{trip.travelDate || 'Date TBD'}</div>
                                            <div className="text-[11px] text-gray-500">
                                                {trip.adults || 2} Pax · {trip.durationNights ? `${trip.durationNights}N/${trip.durationDays || trip.durationNights + 1}D` : 'Varanasi'}
                                            </div>
                                        </TableCell>

                                        {/* 3. Booking ID */}
                                        <TableCell>
                                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                {b.bookingNumber}
                                            </span>
                                        </TableCell>

                                        {/* 4. Package Value */}
                                        <TableCell align="right">
                                            <span className="font-bold text-gray-900">
                                                ₹{pkgPrice.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>

                                        {/* 5. Collected */}
                                        <TableCell align="right">
                                            <span className="font-semibold text-emerald-700">
                                                ₹{collected.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>

                                        {/* 6. Customer Due */}
                                        <TableCell align="right">
                                            <span className={`font-bold ${due > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                                                ₹{due.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>

                                        {/* 7. Vendor Cost (CEO ONLY) */}
                                        <TableCell align="right">
                                            <span className="font-semibold text-purple-800">
                                                ₹{vCost.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>

                                        {/* 8. Vendor Payable (CEO ONLY) */}
                                        <TableCell align="right">
                                            <span className={`font-semibold ${vPayable > 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                                                ₹{vPayable.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>

                                        {/* 9. Profit (CEO ONLY) */}
                                        <TableCell align="right">
                                            <div className="font-bold text-emerald-800">
                                                ₹{profit.toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                {marginPct}% margin
                                            </div>
                                        </TableCell>

                                        {/* 10. Trip Status */}
                                        <TableCell align="center">
                                            <StatusBadge status={b.bookingStatus || 'CONFIRMED'} size="sm" />
                                        </TableCell>

                                        {/* 11. Action */}
                                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="secondary"
                                                size="xs"
                                                onClick={() => handleRowClick(b)}
                                            >
                                                Details →
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* CEO BOOKING DETAILS DRAWER */}
            <CEOBookingDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setSelectedBooking(null);
                }}
                booking={selectedBooking}
                token={token}
                user={user}
                onBookingUpdated={loadBookings}
                onRecordExpense={loadBookings}
            />
        </div>
    );
}

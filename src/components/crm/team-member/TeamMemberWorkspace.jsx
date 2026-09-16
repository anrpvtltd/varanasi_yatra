import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { TableSkeleton } from '../ui/Skeleton';

export default function TeamMemberWorkspace({ token, user: currentUser }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Status Update Modal
    const [selectedLead, setSelectedLead] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [updateRemarks, setUpdateRemarks] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const loadMyLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            const res = await crmApi.fetchTeamLeads(token, params);
            if (res.success && Array.isArray(res.leads)) {
                setLeads(res.leads);
            }
        } catch (err) {
            console.error('Failed to load assigned leads:', err);
        } finally {
            setLoading(false);
        }
    }, [token, statusFilter]);

    useEffect(() => {
        loadMyLeads();
    }, [loadMyLeads]);

    const handleOpenStatusModal = (lead) => {
        setSelectedLead(lead);
        setNewStatus(lead.status || 'CONTACTED');
        setUpdateRemarks('');
        setUpdateError('');
    };

    const handleUpdateStatusSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLead || !newStatus) return;

        setIsUpdating(true);
        setUpdateError('');
        try {
            // Use existing enquiry update endpoint
            const res = await crmApi.updateEnquiry(token, selectedLead._id || selectedLead.id, {
                status: newStatus,
                remarks: updateRemarks.trim() || `Status updated to ${newStatus}`
            });

            if (res.success) {
                setSelectedLead(null);
                setFeedbackMsg('Lead status updated successfully.');
                setTimeout(() => setFeedbackMsg(''), 3000);
                loadMyLeads();
            } else {
                setUpdateError(res.message || 'Failed to update lead status.');
            }
        } catch (err) {
            setUpdateError(err.message || 'Network error updating lead status.');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredLeads = leads.filter(l => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const nameMatch = l.name?.toLowerCase().includes(q);
            const phoneMatch = l.mobile?.toLowerCase().includes(q) || l.phone?.toLowerCase().includes(q);
            const destMatch = l.destination?.toLowerCase().includes(q);
            if (!nameMatch && !phoneMatch && !destMatch) return false;
        }
        return true;
    });

    const activeCount = leads.filter(l => !['WON', 'LOST', 'ARCHIVED', 'CANCELLED', 'Closed'].includes(l.status)).length;
    const closedCount = leads.filter(l => ['WON', 'COMPLETED', 'BOOKED'].includes(l.status)).length;

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xl shadow-md">
                            👤
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                                    My Operations Workspace
                                </h1>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Specialist
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                Specialist: <span className="text-emerald-300 font-semibold">{currentUser?.name}</span> • Team: {currentUser?.assignment?.teamName || 'Operations'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={loadMyLeads}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedbackMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-center space-x-2 animate-fadeIn">
                    <span>✅</span>
                    <span>{feedbackMsg}</span>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My Assigned Leads</div>
                    <div className="text-2xl font-black text-slate-100 mt-1">{leads.length}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Total inquiries assigned</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Follow-ups</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{activeCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Needs contact or quote</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmed Bookings</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{closedCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Successfully confirmed</div>
                </div>
            </div>

            {/* Search & Status Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search your assigned leads by customer name or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="REQUIREMENTS_GATHERED">Requirements</option>
                        <option value="QUOTE_SENT">Quote Sent</option>
                        <option value="FOLLOW_UP">Follow Up</option>
                        <option value="WON">Won / Booked</option>
                        <option value="LOST">Lost</option>
                    </select>
                </div>
            </div>

            {/* Leads Table */}
            {loading ? (
                <TableSkeleton rows={5} />
            ) : filteredLeads.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <span className="text-3xl block mb-2">🎯</span>
                    <p className="text-slate-600 font-semibold text-sm">No leads assigned to you match this criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">When leads are assigned to you by your Team Leader, they will appear right here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Contact</th>
                                    <th className="py-3 px-4">Destination / Travel Date</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Assigned At</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredLeads.map(lead => (
                                    <tr key={lead._id || lead.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">{lead.name || 'Client'}</div>
                                            <div className="text-xs text-slate-400">Pax: {lead.travelers || lead.pax || 2}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-mono text-xs font-semibold text-slate-800">
                                                {lead.mobile || lead.phone || '—'}
                                            </div>
                                            {lead.email && <div className="text-xs text-slate-400">{lead.email}</div>}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            <div className="font-medium text-slate-800">{lead.destination || 'Kashi-Vashi'}</div>
                                            <div className="text-slate-400">{lead.date || lead.travelDate || 'Dates Flexible'}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusBadge status={lead.status || 'NEW'} />
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-400">
                                            {lead.assignedAt ? new Date(lead.assignedAt).toLocaleDateString('en-IN') : lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenStatusModal(lead)}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition shadow-sm"
                                            >
                                                ✏️ Update Status
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Update Lead Status Modal */}
            <Modal
                isOpen={Boolean(selectedLead)}
                onClose={() => setSelectedLead(null)}
                title={`Update Operational Status — ${selectedLead?.name || ''}`}
                size="md"
            >
                <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-left p-1">
                    {updateError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {updateError}
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-semibold text-slate-800">Client: {selectedLead?.name}</div>
                        <div className="text-slate-600">Phone: {selectedLead?.mobile || selectedLead?.phone}</div>
                        <div className="text-slate-600">Trip: {selectedLead?.destination}</div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            New Operational Status
                        </label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                        >
                            <option value="CONTACTED">Contacted Client</option>
                            <option value="REQUIREMENTS_GATHERED">Requirements Gathered</option>
                            <option value="FOLLOW_UP">Follow Up Scheduled</option>
                            <option value="WON">Booking Confirmed (Won)</option>
                            <option value="LOST">Lead Closed (Lost)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Call Notes & Follow-up Remarks
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Enter notes from conversation, requested itinerary adjustments, or next steps..."
                            value={updateRemarks}
                            onChange={(e) => setUpdateRemarks(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedLead(null)}
                            disabled={isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isUpdating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                            {isUpdating ? 'Saving...' : 'Save Status Update'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

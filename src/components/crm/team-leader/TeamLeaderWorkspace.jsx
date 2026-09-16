import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import Modal from '../ui/Modal';
import { TableSkeleton } from '../ui/Skeleton';

export default function TeamLeaderWorkspace({ token, user: currentUser }) {
    const [teamData, setTeamData] = useState(null);
    const [leads, setLeads] = useState([]);
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [activeTab, setActiveTab] = useState('LEADS'); // 'LEADS' | 'TEAM' | 'FOLLOWUPS'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Lead Assignment Modal State
    const [assignModalLead, setAssignModalLead] = useState(null);
    const [targetMemberId, setTargetMemberId] = useState('');
    const [assignRemarks, setAssignRemarks] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const loadTeamOverview = useCallback(async () => {
        setLoadingOverview(true);
        try {
            const res = await crmApi.fetchTeamOverview(token);
            if (res.success && res.team) {
                setTeamData(res.team);
            }
        } catch (err) {
            console.error('Failed to load team overview:', err);
        } finally {
            setLoadingOverview(false);
        }
    }, [token]);

    const loadTeamLeads = useCallback(async () => {
        setLoadingLeads(true);
        try {
            const params = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            const res = await crmApi.fetchTeamLeads(token, params);
            if (res.success && Array.isArray(res.leads)) {
                setLeads(res.leads);
            }
        } catch (err) {
            console.error('Failed to load team leads:', err);
        } finally {
            setLoadingLeads(false);
        }
    }, [token, statusFilter]);

    useEffect(() => {
        loadTeamOverview();
        loadTeamLeads();
    }, [loadTeamOverview, loadTeamLeads]);

    // Handle Open Assign Modal
    const handleOpenAssignModal = (lead) => {
        setAssignModalLead(lead);
        setTargetMemberId(lead.assignedTo?._id || lead.assignedTo?.id || lead.assignedTo || '');
        setAssignRemarks('');
        setAssignError('');
    };

    // Handle Lead Assignment Submit
    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!assignModalLead || !targetMemberId) {
            setAssignError('Please select a team member to assign this lead to.');
            return;
        }

        setIsAssigning(true);
        setAssignError('');
        try {
            const res = await crmApi.assignTeamLead(token, {
                leadId: assignModalLead._id || assignModalLead.id,
                assignedToUserId: targetMemberId,
                remarks: assignRemarks.trim()
            });

            if (res.success) {
                setAssignModalLead(null);
                setFeedbackMsg(res.message || 'Lead assigned successfully.');
                setTimeout(() => setFeedbackMsg(''), 3000);
                loadTeamLeads();
                loadTeamOverview();
            } else {
                setAssignError(res.message || 'Failed to assign lead.');
            }
        } catch (err) {
            setAssignError(err.message || 'Network error occurred while assigning lead.');
        } finally {
            setIsAssigning(false);
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

    const members = teamData?.members || [];
    const stats = teamData?.stats || { totalAssigned: 0, inProgress: 0, converted: 0 };

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header & Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xl shadow-md">
                            ⭐
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                                    Team Operations Center
                                </h1>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                    Team Leader
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                Team: <span className="text-purple-300 font-semibold">{teamData?.teamName || currentUser?.assignment?.teamName || 'Operations Team'}</span> • Leader: {currentUser?.name}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => { loadTeamOverview(); loadTeamLeads(); }}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                        🔄 Refresh Data
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

            {/* Operational Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Members</div>
                    <div className="text-2xl font-black text-purple-400 mt-1">{members.length}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Supervised specialists</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Leads</div>
                    <div className="text-2xl font-black text-slate-100 mt-1">{stats.totalAssigned || leads.length}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Assigned to team</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{stats.inProgress}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Active customer dialogues</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Converted</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{stats.converted}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Confirmed & Won</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 text-sm font-bold">
                <button
                    type="button"
                    onClick={() => setActiveTab('LEADS')}
                    className={`px-4 py-2.5 border-b-2 transition ${
                        activeTab === 'LEADS'
                            ? 'border-purple-600 text-purple-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    🎯 Assigned Leads ({leads.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('TEAM')}
                    className={`px-4 py-2.5 border-b-2 transition ${
                        activeTab === 'TEAM'
                            ? 'border-purple-600 text-purple-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    👥 My Team Members ({members.length})
                </button>
            </div>

            {/* TAB: Assigned Leads */}
            {activeTab === 'LEADS' && (
                <div className="space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search leads by customer name, phone, or destination..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                    {loadingLeads ? (
                        <TableSkeleton rows={5} />
                    ) : filteredLeads.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                            <span className="text-3xl block mb-2">📋</span>
                            <p className="text-slate-600 font-semibold text-sm">No leads match the current filters.</p>
                            <p className="text-xs text-slate-400 mt-1">Leads assigned to you and your team members will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Lead</th>
                                            <th className="py-3 px-4">Requirement / Dates</th>
                                            <th className="py-3 px-4">Assigned Specialist</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Created</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {filteredLeads.map(lead => {
                                            const isAssignedToSelf = String(lead.assignedTo?._id || lead.assignedTo?.id || lead.assignedTo) === String(currentUser?.id);

                                            return (
                                                <tr key={lead._id || lead.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-slate-900">{lead.name || 'Unnamed Client'}</div>
                                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{lead.mobile || lead.phone || 'No phone'}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs">
                                                        <div className="font-medium text-slate-800">{lead.destination || 'Kashi-Vashi'}</div>
                                                        <div className="text-slate-400">{lead.date || lead.travelDate || 'Dates TBD'} • {lead.travelers || lead.pax || 2} Pax</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs">
                                                        {lead.assignedTo ? (
                                                            <div>
                                                                <span className="font-semibold text-slate-800">
                                                                    {lead.assignedTo.name || 'Team Member'}
                                                                </span>
                                                                {isAssignedToSelf && (
                                                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded ml-1.5">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <StatusBadge status={lead.status || 'NEW'} />
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-slate-400">
                                                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : '—'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenAssignModal(lead)}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition shadow-sm"
                                                        >
                                                            🎯 Reassign
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: Team Members */}
            {activeTab === 'TEAM' && (
                <div className="space-y-4">
                    {loadingOverview ? (
                        <TableSkeleton rows={4} />
                    ) : members.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                            <span className="text-3xl block mb-2">👥</span>
                            <p className="text-slate-600 font-semibold text-sm">No team members assigned under your supervision yet.</p>
                            <p className="text-xs text-slate-400 mt-1">The CEO can assign team members to report to you via the Team Management console.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map(member => (
                                <div key={member.id || member._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-slate-900 text-base">{member.name}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{member.email}</div>
                                        </div>
                                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            ● {member.status || 'ACTIVE'}
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                                        <div className="text-slate-600">
                                            <span className="font-semibold text-slate-700">Team:</span> {member.assignment?.teamName || teamData?.teamName || 'Operations'}
                                        </div>
                                        <div className="text-slate-600">
                                            <span className="font-semibold text-slate-700">Areas:</span> {Array.isArray(member.assignment?.assignedAreas) && member.assignment.assignedAreas.length > 0 ? member.assignment.assignedAreas.join(', ') : 'All Areas'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Assign Lead Modal */}
            <Modal
                isOpen={Boolean(assignModalLead)}
                onClose={() => setAssignModalLead(null)}
                title={`Assign Lead — ${assignModalLead?.name || ''}`}
                size="md"
            >
                <form onSubmit={handleAssignSubmit} className="space-y-4 text-left p-1">
                    {assignError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {assignError}
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-semibold text-slate-800">Lead Summary:</div>
                        <div className="text-slate-600">Name: {assignModalLead?.name} • Phone: {assignModalLead?.mobile || assignModalLead?.phone}</div>
                        <div className="text-slate-600">Destination: {assignModalLead?.destination || 'Kashi-Vashi'}</div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Select Assignee (Team Specialist)
                        </label>
                        <select
                            required
                            value={targetMemberId}
                            onChange={(e) => setTargetMemberId(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
                        >
                            <option value="">Select a team member...</option>
                            {/* Option to assign to self */}
                            <option value={currentUser?.id}>⭐ Assign to Myself ({currentUser?.name})</option>
                            {/* Team members */}
                            {members.map(m => (
                                <option key={m.id || m._id} value={m.id || m._id}>
                                    👤 {m.name} ({m.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Operational Notes / Assignment Instructions
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Add any specific context, priority notes, or follow-up instructions..."
                            value={assignRemarks}
                            onChange={(e) => setAssignRemarks(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setAssignModalLead(null)}
                            disabled={isAssigning}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isAssigning}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                        >
                            {isAssigning ? 'Assigning...' : 'Confirm Lead Assignment'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

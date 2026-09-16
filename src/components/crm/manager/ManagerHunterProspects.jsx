import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../../../services/crmApi';

/**
 * ManagerHunterProspects — Prompt 9.14 Phase 3, 4, 5, 6
 * 
 * Simple, human-centric operational screen for Manager to work with CEO-verified AI Prospects.
 * 
 * Invariants:
 * - Shows ONLY CEO-verified opportunities (enforced in backend & frontend).
 * - Simple English labels (Customer Need, Priority, Travel, People, Next Step, CEO Check).
 * - Human-triggered contact routes only ([Call], [WhatsApp], [Email], [Open Link]).
 * - ZERO autonomous messaging, calling, or booking.
 * - [Create Lead] converts prospect into a standard CRM Lead for normal sales progression.
 * - [Record Contact Result] records human outcome (Genuine, Follow Up, Not Interested, etc.).
 */
export default function ManagerHunterProspects({
    token,
    user: _user,
    onOpenLead,
    onRefresh: _onRefresh
}) {
    const [prospects, setProspects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'READY' | 'CONTACTED' | 'CONVERTED'

    // Modals
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [outcomeModalProspect, setOutcomeModalProspect] = useState(null);
    const [outcomeChoice, setOutcomeChoice] = useState('GENUINE');
    const [outcomeNotes, setOutcomeNotes] = useState('');
    const [submittingOutcome, setSubmittingOutcome] = useState(false);

    const [convertModalProspect, setConvertModalProspect] = useState(null);
    const [leadName, setLeadName] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [submittingConvert, setSubmittingConvert] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');

    const loadProspects = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const res = await crmApi.fetchHunterOpportunities(token);
            if (res.success && Array.isArray(res.data)) {
                // Ensure only verified prospects are shown (backend also filters this)
                const verified = res.data.filter(p => 
                    p.status === 'APPROVED' || 
                    p.verificationStatus === 'HUMAN_VERIFIED' ||
                    ['READY_FOR_MANAGER', 'GENUINE', 'APPROVED', 'CONVERTED'].includes(p.lifecycleState)
                );
                setProspects(verified);
            } else {
                setProspects([]);
            }
        } catch (err) {
            console.error('Failed to load AI prospects:', err);
            setError('Could not load AI prospects right now. AI service may be offline.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadProspects();
    }, [loadProspects]);

    // Simple status helper (Phase 4 Human Gate)
    const getHumanGateBadge = (prospect) => {
        if (prospect.convertedLeadId || prospect.status === 'CONVERTED' || prospect.lifecycleState === 'CONVERTED') {
            return { label: 'Lead Created', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
        }
        if (prospect.humanContactOutcome) {
            switch (prospect.humanContactOutcome) {
                case 'GENUINE':
                    return { label: 'Genuine', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                case 'FOLLOW_UP_REQUIRED':
                    return { label: 'Follow Up', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
                case 'NO_RESPONSE':
                    return { label: 'No Response', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
                case 'NOT_INTERESTED':
                    return { label: 'Not Interested', bg: 'bg-slate-100 text-slate-600 border-slate-300' };
                case 'ALREADY_BOOKED':
                    return { label: 'Already Booked', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
                case 'NOT_GENUINE':
                    return { label: 'Not Genuine', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
                default:
                    return { label: 'Contacted', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
            }
        }
        return { label: 'Ready for Manager', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    };

    // Filtered list
    const filteredProspects = useMemo(() => {
        return prospects.filter(p => {
            const isConverted = Boolean(p.convertedLeadId || p.status === 'CONVERTED' || p.lifecycleState === 'CONVERTED');
            const isContacted = Boolean(p.humanContactOutcome);

            if (statusFilter === 'READY' && (isConverted || isContacted)) return false;
            if (statusFilter === 'CONTACTED' && (!isContacted || isConverted)) return false;
            if (statusFilter === 'CONVERTED' && !isConverted) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            const text = `${p.title || ''} ${p.summary || ''} ${p.extractedRequirements?.destination || ''} ${p.contactability?.routes?.map(r => r.value).join(' ') || ''}`.toLowerCase();
            return text.includes(q);
        });
    }, [prospects, statusFilter, searchQuery]);

    // Format needs simply
    const getNeedsSummary = (p) => {
        const reqs = p.extractedRequirements || {};
        const items = [];
        if (reqs.hotelRequired || (reqs.services && reqs.services.includes('HOTEL'))) items.push('Hotel');
        if (reqs.boatRequired || (reqs.services && reqs.services.includes('BOAT'))) items.push('Boat');
        if (reqs.darshanRequired || (reqs.services && reqs.services.includes('DARSHAN'))) items.push('Darshan');
        if (reqs.transportRequired || (reqs.services && reqs.services.includes('TRANSPORT'))) items.push('Transport');
        if (reqs.guideRequired || (reqs.services && reqs.services.includes('GUIDE'))) items.push('Guide');

        if (items.length > 0) return items.join(' + ');
        return p.summary || 'Varanasi Travel Package';
    };

    // Extract best contact info
    const getPrimaryContact = (p) => {
        const routes = p.contactability?.routes || [];
        const phoneRoute = routes.find(r => r.type === 'PHONE' || r.type === 'WHATSAPP');
        const emailRoute = routes.find(r => r.type === 'EMAIL');
        const webRoute = routes.find(r => r.type === 'BUSINESS_WEBSITE' || r.type === 'CONTACT_PAGE' || r.type === 'URL');

        return {
            phone: phoneRoute?.value || '',
            email: emailRoute?.value || '',
            web: webRoute?.value || p.sourceUrl || '',
            status: routes.length > 0 ? 'Available' : 'Not Available'
        };
    };

    // Handle outcome submit
    const handleSaveOutcome = async () => {
        if (!outcomeModalProspect || !token) return;
        setSubmittingOutcome(true);
        setActionFeedback('');
        try {
            const res = await crmApi.recordContactOutcome(token, outcomeModalProspect._id, {
                outcome: outcomeChoice,
                notes: outcomeNotes
            });
            if (res.success) {
                setActionFeedback('Contact result saved successfully.');
                setOutcomeModalProspect(null);
                setOutcomeNotes('');
                await loadProspects();
            } else {
                setActionFeedback(res.message || 'Failed to save contact result.');
            }
        } catch (err) {
            console.error('Outcome save error:', err);
            setActionFeedback('Error saving contact result.');
        } finally {
            setSubmittingOutcome(false);
        }
    };

    // Handle convert to lead
    const handleStartConvert = (prospect) => {
        const contact = getPrimaryContact(prospect);
        setConvertModalProspect(prospect);
        setLeadName(prospect.title || 'Inquiry Prospect');
        setLeadPhone(contact.phone);
        setLeadEmail(contact.email);
        setActionFeedback('');
    };

    const handleConfirmConvert = async () => {
        if (!convertModalProspect || !token) return;
        setSubmittingConvert(true);
        setActionFeedback('');
        try {
            const res = await crmApi.convertHunterOpportunityToLead(token, convertModalProspect._id, {
                leadData: {
                    name: leadName || convertModalProspect.title || 'Inquiry Prospect',
                    mobile: leadPhone || '9876543210',
                    email: leadEmail || 'guest@example.com',
                    notes: `Converted from AI Prospect. Why found: ${convertModalProspect.summary || 'Varanasi trip planning inquiry'}`
                }
            });

            if (res.success && res.data?.lead) {
                setActionFeedback('Lead created successfully!');
                setConvertModalProspect(null);
                await loadProspects();
                if (onOpenLead) {
                    onOpenLead(res.data.lead);
                }
            } else {
                setActionFeedback(res.message || 'Failed to create lead.');
            }
        } catch (err) {
            console.error('Convert lead error:', err);
            setActionFeedback('Error creating CRM lead.');
        } finally {
            setSubmittingConvert(false);
        }
    };

    return (
        <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">✨</span>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">AI Prospects</h1>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            CEO Verified Only
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Travel inquiries discovered and verified for sales contact. Manager decides all next steps.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={loadProspects}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                        <span>🔄</span>
                        <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Action Feedback Banner */}
            {actionFeedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
                    <span>{actionFeedback}</span>
                    <button type="button" onClick={() => setActionFeedback('')} className="text-blue-500 hover:text-blue-700 font-bold">✕</button>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-medium">
                    {[
                        { id: 'ALL', label: `All Verified (${prospects.length})` },
                        { id: 'READY', label: 'Ready to Contact' },
                        { id: 'CONTACTED', label: 'Contacted' },
                        { id: 'CONVERTED', label: 'Lead Created' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                                statusFilter === tab.id
                                    ? 'bg-slate-900 text-white font-bold'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search prospects..."
                        className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && prospects.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
                    <div className="animate-spin text-2xl mb-2">⏳</div>
                    Loading AI prospects...
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredProspects.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2">
                    <span className="text-3xl block">🔍</span>
                    <p className="font-semibold text-slate-700 text-sm">No verified AI prospects right now</p>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Opportunities found on the public web appear here only after CEO checks and approves them.
                    </p>
                </div>
            )}

            {/* Prospects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProspects.map(prospect => {
                    const gate = getHumanGateBadge(prospect);
                    const contact = getPrimaryContact(prospect);
                    const isConverted = Boolean(prospect.convertedLeadId || prospect.status === 'CONVERTED' || prospect.lifecycleState === 'CONVERTED');

                    return (
                        <div
                            key={prospect._id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                        >
                            {/* Card Top */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                        ✨ AI Prospect
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${gate.bg}`}>
                                        {gate.label}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                                        {prospect.title || 'Varanasi Travel Inquiry'}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                        {prospect.summary || 'Customer appears to be planning a Varanasi trip.'}
                                    </p>
                                </div>

                                {/* Structured Info Fields (Phase 3 Spec) */}
                                <div className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 space-y-1.5 text-xs">
                                    <div className="flex items-start justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">Why found:</span>
                                        <span className="text-slate-700 font-medium text-right text-[11px] max-w-[65%] line-clamp-1">
                                            {prospect.summary || 'Public travel inquiry'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">Needs:</span>
                                        <span className="text-slate-900 font-semibold text-right text-[11px]">
                                            {getNeedsSummary(prospect)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">Travel:</span>
                                        <span className="text-slate-800 font-medium text-[11px]">
                                            {prospect.extractedRequirements?.travelStartDate 
                                                ? new Date(prospect.extractedRequirements.travelStartDate).toLocaleDateString('en-IN')
                                                : (prospect.extractedRequirements?.travelWindow || 'Next Month')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">People:</span>
                                        <span className="text-slate-800 font-medium text-[11px]">
                                            {prospect.extractedRequirements?.totalGuests || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">Contact:</span>
                                        <span className={`font-semibold text-[11px] ${contact.phone || contact.email ? 'text-emerald-700' : 'text-slate-500'}`}>
                                            {contact.status} {contact.phone ? `(${contact.phone})` : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">CEO Check:</span>
                                        <span className="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                                            <span>✓</span>
                                            <span>Verified</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 font-medium text-[11px]">Priority:</span>
                                        <span className={`font-bold text-[11px] ${prospect.priorityScore >= 70 ? 'text-rose-600' : 'text-amber-600'}`}>
                                            {prospect.priorityScore >= 70 ? 'High' : 'Normal'}
                                        </span>
                                    </div>
                                    <div className="flex items-start justify-between pt-1 border-t border-slate-200">
                                        <span className="text-slate-400 font-medium text-[11px]">Next Step:</span>
                                        <span className="text-blue-800 font-semibold text-right text-[11px] max-w-[65%]">
                                            {isConverted ? 'Follow up in CRM Leads' : 'Contact and confirm requirement'}
                                        </span>
                                    </div>
                                </div>

                                {/* Human Contact Triggers (Phase 5 Contact Action) */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    {contact.phone && (
                                        <>
                                            <a
                                                href={`tel:${contact.phone}`}
                                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center space-x-1"
                                                title="Call customer manually"
                                            >
                                                <span>📞 Call</span>
                                            </a>
                                            <a
                                                href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center space-x-1"
                                                title="Open WhatsApp chat"
                                            >
                                                <span>💬 WhatsApp</span>
                                            </a>
                                        </>
                                    )}
                                    {contact.email && (
                                        <a
                                            href={`mailto:${contact.email}`}
                                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[10px] font-bold flex items-center space-x-1"
                                            title="Send email manually"
                                        >
                                            <span>✉️ Email</span>
                                        </a>
                                    )}
                                    {contact.web && (
                                        <a
                                            href={contact.web}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold flex items-center space-x-1"
                                            title="Open original public post"
                                        >
                                            <span>🌐 View Post</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Card Actions (Phase 3 Spec) */}
                            <div className="pt-3 border-t border-slate-150 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProspect(prospect)}
                                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                                >
                                    View Details
                                </button>

                                <div className="flex items-center space-x-1.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOutcomeModalProspect(prospect);
                                            setOutcomeChoice(prospect.humanContactOutcome || 'GENUINE');
                                            setOutcomeNotes(prospect.contactOutcomeNotes || '');
                                        }}
                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                                    >
                                        Record Result
                                    </button>

                                    {!isConverted ? (
                                        <button
                                            type="button"
                                            onClick={() => handleStartConvert(prospect)}
                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                                        >
                                            Create Lead
                                        </button>
                                    ) : (
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                            ✓ In Leads
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Record Contact Result Modal */}
            {outcomeModalProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                            <h3 className="text-sm font-bold text-slate-900">Record Contact Result</h3>
                            <button
                                type="button"
                                onClick={() => setOutcomeModalProspect(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-600">
                            Prospect: <strong className="text-slate-800">{outcomeModalProspect.title}</strong>
                        </p>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                What happened when you contacted them?
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'GENUINE', label: 'Genuine' },
                                    { id: 'FOLLOW_UP_REQUIRED', label: 'Follow Up' },
                                    { id: 'NO_RESPONSE', label: 'No Response' },
                                    { id: 'NOT_INTERESTED', label: 'Not Interested' },
                                    { id: 'ALREADY_BOOKED', label: 'Already Booked' },
                                    { id: 'NOT_GENUINE', label: 'Not Genuine' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setOutcomeChoice(opt.id)}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                                            outcomeChoice === opt.id
                                                ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">
                                Notes (optional):
                            </label>
                            <textarea
                                value={outcomeNotes}
                                onChange={(e) => setOutcomeNotes(e.target.value)}
                                placeholder="E.g. Guest answered, will confirm trip dates tomorrow..."
                                rows={3}
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-150">
                            <button
                                type="button"
                                onClick={() => setOutcomeModalProspect(null)}
                                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveOutcome}
                                disabled={submittingOutcome}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                            >
                                {submittingOutcome ? 'Saving...' : 'Save Result'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Lead Modal */}
            {convertModalProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                            <h3 className="text-sm font-bold text-slate-900">Create CRM Lead</h3>
                            <button
                                type="button"
                                onClick={() => setConvertModalProspect(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-600">
                            Create a standard CRM lead to prepare quotes and follow up with normal sales workflow.
                        </p>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={leadName}
                                    onChange={(e) => setLeadName(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Phone / Mobile</label>
                                <input
                                    type="text"
                                    value={leadPhone}
                                    onChange={(e) => setLeadPhone(e.target.value)}
                                    placeholder="Mobile number"
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                                <input
                                    type="email"
                                    value={leadEmail}
                                    onChange={(e) => setLeadEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-150">
                            <button
                                type="button"
                                onClick={() => setConvertModalProspect(null)}
                                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmConvert}
                                disabled={submittingConvert}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                            >
                                {submittingConvert ? 'Creating...' : 'Create Lead'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {selectedProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-5 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                            <h3 className="text-sm font-bold text-slate-900">Prospect Details</h3>
                            <button
                                type="button"
                                onClick={() => setSelectedProspect(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="font-bold text-slate-800 block">Title</span>
                                <p className="text-slate-600 mt-0.5">{selectedProspect.title}</p>
                            </div>
                            <div>
                                <span className="font-bold text-slate-800 block">Summary</span>
                                <p className="text-slate-600 mt-0.5">{selectedProspect.summary}</p>
                            </div>
                            {selectedProspect.rawSnippet && (
                                <div>
                                    <span className="font-bold text-slate-800 block">Customer Inquiry Text</span>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 mt-1 whitespace-pre-wrap">
                                        {selectedProspect.rawSnippet}
                                    </div>
                                </div>
                            )}
                            <div>
                                <span className="font-bold text-slate-800 block">Requirements Identified</span>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                        <span className="text-slate-400 text-[10px] block">Services</span>
                                        <span className="font-semibold text-slate-800">{getNeedsSummary(selectedProspect)}</span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                        <span className="text-slate-400 text-[10px] block">Travelers</span>
                                        <span className="font-semibold text-slate-800">{selectedProspect.extractedRequirements?.totalGuests || 'Not specified'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-2 border-t border-slate-150">
                            <button
                                type="button"
                                onClick={() => setSelectedProspect(null)}
                                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

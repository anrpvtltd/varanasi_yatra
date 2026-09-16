import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';

/**
 * ✨ AI Help — Manager Advisory Assistance Panel (Prompt 9.14)
 * 
 * Simple English, zero developer jargon.
 * Invariants:
 * 1. CEO controls AI switches; Manager only uses AI.
 * 2. If module is off, shows "Currently Off" (no enable button).
 * 3. Advisory only: zero auto-messaging, zero auto-booking, zero price authority.
 * 4. Human-triggered [Copy Draft], [Call], [WhatsApp] actions.
 */
export default function AISalesAssistantPanel({
    lead,
    token,
    user: _user,
    onOpenQuoteBuilder,
    onLeadUpdated
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [salesData, setSalesData] = useState(null);
    const [aiModuleStatus, setAiModuleStatus] = useState({
        checked: false,
        enabled: true,
        serviceConnected: true
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedDraft, setCopiedDraft] = useState(false);
    const leadId = lead?._id || lead?.id;
    const cleanPhone = String(lead?.mobile || lead?.phone || '').replace(/[^0-9]/g, '');

    // Check AI Module Configuration (Phase 9)
    useEffect(() => {
        let isMounted = true;
        async function checkStatus() {
            if (!token) return;
            try {
                const configRes = await crmApi.fetchAiConfig(token);
                if (isMounted) {
                    if (configRes && configRes.success) {
                        const masterOn = configRes.config?.masterEnabled !== false;
                        const salesOn = configRes.config?.modules?.salesAssistant?.enabled !== false;
                        setAiModuleStatus({
                            checked: true,
                            enabled: masterOn && salesOn,
                            serviceConnected: true
                        });
                    } else {
                        setAiModuleStatus({
                            checked: true,
                            enabled: true,
                            serviceConnected: false
                        });
                    }
                }
            } catch {
                if (isMounted) {
                    setAiModuleStatus({
                        checked: true,
                        enabled: false,
                        serviceConnected: false
                    });
                }
            }
        }
        checkStatus();
        return () => { isMounted = false; };
    }, [token]);

    // Load initial sales snapshot summary
    const loadSummary = useCallback(async () => {
        if (!leadId || !token) return;
        try {
            setError(null);
            const res = await crmApi.fetchAiSalesSummary(token, leadId);
            if (res.success) {
                setSalesData(res);
            }
        } catch {
            // Advisory only; graceful fallback to lead data
        }
    }, [leadId, token]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    // Refresh analysis
    const handleRefreshAnalysis = async () => {
        if (!leadId || !token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await crmApi.analyzeLeadWithAi(token, leadId);
            if (res.success) {
                setSalesData(res);
                if (onLeadUpdated && res.sanitizedLead) {
                    onLeadUpdated(res.sanitizedLead);
                }
            } else {
                setError(res.message || 'Could not update advice');
            }
        } catch (err) {
            setError(err.message || 'AI service is temporarily unreachable');
        } finally {
            setLoading(false);
        }
    };

    // Copy suggested message draft
    const handleCopyDraft = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedDraft(true);
        setTimeout(() => setCopiedDraft(false), 2500);
    };

    // ─── PHASE 9: Status Clarity ──────────────────────────────────────────────
    if (aiModuleStatus.checked && !aiModuleStatus.enabled) {
        return (
            <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✨</span>
                        <span className="font-bold text-stone-200 text-xs">AI Help</span>
                    </div>
                    <span className="text-[10px] bg-stone-800 text-stone-400 font-mono px-2 py-0.5 rounded-md">
                        Currently Off
                    </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                    AI assistance is currently switched off by the CEO.
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-stone-800/80 flex items-center gap-2 flex-wrap text-xs">
                    {onOpenQuoteBuilder && (
                        <button
                            type="button"
                            onClick={() => onOpenQuoteBuilder(lead)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition shadow-2xs cursor-pointer"
                        >
                            Create Quote
                        </button>
                    )}
                    {cleanPhone && (
                        <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${lead?.name || ''}, regarding your Varanasi trip enquiry...`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold px-2.5 py-1 rounded-lg text-[11px] transition inline-flex items-center gap-1"
                        >
                            Ask Customer
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (aiModuleStatus.checked && !aiModuleStatus.serviceConnected) {
        return (
            <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl shadow-xs">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✨</span>
                        <span className="font-bold text-stone-200 text-xs">AI Help</span>
                    </div>
                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-mono px-2 py-0.5 rounded-md">
                        Temporarily unavailable
                    </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                    Reason: AI service is not connected.
                </p>
            </div>
        );
    }

    // ─── Simple English Extraction ────────────────────────────────────────────
    const qualification = salesData?.qualification || lead?.aiQualification;
    const recommendation = salesData?.recommendation;
    const gapsList = salesData?.gaps?.missingFields || [];

    // 1. Customer Need
    let customerNeed = lead?.specialRequirements || lead?.notes || '';
    if (!customerNeed || customerNeed.length < 5) {
        const services = [];
        if (lead?.hotelPreference || lead?.hotelDetails) services.push('Hotel');
        if (lead?.pickup || /pickup|cab/i.test(lead?.specialRequirements || '')) services.push('Cab');
        if (/boat/i.test(lead?.specialRequirements || '')) services.push('Boat');
        if (/darshan/i.test(lead?.specialRequirements || '')) services.push('Darshan');
        customerNeed = services.length > 0 ? services.join(' + ') : 'Varanasi Pilgrimage & Sightseeing';
    }

    // 2. Priority
    let priorityLabel = 'Normal';
    let priorityBadge = 'bg-stone-100 text-stone-700 border-stone-200';
    const rawPriority = String(lead?.priority || qualification?.intentLevel || '').toUpperCase();
    if (rawPriority === 'HIGH' || rawPriority === 'URGENT' || lead?.status === 'HOT' || lead?.status === 'Hot') {
        priorityLabel = 'High';
        priorityBadge = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    } else if (rawPriority === 'MEDIUM') {
        priorityLabel = 'Medium';
        priorityBadge = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    }

    // 3. Travel Time
    const travelTime = lead?.date || lead?.travelDate || lead?.travelWindow || 'Upcoming / Flexible';

    // 4. People
    const peopleCount = lead?.travelers || lead?.guests || lead?.requirements?.totalGuests || '2 Adults';

    // 5. Missing Info
    const missingItems = [];
    if (!lead?.date && !lead?.travelDate) missingItems.push('Travel date');
    if (!lead?.travelers && !lead?.guests) missingItems.push('Guest count');
    if (!lead?.pickup) missingItems.push('Arrival time / pickup');
    if (!lead?.hotelPreference && !lead?.hotelDetails) missingItems.push('Hotel preference');
    if (gapsList.includes('dates') && !missingItems.includes('Travel date')) missingItems.push('Travel date');
    if (gapsList.includes('guests') && !missingItems.includes('Guest count')) missingItems.push('Guest count');
    const missingInfoText = missingItems.length > 0 ? missingItems.slice(0, 2).join(', ') : 'All key details present';

    // 6. Next Step
    let nextStepText = recommendation?.reason || '';
    if (!nextStepText || nextStepText.length < 5) {
        if (lead?.status === 'QUOTE_SENT' || lead?.stage === 'QUOTE') {
            nextStepText = 'Follow up with customer on sent quote proposal.';
        } else if (missingItems.length > 0) {
            nextStepText = `Call customer and confirm ${missingItems[0].toLowerCase()}.`;
        } else {
            nextStepText = 'Get current vehicle rate from provider and prepare quote.';
        }
    }

    // Suggested Follow-up Message Draft (Phase 8)
    const suggestedMessage = `Namaste ${lead?.name || 'ji'}, Kashi-Vashi se baat kar rahe hain. Aapke ${travelTime !== 'Upcoming / Flexible' ? `${travelTime} ke ` : ''}Kashi trip plan ke baare mein baat karni thi. Aapke liye aaraamdayak darshan aur cab arrangement ready kar rahe hain. Kya hum abhi baat kar sakte hain?`;

    return (
        <div className="p-4 bg-gradient-to-br from-amber-50/70 via-white to-stone-50 border border-amber-200/90 rounded-2xl shadow-xs space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-base">✨</span>
                    <h4 className="text-xs font-bold text-stone-900 tracking-tight">
                        AI Help
                    </h4>
                    <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-medium">
                        Advisory · Manager Decides
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handleRefreshAnalysis}
                    disabled={loading}
                    className="text-[11px] text-stone-600 hover:text-stone-900 font-semibold px-2 py-1 rounded-lg hover:bg-stone-100 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                    <span>{loading ? '⏳' : '⚡'}</span>
                    <span>{loading ? 'Checking...' : 'Refresh'}</span>
                </button>
            </div>

            {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)} className="text-rose-500 font-bold ml-2">✕</button>
                </div>
            )}

            {/* 6 Core Information Fields (Phase 2 Simple English Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {/* 1. Customer Need */}
                <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                    <span className="text-[10px] font-mono uppercase text-stone-500 block mb-0.5">Customer Need</span>
                    <span className="font-bold text-stone-900 line-clamp-2 leading-tight">
                        {customerNeed}
                    </span>
                </div>

                {/* 2. Priority */}
                <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                    <span className="text-[10px] font-mono uppercase text-stone-500 block mb-0.5">Priority</span>
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-md border ${priorityBadge}`}>
                        {priorityLabel}
                    </span>
                </div>

                {/* 3. Travel Time */}
                <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                    <span className="text-[10px] font-mono uppercase text-stone-500 block mb-0.5">Travel Time</span>
                    <span className="font-bold text-stone-900 block truncate">
                        {travelTime}
                    </span>
                </div>

                {/* 4. People */}
                <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                    <span className="text-[10px] font-mono uppercase text-stone-500 block mb-0.5">People</span>
                    <span className="font-bold text-stone-900">
                        {peopleCount}
                    </span>
                </div>

                {/* 5. Missing Info */}
                <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                    <span className="text-[10px] font-mono uppercase text-stone-500 block mb-0.5">Missing Info</span>
                    <span className="font-semibold text-amber-700 block truncate" title={missingInfoText}>
                        {missingInfoText}
                    </span>
                </div>

                {/* 6. Next Step */}
                <div className="p-2.5 bg-stone-900 text-white rounded-xl col-span-2 sm:col-span-1 shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-amber-400 block mb-0.5">Next Step</span>
                    <span className="font-semibold text-stone-100 text-[11px] line-clamp-2 leading-tight">
                        {nextStepText}
                    </span>
                </div>
            </div>

            {/* Expander: [View More] / [Show Less] */}
            <div className="pt-1 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition"
                >
                    <span>{isExpanded ? '▲ Show Less' : '▼ View More (Draft message & questions)'}</span>
                </button>

                {onOpenQuoteBuilder && (
                    <button
                        type="button"
                        onClick={() => onOpenQuoteBuilder(lead)}
                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                        <span>📝</span>
                        <span>Open Quote Builder</span>
                    </button>
                )}
            </div>

            {/* Expanded Content: Draft Message & Manual Actions */}
            {isExpanded && (
                <div className="pt-3 border-t border-amber-200/70 space-y-3 animate-fadeIn text-xs">
                    {/* Suggested Follow-up Draft Message (Phase 8) */}
                    <div className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase font-bold text-stone-500">
                                Suggested WhatsApp Message
                            </span>
                            <span className="text-[10px] text-stone-400">
                                Manual send only
                            </span>
                        </div>

                        <p className="text-stone-800 bg-stone-50 p-2.5 rounded-lg border border-stone-100 leading-relaxed font-sans text-xs">
                            {suggestedMessage}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => handleCopyDraft(suggestedMessage)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <span>{copiedDraft ? '✓ Copied!' : '📋 Copy Draft'}</span>
                            </button>

                            {cleanPhone && (
                                <a
                                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(suggestedMessage)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <span>💬</span>
                                    <span>Open WhatsApp</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Helpful Questions to Ask Customer */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                        <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block mb-1">
                            Suggested Questions for Customer
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px]">
                            <li>"Are you arriving by flight or train at Varanasi Cantt?"</li>
                            <li>"Do you have elderly family members needing e-rickshaw or wheelchair assistance?"</li>
                            <li>"Would you prefer a private boat for Sunrise Subah-e-Banaras or evening Aarti?"</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

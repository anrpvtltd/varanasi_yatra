import React, { useState, useEffect, useCallback } from 'react';
import AssistantMessageList from './AssistantMessageList';
import AssistantInput from './AssistantInput';
import { getAttribution } from '../../utils/attribution';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export default function CustomerAssistant({ isOpen, onClose }) {
    const [sessionId, setSessionId] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [requirementState, setRequirementState] = useState({});
    const [serviceInterests, setServiceInterests] = useState([]);
    const [readyForConfirmation, setReadyForConfirmation] = useState(false);
    const [humanHandoffRequired, setHumanHandoffRequired] = useState(false);
    const [escalationReason, setEscalationReason] = useState(null);
    const [leadId, setLeadId] = useState(null);
    const [error, setError] = useState(null);

    // Initialize session only once when assistant is opened
    const initSession = useCallback(async () => {
        if (sessionId) return; // already active

        setIsLoading(true);
        setError(null);
        try {
            const attribution = getAttribution();
            const res = await fetch(`${API_BASE}/public/ai/assistant/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: attribution?.source || 'WEBSITE',
                    qrId: attribution?.qrId || null,
                    areaId: attribution?.areaId || null,
                    partnerId: attribution?.partnerId || null,
                    qrType: attribution?.qrType || null,
                    rawQuery: attribution
                })
            });

            const data = await res.json();
            if (data.success) {
                setSessionId(data.sessionId);
                setConversationId(data.conversationId);
                setMessages([
                    {
                        role: 'assistant',
                        content: data.initialMessage || "Namaste 🙏 Main Kashi-Vashi ka AI travel assistant hoon. Aap Varanasi trip ke liye kya plan kar rahe hain?",
                        timestamp: new Date().toISOString(),
                        quickReplies: data.quickReplies || [
                            "Plan a trip",
                            "Hotel",
                            "Darshan",
                            "Boat Ride",
                            "Transport",
                            "Pandit",
                            "Complete Package"
                        ]
                    }
                ]);
            } else {
                setError(data.message || "AI Assistant filhaal uplabdh nahi hai.");
            }
        } catch {
            setError("Connection issue. Kripya hamari helpline ya normal form use karein.");
        } finally {
            setIsLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        if (isOpen) {
            initSession();
        }
    }, [isOpen, initSession]);

    // Handle escape key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Send user message
    const handleSendMessage = async (text) => {
        if (!text || !sessionId || isTyping) return;

        const userMsg = {
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/public/ai/assistant/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    message: text
                })
            });

            const data = await res.json();
            if (data.success) {
                const assistantReply = {
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date().toISOString(),
                    quickReplies: data.quickReplies || []
                };

                setMessages((prev) => [...prev, assistantReply]);
                if (data.requirementState) setRequirementState(data.requirementState);
                if (data.serviceInterests) setServiceInterests(data.serviceInterests);
                setReadyForConfirmation(Boolean(data.readyForConfirmation));
                setHumanHandoffRequired(Boolean(data.humanHandoffRequired));
                if (data.escalationReason) setEscalationReason(data.escalationReason);
                if (data.leadId) setLeadId(data.leadId);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.message || "Kshama karein, main yeh process nahi kar paya. Kripya dobara likhein.",
                        timestamp: new Date().toISOString(),
                        quickReplies: ["Plan a trip", "WhatsApp Team"]
                    }
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Network me thodi dikkat aa rahi hai. Aap chahein toh hamare travel expert se seedhe connect kar sakte hain.",
                    timestamp: new Date().toISOString(),
                    quickReplies: ["WhatsApp Team", "Try Again"]
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleConfirmRequirement = () => {
        handleSendMessage("Yes, Submit");
    };

    const handleEditRequirement = () => {
        handleSendMessage("Edit requirement");
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistant-title"
        >
            <div
                className="w-full sm:w-[420px] h-[90vh] sm:h-[620px] max-h-[100vh] bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-3.5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border-b border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-base">
                            🛕
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 id="assistant-title" className="font-bold text-sm text-stone-100">
                                    Kashi-Vashi AI
                                </h3>
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ONLINE
                                </span>
                                {leadId && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        SUBMITTED
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-stone-400">
                                {leadId ? `Trip Lead Created (#${String(leadId).slice(-6)})` : 'Travel Assistant & Trip Planner'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition active:scale-95 cursor-pointer"
                            aria-label="Close Assistant"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-xs text-stone-400">Connecting to travel assistant...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <span className="text-3xl">🙏</span>
                        <p className="text-xs text-stone-300 max-w-xs">{error}</p>
                        <button
                            type="button"
                            onClick={initSession}
                            className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-lg shadow transition active:scale-95 cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        <AssistantMessageList
                            messages={messages}
                            isTyping={isTyping}
                            onQuickReply={handleSendMessage}
                            requirementState={requirementState}
                            serviceInterests={serviceInterests}
                            readyForConfirmation={readyForConfirmation}
                            humanHandoffRequired={humanHandoffRequired}
                            escalationReason={escalationReason}
                            conversationId={conversationId}
                            onConfirmRequirement={handleConfirmRequirement}
                            onEditRequirement={handleEditRequirement}
                        />

                        <AssistantInput
                            onSend={handleSendMessage}
                            disabled={isTyping || isLoading}
                            placeholder="Type dates, guests, or services..."
                        />
                    </>
                )}
            </div>
        </div>
    );
}

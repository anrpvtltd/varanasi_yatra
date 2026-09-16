import React, { useEffect, useRef } from 'react';
import AssistantQuickReplies from './AssistantQuickReplies';
import AssistantRequirementSummary from './AssistantRequirementSummary';
import AssistantHandoff from './AssistantHandoff';
import AssistantTypingIndicator from './AssistantTypingIndicator';

export default function AssistantMessageList({
    messages = [],
    isTyping = false,
    onQuickReply,
    requirementState = {},
    serviceInterests = [],
    readyForConfirmation = false,
    humanHandoffRequired = false,
    escalationReason = null,
    conversationId = '',
    onConfirmRequirement,
    onEditRequirement
}) {
    const scrollEndRef = useRef(null);

    useEffect(() => {
        if (scrollEndRef.current) {
            scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, readyForConfirmation, humanHandoffRequired]);

    // Format simple bold text and newlines
    const renderFormattedText = (text = '') => {
        const lines = text.split('\n');
        return lines.map((line, lIdx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={lIdx} className="block min-h-[1.1rem]">
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-semibold text-amber-300">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </span>
            );
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm" role="log" aria-live="polite">
            {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLatest = index === messages.length - 1;

                return (
                    <div
                        key={`${msg.timestamp}-${index}`}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                        <div className={`flex items-start gap-2 max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isUser && (
                                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs flex-shrink-0 mt-0.5" aria-hidden="true">
                                    🛕
                                </div>
                            )}

                            <div
                                className={`rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                                    isUser
                                        ? 'bg-amber-500 text-stone-950 rounded-br-sm font-medium'
                                        : 'bg-stone-800/95 text-stone-200 border border-stone-750 rounded-bl-sm'
                                }`}
                            >
                                <div className="text-[13px]">
                                    {renderFormattedText(msg.content)}
                                </div>
                            </div>
                        </div>

                        {/* Quick replies on the latest assistant message */}
                        {!isUser && isLatest && msg.quickReplies && msg.quickReplies.length > 0 && (
                            <div className="ml-9 mt-1">
                                <AssistantQuickReplies
                                    options={msg.quickReplies}
                                    onSelect={onQuickReply}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Requirement Summary card if confirmation stage */}
            {readyForConfirmation && (
                <div className="ml-9">
                    <AssistantRequirementSummary
                        requirementState={requirementState}
                        services={serviceInterests}
                        onConfirm={onConfirmRequirement}
                        onEdit={onEditRequirement}
                    />
                </div>
            )}

            {/* Human escalation banner if triggered */}
            {humanHandoffRequired && (
                <div className="ml-9">
                    <AssistantHandoff
                        reason={escalationReason}
                        conversationId={conversationId}
                    />
                </div>
            )}

            {/* Typing Indicator */}
            {isTyping && (
                <div className="ml-9">
                    <AssistantTypingIndicator />
                </div>
            )}

            <div ref={scrollEndRef} aria-hidden="true" />
        </div>
    );
}

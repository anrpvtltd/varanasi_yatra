import React from 'react';
import { trackWhatsAppClick, trackCallClick } from '../../utils/analytics';

export default function AssistantHandoff({ reason = null, conversationId = '' }) {
    const waText = encodeURIComponent(
        `Namaste Kashi-Vashi! I was chatting with the AI Travel Assistant (Ref: ${conversationId || 'Website'}) and would like to speak directly with an expert about my trip.`
    );
    const waUrl = `https://wa.me/918149783494?text=${waText}`;

    return (
        <div className="my-2 p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40 text-xs shadow-sm">
            <div className="flex items-start gap-2">
                <span className="text-base">🤝</span>
                <div className="flex-1">
                    <h4 className="font-semibold text-emerald-300">Human Team Handoff</h4>
                    {reason && (
                        <span className="text-[10px] text-emerald-400/80 font-medium">Assistance Request: {reason.replace(/_/g, ' ')}</span>
                    )}
                    <p className="text-stone-300 text-[11px] mt-0.5 leading-relaxed">
                        Humari operations team aapki requirement review karke direct assist karegi. Aap abhi hamare Varanasi specialist se connect kar sakte hain:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => trackWhatsAppClick('ai_assistant_handoff')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition active:scale-95 shadow-sm"
                        >
                            <span>WhatsApp Team</span>
                        </a>
                        <a
                            href="tel:+918400554029"
                            onClick={() => trackCallClick('ai_assistant_handoff')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] border border-stone-700 transition active:scale-95"
                        >
                            <span>Call Expert (+91 8400554029)</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

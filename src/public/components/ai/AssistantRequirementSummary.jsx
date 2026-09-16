import React from 'react';

export default function AssistantRequirementSummary({ requirementState = {}, services = [], onConfirm, onEdit }) {
    if (!requirementState || Object.keys(requirementState).length === 0) return null;

    const hasAnyField = requirementState.travelWindow ||
                        requirementState.travelStartDate ||
                        requirementState.totalGuests ||
                        requirementState.duration ||
                        (services && services.length > 0);

    if (!hasAnyField) return null;

    return (
        <div className="my-2 p-3.5 bg-stone-900/90 rounded-xl border border-amber-500/30 text-xs shadow-md space-y-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <span>📋</span> YOUR TRIP REQUIREMENT
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                    Draft
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-stone-300">
                {(requirementState.travelWindow || requirementState.travelStartDate) && (
                    <div>
                        <span className="text-stone-400 block text-[10px]">Travel Dates</span>
                        <span className="font-semibold text-stone-100">
                            {requirementState.travelWindow || requirementState.travelStartDate}
                        </span>
                    </div>
                )}

                {requirementState.totalGuests && (
                    <div>
                        <span className="text-stone-400 block text-[10px]">Guests</span>
                        <span className="font-semibold text-stone-100">
                            {requirementState.totalGuests} Guests
                            {requirementState.adults ? ` (${requirementState.adults}A${requirementState.children ? `/${requirementState.children}C` : ''})` : ''}
                        </span>
                    </div>
                )}

                {requirementState.duration && (
                    <div>
                        <span className="text-stone-400 block text-[10px]">Duration</span>
                        <span className="font-semibold text-stone-100">{requirementState.duration}</span>
                    </div>
                )}

                {requirementState.origin && (
                    <div>
                        <span className="text-stone-400 block text-[10px]">Coming From</span>
                        <span className="font-semibold text-stone-100">{requirementState.origin}</span>
                    </div>
                )}

                {requirementState.budget && (
                    <div>
                        <span className="text-stone-400 block text-[10px]">Approx Budget</span>
                        <span className="font-semibold text-emerald-400">{requirementState.budget}</span>
                    </div>
                )}

                {requirementState.accommodationPreference && (
                    <div>
                        <span className="text-stone-400 block text-[10px]">Hotel Type</span>
                        <span className="font-semibold text-stone-100">{requirementState.accommodationPreference}</span>
                    </div>
                )}
            </div>

            {services && services.length > 0 && (
                <div className="pt-1 border-t border-stone-800/80">
                    <span className="text-stone-400 block text-[10px] mb-1">Services Included</span>
                    <div className="flex flex-wrap gap-1">
                        {services.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-500/20">
                                <span>✓</span> {s.charAt(0) + s.slice(1).toLowerCase()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {requirementState.specialRequirements && (
                <div className="text-[11px] text-stone-300">
                    <span className="text-stone-400">Notes:</span> {requirementState.specialRequirements}
                </div>
            )}

            {(onConfirm || onEdit) && (
                <div className="pt-2 flex items-center gap-2">
                    {onConfirm && (
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer text-center"
                        >
                            Yes, Submit
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition active:scale-95 cursor-pointer text-center"
                        >
                            Edit
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

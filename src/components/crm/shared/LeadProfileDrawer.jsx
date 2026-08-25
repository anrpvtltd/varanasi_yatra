import React from 'react';
import { getStatusGradient } from '../../../constants/crm';
import { LEAD_SOURCES, DEFAULT_SERVICES, LEAD_STAGES, STAGE_LABELS } from '../../../constants/phase4Constants';
import { checkRequirementsReadiness, getNormalizedStage } from '../../../utils/requirementsEngine';
import { computeNextBestAction } from '../../../utils/nextBestAction';

export default function LeadProfileDrawer({
    selectedLead,
    setSelectedLead,
    profileTab,
    setProfileTab,
    handleInputChange,
    handleSaveChanges,
    isSaving,
    user,
    onOpenQuoteBuilder
}) {
    if (!selectedLead) return null;

    const currentStage = getNormalizedStage(selectedLead);
    const reqReadiness = checkRequirementsReadiness(selectedLead);
    const nextAction = computeNextBestAction(selectedLead);

    const journeyStages = [
        LEAD_STAGES.NEW,
        LEAD_STAGES.CONTACTED,
        LEAD_STAGES.FOLLOW_UP,
        LEAD_STAGES.INTERESTED,
        LEAD_STAGES.REQUIREMENTS_READY,
        LEAD_STAGES.QUOTE_READY,
        LEAD_STAGES.QUOTED
    ];

    const handleServiceToggle = (serviceId) => {
        const currentReqs = selectedLead.requirements || {};
        const updatedReqs = {
            ...currentReqs,
            [serviceId]: !currentReqs[serviceId]
        };
        handleInputChange({
            target: {
                name: 'requirements',
                value: updatedReqs
            }
        });
    };

    const handleCreateQuoteClick = () => {
        if (onOpenQuoteBuilder) {
            onOpenQuoteBuilder(selectedLead);
        } else {
            alert(`🎉 Opening Quote Builder for "${selectedLead.name}"`);
        }
    };


    return (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
            {/* Backdrop closer */}
            <div className="absolute inset-0" onClick={() => setSelectedLead(null)}></div>

            {/* Drawer Content */}
            <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-stone-200 relative z-10 transform translate-x-0 transition-transform duration-300">
                {/* Header Status Accent Strip */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${getStatusGradient(selectedLead.status)}`}></div>

                {/* Drawer Header */}
                <div className="p-5 pb-3 border-b border-stone-100 bg-stone-50/20">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-serif font-bold text-stone-900">{selectedLead.name}</h3>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                                    {STAGE_LABELS[currentStage] || selectedLead.status}
                                </span>
                            </div>
                            <p className="text-xs text-stone-500 font-semibold mt-0.5">
                                📞 {selectedLead.mobile} · 📍 {selectedLead.destination || 'Varanasi'} · Source: {selectedLead.leadSource || selectedLead.createdBy || 'Website'}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedLead(null)}
                            className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition p-1"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Visual Journey Stage Stepper */}
                    <div className="mt-3 pt-3 border-t border-stone-200/50">
                        <p className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest mb-1.5">Lead Journey Lifecycle</p>
                        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[9px] font-bold">
                            {journeyStages.map((stg, i) => {
                                const isCurrent = currentStage === stg;
                                const isPassed = journeyStages.indexOf(currentStage) > i || currentStage === LEAD_STAGES.WON;
                                return (
                                    <div
                                        key={stg}
                                        className={`flex items-center space-x-1 px-2 py-1 rounded-md border whitespace-nowrap ${
                                            isCurrent
                                                ? 'bg-amber-600 text-white border-amber-600 font-extrabold shadow-xs'
                                                : isPassed
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                                                : 'bg-stone-50 text-stone-400 border-stone-200'
                                        }`}
                                    >
                                        <span>{isPassed ? '✓' : i + 1}</span>
                                        <span>{STAGE_LABELS[stg]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Profile Navigation Tabs */}
                <div className="flex border-b border-stone-200 bg-stone-50/50 px-5 pt-2 overflow-x-auto gap-1">
                    <button
                        onClick={() => setProfileTab('overview')}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2.5 cursor-pointer whitespace-nowrap ${
                            profileTab === 'overview' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                        }`}
                    >
                        📋 Overview & Contact
                    </button>
                    <button
                        onClick={() => setProfileTab('requirements')}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2.5 cursor-pointer whitespace-nowrap ${
                            profileTab === 'requirements' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                        }`}
                    >
                        🎯 Requirements & Readiness
                    </button>
                    <button
                        onClick={() => setProfileTab('operations')}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2.5 cursor-pointer whitespace-nowrap ${
                            profileTab === 'operations' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                        }`}
                    >
                        🚖 Transport & Allocations
                    </button>
                    {user && user.role === 'CEO' && (
                        <button
                            onClick={() => setProfileTab('financials')}
                            className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2.5 cursor-pointer whitespace-nowrap ${
                                profileTab === 'financials' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                            }`}
                        >
                            💰 Financials
                        </button>
                    )}
                    <button
                        onClick={() => setProfileTab('notes')}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2.5 cursor-pointer whitespace-nowrap ${
                            profileTab === 'notes' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                        }`}
                    >
                        📝 Notes
                    </button>
                    <button
                        onClick={() => setProfileTab('history')}
                        className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition border-b-2 px-2.5 cursor-pointer whitespace-nowrap ${
                            profileTab === 'history' ? 'border-amber-600 text-amber-700' : 'border-transparent text-stone-400 hover:text-stone-700'
                        }`}
                    >
                        📜 Activity Log
                    </button>
                </div>

                {/* Drawer Form */}
                <form onSubmit={handleSaveChanges} className="flex-1 flex flex-col justify-between overflow-hidden">
                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">

                        {/* NEXT BEST ACTION RECOMMENDATION CARD */}
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider">💡 Next Best Action Recommendation</span>
                                <p className="text-xs font-extrabold text-slate-900">{nextAction.label}: <span className="font-medium text-slate-700">{nextAction.reason}</span></p>
                            </div>
                            {reqReadiness.isQuoteReady && (
                                <button
                                    type="button"
                                    onClick={handleCreateQuoteClick}
                                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm transition cursor-pointer whitespace-nowrap"
                                >
                                    [ CREATE QUOTE ]
                                </button>
                            )}
                        </div>

                        {/* TAB 1: OVERVIEW & CLIENT */}
                        {profileTab === 'overview' && (
                            <div className="space-y-4">
                                <div className="bg-stone-50 border border-stone-200/70 p-4 rounded-2xl space-y-3">
                                    <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest border-b border-stone-200/50 pb-1.5 flex justify-between">
                                        <span>Customer Contact & Origin</span>
                                        <span>ID: #{selectedLead._id?.slice(-6)}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Customer Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={selectedLead.name || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Mobile Number</label>
                                            <input
                                                type="tel"
                                                name="mobile"
                                                value={selectedLead.mobile || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={selectedLead.email || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Lead Source</label>
                                            <select
                                                name="leadSource"
                                                value={selectedLead.leadSource || selectedLead.createdBy || 'Website'}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                            >
                                                {Object.entries(LEAD_SOURCES).map(([key, val]) => (
                                                    <option key={key} value={val}>{val}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50/40 border border-amber-200/60 p-4 rounded-2xl space-y-3">
                                    <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest border-b border-amber-200/50 pb-1.5">
                                        Travel Logistics & Dates
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Pickup Location</label>
                                            <input
                                                type="text"
                                                name="pickup"
                                                value={selectedLead.pickup || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Destination</label>
                                            <input
                                                type="text"
                                                name="destination"
                                                value={selectedLead.destination || 'Varanasi'}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Travel Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={selectedLead.date || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Travelers Count</label>
                                            <input
                                                type="text"
                                                name="travelers"
                                                value={selectedLead.travelers || '1'}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Operational Pipeline Status Workflow */}
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Operational Pipeline Status Workflow</label>
                                    <select
                                        name="status"
                                        value={selectedLead.status}
                                        onChange={handleInputChange}
                                        className="w-full border border-stone-300 rounded-xl p-3 bg-stone-50 text-stone-900 font-bold focus:ring-2 focus:ring-amber-500/50 focus:outline-none cursor-pointer text-sm"
                                    >
                                        <option value="Pending">🟡 Pending (New Enquiry)</option>
                                        <option value="In-Progress">🔵 In-Progress (Follow-up / Quoting)</option>
                                        <option value="Confirmed">🟢 Confirmed (Package Locked & Advance Received)</option>
                                        <option value="Trip Started">🚖 Trip Started (Tour Active / Driver En Route)</option>
                                        <option value="Completed">✅ Completed (Trip Finished & Settled)</option>
                                        <option value="Cancelled">🔴 Cancelled (Dropped / Refunded)</option>
                                    </select>
                                </div>

                                {selectedLead.status === 'In-Progress' && (
                                    <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                                        <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1.5">Next Follow-up Date</label>
                                        <input
                                            type="date"
                                            name="followUpDate"
                                            value={selectedLead.followUpDate || ''}
                                            onChange={handleInputChange}
                                            className="w-full border border-stone-200 focus:border-blue-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: TRIP REQUIREMENTS & READINESS */}
                        {profileTab === 'requirements' && (
                            <div className="space-y-4">
                                {/* Requirements Readiness Progress Bar */}
                                <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-stone-700 uppercase tracking-wider">Quote Readiness Score</span>
                                        <span className={reqReadiness.isQuoteReady ? 'text-emerald-600' : 'text-amber-600'}>
                                            {reqReadiness.completedCount} / {reqReadiness.totalCount} Complete ({reqReadiness.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${reqReadiness.isQuoteReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                            style={{ width: `${reqReadiness.percentage}%` }}
                                        ></div>
                                    </div>
                                    {reqReadiness.missingFields.length > 0 ? (
                                        <p className="text-[11px] text-rose-600 font-semibold pt-1">
                                            ⚠️ Missing for Quote: <span className="font-normal">{reqReadiness.missingFields.join(', ')}</span>
                                        </p>
                                    ) : (
                                        <div className="flex justify-between items-center pt-1">
                                            <p className="text-[11px] text-emerald-700 font-bold">
                                                🎉 All customer requirement parameters complete!
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleCreateQuoteClick}
                                                className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-lg uppercase tracking-wider cursor-pointer hover:bg-emerald-700"
                                            >
                                                [ CREATE QUOTE ]
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Service Checkboxes */}
                                <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest border-b border-stone-100 pb-2">
                                        Select Required Services
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        {DEFAULT_SERVICES.map(srv => {
                                            const reqs = selectedLead.requirements || {};
                                            const isSelected = Boolean(reqs[srv.id]);
                                            return (
                                                <button
                                                    key={srv.id}
                                                    type="button"
                                                    onClick={() => handleServiceToggle(srv.id)}
                                                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs'
                                                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                                                    }`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <span>{srv.icon}</span>
                                                        <span>{srv.label}</span>
                                                    </div>
                                                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                                                        isSelected ? 'bg-amber-600 text-white' : 'border border-stone-300'
                                                    }`}>
                                                        {isSelected && '✓'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Custom Requirements Notes */}
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Custom Requirement Notes</label>
                                    <textarea
                                        name="specialRequirements"
                                        value={selectedLead.specialRequirements || ''}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="w-full border border-stone-200 rounded-xl p-3 bg-white text-stone-900 font-medium text-xs focus:outline-none focus:border-amber-500"
                                        placeholder="e.g. Tamil speaking assistance, elderly wheelchair support, riverfront view hotel..."
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TRANSPORT & ALLOCATIONS */}
                        {profileTab === 'operations' && (
                            <div className="space-y-4">
                                <div className="bg-purple-50/30 border border-purple-200/50 p-4 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest border-b border-purple-200/40 pb-1.5">Driver & Vehicle Assignment</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Driver Name</label>
                                            <input
                                                type="text"
                                                name="driverName"
                                                value={selectedLead.driverName || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                placeholder="e.g. Rajesh Kumar"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Driver Mobile</label>
                                            <input
                                                type="tel"
                                                name="driverMobile"
                                                value={selectedLead.driverMobile || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                placeholder="e.g. 9876543210"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Vehicle Model / Type</label>
                                            <input
                                                type="text"
                                                name="vehicleModel"
                                                value={selectedLead.vehicleModel || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                placeholder="e.g. Innova Crysta / Dzire"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Vehicle Number</label>
                                            <input
                                                type="text"
                                                name="vehicleNumber"
                                                value={selectedLead.vehicleNumber || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none"
                                                placeholder="e.g. UP 65 AB 1234"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-teal-50/30 border border-teal-200/50 p-4 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-bold text-teal-900 uppercase tracking-widest border-b border-teal-200/40 pb-1.5">Hotel & Guide/Pandit Allocations</h4>
                                    <div className="space-y-3 text-xs">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Hotel Accommodations & Rooms</label>
                                            <input
                                                type="text"
                                                name="hotelDetails"
                                                value={selectedLead.hotelDetails || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none"
                                                placeholder="e.g. Hotel Clarks Varanasi (2 Deluxe Rooms, 3 Nights)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Assigned Pandit / Tour Guide</label>
                                            <input
                                                type="text"
                                                name="panditDetails"
                                                value={selectedLead.panditDetails || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none"
                                                placeholder="e.g. Pt. Ramesh Shastri (Special Rudrabhishek & Ganga Aarti VIP)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: FINANCIALS */}
                        {profileTab === 'financials' && user && user.role === 'CEO' && (
                            <div className="space-y-4">
                                <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-4">
                                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest border-b border-emerald-200/50 pb-1.5">Package Value & Payment Ledger</h4>

                                    <div>
                                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Total Package Cost (Package Value)</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                            <input
                                                type="number"
                                                name="totalAmount"
                                                value={selectedLead.totalAmount || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                                placeholder="Enter total package cost"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Advance Token Received (Paid Amount)</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                            <input
                                                type="number"
                                                name="advanceAmount"
                                                value={selectedLead.advanceAmount || ''}
                                                onChange={handleInputChange}
                                                className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                                placeholder="Enter advance token paid"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Balance Outstanding (Auto-Calculated 🔒)</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                                            <input
                                                type="number"
                                                name="remainingAmount"
                                                value={selectedLead.remainingAmount || 0}
                                                readOnly
                                                className="w-full border border-stone-200 rounded-xl pl-8 pr-4 py-2.5 bg-stone-100 text-stone-600 font-extrabold cursor-not-allowed text-xs sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: INTERNAL NOTES & DOCUMENTS */}
                        {profileTab === 'notes' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">📝 Internal Admin Notes</label>
                                    <textarea
                                        name="adminNotes"
                                        value={selectedLead.adminNotes || ''}
                                        onChange={handleInputChange}
                                        rows="6"
                                        className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-3.5 bg-white text-stone-900 font-semibold focus:outline-none transition-all text-xs sm:text-sm"
                                        placeholder="Add confidential operator notes, special requests, call feedback, or itinerary tweaks..."
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: ACTIVITY HISTORY TIMELINE */}
                        {profileTab === 'history' && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-widest border-b border-stone-200 pb-2">Activity & Status Audit Timeline</h4>
                                {selectedLead.statusHistory && selectedLead.statusHistory.length > 0 ? (
                                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-stone-200">
                                        {selectedLead.statusHistory.map((item, idx) => (
                                            <div key={idx} className="relative pl-7 space-y-1">
                                                <div className="absolute left-1.5 top-1.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-xs"></div>
                                                <div className="bg-stone-50 border border-stone-200/80 p-3 rounded-xl">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-extrabold text-stone-900">{item.previousStatus} ➔ <span className="text-amber-700">{item.newStatus}</span></span>
                                                        <span className="text-[10px] font-bold text-stone-400">{new Date(item.updatedTime).toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-[11px] text-stone-600 mt-1 font-medium">{item.remarks}</div>
                                                    <div className="text-[9px] font-bold text-stone-400 mt-1 uppercase">By: {item.updatedBy}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-400 font-medium italic">No prior status audit records recorded.</p>
                                )}
                            </div>
                        )}

                        {/* Update Remarks Input Field */}
                        <div className="border-t border-stone-200 pt-4">
                            <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-1.5">Action Remarks / Log Note</label>
                            <input
                                type="text"
                                name="remarks"
                                value={selectedLead.remarks || ''}
                                onChange={handleInputChange}
                                className="w-full border border-stone-300 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-medium text-xs focus:outline-none"
                                placeholder="Reason or notes for this status/profile update..."
                            />
                        </div>

                    </div>

                    {/* Sticky Save actions Footer */}
                    <div className="p-5 border-t border-stone-100 bg-stone-50/40 flex space-x-3.5">
                        <button
                            type="button"
                            onClick={() => setSelectedLead(null)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-stone-900 hover:bg-amber-600 text-white py-3.5 rounded-xl font-serif font-bold uppercase tracking-widest text-xs transition duration-200 shadow-md disabled:bg-stone-300 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving Changes...' : 'Save Lead Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

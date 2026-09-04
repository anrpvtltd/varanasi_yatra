import React from 'react';
import { getStatusGradient } from '../../../constants/crm';
import { formatSafeDate } from '../../../utils/dateUtils';

export default function LeadProfileDrawer({
    selectedLead,
    setSelectedLead,
    handleInputChange,
    handleSaveChanges,
    isSaving,
    user: _user,
    onOpenQuoteBuilder
}) {
    if (!selectedLead) return null;

    const requirements = selectedLead.requirements || {};

    const handleReqToggle = (key) => {
        const updated = {
            ...requirements,
            [key]: !requirements[key]
        };
        handleInputChange({
            target: {
                name: 'requirements',
                value: updated
            }
        });
    };

    const handleWhatsAppClick = () => {
        if (!selectedLead.mobile) return;
        const cleanNumber = selectedLead.mobile.replace(/[^0-9]/g, '');
        const fullNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
        const text = encodeURIComponent(`Namaste ${selectedLead.name} Ji! Thank you for contacting Varanasi Yatra. Regarding your travel inquiry for ${selectedLead.destination || 'Varanasi'}, how may we assist you today?`);
        window.open(`https://wa.me/${fullNumber}?text=${text}`, '_blank');
    };

    const handleCallClick = () => {
        if (!selectedLead.mobile) return;
        window.open(`tel:${selectedLead.mobile}`, '_self');
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
                <div className="p-5 pb-4 border-b border-stone-100 bg-stone-50/40 flex justify-between items-center">
                    <div>
                        <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-serif font-bold text-stone-900">{selectedLead.name}</h3>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider">
                                {selectedLead.status || 'Pending'}
                            </span>
                        </div>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                            Lead ID: #{selectedLead._id?.slice(-6).toUpperCase()} · Created: {formatSafeDate(selectedLead.createdAt)}
                        </p>
                    </div>
                    <button
                        onClick={() => setSelectedLead(null)}
                        className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition p-1"
                    >
                        &times;
                    </button>
                </div>

                {/* Drawer Form */}
                <form onSubmit={handleSaveChanges} className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">

                        {/* 1. QUICK CONTACT ACTIONS & SOURCE */}
                        <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center border-b border-stone-200/60 pb-2">
                                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                                    Customer Contact & Origin
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                    selectedLead.leadSource === 'QR' 
                                        ? 'bg-purple-100 text-purple-800'
                                        : selectedLead.leadSource === 'Offline/Manual'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    Source: {selectedLead.leadSource || 'Website'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-extrabold text-stone-900">📞 {selectedLead.mobile || 'No Mobile'}</div>
                                    <div className="text-xs text-stone-500">{selectedLead.email || 'No email provided'}</div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={handleWhatsAppClick}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1 shadow-xs cursor-pointer"
                                    >
                                        <span>💬</span>
                                        <span>WhatsApp</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCallClick}
                                        className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1 shadow-xs cursor-pointer"
                                    >
                                        <span>📞</span>
                                        <span>Call</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. TRAVEL DETAILS & ROUTE PLAN */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3 shadow-xs">
                            <div className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-1.5">
                                Travel Details & Route Requirements
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Travel Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedLead.date ? new Date(selectedLead.date).toISOString().split('T')[0] : ''}
                                        onChange={handleInputChange}
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Travelers (Pax)</label>
                                    <input
                                        type="number"
                                        name="travelers"
                                        min="1"
                                        value={selectedLead.travelers || 1}
                                        onChange={handleInputChange}
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Duration</label>
                                    <input
                                        type="text"
                                        name="tripDuration"
                                        value={selectedLead.tripDuration || '3 Days / 2 Nights'}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 3 Days / 2 Nights"
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Pickup Point</label>
                                    <input
                                        type="text"
                                        name="pickup"
                                        value={selectedLead.pickup || ''}
                                        onChange={handleInputChange}
                                        placeholder="Airport / Cantt Stn"
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Drop Point</label>
                                    <input
                                        type="text"
                                        name="drop"
                                        value={selectedLead.drop || ''}
                                        onChange={handleInputChange}
                                        placeholder="Airport / Station"
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Lead Source</label>
                                    <select
                                        name="leadSource"
                                        value={selectedLead.leadSource || 'Website'}
                                        onChange={handleInputChange}
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                                    >
                                        <option value="Website">🌐 Website</option>
                                        <option value="QR">📱 QR Scan</option>
                                        <option value="Offline/Manual">📞 Offline / Manual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                        Varanasi Destinations / Ghats
                                    </label>
                                    <input
                                        type="text"
                                        name="varanasiDestinations"
                                        value={selectedLead.varanasiDestinations || selectedLead.destination || 'Kashi Vishwanath, Assi Ghat, Sarnath'}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Kashi Vishwanath, Assi, Sarnath"
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-medium focus:outline-none focus:border-amber-500 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                        Outside Varanasi Destinations
                                    </label>
                                    <input
                                        type="text"
                                        name="outsideDestinations"
                                        value={selectedLead.outsideDestinations || ''}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Ayodhya, Prayagraj, Gaya, Lucknow"
                                        className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 text-stone-900 font-medium focus:outline-none focus:border-amber-500 text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. CUSTOMER REQUIREMENTS CHECKLIST (FOR QUOTE) */}
                        <div className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3 shadow-xs">
                            <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
                                <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                                    Customer Requirements (Needed For Quote)
                                </span>
                                <span className="text-[10px] font-bold text-amber-600">Select All Required Services</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'hotel', label: '🏨 Hotel Stay' },
                                    { id: 'transport', label: '🚗 Car / Transport', altId: 'car' },
                                    { id: 'pandit', label: '🪔 Pandit Ji' },
                                    { id: 'boat', label: '⛵ Boat Ride' },
                                    { id: 'guide', label: '🚩 Tour Guide' },
                                    { id: 'shopping', label: '🛍️ Shopping Assist' },
                                    { id: 'darshan', label: '🛕 VIP Darshan' },
                                    { id: 'other', label: '✨ Other Services' }
                                ].map((req) => {
                                    const isChecked = Boolean(requirements[req.id] || (req.altId && requirements[req.altId]));
                                    return (
                                        <button
                                            key={req.id}
                                            type="button"
                                            onClick={() => {
                                                handleReqToggle(req.id);
                                                if (req.altId) {
                                                    const updated = { ...requirements, [req.id]: !isChecked, [req.altId]: !isChecked };
                                                    handleInputChange({ target: { name: 'requirements', value: updated } });
                                                }
                                            }}
                                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                                                isChecked
                                                    ? 'bg-amber-500/10 border-amber-500 text-amber-900 shadow-xs'
                                                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                                            }`}
                                        >
                                            <span className="truncate">{req.label}</span>
                                            <span>{isChecked ? '✓' : '+'}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                                    Notes & Special Requests
                                </label>
                                <textarea
                                    name="specialRequirements"
                                    rows="2"
                                    value={selectedLead.specialRequirements || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 text-stone-900 font-medium focus:outline-none focus:border-amber-500 text-xs"
                                    placeholder="e.g. Needs 7-seater Innova, prefers 4-star hotel near Dashashwamedh ghat..."
                                />
                            </div>
                        </div>

                        {/* 4. CURRENT STATUS & ACTIONS */}
                        <div className="bg-stone-900 text-white p-4 rounded-2xl space-y-3">
                            <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest border-b border-stone-800 pb-1.5 flex justify-between">
                                <span>Quote & Booking Action</span>
                                <span>Stage: {selectedLead.status || 'Pending'}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => onOpenQuoteBuilder && onOpenQuoteBuilder(selectedLead)}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center space-x-1.5"
                                >
                                    <span>📜</span>
                                    <span>Build / Edit Quote</span>
                                </button>
                            </div>
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

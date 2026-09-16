import React from 'react';
import Drawer from '../ui/Drawer';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import Input, { Select } from '../ui/Input';
import Card from '../ui/Card';
import AISalesAssistantPanel from './AISalesAssistantPanel';
import { safeDateOnly } from '../../../utils/dateUtils';

/**
 * Modernized Lead Profile Drawer
 * Structured sections: Customer -> Trip -> Requirements -> Customer Notes -> Next Action
 */
export default function LeadProfileDrawer({
    selectedLead,
    setSelectedLead,
    handleInputChange,
    handleSaveChanges,
    isSaving,
    user,
    token,
    onOpenQuoteBuilder
}) {
    if (!selectedLead) return null;

    const requirements = selectedLead.requirements || {};

    const handleReqToggle = (key, altId = null) => {
        const isCurrentlyChecked = Boolean(requirements[key] || (altId && requirements[altId]));
        const updated = {
            ...requirements,
            [key]: !isCurrentlyChecked
        };
        if (altId) {
            updated[altId] = !isCurrentlyChecked;
        }
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
        const text = encodeURIComponent(`Namaste ${selectedLead.name} Ji! Thank you for contacting Kashi-Vashi. Regarding your travel enquiry for ${selectedLead.destination || 'Varanasi'}, how may we assist you today?`);
        window.open(`https://wa.me/${fullNumber}?text=${text}`, '_blank');
    };

    const handleCallClick = () => {
        if (!selectedLead.mobile) return;
        window.open(`tel:${selectedLead.mobile}`, '_self');
    };

    const handleEmailClick = () => {
        if (!selectedLead.email) return;
        window.open(`mailto:${selectedLead.email}?subject=${encodeURIComponent(`Kashi-Vashi Travel Enquiry - ${selectedLead.name}`)}`, '_self');
    };

    const travelDateFormatted = safeDateOnly(selectedLead.date, '');

    const reqServices = [
        { id: 'hotel', label: 'Hotel Stay', icon: '🏨' },
        { id: 'transport', altId: 'car', label: 'Transport / Cab', icon: '🚗' },
        { id: 'darshan', label: 'VIP Darshan', icon: '🛕' },
        { id: 'boat', label: 'Boat Ride', icon: '⛵' },
        { id: 'guide', label: 'Tour Guide', icon: '🚩' },
        { id: 'pandit', label: 'Pandit Ji', icon: '🪔' },
        { id: 'shopping', label: 'Shopping Visit', icon: '🛍️' },
        { id: 'other', label: 'Custom Assistance', icon: '✨' }
    ];

    return (
        <Drawer
            isOpen={Boolean(selectedLead)}
            onClose={() => setSelectedLead(null)}
            title={
                <div className="flex items-center space-x-2">
                    <span className="text-slate-400 font-normal text-xs mr-1">Customer /</span>
                    <span className="text-slate-900 font-bold">{selectedLead.name}</span>
                </div>
            }
            subtitle={
                <span className="flex items-center space-x-2 mt-0.5">
                    <span>📞 {selectedLead.mobile || 'No mobile'}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-400">ID: #{selectedLead._id?.slice(-6).toUpperCase()}</span>
                </span>
            }
            badge={<StatusBadge status={selectedLead.status || 'NEW'} entity="LEAD" size="sm" />}
            width="max-w-2xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLead(null)}
                    >
                        Cancel
                    </Button>

                    <div className="flex items-center space-x-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveChanges}
                            loading={isSaving}
                        >
                            Save Changes
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenQuoteBuilder && onOpenQuoteBuilder(selectedLead)}
                            icon={<span>📜</span>}
                        >
                            Create Quote →
                        </Button>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSaveChanges} className="space-y-5">
                {/* 1. CUSTOMER IDENTITY & FAST CONTACT BAR */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200">
                            {(selectedLead.name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{selectedLead.name}</h3>
                            <p className="text-xs text-slate-500">{selectedLead.city || selectedLead.destination || 'Kashi-Vashi Enquirer'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleCallClick}
                            icon={<span>📞</span>}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                            Call
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            onClick={handleWhatsAppClick}
                            icon={<span>💬</span>}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                            WhatsApp
                        </Button>
                        {selectedLead.email && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleEmailClick}
                                icon={<span>✉️</span>}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                            >
                                Email
                            </Button>
                        )}
                    </div>
                </div>

                {/* 🤖 AI SALES ASSISTANT (Prompt 7) */}
                <AISalesAssistantPanel
                    lead={selectedLead}
                    token={token || (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : '')}
                    user={user}
                    onOpenQuoteBuilder={onOpenQuoteBuilder}
                    onLeadUpdated={(updated) => setSelectedLead && setSelectedLead(prev => ({ ...prev, ...updated }))}
                />

                {/* 2. SECTION: CUSTOMER DETAILS */}
                {(() => {
                    const isQrLead = selectedLead.source === 'AREA_QR' ||
                        selectedLead.source === 'HOTEL_QR' ||
                        selectedLead.leadSource === 'QR' ||
                        Boolean(selectedLead.qrId) ||
                        Boolean(selectedLead.qrAttribution) ||
                        Boolean(selectedLead.partnerName);

                    const isHotelQr = isQrLead && (selectedLead.source === 'HOTEL_QR' || Boolean(selectedLead.partnerName) || (selectedLead.leadSource === 'QR' && Boolean(selectedLead.partnerId)));
                    const resolvedQrId = selectedLead.qrId || selectedLead.qrAttribution?.qrId || '';
                    const resolvedArea = selectedLead.areaName || selectedLead.qrAttribution?.areaName || '';
                    const resolvedPlacement = selectedLead.placementName || selectedLead.venueName || selectedLead.city || selectedLead.pickup || selectedLead.destination || 'Varanasi';
                    const resolvedPartner = selectedLead.partnerName || selectedLead.partnerId || '';

                    return (
                        <Card
                            title="Customer Information"
                            subtitle="Primary contact details and origin source"
                            headerAction={
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    isQrLead
                                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                                        : (selectedLead.leadSource === 'Offline/Manual' || selectedLead.source === 'OFFLINE'
                                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                                            : (selectedLead.leadSource === 'AI_HUNTER'
                                                ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'))
                                }`}>
                                    Source: {isQrLead ? `QR${resolvedArea ? ` • ${resolvedArea}` : (resolvedPartner ? ` • ${resolvedPartner}` : '')}` : (selectedLead.leadSource || 'Website Direct')}
                                </span>
                            }
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <Input
                                    label="Customer Full Name"
                                    name="name"
                                    value={selectedLead.name || ''}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="Mobile Number"
                                    name="mobile"
                                    value={selectedLead.mobile || ''}
                                    onChange={handleInputChange}
                                    required
                                />
                                <Input
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={selectedLead.email || ''}
                                    onChange={handleInputChange}
                                    placeholder="customer@email.com"
                                />
                                <Select
                                    label="Lead Source"
                                    name="leadSource"
                                    value={isQrLead ? 'QR' : (selectedLead.leadSource || (selectedLead.source === 'OFFLINE' ? 'Offline/Manual' : 'Website'))}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Website', label: '🌐 Website Direct' },
                                        { value: 'QR', label: '📱 QR Code Scan' },
                                        { value: 'Offline/Manual', label: '📞 Offline / Direct Call' }
                                    ]}
                                />

                                {/* Attribution Info Box if Hotel QR */}
                                {isHotelQr && (
                                    <div className="col-span-full bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-1.5">
                                            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
                                                <span>🏨</span>
                                                <span>QR Attribution — Hotel Partner</span>
                                            </span>
                                            <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[10px] border border-amber-300/60">
                                                Source: QR
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                                            <div>
                                                <span className="text-stone-400 block text-[10px] font-semibold uppercase">Partner / Hotel</span>
                                                <span className="font-bold text-stone-900">{resolvedPartner || 'Partner'}</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400 block text-[10px] font-semibold uppercase">QR ID</span>
                                                <span className="font-mono font-bold text-stone-800">{resolvedQrId || 'Assigned Token'}</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400 block text-[10px] font-semibold uppercase">Placement</span>
                                                <span className="font-semibold text-stone-800">{resolvedPlacement}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Attribution Info Box if Area QR */}
                                {isQrLead && !isHotelQr && (
                                    <div className="col-span-full bg-orange-50/90 border border-orange-200 rounded-xl p-3.5 text-xs space-y-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-1.5">
                                            <span className="text-[10px] uppercase font-bold text-orange-800 tracking-wider flex items-center gap-1">
                                                <span>📱</span>
                                                <span>QR Attribution</span>
                                            </span>
                                            <span className="font-bold text-orange-900 bg-orange-100/80 px-2 py-0.5 rounded text-[10px] border border-orange-300/60">
                                                Source: QR
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                                            <div>
                                                <span className="text-stone-400 block text-[10px] font-semibold uppercase">Area</span>
                                                <span className="font-bold text-stone-900">{resolvedArea || 'Varanasi Area'}</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400 block text-[10px] font-semibold uppercase">QR ID</span>
                                                <span className="font-mono font-bold text-stone-800">{resolvedQrId || 'Assigned Token'}</span>
                                            </div>
                                            <div>
                                                <span className="text-stone-400 block text-[10px] font-semibold uppercase">Placement</span>
                                                <span className="font-semibold text-stone-800">{resolvedPlacement}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })()}

                {/* 🤖 AI HUNTER PROSPECT INTELLIGENCE (For Hunter-Sourced Leads) */}
                {(selectedLead.leadSource === 'AI_HUNTER' || selectedLead.aiHunter || selectedLead.opportunityId) && (
                    <Card
                        title="AI Hunter Prospect Intelligence"
                        subtitle="Public intent signal verified genuine by CEO for operational contact"
                        headerAction={
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
                                CEO Verified Genuine
                            </span>
                        }
                    >
                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl">
                                <span className="text-[10px] uppercase font-bold text-cyan-900 tracking-wider block">Why Prospect / Detected Need</span>
                                <p className="text-stone-800 mt-1 leading-relaxed">
                                    {selectedLead.specialRequirements || selectedLead.hunterIntent || 'Public signal identified active Varanasi pilgrimage & travel intent.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                                    <span className="text-[10px] uppercase font-semibold text-stone-500 block">Intent Mode</span>
                                    <span className="font-bold text-stone-800 text-xs">
                                        {selectedLead.hunterMode === 'AI_LOCAL' ? '📍 In-Destination (Local)' : '✈️ Upcoming Trip (Outside)'}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                                    <span className="text-[10px] uppercase font-semibold text-stone-500 block">Travel Window</span>
                                    <span className="font-bold text-stone-800 text-xs">
                                        {selectedLead.date || selectedLead.travelWindow || 'Flexible'}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                                    <span className="text-[10px] uppercase font-semibold text-stone-500 block">Confidence</span>
                                    <span className="font-bold text-cyan-700 text-xs">
                                        {selectedLead.hunterConfidence ? `${Math.round(selectedLead.hunterConfidence * 100)}%` : 'High'}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                                    <span className="text-[10px] uppercase font-semibold text-stone-500 block">Qualification</span>
                                    <span className="font-bold text-indigo-700 text-xs">
                                        {selectedLead.hunterQualificationScore ? `${selectedLead.hunterQualificationScore}/100` : 'Qualified'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2">
                                <span className="text-base">📋</span>
                                <div>
                                    <span className="font-bold text-amber-900 block text-[11px]">Manager Operational Guidance</span>
                                    <p className="text-amber-800 text-[11px] mt-0.5 leading-normal">
                                        Contact prospect via phone/WhatsApp, confirm room &amp; vehicle requirement, and prepare customized quote. AI confidence is advisory—Manager remains the commercial decision-maker.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* 2b. SECTION: PIPELINE STATUS & FOLLOW-UP SCHEDULING */}
                <Card
                    title="Pipeline Status & Follow-Up Scheduling"
                    subtitle="Track customer lifecycle stage and schedule upcoming touchpoints"
                    headerAction={
                        selectedLead.followUpId ? (
                            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Ref: {selectedLead.followUpId}
                            </span>
                        ) : null
                    }
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <Select
                            label="Pipeline Stage"
                            name="status"
                            value={selectedLead.status || 'Pending'}
                            onChange={handleInputChange}
                        >
                            <option value="Pending">Pending (New Enquiry)</option>
                            <option value="In-Progress">In-Progress (Active Lead)</option>
                            <option value="Confirmed">Confirmed (Booked)</option>
                            <option value="Trip Started">Trip Started (On Tour)</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </Select>

                        <Input
                            label="Follow-Up Date"
                            type="date"
                            name="followUpDate"
                            value={safeDateOnly(selectedLead.followUpDate, '')}
                            onChange={handleInputChange}
                            helperText={selectedLead.followUpDate ? 'Follow-up scheduled' : 'Set date to schedule follow-up'}
                        />

                        <Select
                            label="Follow-Up Time Window"
                            name="followUpTime"
                            value={selectedLead.followUpTime || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Select time window...</option>
                            <option value="Morning (10:00 AM - 12:00 PM)">Morning (10:00 AM - 12:00 PM)</option>
                            <option value="Afternoon (12:00 PM - 03:00 PM)">Afternoon (12:00 PM - 03:00 PM)</option>
                            <option value="Evening (03:00 PM - 06:00 PM)">Evening (03:00 PM - 06:00 PM)</option>
                            <option value="Night (06:00 PM - 08:00 PM)">Night (06:00 PM - 08:00 PM)</option>
                        </Select>
                    </div>

                    <div className="pt-2">
                        <Input
                            label="Follow-Up Remarks / Action Notes"
                            name="remarks"
                            value={selectedLead.remarks || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. Follow up on finalized quote, confirm arrival train number and hotel preference"
                            helperText="Saving a scheduled follow-up automatically provisions a deterministic KV-F record sequence."
                        />
                    </div>
                </Card>

                {/* 3. SECTION: TRIP & ITINERARY */}
                <Card
                    title="Trip & Itinerary Requirements"
                    subtitle="Dates, guest capacity, and route scope"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <Input
                            label="Travel Date"
                            type="date"
                            name="date"
                            min={safeDateOnly(new Date())}
                            value={travelDateFormatted}
                            onChange={handleInputChange}
                        />
                        <Input
                            label="Trip Duration"
                            name="tripDuration"
                            value={selectedLead.tripDuration || '3 Days / 2 Nights'}
                            onChange={handleInputChange}
                            placeholder="e.g. 3 Days / 2 Nights"
                        />
                        <Input
                            label="Travelers (Pax)"
                            type="number"
                            name="travelers"
                            min="1"
                            value={selectedLead.travelers || '1'}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                        <Input
                            label="Pickup Location"
                            name="pickup"
                            value={selectedLead.pickup || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. Varanasi Airport / Cantt Stn"
                        />
                        <Input
                            label="Drop Location"
                            name="drop"
                            value={selectedLead.drop || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. Airport / Station"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                        <Input
                            label="Varanasi Destinations"
                            name="varanasiDestinations"
                            value={selectedLead.varanasiDestinations || selectedLead.destination || 'Kashi Vishwanath, Assi Ghat, Sarnath'}
                            onChange={handleInputChange}
                            placeholder="e.g. Kashi Vishwanath, Assi, Sarnath"
                        />
                        <Input
                            label="Outside Destinations (Optional)"
                            name="outsideDestinations"
                            value={selectedLead.outsideDestinations || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. Ayodhya, Prayagraj, Bodh Gaya"
                        />
                    </div>
                </Card>

                {/* 4. SECTION: SERVICE REQUIREMENTS */}
                <Card
                    title="Required Services"
                    subtitle="Check the services requested by the customer for quotation"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {reqServices.map((service) => {
                            const isChecked = Boolean(requirements[service.id] || (service.altId && requirements[service.altId]));
                            return (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => handleReqToggle(service.id, service.altId)}
                                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                                        isChecked
                                            ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-xs font-bold'
                                            : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2 truncate">
                                        <span className="text-base">{service.icon}</span>
                                        <span className="truncate">{service.label}</span>
                                    </div>
                                    <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                                        isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300'
                                    }`}>
                                        {isChecked ? '✓' : ''}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* 5. SECTION: CUSTOMER NOTES */}
                <Card
                    title="Customer Notes & Special Requests"
                    subtitle="Preferences, accessibility requests, or custom inclusions"
                >
                    <textarea
                        name="specialRequirements"
                        rows="3"
                        value={selectedLead.specialRequirements || ''}
                        onChange={handleInputChange}
                        placeholder="e.g. Senior citizens traveling, requires ground floor rooms and wheelchair access at temple..."
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none p-3 text-xs"
                    />
                </Card>

                {/* 6. SECTION: NEXT ACTION BANNER */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                    <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400 block">
                            Recommended Next Step
                        </span>
                        <h4 className="text-xs font-bold text-slate-100 mt-0.5">
                            Customer requirements ready? Build customized quote package
                        </h4>
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => onOpenQuoteBuilder && onOpenQuoteBuilder(selectedLead)}
                        icon={<span>📜</span>}
                        className="shadow-xs shrink-0"
                    >
                        Create Quote →
                    </Button>
                </div>
            </form>
        </Drawer>
    );
}

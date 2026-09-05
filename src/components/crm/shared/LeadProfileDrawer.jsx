import React from 'react';
import Drawer from '../ui/Drawer';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import Input, { Select } from '../ui/Input';
import Card from '../ui/Card';

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
    user: _user,
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
        const text = encodeURIComponent(`Namaste ${selectedLead.name} Ji! Thank you for contacting Varanasi Yatra. Regarding your travel enquiry for ${selectedLead.destination || 'Varanasi'}, how may we assist you today?`);
        window.open(`https://wa.me/${fullNumber}?text=${text}`, '_blank');
    };

    const handleCallClick = () => {
        if (!selectedLead.mobile) return;
        window.open(`tel:${selectedLead.mobile}`, '_self');
    };

    const travelDateFormatted = selectedLead.date
        ? new Date(selectedLead.date).toISOString().split('T')[0]
        : '';

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
                            <p className="text-xs text-slate-500">{selectedLead.city || selectedLead.destination || 'Varanasi Yatra Enquirer'}</p>
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
                    </div>
                </div>

                {/* 2. SECTION: CUSTOMER DETAILS */}
                <Card
                    title="Customer Information"
                    subtitle="Primary contact details and origin source"
                    headerAction={
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Source: {selectedLead.leadSource || 'Website'}
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
                            value={selectedLead.leadSource || (selectedLead.source === 'HOTEL_QR' ? 'QR' : 'Website')}
                            onChange={handleInputChange}
                            options={[
                                { value: 'Website', label: '🌐 Website Direct' },
                                { value: 'QR', label: '📱 QR Code Scan' },
                                { value: 'Offline/Manual', label: '📞 Offline / Direct Call' }
                            ]}
                        />

                        {/* Attribution Info Box if Hotel QR or Partner */}
                        {(selectedLead.source === 'HOTEL_QR' || selectedLead.partnerName) && (
                            <div className="col-span-full bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">🏨 Hotel Partner Acquisition</span>
                                    <span className="font-bold text-stone-900 text-sm">{selectedLead.partnerName || selectedLead.partnerId}</span>
                                    {selectedLead.qrId && <span className="text-stone-500 text-[11px] ml-2 font-mono">({selectedLead.qrId})</span>}
                                </div>
                                {selectedLead.landingPath && (
                                    <span className="text-[11px] text-stone-500 font-mono mt-1 sm:mt-0">
                                        Landing: {selectedLead.landingPath}
                                    </span>
                                )}
                            </div>
                        )}
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
                            min={new Date().toISOString().split('T')[0]}
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

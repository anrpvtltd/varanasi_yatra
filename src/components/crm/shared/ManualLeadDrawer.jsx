import React from 'react';

export default function ManualLeadDrawer({
    isManualOpen,
    setIsManualOpen,
    manualLead,
    handleManualInputChange,
    handleManualSubmit,
    isSavingManual,
    user
}) {
    if (!isManualOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
            {/* Backdrop closer */}
            <div className="absolute inset-0" onClick={() => setIsManualOpen(false)}></div>

            {/* Drawer Content */}
            <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-stone-200 relative z-10 transform translate-x-0 transition-transform duration-300">
                {/* Header Status Accent Strip */}
                <div className="h-2.5 w-full bg-gradient-to-r from-amber-500 to-orange-600"></div>

                {/* Drawer Header */}
                <div className="p-6 sm:p-8 pb-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/15">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900">➕ Add Manual Lead</h3>
                        <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mt-1">Record Offline Booking</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsManualOpen(false)}
                        className="text-stone-400 hover:text-stone-900 text-2xl font-bold cursor-pointer transition"
                    >
                        &times;
                    </button>
                </div>

                {/* Drawer Form */}
                <form onSubmit={handleManualSubmit} className="flex-1 flex flex-col justify-between overflow-hidden">
                    {/* Scrollable Form Body */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Customer Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={manualLead.name}
                                onChange={handleManualInputChange}
                                required
                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Mobile Number *</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={manualLead.mobile}
                                onChange={handleManualInputChange}
                                required
                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                placeholder="Enter 10-digit number"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={manualLead.email}
                                onChange={handleManualInputChange}
                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                placeholder="customer@email.com (optional)"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Travel Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={manualLead.date}
                                    onChange={handleManualInputChange}
                                    className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Travelers Count</label>
                                <input
                                    type="number"
                                    name="travelers"
                                    value={manualLead.travelers}
                                    onChange={handleManualInputChange}
                                    className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                    placeholder="1"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Lead Source *</label>
                            <select
                                name="leadSource"
                                value={manualLead.leadSource || 'Offline/Manual'}
                                onChange={handleManualInputChange}
                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm cursor-pointer"
                            >
                                <option value="Website">🌐 Website Enquiry</option>
                                <option value="QR">📱 QR Scan (Hotel / Shop)</option>
                                <option value="Offline/Manual">📞 Offline / Direct Call / Walk-in</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Pickup Location</label>
                                <input
                                    type="text"
                                    name="pickup"
                                    value={manualLead.pickup}
                                    onChange={handleManualInputChange}
                                    className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                    placeholder="Airport / Station"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Destination</label>
                                <input
                                    type="text"
                                    name="destination"
                                    value={manualLead.destination}
                                    onChange={handleManualInputChange}
                                    className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-bold focus:outline-none text-xs sm:text-sm"
                                    placeholder="Varanasi / Ayodhya"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Customer Requirements (For Quote)</label>
                            <input
                                type="text"
                                name="specialRequirements"
                                value={manualLead.specialRequirements || ''}
                                onChange={handleManualInputChange}
                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-2.5 bg-white text-stone-900 font-semibold focus:outline-none text-xs sm:text-sm mb-2"
                                placeholder="e.g. Car (7 Seater), 3-Star Hotel, VIP Darshan, Pandit"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Lead Status</label>
                            <select
                                name="status"
                                value={manualLead.status}
                                onChange={handleManualInputChange}
                                className="w-full border border-stone-200 rounded-xl p-3 bg-stone-50 text-stone-900 font-bold focus:ring-1 focus:ring-amber-500/50 focus:outline-none cursor-pointer"
                            >
                                <option value="Pending">🟡 Lead (New Enquiry)</option>
                                <option value="In-Progress">🔵 Follow-up (Discussion)</option>
                                <option value="Confirmed">🟢 Booking (Confirmed)</option>
                                <option value="Trip Started">🚖 Trip Started (Active)</option>
                                <option value="Completed">✅ Completed</option>
                                <option value="Cancelled">🔴 Cancelled</option>
                            </select>
                        </div>

                        {user && user.role === 'CEO' && (manualLead.status === 'Confirmed' || manualLead.status === 'Trip Started' || manualLead.status === 'Completed') && (
                            <div className="bg-emerald-50/40 p-4.5 rounded-2xl border border-emerald-100 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Total Package Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                        <input
                                            type="number"
                                            name="totalAmount"
                                            value={manualLead.totalAmount}
                                            onChange={handleManualInputChange}
                                            className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0 text-xs sm:text-sm"
                                            placeholder="Enter total amount"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5">Advance Token Received</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs">₹</span>
                                        <input
                                            type="number"
                                            name="advanceAmount"
                                            value={manualLead.advanceAmount}
                                            onChange={handleManualInputChange}
                                            className="w-full border border-stone-200 focus:border-emerald-500 rounded-xl pl-8 pr-4 py-2.5 bg-white text-stone-900 font-bold focus:outline-none focus:ring-0 text-xs sm:text-sm"
                                            placeholder="Enter advance received"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Internal Notes */}
                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">📝 Internal Notes</label>
                            <textarea
                                name="adminNotes"
                                value={manualLead.adminNotes}
                                onChange={handleManualInputChange}
                                rows="4"
                                className="w-full border border-stone-200 focus:border-amber-500 rounded-xl p-3.5 bg-white text-stone-900 font-semibold focus:outline-none transition-all text-xs sm:text-sm"
                                placeholder="Add booking notes, preferences, or offline context here..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Sticky Save actions Footer */}
                    <div className="p-6 border-t border-stone-100 bg-stone-50/40 flex space-x-3.5">
                        <button
                            type="button"
                            onClick={() => setIsManualOpen(false)}
                            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSavingManual}
                            className="flex-1 bg-stone-900 hover:bg-amber-600 text-white py-3.5 rounded-xl font-serif font-bold uppercase tracking-widest text-xs transition duration-200 shadow-md disabled:bg-stone-300 disabled:cursor-not-allowed"
                        >
                            {isSavingManual ? 'Saving...' : 'Save Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

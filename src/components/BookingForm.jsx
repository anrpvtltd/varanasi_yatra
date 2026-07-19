import React, { useState } from 'react';

export default function BookingForm({ containerClassName = '' }) {
    const [formData, setFormData] = useState({
        name: '', mobile: '', email: '', pickup: '', date: '', travelers: '1'
    });
    const [submitted, setSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (validationErrors[e.target.name]) {
            setValidationErrors(prev => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setValidationErrors({});

        const trimmedName = formData.name.trim();
        const trimmedMobile = formData.mobile.trim();
        const trimmedEmail = formData.email.trim();
        const trimmedPickup = formData.pickup.trim();
        const trimmedDate = formData.date.trim();
        const travelersVal = formData.travelers;

        const errors = {};
        if (!trimmedName) errors.name = "Name is required.";
        
        if (!trimmedMobile) {
            errors.mobile = "Mobile number is required.";
        } else if (!/^\d{10}$/.test(trimmedMobile)) {
            errors.mobile = "Mobile must contain exactly 10 digits.";
        }

        if (!trimmedEmail) {
            errors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            errors.email = "Please enter a valid email address.";
        }

        if (!trimmedPickup) errors.pickup = "Pickup location is required.";

        if (!trimmedDate) {
            errors.date = "Travel date is required.";
        } else {
            const selectedDate = new Date(trimmedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                errors.date = "Travel date cannot be in the past.";
            }
        }

        const travelersNum = Number(travelersVal) || 1;
        if (travelersNum < 1) errors.travelers = "Number of travelers must be at least 1.";

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            const firstErrKey = Object.keys(errors)[0];
            const errElement = document.getElementsByName(firstErrKey)[0];
            if (errElement) {
                errElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                errElement.focus();
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const response = await fetch(`${apiBaseUrl}/api/enquiry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: trimmedName,
                    mobile: trimmedMobile,
                    email: trimmedEmail,
                    pickup: trimmedPickup,
                    date: trimmedDate,
                    travelers: travelersVal
                }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setSubmitted(true);
                setFormData({ name: '', mobile: '', email: '', pickup: '', date: '', travelers: '1' });
                setTimeout(() => setSubmitted(false), 9000);
            } else {
                setErrorMsg(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setErrorMsg('Server connection failed. Please check if backend is running.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`bg-stone-950/65 backdrop-blur-md rounded-[28px] p-7 border border-amber-500/30 relative overflow-hidden text-left ${containerClassName}`}>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-center space-x-2 mb-1">
                    <span className="text-[9px] text-amber-500/60 font-serif border border-amber-500/30 px-1 py-0.5 rounded">BY</span>
                    <h2 className="text-xl font-serif font-bold text-amber-100 tracking-wide">Plan Your Perfect Trip</h2>
                    <span className="text-[9px] text-amber-500/60 font-serif border border-amber-500/30 px-1 py-0.5 rounded">DY</span>
                </div>
                <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto mb-6"></div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                    <div>
                        <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1 tracking-widest">Your Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full bg-black/40 border text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:bg-black/60 transition ${
                                validationErrors.name ? 'border-red-500' : 'border-stone-800 focus:border-amber-500/60'
                            }`}
                            placeholder="Enter full name"
                        />
                        {validationErrors.name && (
                            <p className="text-[10px] text-red-400 mt-1 font-medium">⚠️ {validationErrors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1 tracking-widest">Mobile Number</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                className={`w-full bg-black/40 border text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:bg-black/60 transition ${
                                    validationErrors.mobile ? 'border-red-500' : 'border-stone-800 focus:border-amber-500/60'
                                }`}
                                placeholder="10-digit mobile"
                            />
                            {validationErrors.mobile && (
                                <p className="text-[10px] text-red-400 mt-1 font-medium">⚠️ {validationErrors.mobile}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1 tracking-widest">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full bg-black/40 border text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:bg-black/60 transition ${
                                    validationErrors.email ? 'border-red-500' : 'border-stone-800 focus:border-amber-500/60'
                                }`}
                                placeholder="name@domain.com"
                            />
                            {validationErrors.email && (
                                <p className="text-[10px] text-red-400 mt-1 font-medium">⚠️ {validationErrors.email}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1 tracking-widest">Pickup Location</label>
                        <input
                            type="text"
                            name="pickup"
                            value={formData.pickup}
                            onChange={handleChange}
                            className={`w-full bg-black/40 border text-stone-200 placeholder-stone-600 p-2.5 text-xs rounded-xl focus:outline-none focus:bg-black/60 transition ${
                                validationErrors.pickup ? 'border-red-500' : 'border-stone-800 focus:border-amber-500/60'
                            }`}
                            placeholder="Varanasi Airport / Railway Station"
                        />
                        {validationErrors.pickup && (
                            <p className="text-[10px] text-red-400 mt-1 font-medium">⚠️ {validationErrors.pickup}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1 tracking-widest">Travel Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                style={{ colorScheme: 'dark' }}
                                className={`w-full bg-black/40 border text-stone-200 p-2.5 text-xs rounded-xl focus:outline-none focus:bg-black/60 transition cursor-pointer ${
                                    validationErrors.date ? 'border-red-500' : 'border-stone-800 focus:border-amber-500/60'
                                }`}
                            />
                            {validationErrors.date && (
                                <p className="text-[10px] text-red-400 mt-1 font-medium">⚠️ {validationErrors.date}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[9px] font-bold text-amber-500/80 uppercase mb-1 tracking-widest">No. of Travelers</label>
                            <select
                                name="travelers"
                                value={formData.travelers}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-stone-800 text-stone-300 p-2.5 text-xs rounded-xl focus:outline-none focus:border-amber-500/60 focus:bg-black/60 transition cursor-pointer"
                            >
                                <option value="1" className="bg-stone-900 text-white">1 Person</option>
                                <option value="2" className="bg-stone-900 text-white">2 Persons</option>
                                <option value="3-5" className="bg-stone-900 text-white">3 - 5 Persons</option>
                                <option value="6-10" className="bg-stone-900 text-white">6 - 10 Persons</option>
                                <option value="10+" className="bg-stone-900 text-white">Group (10+)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 bg-gradient-to-r from-orange-700 via-amber-700 to-amber-800 hover:from-orange-600 hover:to-amber-700 text-amber-50 font-serif font-bold uppercase tracking-widest text-xs py-3.5 rounded-xl shadow-[0_4px_20px_rgba(180,83,9,0.25)] border border-amber-600/30 transition-all duration-300 transform hover:scale-[1.01] cursor-pointer disabled:bg-stone-800 disabled:from-stone-800"
                    >
                        {isSubmitting ? 'Sending Request...' : 'Get Free Quote'}
                    </button>
                </form>

                <div className="mt-3 flex items-center justify-between text-[9px] text-amber-500/70 font-semibold tracking-wider uppercase border-t border-stone-900/60 pt-3 select-none">
                    <span>🛡️ Secure Enquiries</span>
                    <span>🔒 No Data Sharing</span>
                    <span>⚡ Fast Response</span>
                </div>

                {submitted && (
                    <div className="mt-4 p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl text-center font-medium space-y-1.5 animate-pulse">
                        <div className="text-sm font-bold">Thank You 🙏</div>
                        <p className="text-[11px] leading-relaxed">Our travel expert will contact you within 15 minutes.</p>
                        <p className="text-[10px] text-emerald-400 font-semibold">Meanwhile you can chat with us on WhatsApp.</p>
                    </div>
                )}

                {errorMsg && (
                    <div className="mt-4 p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-[11px] rounded-xl text-center font-medium">
                        ⚠️ {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}

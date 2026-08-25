import React, { useState } from 'react';

export default function DocumentGenerator({ userRole, onGenerate, loading }) {
    const [documentType, setDocumentType] = useState('TRAVEL_VOUCHER');
    const [bookingId, setBookingId] = useState('VY-B-2026-0042');
    const [taxMode, setTaxMode] = useState('NO_TAX');
    const [customerName, setCustomerName] = useState('Rahul Sharma');
    const [totalAmount, setTotalAmount] = useState('40000');
    const [paidAmount, setPaidAmount] = useState('15000');

    const availableDocTypes = [
        { id: 'TRAVEL_VOUCHER', name: 'Customer Travel Voucher', roleReq: 'Manager' },
        { id: 'BOOKING_CONFIRMATION', name: 'Booking Confirmation Sheet', roleReq: 'Manager' },
        { id: 'QUOTE_PDF', name: 'Quotation PDF Document', roleReq: 'Manager' },
        { id: 'PAYMENT_RECEIPT', name: 'Payment Receipt', roleReq: 'Manager' },
        { id: 'CUSTOMER_INVOICE', name: 'Customer Tax Invoice', roleReq: 'Manager' },
        { id: 'DRIVER_OPERATIONS_SHEET', name: 'Driver Pickup Sheet', roleReq: 'Manager' },
        { id: 'VENDOR_OPERATIONS_SHEET', name: 'Vendor Service Assignment', roleReq: 'Manager' },
        { id: 'INTERNAL_FINANCIAL_REPORT', name: 'CEO Internal Financial Audit Report 👑', roleReq: 'CEO' }
    ].filter(d => d.roleReq === 'Manager' || userRole === 'CEO');

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate({
            documentType,
            bookingId,
            taxMode,
            customData: {
                bookingId,
                customerName,
                totalAmount: Number(totalAmount) || 40000,
                paidAmount: Number(paidAmount) || 15000,
                remainingAmount: (Number(totalAmount) || 40000) - (Number(paidAmount) || 15000),
                taxMode
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2">Generate New Official Document</h3>

            <div>
                <label className="text-xs text-slate-400 block mb-1">Select Document Type:</label>
                <select
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                    {availableDocTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-slate-400 block mb-1">Booking Reference ID:</label>
                    <input
                        type="text"
                        value={bookingId}
                        onChange={e => setBookingId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                        placeholder="VY-B-2026-0042"
                        required
                    />
                </div>

                <div>
                    <label className="text-xs text-slate-400 block mb-1">Invoice Tax Mode:</label>
                    <select
                        value={taxMode}
                        onChange={e => setTaxMode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                    >
                        <option value="NO_TAX">NO_TAX (Default)</option>
                        <option value="GST_INCLUSIVE">GST_INCLUSIVE</option>
                        <option value="GST_EXCLUSIVE">GST_EXCLUSIVE</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-slate-400 block mb-1">Customer Name:</label>
                    <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 block mb-1">Package Price (₹):</label>
                    <input
                        type="number"
                        value={totalAmount}
                        onChange={e => setTotalAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 block mb-1">Amount Paid (₹):</label>
                    <input
                        type="number"
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-orange-400 transition-colors disabled:opacity-50"
            >
                {loading ? '⚡ Generating Document & Storing Snapshot...' : '📄 Generate Official Document'}
            </button>
        </form>
    );
}

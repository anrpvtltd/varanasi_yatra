import React from 'react';

export default function PaymentFollowupQueue({ paymentFollowups = [], onOpenBooking }) {
    if (!paymentFollowups || paymentFollowups.length === 0) {
        return (
            <div className="bg-stone-50 border border-dashed border-stone-200 p-6 rounded-3xl text-center text-stone-400 font-bold text-xs">
                ✅ No outstanding customer payments. All active bookings are fully paid!
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-widest">
                    💳 CUSTOMER PAYMENT FOLLOW-UP QUEUE ({paymentFollowups.length})
                </h3>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 text-[10px] uppercase text-stone-400 font-extrabold border-b border-stone-200">
                            <tr>
                                <th className="p-3">Booking #</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Package Price</th>
                                <th className="p-3">Amount Paid</th>
                                <th className="p-3">Amount Due</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                            {paymentFollowups.map((pf) => (
                                <tr key={pf.bookingId} className="hover:bg-stone-50/80 transition">
                                    <td className="p-3 font-extrabold text-stone-900">#{pf.bookingNumber}</td>
                                    <td className="p-3 font-bold text-stone-800">{pf.customerName}</td>
                                    <td className="p-3 font-bold text-stone-900">₹{pf.packagePrice?.toLocaleString('en-IN')}</td>
                                    <td className="p-3 font-bold text-emerald-700">₹{pf.totalPaid?.toLocaleString('en-IN')}</td>
                                    <td className="p-3 font-extrabold text-amber-800">₹{pf.customerDue?.toLocaleString('en-IN')}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                            pf.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {pf.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onOpenBooking && onOpenBooking({ _id: pf.bookingId })}
                                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs uppercase"
                                        >
                                            RECORD PAYMENT
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

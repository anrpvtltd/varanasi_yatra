import React, { useState } from 'react';

export default function QRReplacementModal({ isOpen, onClose, qrRecord, onReplacementSuccess }) {
    const [reason, setReason] = useState('Damaged physical poster replaced on-site');
    const [redirectActiveReplacement, setRedirectActiveReplacement] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !qrRecord) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await onReplacementSuccess({
                qrId: qrRecord.qrId,
                reason: reason.trim(),
                redirectActiveReplacement
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create replacement QR');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-serif font-bold text-stone-100">
                            Create Replacement QR Token
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                            Replaces <span className="font-mono text-amber-400 font-semibold">{qrRecord.qrId}</span> with the next sequential token.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 text-lg transition"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="bg-rose-900/30 border border-rose-800 text-rose-300 text-xs px-3.5 py-2.5 rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Historical Preservation Notice */}
                    <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                        <div className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
                            <span>🛡️</span>
                            <span>Historical Integrity Guarantee</span>
                        </div>
                        Old QR <span className="font-mono text-white font-semibold">{qrRecord.qrId}</span> will be preserved in the database. Historical scans ({qrRecord.scanCount || 0}), leads ({qrRecord.leadCount || 0}), and bookings ({qrRecord.bookingCount || 0}) remain intact.
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                            Replacement Reason / Notes
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Poster torn, rain damaged, shop relocated..."
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                            required
                        />
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-800 bg-stone-950 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={redirectActiveReplacement}
                            onChange={(e) => setRedirectActiveReplacement(e.target.checked)}
                            className="mt-0.5 accent-amber-500 rounded"
                        />
                        <div>
                            <span className="text-xs font-semibold text-stone-200 block">
                                Redirect Old QR URL to Replacement
                            </span>
                            <span className="text-[11px] text-stone-500 leading-tight block mt-0.5">
                                If an old flyer/photo of {qrRecord.qrId} is scanned, resolve to the new replacement QR.
                            </span>
                        </div>
                    </label>

                    <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xs px-5 py-2 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                        >
                            <span>🔄</span>
                            <span>{isSubmitting ? 'Allocating...' : 'Generate Replacement Token'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { crmApi } from '../../../services/crmApi';

export default function DocumentShareModal({ isOpen, onClose, document, token }) {
    const [expiresInHours, setExpiresInHours] = useState('24');
    const [maxDownloads, setMaxDownloads] = useState('5');
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !document) return null;

    const handleGenerateShareLink = async () => {
        setLoading(true);
        try {
            const res = await crmApi.shareDocument(token, document.documentId, {
                expiresInHours: Number(expiresInHours) || 24,
                maxDownloads: Number(maxDownloads) || 5
            });
            if (res.success) {
                setShareUrl(res.secureShareUrl);
            }
        } catch (e) {
            alert(e.message || "Failed to generate share link");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        🔗 Secure Document Share Link
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
                </div>

                <div className="text-xs text-slate-300">
                    Generating a temporary download link for <strong className="text-orange-400">{document.documentType}</strong> ({document.documentId}). Raw token is never stored in DB.
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Expiration Period:</label>
                        <select
                            value={expiresInHours}
                            onChange={e => setExpiresInHours(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                        >
                            <option value="1">1 Hour</option>
                            <option value="24">24 Hours (1 Day)</option>
                            <option value="168">7 Days</option>
                            <option value="720">30 Days</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Max Download Limit:</label>
                        <select
                            value={maxDownloads}
                            onChange={e => setMaxDownloads(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200"
                        >
                            <option value="1">1 Download</option>
                            <option value="3">3 Downloads</option>
                            <option value="5">5 Downloads</option>
                            <option value="0">Unlimited</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleGenerateShareLink}
                    disabled={loading}
                    className="w-full py-2 bg-orange-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-orange-400 transition-colors"
                >
                    {loading ? 'Generating Link...' : '⚡ Create Secure Download URL'}
                </button>

                {shareUrl && (
                    <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-[11px] text-slate-400 block">Generated Secure Public URL:</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-orange-400 font-mono"
                            />
                            <button
                                onClick={handleCopy}
                                className="px-3 py-1 bg-slate-800 text-slate-200 font-bold text-xs rounded hover:bg-slate-700"
                            >
                                {copied ? 'Copied! ✅' : '📋 Copy'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

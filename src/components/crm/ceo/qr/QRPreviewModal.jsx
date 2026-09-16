import React, { useState, useEffect } from 'react';
import { generateQRSvgString, generateQRPngDataUrl } from '../../../../utils/qrCodeGenerator';

export default function QRPreviewModal({ isOpen, onClose, qrRecord }) {
    const [qrSvg, setQrSvg] = useState('');
    const [copiedUrl, setCopiedUrl] = useState(false);

    const publicUrl = qrRecord?.landingUrl || (typeof window !== 'undefined' ? `${window.location.origin}/q/${qrRecord?.qrId}` : `https://varanasiyatra.com/q/${qrRecord?.qrId}`);

    useEffect(() => {
        if (qrRecord && qrRecord.qrId) {
            const svg = generateQRSvgString(publicUrl, 240);
            setQrSvg(svg);
        } else {
            setQrSvg('');
        }
        setCopiedUrl(false);
    }, [qrRecord, publicUrl]);

    if (!isOpen || !qrRecord) return null;

    const handleCopyUrl = () => {
        navigator.clipboard?.writeText(publicUrl);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleDownloadSvg = () => {
        if (!qrSvg) return;
        const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `KashiVashi_QR_${qrRecord.qrId}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPng = async () => {
        try {
            const dataUrl = await generateQRPngDataUrl(publicUrl, 600);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `KashiVashi_QR_${qrRecord.qrId}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error('PNG download error:', err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-amber-950/60 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-md font-semibold">
                                {qrRecord.qrId}
                            </span>
                            <span className="text-xs font-medium text-stone-400">
                                {qrRecord.areaName} · {qrRecord.qrType}
                            </span>
                        </div>
                        <h2 className="text-base font-serif font-bold text-stone-100 mt-1">
                            {qrRecord.venueName || qrRecord.placementName || 'Physical Poster Graphic'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 text-lg transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Body: Master Visual Poster Preview */}
                <div className="p-6 flex flex-col items-center bg-stone-950/50">
                    <div className="w-full max-w-xs bg-white text-stone-900 rounded-2xl p-6 shadow-xl border-4 border-amber-600/30 text-center relative overflow-hidden print:m-0 print:shadow-none">
                        {/* Poster Header */}
                        <div className="mb-3">
                            <div className="text-xs font-serif font-bold tracking-wider text-amber-700 uppercase">
                                काशी-वाशी · KASHI-VASHI
                            </div>
                            <div className="text-[11px] font-semibold text-stone-600 mt-0.5">
                                Verified Spiritual Concierge Desk
                            </div>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-white p-3 rounded-xl border border-stone-200 inline-block shadow-inner my-2">
                            <div
                                className="w-48 h-48 mx-auto flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                            />
                        </div>

                        {/* Location / Placement Badge */}
                        <div className="mt-2 text-xs font-semibold text-stone-800">
                            {qrRecord.venueName || qrRecord.areaName}
                        </div>
                        {qrRecord.placementName && (
                            <div className="text-[10px] text-stone-500 truncate max-w-xs mx-auto">
                                {qrRecord.placementName}
                            </div>
                        )}

                        {/* Action Callouts */}
                        <div className="mt-3 pt-2 border-t border-stone-200 text-[10px] text-stone-600 space-y-0.5">
                            <div>🕉️ VIP Sugam Darshan Guidance</div>
                            <div>⛵ Sunrise Private Boat on the Ganges</div>
                            <div>🚗 Transparent Fixed-Price Cabs</div>
                        </div>

                        {/* Token Identity Footer */}
                        <div className="mt-3 text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                            {qrRecord.qrId}
                        </div>
                    </div>

                    {/* URL Bar */}
                    <div className="w-full max-w-xs mt-4 flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-2">
                        <span className="text-stone-500 text-xs">🔗</span>
                        <input
                            type="text"
                            readOnly
                            value={publicUrl}
                            className="bg-transparent text-xs text-stone-300 font-mono w-full focus:outline-hidden"
                        />
                        <button
                            onClick={handleCopyUrl}
                            className="text-xs text-amber-400 hover:text-amber-300 font-medium whitespace-nowrap px-2 py-1 rounded-md hover:bg-stone-800 transition"
                        >
                            {copiedUrl ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 bg-stone-900">
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPng}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                            <span>📥</span>
                            <span>PNG</span>
                        </button>
                        <button
                            onClick={handleDownloadSvg}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                            <span>🎨</span>
                            <span>Vector SVG</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                            <span>🖨️</span>
                            <span>Print</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-900 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';

export default function AreaDetail({
    area,
    qrRecords = [],
    onBack,
    onAddQr,
    onPreviewQr,
    onInstallQr,
    onDamageQr,
    onReplaceQr,
    onDeactivateQr,
    isCeo = true
}) {
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const stats = area.stats || {};

    const filteredRecords = qrRecords.filter((qr) => {
        if (typeFilter !== 'ALL' && qr.qrType !== typeFilter) return false;
        if (statusFilter !== 'ALL' && qr.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                qr.qrId?.toLowerCase().includes(q) ||
                qr.venueName?.toLowerCase().includes(q) ||
                qr.placementName?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
            case 'INSTALLED':
                return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
            case 'DAMAGED':
                return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
            case 'REPLACEMENT_PENDING':
                return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
            case 'REPLACED':
                return 'bg-purple-950/60 text-purple-400 border-purple-800/60';
            case 'DRAFT':
            case 'GENERATED':
                return 'bg-stone-800 text-stone-300 border-stone-700';
            default:
                return 'bg-stone-800 text-stone-400 border-stone-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
                <div>
                    <button
                        onClick={onBack}
                        className="text-xs text-stone-400 hover:text-white flex items-center gap-1 mb-2 transition"
                    >
                        <span>←</span>
                        <span>Back to All Areas</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-serif font-bold text-stone-100">
                            {area.name}
                        </h1>
                        <span className="font-mono text-xs bg-amber-950/60 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded-md font-bold">
                            CODE: {area.code}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                area.status === 'ACTIVE'
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                    : 'bg-stone-800 text-stone-400'
                            }`}
                        >
                            {area.status}
                        </span>
                    </div>
                    {area.description && (
                        <p className="text-xs text-stone-400 mt-1 max-w-2xl">{area.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isCeo && (
                        <button
                            onClick={() => onAddQr(area._id)}
                            className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                            <span>➕</span>
                            <span>Add Physical QR</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Allowed Types Configuration Summary */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                        Allowed QR Categories in {area.name}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {(area.allowedQrTypes || []).map((t) => (
                            <span
                                key={t}
                                className="px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 text-xs font-mono font-medium border border-stone-700"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="text-[11px] text-stone-500 italic">
                    Restricted dynamically server-side: No unapproved QR types can be added here.
                </div>
            </div>

            {/* Area KPI Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                    <div className="text-stone-400 text-[10px] font-mono uppercase">Total QRs</div>
                    <div className="text-lg font-mono font-bold text-stone-100 mt-0.5">
                        {stats.totalQRs || qrRecords.length}
                    </div>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                    <div className="text-stone-400 text-[10px] font-mono uppercase">Active QRs</div>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                        {stats.activeQRs || qrRecords.filter((q) => q.status === 'ACTIVE').length}
                    </div>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                    <div className="text-stone-400 text-[10px] font-mono uppercase">Installed</div>
                    <div className="text-lg font-mono font-bold text-blue-400 mt-0.5">
                        {stats.installedQRs || qrRecords.filter((q) => q.status === 'INSTALLED').length}
                    </div>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                    <div className="text-stone-400 text-[10px] font-mono uppercase">Damaged</div>
                    <div className="text-lg font-mono font-bold text-rose-400 mt-0.5">
                        {stats.damagedQRs || qrRecords.filter((q) => q.status === 'DAMAGED').length}
                    </div>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                    <div className="text-stone-400 text-[10px] font-mono uppercase">Leads Generated</div>
                    <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                        {stats.leadCount || qrRecords.reduce((acc, q) => acc + (q.leadCount || 0), 0)}
                    </div>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                    <div className="text-stone-400 text-[10px] font-mono uppercase">Bookings Won</div>
                    <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                        {stats.bookingCount || qrRecords.reduce((acc, q) => acc + (q.bookingCount || 0), 0)}
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-stone-500 text-xs">🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search QR ID, venue..."
                            className="bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                    >
                        <option value="ALL">All Categories</option>
                        {(area.allowedQrTypes || []).map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INSTALLED">INSTALLED</option>
                        <option value="DAMAGED">DAMAGED</option>
                        <option value="REPLACEMENT_PENDING">REPLACEMENT_PENDING</option>
                        <option value="GENERATED">GENERATED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="REPLACED">REPLACED</option>
                        <option value="INACTIVE">INACTIVE</option>
                    </select>
                </div>
            </div>

            {/* QRs Table */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-stone-950/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                                <th className="p-3.5 pl-4">Physical QR ID</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Venue & Placement</th>
                                <th className="p-3.5 text-center">Status</th>
                                <th className="p-3.5 text-center">Permission</th>
                                <th className="p-3.5 text-center">Scans</th>
                                <th className="p-3.5 text-center text-emerald-400">Leads</th>
                                <th className="p-3.5 text-center text-cyan-400">Bookings</th>
                                <th className="p-3.5 text-center">Last Scan</th>
                                <th className="p-3.5 pr-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-stone-500">
                                        No QR records found in this area.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((qr) => (
                                    <tr key={qr.qrId} className="hover:bg-stone-800/40 transition">
                                        <td className="p-3.5 pl-4">
                                            <div className="font-mono font-bold text-amber-400 text-xs">
                                                {qr.qrId}
                                            </div>
                                            {qr.replacementOf && (
                                                <div className="text-[10px] text-stone-500 font-mono">
                                                    Repl of: {qr.replacementOf}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono text-[10px]">
                                                {qr.qrType}
                                            </span>
                                        </td>

                                        <td className="p-3.5">
                                            <div className="font-medium text-stone-200 text-xs">
                                                {qr.venueName || '—'}
                                            </div>
                                            {qr.placementName && (
                                                <div className="text-[11px] text-stone-400 truncate max-w-xs">
                                                    {qr.placementName}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-3.5 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getStatusBadge(
                                                    qr.status
                                                )}`}
                                            >
                                                {qr.status}
                                            </span>
                                        </td>

                                        <td className="p-3.5 text-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                                                    qr.permissionStatus === 'APPROVED'
                                                        ? 'bg-emerald-950/40 text-emerald-300'
                                                        : qr.permissionStatus === 'REJECTED'
                                                        ? 'bg-rose-950/40 text-rose-300'
                                                        : 'bg-stone-800 text-stone-400'
                                                }`}
                                            >
                                                {qr.permissionStatus}
                                            </span>
                                        </td>

                                        <td className="p-3.5 text-center font-mono font-semibold text-stone-200">
                                            {qr.scanCount || 0}
                                        </td>

                                        <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                                            {qr.leadCount || 0}
                                        </td>

                                        <td className="p-3.5 text-center font-mono font-bold text-cyan-400">
                                            {qr.bookingCount || 0}
                                        </td>

                                        <td className="p-3.5 text-center font-mono text-stone-400 text-[11px]">
                                            {qr.lastScannedAt
                                                ? new Date(qr.lastScannedAt).toLocaleDateString(undefined, {
                                                      month: 'short',
                                                      day: 'numeric'
                                                  })
                                                : 'Never'}
                                        </td>

                                        <td className="p-3.5 pr-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => onPreviewQr(qr)}
                                                    className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs transition"
                                                    title="Preview & Download Poster"
                                                >
                                                    Preview 🖨️
                                                </button>

                                                {/* Mark Installed */}
                                                {['DRAFT', 'GENERATED'].includes(qr.status) && (
                                                    <button
                                                        onClick={() => onInstallQr(qr)}
                                                        className="px-2 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 text-xs transition"
                                                        title="Mark Installed & Active"
                                                    >
                                                        Install
                                                    </button>
                                                )}

                                                {/* Mark Damaged */}
                                                {['ACTIVE', 'INSTALLED'].includes(qr.status) && (
                                                    <button
                                                        onClick={() => onDamageQr(qr)}
                                                        className="px-2 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900 text-rose-300 text-xs transition"
                                                        title="Report Physical Damage"
                                                    >
                                                        Damaged
                                                    </button>
                                                )}

                                                {/* Replace */}
                                                {['DAMAGED', 'REPLACEMENT_PENDING'].includes(qr.status) && (
                                                    <button
                                                        onClick={() => onReplaceQr(qr)}
                                                        className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xs transition"
                                                        title="Generate Sequential Replacement"
                                                    >
                                                        Replace 🔄
                                                    </button>
                                                )}

                                                {/* Deactivate */}
                                                {isCeo && qr.status !== 'INACTIVE' && (
                                                    <button
                                                        onClick={() => onDeactivateQr(qr)}
                                                        className="p-1 text-stone-500 hover:text-stone-300 transition"
                                                        title="Deactivate QR"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

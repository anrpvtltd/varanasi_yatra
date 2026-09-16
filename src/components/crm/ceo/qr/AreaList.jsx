import React, { useState } from 'react';

export default function AreaList({
    areas = [],
    onSelectArea,
    onAddArea,
    onEditArea,
    onToggleAreaStatus,
    isCeo = true
}) {
    const [search, setSearch] = useState('');

    const filteredAreas = areas.filter((a) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            a.name?.toLowerCase().includes(q) ||
            a.code?.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3 top-2.5 text-stone-500 text-xs">🔍</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search areas by name or code (e.g. Godaulia, GOD)..."
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                </div>

                {isCeo && (
                    <button
                        onClick={onAddArea}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <span>➕</span>
                        <span>Add New Area</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-stone-950/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                                <th className="p-3.5 pl-4">Area & Code</th>
                                <th className="p-3.5">Allowed Types</th>
                                <th className="p-3.5 text-center">Total QRs</th>
                                <th className="p-3.5 text-center">Active</th>
                                <th className="p-3.5 text-center">Installed</th>
                                <th className="p-3.5 text-center text-rose-400">Damaged</th>
                                <th className="p-3.5 text-center text-amber-400">Pending Rep</th>
                                <th className="p-3.5 text-center text-emerald-400">Leads</th>
                                <th className="p-3.5 text-center text-cyan-400">Bookings</th>
                                <th className="p-3.5 text-center">Status</th>
                                <th className="p-3.5 pr-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60">
                            {filteredAreas.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-stone-500">
                                        No areas found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredAreas.map((area) => {
                                    const stats = area.stats || {};
                                    return (
                                        <tr key={area._id} className="hover:bg-stone-800/40 transition">
                                            <td className="p-3.5 pl-4">
                                                <div className="font-serif font-bold text-stone-200 text-sm">
                                                    {area.name}
                                                </div>
                                                <div className="text-[11px] font-mono text-amber-400">
                                                    Code: {area.code}
                                                </div>
                                            </td>

                                            <td className="p-3.5">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {(area.allowedQrTypes || []).map((t) => (
                                                        <span
                                                            key={t}
                                                            className="px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[10px] font-mono"
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            <td className="p-3.5 text-center font-mono font-bold text-stone-200">
                                                {stats.totalQRs || 0}
                                            </td>

                                            <td className="p-3.5 text-center font-mono text-emerald-400">
                                                {stats.activeQRs || 0}
                                            </td>

                                            <td className="p-3.5 text-center font-mono text-blue-400">
                                                {stats.installedQRs || 0}
                                            </td>

                                            <td className="p-3.5 text-center font-mono text-rose-400">
                                                {stats.damagedQRs || 0}
                                            </td>

                                            <td className="p-3.5 text-center font-mono text-amber-400">
                                                {stats.pendingReplacementQRs || 0}
                                            </td>

                                            <td className="p-3.5 text-center font-mono font-bold text-emerald-300">
                                                {stats.leadCount || 0}
                                            </td>

                                            <td className="p-3.5 text-center font-mono font-bold text-cyan-300">
                                                {stats.bookingCount || 0}
                                            </td>

                                            <td className="p-3.5 text-center">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                                                        area.status === 'ACTIVE'
                                                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                                                    }`}
                                                >
                                                    {area.status}
                                                </span>
                                            </td>

                                            <td className="p-3.5 pr-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => onSelectArea(area)}
                                                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs transition"
                                                        title="Manage QRs in this Area"
                                                    >
                                                        Manage QRs ➔
                                                    </button>

                                                    {isCeo && (
                                                        <>
                                                            <button
                                                                onClick={() => onEditArea(area)}
                                                                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
                                                                title="Edit Area Details & Allowed Types"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => onToggleAreaStatus(area)}
                                                                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-amber-400 transition text-xs"
                                                                title={area.status === 'ACTIVE' ? 'Deactivate Area' : 'Activate Area'}
                                                            >
                                                                {area.status === 'ACTIVE' ? '⏸️' : '▶️'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

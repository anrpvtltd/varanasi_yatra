import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../../services/crmApi';

export default function QRAnalytics({ token, user, areas = [] }) {
    const [analytics, setAnalytics] = useState(null);
    const [selectedAreaId, setSelectedAreaId] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const isCeo = user?.role === 'CEO';

    const loadAnalytics = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        try {
            let res;
            if (selectedAreaId && selectedAreaId !== 'ALL') {
                res = await crmApi.fetchAreaQrAnalytics(token, selectedAreaId);
            } else {
                res = await crmApi.fetchQrAnalytics(token);
            }
            if (res.success && res.analytics) {
                setAnalytics(res.analytics);
            }
        } catch (err) {
            setError(err.message || 'Failed to load QR analytics');
        } finally {
            setIsLoading(false);
        }
    }, [token, selectedAreaId]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    if (isLoading) {
        return (
            <div className="py-16 text-center text-stone-400">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-mono uppercase tracking-wider">Aggregating QR Network Metrics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-rose-950/30 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {error}
            </div>
        );
    }

    const summary = analytics?.summary || {};
    const byArea = analytics?.byArea || [];
    const byType = analytics?.byType || [];
    const topQRs = analytics?.topQRs || [];

    const scanToLeadRate = summary.totalScans > 0
        ? ((summary.totalLeads / summary.totalScans) * 100).toFixed(1)
        : '0.0';

    const leadToBookingRate = summary.totalLeads > 0
        ? ((summary.totalBookings / summary.totalLeads) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
                <div>
                    <h2 className="text-lg font-serif font-bold text-stone-100">
                        Dynamic QR Performance & Revenue Analytics
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                        Real-time server aggregated funnel from physical scan to CRM lead to confirmed booking.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs font-mono text-stone-400">Filter Scope:</label>
                    <select
                        value={selectedAreaId}
                        onChange={(e) => setSelectedAreaId(e.target.value)}
                        className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                    >
                        <option value="ALL">Entire Varanasi Network</option>
                        {areas.map((a) => (
                            <option key={a._id} value={a._id}>
                                {a.name} ({a.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                    <div className="text-[11px] font-mono text-stone-400 uppercase">Total Scans</div>
                    <div className="text-2xl font-mono font-bold text-stone-100 mt-1">
                        {Number(summary.totalScans || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">Deduplicated physical scans</div>
                </div>

                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                    <div className="text-[11px] font-mono text-amber-400 uppercase">Leads Generated</div>
                    <div className="text-2xl font-mono font-bold text-amber-300 mt-1">
                        {Number(summary.totalLeads || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">{scanToLeadRate}% scan-to-lead</div>
                </div>

                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                    <div className="text-[11px] font-mono text-cyan-400 uppercase">Bookings Won</div>
                    <div className="text-2xl font-mono font-bold text-cyan-300 mt-1">
                        {Number(summary.totalBookings || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">{leadToBookingRate}% lead-to-booking</div>
                </div>

                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                    <div className="text-[11px] font-mono text-emerald-400 uppercase">Active Physical QRs</div>
                    <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                        {summary.activeQRs || 0}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">of {summary.totalQRs || 0} total tokens</div>
                </div>

                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
                    <div className="text-[11px] font-mono text-rose-400 uppercase">Attention Needed</div>
                    <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
                        {(summary.damagedQRs || 0) + (summary.pendingReplacementQRs || 0)}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">
                        {summary.damagedQRs || 0} damaged, {summary.pendingReplacementQRs || 0} pending rep
                    </div>
                </div>

                {isCeo && (
                    <div className="bg-gradient-to-br from-amber-950/40 to-stone-900 border border-amber-800/60 rounded-2xl p-4">
                        <div className="text-[11px] font-mono text-amber-400 uppercase font-semibold">Attributed Revenue</div>
                        <div className="text-2xl font-mono font-bold text-amber-200 mt-1">
                            ₹{Number(summary.totalRevenue || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-amber-400/80 mt-1">Finalized customer price</div>
                    </div>
                )}
            </div>

            {/* Performance By Category & By Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Breakdown by Category */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xs">
                    <h3 className="text-sm font-serif font-bold text-stone-200 mb-3 flex items-center justify-between">
                        <span>Performance by QR Category</span>
                        <span className="text-[10px] font-mono text-stone-400 font-normal">Controlled Enum</span>
                    </h3>
                    <div className="space-y-3">
                        {byType.length === 0 ? (
                            <div className="text-stone-500 text-xs py-4 text-center">No category data yet.</div>
                        ) : (
                            byType.map((t) => (
                                <div
                                    key={t._id}
                                    className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <div className="font-mono font-semibold text-stone-200 text-xs">
                                            {t._id}
                                        </div>
                                        <div className="text-[11px] text-stone-400 mt-0.5">
                                            {t.qrCount} physical QRs deployed
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <div className="text-[10px] text-stone-400 font-mono">SCANS</div>
                                            <div className="font-mono font-bold text-stone-200 text-xs">
                                                {t.scans || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-stone-400 font-mono">LEADS</div>
                                            <div className="font-mono font-bold text-amber-400 text-xs">
                                                {t.leads || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-stone-400 font-mono">BOOKINGS</div>
                                            <div className="font-mono font-bold text-cyan-400 text-xs">
                                                {t.bookings || 0}
                                            </div>
                                        </div>
                                        {isCeo && (
                                            <div>
                                                <div className="text-[10px] text-stone-400 font-mono">REVENUE</div>
                                                <div className="font-mono font-bold text-amber-300 text-xs">
                                                    ₹{Number(t.revenue || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Breakdown by Geographic Area */}
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xs">
                    <h3 className="text-sm font-serif font-bold text-stone-200 mb-3 flex items-center justify-between">
                        <span>Performance by Geographic Area</span>
                        <span className="text-[10px] font-mono text-stone-400 font-normal">QR Areas</span>
                    </h3>
                    <div className="space-y-3">
                        {byArea.length === 0 ? (
                            <div className="text-stone-500 text-xs py-4 text-center">No area data yet.</div>
                        ) : (
                            byArea.map((a) => (
                                <div
                                    key={a._id}
                                    className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <div className="font-serif font-bold text-stone-200 text-xs">
                                            {a.name || a._id}
                                        </div>
                                        <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                                            {a.qrCount} physical QRs
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <div className="text-[10px] text-stone-400 font-mono">SCANS</div>
                                            <div className="font-mono font-bold text-stone-200 text-xs">
                                                {a.scans || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-stone-400 font-mono">LEADS</div>
                                            <div className="font-mono font-bold text-amber-400 text-xs">
                                                {a.leads || 0}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-stone-400 font-mono">BOOKINGS</div>
                                            <div className="font-mono font-bold text-cyan-400 text-xs">
                                                {a.bookings || 0}
                                            </div>
                                        </div>
                                        {isCeo && (
                                            <div>
                                                <div className="text-[10px] text-stone-400 font-mono">REVENUE</div>
                                                <div className="font-mono font-bold text-amber-300 text-xs">
                                                    ₹{Number(a.revenue || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Top Individual Physical QRs */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-serif font-bold text-stone-200 mb-3 flex items-center justify-between">
                    <span>Top Performing Physical QR Placements</span>
                    <span className="text-[10px] font-mono text-stone-400 font-normal">Ranked by Leads Generated</span>
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-stone-950/60 border-b border-stone-800 text-stone-400 font-mono uppercase tracking-wider text-[11px]">
                                <th className="p-3 pl-4">Physical Token</th>
                                <th className="p-3">Area</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Venue / Placement</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Scans</th>
                                <th className="p-3 text-center text-emerald-400">Leads</th>
                                <th className="p-3 text-center text-cyan-400">Bookings</th>
                                {isCeo && <th className="p-3 pr-4 text-right text-amber-300">Revenue Won</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60">
                            {topQRs.length === 0 ? (
                                <tr>
                                    <td colSpan={isCeo ? 9 : 8} className="p-6 text-center text-stone-500">
                                        No active physical QR records.
                                    </td>
                                </tr>
                            ) : (
                                topQRs.map((qr) => (
                                    <tr key={qr.qrId} className="hover:bg-stone-800/40 transition">
                                        <td className="p-3 pl-4 font-mono font-bold text-amber-400">
                                            {qr.qrId}
                                        </td>
                                        <td className="p-3 text-stone-300">{qr.areaName}</td>
                                        <td className="p-3 font-mono text-stone-400 text-[10px]">{qr.qrType}</td>
                                        <td className="p-3 text-stone-200">
                                            <div>{qr.venueName || '—'}</div>
                                            {qr.placementName && (
                                                <div className="text-[10px] text-stone-500">{qr.placementName}</div>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                                                {qr.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center font-mono text-stone-300">{qr.scanCount || 0}</td>
                                        <td className="p-3 text-center font-mono font-bold text-emerald-400">
                                            {qr.leadCount || 0}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-cyan-400">
                                            {qr.bookingCount || 0}
                                        </td>
                                        {isCeo && (
                                            <td className="p-3 pr-4 text-right font-mono font-bold text-amber-300">
                                                ₹{Number(qr.revenueGenerated || 0).toLocaleString()}
                                            </td>
                                        )}
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

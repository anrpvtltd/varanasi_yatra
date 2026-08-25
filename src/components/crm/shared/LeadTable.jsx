import React from 'react';
import { computeLeadPriority } from '../../../utils/leadPriority';
import { getStatusStyle, getStatusLabel } from '../../../utils/formatters';

export default function LeadTable({ filteredLeads, loading, error, user, onOpenLead }) {
    const tierColors = {
        HOT: 'bg-rose-50 text-rose-700 border-rose-200',
        WARM: 'bg-amber-50 text-amber-700 border-amber-200',
        COLD: 'bg-slate-50 text-slate-500 border-slate-200'
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
                <div className="p-20 text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs uppercase tracking-widest font-bold text-slate-400 animate-pulse">Loading Operational Grid Records...</p>
                </div>
            ) : error ? (
                <div className="p-20 text-center text-rose-500 text-sm font-semibold select-none">
                    ⚠️ {error}
                </div>
            ) : filteredLeads.length === 0 ? (
                <div className="p-20 text-center text-slate-400 text-xs font-medium leading-relaxed select-none">
                    📭 No enquiries match your active filter/search query.
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse relative">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/85 text-slate-400 uppercase text-[10px] font-bold tracking-widest select-none sticky top-0 bg-opacity-95 backdrop-blur-xs z-10">
                                <th className="p-5">Customer & Origin</th>
                                <th className="p-5">Travel Plan & Destination</th>
                                <th className="p-5">Pipeline Status</th>
                                {user && user.role === 'CEO' && <th className="p-5">Financials</th>}
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                            {filteredLeads.map((lead) => {
                                const priorityInfo = computeLeadPriority(lead);
                                const tc = tierColors[priorityInfo.tier];
                                return (
                                    <tr key={lead._id} className="hover:bg-slate-50/40 even:bg-slate-50/10 transition duration-150">
                                        {/* Customer & Origin */}
                                        <td className="p-5 space-y-1.5">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-slate-900 text-base">{lead.name}</span>
                                                {lead.createdBy && (
                                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                                                        lead.createdBy === 'Website' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {lead.createdBy}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.302a12.01 12.01 0 01-5.3-5.3c-.44-.441-.274-.927.102-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                                    </svg>
                                                    <a href={`tel:${lead.mobile}`} className="hover:text-amber-600 hover:underline">{lead.mobile}</a>
                                                </div>

                                                {lead.email && lead.email !== 'offline-client@banarasyatra.com' && (
                                                    <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                        </svg>
                                                        <a href={`mailto:${lead.email}`} className="hover:text-amber-600 hover:underline">{lead.email}</a>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-0.5">
                                                <a
                                                    href={`https://wa.me/91${lead.mobile.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-all"
                                                >
                                                    <svg className="w-3 h-3 text-emerald-600 fill-current" viewBox="0 0 24 24">
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.412 1.451 5.428 0 9.845-4.414 9.848-9.847.002-2.632-1.023-5.105-2.887-6.97C17.152 1.922 14.68 .898 12.01 .898c-5.43 0-9.847 4.414-9.85 9.849-.001 1.932.501 3.815 1.455 5.421L2.642 22.28l6.005-1.574zM17.92 14.87c-.318-.16-1.877-.926-2.162-1.03-.285-.104-.493-.155-.7.156-.207.31-.8.926-.98 1.132-.18.207-.36.233-.678.074-1.69-.844-2.8-1.522-3.922-3.447-.297-.51.297-.474.85-1.583.093-.187.047-.35-.023-.454-.07-.104-.7-1.682-.958-2.306-.252-.603-.509-.522-.7-.522-.181-.001-.389-.001-.597-.001-.207 0-.544.078-.83.392-.285.31-1.088 1.065-1.088 2.597 0 1.532 1.114 3.013 1.27 3.22.155.207 2.193 3.349 5.313 4.699.742.32 1.322.512 1.774.656.745.237 1.423.204 1.959.124.598-.09 1.877-.767 2.137-1.474.26-.707.26-1.316.182-1.443-.078-.127-.285-.207-.604-.367z" />
                                                    </svg>
                                                    <span>WhatsApp Chat</span>
                                                </a>
                                            </div>
                                        </td>

                                        {/* Travel Plan & Destination */}
                                        <td className="p-5 space-y-1.5">
                                            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                                <span>{lead.date || 'Flexible Date'}</span>
                                            </div>

                                            <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                <span>📍 Pickup: <strong className="text-slate-700">{lead.pickup || 'Varanasi'}</strong></span>
                                            </div>

                                            <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-medium">
                                                <span>🗺️ Target: <strong className="text-amber-700">{lead.destination || 'Varanasi'}</strong> ({lead.travelers || '1'} Pax)</span>
                                            </div>
                                        </td>

                                        {/* Pipeline Status */}
                                        <td className="p-5">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all duration-150 select-none cursor-pointer ${getStatusStyle(lead.status)}`}>
                                                        {getStatusLabel(lead.status)}
                                                    </span>
                                                    {user && user.role === 'Manager' && (
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-extrabold tracking-wider ${tc} uppercase`}>
                                                            {priorityInfo.tier}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-1.5 pt-0.5">
                                                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                                                        Source: {lead.leadSource || lead.createdBy || 'Website'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>


                                        {/* Financial records */}
                                        {user && user.role === 'CEO' && (
                                            <td className="p-5 space-y-1 select-none">
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Package Value</span>
                                                    <span className="text-sm font-bold text-slate-900">₹{lead.totalAmount || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                                                    <span>Paid: <span className="font-bold text-slate-700">₹{lead.advanceAmount || 0}</span></span>
                                                    <span className={`px-1.5 py-0.5 rounded-md border font-bold ${
                                                        lead.remainingAmount > 0
                                                            ? 'bg-rose-50 text-rose-700 border-rose-100/80'
                                                            : 'bg-slate-50 text-slate-500 border-slate-200/60'
                                                    }`}>
                                                        Due: ₹{lead.remainingAmount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                        )}

                                        {/* Main Row CTA action */}
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => onOpenLead(lead)}
                                                className="bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition duration-200 cursor-pointer"
                                            >
                                                Open Profile
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

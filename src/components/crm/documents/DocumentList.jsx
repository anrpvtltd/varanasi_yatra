import React from 'react';
import DocumentStatusBadge from './DocumentStatusBadge';

export default function DocumentList({ documents, userRole, onView, onShare, onRegenerate, onArchive }) {
    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 text-xs border border-slate-800 rounded-xl bg-slate-950/40">
                No official documents generated yet. Use the "Generate Document" tab to create invoices, vouchers, or reports.
            </div>
        );
    }

    return (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
                <thead>
                    <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-mono">
                        <th className="p-3">Document ID</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Booking / Ref</th>
                        <th className="p-3">Version</th>
                        <th className="p-3">Generated Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                    {documents.map((doc) => (
                        <tr key={doc.documentId} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-3 font-mono font-medium text-slate-200">
                                <div>{doc.documentId}</div>
                                <div className="text-[10px] text-slate-500">{doc.fileName}</div>
                            </td>
                            <td className="p-3 font-semibold text-orange-400/90">
                                {doc.documentType}
                            </td>
                            <td className="p-3 text-slate-300 font-mono">
                                {doc.bookingId || doc.quoteId || 'N/A'}
                            </td>
                            <td className="p-3 font-mono text-slate-300">
                                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                                    V{doc.version || 1}
                                </span>
                                {doc.isLatest && <span className="ml-1 text-[9px] text-emerald-400">● Latest</span>}
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">
                                {new Date(doc.createdAt).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3">
                                <DocumentStatusBadge status={doc.status} />
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                                <button
                                    onClick={() => onView(doc)}
                                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-[11px]"
                                >
                                    👁️ View / Print
                                </button>
                                <button
                                    onClick={() => onShare(doc)}
                                    className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-colors text-[11px]"
                                >
                                    🔗 Share
                                </button>
                                <button
                                    onClick={() => onRegenerate(doc.documentId)}
                                    className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
                                    title="Regenerate Version V2"
                                >
                                    🔄
                                </button>
                                {userRole === 'CEO' && doc.status !== 'ARCHIVED' && (
                                    <button
                                        onClick={() => onArchive(doc.documentId)}
                                        className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors text-[11px]"
                                        title="Archive Document"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

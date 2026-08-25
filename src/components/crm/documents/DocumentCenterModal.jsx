import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import DocumentList from './DocumentList';
import DocumentGenerator from './DocumentGenerator';
import DocumentPreview from './DocumentPreview';
import DocumentShareModal from './DocumentShareModal';

export default function DocumentCenterModal({ isOpen, onClose, token, userRole }) {
    const [activeTab, setActiveTab] = useState('LIST'); // 'LIST', 'GENERATE', 'PREVIEW'
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [shareTargetDoc, setShareTargetDoc] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState('');

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await crmApi.fetchDocuments(token);
            if (res.success) {
                setDocuments(res.documents || []);
            }
        } catch (e) {
            console.error("Failed to fetch documents:", e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isOpen && token) {
            loadDocuments();
        }
    }, [isOpen, token, loadDocuments]);

    const handleGenerate = async (docPayload) => {
        setLoading(true);
        try {
            const res = await crmApi.generateDocument(token, docPayload);
            if (res.success) {
                setActionMsg(`${docPayload.documentType} generated successfully!`);
                loadDocuments();
                setActiveTab('LIST');
                setTimeout(() => setActionMsg(''), 3000);
            }
        } catch (e) {
            alert(e.message || "Failed to generate document");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async (documentId) => {
        try {
            setActionMsg(`Regenerating document ${documentId}...`);
            const res = await crmApi.regenerateDocument(token, documentId);
            if (res.success) {
                setActionMsg(`New version V${res.document.version} generated successfully!`);
                loadDocuments();
                setTimeout(() => setActionMsg(''), 3000);
            }
        } catch (e) {
            alert(e.message || "Regeneration failed");
        }
    };

    const handleArchive = async (documentId) => {
        if (userRole !== 'CEO') return;
        try {
            const res = await crmApi.archiveDocument(token, documentId);
            if (res.success) {
                setActionMsg(`Document ${documentId} archived.`);
                loadDocuments();
                setTimeout(() => setActionMsg(''), 3000);
            }
        } catch (e) {
            alert(e.message || "Archive failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Bar */}
                <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xl">
                            📄
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                Document Generation & Management Engine
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                    LocalPDFProvider Active
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">Invoices, Travel Vouchers & PDF Document Lifecycle</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {actionMsg && (
                    <div className="bg-orange-500/10 border-b border-orange-500/30 px-6 py-2 text-xs font-medium text-orange-300 text-center">
                        {actionMsg}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2">
                    {[
                        { id: 'LIST', label: '📜 All Generated Documents', count: documents.length },
                        { id: 'GENERATE', label: '⚡ Generate New Document' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedDoc(null); }}
                            className={`px-4 py-2.5 text-xs font-medium rounded-t-xl transition-colors border-t border-x border-transparent ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 border-slate-700 text-orange-400 font-semibold'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                        >
                            {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
                        </button>
                    ))}
                </div>

                {/* Tab Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-900/90 space-y-4">
                    {activeTab === 'LIST' && !selectedDoc && (
                        <DocumentList
                            documents={documents}
                            userRole={userRole}
                            onView={(doc) => setSelectedDoc(doc)}
                            onShare={(doc) => { setShareTargetDoc(doc); setIsShareModalOpen(true); }}
                            onRegenerate={handleRegenerate}
                            onArchive={handleArchive}
                        />
                    )}

                    {selectedDoc && (
                        <DocumentPreview
                            document={selectedDoc}
                            onClose={() => setSelectedDoc(null)}
                        />
                    )}

                    {activeTab === 'GENERATE' && (
                        <DocumentGenerator
                            userRole={userRole}
                            onGenerate={handleGenerate}
                            loading={loading}
                        />
                    )}
                </div>

                {/* Secure Share Modal */}
                <DocumentShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    document={shareTargetDoc}
                    token={token}
                />
            </div>
        </div>
    );
}

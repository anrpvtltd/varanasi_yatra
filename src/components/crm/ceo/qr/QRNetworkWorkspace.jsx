import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../../services/crmApi';
import AreaList from './AreaList';
import AreaDetail from './AreaDetail';
import QRList from './QRList';
import QRAnalytics from './QRAnalytics';
import CreateAreaModal from './CreateAreaModal';
import CreateQRModal from './CreateQRModal';
import QRPreviewModal from './QRPreviewModal';
import QRReplacementModal from './QRReplacementModal';

export default function QRNetworkWorkspace({ token, user }) {
    const isCeo = user?.role === 'CEO';

    const [activeTab, setActiveTab] = useState('AREAS'); // 'AREAS' | 'ALL_QRS' | 'ANALYTICS'
    const [areas, setAreas] = useState([]);
    const [qrRecords, setQrRecords] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal States
    const [isCreateAreaOpen, setIsCreateAreaOpen] = useState(false);
    const [editingArea, setEditingArea] = useState(null);

    const [isCreateQrOpen, setIsCreateQrOpen] = useState(false);
    const [preselectedAreaId, setPreselectedAreaId] = useState(null);

    const [previewQrRecord, setPreviewQrRecord] = useState(null);
    const [replacementQrRecord, setReplacementQrRecord] = useState(null);

    // Load Areas & QR Records
    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError('');
        try {
            const [areaRes, qrRes] = await Promise.all([
                crmApi.fetchQrAreas(token),
                crmApi.fetchQrRecords(token)
            ]);

            const areasList = Array.isArray(areaRes?.areas)
                ? areaRes.areas
                : (Array.isArray(areaRes?.data) ? areaRes.data : []);

            if (areaRes?.success && areasList) {
                setAreas(areasList);
                // Update selected area if open
                if (selectedArea) {
                    const updated = areasList.find((a) => a._id === selectedArea._id || a.id === selectedArea.id);
                    if (updated) setSelectedArea(updated);
                }
            }

            const qrsList = Array.isArray(qrRes?.records)
                ? qrRes.records
                : (Array.isArray(qrRes?.data) ? qrRes.data : []);

            if (qrRes?.success && qrsList) {
                setQrRecords(qrsList);
            }
        } catch (err) {
            setError(err.message || 'Failed to load QR Network data');
        } finally {
            setIsLoading(false);
        }
    }, [token, selectedArea]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    // Area Handlers
    const handleSaveArea = async (areaData) => {
        if (editingArea) {
            const res = await crmApi.updateQrArea(token, editingArea._id, areaData);
            if (res.success) {
                showSuccess(`Area "${areaData.name}" updated successfully.`);
                await loadData();
            }
        } else {
            const res = await crmApi.createQrArea(token, areaData);
            if (res.success) {
                showSuccess(`Area "${areaData.name}" created with code ${areaData.code}.`);
                await loadData();
            }
        }
    };

    const handleToggleAreaStatus = async (area) => {
        const nextStatus = area.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            const res = await crmApi.updateQrAreaStatus(token, area._id, nextStatus);
            if (res.success) {
                showSuccess(`Area ${area.name} marked as ${nextStatus}.`);
                await loadData();
            }
        } catch (err) {
            setError(err.message || 'Failed to update area status');
        }
    };

    // QR Handlers
    const handleCreateQr = async (qrData) => {
        const res = await crmApi.createQrRecord(token, qrData);
        if (res.success && res.qr) {
            showSuccess(`Generated physical QR token: ${res.qr.qrId}`);
            await loadData();
            // Automatically open preview for printing/downloading
            setPreviewQrRecord(res.qr);
        }
    };

    const handleInstallQr = async (qr) => {
        try {
            const res = await crmApi.markQrInstalled(token, qr.qrId, {
                remarks: `Installed by ${user?.name || user?.role}`
            });
            if (res.success) {
                showSuccess(`QR ${qr.qrId} installed and marked ACTIVE.`);
                await loadData();
            }
        } catch (err) {
            setError(err.message || 'Installation update failed');
        }
    };

    const handleDamageQr = async (qr) => {
        const reason = window.prompt(`Enter damage reason for ${qr.qrId}:`, 'Physical poster torn / faded');
        if (!reason) return;

        try {
            const res = await crmApi.markQrDamaged(token, qr.qrId, { reason });
            if (res.success) {
                showSuccess(`QR ${qr.qrId} marked as DAMAGED.`);
                await loadData();
            }
        } catch (err) {
            setError(err.message || 'Failed to mark QR damaged');
        }
    };

    const handleReplacementSuccess = async ({ qrId, reason, redirectActiveReplacement }) => {
        const res = await crmApi.createQrReplacement(token, qrId, {
            reason,
            redirectActiveReplacement
        });
        if (res.success && res.replacement) {
            showSuccess(`Created replacement token: ${res.replacement.qrId} for ${qrId}`);
            await loadData();
            setPreviewQrRecord(res.replacement);
        }
    };

    const handleDeactivateQr = async (qr) => {
        if (!window.confirm(`Are you sure you want to deactivate QR ${qr.qrId}?`)) return;
        try {
            const res = await crmApi.deactivateQr(token, qr.qrId, {
                reason: 'Manually deactivated by CEO'
            });
            if (res.success) {
                showSuccess(`QR ${qr.qrId} marked INACTIVE.`);
                await loadData();
            }
        } catch (err) {
            setError(err.message || 'Failed to deactivate QR');
        }
    };

    // Filter QRs for selected area
    const areaQrRecords = selectedArea
        ? qrRecords.filter((q) => q.areaId === selectedArea._id)
        : [];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🌐</span>
                        <h1 className="text-2xl font-serif font-bold text-stone-100">
                            Dynamic QR Network Control
                        </h1>
                        <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full font-bold uppercase">
                            {isCeo ? 'Executive Command' : 'Operations View'}
                        </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 max-w-2xl">
                        Physical node management across Varanasi. Configure areas, dynamic allowed QR types, physical placements, scan deduplication, and verified lead & booking attribution.
                    </p>
                </div>

                {isCeo && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setEditingArea(null);
                                setIsCreateAreaOpen(true);
                            }}
                            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                            <span>📍</span>
                            <span>New Area</span>
                        </button>
                        <button
                            onClick={() => {
                                setPreselectedAreaId(selectedArea ? selectedArea._id : null);
                                setIsCreateQrOpen(true);
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                            <span>✨</span>
                            <span>Generate QR</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Notifications */}
            {error && (
                <div className="bg-rose-950/40 border border-rose-800 text-rose-300 text-xs px-4 py-3 rounded-2xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-rose-400 hover:text-white">✕</button>
                </div>
            )}
            {successMessage && (
                <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs px-4 py-3 rounded-2xl flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">✕</button>
                </div>
            )}

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
                <button
                    onClick={() => {
                        setActiveTab('AREAS');
                        setSelectedArea(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        activeTab === 'AREAS'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                    }`}
                >
                    📍 Geographic Areas ({areas.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('ALL_QRS');
                        setSelectedArea(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        activeTab === 'ALL_QRS'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                    }`}
                >
                    🏷️ All Physical QRs ({qrRecords.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('ANALYTICS');
                        setSelectedArea(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                        activeTab === 'ANALYTICS'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                    }`}
                >
                    📊 Funnel & Revenue Analytics
                </button>
            </div>

            {/* Main Content Area */}
            {isLoading && !areas.length ? (
                <div className="py-20 text-center text-stone-500">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-mono uppercase tracking-wider">Loading Dynamic QR Network...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'AREAS' && !selectedArea && (
                        <AreaList
                            areas={areas}
                            onSelectArea={(area) => setSelectedArea(area)}
                            onAddArea={() => {
                                setEditingArea(null);
                                setIsCreateAreaOpen(true);
                            }}
                            onEditArea={(area) => {
                                setEditingArea(area);
                                setIsCreateAreaOpen(true);
                            }}
                            onToggleAreaStatus={handleToggleAreaStatus}
                            isCeo={isCeo}
                        />
                    )}

                    {activeTab === 'AREAS' && selectedArea && (
                        <AreaDetail
                            area={selectedArea}
                            qrRecords={areaQrRecords}
                            onBack={() => setSelectedArea(null)}
                            onAddQr={(areaId) => {
                                setPreselectedAreaId(areaId);
                                setIsCreateQrOpen(true);
                            }}
                            onPreviewQr={(qr) => setPreviewQrRecord(qr)}
                            onInstallQr={handleInstallQr}
                            onDamageQr={handleDamageQr}
                            onReplaceQr={(qr) => setReplacementQrRecord(qr)}
                            onDeactivateQr={handleDeactivateQr}
                            isCeo={isCeo}
                        />
                    )}

                    {activeTab === 'ALL_QRS' && (
                        <QRList
                            qrRecords={qrRecords}
                            areas={areas}
                            onPreviewQr={(qr) => setPreviewQrRecord(qr)}
                            onInstallQr={handleInstallQr}
                            onDamageQr={handleDamageQr}
                            onReplaceQr={(qr) => setReplacementQrRecord(qr)}
                            onDeactivateQr={handleDeactivateQr}
                            onAddQr={(areaId) => {
                                setPreselectedAreaId(areaId);
                                setIsCreateQrOpen(true);
                            }}
                            isCeo={isCeo}
                        />
                    )}

                    {activeTab === 'ANALYTICS' && (
                        <QRAnalytics
                            token={token}
                            user={user}
                            areas={areas}
                        />
                    )}
                </>
            )}

            {/* Modals */}
            <CreateAreaModal
                isOpen={isCreateAreaOpen}
                onClose={() => setIsCreateAreaOpen(false)}
                onSave={handleSaveArea}
                editingArea={editingArea}
            />

            <CreateQRModal
                isOpen={isCreateQrOpen}
                onClose={() => setIsCreateQrOpen(false)}
                onSave={handleCreateQr}
                areas={areas}
                preselectedAreaId={preselectedAreaId}
            />

            <QRPreviewModal
                isOpen={Boolean(previewQrRecord)}
                onClose={() => setPreviewQrRecord(null)}
                qrRecord={previewQrRecord}
            />

            <QRReplacementModal
                isOpen={Boolean(replacementQrRecord)}
                onClose={() => setReplacementQrRecord(null)}
                qrRecord={replacementQrRecord}
                onReplacementSuccess={handleReplacementSuccess}
            />
        </div>
    );
}

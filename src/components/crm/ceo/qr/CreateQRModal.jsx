import React, { useState, useEffect } from 'react';

const QR_TYPE_LABELS = {
    HOTEL: 'Hotel / Hospitality Partner',
    PAID_PLACEMENT: 'Paid Placement (Cafe/Shop)',
    PUBLIC_PLACE: 'Public Place (Ghat/Notice Board)',
    ROADSIDE: 'Roadside / Kiosk / Cart'
};

const PERMISSION_OPTIONS = [
    { value: 'NOT_REQUIRED', label: 'Not Required (Private premises / partner)' },
    { value: 'PENDING', label: 'Pending / Not yet applied' },
    { value: 'REQUESTED', label: 'Requested from local authority / owner' },
    { value: 'APPROVED', label: 'Approved (Permission granted)' },
    { value: 'REJECTED', label: 'Rejected (Do not install)' }
];

export default function CreateQRModal({ isOpen, onClose, onSave, areas = [], preselectedAreaId = null }) {
    const [areaId, setAreaId] = useState('');
    const [qrType, setQrType] = useState('');
    const [placementName, setPlacementName] = useState('');
    const [venueName, setVenueName] = useState('');
    const [partnerId, setPartnerId] = useState('');
    const [permissionStatus, setPermissionStatus] = useState('NOT_REQUIRED');
    const [notes, setNotes] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Active selected area
    const selectedArea = areas.find((a) => a._id === areaId) || null;

    useEffect(() => {
        if (isOpen) {
            const initialArea = preselectedAreaId
                ? areas.find((a) => a._id === preselectedAreaId)
                : areas[0];

            if (initialArea) {
                setAreaId(initialArea._id);
                setQrType(initialArea.allowedQrTypes?.[0] || 'HOTEL');
            } else {
                setAreaId('');
                setQrType('');
            }
            setPlacementName('');
            setVenueName('');
            setPartnerId('');
            setPermissionStatus('NOT_REQUIRED');
            setNotes('');
            setLatitude('');
            setLongitude('');
            setError('');
        }
    }, [isOpen, preselectedAreaId, areas]);

    // Update qrType if current is not in newly selected area's allowed types
    const handleAreaChange = (newAreaId) => {
        setAreaId(newAreaId);
        const area = areas.find((a) => a._id === newAreaId);
        if (area && area.allowedQrTypes && !area.allowedQrTypes.includes(qrType)) {
            setQrType(area.allowedQrTypes[0] || '');
        }
    };

    if (!isOpen) return null;

    const allowedTypes = selectedArea?.allowedQrTypes || [];

    const isPublicOrRoadside = qrType === 'PUBLIC_PLACE' || qrType === 'ROADSIDE';
    const showPermissionWarning = isPublicOrRoadside && permissionStatus !== 'APPROVED';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!areaId) {
            setError('Please select an Area.');
            return;
        }

        if (!qrType) {
            setError('Please select a QR Type.');
            return;
        }

        if (!venueName.trim() && !placementName.trim()) {
            setError('Please enter either a Venue Name or Placement Name.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                areaId,
                qrType,
                venueName: venueName.trim(),
                placementName: placementName.trim(),
                partnerId: partnerId.trim() || undefined,
                permissionStatus,
                notes: notes.trim(),
                latitude: latitude ? Number(latitude) : undefined,
                longitude: longitude ? Number(longitude) : undefined
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to generate QR token');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-stone-800 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
                    <div>
                        <h2 className="text-lg font-serif font-bold text-stone-100">
                            Generate Physical QR Token
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                            Allocates the next atomic sequence ID for this area & physical placement category.
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

                    {/* Area Selector */}
                    <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                            Target Geographic Area *
                        </label>
                        <select
                            value={areaId}
                            onChange={(e) => handleAreaChange(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm focus:border-amber-500 focus:outline-hidden"
                            required
                        >
                            {areas.map((a) => (
                                <option key={a._id} value={a._id}>
                                    {a.name} ({a.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* QR Type Selector (Filtered dynamically to Area's allowed types) */}
                    <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                            QR Type * (Strictly restricted to {selectedArea?.name || 'Area'} Allowed Types)
                        </label>
                        <select
                            value={qrType}
                            onChange={(e) => setQrType(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm focus:border-amber-500 focus:outline-hidden"
                            required
                        >
                            {allowedTypes.map((typeKey) => (
                                <option key={typeKey} value={typeKey}>
                                    {QR_TYPE_LABELS[typeKey] || typeKey}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-stone-400 mt-1">
                            Next token pattern: <span className="font-mono text-amber-400">{selectedArea?.code || 'AREA'}-{qrType ? qrType.substring(0, 4).toUpperCase() : 'TYPE'}-XXX</span>
                        </p>
                    </div>

                    {/* Venue & Placement */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-mono text-stone-400 mb-1">
                                Venue / Shop / Partner Name *
                            </label>
                            <input
                                type="text"
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                placeholder="e.g. Ganga Heritage Hotel, Raju Chai"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-stone-400 mb-1">
                                Placement Details (Free text)
                            </label>
                            <input
                                type="text"
                                value={placementName}
                                onChange={(e) => setPlacementName(e.target.value)}
                                placeholder="e.g. Front desk stand, Wall near tea counter"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    {/* Permission Status */}
                    <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                            Permission Tracking Status *
                        </label>
                        <select
                            value={permissionStatus}
                            onChange={(e) => setPermissionStatus(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                        >
                            {PERMISSION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {showPermissionWarning && (
                            <div className="mt-2 p-2 bg-amber-950/40 border border-amber-800/60 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                                <span>⚠️</span>
                                <span>
                                    Public place or roadside QRs require permission approval before installation can be marked active.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Coordinates (Optional) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-mono text-stone-400 mb-1">
                                Latitude (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="25.3176"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-stone-400 mb-1">
                                Longitude (Optional)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="82.9739"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                            Internal Field Notes / Campaign
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Physical inspection notes, poster dimensions..."
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                        />
                    </div>

                    <div className="pt-3 border-t border-stone-800 flex justify-end gap-2 sticky bottom-0 bg-stone-900">
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
                            <span>✨</span>
                            <span>{isSubmitting ? 'Allocating...' : 'Generate Unique QR Token'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';

const AVAILABLE_TYPES = [
    { id: 'HOTEL', label: 'Hotel / Hospitality Partner', desc: 'Hotel reception, guest desks, room key stands' },
    { id: 'PAID_PLACEMENT', label: 'Paid Placement', desc: 'Cafes, restaurants, shops, private counters' },
    { id: 'PUBLIC_PLACE', label: 'Public Place', desc: 'Ghats, public notice boards, tourist waiting spots' },
    { id: 'ROADSIDE', label: 'Roadside / Kiosk', desc: 'Tea stalls, crossing kiosks, auto stands' }
];

export default function CreateAreaModal({ isOpen, onClose, onSave, editingArea = null }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [allowedQrTypes, setAllowedQrTypes] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingArea) {
            setName(editingArea.name || '');
            setCode(editingArea.code || '');
            setDescription(editingArea.description || '');
            setAllowedQrTypes(editingArea.allowedQrTypes || []);
        } else {
            setName('');
            setCode('');
            setDescription('');
            setAllowedQrTypes([]);
        }
        setError('');
    }, [editingArea, isOpen]);

    if (!isOpen) return null;

    const toggleType = (typeId) => {
        setError('');
        setAllowedQrTypes((prev) => {
            if (prev.includes(typeId)) {
                return prev.filter((t) => t !== typeId);
            } else {
                return [...prev, typeId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Area name is required.');
            return;
        }

        if (!code.trim()) {
            setError('Area code is required (e.g. GOD, ASSI, LNK).');
            return;
        }

        if (allowedQrTypes.length === 0) {
            setError('Select at least one allowed QR type for this area.');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave({
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim(),
                allowedQrTypes
            });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save area');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-serif font-bold text-stone-100">
                            {editingArea ? `Edit Area: ${editingArea.name}` : 'Create New Area'}
                        </h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                            Define the physical geographic area and configure the specific QR types permitted here.
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-mono text-stone-400 mb-1">
                                Area Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Godaulia, Assi Ghat, Lanka"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm focus:border-amber-500 focus:outline-hidden"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-stone-400 mb-1">
                                Code * (2-5 letters)
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                placeholder="GOD"
                                maxLength={5}
                                disabled={Boolean(editingArea)}
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-sm font-mono uppercase focus:border-amber-500 focus:outline-hidden disabled:opacity-50"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-stone-400 mb-1">
                            Description / Geography Notes
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Key landmarks, tourist density, focal junctions..."
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 text-xs focus:border-amber-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1.5 font-semibold">
                            Allowed QR Types in this Area *
                        </label>
                        <p className="text-[11px] text-stone-400 mb-2.5">
                            Explicitly select ONLY the QR categories needed in this area. None are pre-selected by default.
                        </p>

                        <div className="space-y-2">
                            {AVAILABLE_TYPES.map((t) => {
                                const isChecked = allowedQrTypes.includes(t.id);
                                return (
                                    <label
                                        key={t.id}
                                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                                            isChecked
                                                ? 'bg-amber-950/20 border-amber-500/50 text-stone-100'
                                                : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleType(t.id)}
                                            className="mt-0.5 accent-amber-500 rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="text-xs font-semibold">{t.label}</div>
                                            <div className="text-[10px] text-stone-500">{t.desc}</div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
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
                            className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold text-xs px-5 py-2 rounded-xl transition shadow-sm disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : editingArea ? 'Save Changes' : 'Create Area'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

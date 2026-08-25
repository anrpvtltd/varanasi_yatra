import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';

export default function FileAttachmentManager({
    token,
    user,
    entityType = 'BOOKING',
    entityId = 'GLOBAL',
    title = 'File Attachments & Identity Proofs'
}) {
    const [attachments, setAttachments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const fetchAttachmentList = useCallback(async () => {
        if (!token || !entityId) return;
        setIsLoading(true);
        try {
            const res = await crmApi.fetchFiles(token, entityType, entityId);
            if (res.success) {
                setAttachments(res.attachments || []);
            }
        } catch (err) {
            console.error('Failed to load attachments:', err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, entityType, entityId]);

    useEffect(() => {
        fetchAttachmentList();
    }, [fetchAttachmentList]);

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError('');
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size exceeds maximum 10MB limit.');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const base64Data = reader.result;
                const res = await crmApi.uploadFile(token, {
                    base64Data,
                    originalName: file.name,
                    mimeType: file.type || 'application/pdf',
                    entityType,
                    entityId
                });

                if (res.success) {
                    await fetchAttachmentList();
                }
            } catch (err) {
                setUploadError(err.message || 'Upload failed');
            } finally {
                setIsUploading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleDelete = async (attachmentId) => {
        if (!window.confirm('Are you sure you want to delete this file attachment?')) return;
        try {
            const res = await crmApi.deleteFile(token, attachmentId);
            if (res.success) {
                await fetchAttachmentList();
            }
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('image')) return '🖼️';
        return '📁';
    };

    return (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-serif font-extrabold text-stone-900 uppercase tracking-wider">📎 {title}</h3>
                    <p className="text-[10px] text-stone-500 mt-0.5">Attach identity proofs, customer IDs, travel vouchers, or vendor contracts (PDF, PNG, JPG &lt; 10MB)</p>
                </div>
                <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1">
                    <span>{isUploading ? '⏳ Uploading...' : '📤 Attach File'}</span>
                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                    />
                </label>
            </div>

            {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                    ⚠️ {uploadError}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-4 text-xs text-stone-400">Loading attachments...</div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-5 border border-dashed border-stone-200 rounded-xl text-xs text-stone-400">
                    No file attachments uploaded for this record yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((att) => (
                        <div key={att.attachmentId} className="flex items-center justify-between bg-white border border-stone-200 p-3 rounded-xl hover:border-amber-400 transition-colors">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <span className="text-xl">{getFileIcon(att.mimeType)}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-stone-900 truncate">{att.originalName}</p>
                                    <p className="text-[10px] text-stone-400">
                                        {formatFileSize(att.fileSize)} · Uploaded by <span className="text-stone-600 font-bold">{att.uploadedBy}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <a
                                    href={`/admin/files/${att.attachmentId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold rounded-lg transition"
                                >
                                    ⬇️ Download
                                </a>
                                {(user?.role === 'CEO' || user?.role === 'Manager') && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(att.attachmentId)}
                                        className="p-1 text-stone-400 hover:text-rose-600 transition"
                                        title="Delete Attachment"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

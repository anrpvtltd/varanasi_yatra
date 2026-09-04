import React, { useState } from 'react';
import { crmApi } from '../../../services/crmApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function ChangePasswordModal({ isOpen, onClose, token, isForced = false, onSuccess }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        if (newPassword === currentPassword) {
            setError('New password cannot be the same as your current temporary password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await crmApi.changePassword(token, {
                currentPassword,
                newPassword
            });

            if (res.success) {
                setSuccess('Password updated successfully! Unlocking CRM...');
                setTimeout(() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setSuccess('');
                    if (onSuccess) {
                        onSuccess();
                    }
                    if (onClose) {
                        onClose();
                    }
                }, 1200);
            } else {
                setError(res.message || 'Failed to update password.');
            }
        } catch (err) {
            setError(err.message || 'Error occurred while updating password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={isForced ? () => {} : onClose}
            title={isForced ? "Set Permanent Account Password" : "Change Account Password"}
            size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-4 text-left p-1">
                {isForced && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed">
                        🛡️ <strong>First-Time Login:</strong> You signed in using a temporary password. You must establish a new permanent password before gaining access to the CRM workspace.
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                        ✅ {success}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {isForced ? "Current Temporary Password" : "Current Password"}
                    </label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        New Permanent Password (min. 8 characters)
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    {!isForced && (
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        disabled={isLoading}
                        className={`flex-1 font-bold ${isForced ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 w-full' : ''}`}
                    >
                        {isForced ? 'Set Password & Access CRM' : 'Update Password'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

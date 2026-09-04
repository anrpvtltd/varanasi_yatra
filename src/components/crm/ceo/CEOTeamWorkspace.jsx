import React, { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../../../services/crmApi';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import Modal from '../ui/Modal';
import { TableSkeleton } from '../ui/Skeleton';

/**
 * Generates a secure, cryptographically random temporary password
 * meeting enterprise complexity rules (uppercase, lowercase, numbers, special).
 */
function generateSecureTemporaryPassword() {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*';
    const all = uppercase + lowercase + numbers + symbols;

    const array = new Uint32Array(14);
    window.crypto.getRandomValues(array);

    // Ensure at least one from each group
    const chars = [
        uppercase[array[0] % uppercase.length],
        lowercase[array[1] % lowercase.length],
        numbers[array[2] % numbers.length],
        symbols[array[3] % symbols.length]
    ];

    for (let i = 4; i < 14; i++) {
        chars.push(all[array[i] % all.length]);
    }

    // Shuffle characters
    for (let i = chars.length - 1; i > 0; i--) {
        const j = array[i] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
}

export default function CEOTeamWorkspace({ token, user: currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Create User Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createRole, setCreateRole] = useState('Manager');
    const [createTempPassword, setCreateTempPassword] = useState('');
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Single-Reveal Password Modal (Shown ONCE upon creation or reset)
    const [revealModal, setRevealModal] = useState({
        isOpen: false,
        userName: '',
        userEmail: '',
        tempPassword: '',
        actionType: 'created', // 'created' | 'reset'
        copied: false
    });

    // Reset Password Modal State
    const [resetTargetUser, setResetTargetUser] = useState(null);
    const [resetTempPassword, setResetTempPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState('');

    // Status toggle in-progress IDs
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [feedbackMsg, setFeedbackMsg] = useState('');

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await crmApi.fetchUsers(token);
            if (res.success && Array.isArray(res.users)) {
                setUsers(res.users);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Handle Create User
    const handleOpenCreateModal = () => {
        setCreateName('');
        setCreateEmail('');
        setCreateRole('Manager');
        setCreateTempPassword(generateSecureTemporaryPassword());
        setCreateError('');
        setIsCreateOpen(true);
    };

    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        setCreateError('');

        if (!createName.trim() || !createEmail.trim()) {
            setCreateError('Full name and email address are required.');
            return;
        }

        if (!createTempPassword || createTempPassword.length < 8) {
            setCreateError('Temporary password must be at least 8 characters long.');
            return;
        }

        setIsCreating(true);
        try {
            const res = await crmApi.createUser(token, {
                name: createName.trim(),
                email: createEmail.trim().toLowerCase(),
                role: createRole,
                temporaryPassword: createTempPassword
            });

            if (res.success) {
                const savedTempPassword = createTempPassword;
                setIsCreateOpen(false);
                setCreateName('');
                setCreateEmail('');
                setCreateTempPassword('');

                // Trigger Single-Reveal Security Modal
                setRevealModal({
                    isOpen: true,
                    userName: res.user?.name || createName,
                    userEmail: res.user?.email || createEmail,
                    tempPassword: savedTempPassword,
                    actionType: 'created',
                    copied: false
                });

                loadUsers();
            } else {
                setCreateError(res.message || 'Failed to create user account.');
            }
        } catch (err) {
            setCreateError(err.message || 'Network error occurred while creating user.');
        } finally {
            setIsCreating(false);
        }
    };

    // Handle Status Toggle (Activate / Deactivate)
    const handleToggleStatus = async (user) => {
        const newStatus = !user.isActive;
        const confirmMsg = newStatus
            ? `Reactivate account for ${user.name} (${user.email})?`
            : `Deactivate account for ${user.name}? This will revoke active sessions and block login.`;

        if (!window.confirm(confirmMsg)) return;

        setStatusUpdatingId(user._id);
        try {
            const res = await crmApi.toggleUserStatus(token, user._id, newStatus);
            if (res.success) {
                setFeedbackMsg(`User ${user.name} ${newStatus ? 'activated' : 'deactivated'}.`);
                setTimeout(() => setFeedbackMsg(''), 3000);
                loadUsers();
            } else {
                alert(`⚠️ ${res.message || 'Failed to update user status.'}`);
            }
        } catch (err) {
            alert(`⚠️ Error updating user status: ${err.message}`);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    // Handle Reset Temporary Password
    const handleOpenResetModal = (user) => {
        setResetTargetUser(user);
        setResetTempPassword(generateSecureTemporaryPassword());
        setResetError('');
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!resetTargetUser) return;
        setResetError('');

        if (!resetTempPassword || resetTempPassword.length < 8) {
            setResetError('Temporary password must be at least 8 characters long.');
            return;
        }

        setIsResetting(true);
        try {
            const res = await crmApi.resetUserPassword(token, resetTargetUser._id, resetTempPassword);
            if (res.success) {
                const savedTempPassword = resetTempPassword;
                const target = resetTargetUser;
                setResetTargetUser(null);
                setResetTempPassword('');

                // Single-reveal modal
                setRevealModal({
                    isOpen: true,
                    userName: target.name,
                    userEmail: target.email,
                    tempPassword: savedTempPassword,
                    actionType: 'reset',
                    copied: false
                });

                loadUsers();
            } else {
                setResetError(res.message || 'Failed to reset user password.');
            }
        } catch (err) {
            setResetError(err.message || 'Error occurred while resetting password.');
        } finally {
            setIsResetting(false);
        }
    };

    // Copy temporary password
    const handleCopyTempPassword = () => {
        if (revealModal.tempPassword) {
            navigator.clipboard.writeText(revealModal.tempPassword);
            setRevealModal(prev => ({ ...prev, copied: true }));
            setTimeout(() => {
                setRevealModal(prev => ({ ...prev, copied: false }));
            }, 2000);
        }
    };

    const handleCloseRevealModal = () => {
        // Securely wipe plaintext temporary password from UI memory immediately upon dismissal
        setRevealModal({
            isOpen: false,
            userName: '',
            userEmail: '',
            tempPassword: '',
            actionType: 'created',
            copied: false
        });
    };

    // Filtered users
    const filteredUsers = users.filter(u => {
        if (roleFilter !== 'ALL' && u.role?.toUpperCase() !== roleFilter) return false;
        if (statusFilter === 'ACTIVE' && !u.isActive) return false;
        if (statusFilter === 'INACTIVE' && u.isActive) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const nameMatch = u.name?.toLowerCase().includes(q);
            const emailMatch = u.email?.toLowerCase().includes(q);
            if (!nameMatch && !emailMatch) return false;
        }
        return true;
    });

    const activeCount = users.filter(u => u.isActive).length;
    const pendingPasswordCount = users.filter(u => u.passwordChangeRequired).length;

    return (
        <div className="space-y-6 animate-fadeIn pb-12">
            {/* Header & Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md">
                            👥
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                                Team & User Management
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                Executive role management, temporary password provisioning, and credential security
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Button
                        variant="primary"
                        onClick={handleOpenCreateModal}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 px-4 py-2.5 rounded-xl text-sm flex items-center space-x-2"
                    >
                        <span>＋</span>
                        <span>Provision New User</span>
                    </Button>
                </div>
            </div>

            {/* Feedback Alert */}
            {feedbackMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium flex items-center space-x-2 animate-fadeIn">
                    <span>✅</span>
                    <span>{feedbackMsg}</span>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</div>
                    <div className="text-2xl font-black text-slate-100 mt-1">{users.length}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Managed CRM users</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Authorized to log in</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Managers</div>
                    <div className="text-2xl font-black text-blue-400 mt-1">
                        {users.filter(u => u.role?.toUpperCase() === 'MANAGER').length}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Commercial & ops managers</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password Pending</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">{pendingPasswordCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Must change on next login</div>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search team members by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CEO">CEO</option>
                        <option value="MANAGER">Manager</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-6">
                        <TableSkeleton rows={5} />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="text-3xl mb-2">👥</div>
                        <p className="font-semibold text-slate-700">No team members match your filter.</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or role filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 px-4">User Details</th>
                                    <th className="py-3.5 px-4">Role</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Password Status</th>
                                    <th className="py-3.5 px-4">Last Login</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {filteredUsers.map((u) => {
                                    const isSelf = String(currentUser?.id) === String(u._id) || String(currentUser?.email) === String(u.email);
                                    const isCEO = u.role?.toUpperCase() === 'CEO';

                                    return (
                                        <tr key={u._id || u.email} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                                    <span>{u.name}</span>
                                                    {isSelf && (
                                                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                    isCEO ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                }`}>
                                                    {isCEO ? '👑 CEO' : '💼 Manager'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {u.isActive ? (
                                                    <StatusBadge status="ACTIVE" customLabel="ACTIVE" />
                                                ) : (
                                                    <StatusBadge status="INACTIVE" customLabel="INACTIVE" />
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {u.passwordChangeRequired ? (
                                                    <span className="inline-flex items-center text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                                        ⏳ Change Pending
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                        ✓ Permanent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs text-slate-500">
                                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short'
                                                }) : (
                                                    <span className="text-slate-400 italic">Never</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center space-x-2">
                                                    {/* Password Reset Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenResetModal(u)}
                                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                                                        title="Assign temporary password and force change on next login"
                                                    >
                                                        🔑 Reset
                                                    </button>

                                                    {/* Toggle Status Button (Cannot deactivate own account) */}
                                                    {!isSelf && (
                                                        <button
                                                            type="button"
                                                            disabled={statusUpdatingId === u._id}
                                                            onClick={() => handleToggleStatus(u)}
                                                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition shadow-sm ${
                                                                u.isActive
                                                                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            {statusUpdatingId === u._id ? 'Updating...' : u.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Provision New User Account"
                size="md"
            >
                <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-left p-1">
                    {createError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {createError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Chandra"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="e.g. ramesh@banarasyatra.com"
                            value={createEmail}
                            onChange={(e) => setCreateEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Role Assignment
                        </label>
                        <select
                            value={createRole}
                            onChange={(e) => setCreateRole(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                        >
                            <option value="Manager">Manager (Commercial Quoting & Operations)</option>
                            <option value="CEO">CEO (Executive Authority & Financials)</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Temporary Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setCreateTempPassword(generateSecureTemporaryPassword())}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                            >
                                ⚡ Regenerate Secure Password
                            </button>
                        </div>
                        <input
                            type="text"
                            required
                            value={createTempPassword}
                            onChange={(e) => setCreateTempPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50 text-slate-900"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            🛡️ User will be forced to change this temporary password immediately upon first login.
                        </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsCreateOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isCreating}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                        >
                            {isCreating ? 'Provisioning...' : 'Provision User'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={Boolean(resetTargetUser)}
                onClose={() => setResetTargetUser(null)}
                title={`Reset Temporary Password — ${resetTargetUser?.name || ''}`}
                size="md"
            >
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left p-1">
                    {resetError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {resetError}
                        </div>
                    )}

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                        <strong>Security Notice:</strong> Setting a temporary password invalidates all current active sessions for <strong>{resetTargetUser?.email}</strong>. The user must establish a new permanent password on next login.
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                New Temporary Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setResetTempPassword(generateSecureTemporaryPassword())}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                            >
                                ⚡ Regenerate Password
                            </button>
                        </div>
                        <input
                            type="text"
                            required
                            value={resetTempPassword}
                            onChange={(e) => setResetTempPassword(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50 text-slate-900"
                        />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setResetTargetUser(null)}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isResetting}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                        >
                            {isResetting ? 'Setting...' : 'Set Temporary Password'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Single-Reveal Security Modal (Shown ONCE) */}
            <Modal
                isOpen={revealModal.isOpen}
                onClose={handleCloseRevealModal}
                title="Single-Reveal Temporary Credential"
                size="md"
            >
                <div className="space-y-4 text-left p-1">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                        ✓ Account credentials provisioned for <strong>{revealModal.userName}</strong> ({revealModal.userEmail}).
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-white">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                            Temporary Password (Shown Once Only)
                        </div>
                        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span id="single-reveal-temp-password" className="font-mono text-base font-bold text-amber-300 select-all tracking-wider">
                                {revealModal.tempPassword}
                            </span>
                            <button
                                type="button"
                                onClick={handleCopyTempPassword}
                                className="text-xs font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-md transition shadow"
                            >
                                {revealModal.copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs space-y-1">
                        <p className="font-bold text-slate-800">⚠️ Critical Security Rules:</p>
                        <p>1. Safely provide this temporary password to the team member.</p>
                        <p>2. The user will be required to create a new password immediately upon first login.</p>
                        <p>3. Once you close this modal, this plaintext temporary password will be permanently erased from UI memory.</p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            variant="primary"
                            onClick={handleCloseRevealModal}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
                        >
                            I Have Copied The Password · Dismiss
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

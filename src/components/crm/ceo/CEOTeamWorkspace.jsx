import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

    const chars = [
        uppercase[array[0] % uppercase.length],
        lowercase[array[1] % lowercase.length],
        numbers[array[2] % numbers.length],
        symbols[array[3] % symbols.length]
    ];

    for (let i = 4; i < 14; i++) {
        chars.push(all[array[i] % all.length]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
        const j = array[i] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
}

export default function CEOTeamWorkspace({ token, user: currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'table'
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Create User Modal State (CEO cannot be created here!)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createRole, setCreateRole] = useState('MANAGER');
    const [createReportsTo, setCreateReportsTo] = useState('');
    const [createTeamName, setCreateTeamName] = useState('');
    const [createAssignedAreas, setCreateAssignedAreas] = useState('');
    const [createMaxActiveLeads, setCreateMaxActiveLeads] = useState(50);
    const [createTempPassword, setCreateTempPassword] = useState('');
    const [createError, setCreateError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit User Modal State
    const [editTargetUser, setEditTargetUser] = useState(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editReportsTo, setEditReportsTo] = useState('');
    const [editTeamName, setEditTeamName] = useState('');
    const [editAssignedAreas, setEditAssignedAreas] = useState('');
    const [editMaxActiveLeads, setEditMaxActiveLeads] = useState(50);
    const [editStatus, setEditStatus] = useState('ACTIVE');
    const [editError, setEditError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Single-Reveal Password Modal (Shown ONCE upon creation or reset)
    const [revealModal, setRevealModal] = useState({
        isOpen: false,
        userName: '',
        userEmail: '',
        tempPassword: '',
        actionType: 'created',
        copied: false
    });

    // Reset Password Modal State
    const [resetTargetUser, setResetTargetUser] = useState(null);
    const [resetTempPassword, setResetTempPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState('');

    // Feedback Alert
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

    // Handle Open Create Modal
    const handleOpenCreateModal = () => {
        setCreateName('');
        setCreateEmail('');
        setCreateRole('MANAGER');
        // Default reports to CEO if available
        const ceo = users.find(u => u.role?.toUpperCase() === 'CEO');
        setCreateReportsTo(ceo ? (ceo.id || ceo._id) : '');
        setCreateTeamName('');
        setCreateAssignedAreas('');
        setCreateMaxActiveLeads(50);
        setCreateTempPassword(generateSecureTemporaryPassword());
        setCreateError('');
        setIsCreateOpen(true);
    };

    // Role selection changes in Create Modal -> auto adjust valid reportsTo default
    const handleRoleChange = (newRole) => {
        setCreateRole(newRole);
        if (newRole === 'MANAGER') {
            const ceo = users.find(u => u.role?.toUpperCase() === 'CEO');
            setCreateReportsTo(ceo ? (ceo.id || ceo._id) : '');
        } else if (newRole === 'TEAM_LEADER') {
            const firstManager = users.find(u => u.role?.toUpperCase() === 'MANAGER');
            const ceo = users.find(u => u.role?.toUpperCase() === 'CEO');
            setCreateReportsTo(firstManager ? (firstManager.id || firstManager._id) : (ceo ? (ceo.id || ceo._id) : ''));
        } else if (newRole === 'TEAM_MEMBER') {
            const firstLeader = users.find(u => u.role?.toUpperCase() === 'TEAM_LEADER');
            const firstManager = users.find(u => u.role?.toUpperCase() === 'MANAGER');
            setCreateReportsTo(firstLeader ? (firstLeader.id || firstLeader._id) : (firstManager ? (firstManager.id || firstManager._id) : ''));
        }
    };

    // Submit Create User
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

        const areas = createAssignedAreas
            .split(',')
            .map(a => a.trim())
            .filter(Boolean);

        setIsCreating(true);
        try {
            const res = await crmApi.createUser(token, {
                name: createName.trim(),
                email: createEmail.trim().toLowerCase(),
                role: createRole,
                reportsTo: createReportsTo || null,
                assignment: {
                    teamName: createTeamName.trim(),
                    assignedAreas: areas,
                    maxActiveLeads: Number(createMaxActiveLeads) || 50
                },
                temporaryPassword: createTempPassword
            });

            if (res.success) {
                const savedTempPassword = createTempPassword;
                setIsCreateOpen(false);

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

    // Open Edit Modal
    const handleOpenEditModal = (user) => {
        setEditTargetUser(user);
        setEditName(user.name || '');
        setEditRole(user.role?.toUpperCase() || 'MANAGER');
        setEditReportsTo(user.reportsTo?._id || user.reportsTo?.id || user.reportsTo || '');
        setEditTeamName(user.assignment?.teamName || '');
        setEditAssignedAreas((user.assignment?.assignedAreas || []).join(', '));
        setEditMaxActiveLeads(user.assignment?.maxActiveLeads || 50);
        setEditStatus(user.status || (user.isActive ? 'ACTIVE' : 'INACTIVE'));
        setEditError('');
    };

    // Submit Edit User
    const handleEditUserSubmit = async (e) => {
        e.preventDefault();
        if (!editTargetUser) return;
        setEditError('');

        const areas = editAssignedAreas
            .split(',')
            .map(a => a.trim())
            .filter(Boolean);

        setIsEditing(true);
        try {
            const res = await crmApi.updateUser(token, editTargetUser.id || editTargetUser._id, {
                name: editName.trim(),
                role: editRole,
                reportsTo: editReportsTo || null,
                assignment: {
                    teamName: editTeamName.trim(),
                    assignedAreas: areas,
                    maxActiveLeads: Number(editMaxActiveLeads) || 50
                },
                status: editStatus
            });

            if (res.success) {
                setEditTargetUser(null);
                setFeedbackMsg(`User ${editName} updated successfully.`);
                setTimeout(() => setFeedbackMsg(''), 3000);
                loadUsers();
            } else {
                setEditError(res.message || 'Failed to update user account.');
            }
        } catch (err) {
            setEditError(err.message || 'Error updating user account.');
        } finally {
            setIsEditing(false);
        }
    };

    // Handle Activate / Deactivate
    const handleToggleStatus = async (user) => {
        const isCurrentActive = user.isActive && user.status !== 'INACTIVE' && user.status !== 'SUSPENDED';
        const targetId = user.id || user._id;

        const confirmMsg = isCurrentActive
            ? `Deactivate account for ${user.name}? This will revoke active sessions and block login.`
            : `Reactivate account for ${user.name} (${user.email})?`;

        if (!window.confirm(confirmMsg)) return;

        setStatusUpdatingId(targetId);
        try {
            const res = isCurrentActive
                ? await crmApi.deactivateUser(token, targetId)
                : await crmApi.activateUser(token, targetId);

            if (res.success) {
                setFeedbackMsg(`User ${user.name} ${isCurrentActive ? 'deactivated' : 'activated'}.`);
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
            const res = await crmApi.resetUserPassword(token, resetTargetUser.id || resetTargetUser._id, resetTempPassword);
            if (res.success) {
                const savedTempPassword = resetTempPassword;
                const target = resetTargetUser;
                setResetTargetUser(null);
                setResetTempPassword('');

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
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const role = (u.role || '').toUpperCase();
            if (roleFilter !== 'ALL' && role !== roleFilter) return false;
            const active = u.isActive && u.status !== 'INACTIVE' && u.status !== 'SUSPENDED';
            if (statusFilter === 'ACTIVE' && !active) return false;
            if (statusFilter === 'INACTIVE' && active) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = u.name?.toLowerCase().includes(q);
                const emailMatch = u.email?.toLowerCase().includes(q);
                const teamMatch = u.assignment?.teamName?.toLowerCase().includes(q);
                if (!nameMatch && !emailMatch && !teamMatch) return false;
            }
            return true;
        });
    }, [users, roleFilter, statusFilter, searchQuery]);

    // Build Hierarchy Tree:
    // CEO -> Managers -> Team Leaders -> Team Members
    const hierarchy = useMemo(() => {
        const ceos = users.filter(u => (u.role || '').toUpperCase() === 'CEO');
        const managers = users.filter(u => (u.role || '').toUpperCase() === 'MANAGER');
        const teamLeaders = users.filter(u => (u.role || '').toUpperCase() === 'TEAM_LEADER');
        const teamMembers = users.filter(u => (u.role || '').toUpperCase() === 'TEAM_MEMBER');

        return {
            ceos,
            managers: managers.map(mgr => {
                const mgrId = String(mgr.id || mgr._id);
                // Leaders reporting to this manager
                const leaders = teamLeaders.filter(tl => {
                    const repId = tl.reportsTo?._id || tl.reportsTo?.id || tl.reportsTo;
                    return String(repId) === mgrId;
                }).map(leader => {
                    const leaderId = String(leader.id || leader._id);
                    // Members reporting to this leader
                    const members = teamMembers.filter(tm => {
                        const repId = tm.reportsTo?._id || tm.reportsTo?.id || tm.reportsTo;
                        return String(repId) === leaderId;
                    });
                    return { ...leader, members };
                });

                // Direct members reporting to manager without leader
                const directMembers = teamMembers.filter(tm => {
                    const repId = tm.reportsTo?._id || tm.reportsTo?.id || tm.reportsTo;
                    return String(repId) === mgrId;
                });

                return { ...mgr, leaders, directMembers };
            }),
            // Leaders reporting directly to CEO
            directLeaders: teamLeaders.filter(tl => {
                const repId = tl.reportsTo?._id || tl.reportsTo?.id || tl.reportsTo;
                const isMgr = managers.some(m => String(m.id || m._id) === String(repId));
                return !isMgr;
            }).map(leader => {
                const leaderId = String(leader.id || leader._id);
                const members = teamMembers.filter(tm => {
                    const repId = tm.reportsTo?._id || tm.reportsTo?.id || tm.reportsTo;
                    return String(repId) === leaderId;
                });
                return { ...leader, members };
            }),
            // Unassigned / Floating Members
            unassignedMembers: teamMembers.filter(tm => {
                const repId = tm.reportsTo?._id || tm.reportsTo?.id || tm.reportsTo;
                const hasLeader = teamLeaders.some(l => String(l.id || l._id) === String(repId));
                const hasManager = managers.some(m => String(m.id || m._id) === String(repId));
                return !hasLeader && !hasManager;
            })
        };
    }, [users]);

    const activeCount = users.filter(u => u.isActive && u.status !== 'INACTIVE' && u.status !== 'SUSPENDED').length;
    const managersCount = users.filter(u => (u.role || '').toUpperCase() === 'MANAGER').length;
    const leadersCount = users.filter(u => (u.role || '').toUpperCase() === 'TEAM_LEADER').length;
    const membersCount = users.filter(u => (u.role || '').toUpperCase() === 'TEAM_MEMBER').length;

    // Helper: Role badge styling
    const getRoleBadge = (role) => {
        const norm = (role || '').toUpperCase();
        switch (norm) {
            case 'CEO':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">👑 CEO</span>;
            case 'MANAGER':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">💼 Manager</span>;
            case 'TEAM_LEADER':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">⭐ Team Leader</span>;
            case 'TEAM_MEMBER':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">👤 Member</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">{norm}</span>;
        }
    };

    // User Card for Hierarchy Tree
    const UserNodeCard = ({ user, _level = 0 }) => {
        const isSelf = String(currentUser?.id) === String(user.id || user._id);
        const isActive = user.isActive && user.status !== 'INACTIVE' && user.status !== 'SUSPENDED';

        return (
            <div className={`p-4 rounded-xl border transition-all ${
                isSelf ? 'bg-amber-50/70 border-amber-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
            }`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{user.name}</span>
                            {isSelf && (
                                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                                    You
                                </span>
                            )}
                            {getRoleBadge(user.role)}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">{user.email}</div>

                        {/* Team Assignment metadata */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                            {user.assignment?.teamName && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                                    🏢 {user.assignment.teamName}
                                </span>
                            )}
                            {Array.isArray(user.assignment?.assignedAreas) && user.assignment.assignedAreas.length > 0 && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    📍 {user.assignment.assignedAreas.join(', ')}
                                </span>
                            )}
                            {user.activeLeadsCount !== undefined && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">
                                    🎯 {user.activeLeadsCount} active leads
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end space-y-2 shrink-0">
                        {isActive ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ● ACTIVE
                            </span>
                        ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                ○ {user.status || 'INACTIVE'}
                            </span>
                        )}

                        <div className="flex items-center space-x-1.5">
                            <button
                                type="button"
                                onClick={() => handleOpenEditModal(user)}
                                className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenResetModal(user)}
                                className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                                title="Reset Temporary Password"
                            >
                                🔑 Reset
                            </button>
                            {!isSelf && (
                                <button
                                    type="button"
                                    disabled={statusUpdatingId === (user.id || user._id)}
                                    onClick={() => handleToggleStatus(user)}
                                    className={`text-xs font-semibold px-2 py-1 rounded border transition ${
                                        isActive
                                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    }`}
                                >
                                    {isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                                Team Hierarchy & Organization
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                Executive hierarchy control: Managers, Team Leaders, and Operations Specialists
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* View Mode Toggle */}
                    <div className="bg-slate-800 p-1 rounded-xl flex items-center space-x-1 border border-slate-700 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('tree')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                viewMode === 'tree' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            🌳 Tree Hierarchy
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition ${
                                viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            📋 Directory Table
                        </button>
                    </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</div>
                    <div className="text-2xl font-black text-slate-100 mt-1">{users.length}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Managed accounts</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{activeCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Authorized to access</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Managers</div>
                    <div className="text-2xl font-black text-blue-400 mt-1">{managersCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Commercial ops</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Leaders</div>
                    <div className="text-2xl font-black text-purple-400 mt-1">{leadersCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Operations supervisors</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Members</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{membersCount}</div>
                    <div className="text-[11px] text-slate-500 mt-1">Assigned specialists</div>
                </div>
            </div>

            {/* Filters and Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search by name, email, or team name..."
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
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="ALL">All Roles</option>
                        <option value="CEO">CEO</option>
                        <option value="MANAGER">Managers</option>
                        <option value="TEAM_LEADER">Team Leaders</option>
                        <option value="TEAM_MEMBER">Team Members</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive / Suspended</option>
                    </select>
                </div>
            </div>

            {/* Main Content: Tree View vs Table View */}
            {loading ? (
                <TableSkeleton rows={6} />
            ) : viewMode === 'tree' ? (
                /* 🌳 Organization Tree Hierarchy */
                <div className="space-y-6">
                    {/* Level 0: Executive / CEO */}
                    <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/60 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="text-base">👑</span>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Executive Leadership
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {hierarchy.ceos.map(ceo => (
                                <UserNodeCard key={ceo.id || ceo._id} user={ceo} level={0} />
                            ))}
                        </div>
                    </div>

                    {/* Level 1: Managers & Cascading Branches */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 px-1">
                            <span className="text-base">💼</span>
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                Operational Management & Teams
                            </h2>
                        </div>

                        {hierarchy.managers.length === 0 && (
                            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                                No managers provisioned yet.
                            </div>
                        )}

                        {hierarchy.managers.map(mgr => (
                            <div key={mgr.id || mgr._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                                {/* Manager Card */}
                                <UserNodeCard user={mgr} level={1} />

                                {/* Sub-Branches under this Manager */}
                                <div className="pl-6 border-l-2 border-slate-200 ml-4 space-y-4">
                                    {/* Team Leaders */}
                                    {mgr.leaders.map(leader => (
                                        <div key={leader.id || leader._id} className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-slate-400 font-mono">└──</span>
                                                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                                                    Team Leader Branch: {leader.assignment?.teamName || leader.name}
                                                </span>
                                            </div>
                                            <UserNodeCard user={leader} level={2} />

                                            {/* Team Members under this Leader */}
                                            {leader.members.length > 0 && (
                                                <div className="pl-6 border-l-2 border-purple-200 ml-4 space-y-2">
                                                    {leader.members.map(member => (
                                                        <div key={member.id || member._id} className="flex items-start space-x-2">
                                                            <span className="text-xs text-slate-400 font-mono mt-4">└──</span>
                                                            <div className="flex-1">
                                                                <UserNodeCard user={member} level={3} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Direct Members reporting to Manager */}
                                    {mgr.directMembers.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Direct Reporting Members
                                            </div>
                                            {mgr.directMembers.map(member => (
                                                <UserNodeCard key={member.id || member._id} user={member} level={2} />
                                            ))}
                                        </div>
                                    )}

                                    {mgr.leaders.length === 0 && mgr.directMembers.length === 0 && (
                                        <div className="text-xs text-slate-400 italic pl-2">
                                            No team leaders or members currently assigned under this manager.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Direct Leaders under CEO (if any) */}
                    {hierarchy.directLeaders.length > 0 && (
                        <div className="bg-purple-50/40 border border-purple-200 rounded-2xl p-5 space-y-3">
                            <h2 className="text-sm font-bold text-purple-900 uppercase tracking-wider">
                                ⭐ Direct Team Leaders (Reporting to Executive)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {hierarchy.directLeaders.map(leader => (
                                    <UserNodeCard key={leader.id || leader._id} user={leader} level={1} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unassigned Floating Members (if any) */}
                    {hierarchy.unassignedMembers.length > 0 && (
                        <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 space-y-3">
                            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                                ⚠️ Floating Members (Pending Reporting Assignment)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {hierarchy.unassignedMembers.map(member => (
                                    <UserNodeCard key={member.id || member._id} user={member} level={1} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* 📋 Directory Table View */
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">User</th>
                                    <th className="py-3 px-4">Role</th>
                                    <th className="py-3 px-4">Reporting To</th>
                                    <th className="py-3 px-4">Team & Area</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Active Leads</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredUsers.map(u => {
                                    const isSelf = String(currentUser?.id) === String(u.id || u._id);
                                    const isActive = u.isActive && u.status !== 'INACTIVE' && u.status !== 'SUSPENDED';

                                    return (
                                        <tr key={u.id || u._id || u.email} className="hover:bg-slate-50/80 transition-colors">
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
                                                {getRoleBadge(u.role)}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs">
                                                {u.reportsTo ? (
                                                    <div>
                                                        <span className="font-semibold text-slate-800">{u.reportsTo.name}</span>
                                                        <span className="text-[10px] text-slate-400 block">({u.reportsTo.role})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">None (Executive)</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs">
                                                <div className="font-medium text-slate-800">{u.assignment?.teamName || '—'}</div>
                                                <div className="text-[11px] text-slate-400">
                                                    {Array.isArray(u.assignment?.assignedAreas) && u.assignment.assignedAreas.length > 0
                                                        ? u.assignment.assignedAreas.join(', ')
                                                        : 'No areas assigned'}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {isActive ? (
                                                    <StatusBadge status="ACTIVE" customLabel="ACTIVE" />
                                                ) : (
                                                    <StatusBadge status="INACTIVE" customLabel={u.status || 'INACTIVE'} />
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                                                {u.activeLeadsCount || 0} leads
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="inline-flex items-center space-x-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(u)}
                                                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenResetModal(u)}
                                                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                                                        title="Assign temporary password"
                                                    >
                                                        🔑 Reset
                                                    </button>
                                                    {!isSelf && (
                                                        <button
                                                            type="button"
                                                            disabled={statusUpdatingId === (u.id || u._id)}
                                                            onClick={() => handleToggleStatus(u)}
                                                            className={`text-xs font-semibold px-2 py-1 rounded-lg border transition shadow-sm ${
                                                                isActive
                                                                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                            }`}
                                                        >
                                                            {isActive ? 'Deactivate' : 'Activate'}
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
                </div>
            )}

            {/* Create User Modal (CEO role is omitted per Prompt 3 requirements) */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Provision New Organization Account"
                size="md"
            >
                <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-left p-1">
                    {createError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {createError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Role Assignment
                            </label>
                            <select
                                value={createRole}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                            >
                                <option value="MANAGER">Manager (Commercial & Operations)</option>
                                <option value="TEAM_LEADER">Team Leader (Operations & Lead Assignment)</option>
                                <option value="TEAM_MEMBER">Team Member (Assigned Execution & Follow-ups)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Reports To (Superior)
                            </label>
                            <select
                                value={createReportsTo}
                                onChange={(e) => setCreateReportsTo(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                            >
                                <option value="">None (Executive / Independent)</option>
                                {users.filter(u => {
                                    const r = (u.role || '').toUpperCase();
                                    if (createRole === 'MANAGER') return r === 'CEO';
                                    if (createRole === 'TEAM_LEADER') return r === 'MANAGER' || r === 'CEO';
                                    if (createRole === 'TEAM_MEMBER') return r === 'TEAM_LEADER' || r === 'MANAGER';
                                    return true;
                                }).map(u => (
                                    <option key={u.id || u._id} value={u.id || u._id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Team Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Heritage Operations Team"
                                value={createTeamName}
                                onChange={(e) => setCreateTeamName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Assigned Areas (comma-separated)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Ghats, Sarnath, Kashi"
                                value={createAssignedAreas}
                                onChange={(e) => setCreateAssignedAreas(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
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
                                ⚡ Regenerate
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
                            🛡️ User will be forced to change this password upon first login.
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

            {/* Edit User Modal */}
            <Modal
                isOpen={Boolean(editTargetUser)}
                onClose={() => setEditTargetUser(null)}
                title={`Edit User Account — ${editTargetUser?.name || ''}`}
                size="md"
            >
                <form onSubmit={handleEditUserSubmit} className="space-y-4 text-left p-1">
                    {editError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {editError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Role
                            </label>
                            <select
                                value={editRole}
                                disabled={editTargetUser?.role?.toUpperCase() === 'CEO'}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                {editTargetUser?.role?.toUpperCase() === 'CEO' && <option value="CEO">CEO</option>}
                                <option value="MANAGER">Manager</option>
                                <option value="TEAM_LEADER">Team Leader</option>
                                <option value="TEAM_MEMBER">Team Member</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Reports To
                            </label>
                            <select
                                value={editReportsTo}
                                disabled={editTargetUser?.role?.toUpperCase() === 'CEO'}
                                onChange={(e) => setEditReportsTo(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                <option value="">None (Direct Executive)</option>
                                {users.filter(u => String(u.id || u._id) !== String(editTargetUser?.id || editTargetUser?._id)).map(u => (
                                    <option key={u.id || u._id} value={u.id || u._id}>
                                        {u.name} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Account Status
                            </label>
                            <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Team Name
                            </label>
                            <input
                                type="text"
                                value={editTeamName}
                                onChange={(e) => setEditTeamName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Assigned Areas
                            </label>
                            <input
                                type="text"
                                value={editAssignedAreas}
                                onChange={(e) => setEditAssignedAreas(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditTargetUser(null)}
                            disabled={isEditing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isEditing}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                        >
                            {isEditing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Single-Reveal Temporary Password Security Modal */}
            <Modal
                isOpen={revealModal.isOpen}
                onClose={handleCloseRevealModal}
                title="🔐 Sensitive Credential Provisioning"
                size="md"
            >
                <div className="space-y-4 text-left p-1">
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 text-xs space-y-1">
                        <div className="font-bold flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>SECURITY NOTICE: SINGLE-REVEAL CREDENTIAL</span>
                        </div>
                        <p className="text-slate-700">
                            This temporary password is displayed <strong>exactly once</strong> and cannot be retrieved later. Copy and transmit it securely to the authorized user.
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-sm">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">User:</span>
                            <span className="font-bold text-slate-900">{revealModal.userName}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">Email:</span>
                            <span className="font-mono text-slate-700">{revealModal.userEmail}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200">
                            <span className="block text-xs font-semibold text-slate-500 mb-1">Temporary Password:</span>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={revealModal.tempPassword}
                                    className="flex-1 px-3 py-2 text-base font-mono font-black rounded-lg border border-slate-300 bg-white text-slate-900 tracking-wider select-all"
                                />
                                <Button
                                    type="button"
                                    onClick={handleCopyTempPassword}
                                    className={`px-3 py-2 text-xs font-bold rounded-lg ${
                                        revealModal.copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'
                                    }`}
                                >
                                    {revealModal.copied ? '✓ Copied!' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleCloseRevealModal}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                        >
                            I have securely shared this password
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={Boolean(resetTargetUser)}
                onClose={() => setResetTargetUser(null)}
                title={`Reset Password — ${resetTargetUser?.name || ''}`}
                size="md"
            >
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left p-1">
                    {resetError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                            ⚠️ {resetError}
                        </div>
                    )}

                    <p className="text-xs text-slate-600">
                        Setting a temporary password invalidates all existing sessions for this user. The user will be required to create a new password immediately upon logging in.
                    </p>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Temporary Password
                            </label>
                            <button
                                type="button"
                                onClick={() => setResetTempPassword(generateSecureTemporaryPassword())}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                            >
                                ⚡ Regenerate
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
        </div>
    );
}

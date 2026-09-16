/**
 * User Lifecycle & Team Hierarchy Management Routes
 * Varanasi Yatra Platform — Prompt 3
 */

const bcrypt = require('bcryptjs');
const { ROLES, normalizeRole } = require('../../auth/roles');
const { validateHierarchy, getEffectivePermissions } = require('../../auth/authorization');

function registerUserRoutes(app, { User, AuthSession, Enquiry, authenticateToken, requireRole, _requirePermission }) {

    /**
     * Helper: check if a user is the last active CEO
     */
    async function isLastActiveCEO(targetUserId) {
        const activeCEOs = await User.find({
            role: { $in: ['CEO', 'ceo'] },
            $or: [
                { isActive: true },
                { status: 'ACTIVE' }
            ]
        }).lean();

        if (activeCEOs.length <= 1) {
            const onlyCEO = activeCEOs[0];
            if (onlyCEO && String(onlyCEO._id) === String(targetUserId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 👥 GET /admin/users
     * Returns full user directory with hierarchy and assignment metadata (CEO only)
     */
    app.get('/admin/users', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const users = await User.find({})
                .populate('reportsTo', 'name email role')
                .select('name email role status isActive assignment permissions reportsTo createdAt lastLoginAt passwordChangeRequired')
                .sort({ createdAt: -1 })
                .lean();

            // Calculate active lead counts for each user if Enquiry model exists
            let leadCountsMap = {};
            if (Enquiry) {
                try {
                    const leadCounts = await Enquiry.aggregate([
                        {
                            $match: {
                                assignedTo: { $ne: null },
                                status: { $nin: ['WON', 'LOST', 'ARCHIVED', 'CANCELLED', 'Closed', 'completed'] }
                            }
                        },
                        {
                            $group: {
                                _id: '$assignedTo',
                                count: { $sum: 1 }
                            }
                        }
                    ]);
                    leadCounts.forEach(lc => {
                        leadCountsMap[String(lc._id)] = lc.count;
                    });
                } catch (aggErr) {
                    console.warn("Could not aggregate lead counts for users:", aggErr.message);
                }
            }

            const enrichedUsers = users.map(u => ({
                id: u._id,
                _id: u._id,
                name: u.name,
                email: u.email,
                role: normalizeRole(u.role),
                status: u.status || (u.isActive ? 'ACTIVE' : 'INACTIVE'),
                isActive: u.isActive !== false && u.status !== 'INACTIVE' && u.status !== 'SUSPENDED',
                assignment: u.assignment || { teamName: '', assignedAreas: [], maxActiveLeads: 50 },
                permissions: u.permissions || [],
                effectivePermissions: getEffectivePermissions(u),
                reportsTo: u.reportsTo ? {
                    id: u.reportsTo._id,
                    _id: u.reportsTo._id,
                    name: u.reportsTo.name,
                    email: u.reportsTo.email,
                    role: normalizeRole(u.reportsTo.role)
                } : null,
                activeLeadsCount: leadCountsMap[String(u._id)] || 0,
                createdAt: u.createdAt,
                lastLoginAt: u.lastLoginAt,
                passwordChangeRequired: !!u.passwordChangeRequired
            }));

            return res.status(200).json({ success: true, users: enrichedUsers });
        } catch (error) {
            console.error("Fetch users error:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch user accounts." });
        }
    });

    /**
     * ➕ POST /admin/users
     * Creates new user account. Restricted to MANAGER, TEAM_LEADER, TEAM_MEMBER.
     * CEO cannot be created via standard endpoint.
     */
    app.post('/admin/users', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const temporaryPassword = req.body.temporaryPassword || req.body.password;
            const { name, email, role, reportsTo, assignment, permissions } = req.body;

            if (!name || !email || !role || !temporaryPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Name, email, role, and temporary password are required."
                });
            }

            if (temporaryPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Temporary password must be at least 8 characters long."
                });
            }

            const targetRole = normalizeRole(role);

            // CEO creation forbidden via standard user management
            if (targetRole === ROLES.CEO) {
                return res.status(403).json({
                    success: false,
                    message: "Executive CEO role cannot be created via standard user management endpoint."
                });
            }

            // Verify email uniqueness
            const existing = await User.findOne({ email: email.toLowerCase().trim() });
            if (existing) {
                return res.status(409).json({ success: false, message: "A user with this email already exists." });
            }

            // Hierarchy validation
            let reportsToUser = null;
            if (reportsTo) {
                reportsToUser = await User.findById(reportsTo).lean();
                if (!reportsToUser) {
                    return res.status(400).json({ success: false, message: "Reporting manager/leader not found." });
                }
            }

            const hierarchyCheck = validateHierarchy(targetRole, reportsToUser);
            if (!hierarchyCheck.valid) {
                return res.status(400).json({ success: false, message: hierarchyCheck.error });
            }

            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(temporaryPassword, salt);

            const newUser = new User({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                passwordHash,
                role: targetRole,
                reportsTo: reportsToUser ? reportsToUser._id : null,
                assignment: {
                    teamName: assignment?.teamName?.trim() || '',
                    assignedAreas: Array.isArray(assignment?.assignedAreas) ? assignment.assignedAreas : [],
                    maxActiveLeads: Number(assignment?.maxActiveLeads) || 50
                },
                permissions: Array.isArray(permissions) ? permissions : [],
                status: 'ACTIVE',
                isActive: true,
                passwordChangeRequired: true
            });

            await newUser.save();

            return res.status(201).json({
                success: true,
                message: "User account created successfully.",
                user: {
                    id: newUser._id,
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    status: newUser.status,
                    isActive: newUser.isActive,
                    reportsTo: newUser.reportsTo,
                    assignment: newUser.assignment,
                    permissions: newUser.permissions,
                    passwordChangeRequired: newUser.passwordChangeRequired,
                    createdAt: newUser.createdAt
                }
            });
        } catch (error) {
            console.error("Create user error:", error);
            return res.status(500).json({ success: false, message: "Failed to create user account." });
        }
    });

    /**
     * 👤 GET /admin/users/:id
     * Returns individual user profile with hierarchy path
     */
    app.get('/admin/users/:id', authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            const callerRole = normalizeRole(req.user.role);

            // Only CEO or user inspecting self can view
            if (callerRole !== ROLES.CEO && String(req.user.id) !== String(id)) {
                return res.status(403).json({ success: false, message: "Forbidden: You cannot inspect other user accounts." });
            }

            const user = await User.findById(id)
                .populate('reportsTo', 'name email role')
                .lean();

            if (!user) {
                return res.status(404).json({ success: false, message: "User account not found." });
            }

            return res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: normalizeRole(user.role),
                    status: user.status || (user.isActive ? 'ACTIVE' : 'INACTIVE'),
                    isActive: user.isActive !== false && user.status !== 'INACTIVE',
                    reportsTo: user.reportsTo,
                    assignment: user.assignment || { teamName: '', assignedAreas: [], maxActiveLeads: 50 },
                    permissions: user.permissions || [],
                    effectivePermissions: getEffectivePermissions(user),
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt
                }
            });
        } catch (error) {
            console.error("Get user error:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch user details." });
        }
    });

    /**
     * ✏️ PATCH /admin/users/:id
     * Updates user details, assignment, reportsTo, permissions, and status (CEO only)
     */
    app.patch('/admin/users/:id', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User account not found." });
            }

            const currentRole = normalizeRole(user.role);
            const { name, role, reportsTo, assignment, permissions, status } = req.body;

            // 1. Prevent self-demotion or self-role change if editing self
            if (String(req.user.id) === String(id) && role && normalizeRole(role) !== currentRole) {
                return res.status(400).json({ success: false, message: "You cannot change your own executive role." });
            }

            // 2. Prevent role escalation to CEO
            if (role) {
                const targetRole = normalizeRole(role);
                if (targetRole === ROLES.CEO && currentRole !== ROLES.CEO) {
                    return res.status(403).json({ success: false, message: "Cannot elevate account to CEO role." });
                }
                user.role = targetRole;
            }

            // 3. Name
            if (name && typeof name === 'string' && name.trim()) {
                user.name = name.trim();
            }

            // 4. Reporting Hierarchy
            if (reportsTo !== undefined) {
                let reportsToUser = null;
                if (reportsTo) {
                    reportsToUser = await User.findById(reportsTo).lean();
                    if (!reportsToUser) {
                        return res.status(400).json({ success: false, message: "Reporting manager not found." });
                    }
                }
                const hierarchyCheck = validateHierarchy(user.role, reportsToUser, user._id);
                if (!hierarchyCheck.valid) {
                    return res.status(400).json({ success: false, message: hierarchyCheck.error });
                }
                user.reportsTo = reportsToUser ? reportsToUser._id : null;
            }

            // 5. Assignment
            if (assignment && typeof assignment === 'object') {
                user.assignment = {
                    teamName: assignment.teamName !== undefined ? String(assignment.teamName).trim() : user.assignment?.teamName || '',
                    assignedAreas: Array.isArray(assignment.assignedAreas) ? assignment.assignedAreas : user.assignment?.assignedAreas || [],
                    maxActiveLeads: Number(assignment.maxActiveLeads) >= 0 ? Number(assignment.maxActiveLeads) : user.assignment?.maxActiveLeads || 50
                };
            }

            // 6. Permissions
            if (Array.isArray(permissions)) {
                user.permissions = permissions;
            }

            // 7. Status & Deactivation protection
            if (status) {
                const normStatus = String(status).toUpperCase();
                if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(normStatus)) {
                    return res.status(400).json({ success: false, message: "Invalid status value." });
                }

                if (normStatus !== 'ACTIVE') {
                    // Check if self
                    if (String(req.user.id) === String(id)) {
                        return res.status(400).json({ success: false, message: "You cannot deactivate or suspend your own account." });
                    }
                    // Check if last active CEO
                    if (currentRole === ROLES.CEO && (await isLastActiveCEO(id))) {
                        return res.status(400).json({ success: false, message: "Cannot deactivate or suspend the only remaining active CEO." });
                    }

                    user.status = normStatus;
                    user.isActive = false;
                    if (AuthSession) {
                        await AuthSession.updateMany({ userId: String(id) }, { $set: { revokedAt: new Date() } });
                    }
                } else {
                    user.status = 'ACTIVE';
                    user.isActive = true;
                }
            }

            await user.save();

            return res.status(200).json({
                success: true,
                message: "User account updated successfully.",
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isActive: user.isActive,
                    reportsTo: user.reportsTo,
                    assignment: user.assignment,
                    permissions: user.permissions,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error("Update user error:", error);
            return res.status(500).json({ success: false, message: "Failed to update user account." });
        }
    });

    /**
     * 🟢 POST /admin/users/:id/activate
     * Activates user account
     */
    app.post('/admin/users/:id/activate', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User account not found." });
            }
            user.status = 'ACTIVE';
            user.isActive = true;
            await user.save();

            return res.status(200).json({
                success: true,
                message: "User account activated successfully.",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            console.error("Activate user error:", error);
            return res.status(500).json({ success: false, message: "Failed to activate user." });
        }
    });

    /**
     * 🔴 POST /admin/users/:id/deactivate
     * Deactivates user account (CEO only)
     */
    app.post('/admin/users/:id/deactivate', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { id } = req.params;
            if (String(req.user.id) === String(id)) {
                return res.status(400).json({ success: false, message: "You cannot deactivate your own executive account." });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User account not found." });
            }

            if (normalizeRole(user.role) === ROLES.CEO && (await isLastActiveCEO(id))) {
                return res.status(400).json({ success: false, message: "Cannot deactivate the only remaining active CEO." });
            }

            user.status = 'INACTIVE';
            user.isActive = false;
            await user.save();

            if (AuthSession) {
                await AuthSession.updateMany({ userId: String(id) }, { $set: { revokedAt: new Date() } });
            }

            return res.status(200).json({
                success: true,
                message: "User account deactivated successfully.",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    isActive: user.isActive
                }
            });
        } catch (error) {
            console.error("Deactivate user error:", error);
            return res.status(500).json({ success: false, message: "Failed to deactivate user." });
        }
    });

    /**
     * 🔄 PATCH /admin/users/:id/status (Legacy Compatibility)
     */
    app.patch('/admin/users/:id/status', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { id } = req.params;
            const { isActive } = req.body;
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ success: false, message: "isActive boolean value is required." });
            }
            if (String(req.user.id) === String(id) && !isActive) {
                return res.status(400).json({ success: false, message: "You cannot deactivate your own executive account." });
            }
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User account not found." });
            }

            if (!isActive && normalizeRole(user.role) === ROLES.CEO && (await isLastActiveCEO(id))) {
                return res.status(400).json({ success: false, message: "Cannot deactivate the only remaining active CEO." });
            }

            user.isActive = isActive;
            user.status = isActive ? 'ACTIVE' : 'INACTIVE';
            await user.save();

            if (!isActive && AuthSession) {
                await AuthSession.updateMany({ userId: String(id) }, { $set: { revokedAt: new Date() } });
            }

            return res.status(200).json({
                success: true,
                message: `User account ${isActive ? 'activated' : 'deactivated'} successfully.`,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isActive: user.isActive,
                    passwordChangeRequired: user.passwordChangeRequired
                }
            });
        } catch (error) {
            console.error("Update user status error:", error);
            return res.status(500).json({ success: false, message: "Failed to update user account status." });
        }
    });

    /**
     * 🔑 POST /admin/users/:id/reset-password
     * Resets user password with temporary password (CEO only)
     */
    app.post('/admin/users/:id/reset-password', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { id } = req.params;
            const temporaryPassword = req.body.temporaryPassword || req.body.password;
            if (!temporaryPassword || temporaryPassword.length < 8) {
                return res.status(400).json({ success: false, message: "Temporary password (min. 8 characters) is required." });
            }
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User account not found." });
            }
            const salt = bcrypt.genSaltSync(10);
            user.passwordHash = bcrypt.hashSync(temporaryPassword, salt);
            user.passwordChangeRequired = true;
            await user.save();

            if (AuthSession) {
                await AuthSession.updateMany({ userId: String(id) }, { $set: { revokedAt: new Date() } });
            }

            return res.status(200).json({
                success: true,
                message: "Temporary password set successfully. User must change password upon next login.",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status || 'ACTIVE',
                    isActive: user.isActive,
                    passwordChangeRequired: user.passwordChangeRequired
                }
            });
        } catch (error) {
            console.error("Reset password error:", error);
            return res.status(500).json({ success: false, message: "Failed to reset password." });
        }
    });
}

module.exports = { registerUserRoutes };

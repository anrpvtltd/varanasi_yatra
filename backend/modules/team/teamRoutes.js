/**
 * Team Operations, Scoped Overview & Lead Assignment Routes
 * Varanasi Yatra Platform — Prompt 3
 */

const { ROLES, normalizeRole } = require('../../auth/roles');
const { canAssignLead } = require('../../auth/authorization');

function sanitizeLeadForRole(lead, role) {
    const norm = normalizeRole(role);
    if (norm === ROLES.CEO || norm === ROLES.MANAGER) {
        return lead;
    }

    // Strip executive financial and private notes from Team Leader and Team Member views
    const sanitized = { ...lead };
    delete sanitized.vendorCosts;
    delete sanitized.totalVendorCost;
    delete sanitized.companyMargin;
    delete sanitized.expectedProfit;
    delete sanitized.ceoNotes;
    delete sanitized.internalNotes;
    delete sanitized.marginPercentage;
    delete sanitized.costBreakdown;
    return sanitized;
}

function registerTeamRoutes(app, { User, Enquiry, authenticateToken, requireRole }) {

    /**
     * 📊 GET /admin/team/overview
     * Returns team operational status, scoped by caller role
     * Access: CEO, MANAGER, TEAM_LEADER
     */
    app.get('/admin/team/overview', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER, ROLES.TEAM_LEADER]), async (req, res) => {
        try {
            const callerRole = normalizeRole(req.user.role);
            const callerId = req.user.id || req.user._id;

            if (callerRole === ROLES.TEAM_LEADER) {
                // Team Leader view: Find members reporting to this Team Leader or sharing teamName
                const teamName = req.user.assignment?.teamName;
                const memberQuery = {
                    $or: [
                        { reportsTo: callerId }
                    ]
                };
                if (teamName && teamName.trim()) {
                    memberQuery.$or.push({ 'assignment.teamName': teamName });
                }

                const teamMembers = await User.find(memberQuery)
                    .select('name email role status assignment lastLoginAt')
                    .lean();

                const memberIds = teamMembers.map(m => m._id);
                memberIds.push(callerId); // Include team leader's own assignments

                // Aggregate lead statistics for this team
                const leadStats = await Enquiry.aggregate([
                    {
                        $match: {
                            $or: [
                                { assignedTo: { $in: memberIds } },
                                { teamLeaderId: callerId }
                            ]
                        }
                    },
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ]);

                const stats = {
                    totalAssigned: 0,
                    inProgress: 0,
                    converted: 0,
                    pendingFollowUp: 0
                };

                leadStats.forEach(item => {
                    stats.totalAssigned += item.count;
                    const st = String(item._id).toUpperCase();
                    if (st === 'WON' || st === 'COMPLETED' || st === 'BOOKED') {
                        stats.converted += item.count;
                    } else if (st === 'LOST' || st === 'CANCELLED' || st === 'CLOSED') {
                        // Closed
                    } else {
                        stats.inProgress += item.count;
                    }
                });

                return res.status(200).json({
                    success: true,
                    role: callerRole,
                    team: {
                        leaderId: callerId,
                        leaderName: req.user.name,
                        teamName: teamName || 'General Operations',
                        membersCount: teamMembers.length,
                        members: teamMembers.map(m => ({
                            id: m._id,
                            name: m.name,
                            email: m.email,
                            role: normalizeRole(m.role),
                            status: m.status || 'ACTIVE',
                            assignment: m.assignment
                        })),
                        stats
                    }
                });
            }

            // CEO / MANAGER view: High-level overview of all teams and leaders
            const teamLeaders = await User.find({
                role: { $in: [ROLES.TEAM_LEADER, 'Team_Leader', 'team_leader'] },
                status: 'ACTIVE'
            }).select('name email role assignment reportsTo').lean();

            const teamMembers = await User.find({
                role: { $in: [ROLES.TEAM_MEMBER, 'Team_Member', 'team_member'] },
                status: 'ACTIVE'
            }).select('name email role assignment reportsTo').lean();

            const unassignedLeadsCount = await Enquiry.countDocuments({
                assignedTo: null,
                status: { $nin: ['WON', 'LOST', 'ARCHIVED', 'CANCELLED', 'Closed'] }
            });

            return res.status(200).json({
                success: true,
                role: callerRole,
                summary: {
                    totalLeaders: teamLeaders.length,
                    totalMembers: teamMembers.length,
                    unassignedLeads: unassignedLeadsCount
                },
                leaders: teamLeaders.map(tl => ({
                    id: tl._id,
                    name: tl.name,
                    email: tl.email,
                    teamName: tl.assignment?.teamName || 'Unassigned Team',
                    assignedAreas: tl.assignment?.assignedAreas || []
                })),
                members: teamMembers.map(tm => ({
                    id: tm._id,
                    name: tm.name,
                    email: tm.email,
                    teamName: tm.assignment?.teamName || 'Unassigned Team',
                    reportsTo: tm.reportsTo
                }))
            });

        } catch (error) {
            console.error("Team overview error:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch team overview." });
        }
    });

    /**
     * 📋 GET /admin/team/leads
     * Scoped leads list matching caller role and assignment boundaries
     * Access: CEO, MANAGER, TEAM_LEADER, TEAM_MEMBER
     */
    app.get('/admin/team/leads', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER, ROLES.TEAM_LEADER, ROLES.TEAM_MEMBER]), async (req, res) => {
        try {
            const callerRole = normalizeRole(req.user.role);
            const callerId = req.user.id || req.user._id;
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
            const skip = (page - 1) * limit;

            let query = {};

            if (callerRole === ROLES.TEAM_MEMBER) {
                // Team Member: only see own assigned leads
                query.assignedTo = callerId;
            } else if (callerRole === ROLES.TEAM_LEADER) {
                // Team Leader: see leads assigned to self or team members
                const teamName = req.user.assignment?.teamName;
                const memberQuery = { reportsTo: callerId };
                if (teamName) memberQuery['assignment.teamName'] = teamName;

                const memberDocs = await User.find(memberQuery).select('_id').lean();
                const memberIds = memberDocs.map(m => m._id);
                memberIds.push(callerId);

                query.$or = [
                    { assignedTo: { $in: memberIds } },
                    { teamLeaderId: callerId }
                ];
            } else {
                // Manager / CEO: can filter by assignedTo or view all
                if (req.query.assignedTo) {
                    query.assignedTo = req.query.assignedTo;
                }
                if (req.query.status) {
                    query.status = req.query.status;
                }
            }

            const [total, leads] = await Promise.all([
                Enquiry.countDocuments(query),
                Enquiry.find(query)
                    .populate('assignedTo', 'name email role')
                    .populate('assignedBy', 'name email role')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean()
            ]);

            // Sanitize financial / private fields based on role
            const sanitizedLeads = leads.map(l => sanitizeLeadForRole(l, callerRole));

            return res.status(200).json({
                success: true,
                leads: sanitizedLeads,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error("Fetch team leads error:", error);
            return res.status(500).json({ success: false, message: "Failed to fetch team leads." });
        }
    });

    /**
     * 🎯 POST /admin/team/leads/assign
     * Assigns a lead to an operational team member
     * Access: CEO, MANAGER, TEAM_LEADER
     */
    app.post('/admin/team/leads/assign', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER, ROLES.TEAM_LEADER]), async (req, res) => {
        try {
            const { leadId, assignedToUserId, remarks } = req.body;
            if (!leadId || !assignedToUserId) {
                return res.status(400).json({ success: false, message: "leadId and assignedToUserId are required." });
            }

            const targetUser = await User.findById(assignedToUserId).lean();
            if (!targetUser) {
                return res.status(404).json({ success: false, message: "Assignee user not found." });
            }

            if (targetUser.isActive === false || targetUser.status === 'INACTIVE' || targetUser.status === 'SUSPENDED') {
                return res.status(400).json({ success: false, message: "Cannot assign leads to an inactive or suspended user." });
            }

            // Validate assignment authorization
            if (!canAssignLead(req.user, targetUser)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden: You do not have permission to assign leads to this user."
                });
            }

            const lead = await Enquiry.findById(leadId);
            if (!lead) {
                return res.status(404).json({ success: false, message: "Lead not found." });
            }

            const callerId = req.user.id || req.user._id;
            const callerRole = normalizeRole(req.user.role);

            // Determine teamLeaderId
            let teamLeaderId = null;
            if (callerRole === ROLES.TEAM_LEADER) {
                teamLeaderId = callerId;
            } else if (targetUser.reportsTo) {
                const parentUser = await User.findById(targetUser.reportsTo).lean();
                if (parentUser && normalizeRole(parentUser.role) === ROLES.TEAM_LEADER) {
                    teamLeaderId = parentUser._id;
                }
            }

            lead.assignedTo = targetUser._id;
            lead.assignedBy = callerId;
            lead.assignedAt = new Date();
            if (teamLeaderId) {
                lead.teamLeaderId = teamLeaderId;
            }

            // Record status history entry
            lead.statusHistory.push({
                previousStatus: lead.status,
                newStatus: lead.status,
                updatedBy: req.user.name || 'Team Leader',
                updatedTime: new Date().toISOString(),
                remarks: remarks || `Lead assigned to ${targetUser.name} (${normalizeRole(targetUser.role)})`
            });

            await lead.save();

            return res.status(200).json({
                success: true,
                message: `Lead successfully assigned to ${targetUser.name}.`,
                lead: {
                    id: lead._id,
                    assignedTo: {
                        id: targetUser._id,
                        name: targetUser.name,
                        email: targetUser.email,
                        role: normalizeRole(targetUser.role)
                    },
                    assignedBy: callerId,
                    assignedAt: lead.assignedAt,
                    teamLeaderId: lead.teamLeaderId
                }
            });

        } catch (error) {
            console.error("Assign lead error:", error);
            return res.status(500).json({ success: false, message: "Failed to assign lead." });
        }
    });
}

module.exports = { registerTeamRoutes, sanitizeLeadForRole };

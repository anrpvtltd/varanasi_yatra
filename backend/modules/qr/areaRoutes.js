/**
 * Area Management Routes
 * Varanasi Yatra Platform — Prompt 4
 */

const { ROLES } = require('../../auth/roles');
const { ALL_QR_TYPES, AREA_STATUSES, normalizeQrType } = require('./qrConstants');

function registerAreaRoutes(app, { Area, QRRecord, authenticateToken, requireRole }) {

    /**
     * 📍 GET /admin/qr/areas
     * Returns list of all areas with aggregated QR, lead, and booking counts
     */
    app.get('/admin/qr/areas', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const areas = await Area.find({}).sort({ name: 1 }).lean();

            // Aggregate metrics across all areas in one query (Zero N+1)
            let statsMap = {};
            if (QRRecord) {
                try {
                    const stats = await QRRecord.aggregate([
                        {
                            $group: {
                                _id: '$areaId',
                                totalQrs: { $sum: 1 },
                                activeQrs: {
                                    $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
                                },
                                installedQrs: {
                                    $sum: { $cond: [{ $eq: ['$status', 'INSTALLED'] }, 1, 0] }
                                },
                                damagedQrs: {
                                    $sum: { $cond: [{ $eq: ['$status', 'DAMAGED'] }, 1, 0] }
                                },
                                missingQrs: {
                                    $sum: { $cond: [{ $eq: ['$status', 'MISSING'] }, 1, 0] }
                                },
                                pendingReplacementQrs: {
                                    $sum: { $cond: [{ $eq: ['$status', 'REPLACEMENT_PENDING'] }, 1, 0] }
                                },
                                leads: { $sum: { $ifNull: ['$leadCount', 0] } },
                                bookings: { $sum: { $ifNull: ['$bookingCount', 0] } },
                                revenue: { $sum: { $ifNull: ['$revenueGenerated', 0] } }
                            }
                        }
                    ]);
                    stats.forEach(st => {
                        statsMap[String(st._id)] = st;
                    });
                } catch (aggErr) {
                    console.warn("Could not aggregate QR stats for areas:", aggErr.message);
                }
            }

            const enrichedAreas = areas.map(area => {
                const s = statsMap[String(area._id)] || {};
                return {
                    ...area,
                    id: area._id,
                    totalQrs: s.totalQrs || 0,
                    activeQrs: s.activeQrs || 0,
                    installedQrs: s.installedQrs || 0,
                    damagedQrs: s.damagedQrs || 0,
                    missingQrs: s.missingQrs || 0,
                    pendingReplacementQrs: s.pendingReplacementQrs || 0,
                    leads: s.leads || 0,
                    bookings: s.bookings || 0,
                    revenue: s.revenue || 0
                };
            });

            return res.json({
                success: true,
                count: enrichedAreas.length,
                areas: enrichedAreas,
                data: enrichedAreas
            });
        } catch (err) {
            console.error("GET /admin/qr/areas error:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch areas." });
        }
    });

    /**
     * 📍 POST /admin/qr/areas
     * Creates a new geographical area (CEO only)
     */
    app.post('/admin/qr/areas', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { name, code, description, allowedQrTypes } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({ success: false, message: "Area name is required." });
            }

            const rawCode = code ? String(code).toUpperCase().trim() : '';
            if (!rawCode || rawCode.length < 2 || rawCode.length > 6 || !/^[A-Z0-9]+$/.test(rawCode)) {
                return res.status(400).json({
                    success: false,
                    message: "Area code must be 2-6 alphanumeric uppercase characters (e.g., 'GOD', 'ASI')."
                });
            }

            // Check if code already exists
            const existingCode = await Area.findOne({ code: rawCode }).lean();
            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: `Area code '${rawCode}' is already in use by '${existingCode.name}'.`
                });
            }

            // Validate allowedQrTypes
            let validatedTypes = [];
            if (Array.isArray(allowedQrTypes) && allowedQrTypes.length > 0) {
                validatedTypes = allowedQrTypes
                    .map(normalizeQrType)
                    .filter(t => ALL_QR_TYPES.includes(t));
            }

            if (validatedTypes.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `At least one valid allowed QR type must be selected from: ${ALL_QR_TYPES.join(', ')}.`
                });
            }

            const area = new Area({
                name: name.trim(),
                code: rawCode,
                description: description ? String(description).trim() : '',
                status: AREA_STATUSES.ACTIVE,
                allowedQrTypes: validatedTypes
            });

            await area.save();

            return res.status(201).json({
                success: true,
                message: `Area '${area.name}' (${area.code}) created successfully.`,
                area: {
                    ...area.toObject(),
                    id: area._id
                }
            });
        } catch (err) {
            console.error("POST /admin/qr/areas error:", err);
            return res.status(500).json({ success: false, message: "Failed to create area." });
        }
    });

    /**
     * 📍 GET /admin/qr/areas/:id
     * Returns single area details
     */
    app.get('/admin/qr/areas/:id', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const area = await Area.findById(req.params.id).lean();
            if (!area) {
                return res.status(404).json({ success: false, message: "Area not found." });
            }
            return res.json({
                success: true,
                area: { ...area, id: area._id }
            });
        } catch (err) {
            console.error("GET /admin/qr/areas/:id error:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch area details." });
        }
    });

    /**
     * 📍 PATCH /admin/qr/areas/:id
     * Update area details and allowed QR types (CEO only)
     */
    app.patch('/admin/qr/areas/:id', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const area = await Area.findById(req.params.id);
            if (!area) {
                return res.status(404).json({ success: false, message: "Area not found." });
            }

            const { name, description, allowedQrTypes } = req.body;

            if (name && name.trim()) {
                area.name = name.trim();
            }

            if (description !== undefined) {
                area.description = String(description).trim();
            }

            if (Array.isArray(allowedQrTypes)) {
                const validatedTypes = allowedQrTypes
                    .map(normalizeQrType)
                    .filter(t => ALL_QR_TYPES.includes(t));

                if (validatedTypes.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: "At least one allowed QR type must be retained."
                    });
                }
                area.allowedQrTypes = validatedTypes;
            }

            await area.save();

            return res.json({
                success: true,
                message: `Area '${area.name}' updated successfully.`,
                area: {
                    ...area.toObject(),
                    id: area._id
                }
            });
        } catch (err) {
            console.error("PATCH /admin/qr/areas/:id error:", err);
            return res.status(500).json({ success: false, message: "Failed to update area." });
        }
    });

    /**
     * 📍 PATCH /admin/qr/areas/:id/status
     * Toggle area status (ACTIVE / INACTIVE) (CEO only)
     */
    app.patch('/admin/qr/areas/:id/status', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const { status } = req.body;
            const normStatus = String(status).toUpperCase().trim();

            if (![AREA_STATUSES.ACTIVE, AREA_STATUSES.INACTIVE].includes(normStatus)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be ACTIVE or INACTIVE."
                });
            }

            const area = await Area.findById(req.params.id);
            if (!area) {
                return res.status(404).json({ success: false, message: "Area not found." });
            }

            area.status = normStatus;
            await area.save();

            return res.json({
                success: true,
                message: `Area '${area.name}' marked as ${normStatus}.`,
                area: {
                    ...area.toObject(),
                    id: area._id
                }
            });
        } catch (err) {
            console.error("PATCH /admin/qr/areas/:id/status error:", err);
            return res.status(500).json({ success: false, message: "Failed to update area status." });
        }
    });
}

module.exports = { registerAreaRoutes };

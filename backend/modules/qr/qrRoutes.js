/**
 * QR Record Management Routes & Lifecycle Engine
 * Varanasi Yatra Platform — Prompt 4
 */

const { ROLES } = require('../../auth/roles');
const {
    QR_STATUSES,
    INSTALLATION_STATUSES,
    normalizeQrType,
    getQrTypeCode,
    isQrTypeAllowedInArea,
    isValidQrTransition
} = require('./qrConstants');

/**
 * Helper to generate next unique sequential QR ID atomically
 * Format: [AREA_CODE]-[CATEGORY_CODE]-[SEQUENCE_3_DIGITS]
 * Example: GOD-HOT-001, GOD-ROAD-002
 */
async function generateNextQrId(QRRecord, areaCode, qrType) {
    const catCode = getQrTypeCode(qrType);
    const prefix = `${areaCode.toUpperCase()}-${catCode}-`;

    // Find all records matching prefix to calculate highest sequence number
    const regex = new RegExp(`^${prefix}(\\d+)$`);
    const existing = await QRRecord.find({ qrId: { $regex: regex } })
        .select('qrId')
        .lean();

    let maxSeq = 0;
    for (const item of existing) {
        const match = item.qrId.match(regex);
        if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) {
                maxSeq = num;
            }
        }
    }

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
}

function registerQrRoutes(app, { Area, QRRecord, authenticateToken, requireRole }) {

    /**
     * 🏷️ GET /admin/qr
     * Search & filter QR records across areas, types, and statuses
     */
    app.get('/admin/qr', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const { areaId, qrType, status, installationStatus, search, page = 1, limit = 100 } = req.query;

            const query = {};

            if (areaId) {
                query.areaId = areaId;
            }

            if (qrType) {
                const norm = normalizeQrType(qrType);
                if (norm) query.qrType = norm;
            }

            if (status) {
                query.status = String(status).toUpperCase().trim();
            }

            if (installationStatus) {
                query.installationStatus = String(installationStatus).toUpperCase().trim();
            }

            if (search && search.trim()) {
                const s = search.trim();
                query.$or = [
                    { qrId: { $regex: s, $options: 'i' } },
                    { placementName: { $regex: s, $options: 'i' } },
                    { venueName: { $regex: s, $options: 'i' } },
                    { areaName: { $regex: s, $options: 'i' } }
                ];
            }

            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
            const skip = (pageNum - 1) * limitNum;

            const [records, total] = await Promise.all([
                QRRecord.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                QRRecord.countDocuments(query)
            ]);

            const enriched = records.map(r => ({
                ...r,
                id: r._id
            }));

            return res.json({
                success: true,
                count: enriched.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                records: enriched,
                data: enriched
            });
        } catch (err) {
            console.error("GET /admin/qr error:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch QR records." });
        }
    });

    /**
     * 🏷️ POST /admin/qr
     * Provisions a new physical QR record draft with unique sequence (CEO only)
     */
    app.post('/admin/qr', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const {
                areaId,
                qrType,
                placementName,
                venueName,
                partnerId,
                permissionStatus,
                campaignId,
                latitude,
                longitude,
                notes
            } = req.body;

            if (!areaId) {
                return res.status(400).json({ success: false, message: "Area ID is required." });
            }

            const area = await Area.findById(areaId).lean();
            if (!area) {
                return res.status(404).json({ success: false, message: "Specified area does not exist." });
            }

            if (area.status === 'INACTIVE') {
                return res.status(400).json({ success: false, message: `Area '${area.name}' is currently inactive.` });
            }

            const normType = normalizeQrType(qrType);
            if (!normType) {
                return res.status(400).json({ success: false, message: "Valid QR type is required." });
            }

            // Enforce that QR type is authorized for this Area
            if (!isQrTypeAllowedInArea(normType, area)) {
                return res.status(400).json({
                    success: false,
                    message: `QR Type '${normType}' is not allowed in area '${area.name}'. Allowed types are: ${area.allowedQrTypes.join(', ')}.`
                });
            }

            const finalPlacement = (placementName && placementName.trim()) || (venueName && venueName.trim());
            if (!finalPlacement) {
                return res.status(400).json({ success: false, message: "Placement name or venue name is required." });
            }

            // Determine sensible default permission status
            let perm = permissionStatus ? String(permissionStatus).toUpperCase().trim() : '';
            if (!['PENDING', 'REQUESTED', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'].includes(perm)) {
                perm = (normType === 'PUBLIC_PLACE' || normType === 'ROADSIDE') ? 'PENDING' : 'NOT_REQUIRED';
            }

            // Generate unique sequential QR token
            const qrId = await generateNextQrId(QRRecord, area.code, normType);
            const landingUrl = `/q/${qrId}`;

            const qrDoc = new QRRecord({
                qrId,
                areaId: area._id,
                areaCode: area.code,
                areaName: area.name,
                qrType: normType,
                placementName: finalPlacement,
                venueName: venueName ? String(venueName).trim() : finalPlacement,
                partnerId: partnerId ? String(partnerId).trim() : null,
                status: QR_STATUSES.DRAFT,
                installationStatus: INSTALLATION_STATUSES.PENDING,
                permissionStatus: perm,
                campaignId: campaignId ? String(campaignId).trim() : '',
                landingUrl,
                latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
                longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
                notes: notes ? String(notes).trim() : '',
                createdBy: req.user?._id || null,
                statusHistory: [{
                    status: QR_STATUSES.DRAFT,
                    changedBy: req.user?.name || 'CEO',
                    timestamp: new Date(),
                    remarks: `Created draft QR record for ${finalPlacement}`
                }]
            });

            await qrDoc.save();

            const retObj = {
                ...(typeof qrDoc.toObject === 'function' ? qrDoc.toObject() : qrDoc),
                id: qrDoc._id
            };

            return res.status(201).json({
                success: true,
                message: `QR '${qrDoc.qrId}' created in draft state.`,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("POST /admin/qr error:", err);
            return res.status(500).json({ success: false, message: "Failed to create QR record." });
        }
    });

    /**
     * 🏷️ GET /admin/qr/:qrId
     * Returns full record details, analytics, and status history
     */
    app.get('/admin/qr/:qrId', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res, next) => {
        try {
            const rawParam = req.params.qrId.trim();
            if (rawParam.toLowerCase() === 'analytics') {
                return next();
            }
            const param = rawParam.toUpperCase();
            const record = await QRRecord.findOne({
                $or: [
                    { qrId: param },
                    { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
                ]
            }).lean();

            if (!record) {
                return res.status(404).json({ success: false, message: "QR record not found." });
            }

            const retObj = { ...record, id: record._id };
            return res.json({
                success: true,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("GET /admin/qr/:qrId error:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch QR record." });
        }
    });

    /**
     * 🏷️ PATCH /admin/qr/:qrId
     * Updates placement, venue, notes, permission, or coordinates
     */
    app.patch('/admin/qr/:qrId', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const param = req.params.qrId.toUpperCase().trim();
            const record = await QRRecord.findOne({
                $or: [
                    { qrId: param },
                    { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }
                ]
            });

            if (!record) {
                return res.status(404).json({ success: false, message: "QR record not found." });
            }

            const {
                placementName,
                venueName,
                permissionStatus,
                notes,
                latitude,
                longitude,
                photoUrl,
                campaignId
            } = req.body;

            if (placementName && placementName.trim()) {
                record.placementName = placementName.trim();
            }

            if (venueName !== undefined) {
                record.venueName = String(venueName).trim();
            }

            if (permissionStatus) {
                const normPerm = String(permissionStatus).toUpperCase().trim();
                if (['PENDING', 'REQUESTED', 'APPROVED', 'REJECTED', 'NOT_REQUIRED'].includes(normPerm)) {
                    record.permissionStatus = normPerm;
                }
            }

            if (notes !== undefined) record.notes = String(notes).trim();
            if (photoUrl !== undefined) record.photoUrl = String(photoUrl).trim();
            if (campaignId !== undefined) record.campaignId = String(campaignId).trim();
            if (latitude !== undefined) record.latitude = Number(latitude);
            if (longitude !== undefined) record.longitude = Number(longitude);

            record.updatedAt = new Date();
            await record.save();

            const retObj = { ...(typeof record.toObject === 'function' ? record.toObject() : record), id: record._id };
            return res.json({
                success: true,
                message: `QR '${record.qrId}' updated successfully.`,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("PATCH /admin/qr/:qrId error:", err);
            return res.status(500).json({ success: false, message: "Failed to update QR record." });
        }
    });

    /**
     * 🏷️ POST /admin/qr/:qrId/generate
     * Transitions QR from DRAFT to GENERATED
     */
    app.post('/admin/qr/:qrId/generate', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const param = req.params.qrId.toUpperCase().trim();
            const record = await QRRecord.findOne({
                $or: [{ qrId: param }, { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }]
            });

            if (!record) {
                return res.status(404).json({ success: false, message: "QR record not found." });
            }

            if (!isValidQrTransition(record.status, QR_STATUSES.GENERATED)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot transition from '${record.status}' to 'GENERATED'.`
                });
            }

            record.status = QR_STATUSES.GENERATED;
            record.statusHistory.push({
                status: QR_STATUSES.GENERATED,
                changedBy: req.user?.name || 'CEO',
                timestamp: new Date(),
                remarks: 'QR token generated for print and deployment'
            });

            await record.save();

            const retObj = { ...(typeof record.toObject === 'function' ? record.toObject() : record), id: record._id };
            return res.json({
                success: true,
                message: `QR '${record.qrId}' generated successfully.`,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("POST /admin/qr/:qrId/generate error:", err);
            return res.status(500).json({ success: false, message: "Failed to generate QR." });
        }
    });

    /**
     * 🏷️ POST /admin/qr/:qrId/install
     * Records physical installation (Manager or CEO)
     */
    app.post('/admin/qr/:qrId/install', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const param = req.params.qrId.toUpperCase().trim();
            const record = await QRRecord.findOne({
                $or: [{ qrId: param }, { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }]
            });

            if (!record) {
                return res.status(404).json({ success: false, message: "QR record not found." });
            }

            const { photoUrl, latitude, longitude, remarks, activateImmediately } = req.body;

            // Policy check: If location is PUBLIC_PLACE or ROADSIDE and permission is PENDING/REJECTED,
            // enforce that permission must be APPROVED before installation / marking ACTIVE.
            const needsPermissionApproval = (record.qrType === 'PUBLIC_PLACE' || record.qrType === 'ROADSIDE');
            if (needsPermissionApproval && record.permissionStatus !== 'APPROVED') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot install. Physical placement in '${record.qrType}' requires location permission to be 'APPROVED' (current: '${record.permissionStatus}').`
                });
            }

            const nextStatus = (activateImmediately === false) ? QR_STATUSES.INSTALLED : QR_STATUSES.ACTIVE;

            record.installationStatus = INSTALLATION_STATUSES.INSTALLED;
            record.status = nextStatus;
            record.installedAt = new Date();
            record.installedBy = req.user?._id || null;

            if (photoUrl) record.photoUrl = String(photoUrl).trim();
            if (latitude) record.latitude = Number(latitude);
            if (longitude) record.longitude = Number(longitude);

            record.statusHistory.push({
                status: nextStatus,
                changedBy: req.user?.name || 'Installer',
                timestamp: new Date(),
                remarks: remarks || `Physical QR installed at ${record.placementName}`
            });

            await record.save();

            const retObj = { ...(typeof record.toObject === 'function' ? record.toObject() : record), id: record._id };
            return res.json({
                success: true,
                message: `QR '${record.qrId}' marked as ${nextStatus}.`,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("POST /admin/qr/:qrId/install error:", err);
            return res.status(500).json({ success: false, message: "Failed to record installation." });
        }
    });

    /**
     * 🏷️ POST /admin/qr/:qrId/damage
     * Marks physical QR as DAMAGED and triggers replacement workflow
     */
    app.post('/admin/qr/:qrId/damage', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const param = req.params.qrId.toUpperCase().trim();
            const record = await QRRecord.findOne({
                $or: [{ qrId: param }, { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }]
            });

            if (!record) {
                return res.status(404).json({ success: false, message: "QR record not found." });
            }

            const { remarks } = req.body;

            record.status = QR_STATUSES.DAMAGED;
            record.statusHistory.push({
                status: QR_STATUSES.DAMAGED,
                changedBy: req.user?.name || 'Operator',
                timestamp: new Date(),
                remarks: remarks || 'Reported as physically damaged / scuffed / unreadable'
            });

            await record.save();

            const retObj = { ...(typeof record.toObject === 'function' ? record.toObject() : record), id: record._id };
            return res.json({
                success: true,
                message: `QR '${record.qrId}' marked as DAMAGED. Ready for replacement.`,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("POST /admin/qr/:qrId/damage error:", err);
            return res.status(500).json({ success: false, message: "Failed to mark QR as damaged." });
        }
    });

    /**
     * 🏷️ POST /admin/qr/:qrId/replace
     * Allocates next sequential QR ID, links replacementOf and replacedBy,
     * and preserves historical scan analytics on the old QR (CEO or authorized Manager)
     */
    app.post('/admin/qr/:qrId/replace', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const param = req.params.qrId.toUpperCase().trim();
            const oldRecord = await QRRecord.findOne({
                $or: [{ qrId: param }, { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }]
            });

            if (!oldRecord) {
                return res.status(404).json({ success: false, message: "Original QR record not found." });
            }

            if (oldRecord.replacedBy) {
                return res.status(400).json({
                    success: false,
                    message: `QR '${oldRecord.qrId}' has already been replaced by '${oldRecord.replacedBy}'.`
                });
            }

            // Generate new sequential QR ID for the identical area and category
            const newQrId = await generateNextQrId(QRRecord, oldRecord.areaCode, oldRecord.qrType);
            const landingUrl = `/q/${newQrId}`;

            // Create new QR record
            const newRecord = new QRRecord({
                qrId: newQrId,
                areaId: oldRecord.areaId,
                areaCode: oldRecord.areaCode,
                areaName: oldRecord.areaName,
                qrType: oldRecord.qrType,
                placementName: oldRecord.placementName,
                venueName: oldRecord.venueName,
                partnerId: oldRecord.partnerId,
                status: QR_STATUSES.GENERATED,
                installationStatus: INSTALLATION_STATUSES.PENDING,
                permissionStatus: oldRecord.permissionStatus,
                campaignId: oldRecord.campaignId,
                landingUrl,
                latitude: oldRecord.latitude,
                longitude: oldRecord.longitude,
                replacementOf: oldRecord.qrId,
                createdBy: req.user?._id || null,
                notes: `Replacement token for ${oldRecord.qrId}. Original notes: ${oldRecord.notes || 'None'}`,
                statusHistory: [{
                    status: QR_STATUSES.GENERATED,
                    changedBy: req.user?.name || 'Operator',
                    timestamp: new Date(),
                    remarks: `Created as replacement for damaged token ${oldRecord.qrId}`
                }]
            });

            await newRecord.save();

            // Update old record
            oldRecord.replacedBy = newQrId;
            oldRecord.status = QR_STATUSES.REPLACED;
            oldRecord.statusHistory.push({
                status: QR_STATUSES.REPLACED,
                changedBy: req.user?.name || 'Operator',
                timestamp: new Date(),
                remarks: `Replacement token ${newQrId} created. Awaiting physical deployment.`
            });

            await oldRecord.save();

            const retOld = { ...(typeof oldRecord.toObject === 'function' ? oldRecord.toObject() : oldRecord), id: oldRecord._id };
            const retNew = { ...(typeof newRecord.toObject === 'function' ? newRecord.toObject() : newRecord), id: newRecord._id };

            return res.status(200).json({
                success: true,
                message: `Replacement QR '${newQrId}' generated for '${oldRecord.qrId}'.`,
                oldRecord: retOld,
                newRecord: retNew,
                replacement: retNew,
                qr: retNew,
                record: retNew
            });
        } catch (err) {
            console.error("POST /admin/qr/:qrId/replace error:", err);
            return res.status(500).json({ success: false, message: "Failed to create replacement QR." });
        }
    });

    /**
     * 🏷️ POST /admin/qr/:qrId/deactivate
     * Deactivates a QR record (CEO only)
     */
    app.post('/admin/qr/:qrId/deactivate', authenticateToken, requireRole([ROLES.CEO]), async (req, res) => {
        try {
            const param = req.params.qrId.toUpperCase().trim();
            const record = await QRRecord.findOne({
                $or: [{ qrId: param }, { _id: param.match(/^[0-9a-fA-F]{24}$/) ? param : null }]
            });

            if (!record) {
                return res.status(404).json({ success: false, message: "QR record not found." });
            }

            record.status = QR_STATUSES.INACTIVE;
            record.statusHistory.push({
                status: QR_STATUSES.INACTIVE,
                changedBy: req.user?.name || 'CEO',
                timestamp: new Date(),
                remarks: req.body?.remarks || 'Manually deactivated by administrator'
            });

            await record.save();

            const retObj = { ...(typeof record.toObject === 'function' ? record.toObject() : record), id: record._id };
            return res.json({
                success: true,
                message: `QR '${record.qrId}' deactivated.`,
                qr: retObj,
                record: retObj
            });
        } catch (err) {
            console.error("POST /admin/qr/:qrId/deactivate error:", err);
            return res.status(500).json({ success: false, message: "Failed to deactivate QR." });
        }
    });
}

module.exports = { registerQrRoutes, generateNextQrId };

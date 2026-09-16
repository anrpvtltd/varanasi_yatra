/**
 * High-Performance Server-Side QR Network Analytics Engine
 * Varanasi Yatra Platform — Prompt 4
 */

const { ROLES } = require('../../auth/roles');

function registerQrAnalyticsRoutes(app, { Area, QRRecord, Booking: _Booking, authenticateToken, requireRole }) {

    /**
     * 📊 GET /admin/qr/analytics
     * Returns consolidated QR network metrics, breakdowns by area and type, and top QRs
     * (Zero N+1, server-aggregated)
     */
    app.get('/admin/qr/analytics', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const isCeo = req.user?.role === ROLES.CEO;

            // 1. Overall Totals
            const totalAreas = await Area.countDocuments();

            const qrSummaryAgg = await QRRecord.aggregate([
                {
                    $group: {
                        _id: null,
                        totalQrs: { $sum: 1 },
                        activeQrs: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                        installedQrs: { $sum: { $cond: [{ $eq: ['$status', 'INSTALLED'] }, 1, 0] } },
                        draftQrs: { $sum: { $cond: [{ $eq: ['$status', 'DRAFT'] }, 1, 0] } },
                        generatedQrs: { $sum: { $cond: [{ $eq: ['$status', 'GENERATED'] }, 1, 0] } },
                        damagedQrs: { $sum: { $cond: [{ $eq: ['$status', 'DAMAGED'] }, 1, 0] } },
                        missingQrs: { $sum: { $cond: [{ $eq: ['$status', 'MISSING'] }, 1, 0] } },
                        replacementPendingQrs: { $sum: { $cond: [{ $eq: ['$status', 'REPLACEMENT_PENDING'] }, 1, 0] } },
                        totalScans: { $sum: { $ifNull: ['$scanCount', 0] } },
                        totalLeads: { $sum: { $ifNull: ['$leadCount', 0] } },
                        totalBookings: { $sum: { $ifNull: ['$bookingCount', 0] } },
                        totalRevenue: { $sum: { $ifNull: ['$revenueGenerated', 0] } }
                    }
                }
            ]);

            const summary = qrSummaryAgg[0] || {
                totalQrs: 0,
                activeQrs: 0,
                installedQrs: 0,
                draftQrs: 0,
                generatedQrs: 0,
                damagedQrs: 0,
                missingQrs: 0,
                replacementPendingQrs: 0,
                totalScans: 0,
                totalLeads: 0,
                totalBookings: 0,
                totalRevenue: 0
            };

            // 2. Breakdown by Area
            const areaBreakdown = await QRRecord.aggregate([
                {
                    $group: {
                        _id: { areaId: '$areaId', areaName: '$areaName', areaCode: '$areaCode' },
                        totalQrs: { $sum: 1 },
                        activeQrs: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                        scans: { $sum: { $ifNull: ['$scanCount', 0] } },
                        leads: { $sum: { $ifNull: ['$leadCount', 0] } },
                        bookings: { $sum: { $ifNull: ['$bookingCount', 0] } },
                        revenue: { $sum: { $ifNull: ['$revenueGenerated', 0] } }
                    }
                },
                { $sort: { scans: -1 } }
            ]);

            // 3. Breakdown by QR Type
            const typeBreakdown = await QRRecord.aggregate([
                {
                    $group: {
                        _id: '$qrType',
                        totalQrs: { $sum: 1 },
                        activeQrs: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                        scans: { $sum: { $ifNull: ['$scanCount', 0] } },
                        leads: { $sum: { $ifNull: ['$leadCount', 0] } },
                        bookings: { $sum: { $ifNull: ['$bookingCount', 0] } },
                        revenue: { $sum: { $ifNull: ['$revenueGenerated', 0] } }
                    }
                },
                { $sort: { scans: -1 } }
            ]);

            // 4. Top 10 Individual Performing QRs
            const topQrs = await QRRecord.find({})
                .sort({ scans: -1, leadCount: -1 })
                .limit(10)
                .select('qrId areaName qrType placementName venueName status scanCount leadCount bookingCount revenueGenerated lastScannedAt')
                .lean();

            // If Manager, sanitize revenue figures to prevent financial leakage
            const formatMetrics = (item) => {
                const resItem = { ...item };
                if (!isCeo) {
                    delete resItem.revenue;
                    delete resItem.totalRevenue;
                    delete resItem.revenueGenerated;
                }
                return resItem;
            };

            const analyticsPayload = {
                summary: {
                    totalAreas,
                    ...formatMetrics(summary)
                },
                byArea: areaBreakdown.map(b => formatMetrics({
                    areaId: b._id?.areaId || b.areaId,
                    areaName: b._id?.areaName || b.areaName,
                    areaCode: b._id?.areaCode || b.areaCode,
                    totalQrs: b.totalQrs,
                    activeQrs: b.activeQrs,
                    scans: b.scans,
                    leads: b.leads,
                    bookings: b.bookings,
                    revenue: b.revenue
                })),
                byType: typeBreakdown.map(t => formatMetrics({
                    qrType: t._id,
                    totalQrs: t.totalQrs,
                    activeQrs: t.activeQrs,
                    scans: t.scans,
                    leads: t.leads,
                    bookings: t.bookings,
                    revenue: t.revenue
                })),
                topQrs: topQrs.map(formatMetrics)
            };

            return res.json({
                success: true,
                analytics: analyticsPayload,
                ...analyticsPayload
            });
        } catch (err) {
            console.error("GET /admin/qr/analytics error:", err);
            return res.status(500).json({ success: false, message: "Failed to generate QR network analytics." });
        }
    });

    /**
     * 📊 GET /admin/qr/analytics/areas/:areaId
     * Area drill-down analytics
     */
    app.get('/admin/qr/analytics/areas/:areaId', authenticateToken, requireRole([ROLES.CEO, ROLES.MANAGER]), async (req, res) => {
        try {
            const isCeo = req.user?.role === ROLES.CEO;
            const areaId = req.params.areaId;

            const area = await Area.findById(areaId).lean();
            if (!area) {
                return res.status(404).json({ success: false, message: "Area not found." });
            }

            // QR Type breakdown inside this specific area
            const typeInAreaAgg = await QRRecord.aggregate([
                { $match: { areaId: area._id } },
                {
                    $group: {
                        _id: '$qrType',
                        totalQrs: { $sum: 1 },
                        activeQrs: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
                        scans: { $sum: { $ifNull: ['$scanCount', 0] } },
                        leads: { $sum: { $ifNull: ['$leadCount', 0] } },
                        bookings: { $sum: { $ifNull: ['$bookingCount', 0] } },
                        revenue: { $sum: { $ifNull: ['$revenueGenerated', 0] } }
                    }
                }
            ]);

            const qrsInArea = await QRRecord.find({ areaId: area._id })
                .sort({ scanCount: -1 })
                .select('qrId qrType placementName venueName status permissionStatus scanCount leadCount bookingCount revenueGenerated lastScannedAt')
                .lean();

            const formatMetrics = (item) => {
                const resItem = { ...item };
                if (!isCeo) {
                    delete resItem.revenue;
                    delete resItem.revenueGenerated;
                }
                return resItem;
            };

            return res.json({
                success: true,
                area: {
                    id: area._id,
                    name: area.name,
                    code: area.code,
                    status: area.status,
                    allowedQrTypes: area.allowedQrTypes
                },
                byType: typeInAreaAgg.map(t => formatMetrics({
                    qrType: t._id,
                    totalQrs: t.totalQrs,
                    activeQrs: t.activeQrs,
                    scans: t.scans,
                    leads: t.leads,
                    bookings: t.bookings,
                    revenue: t.revenue
                })),
                qrs: qrsInArea.map(formatMetrics)
            });
        } catch (err) {
            console.error("GET /admin/qr/analytics/areas/:areaId error:", err);
            return res.status(500).json({ success: false, message: "Failed to generate area analytics." });
        }
    });
}

module.exports = { registerQrAnalyticsRoutes };

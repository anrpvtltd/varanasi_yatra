/**
 * Public QR Landing & Scan Tracking Routes
 * Varanasi Yatra Platform — Prompt 4
 */

const crypto = require('crypto');

function hashIp(ip) {
    if (!ip) return 'anonymous';
    return crypto.createHash('sha256').update(String(ip)).digest('hex').substring(0, 16);
}

function registerQrPublicRoutes(app, { QRRecord, QRScan }) {

    /**
     * 🌐 GET /public/qr/:qrId
     * Resolves physical QR token, deduplicates scan events, updates metrics,
     * and returns customer-safe landing payload
     */
    app.get('/public/qr/:qrId', async (req, res) => {
        try {
            const rawParam = req.params.qrId ? String(req.params.qrId).toUpperCase().trim() : '';
            if (!rawParam) {
                return res.status(400).json({ success: false, code: 'INVALID_TOKEN', message: "QR token is required." });
            }

            const record = await QRRecord.findOne({ qrId: rawParam });
            if (!record) {
                return res.status(404).json({
                    success: false,
                    code: 'NOT_FOUND',
                    message: "The requested QR code could not be resolved."
                });
            }

            // Check if QR is damaged, missing, inactive, or replaced
            const isInactive = ['INACTIVE', 'DAMAGED', 'MISSING', 'REPLACEMENT_PENDING', 'REPLACED'].includes(record.status);
            if (isInactive) {
                // If a replacement QR exists, route gracefully
                if (record.replacedBy) {
                    const replacement = await QRRecord.findOne({ qrId: record.replacedBy });
                    if (replacement && ['ACTIVE', 'INSTALLED', 'GENERATED'].includes(replacement.status)) {
                        return res.json({
                            success: true,
                            redirected: true,
                            redirect: true,
                            targetQrId: replacement.qrId,
                            redirectQrId: replacement.qrId,
                            landingUrl: `/q/${replacement.qrId}`,
                            message: "Redirecting to active replacement token."
                        });
                    }
                }

                return res.status(410).json({
                    success: false,
                    code: 'INACTIVE',
                    message: "This QR code is currently not active or is awaiting maintenance."
                });
            }

            // ⚡ Scan Tracking & Deduplication Logic
            // Prevent repeated refreshes from the same browser/IP within 60 seconds from inflating analytics
            const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '';
            const ipHash = hashIp(clientIp);
            const sessionId = req.query.sessionId || req.headers['x-session-id'] || ipHash;
            const now = new Date();
            const deduplicationWindowMs = 60 * 1000; // 60 seconds
            const cutoff = new Date(now.getTime() - deduplicationWindowMs);

            let isDuplicate = false;
            if (QRScan) {
                try {
                    const recentScan = await QRScan.findOne({
                        qrId: record.qrId,
                        $or: [
                            { sessionId: String(sessionId) },
                            { ipHash }
                        ],
                        scannedAt: { $gte: cutoff }
                    });

                    if (recentScan) {
                        isDuplicate = true;
                    } else {
                        await QRScan.create({
                            qrId: record.qrId,
                            areaId: record.areaId,
                            qrType: record.qrType,
                            sessionId: String(sessionId),
                            ipHash,
                            userAgent: req.headers['user-agent'] || '',
                            referrer: req.headers['referer'] || '',
                            scannedAt: now
                        });
                    }
                } catch (scanLogErr) {
                    console.warn("QR scan logging warning:", scanLogErr.message);
                }
            }

            // Increment scanCount only if not a rapid duplicate
            if (!isDuplicate) {
                await QRRecord.updateOne(
                    { qrId: record.qrId },
                    {
                        $inc: { scanCount: 1 },
                        $set: { lastScannedAt: now }
                    }
                );
                record.scanCount = (record.scanCount || 0) + 1;
                record.lastScannedAt = now;
            }

            const customerSafeQr = {
                qrId: record.qrId,
                areaId: record.areaId,
                areaCode: record.areaCode,
                areaName: record.areaName,
                qrType: record.qrType,
                venueName: record.venueName || record.areaName,
                placementName: record.placementName || '',
                landingUrl: record.landingUrl,
                campaignId: record.campaignId || '',
                active: record.status === 'ACTIVE' || record.status === 'INSTALLED',
                scanCount: record.scanCount,
                lastScannedAt: record.lastScannedAt
            };

            // Return customer-safe payload (NO internal financial metrics or CEO data)
            return res.json({
                success: true,
                ...customerSafeQr,
                qr: customerSafeQr
            });
        } catch (err) {
            console.error("GET /public/qr/:qrId error:", err);
            return res.status(500).json({ success: false, message: "QR resolution service error." });
        }
    });

    /**
     * 🌐 POST /public/qr/:qrId/scan
     * Explicit scan beacon endpoint for clients
     */
    app.post('/public/qr/:qrId/scan', async (req, res) => {
        try {
            const rawParam = req.params.qrId ? String(req.params.qrId).toUpperCase().trim() : '';
            const record = await QRRecord.findOne({ qrId: rawParam });
            if (!record) {
                return res.status(404).json({ success: false, message: "QR code not found." });
            }

            return res.json({
                success: true,
                qrId: record.qrId,
                recorded: true
            });
        } catch (err) {
            console.error("POST /public/qr/:qrId/scan error:", err);
            return res.status(500).json({ success: false, message: "Failed to record scan." });
        }
    });
}

module.exports = { registerQrPublicRoutes };

/**
 * Mongoose Models & Schemas for Dynamic QR Network
 * Varanasi Yatra Platform — Prompt 4
 */

const mongoose = require('mongoose');
const {
    ALL_QR_TYPES,
    ALL_QR_STATUSES,
    ALL_INSTALLATION_STATUSES,
    ALL_PERMISSION_STATUSES,
    AREA_STATUSES
} = require('./qrConstants');

// 1. Area Schema
const AreaSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: [AREA_STATUSES.ACTIVE, AREA_STATUSES.INACTIVE], default: AREA_STATUSES.ACTIVE },
    allowedQrTypes: [{
        type: String,
        enum: ALL_QR_TYPES
    }]
}, { timestamps: true });

// AreaSchema indexes (code is already uniquely indexed via property definition)
AreaSchema.index({ status: 1 });

// 2. QRRecord Schema
const QRRecordSchema = new mongoose.Schema({
    qrId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true, index: true },
    areaCode: { type: String, required: true, uppercase: true, trim: true },
    areaName: { type: String, required: true, trim: true },
    qrType: {
        type: String,
        required: true,
        enum: ALL_QR_TYPES,
        index: true
    },
    placementName: { type: String, required: true, trim: true },
    venueName: { type: String, default: '', trim: true },
    partnerId: { type: String, default: null },
    status: {
        type: String,
        enum: ALL_QR_STATUSES,
        default: 'DRAFT',
        index: true
    },
    installationStatus: {
        type: String,
        enum: ALL_INSTALLATION_STATUSES,
        default: 'PENDING',
        index: true
    },
    permissionStatus: {
        type: String,
        enum: ALL_PERMISSION_STATUSES,
        default: 'NOT_REQUIRED'
    },
    campaignId: { type: String, default: '' },
    landingUrl: { type: String, required: true },

    scanCount: { type: Number, default: 0 },
    leadCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },

    installedAt: { type: Date, default: null },
    lastScannedAt: { type: Date, default: null, index: true },

    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    photoUrl: { type: String, default: '' },

    replacementOf: { type: String, default: null },
    replacedBy: { type: String, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    installedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, default: '' },

    statusHistory: [{
        status: { type: String, required: true },
        changedBy: { type: String, default: 'System' },
        timestamp: { type: Date, default: Date.now },
        remarks: { type: String, default: '' }
    }]
}, { timestamps: true });

// QRRecordSchema compound indexes (qrId is already uniquely indexed via property definition)
QRRecordSchema.index({ areaId: 1, status: 1 });
QRRecordSchema.index({ areaId: 1, qrType: 1, status: 1 });
QRRecordSchema.index({ lastScannedAt: -1 });
QRRecordSchema.index({ createdAt: -1 });

// 3. QRScan Log Schema (Deduplication & Analytics)
const QRScanSchema = new mongoose.Schema({
    qrId: { type: String, required: true },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', index: true },
    qrType: { type: String, index: true },
    sessionId: { type: String, index: true },
    ipHash: { type: String },
    userAgentCategory: { type: String, default: 'mobile' },
    timestamp: { type: Date, default: Date.now, index: true }
});

QRScanSchema.index({ qrId: 1, timestamp: -1 });
QRScanSchema.index({ qrId: 1, sessionId: 1, timestamp: -1 });

module.exports = {
    AreaSchema,
    QRRecordSchema,
    QRScanSchema,
    createQrModels: (mongooseConn = mongoose) => ({
        Area: mongooseConn.models.Area || mongooseConn.model('Area', AreaSchema, 'areas'),
        QRRecord: mongooseConn.models.QRRecord || mongooseConn.model('QRRecord', QRRecordSchema, 'qr_records'),
        QRScan: mongooseConn.models.QRScan || mongooseConn.model('QRScan', QRScanSchema, 'qr_scans')
    })
};

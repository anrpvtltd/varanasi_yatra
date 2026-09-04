const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const helmet = require('helmet');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const { validateEnvironment } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { requestLogger } = require('./middleware/productionLogger');
const healthRoutes = require('./routes/healthRoutes');
const {
    uploadFileAttachment, getAttachments, getAttachmentById,
    getAttachmentBuffer, deleteAttachment, verifyFileAccessPermission
} = require('./storage/storageManager');
const { hashToken, sanitizeNoSQLInput } = require('./utils/security');
const { setAutomationEnabled, getAutomationEnabled, triggerAutomationEvent, manualRetryLog } = require('./automation/automationEngine');
const { getAutomationLogs } = require('./automation/automationLogger');
const { getNotificationProvider } = require('./automation/notificationService');
const { DEFAULT_TEMPLATES, renderTemplate } = require('./automation/messageTemplates');
const {
    generateDocument, regenerateDocument, getDocuments, getDocumentById,
    archiveDocument, createDocumentToken, validateAccessToken, readDocumentFile
} = require('./documents/documentService');

const env = validateEnvironment();
const app = express();

// Trust reverse proxy if running behind load balancers/cloud run/firebase
if (env.isProduction) {
    app.set('trust proxy', 1);
}

// 🛡️ Helmet Security Headers & CORS Configuration
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (env.allowedOrigins.includes(origin) || (!env.isProduction && !env.isStaging))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Extra HTTP Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    if (env.isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

app.use(express.json({ limit: '15mb' }));
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, env.jwtSecret);
            req.user = decoded;
        } catch {
            // Token invalid or expired
        }
    }
    next();
});
app.use(requestLogger);
app.use(healthRoutes);

// 🛡️ NoSQL Injection Prevention Middleware
app.use((req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeNoSQLInput(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeNoSQLInput(req.query);
        }
        next();
    } catch {
        return res.status(400).json({ success: false, message: "Invalid input syntax or operator injection detected." });
    }
});

// =========================================================================
// 🗂️ MONGODB SCHEMAS (6 WORKFLOW COLLECTIONS FOR CRM MASTER)
// =========================================================================
const baseSchemaFields = {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: 'offline-client@banarasyatra.com' },
    pickup: { type: String, default: 'Direct Booking' },
    destination: { type: String, default: 'Varanasi' },
    date: { type: String },
    travelers: { type: String, default: '1' },
    specialRequirements: { type: String, default: '' },
    createdBy: { type: String, default: 'Website' },
    status: { type: String, default: 'Pending' },
    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    cancellationReason: { type: String, default: '' },
    followUpDate: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    driverName: { type: String, default: '' },
    driverMobile: { type: String, default: '' },
    vehicleModel: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    hotelDetails: { type: String, default: '' },
    panditDetails: { type: String, default: '' },
    documents: [{ type: String }],
    leadSource: { type: String, default: 'Website' },
    city: { type: String, default: '' },
    tripDuration: { type: String, default: '3 Days' },
    stage: { type: String, default: 'NEW' },
    requirements: { type: mongoose.Schema.Types.Mixed, default: {} },
    activityHistory: [{
        timestamp: String,
        action: String,
        actor: String,
        details: String
    }],
    statusHistory: [{
        previousStatus: String,
        newStatus: String,
        updatedBy: String,
        updatedTime: String,
        remarks: String
    }]
};

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['CEO', 'Manager', 'MANAGER', 'ceo', 'manager'] },
    isActive: { type: Boolean, default: true },
    passwordChangeRequired: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');

const AuthSessionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    tokenHash: { type: String, required: true, index: true },
    sessionFamilyId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' }
}, { timestamps: true });

const AuthSession = mongoose.model('AuthSession', AuthSessionSchema, 'auth_sessions');

const MessageTemplateSchema = new mongoose.Schema({
    templateId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'GENERAL' },
    channel: { type: String, enum: ['WHATSAPP', 'EMAIL', 'BOTH'], default: 'WHATSAPP' },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    variables: [{ type: String }],
    isSystemDefault: { type: Boolean, default: false },
    updatedBy: { type: String, default: 'System' }
}, { timestamps: true });



async function initializeUsers() {
    try {
        const ceoEmail = process.env.CEO_EMAIL || 'ceo@banarasyatra.com';
        const ceoPassword = process.env.CEO_INITIAL_PASSWORD || 'CeoSecurePass123!';
        const managerEmail = process.env.MANAGER_EMAIL || 'manager@banarasyatra.com';
        const managerPassword = process.env.MANAGER_INITIAL_PASSWORD || 'ManagerSecurePass123!';

        // Seed CEO
        const existingCeo = await User.findOne({ role: 'CEO' });
        if (!existingCeo) {
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(ceoPassword, salt);
            const newCeo = new User({
                name: 'CEO Operations',
                email: ceoEmail.toLowerCase().trim(),
                passwordHash,
                role: 'CEO',
                isActive: true
            });
            await newCeo.save();
            console.log("🚩 Database Seed: CEO User initialized successfully!");
        } else {
            console.log("🚩 Database Seed: CEO User already exists.");
        }

        // Seed Manager
        const existingManager = await User.findOne({ role: 'Manager' });
        if (!existingManager) {
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(managerPassword, salt);
            const newManager = new User({
                name: 'Manager Operations',
                email: managerEmail.toLowerCase().trim(),
                passwordHash,
                role: 'Manager',
                isActive: true
            });
            await newManager.save();
            console.log("🚩 Database Seed: Manager User initialized successfully!");
        } else {
            console.log("🚩 Database Seed: Manager User already exists.");
        }
    } catch (err) {
        console.error("❌ Seeding initial users failed:", err);
    }
}

const EnquirySchema = new mongoose.Schema(baseSchemaFields, { timestamps: true });

const Enquiry = mongoose.model('Enquiry', EnquirySchema, 'enquiries');
const InProgressBooking = mongoose.model('InProgressBooking', EnquirySchema, 'inprogress_bookings');
const ConfirmedBooking = mongoose.model('ConfirmedBooking', EnquirySchema, 'confirmed_bookings');
const TripStartedBooking = mongoose.model('TripStartedBooking', EnquirySchema, 'tripstarted_bookings');
const CompletedBooking = mongoose.model('CompletedBooking', EnquirySchema, 'completed_bookings');
const CancelledBooking = mongoose.model('CancelledBooking', EnquirySchema, 'cancelled_bookings');

// =========================================================================
// 📑 PHASE 4 EXTENSION SCHEMAS (QUOTES & VENDORS)
// =========================================================================
const QuoteSchema = new mongoose.Schema({
    leadId: { type: String, required: true },
    quoteNumber: { type: String, required: true },
    version: { type: Number, default: 1 },
    packageType: { type: String, default: 'COMPLETE' },
    travelDate: { type: String, default: '' },
    travelers: { type: String, default: '1' },
    tripDuration: { type: String, default: '3 Days / 2 Nights' },
    servicesList: [{
        category: String,
        vendorId: String,
        serviceName: String,
        vendorName: String,
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'Item' },
        vendorCost: { type: Number, default: 0 },
        customerDisplayName: String,
        notes: String,
        commercialModel: { type: String, default: 'SELLING_PRICE' },
        resourceId: String,
        referenceCost: { type: Number, default: 0 },
        negotiatedVendorCost: { type: Number, default: 0 },
        customerSellingPrice: { type: Number, default: 0 },
        customerCharge: { type: Number, default: 0 },
        commissionRate: { type: Number, default: 0 },
        commissionAmount: { type: Number, default: 0 },
        passThroughAmount: { type: Number, default: 0 },
        rateRuleId: { type: String, default: '' }
    }],
    totalVendorCost: { type: Number, default: 0 },
    passThroughTotal: { type: Number, default: 0 },
    commissionTotal: { type: Number, default: 0 },
    marginType: { type: String, default: 'FIXED' },
    marginValue: { type: Number, default: 2500 },
    companyMargin: { type: Number, default: 2500 },
    suggestedCustomerPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    finalCustomerPrice: { type: Number, default: 0 },
    expectedProfit: { type: Number, default: 0 },
    status: { type: String, default: 'Draft' },
    validUntil: { type: String, default: '' },
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    termsNotes: { type: String, default: '' },
    createdBy: { type: String, default: 'Manager' }
}, { timestamps: true });


const VendorSchema = new mongoose.Schema({
    vendorCode: { type: String, default: '' },
    category: { type: String, required: true },
    businessName: { type: String, required: true },
    name: { type: String },
    contactPerson: { type: String, default: '' },
    phone: { type: String, default: '' },
    mobile: { type: String },
    alternatePhone: { type: String, default: '' },
    email: { type: String, default: '' },
    city: { type: String, default: 'Varanasi' },
    location: { type: String, default: 'Varanasi' },
    address: { type: String, default: '' },
    status: { type: String, default: 'ACTIVE' },
    availabilityStatus: { type: String, default: 'Active' },
    rating: { type: Number, default: 4.5 },
    baseRate: { type: Number, default: 0 },
    commercialModel: { type: String, default: 'SELLING_PRICE' },
    commissionPercent: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    rateRules: [{
        ruleId: String,
        ruleName: String,
        roomType: String,
        acType: { type: String, default: 'AC' },
        vehicleType: String,
        seatingCapacity: Number,
        vehicleName: String,
        route: String,
        slot: String,
        commercialModel: String,
        referenceRate: { type: Number, default: 0 },
        unit: { type: String, default: 'Item' },
        isActive: { type: Boolean, default: true },
        notes: String
    }],
    services: [{
        serviceId: String,
        serviceCategory: String,
        serviceName: String,
        description: String,
        unit: { type: String, default: 'ITEM' },
        baseRate: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        isActive: { type: Boolean, default: true }
    }],
    metadata: {
        hotelName: String,
        roomType: String,
        starCategory: String,
        vehicleType: String,
        capacity: Number,
        pujaType: String,
        rituals: [{ type: String }],
        languages: [{ type: String }],
        guideType: { type: String, default: 'DIRECT_SERVICE' },
        associatedGuideId: String,
        associatedGuideName: String,
        associatedPartnerId: String,
        associatedPartnerName: String,
        shopName: String,
        commissionType: { type: String, default: 'PERCENTAGE' },
        commissionValue: { type: Number, default: 0 },
        commissionRate: { type: Number, default: 0 },
        guideSharePercent: { type: Number, default: 0 },
        commissionTerms: String,
        templeName: String,
        passName: String,
        passType: String,
        passCost: { type: Number, default: 0 },
        agencyName: String,
        ceoOnlyNotes: String
    },
    performance: {
        totalAssignments: { type: Number, default: 0 },
        successfulAssignments: { type: Number, default: 0 },
        cancelledAssignments: { type: Number, default: 0 },
        issueCount: { type: Number, default: 0 },
        onTimeCount: { type: Number, default: 0 },
        reliabilityScore: { type: Number, default: null }
    }
}, { timestamps: true });


const BookingSchema = new mongoose.Schema({
    bookingNumber: { type: String, required: true, unique: true },
    leadId: { type: String, required: true },
    quoteId: { type: String, required: true },
    customerId: { type: String, default: '' },
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, default: '' },
        city: { type: String, default: '' }
    },
    travelDetails: {
        travelDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        travelers: { type: String, default: '1' },
        tripDuration: { type: String, default: '3 Days / 2 Nights' },
        pickup: { type: String, default: '' },
        destination: { type: String, default: 'Varanasi' }
    },
    packageDetails: {
        packageType: { type: String, default: 'COMPLETE' },
        packageName: { type: String, default: 'Complete All-Inclusive Package' },
        finalCustomerPrice: { type: Number, default: 0 }
    },
    services: [{
        serviceCategory: String,
        displayName: String,
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: 'Item' },
        vendorCostSnapshot: { type: Number, default: 0 },
        referenceCost: { type: Number, default: 0 },
        negotiatedVendorCost: { type: Number, default: 0 },
        customerSellingPrice: { type: Number, default: 0 },
        customerCharge: { type: Number, default: 0 },
        commercialModel: { type: String, default: 'SELLING_PRICE' },
        commissionRate: { type: Number, default: 0 },
        commissionAmount: { type: Number, default: 0 },
        passThroughAmount: { type: Number, default: 0 },
        resourceId: { type: String, default: '' },
        vendorId: { type: String, default: '' },
        vendorName: { type: String, default: '' },
        rateRuleId: { type: String, default: '' },
        status: { type: String, default: 'NOT_STARTED' },
        assignmentStatus: { type: String, default: 'Unassigned' }
    }],
    bookingStatus: { type: String, default: 'PENDING' },
    tripReadiness: {
        totalRequired: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        status: { type: String, default: 'INCOMPLETE' },
        missingItems: [{ type: String }]
    },
    preparationChecklist: [{
        serviceCategory: String,
        label: String,
        required: { type: Boolean, default: true },
        status: { type: String, default: 'NOT_STARTED' },
        completedAt: String,
        notes: String
    }],
    vendorAssignments: [{
        serviceCategory: String,
        serviceName: String,
        vendorId: String,
        plannedVendorId: String,
        actualVendorId: String,
        vendorName: String,
        contactPerson: String,
        mobile: String,
        commercialModel: String,
        plannedCost: { type: Number, default: 0 },
        actualCost: { type: Number, default: 0 },
        status: { type: String, default: 'Pending' },
        notes: String
    }],
    customerPaymentSummary: {
        packagePrice: { type: Number, default: 0 },
        totalPaid: { type: Number, default: 0 },
        customerDue: { type: Number, default: 0 },
        paymentStatus: { type: String, default: 'UNPAID' }
    },
    vendorPaymentSummary: {
        plannedVendorCost: { type: Number, default: 0 },
        actualVendorCost: { type: Number, default: 0 },
        totalPaidToVendors: { type: Number, default: 0 },
        vendorDue: { type: Number, default: 0 },
        paymentStatus: { type: String, default: 'NOT_PAID' }
    },
    profitSummary: {
        expectedProfit: { type: Number, default: 0 },
        actualRevenue: { type: Number, default: 0 },
        actualVendorExpense: { type: Number, default: 0 },
        additionalBusinessExpense: { type: Number, default: 0 },
        commissionIncome: { type: Number, default: 0 },
        actualProfit: { type: Number, default: 0 },
        profitStatus: { type: String, default: 'ESTIMATED' }
    },
    activityHistory: [{
        type: { type: String, default: 'INFO' },
        message: String,
        timestamp: String,
        performedBy: String
    }]
}, { timestamps: true });

// =========================================================================
// 💳 PHASE 4 PROMPT 6 — PAYMENT, EXPENSE & REAL PROFIT SCHEMAS
// =========================================================================

const CustomerPaymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true },
    customerId: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, default: 'UPI' }, // CASH, UPI, BANK_TRANSFER, CARD, OTHER
    paymentDate: { type: String, required: true },
    referenceNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, default: 'COMPLETED' },
    receivedBy: { type: String, default: '' }
}, { timestamps: true });

const VendorPaymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true },
    vendorId: { type: String, required: true },
    vendorNameSnapshot: { type: String, default: '' },
    serviceCategory: { type: String, default: 'OTHER' },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, default: 'BANK_TRANSFER' }, // CASH, UPI, BANK_TRANSFER, CARD, OTHER
    paymentDate: { type: String, required: true },
    referenceNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, default: 'COMPLETED' },
    paidBy: { type: String, default: '' }
}, { timestamps: true });

const BusinessExpenseSchema = new mongoose.Schema({
    expenseId: { type: String, required: true, unique: true },
    bookingId: { type: String, default: '' },
    expenseCategory: { type: String, required: true }, // MARKETING, OFFICE, TRAVEL, STAFF, COMMISSION, REFUND, OTHER
    description: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0.01 },
    expenseDate: { type: String, required: true },
    paymentMethod: { type: String, default: 'UPI' },
    referenceNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: String, default: '' }
}, { timestamps: true });


// eslint-disable-next-line no-unused-vars
const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
// eslint-disable-next-line no-unused-vars
const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
// eslint-disable-next-line no-unused-vars
const Booking = mongoose.model('Booking', BookingSchema, 'bookings');



const modelsMap = {
    'Pending': Enquiry,
    'In-Progress': InProgressBooking,
    'Confirmed': ConfirmedBooking,
    'Trip Started': TripStartedBooking,
    'Completed': CompletedBooking,
    'Cancelled': CancelledBooking
};


// Models map for unified lookups

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function findLeadAcrossCollections(id) {
    for (const model of Object.values(modelsMap)) {
        const doc = await model.findById(id);
        if (doc) return { doc, currentModel: model };
    }
    return null;
}

async function fetchAllLeadsAcrossCollections() {
    const results = await Promise.all(Object.values(modelsMap).map(m => m.find()));
    return results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

const rateLimit = require('express-rate-limit');

const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many incorrect PIN attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "Too many token refresh attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

const financialLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, message: "Too many financial operations. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

const enquiryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many enquiry submissions from this IP. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Access token missing. Please log in." });
    }

    jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'], issuer: env.jwtIssuer, audience: env.jwtAudience }, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Session expired or invalid. Please log in again." });
        }
        req.user = decoded;
        next();
    });
}

function requireRole(roles) {
    const roleList = Array.isArray(roles) ? roles.map(r => String(r).toUpperCase()) : [String(roles).toUpperCase()];
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing authentication token." });
        }
        const userRole = String(req.user.role).toUpperCase();
        if (!roleList.includes(userRole)) {
            return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions." });
        }
        next();
    };
}

// 🔐 Secure Login Route (Supports both /admin/login and /auth/login)
const handleLogin = async (req, res) => {
    try {
        const { email, password, loginType } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: "Invalid credentials or account is inactive." });
        }

        const isMatch = bcrypt.compareSync(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        if (loginType) {
            const reqType = String(loginType).toUpperCase();
            const userRole = String(user.role).toUpperCase();
            if (reqType === 'CEO' && userRole !== 'CEO') {
                return res.status(403).json({ success: false, message: "This email does not have CEO access." });
            }
            if ((reqType === 'TEAM' || reqType === 'MANAGER') && userRole !== 'MANAGER') {
                return res.status(403).json({ success: false, message: "This email does not have Team/Manager access." });
            }
        }

        user.lastLoginAt = new Date();
        await user.save();

        const sessionId = crypto.randomBytes(16).toString('hex');
        const sessionFamilyId = crypto.randomBytes(16).toString('hex');
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = hashToken(refreshToken);

        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const newSession = new AuthSession({
            userId: String(user._id),
            tokenHash,
            sessionFamilyId,
            expiresAt: refreshExpiresAt,
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || ''
        });
        await newSession.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, sessionId },
            env.jwtSecret,
            { expiresIn: env.jwtAccessExpiresIn, algorithm: 'HS256', issuer: env.jwtIssuer, audience: env.jwtAudience }
        );

        return res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt,
                passwordChangeRequired: !!user.passwordChangeRequired
            }
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).json({ success: false, message: "Login failed due to a server error." });
    }
};

app.post('/admin/login', loginLimiter, handleLogin);
app.post('/auth/login', loginLimiter, handleLogin);

// 🔄 Refresh Token Rotation Route
const handleRefreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: "Refresh token is required." });
        }

        const tokenHash = hashToken(refreshToken);
        const session = await AuthSession.findOne({ tokenHash });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            if (session && !session.revokedAt) {
                // Token reuse detected - revoke entire session family
                await AuthSession.updateMany({ sessionFamilyId: session.sessionFamilyId }, { $set: { revokedAt: new Date() } });
            }
            return res.status(401).json({ success: false, message: "Invalid or expired refresh session. Please log in again." });
        }

        // Revoke old refresh token (rotation)
        session.revokedAt = new Date();
        await session.save();

        const user = await User.findById(session.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: "User account is inactive or no longer exists." });
        }

        const newRefreshToken = crypto.randomBytes(40).toString('hex');
        const newTokenHash = hashToken(newRefreshToken);
        const newSessionId = crypto.randomBytes(16).toString('hex');

        const nextSession = new AuthSession({
            userId: String(user._id),
            tokenHash: newTokenHash,
            sessionFamilyId: session.sessionFamilyId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip || ''
        });
        await nextSession.save();

        const accessToken = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name, sessionId: newSessionId },
            env.jwtSecret,
            { expiresIn: env.jwtAccessExpiresIn, algorithm: 'HS256', issuer: env.jwtIssuer, audience: env.jwtAudience }
        );

        return res.status(200).json({
            success: true,
            token: accessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("❌ Token Refresh Error:", error);
        return res.status(500).json({ success: false, message: "Token refresh failed." });
    }
};

app.post('/auth/refresh', refreshLimiter, handleRefreshToken);
app.post('/admin/refresh', refreshLimiter, handleRefreshToken);

// 🚪 Logout & Token Revocation Routes
const handleLogoutAction = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const tokenHash = hashToken(refreshToken);
            await AuthSession.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
        }
        return res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch {
        return res.status(500).json({ success: false, message: "Logout failed." });
    }
};

app.post('/auth/logout', handleLogoutAction);
app.post('/admin/logout', handleLogoutAction);

app.post('/auth/logout-all', authenticateToken, async (req, res) => {
    try {
        await AuthSession.updateMany({ userId: String(req.user.id), revokedAt: null }, { $set: { revokedAt: new Date() } });
        return res.status(200).json({ success: true, message: "All sessions revoked successfully." });
    } catch {
        return res.status(500).json({ success: false, message: "Revoking all sessions failed." });
    }
});


// 🔑 Token Verification Route
app.get('/admin/verify-token', authenticateToken, (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// 🔄 Password Recovery (Forgot Password)
app.post('/auth/forgot-password', loginLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email address is required." });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.isActive) {
            // For security, do not disclose non-existent accounts
            return res.status(200).json({
                success: true,
                message: "If an active account exists with this email, password reset instructions have been generated."
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
        await user.save();

        console.log(`🔑 [AUTH] Password reset requested for ${user.email}. Reset Token: ${resetToken}`);

        const responseData = {
            success: true,
            message: "Password reset instructions have been generated."
        };
        if (!env.isProduction) {
            responseData.resetToken = resetToken;
        }
        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Password reset request failed." });
    }
});

// 🔐 Reset Password with Secure Token
app.post('/auth/reset-password', loginLimiter, async (req, res) => {
    try {
        const token = req.body.token || req.body.resetToken;
        const newPassword = req.body.newPassword || req.body.password;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: "Reset token and new password are required." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user || !user.isActive) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
        }

        const salt = bcrypt.genSaltSync(10);
        user.passwordHash = bcrypt.hashSync(newPassword, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        // Invalidate active sessions
        await AuthSession.updateMany({ userId: String(user._id) }, { $set: { revokedAt: new Date() } });

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, message: "Password reset failed." });
    }
});

// 🔒 Change Password for Authenticated User
app.post('/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Current password and new password are required." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
        }

        const user = await User.findById(req.user.id);
        if (!user || !user.isActive) {
            return res.status(404).json({ success: false, message: "User account not found or inactive." });
        }

        const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Current password is incorrect." });
        }

        const salt = bcrypt.genSaltSync(10);
        user.passwordHash = bcrypt.hashSync(newPassword, salt);
        user.passwordChangeRequired = false;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ success: false, message: "Failed to change password." });
    }
});

// 👥 Admin User Management (CEO Only)
app.get('/admin/users', authenticateToken, requireRole('CEO'), async (req, res) => {
    try {
        const users = await User.find({}, 'name email role isActive createdAt lastLoginAt passwordChangeRequired').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("Fetch users error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch user accounts." });
    }
});

app.post('/admin/users', authenticateToken, requireRole('CEO'), async (req, res) => {
    try {
        const temporaryPassword = req.body.temporaryPassword || req.body.password;
        const { name, email, role } = req.body;
        if (!name || !email || !role || !temporaryPassword) {
            return res.status(400).json({ success: false, message: "Name, email, role, and temporary password are required." });
        }
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ success: false, message: "A user with this email already exists." });
        }
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(temporaryPassword, salt);
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: role === 'CEO' ? 'CEO' : 'Manager',
            isActive: true,
            passwordChangeRequired: true
        });
        await newUser.save();
        return res.status(201).json({
            success: true,
            message: "User account created successfully.",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isActive: newUser.isActive,
                passwordChangeRequired: newUser.passwordChangeRequired,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error("Create user error:", error);
        return res.status(500).json({ success: false, message: "Failed to create user account." });
    }
});

// 🔄 Toggle User Status (Activate / Deactivate) - CEO Only
app.patch('/admin/users/:id/status', authenticateToken, requireRole('CEO'), async (req, res) => {
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
        user.isActive = isActive;
        await user.save();

        if (!isActive) {
            // Revoke active sessions for deactivated user immediately
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
                isActive: user.isActive,
                passwordChangeRequired: user.passwordChangeRequired
            }
        });
    } catch (error) {
        console.error("Update user status error:", error);
        return res.status(500).json({ success: false, message: "Failed to update user account status." });
    }
});

// 🔑 Reset User Password with Temporary Password - CEO Only
app.post('/admin/users/:id/reset-password', authenticateToken, requireRole('CEO'), async (req, res) => {
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

        // Invalidate all existing active sessions
        await AuthSession.updateMany({ userId: String(id) }, { $set: { revokedAt: new Date() } });

        return res.status(200).json({
            success: true,
            message: "Temporary password set successfully. User must change password upon next login.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                passwordChangeRequired: user.passwordChangeRequired
            }
        });
    } catch (error) {
        console.error("Reset user password error:", error);
        return res.status(500).json({ success: false, message: "Failed to reset user password." });
    }
});

// Routes
app.post('/admin/verify-pin', pinLimiter, (req, res) => {
    try {
        const { pin } = req.body;
        const SECRET_PIN = process.env.ADMIN_PIN || "1234";
        if (pin === SECRET_PIN) {
            return res.status(200).json({ success: true, message: "PIN verified successfully!" });
        }
        return res.status(401).json({ success: false, message: "Invalid access PIN." });
    } catch {
        return res.status(500).json({ success: false, message: "Server authentication error." });
    }
});

// 📥 1. Website Form Submission (Lead Collection Only)
app.post('/api/enquiry', enquiryLimiter, async (req, res) => {
    try {
        const { name, mobile, email, pickup, destination, date, travelers, specialRequirements } = req.body;
        if (!name || !mobile) {
            return res.status(400).json({ success: false, message: "Required fields missing." });
        }

        const initialHistory = [{
            previousStatus: 'None',
            newStatus: 'Pending',
            updatedBy: 'Website Form',
            updatedTime: new Date().toISOString(),
            remarks: 'New lead enquiry received via customer portal'
        }];

        const newLead = new Enquiry({
            name,
            mobile,
            email: email || 'offline-client@banarasyatra.com',
            pickup: pickup || 'Varanasi',
            destination: destination || 'Varanasi',
            date: date || '',
            travelers: travelers || '1',
            specialRequirements: specialRequirements || '',
            createdBy: 'Website',
            status: 'Pending',
            statusHistory: initialHistory
        });

        await newLead.save();

        // ✉️ Admin Alert Email ONLY (No email sent to customer)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const adminMail = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `🟡 New Website Inquiry Alert: ${name}`,
                html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1.5px solid #f59e0b; border-radius: 16px; background-color: #fafaf9; color: #1c1917;">
    <div style="text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #d97706; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">🚩 BANARAS YATRA</h2>
        <p style="color: #78716c; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">New Website Travel Enquiry Received</p>
    </div>

    <div style="margin-bottom: 20px;">
        <p style="font-size: 14px; margin: 0 0 15px 0; color: #44403c;">A new booking/sightseeing query has been submitted through the website form. Details are provided below:</p>

        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706; width: 40%;">👤 Customer Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${name}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">📞 Mobile Number:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">
                    <a href="tel:${mobile}" style="color: #d97706; text-decoration: none;">${mobile}</a>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">✉️ Email Address:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${email || 'Not Provided'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">📍 Pickup Point:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${pickup || 'Varanasi'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">🗺️ Destination:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${destination || 'Varanasi'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">📅 Travel Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${date || 'Flexible'}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">👥 No. of Travelers:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${travelers || '1'}</td>
            </tr>
        </table>
    </div>

    <div style="text-align: center; margin-top: 25px; border-top: 1px solid #e7e5e4; padding-top: 15px;">
        <a href="https://varanasi-yatra.vercel.app/?view=admin" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 12px; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Open Admin CRM Portal ➔</a>
    </div>
</div>`
            };
            try {
                await transporter.sendMail(adminMail);
            } catch (mailError) {
                console.error("❌ Admin Alert Email failed to send:", mailError);
            }
        }

        return res.status(200).json({ success: true, message: "🎉 Query registered successfully!", data: newLead });
    } catch (error) {
        console.error("❌ Website Enquiry Route Failure:", error);
        return res.status(500).json({ success: false, message: "Server Error." });
    }
});

// 📊 2. Fetch All Combined Leads for CRM Dashboard across 6 workflow collections
app.get('/admin/enquiries', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const allLeads = await fetchAllLeadsAcrossCollections();

        // Filter sensitive financial data based on role
        const role = req.user.role;
        const filteredLeads = allLeads.map(lead => {
            const leadObj = lead.toObject();
            if (role !== 'CEO') {
                // Ensure no sensitive lead or company financial fields leak to Manager
                delete leadObj.totalAmount;
                delete leadObj.advanceAmount;
                delete leadObj.remainingAmount;
                delete leadObj.vendorCost;
                delete leadObj.margin;
                delete leadObj.profit;
                delete leadObj.profitMargin;
                delete leadObj.companyExpense;
                delete leadObj.agentCommission;
                delete leadObj.salary;
                delete leadObj.expectedProfit;
                delete leadObj.vendorPayable;
                delete leadObj.ceoOnlyNotes;
            }
            return leadObj;
        });

        return res.status(200).json({ success: true, data: filteredLeads });
    } catch (error) {
        console.error("❌ Fetch Enquiries Error:", error);
        return res.status(500).json({ success: false, message: "Error fetching leads." });
    }
});

// ✏️ 3. Master CRM Lead Update Route (All operational parameters + Status History Audit)
app.post('/admin/enquiry/update/:id', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const {
            name, mobile, email, date, travelers, city, leadSource, tripDuration, requirements,
            status, totalAmount, advanceAmount,
            cancellationReason, followUpDate, adminNotes,
            destination, specialRequirements,
            driverName, driverMobile, vehicleModel, vehicleNumber,
            hotelDetails, panditDetails, documents, remarks
        } = req.body;

        const targetModel = modelsMap[status];
        if (!targetModel) {
            return res.status(400).json({ success: false, message: "Invalid lead status." });
        }

        const searchResult = await findLeadAcrossCollections(req.params.id);
        if (!searchResult) {
            return res.status(404).json({ success: false, message: "Lead record not found." });
        }

        const { doc, currentModel } = searchResult;

        const isCeo = req.user.role === 'CEO';
        const userIdentifier = `${req.user.role}: ${req.user.name}`;

        // Build updated status history audit log
        let history = doc.statusHistory ? [...doc.statusHistory] : [];
        if (doc.status !== status) {
            history.push({
                previousStatus: doc.status || 'Pending',
                newStatus: status,
                updatedBy: userIdentifier,
                updatedTime: new Date().toISOString(),
                remarks: remarks || `Status changed from ${doc.status} to ${status}`
            });
        } else if (remarks) {
            history.push({
                previousStatus: status,
                newStatus: status,
                updatedBy: userIdentifier,
                updatedTime: new Date().toISOString(),
                remarks: remarks
            });
        }

        // Enforce role checks on financial values
        let tot = doc.totalAmount || 0;
        let adv = doc.advanceAmount || 0;
        if (isCeo) {
            tot = (totalAmount !== undefined && !isNaN(Number(totalAmount))) ? Number(totalAmount) : (doc.totalAmount || 0);
            adv = (advanceAmount !== undefined && !isNaN(Number(advanceAmount))) ? Number(advanceAmount) : (doc.advanceAmount || 0);
        } else {
            console.log(`⚠️ Manager ${req.user.name} attempted to modify financials. Ignoring adjustments.`);
        }
        const rem = tot - adv;

        const updateFields = {
            ...(name ? { name } : {}),
            ...(mobile ? { mobile } : {}),
            ...(email ? { email } : {}),
            ...(date ? { date } : {}),
            ...(travelers ? { travelers } : {}),
            ...(city ? { city } : {}),
            ...(leadSource ? { leadSource } : {}),
            ...(tripDuration ? { tripDuration } : {}),
            ...(requirements !== undefined ? { requirements } : {}),
            status,
            totalAmount: tot,
            advanceAmount: adv,
            remainingAmount: rem,
            cancellationReason: cancellationReason !== undefined ? cancellationReason : (doc.cancellationReason || ''),
            followUpDate: followUpDate !== undefined ? followUpDate : (doc.followUpDate || ''),
            adminNotes: adminNotes !== undefined ? adminNotes : (doc.adminNotes || ''),
            destination: destination || doc.destination || 'Varanasi',
            specialRequirements: specialRequirements !== undefined ? specialRequirements : (doc.specialRequirements || ''),
            driverName: driverName !== undefined ? driverName : (doc.driverName || ''),
            driverMobile: driverMobile !== undefined ? driverMobile : (doc.driverMobile || ''),
            vehicleModel: vehicleModel !== undefined ? vehicleModel : (doc.vehicleModel || ''),
            vehicleNumber: vehicleNumber !== undefined ? vehicleNumber : (doc.vehicleNumber || ''),
            hotelDetails: hotelDetails !== undefined ? hotelDetails : (doc.hotelDetails || ''),
            panditDetails: panditDetails !== undefined ? panditDetails : (doc.panditDetails || ''),
            documents: documents || doc.documents || [],
            statusHistory: history
        };

        let updatedData;

        if (currentModel !== targetModel) {
            const newDocData = {
                ...doc.toObject(),
                ...updateFields
            };
            delete newDocData.__v;
            updatedData = await targetModel.findByIdAndUpdate(
                req.params.id,
                { $set: newDocData },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            await currentModel.findByIdAndDelete(req.params.id);
        } else {
            updatedData = await currentModel.findByIdAndUpdate(
                req.params.id,
                updateFields,
                { new: true }
            );
        }

        // NOTE: Customer email notification removed as per CRM Master spec.
        return res.status(200).json({ success: true, message: "CRM Lead updated successfully!", data: updatedData });
    } catch (error) {
        console.error("❌ Update Route Failure:", error);
        return res.status(500).json({ success: false, message: "Update failed." });
    }
});

// ➕ 4. Offline Manual Lead Creation Route
app.post('/admin/enquiry/manual', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const {
            name, mobile, email, pickup, destination, date, travelers,
            leadSource, city, tripDuration, requirements,
            specialRequirements, status, totalAmount, advanceAmount, adminNotes,
            driverName, driverMobile, vehicleModel, vehicleNumber, hotelDetails, panditDetails, remarks
        } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({ success: false, message: "Name and Mobile number are required." });
        }

        const isCeo = req.user.role === 'CEO';
        const total = isCeo ? (Number(totalAmount) || 0) : 0;
        const advance = isCeo ? (Number(advanceAmount) || 0) : 0;
        const currentStatus = status || 'Pending';
        const targetModel = modelsMap[currentStatus] || Enquiry;

        const userIdentifier = `${req.user.role}: ${req.user.name}`;

        const initialHistory = [{
            previousStatus: 'None',
            newStatus: currentStatus,
            updatedBy: userIdentifier,
            updatedTime: new Date().toISOString(),
            remarks: remarks || 'Manual offline lead recorded'
        }];

        const manualLead = new targetModel({
            name,
            mobile,
            email: email || 'offline-client@banarasyatra.com',
            pickup: pickup || 'Direct Local Visit',
            destination: destination || 'Varanasi',
            date: date || new Date().toISOString().split('T')[0],
            travelers: travelers || '1',
            leadSource: leadSource || 'Offline/Manual',
            city: city || '',
            tripDuration: tripDuration || '3 Days',
            requirements: requirements || {},
            specialRequirements: specialRequirements || '',
            createdBy: 'Manual CRM',
            status: currentStatus,
            totalAmount: total,
            advanceAmount: advance,
            remainingAmount: total - advance,
            adminNotes: adminNotes || '',
            driverName: driverName || '',
            driverMobile: driverMobile || '',
            vehicleModel: vehicleModel || '',
            vehicleNumber: vehicleNumber || '',
            hotelDetails: hotelDetails || '',
            panditDetails: panditDetails || '',
            documents: [],
            statusHistory: initialHistory
        });

        await manualLead.save();
        return res.status(200).json({ success: true, message: "Manual lead created successfully!", data: manualLead });
    } catch (error) {
        console.error("❌ Manual Lead Error:", error);
        return res.status(500).json({ success: false, message: "Failed to create manual lead." });
    }
});

// =========================================================================
// 📑 PHASE 4 PROMPT 3 — QUOTE API ENDPOINTS
// =========================================================================

// Strict Financial Privacy Sanitizers for Manager Role
function sanitizeQuoteForManager(q) {
    if (!q) return q;
    const raw = q.toObject ? q.toObject() : { ...q };
    delete raw.totalVendorCost;
    delete raw.expectedProfit;
    delete raw.companyMargin;
    delete raw.marginValue;
    delete raw.marginType;
    delete raw.ceoNotes;
    if (Array.isArray(raw.services)) {
        raw.services = raw.services.map(s => {
            const sc = { ...s };
            delete sc.vendorCost;
            delete sc.plannedVendorCost;
            delete sc.negotiatedVendorCost;
            delete sc.referenceCost;
            delete sc.baseCost;
            return sc;
        });
    }
    if (Array.isArray(raw.servicesList)) {
        raw.servicesList = raw.servicesList.map(s => {
            const sc = { ...s };
            delete sc.vendorCost;
            delete sc.plannedVendorCost;
            delete sc.negotiatedVendorCost;
            delete sc.referenceCost;
            delete sc.baseCost;
            return sc;
        });
    }
    return raw;
}

function sanitizeBookingForManager(b) {
    if (!b) return b;
    const raw = b.toObject ? b.toObject() : { ...b };
    delete raw.vendorCost;
    delete raw.plannedVendorCost;
    delete raw.negotiatedVendorCost;
    delete raw.vendorPaid;
    delete raw.vendorDue;
    delete raw.vendorPayable;
    delete raw.vendorPayments;
    delete raw.vendorPaymentSummary;
    delete raw.expenses;
    delete raw.expectedProfit;
    delete raw.realizedProfit;
    delete raw.companyMargin;
    delete raw.margin;
    delete raw.ceoNotes;
    if (raw.packageDetails) {
        delete raw.packageDetails.totalVendorCost;
        delete raw.packageDetails.expectedProfit;
        delete raw.packageDetails.companyMargin;
    }
    if (raw.profitSummary) {
        delete raw.profitSummary.expectedProfit;
        delete raw.profitSummary.actualVendorExpense;
        delete raw.profitSummary.additionalBusinessExpense;
        delete raw.profitSummary.actualProfit;
    }
    if (Array.isArray(raw.services)) {
        raw.services = raw.services.map(s => {
            const sc = { ...s };
            delete sc.vendorCost;
            delete sc.vendorCostSnapshot;
            delete sc.plannedVendorCost;
            delete sc.negotiatedVendorCost;
            delete sc.referenceCost;
            delete sc.baseCost;
            delete sc.vendorPaid;
            delete sc.vendorDue;
            return sc;
        });
    }
    if (Array.isArray(raw.servicesList)) {
        raw.servicesList = raw.servicesList.map(s => {
            const sc = { ...s };
            delete sc.vendorCost;
            delete sc.vendorCostSnapshot;
            delete sc.plannedVendorCost;
            delete sc.negotiatedVendorCost;
            delete sc.referenceCost;
            delete sc.baseCost;
            delete sc.vendorPaid;
            delete sc.vendorDue;
            return sc;
        });
    }
    return raw;
}

// 1. Fetch all Quote versions for a Lead
app.get('/admin/quotes/lead/:leadId', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
        const quotes = await Quote.find({ leadId: req.params.leadId }).sort({ version: -1 });
        const finalQuotes = req.user.role === 'CEO' ? quotes : quotes.map(sanitizeQuoteForManager);
        return res.status(200).json({ success: true, quotes: finalQuotes });
    } catch (error) {
        console.error("❌ Fetch Quotes Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch quotes." });
    }
});

// 2. Create or revise Quote (Auto-increments Version v1, v2...)
app.post('/admin/quote/create', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
        const {
            leadId, packageType, travelDate, travelers, tripDuration,
            servicesList, marginType, marginValue, discount,
            inclusions, exclusions, termsNotes, status
        } = req.body;

        if (!leadId) {
            return res.status(400).json({ success: false, message: "leadId is required." });
        }

        // Check existing quote count to increment version
        const existingQuotes = await Quote.find({ leadId }).sort({ version: -1 });
        const nextVersion = existingQuotes.length > 0 ? (existingQuotes[0].version + 1) : 1;
        const quoteNumber = existingQuotes.length > 0
            ? existingQuotes[0].quoteNumber
            : `VY-Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Calculate Financials Server-Side supporting Commercial Models
        const validServices = Array.isArray(servicesList) ? servicesList : [];
        const numericDiscount = Number(discount) || 0;
        const hasCommercialModel = validServices.some(s => 
            s.commercialModel !== undefined || 
            s.customerSellingPrice !== undefined || 
            s.negotiatedVendorCost !== undefined ||
            s.passThroughAmount !== undefined
        );

        let totalCustomerCharge = 0;
        let totalVendorCost = 0;
        let passThroughTotal = 0;
        let commissionTotal = 0;
        let companyMargin = 0;
        let suggestedCustomerPrice = 0;
        let finalCustomerPrice = 0;
        let expectedProfit = 0;

        if (hasCommercialModel) {
            validServices.forEach(item => {
                const qty = Number(item.quantity) || 1;
                const model = item.commercialModel || 'SELLING_PRICE';

                if (model === 'SELLING_PRICE') {
                    const refCost = Number(item.referenceCost !== undefined ? item.referenceCost : (item.vendorCost || 0));
                    const sellingPrice = Number(
                        item.customerSellingPrice !== undefined 
                            ? item.customerSellingPrice 
                            : (item.customerCharge !== undefined ? item.customerCharge : (refCost || Number(item.vendorCost) || 0))
                    );
                    item.referenceCost = refCost;
                    item.customerSellingPrice = sellingPrice;
                    item.customerCharge = sellingPrice * qty;
                    item.vendorCost = refCost;
                    totalVendorCost += refCost * qty;
                    totalCustomerCharge += item.customerCharge;
                } else if (model === 'FIXED_VENDOR_RATE') {
                    const fixedRate = Number(item.referenceCost !== undefined ? item.referenceCost : (item.vendorCost || 0));
                    const sellingPrice = Number(
                        item.customerSellingPrice !== undefined && item.customerSellingPrice > 0 
                            ? item.customerSellingPrice 
                            : fixedRate
                    );
                    item.referenceCost = fixedRate;
                    item.customerSellingPrice = sellingPrice;
                    item.customerCharge = sellingPrice * qty;
                    item.vendorCost = fixedRate;
                    totalVendorCost += fixedRate * qty;
                    totalCustomerCharge += item.customerCharge;
                } else if (model === 'VENDOR_QUOTE_REQUIRED') {
                    const negotiated = Number(item.negotiatedVendorCost !== undefined ? item.negotiatedVendorCost : (item.vendorCost || 0));
                    const sellingPrice = Number(
                        item.customerSellingPrice !== undefined 
                            ? item.customerSellingPrice 
                            : (item.customerCharge !== undefined ? item.customerCharge : negotiated)
                    );
                    item.negotiatedVendorCost = negotiated;
                    item.customerSellingPrice = sellingPrice;
                    item.customerCharge = sellingPrice * qty;
                    item.vendorCost = negotiated;
                    totalVendorCost += negotiated * qty;
                    totalCustomerCharge += item.customerCharge;
                } else if (model === 'CUSTOMER_DIRECT') {
                    item.vendorCost = 0;
                    item.customerSellingPrice = 0;
                    item.customerCharge = 0;
                } else if (model === 'COMMISSION') {
                    item.vendorCost = 0;
                    item.customerSellingPrice = 0;
                    item.customerCharge = 0;
                    const comm = Number(item.commissionAmount) || 0;
                    commissionTotal += comm;
                } else if (model === 'PASS_THROUGH') {
                    const passAmount = Number(
                        item.passThroughAmount !== undefined 
                            ? item.passThroughAmount 
                            : (item.customerSellingPrice !== undefined 
                                ? item.customerSellingPrice 
                                : (item.referenceCost || item.vendorCost || 0))
                    );
                    item.passThroughAmount = passAmount;
                    item.referenceCost = passAmount;
                    item.vendorCost = passAmount;
                    item.customerSellingPrice = passAmount;
                    item.customerCharge = passAmount * qty;
                    passThroughTotal += item.customerCharge;
                    totalVendorCost += passAmount * qty;
                    totalCustomerCharge += item.customerCharge;
                } else {
                    const c = Number(item.vendorCost) || 0;
                    const sp = Number(item.customerSellingPrice !== undefined ? item.customerSellingPrice : c);
                    item.customerCharge = sp * qty;
                    totalVendorCost += c * qty;
                    totalCustomerCharge += item.customerCharge;
                }
            });

            suggestedCustomerPrice = totalCustomerCharge;
            finalCustomerPrice = Math.max(0, totalCustomerCharge - numericDiscount);
            expectedProfit = finalCustomerPrice - totalVendorCost + commissionTotal;
            companyMargin = expectedProfit;
        } else {
            totalVendorCost = validServices.reduce((sum, item) => {
                const c = Number(item.vendorCost) || 0;
                const q = Number(item.quantity) || 1;
                return sum + (c * q);
            }, 0);

            const numericMargin = Number(marginValue) || 0;
            if (marginType === 'PERCENTAGE') {
                companyMargin = Math.round((totalVendorCost * numericMargin) / 100);
            } else {
                companyMargin = numericMargin;
            }

            suggestedCustomerPrice = totalVendorCost + companyMargin;
            finalCustomerPrice = Math.max(0, suggestedCustomerPrice - numericDiscount);
            expectedProfit = finalCustomerPrice - totalVendorCost;
        }

        const newQuote = new Quote({
            leadId,
            quoteNumber,
            version: nextVersion,
            packageType: packageType || 'COMPLETE',
            travelDate: travelDate || '',
            travelers: travelers || '1',
            tripDuration: tripDuration || '3 Days / 2 Nights',
            servicesList: validServices,
            totalVendorCost,
            passThroughTotal,
            commissionTotal,
            marginType: marginType || 'FIXED',
            marginValue: Number(marginValue) || 0,
            companyMargin,
            suggestedCustomerPrice,
            discount: numericDiscount,
            finalCustomerPrice,
            expectedProfit,
            status: status || 'SENT',
            inclusions: inclusions || ['AC Transport & Driver', 'Hotel Accommodation', 'VIP Fast-Track Temple Darshan'],
            exclusions: exclusions || ['Personal Shopping', 'Flight / Train Tickets'],
            termsNotes: termsNotes || '50% Token advance required to lock dates & hotel booking.',
            createdBy: `${req.user.role}: ${req.user.name}`
        });

        await newQuote.save();

        // Update target Lead stage to QUOTED & In-Progress
        let foundLead = null;
        for (const model of Object.values(modelsMap)) {
            foundLead = await model.findById(leadId);
            if (foundLead) {
                foundLead.stage = 'QUOTED';
                foundLead.status = 'In-Progress';
                foundLead.quoteNumber = quoteNumber;
                foundLead.quoteStatus = newQuote.status;
                if (req.user.role === 'CEO') {
                    foundLead.totalAmount = finalCustomerPrice;
                    foundLead.remainingAmount = finalCustomerPrice - (foundLead.advanceAmount || 0);
                }
                await foundLead.save();
                break;
            }
        }

        const retQuote = req.user.role === 'CEO' ? newQuote : sanitizeQuoteForManager(newQuote);
        return res.status(200).json({
            success: true,
            message: `Quote Version ${nextVersion} created successfully!`,
            quote: retQuote
        });
    } catch (error) {
        console.error("❌ Create Quote Error:", error);
        return res.status(500).json({ success: false, message: "Quote creation failed." });
    }
});

// 3. Update Draft Quote or Status
app.put('/admin/quote/update/:id', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
        const updated = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Quote not found." });
        }
        const retQuote = req.user.role === 'CEO' ? updated : sanitizeQuoteForManager(updated);
        return res.status(200).json({ success: true, message: "Quote updated successfully!", quote: retQuote });
    } catch (error) {
        console.error("❌ Update Quote Error:", error);
        return res.status(500).json({ success: false, message: "Quote update failed." });
    }
});

// 4. Customer-Facing View Endpoint (Financial Privacy Enforced — Strips Vendor Costs & Profit)
app.get('/admin/quote/customer-view/:id', async (req, res) => {
    try {
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
        const quote = await Quote.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: "Quote proposal not found." });
        }

        // Sanitize internal financial metadata
        const customerQuote = {
            quoteNumber: quote.quoteNumber,
            version: quote.version,
            packageType: quote.packageType,
            travelDate: quote.travelDate,
            travelers: quote.travelers,
            tripDuration: quote.tripDuration,
            servicesIncluded: (quote.servicesList || []).map(s => ({
                category: s.category,
                serviceName: s.customerDisplayName || s.serviceName || s.category,
                quantity: s.quantity,
                unit: s.unit
            })),
            finalCustomerPrice: quote.finalCustomerPrice,
            inclusions: quote.inclusions,
            exclusions: quote.exclusions,
            termsNotes: quote.termsNotes,
            validUntil: quote.validUntil,
            createdAt: quote.createdAt
        };

        return res.status(200).json({ success: true, quote: customerQuote });
    } catch (error) {
        console.error("❌ Customer Quote View Error:", error);
        return res.status(500).json({ success: false, message: "Failed to load quote proposal." });
    }
});

// =========================================================================
// 🚖 PHASE 4 PROMPT 4 — BOOKING API ENDPOINTS
// =========================================================================

// 1. Fetch all Bookings
app.get('/admin/bookings', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const bookings = await Booking.find().sort({ createdAt: -1 });
        const finalBookings = req.user.role === 'CEO' ? bookings : bookings.map(sanitizeBookingForManager);
        return res.status(200).json({ success: true, bookings: finalBookings });
    } catch (error) {
        console.error("❌ Fetch Bookings Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch bookings." });
    }
});

// 2. Fetch Single Booking by ID
app.get('/admin/booking/:id', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const query = mongoose.Types.ObjectId.isValid(req.params.id)
            ? { $or: [{ _id: req.params.id }, { bookingNumber: req.params.id }, { leadId: req.params.id }] }
            : { $or: [{ bookingNumber: req.params.id }, { leadId: req.params.id }] };
        const booking = await Booking.findOne(query);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }
        const finalBooking = req.user.role === 'CEO' ? booking : sanitizeBookingForManager(booking);
        return res.status(200).json({ success: true, booking: finalBooking });
    } catch (error) {
        console.error("❌ Fetch Single Booking Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch booking." });
    }
});

// 3. Fetch Booking by Quote ID
app.get('/admin/booking/quote/:quoteId', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const booking = await Booking.findOne({ quoteId: req.params.quoteId });
        const finalBooking = req.user.role === 'CEO' ? booking : sanitizeBookingForManager(booking);
        return res.status(200).json({ success: true, booking: finalBooking });
    } catch (error) {
        console.error("❌ Fetch Booking by Quote Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch booking by quote." });
    }
});

// 4. Create Booking from Accepted Quote (Prevents duplicate bookings)
app.post('/admin/booking/create', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const { quoteId } = req.body;

        if (!quoteId) {
            return res.status(400).json({ success: false, message: "quoteId is required." });
        }

        const quote = await Quote.findById(quoteId);
        if (!quote) {
            return res.status(404).json({ success: false, message: "Accepted quote not found." });
        }

        if (quote.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: "Only ACCEPTED quotes can be converted to bookings." });
        }

        // Prevent Duplicate Bookings for the same Quote
        const existingBooking = await Booking.findOne({ quoteId });
        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: `Booking ${existingBooking.bookingNumber} already exists for this accepted quote.`,
                booking: existingBooking
            });
        }

        // Fetch associated Lead
        let targetLead = null;
        for (const model of Object.values(modelsMap)) {
            targetLead = await model.findById(quote.leadId);
            if (targetLead) break;
        }

        let bookingNumber;
        const year = new Date().getFullYear();
        let retryBookingCount = 0;
        while (retryBookingCount < 5) {
            const count = await Booking.countDocuments();
            const candidate = `VY-B-${year}-${String(1001 + count + retryBookingCount).padStart(4, '0')}`;
            const exists = await Booking.findOne({ bookingNumber: candidate });
            if (!exists) {
                bookingNumber = candidate;
                break;
            }
            retryBookingCount++;
        }
        if (!bookingNumber) {
            bookingNumber = `VY-B-${year}-${Date.now().toString().slice(-6)}`;
        }

        // Map Quote services into Preparation Checklist items with Commercial Model snapshot
        const services = (quote.servicesList || []).map(s => ({
            serviceCategory: s.category || 'OTHER',
            displayName: s.customerDisplayName || s.serviceName || s.category,
            quantity: s.quantity || 1,
            unit: s.unit || 'Item',
            vendorCostSnapshot: s.vendorCost || 0,
            referenceCost: s.referenceCost || 0,
            negotiatedVendorCost: s.negotiatedVendorCost || 0,
            customerSellingPrice: s.customerSellingPrice || 0,
            customerCharge: s.customerCharge || 0,
            commercialModel: s.commercialModel || 'SELLING_PRICE',
            commissionRate: s.commissionRate || 0,
            commissionAmount: s.commissionAmount || 0,
            passThroughAmount: s.passThroughAmount || 0,
            resourceId: s.resourceId || s.vendorId || '',
            vendorId: s.vendorId || '',
            vendorName: s.vendorName || '',
            rateRuleId: s.rateRuleId || '',
            status: 'NOT_STARTED',
            assignmentStatus: s.vendorId ? 'Assigned' : 'Unassigned'
        }));

        const preparationChecklist = (quote.servicesList || []).map(s => ({
            serviceCategory: s.category || 'OTHER',
            label: `${s.customerDisplayName || s.serviceName || s.category} Required`,
            required: true,
            status: 'NOT_STARTED',
            notes: ''
        }));

        const totalReq = preparationChecklist.length;
        const initialReadiness = {
            totalRequired: totalReq,
            completed: 0,
            pending: totalReq,
            percentage: 0,
            status: 'INCOMPLETE',
            missingItems: preparationChecklist.map(c => c.label)
        };

        const initialVendorAssignments = (quote.servicesList || []).map(s => {
            const qty = Number(s.quantity) || 1;
            const model = s.commercialModel || 'SELLING_PRICE';
            let plannedCost = 0;
            if (model === 'FIXED_VENDOR_RATE' || model === 'SELLING_PRICE') {
                plannedCost = Number(s.referenceCost !== undefined ? s.referenceCost : (s.vendorCost || 0)) * qty;
            } else if (model === 'VENDOR_QUOTE_REQUIRED') {
                plannedCost = Number(s.negotiatedVendorCost !== undefined ? s.negotiatedVendorCost : (s.vendorCost || 0)) * qty;
            } else if (model === 'PASS_THROUGH') {
                plannedCost = Number(s.passThroughAmount !== undefined ? s.passThroughAmount : (s.referenceCost || s.vendorCost || 0)) * qty;
            } else if (model === 'CUSTOMER_DIRECT' || model === 'COMMISSION') {
                plannedCost = 0;
            }

            return {
                serviceCategory: s.category || 'OTHER',
                serviceName: s.serviceName || s.customerDisplayName || s.category || 'Service',
                vendorId: s.vendorId || s.resourceId || '',
                plannedVendorId: s.vendorId || s.resourceId || '',
                actualVendorId: s.vendorId || s.resourceId || '',
                vendorName: s.vendorName || '',
                contactPerson: s.contactPerson || '',
                mobile: s.mobile || '',
                commercialModel: model,
                plannedCost,
                actualCost: plannedCost,
                status: s.vendorId ? 'Assigned' : 'Pending',
                notes: s.notes || ''
            };
        });

        const totalPlannedVendorCost = Number(quote.totalVendorCost) || initialVendorAssignments.reduce((sum, v) => sum + (v.plannedCost || 0), 0);

        const newBooking = new Booking({
            bookingNumber,
            leadId: quote.leadId,
            quoteId: quote._id,
            customerId: targetLead?._id || '',
            customerDetails: {
                name: targetLead?.name || 'Valued Client',
                phone: targetLead?.mobile || '',
                email: targetLead?.email || '',
                city: targetLead?.city || ''
            },
            travelDetails: {
                travelDate: quote.travelDate || targetLead?.date || '',
                endDate: '',
                travelers: quote.travelers || targetLead?.travelers || '1',
                tripDuration: quote.tripDuration || '3 Days / 2 Nights',
                pickup: targetLead?.pickup || '',
                destination: targetLead?.destination || 'Varanasi'
            },
            packageDetails: {
                packageType: quote.packageType || 'COMPLETE',
                packageName: `${quote.packageType || 'Custom'} Travel Package`,
                finalCustomerPrice: quote.finalCustomerPrice || 0
            },
            services,
            bookingStatus: 'PENDING',
            tripReadiness: initialReadiness,
            preparationChecklist,
            vendorAssignments: initialVendorAssignments,
            customerPaymentSummary: {
                packagePrice: quote.finalCustomerPrice || 0,
                totalPaid: targetLead?.advanceAmount || 0,
                customerDue: Math.max(0, (quote.finalCustomerPrice || 0) - (targetLead?.advanceAmount || 0)),
                paymentStatus: (targetLead?.advanceAmount || 0) > 0 ? ((targetLead?.advanceAmount || 0) >= (quote.finalCustomerPrice || 0) ? 'PAID' : 'PARTIAL') : 'UNPAID'
            },
            vendorPaymentSummary: {
                plannedVendorCost: totalPlannedVendorCost,
                actualVendorCost: totalPlannedVendorCost,
                totalPaidToVendors: 0,
                vendorDue: totalPlannedVendorCost,
                paymentStatus: 'NOT_PAID'
            },
            profitSummary: {
                expectedProfit: quote.expectedProfit || 0,
                actualRevenue: 0,
                actualVendorExpense: 0,
                additionalBusinessExpense: 0,
                commissionIncome: quote.commissionTotal || 0,
                actualProfit: 0,
                profitStatus: 'ESTIMATED'
            },
            activityHistory: [{
                type: 'CREATE',
                message: `Booking ${bookingNumber} created from accepted quote ${quote.quoteNumber}.`,
                timestamp: new Date().toISOString(),
                performedBy: `${req.user.role}: ${req.user.name}`
            }]
        });

        await newBooking.save();

        // Update target Lead stage to WON & status to Confirmed
        if (targetLead) {
            targetLead.stage = 'WON';
            targetLead.status = 'Confirmed';
            targetLead.bookingNumber = bookingNumber;
            await targetLead.save();
        }

        const retBooking = req.user.role === 'CEO' ? newBooking : sanitizeBookingForManager(newBooking);
        return res.status(200).json({
            success: true,
            message: `Booking ${bookingNumber} created successfully!`,
            booking: retBooking
        });
    } catch (error) {
        console.error("❌ Create Booking Error:", error);
        return res.status(500).json({ success: false, message: "Booking creation failed." });
    }
});

// 5. Update Booking Lifecycle Status (PATCH /admin/booking/:id/status)
app.patch('/admin/booking/:id/status', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const { status, remarks } = req.body;

        const validStatuses = ['PENDING', 'PREPARING', 'READY', 'TRIP_STARTED', 'COMPLETED', 'CANCELLED', 'CONFIRMED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid booking status." });
        }

        const booking = await Booking.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { bookingNumber: req.params.id }
            ]
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        booking.bookingStatus = status;
        booking.activityHistory.push({
            type: 'STATUS_CHANGE',
            message: `Booking status changed to ${status}${remarks ? `. Note: ${remarks}` : ''}`,
            timestamp: new Date().toISOString(),
            performedBy: `${req.user.role}: ${req.user.name}`
        });

        await booking.save();

        // Sync target Lead status
        for (const model of Object.values(modelsMap)) {
            const lead = await model.findById(booking.leadId);
            if (lead) {
                if (status === 'TRIP_STARTED') lead.status = 'Trip Started';
                else if (status === 'COMPLETED') lead.status = 'Completed';
                else if (status === 'CANCELLED') lead.status = 'Cancelled';
                else if (status === 'READY' || status === 'PREPARING' || status === 'PENDING') lead.status = 'Confirmed';
                await lead.save();
                break;
            }
        }

        const retBooking = req.user.role === 'CEO' ? booking : sanitizeBookingForManager(booking);
        return res.status(200).json({ success: true, message: `Booking status updated to ${status}`, booking: retBooking });
    } catch (error) {
        console.error("❌ Update Booking Status Error:", error);
        return res.status(500).json({ success: false, message: "Status update failed." });
    }
});

// 6. Update Booking Preparation Checklist Item (PATCH /admin/booking/:id/checklist)
app.patch('/admin/booking/:id/checklist', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const { serviceCategory, status, notes } = req.body;

        const booking = await Booking.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? req.params.id : null },
                { bookingNumber: req.params.id }
            ]
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const item = booking.preparationChecklist.find(c => c.serviceCategory === serviceCategory);
        if (item) {
            item.status = status;
            if (notes) item.notes = notes;
            if (status === 'CONFIRMED' || status === 'ARRANGED') {
                item.completedAt = new Date().toISOString();
            }
        }

        // Recompute readiness
        const checklist = booking.preparationChecklist || [];
        const required = checklist.filter(c => c.required !== false);
        const completed = required.filter(c => c.status === 'CONFIRMED' || c.status === 'ARRANGED').length;
        const total = required.length;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 100;

        booking.tripReadiness.completed = completed;
        booking.tripReadiness.percentage = pct;
        booking.tripReadiness.pending = total - completed;

        if (pct === 100) {
            booking.tripReadiness.status = 'READY';
            booking.bookingStatus = 'READY';
        } else {
            booking.tripReadiness.status = 'INCOMPLETE';
            if (booking.bookingStatus === 'PENDING') booking.bookingStatus = 'PREPARING';
        }

        booking.activityHistory.push({
            type: 'CHECKLIST_UPDATE',
            message: `Service ${serviceCategory} marked ${status}.`,
            timestamp: new Date().toISOString(),
            performedBy: `${req.user.role}: ${req.user.name}`
        });

        await booking.save();
        const retBooking = req.user.role === 'CEO' ? booking : sanitizeBookingForManager(booking);
        return res.status(200).json({ success: true, message: "Checklist item updated", booking: retBooking });
    } catch (error) {
        console.error("❌ Update Checklist Error:", error);
        return res.status(500).json({ success: false, message: "Checklist update failed." });
    }
});

// =========================================================================
// 🏨 PHASE 4 PROMPT 5 — VENDOR & SERVICE MANAGEMENT API ENDPOINTS
// =========================================================================

// 1. Fetch all Vendors (Supports category, status, search filters)
app.get('/admin/vendors', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const { category, status, search } = req.query;

        const filter = {};
        if (category && category !== 'ALL') {
            const catUpper = category.toUpperCase();
            if (catUpper === 'BOAT' || catUpper === 'BOAT_RIDE') {
                filter.category = { $in: ['BOAT', 'BOAT_RIDE'] };
            } else if (catUpper === 'GUIDE' || catUpper === 'TOUR_GUIDE') {
                filter.category = { $in: ['GUIDE', 'TOUR_GUIDE'] };
            } else if (catUpper === 'SHOPPING' || catUpper === 'SHOPPING_PARTNER') {
                filter.category = { $in: ['SHOPPING', 'SHOPPING_PARTNER'] };
            } else if (catUpper === 'DARSHAN' || catUpper === 'VIP_DARSHAN') {
                filter.category = { $in: ['DARSHAN', 'VIP_DARSHAN'] };
            } else {
                filter.category = catUpper;
            }
        }
        if (status && status !== 'ALL') {
            filter.$or = [
                { status: status.toUpperCase() },
                { availabilityStatus: status }
            ];
        } else if (req.user.role === 'Manager') {
            filter.$or = [
                { status: 'ACTIVE' },
                { availabilityStatus: 'Active' }
            ];
        }

        if (search) {
            const searchOr = [
                { businessName: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
            if (filter.$or) {
                filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
                delete filter.$or;
            } else {
                filter.$or = searchOr;
            }
        }

        let vendors = await Vendor.find(filter).sort({ createdAt: -1 }).lean();

        // If caller is Manager, sanitize out CEO-confidential notes
        if (req.user.role === 'Manager') {
            vendors = vendors.map(v => {
                if (v.metadata && v.metadata.ceoOnlyNotes) {
                    const { ceoOnlyNotes: _ceoOnlyNotes, ...safeMetadata } = v.metadata;
                    return { ...v, metadata: safeMetadata };
                }
                return v;
            });
        }

        return res.status(200).json({ success: true, vendors });
    } catch (error) {
        console.error("❌ Fetch Vendors Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch vendors." });
    }
});

// 2. Fetch Vendors by Category (Active only for operations)
app.get('/admin/vendors/category/:category', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const category = req.params.category.toUpperCase();

        let categoryQuery = category;
        if (category === 'BOAT' || category === 'BOAT_RIDE') {
            categoryQuery = { $in: ['BOAT', 'BOAT_RIDE'] };
        } else if (category === 'GUIDE' || category === 'TOUR_GUIDE') {
            categoryQuery = { $in: ['GUIDE', 'TOUR_GUIDE'] };
        } else if (category === 'SHOPPING' || category === 'SHOPPING_PARTNER') {
            categoryQuery = { $in: ['SHOPPING', 'SHOPPING_PARTNER'] };
        } else if (category === 'DARSHAN' || category === 'VIP_DARSHAN') {
            categoryQuery = { $in: ['DARSHAN', 'VIP_DARSHAN'] };
        }

        let vendors = await Vendor.find({
            category: categoryQuery,
            $or: [{ status: 'ACTIVE' }, { availabilityStatus: 'Active' }]
        }).sort({ name: 1 }).lean();

        if (req.user.role === 'Manager') {
            vendors = vendors.map(v => {
                if (v.metadata && v.metadata.ceoOnlyNotes) {
                    const { ceoOnlyNotes: _ceoOnlyNotes, ...safeMetadata } = v.metadata;
                    return { ...v, metadata: safeMetadata };
                }
                return v;
            });
        }

        return res.status(200).json({ success: true, vendors });
    } catch (error) {
        console.error("❌ Fetch Vendors by Category Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch vendors by category." });
    }
});

// 3. Fetch Single Vendor by ID
app.get('/admin/vendor/:id', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const vendor = await Vendor.findById(req.params.id).lean();
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }
        if (req.user.role === 'Manager' && vendor.metadata && vendor.metadata.ceoOnlyNotes) {
            const { ceoOnlyNotes: _ceoOnlyNotes, ...safeMetadata } = vendor.metadata;
            vendor.metadata = safeMetadata;
        }
        return res.status(200).json({ success: true, vendor });
    } catch (error) {
        console.error("❌ Fetch Single Vendor Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch vendor." });
    }
});

// 4. Create Vendor (Locked to CEO role)
app.post('/admin/vendor/create', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const {
            category,
            businessName,
            name,
            contactPerson,
            phone,
            mobile,
            alternatePhone,
            email,
            city,
            address,
            baseRate,
            commercialModel,
            notes,
            services,
            rateRules,
            metadata
        } = req.body;

        const effectiveName = businessName || name;
        const effectivePhone = phone || mobile;

        if (!category || !effectiveName || !effectivePhone) {
            return res.status(400).json({ success: false, message: "category, businessName, and phone/mobile are required." });
        }

        const count = await Vendor.countDocuments();
        const vendorCode = `VY-V-${String(1001 + count).padStart(4, '0')}`;

        const newVendor = new Vendor({
            vendorCode,
            category: category.toUpperCase(),
            businessName: effectiveName,
            name: effectiveName,
            contactPerson: contactPerson || '',
            phone: effectivePhone,
            mobile: effectivePhone,
            alternatePhone: alternatePhone || '',
            email: email || '',
            city: city || 'Varanasi',
            location: city || 'Varanasi',
            address: address || '',
            status: 'ACTIVE',
            availabilityStatus: 'Active',
            baseRate: Number(baseRate) || 0,
            commercialModel: commercialModel || 'SELLING_PRICE',
            notes: notes || '',
            services: services || [],
            rateRules: rateRules || [],
            metadata: metadata || {},
            performance: {
                totalAssignments: 0,
                successfulAssignments: 0,
                cancelledAssignments: 0,
                issueCount: 0,
                onTimeCount: 0,
                reliabilityScore: null
            }
        });

        await newVendor.save();
        return res.status(200).json({
            success: true,
            message: `Vendor ${effectiveName} created successfully!`,
            vendor: newVendor
        });
    } catch (error) {
        console.error("❌ Create Vendor Error:", error);
        return res.status(500).json({ success: false, message: "Vendor creation failed." });
    }
});

// 5. Update Vendor (Locked to CEO role)
app.put('/admin/vendor/:id', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const updateData = { ...req.body };

        if (updateData.businessName) updateData.name = updateData.businessName;
        if (updateData.phone) updateData.mobile = updateData.phone;

        const updated = await Vendor.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }
        return res.status(200).json({ success: true, message: "Vendor updated successfully!", vendor: updated });
    } catch (error) {
        console.error("❌ Update Vendor Error:", error);
        return res.status(500).json({ success: false, message: "Vendor update failed." });
    }
});

// 6. Update Vendor Status (Locked to CEO role)
app.patch('/admin/vendor/:id/status', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const { status } = req.body;

        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (!validStatuses.includes(status?.toUpperCase())) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        const newStatus = status.toUpperCase();
        const updated = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: newStatus, availabilityStatus: newStatus === 'ACTIVE' ? 'Active' : 'Inactive' },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }

        return res.status(200).json({ success: true, message: `Vendor status updated to ${newStatus}`, vendor: updated });
    } catch (error) {
        console.error("❌ Update Vendor Status Error:", error);
        return res.status(500).json({ success: false, message: "Vendor status update failed." });
    }
});

// 7. Safe Delete Vendor (DELETE /admin/vendor/:id - Archives to INACTIVE if referenced)
app.delete('/admin/vendor/:id', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found." });
        }

        // Check if vendor is referenced in any booking
        const isReferenced = await Booking.exists({
            $or: [
                { 'vendorAssignments.plannedVendorId': req.params.id },
                { 'vendorAssignments.actualVendorId': req.params.id }
            ]
        });

        if (isReferenced) {
            vendor.status = 'INACTIVE';
            vendor.availabilityStatus = 'Inactive';
            await vendor.save();
            return res.status(200).json({
                success: true,
                message: "Vendor has active booking history. Safely archived to INACTIVE instead of deleting.",
                vendor
            });
        }

        await Vendor.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: "Vendor deleted successfully." });
    } catch (error) {
        console.error("❌ Delete Vendor Error:", error);
        return res.status(500).json({ success: false, message: "Vendor deletion failed." });
    }
});

// =========================================================================
// 💳 PHASE 4 PROMPT 6 — PAYMENT, EXPENSE & REAL PROFIT API ENDPOINTS
// =========================================================================

// 1. Fetch Customer Payments for Booking
app.get('/admin/booking/:bookingId/customer-payments', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const CustomerPayment = mongoose.model('CustomerPayment', CustomerPaymentSchema, 'customer_payments');
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        
        const rawId = req.params.bookingId;
        const queryIds = [rawId];

        const booking = await Booking.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(rawId) ? rawId : null },
                { bookingNumber: rawId },
                { leadId: rawId },
                { customerId: rawId }
            ]
        });

        if (booking) {
            queryIds.push(booking._id.toString());
            if (booking.bookingNumber) queryIds.push(booking.bookingNumber);
            if (booking.leadId) queryIds.push(booking.leadId);
        }

        const payments = await CustomerPayment.find({ bookingId: { $in: queryIds } }).sort({ paymentDate: -1, createdAt: -1 });
        return res.status(200).json({ success: true, payments, customerPayments: payments });
    } catch (error) {
        console.error("❌ Fetch Customer Payments Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch customer payments." });
    }
});

// 2. Record Customer Payment (POST /admin/booking/customer-payment)
app.post('/admin/booking/customer-payment', financialLimiter, authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const CustomerPayment = mongoose.model('CustomerPayment', CustomerPaymentSchema, 'customer_payments');
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');

        const { bookingId, amount, paymentMethod, paymentDate, referenceNumber, notes } = req.body;
        const numAmount = Number(amount);

        if (!bookingId || isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: "Valid bookingId and positive payment amount are required." });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const payDateStr = paymentDate ? String(paymentDate).split('T')[0] : todayStr;
        if (payDateStr > todayStr) {
            return res.status(400).json({ success: false, message: "Payment date cannot be in the future." });
        }

        const cleanMethod = (paymentMethod || 'UPI').toUpperCase();
        if (['UPI', 'BANK_TRANSFER', 'CARD'].includes(cleanMethod) && (!referenceNumber || !referenceNumber.trim())) {
            return res.status(400).json({ success: false, message: "Transaction reference / UTR number is required for UPI and Bank/Card payments." });
        }

        // Duplicate payment reference check (for non-cash payments)
        if (['UPI', 'BANK_TRANSFER', 'CARD'].includes(cleanMethod) && referenceNumber && referenceNumber.trim()) {
            const existingPayment = await CustomerPayment.findOne({
                referenceNumber: referenceNumber.trim(),
                status: 'COMPLETED'
            });
            if (existingPayment) {
                return res.status(400).json({
                    success: false,
                    message: `Payment with reference / UTR number "${referenceNumber.trim()}" has already been recorded.`
                });
            }
        }

        let booking = await Booking.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null },
                { bookingNumber: bookingId },
                { leadId: bookingId },
                { customerId: bookingId }
            ]
        });

        // If not found in Booking collection, attempt auto-initialization from Lead
        if (!booking) {
            let targetLead = null;
            if (mongoose.Types.ObjectId.isValid(bookingId)) {
                for (const model of Object.values(modelsMap)) {
                    targetLead = await model.findById(bookingId);
                    if (targetLead) break;
                }
            }

            if (targetLead) {
                const year = new Date().getFullYear();
                const bookingNumber = `VY-B-${year}-${Date.now().toString().slice(-4)}`;
                const pkgPrice = Number(targetLead.totalAmount) || Number(targetLead.advancePaid) || numAmount;

                booking = new Booking({
                    bookingNumber,
                    leadId: targetLead._id.toString(),
                    customerId: targetLead._id.toString(),
                    customerDetails: {
                        name: targetLead.name || 'Valued Client',
                        phone: targetLead.mobile || '',
                        email: targetLead.email || '',
                        city: targetLead.city || ''
                    },
                    travelDetails: {
                        travelDate: targetLead.date || '',
                        travelers: targetLead.travelers || '1',
                        tripDuration: '3 Days / 2 Nights'
                    },
                    packageDetails: {
                        packageName: targetLead.destination ? `${targetLead.destination} Special` : 'Varanasi Yatra Package',
                        packageType: 'CUSTOM',
                        finalCustomerPrice: pkgPrice
                    },
                    bookingStatus: 'CONFIRMED',
                    customerPaymentSummary: {
                        packagePrice: pkgPrice,
                        totalPaid: 0,
                        customerDue: pkgPrice,
                        paymentStatus: 'UNPAID'
                    }
                });
                await booking.save();
            }
        }

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const paymentId = `PAY-CUST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newPayment = new CustomerPayment({
            paymentId,
            bookingId: booking._id.toString(),
            customerId: booking.customerId || '',
            amount: numAmount,
            paymentMethod: cleanMethod,
            paymentDate: paymentDate || todayStr,
            referenceNumber: referenceNumber ? referenceNumber.trim() : (cleanMethod === 'CASH' ? 'CASH-COLLECTED' : ''),
            notes: notes || '',
            status: 'COMPLETED',
            receivedBy: `${req.user.role}: ${req.user.name}`
        });
        await newPayment.save();

        // Recalculate Customer Payment Summary
        const allCustomerPayments = await CustomerPayment.find({ bookingId: booking._id.toString() });
        const packagePrice = booking.packageDetails?.finalCustomerPrice || booking.customerPaymentSummary?.packagePrice || 0;
        const totalPaid = allCustomerPayments.reduce((sum, p) => sum + p.amount, 0);
        const customerDue = Math.max(0, packagePrice - totalPaid);

        let paymentStatus = 'UNPAID';
        if (totalPaid === 0) paymentStatus = 'UNPAID';
        else if (totalPaid > 0 && totalPaid < packagePrice) paymentStatus = 'PARTIAL';
        else if (totalPaid > packagePrice) paymentStatus = 'OVERPAID';
        else if (totalPaid === packagePrice && packagePrice > 0) paymentStatus = 'PAID';

        booking.customerPaymentSummary = {
            packagePrice,
            totalPaid,
            customerDue,
            paymentStatus
        };

        booking.activityHistory.push({
            type: 'PAYMENT_RECORDED',
            message: `Customer Payment Recorded: ₹${numAmount.toLocaleString('en-IN')} via ${cleanMethod}${referenceNumber ? ` (Ref: ${referenceNumber})` : ''}`,
            timestamp: new Date().toISOString(),
            performedBy: `${req.user.role}: ${req.user.name}`
        });

        await booking.save();

        // Update associated lead across all lead models
        if (booking.leadId) {
            for (const model of Object.values(modelsMap)) {
                const foundLead = await model.findById(booking.leadId);
                if (foundLead) {
                    foundLead.paymentStatus = paymentStatus;
                    foundLead.advancePaid = totalPaid;
                    foundLead.advanceAmount = totalPaid;
                    foundLead.remainingAmount = customerDue;
                    await foundLead.save();
                    break;
                }
            }
        }

        // ⚡ Trigger PAYMENT_RECEIVED Automation Event asynchronously
        triggerAutomationEvent('PAYMENT_RECEIVED', {
            paymentId: newPayment.paymentId,
            bookingId: booking.bookingNumber,
            customerName: booking.customerDetails?.name || 'Valued Customer',
            mobile: booking.customerDetails?.mobile || '',
            paidAmount: numAmount,
            amountDue: customerDue
        }, `PAYMENT_RECEIVED:${newPayment.paymentId}`).catch(err => console.error("⚠️ Payment automation trigger error:", err.message));

        return res.status(200).json({
            success: true,
            message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully!`,
            payment: newPayment,
            booking,
            customerPaymentSummary: booking.customerPaymentSummary
        });
    } catch (error) {
        console.error("❌ Record Customer Payment Error:", error);
        return res.status(500).json({ success: false, message: "Customer payment recording failed." });
    }
});

// 3. Fetch Vendor Payments for Booking (CEO Only)
app.get('/admin/booking/:bookingId/vendor-payments', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const VendorPayment = mongoose.model('VendorPayment', VendorPaymentSchema, 'vendor_payments');
        const payments = await VendorPayment.find({ bookingId: req.params.bookingId }).sort({ paymentDate: -1 });
        return res.status(200).json({ success: true, payments });
    } catch (error) {
        console.error("❌ Fetch Vendor Payments Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch vendor payments." });
    }
});

// 4. Record Vendor Payment (POST /admin/booking/vendor-payment - CEO Only)
app.post('/admin/booking/vendor-payment', financialLimiter, authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const VendorPayment = mongoose.model('VendorPayment', VendorPaymentSchema, 'vendor_payments');
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');

        const { bookingId, vendorId, vendorNameSnapshot, serviceCategory, amount, paymentMethod, paymentDate, referenceNumber, notes } = req.body;
        const numAmount = Number(amount);

        if (!bookingId || !vendorId || isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: "bookingId, vendorId and positive payment amount are required." });
        }

        const booking = await Booking.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }, { bookingNumber: bookingId }] });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const paymentId = `PAY-VEND-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newPayment = new VendorPayment({
            paymentId,
            bookingId: booking._id.toString(),
            vendorId,
            vendorNameSnapshot: vendorNameSnapshot || 'Vendor',
            serviceCategory: serviceCategory || 'OTHER',
            amount: numAmount,
            paymentMethod: paymentMethod || 'BANK_TRANSFER',
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            referenceNumber: referenceNumber || '',
            notes: notes || '',
            status: 'COMPLETED',
            paidBy: `${req.user.role}: ${req.user.name}`
        });
        await newPayment.save();

        // Recalculate Vendor Payment Summary with defensive planned cost fallback
        const allVendorPayments = await VendorPayment.find({ bookingId: booking._id.toString() });
        let plannedVendorCost = (booking.vendorAssignments || []).reduce((sum, v) => sum + (v.plannedCost || 0), 0);
        if (plannedVendorCost === 0 && Array.isArray(booking.services) && booking.services.length > 0) {
            plannedVendorCost = booking.services.reduce((sum, s) => {
                const model = s.commercialModel || 'SELLING_PRICE';
                if (model === 'CUSTOMER_DIRECT' || model === 'COMMISSION') return sum;
                const qty = Number(s.quantity) || 1;
                const cost = Number(s.negotiatedVendorCost || s.referenceCost || s.vendorCostSnapshot || 0);
                return sum + (cost * qty);
            }, 0);
        }
        if (plannedVendorCost === 0 && booking.vendorPaymentSummary?.plannedVendorCost > 0) {
            plannedVendorCost = booking.vendorPaymentSummary.plannedVendorCost;
        }
        const actualVendorCost = (booking.vendorAssignments || []).reduce((sum, v) => sum + (v.actualCost || v.plannedCost || 0), 0) || plannedVendorCost;
        const totalPaidToVendors = allVendorPayments.reduce((sum, p) => sum + p.amount, 0);
        const vendorDue = actualVendorCost - totalPaidToVendors;

        let paymentStatus = 'NOT_PAID';
        if (totalPaidToVendors === 0) paymentStatus = 'NOT_PAID';
        else if (totalPaidToVendors > 0 && totalPaidToVendors < actualVendorCost) paymentStatus = 'PARTIALLY_PAID';
        else if (totalPaidToVendors === actualVendorCost) paymentStatus = 'PAID';
        else if (totalPaidToVendors > actualVendorCost) paymentStatus = 'OVERPAID';

        booking.vendorPaymentSummary = {
            plannedVendorCost,
            actualVendorCost,
            totalPaidToVendors,
            vendorDue: Math.max(0, vendorDue),
            paymentStatus
        };

        booking.activityHistory.push({
            type: 'VENDOR_PAYMENT_RECORDED',
            message: `Vendor Payment Recorded: ₹${numAmount.toLocaleString('en-IN')} to ${vendorNameSnapshot || 'Vendor'} (${serviceCategory || 'Service'})`,
            timestamp: new Date().toISOString(),
            performedBy: `${req.user.role}: ${req.user.name}`
        });

        await booking.save();

        return res.status(200).json({
            success: true,
            message: `Vendor payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully!`,
            payment: newPayment,
            vendorPaymentSummary: booking.vendorPaymentSummary
        });
    } catch (error) {
        console.error("❌ Record Vendor Payment Error:", error);
        return res.status(500).json({ success: false, message: "Vendor payment recording failed." });
    }
});

// 5. Fetch Business Expenses (GET /admin/expenses - CEO Only)
app.get('/admin/expenses', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const BusinessExpense = mongoose.model('BusinessExpense', BusinessExpenseSchema, 'business_expenses');
        const { bookingId, category, search } = req.query;

        const filter = {};
        if (bookingId) filter.bookingId = bookingId;
        if (category && category !== 'ALL') filter.expenseCategory = category.toUpperCase();
        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { referenceNumber: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        const expenses = await BusinessExpense.find(filter).sort({ expenseDate: -1 });
        return res.status(200).json({ success: true, expenses });
    } catch (error) {
        console.error("❌ Fetch Expenses Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch expenses." });
    }
});

// 6. Record Business Expense (POST /admin/expense/create - CEO Only)
app.post('/admin/expense/create', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const BusinessExpense = mongoose.model('BusinessExpense', BusinessExpenseSchema, 'business_expenses');
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');

        const { bookingId, expenseCategory, description, amount, expenseDate, paymentMethod, referenceNumber, notes } = req.body;
        const numAmount = Number(amount);

        if (!expenseCategory || isNaN(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: "expenseCategory and positive amount are required." });
        }

        const expenseId = `EXP-${Date.now()}`;
        const newExpense = new BusinessExpense({
            expenseId,
            bookingId: bookingId || '',
            expenseCategory: expenseCategory.toUpperCase(),
            description: description || '',
            amount: numAmount,
            expenseDate: expenseDate || new Date().toISOString().split('T')[0],
            paymentMethod: paymentMethod || 'UPI',
            referenceNumber: referenceNumber || '',
            notes: notes || '',
            createdBy: `${req.user.role}: ${req.user.name}`
        });
        await newExpense.save();

        if (bookingId) {
            const booking = await Booking.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null }, { bookingNumber: bookingId }] });
            if (booking) {
                booking.activityHistory.push({
                    type: 'EXPENSE_RECORDED',
                    message: `Business Expense Added: ₹${numAmount.toLocaleString('en-IN')} (${expenseCategory})`,
                    timestamp: new Date().toISOString(),
                    performedBy: `${req.user.role}: ${req.user.name}`
                });
                await booking.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: `Expense of ₹${numAmount.toLocaleString('en-IN')} recorded successfully!`,
            expense: newExpense
        });
    } catch (error) {
        console.error("❌ Record Expense Error:", error);
        return res.status(500).json({ success: false, message: "Expense recording failed." });
    }
});

// 7. Get Real Profit & Financial Summary for Booking (Role Enforced)
app.get('/admin/booking/:bookingId/financial-summary', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const CustomerPayment = mongoose.model('CustomerPayment', CustomerPaymentSchema, 'customer_payments');
        const VendorPayment = mongoose.model('VendorPayment', VendorPaymentSchema, 'vendor_payments');
        const BusinessExpense = mongoose.model('BusinessExpense', BusinessExpenseSchema, 'business_expenses');

        const booking = await Booking.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(req.params.bookingId) ? req.params.bookingId : null }, { bookingNumber: req.params.bookingId }] });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const bId = booking._id.toString();
        const customerPayments = await CustomerPayment.find({ bookingId: bId });
        const packagePrice = booking.packageDetails?.finalCustomerPrice || 0;
        const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
        const customerDue = packagePrice - totalPaid;

        let customerStatus = 'UNPAID';
        if (totalPaid === 0) customerStatus = 'UNPAID';
        else if (totalPaid > 0 && totalPaid < packagePrice) customerStatus = 'PARTIAL';
        else if (totalPaid === packagePrice) customerStatus = 'PAID';
        else if (totalPaid > packagePrice) customerStatus = 'OVERPAID';

        // SANITIZED VIEW FOR MANAGER ROLE: Strict Financial Privacy Enforcement
        if (req.user.role !== 'CEO') {
            return res.status(200).json({
                success: true,
                role: req.user.role,
                customerPaymentSummary: {
                    packagePrice,
                    totalPaid,
                    customerDue: Math.max(0, customerDue),
                    paymentStatus: customerStatus
                },
                customerPayments
            });
        }

        // FULL CEO FINANCIAL BREAKDOWN
        const vendorPayments = await VendorPayment.find({ bookingId: bId });
        const expenses = await BusinessExpense.find({ bookingId: bId });

        let plannedVendorCost = (booking.vendorAssignments || []).reduce((sum, v) => sum + (v.plannedCost || 0), 0);
        if (plannedVendorCost === 0 && Array.isArray(booking.services) && booking.services.length > 0) {
            plannedVendorCost = booking.services.reduce((sum, s) => {
                const model = s.commercialModel || 'SELLING_PRICE';
                if (model === 'CUSTOMER_DIRECT' || model === 'COMMISSION') return sum;
                const qty = Number(s.quantity) || 1;
                const cost = Number(s.negotiatedVendorCost || s.referenceCost || s.vendorCostSnapshot || 0);
                return sum + (cost * qty);
            }, 0);
        }
        if (plannedVendorCost === 0 && booking.vendorPaymentSummary?.plannedVendorCost > 0) {
            plannedVendorCost = booking.vendorPaymentSummary.plannedVendorCost;
        }

        const actualVendorCost = (booking.vendorAssignments || []).reduce((sum, v) => sum + (v.actualCost || v.plannedCost || 0), 0) || plannedVendorCost;
        const vendorPaid = vendorPayments.reduce((sum, p) => sum + p.amount, 0);
        const vendorDue = actualVendorCost - vendorPaid;

        const commissionIncome = booking.profitSummary?.commissionIncome || booking.shoppingCommission?.expectedCommission || (booking.services || []).reduce((sum, s) => sum + (s.commercialModel === 'COMMISSION' ? (Number(s.commissionAmount) || 0) : 0), 0);
        const expectedProfit = (packagePrice - plannedVendorCost) + commissionIncome;
        const actualRevenue = totalPaid;
        // Accounting Rule: Vendor Paid is cash outflow only. Profitability cost basis is actualVendorCost.
        const actualVendorExpense = actualVendorCost;
        const additionalBusinessExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

        const actualProfit = actualRevenue - actualVendorExpense - additionalBusinessExpense + commissionIncome;

        let profitStatus = 'ESTIMATED';
        if (customerPayments.length === 0) profitStatus = 'ESTIMATED';
        else if (actualProfit < 0) profitStatus = 'LOSS';
        else if (actualProfit < expectedProfit) profitStatus = 'LOWER_THAN_EXPECTED';
        else profitStatus = 'ON_TRACK';

        const cashPosition = {
            moneyReceived: totalPaid,
            commissionIncome,
            vendorPaid,
            expensesPaid: additionalBusinessExpense,
            currentNetCash: totalPaid + commissionIncome - vendorPaid - additionalBusinessExpense
        };

        return res.status(200).json({
            success: true,
            role: 'CEO',
            customerPaymentSummary: { packagePrice, totalPaid, customerDue: Math.max(0, customerDue), paymentStatus: customerStatus },
            vendorPaymentSummary: { plannedVendorCost, actualVendorCost, totalPaidToVendors: vendorPaid, vendorDue: Math.max(0, vendorDue), paymentStatus: vendorPaid === 0 ? 'NOT_PAID' : (vendorPaid < actualVendorCost ? 'PARTIALLY_PAID' : 'PAID') },
            profitSummary: { expectedProfit, actualRevenue, actualVendorExpense, additionalBusinessExpense, commissionIncome, actualProfit, profitStatus },
            cashPosition,
            customerPayments,
            vendorPayments,
            expenses
        });
    } catch (error) {
        console.error("❌ Fetch Financial Summary Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch financial summary." });
    }
});

// =========================================================================
// 📊 PHASE 4 PROMPT 7 — ROLE-BASED DASHBOARD INTELLIGENCE ENDPOINTS
// =========================================================================

// 1. MANAGER OPERATIONS CENTER ENDPOINT (CEO & Manager Allowed)
app.get(['/admin/dashboard/manager', '/admin/manager-dashboard'], authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');

        const bookings = await Booking.find().sort({ createdAt: -1 });
        const leads = await fetchAllLeadsAcrossCollections();
        const quotes = await Quote.find().sort({ createdAt: -1 });

        // Sanitized Operational Summary (No vendor costs, actual profits, or margins)
        const sanitizedBookings = bookings.map(b => ({
            _id: b._id,
            bookingNumber: b.bookingNumber,
            leadId: b.leadId,
            quoteId: b.quoteId,
            customerId: b.customerId,
            customerDetails: b.customerDetails,
            travelDetails: b.travelDetails,
            packageDetails: {
                packageType: b.packageDetails?.packageType,
                packageName: b.packageDetails?.packageName,
                finalCustomerPrice: b.packageDetails?.finalCustomerPrice
            },
            bookingStatus: b.bookingStatus,
            tripReadiness: b.tripReadiness,
            preparationChecklist: b.preparationChecklist,
            customerPaymentSummary: b.customerPaymentSummary
        }));

        // Filter sensitive financial data from leads for Manager
        const sanitizedLeads = leads.map(lead => {
            const leadObj = lead.toObject ? lead.toObject() : { ...lead };
            delete leadObj.totalAmount;
            delete leadObj.advanceAmount;
            delete leadObj.remainingAmount;
            delete leadObj.vendorCost;
            delete leadObj.margin;
            delete leadObj.profit;
            delete leadObj.expectedProfit;
            delete leadObj.profitMargin;
            delete leadObj.companyExpense;
            delete leadObj.agentCommission;
            delete leadObj.salary;
            delete leadObj.vendorPayable;
            delete leadObj.ceoOnlyNotes;
            return leadObj;
        });

        // Filter sensitive internal pricing and vendor costs from quotes for Manager
        const sanitizedQuotes = quotes.map(q => {
            const qObj = q.toObject ? q.toObject() : { ...q };
            delete qObj.totalVendorCost;
            delete qObj.expectedProfit;
            delete qObj.companyMargin;
            delete qObj.marginPercentage;
            delete qObj.vendorCost;
            delete qObj.vendorPayable;
            delete qObj.ceoOnlyNotes;
            if (Array.isArray(qObj.servicesList)) {
                qObj.servicesList = qObj.servicesList.map(s => {
                    const sObj = { ...s };
                    delete sObj.vendorCost;
                    delete sObj.negotiatedVendorCost;
                    delete sObj.plannedVendorCost;
                    return sObj;
                });
            }
            if (Array.isArray(qObj.services)) {
                qObj.services = qObj.services.map(s => {
                    const sObj = { ...s };
                    delete sObj.vendorCost;
                    delete sObj.negotiatedVendorCost;
                    delete sObj.plannedVendorCost;
                    return sObj;
                });
            }
            return qObj;
        });

        return res.status(200).json({
            success: true,
            role: req.user.role,
            bookings: sanitizedBookings,
            leads: sanitizedLeads,
            quotes: sanitizedQuotes
        });
    } catch (error) {
        console.error("❌ Fetch Manager Dashboard Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch manager dashboard." });
    }
});

// 2. CEO COMMAND CENTER ENDPOINT (CEO ROLE ONLY - 403 FORBIDDEN FOR MANAGER)
app.get(['/admin/dashboard/ceo', '/admin/ceo-dashboard'], authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const Booking = mongoose.model('Booking', BookingSchema, 'bookings');
        const Quote = mongoose.model('Quote', QuoteSchema, 'quotes');
        const Vendor = mongoose.model('Vendor', VendorSchema, 'vendors');
        const CustomerPayment = mongoose.model('CustomerPayment', CustomerPaymentSchema, 'customer_payments');
        const VendorPayment = mongoose.model('VendorPayment', VendorPaymentSchema, 'vendor_payments');
        const BusinessExpense = mongoose.model('BusinessExpense', BusinessExpenseSchema, 'business_expenses');

        const bookings = await Booking.find().sort({ createdAt: -1 });
        const leads = await fetchAllLeadsAcrossCollections();
        const quotes = await Quote.find().sort({ createdAt: -1 });
        const vendors = await Vendor.find().sort({ createdAt: -1 });
        const customerPayments = await CustomerPayment.find().sort({ createdAt: -1 });
        const vendorPayments = await VendorPayment.find().sort({ createdAt: -1 });
        const expenses = await BusinessExpense.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            role: 'CEO',
            bookings,
            leads,
            quotes,
            vendors,
            customerPayments,
            vendorPayments,
            expenses
        });
    } catch (error) {
        console.error("❌ Fetch CEO Dashboard Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch CEO dashboard." });
    }
});






// =========================================================================
// ⚡ PHASE 5 PROMPT 2 — WHATSAPP + EMAIL AUTOMATION ENGINE ENDPOINTS
// =========================================================================

// 1. Fetch Automation Settings & Metadata
app.get('/admin/automation/settings', authenticateToken, requireRole(['CEO', 'Manager']), (req, res) => {
    return res.status(200).json({
        success: true,
        automationEnabled: getAutomationEnabled(),
        mode: process.env.NODE_ENV || 'development',
        whatsappConfigured: Boolean(process.env.WHATSAPP_API_KEY && process.env.WHATSAPP_PHONE_NUMBER_ID),
        emailConfigured: Boolean(process.env.EMAIL_USER),
        providerName: getNotificationProvider().name
    });
});

// 2. Update Automation Settings (CEO Only)
app.put('/admin/automation/settings', authenticateToken, requireRole(['CEO']), (req, res) => {
    const { enabled } = req.body;
    setAutomationEnabled(enabled);
    return res.status(200).json({
        success: true,
        message: `Automation engine master switch set to ${enabled ? 'ON' : 'OFF'}`,
        automationEnabled: getAutomationEnabled()
    });
});

// 3. Fetch Message Templates
app.get('/admin/automation/templates', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const MessageTemplate = mongoose.model('MessageTemplate', MessageTemplateSchema, 'message_templates');
        const customTemplates = await MessageTemplate.find();
        const merged = [...DEFAULT_TEMPLATES];

        customTemplates.forEach(ct => {
            const idx = merged.findIndex(t => t.templateId === ct.templateId);
            if (idx >= 0) merged[idx] = ct.toObject();
            else merged.push(ct.toObject());
        });

        return res.status(200).json({ success: true, templates: merged });
    } catch (error) {
        console.error("❌ Fetch Templates Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch message templates." });
    }
});

// 4. Create Message Template (CEO Only)
app.post('/admin/automation/templates', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const MessageTemplate = mongoose.model('MessageTemplate', MessageTemplateSchema, 'message_templates');
        const { templateId, name, category, channel, subject, body, variables } = req.body;

        if (!templateId || !name || !body) {
            return res.status(400).json({ success: false, message: "templateId, name, and body are required." });
        }

        const template = new MessageTemplate({
            templateId: templateId.trim().toUpperCase(),
            name: name.trim(),
            category: category || 'GENERAL',
            channel: channel || 'WHATSAPP',
            subject: subject || '',
            body,
            variables: variables || [],
            isSystemDefault: false,
            updatedBy: `${req.user.role}: ${req.user.name}`
        });
        await template.save();

        return res.status(201).json({ success: true, message: "Message template created successfully.", template });
    } catch (error) {
        console.error("❌ Create Template Error:", error);
        return res.status(500).json({ success: false, message: "Failed to create message template." });
    }
});

// 5. Update Message Template (CEO Only)
app.put('/admin/automation/templates/:id', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const MessageTemplate = mongoose.model('MessageTemplate', MessageTemplateSchema, 'message_templates');
        const { name, category, channel, subject, body, variables } = req.body;

        const targetId = req.params.id;
        const updated = await MessageTemplate.findOneAndUpdate(
            { $or: [{ _id: mongoose.Types.ObjectId.isValid(targetId) ? targetId : null }, { templateId: targetId }] },
            { name, category, channel, subject, body, variables, updatedBy: `${req.user.role}: ${req.user.name}` },
            { new: true, upsert: true }
        );

        return res.status(200).json({ success: true, message: "Message template updated successfully.", template: updated });
    } catch (error) {
        console.error("❌ Update Template Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update message template." });
    }
});

// 6. Fetch Automation Audit Logs (CEO & Manager)
app.get('/admin/automation/logs', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const { status, eventType } = req.query;
        const filter = {};
        if (status && status !== 'ALL') filter.status = status;
        if (eventType && eventType !== 'ALL') filter.eventType = eventType;

        const logs = await getAutomationLogs(filter);
        return res.status(200).json({ success: true, logs });
    } catch (error) {
        console.error("❌ Fetch Automation Logs Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch automation logs." });
    }
});

// 7. Manual Retry Trigger for Failed Log (CEO & Manager)
app.post('/admin/automation/retry/:id', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const result = await manualRetryLog(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        console.error("❌ Manual Retry Error:", error);
        return res.status(400).json({ success: false, message: error.message || "Manual retry failed." });
    }
});

// 8. Message Preview Generator (CEO & Manager)
app.post('/admin/automation/preview', authenticateToken, requireRole(['CEO', 'Manager']), (req, res) => {
    try {
        const { subject, body, data } = req.body;
        const renderedSubject = renderTemplate(subject || '', data || {});
        const renderedBody = renderTemplate(body || '', data || {});

        return res.status(200).json({
            success: true,
            renderedSubject,
            renderedBody
        });
    } catch (error) {
        console.error("❌ Message Preview Error:", error);
        return res.status(500).json({ success: false, message: "Failed to render message preview." });
    }
});

// =========================================================================
// 📄 PHASE 5 PROMPT 3 — INVOICE, TRAVEL VOUCHER & PDF DOCUMENT ENDPOINTS
// =========================================================================

// 1. Generate Document Endpoint (CEO & Manager)
app.post('/admin/documents/generate', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const { documentType, bookingId, quoteId, customerId, customData, taxMode } = req.body;
        if (!documentType) {
            return res.status(400).json({ success: false, message: "documentType is required." });
        }

        const document = await generateDocument({
            documentType,
            bookingId,
            quoteId,
            customerId,
            user: req.user,
            customData,
            taxMode
        });

        return res.status(201).json({
            success: true,
            message: `${documentType} generated successfully.`,
            document
        });
    } catch (error) {
        console.error("❌ Document Generation Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to generate document." });
    }
});

// 2. Fetch Documents List Endpoint (CEO & Manager)
app.get('/admin/documents', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const { bookingId, quoteId, documentType, status } = req.query;
        let docs = await getDocuments({ bookingId, quoteId, documentType, status });

        // Filter out INTERNAL_FINANCIAL_REPORT for Manager
        if (req.user.role !== 'CEO') {
            docs = docs.filter(d => d.documentType !== 'INTERNAL_FINANCIAL_REPORT');
        }

        return res.status(200).json({ success: true, documents: docs });
    } catch (error) {
        console.error("❌ Fetch Documents Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch documents." });
    }
});

// 3. Fetch Single Document Metadata & Stream File (CEO & Manager)
app.get('/admin/documents/:documentId', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const doc = await getDocumentById(req.params.documentId, req.user.role);
        if (!doc) {
            return res.status(404).json({ success: false, message: "Document not found." });
        }

        if (req.query.download === 'true') {
            const buffer = readDocumentFile(doc.fileName);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
            return res.send(buffer);
        }

        return res.status(200).json({ success: true, document: doc });
    } catch (error) {
        console.error("❌ Get Document Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch document." });
    }
});

// 4. Regenerate Document Version Endpoint (CEO & Manager)
app.post('/admin/documents/:documentId/regenerate', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const newDoc = await regenerateDocument(req.params.documentId, req.user);
        return res.status(200).json({
            success: true,
            message: "Document regenerated with updated version.",
            document: newDoc
        });
    } catch (error) {
        console.error("❌ Regenerate Document Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to regenerate document." });
    }
});

// 5. Create Secure Temporary Share Link Endpoint (CEO & Manager)
app.post('/admin/documents/:documentId/share', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const { expiresInHours, maxDownloads } = req.body;
        const doc = await getDocumentById(req.params.documentId, req.user.role);
        if (!doc) {
            return res.status(404).json({ success: false, message: "Document not found." });
        }

        const tokenObj = await createDocumentToken(doc.documentId, {
            expiresInHours: Number(expiresInHours) || 24,
            maxDownloads: Number(maxDownloads) || 5
        });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const secureShareUrl = `${baseUrl}/public/document/${tokenObj.rawToken}`;

        return res.status(200).json({
            success: true,
            secureShareUrl,
            expiresAt: tokenObj.expiresAt,
            maxDownloads: tokenObj.maxDownloads
        });
    } catch (error) {
        console.error("❌ Document Share Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to generate share link." });
    }
});

// 6. Soft Archive Document Endpoint (CEO Only)
app.post('/admin/documents/:documentId/archive', authenticateToken, requireRole(['CEO']), async (req, res) => {
    try {
        const archived = await archiveDocument(req.params.documentId, req.user.role);
        return res.status(200).json({
            success: true,
            message: "Document archived successfully.",
            document: archived
        });
    } catch (error) {
        console.error("❌ Archive Document Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to archive document." });
    }
});

// 7. Public Secure Token Download Endpoint (Unauthenticated Public Endpoint)
app.get('/public/document/:token', async (req, res) => {
    try {
        const rawToken = req.params.token;
        const docId = await validateAccessToken(rawToken);
        const doc = await getDocumentById(docId, 'Public');

        if (!doc) {
            return res.status(404).json({ success: false, message: "Associated document not found." });
        }

        const buffer = readDocumentFile(doc.fileName);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
        return res.send(buffer);
    } catch (error) {
        console.error("❌ Public Access Token Error:", error);
        return res.status(400).json({ success: false, message: error.message || "Invalid or expired document link." });
    }
});

// =========================================================================
// 📁 PHASE 5 PROMPT 4 — UNIFIED FILE ATTACHMENT & STORAGE ENDPOINTS
// =========================================================================

// 1. Upload File Attachment Endpoint (CEO & Manager)
app.post('/admin/files/upload', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const { base64Data, originalName, mimeType, entityType, entityId } = req.body;
        if (!base64Data || !originalName) {
            return res.status(400).json({ success: false, message: "base64Data and originalName are required." });
        }

        const buffer = Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64');
        const attachment = await uploadFileAttachment({
            buffer,
            originalName,
            mimeType: mimeType || 'application/pdf',
            entityType: entityType || 'GENERAL',
            entityId: entityId || 'GLOBAL',
            uploadedBy: req.user.name || req.user.role
        });

        return res.status(201).json({
            success: true,
            message: "File attachment uploaded successfully.",
            attachment
        });
    } catch (error) {
        console.error("❌ File Upload Error:", error);
        const statusCode = error.statusCode || (error.message.includes('Unsupported') || error.message.includes('exceeds') || error.message.includes('required') ? 400 : 500);
        return res.status(statusCode).json({ success: false, message: error.message || "Failed to upload file." });
    }
});

// 2. Fetch File Attachments List for Entity (CEO & Manager)
app.get('/admin/files', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const { entityType, entityId } = req.query;
        const attachments = await getAttachments({ entityType, entityId });
        return res.status(200).json({ success: true, attachments });
    } catch (error) {
        console.error("❌ Fetch Attachments Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch attachments." });
    }
});

// 3. Download / Stream Attachment File (Authorized Access Control)
app.get('/admin/files/:attachmentId', authenticateToken, async (req, res) => {
    try {
        const attachment = await getAttachmentById(req.params.attachmentId);
        if (!attachment) {
            return res.status(404).json({ success: false, message: "Attachment record not found." });
        }

        // Enforce file attachment role & entity permission checks
        verifyFileAccessPermission(attachment, req.user);

        const buffer = await getAttachmentBuffer(req.params.attachmentId);
        res.setHeader('Content-Type', attachment.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        return res.send(buffer);
    } catch (error) {
        console.error("❌ Attachment Access Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to access file." });
    }
});

// 4. Delete File Attachment Endpoint (CEO & Manager)
app.delete('/admin/files/:attachmentId', authenticateToken, requireRole(['CEO', 'Manager']), async (req, res) => {
    try {
        const attachment = await getAttachmentById(req.params.attachmentId);
        if (!attachment) {
            return res.status(404).json({ success: false, message: "Attachment not found." });
        }

        verifyFileAccessPermission(attachment, req.user);

        const deleted = await deleteAttachment(req.params.attachmentId);
        return res.status(200).json({
            success: true,
            message: "File attachment deleted successfully.",
            deleted
        });
    } catch (error) {
        console.error("❌ Delete Attachment Error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to delete attachment." });
    }
});

// Production Static SPA Serving (when dist/ directory exists)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/admin') && !req.path.startsWith('/health') && !req.path.startsWith('/ready') && !req.path.startsWith('/auth')) {
            return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
    });
}

const PORT = process.env.PORT || 5001;
const { disconnectDatabase } = require('./config/database');
let activeHttpServer = null;

// Connect Database before starting listener when run directly
if (process.env.NODE_ENV !== 'test' && require.main === module) {
    connectDatabase().then(async () => {
        await initializeUsers();
        activeHttpServer = app.listen(PORT, () => console.log(`🚀 Production Operating System active on port ${PORT}`));
    });
}

// Graceful process signal handling
const handleGracefulShutdown = async (signal) => {
    console.log(`\n🛑 [Server] Received ${signal}. Initiating graceful shutdown...`);
    if (activeHttpServer) {
        await new Promise((resolve) => activeHttpServer.close(resolve));
        console.log('✅ [Server] HTTP server listener closed.');
    }
    await disconnectDatabase();
    console.log('✅ [Server] Graceful shutdown complete. Exiting process.');
    process.exit(0);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

module.exports = app;
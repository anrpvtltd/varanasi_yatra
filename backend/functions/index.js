const functions = require('firebase-functions');
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://varanasi-yatra.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:5001'
      ];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

app.use(express.json());

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
    role: { type: String, required: true, enum: ['CEO', 'Manager'] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');

async function initializeUsers() {
    try {
        const ceoEmail = process.env.CEO_EMAIL;
        const ceoPassword = process.env.CEO_INITIAL_PASSWORD;
        const managerEmail = process.env.MANAGER_EMAIL;
        const managerPassword = process.env.MANAGER_INITIAL_PASSWORD;

        if (!ceoEmail || !ceoPassword || !managerEmail || !managerPassword) {
            console.log("⚠️ Seeding credentials missing in environment variables. Seeding skipped.");
            return;
        }

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

const modelsMap = {
    'Pending': Enquiry,
    'In-Progress': InProgressBooking,
    'Confirmed': ConfirmedBooking,
    'Trip Started': TripStartedBooking,
    'Completed': CompletedBooking,
    'Cancelled': CancelledBooking
};

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("🟢 Cloud Engine: MongoDB Active");
        await initializeUsers();
    })
    .catch((err) => console.error("❌ Database Error:", err));

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

const rateLimit = require('express-rate-limit');

const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many incorrect PIN attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

const enquiryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many enquiry submissions from this IP. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("❌ CRITICAL: JWT_SECRET environment variable is missing!");
    process.exit(1);
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access token missing. Please log in." });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, message: "Session expired or invalid. Please log in again." });
        }
        req.user = decoded;
        next();
    });
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden: Insufficient permissions." });
        }
        next();
    };
}

// 🔐 Login Route
app.post('/admin/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, loginType } = req.body;
        if (!email || !password || !loginType) {
            return res.status(400).json({ success: false, message: "Email, password and login type are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: "Invalid email or account is inactive." });
        }

        const isMatch = bcrypt.compareSync(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect password." });
        }

        // Validate that loginType matches user role
        if (loginType === 'CEO' && user.role !== 'CEO') {
            return res.status(403).json({ success: false, message: "This email does not have CEO access." });
        }
        if (loginType === 'TEAM' && user.role !== 'Manager') {
            return res.status(403).json({ success: false, message: "This email does not have Team access." });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("❌ Login Error:", error);
        return res.status(500).json({ success: false, message: "Login server error." });
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
        const [pending, inProgress, confirmed, tripStarted, completed, cancelled] = await Promise.all([
            Enquiry.find(),
            InProgressBooking.find(),
            ConfirmedBooking.find(),
            TripStartedBooking.find(),
            CompletedBooking.find(),
            CancelledBooking.find()
        ]);
        const allLeads = [...pending, ...inProgress, ...confirmed, ...tripStarted, ...completed, ...cancelled]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
            const newRecord = new targetModel(newDocData);
            updatedData = await newRecord.save();
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
        return res.status(500).json({ success: false, message: "Manual lead creation failed." });
    }
});

exports.api = functions.https.onRequest(app); // Force redeploy trigger
const functions = require('firebase-functions');
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
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
// 🗂️ 4 SEPARATE CUSTOMIZED COLLECTIONS SCHEMA
// =========================================================================
const baseSchemaFields = {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, default: 'offline-client@banarasyatra.com' },
    pickup: { type: String, default: 'Direct Booking' },
    date: { type: String },
    travelers: { type: String, default: '1' },
    status: { type: String, default: 'Pending' },
    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    cancellationReason: { type: String },
    followUpDate: { type: String },
    adminNotes: { type: String }
};

const EnquirySchema = new mongoose.Schema(baseSchemaFields, { timestamps: true });

// Mapping models to 4 distinct MongoDB folders
const Enquiry = mongoose.model('Enquiry', EnquirySchema, 'enquiries');
const InProgressBooking = mongoose.model('InProgressBooking', EnquirySchema, 'inprogress_bookings');
const ConfirmedBooking = mongoose.model('ConfirmedBooking', EnquirySchema, 'confirmed_bookings');
const CancelledBooking = mongoose.model('CancelledBooking', EnquirySchema, 'cancelled_bookings');

const modelsMap = {
    'Pending': Enquiry,
    'In-Progress': InProgressBooking,
    'Confirmed': ConfirmedBooking,
    'Cancelled': CancelledBooking
};

// 🟢 DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🟢 Cloud Engine: MongoDB Active"))
    .catch((err) => console.error("❌ Database Error:", err));

// 📧 EMAIL ENGINE CONFIGURATION
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Helper to look up documents across collections dynamically
async function findLeadAcrossCollections(id) {
    for (const model of Object.values(modelsMap)) {
        const doc = await model.findById(id);
        if (doc) return { doc, currentModel: model };
    }
    return null;
}

// =========================================================================
// 🌐 API ROUTES (CLEAN & OPTIMIZED)
// =========================================================================

app.post('/admin/verify-pin', (req, res) => {
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

// 📥 1. Website Form Submission Channel
app.post('/api/enquiry', async (req, res) => {
    try {
        const { name, mobile, email, pickup, date, travelers } = req.body;
        if (!name || !mobile || !email || !pickup || !date) {
            return res.status(400).json({ success: false, message: "Required fields missing." });
        }

        const newLead = new Enquiry({ name, mobile, email, pickup, date, travelers, status: 'Pending' });
        await newLead.save();

        const adminMail = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `🟡 New Website Inquiry Alert: ${name}`,
            html: `<div style="font-family: Arial; padding: 20px; border: 1px solid #d97706;"><h2>🚩 New Travel Query Received</h2><p><b>Name:</b> ${name}<br/><b>Mobile:</b> ${mobile}<br/><b>Travel Date:</b> ${date}</p></div>`
        };
        try {
            await transporter.sendMail(adminMail);
        } catch (mailError) {
            console.error("❌ Admin Alert Email failed to send:", mailError);
        }

        return res.status(200).json({ success: true, message: "🎉 Query registered successfully!" });
    } catch (error) {
        console.error("❌ Website Enquiry Route Failure:", error);
        return res.status(500).json({ success: false, message: "Server Error." });
    }
});

// 📊 2. Fetch All Combined Grid Data for CRM Dashboard
app.get('/admin/enquiries', async (req, res) => {
    try {
        const [pending, inProgress, confirmed, cancelled] = await Promise.all([
            Enquiry.find(), InProgressBooking.find(), ConfirmedBooking.find(), CancelledBooking.find()
        ]);
        const allLeads = [...pending, ...inProgress, ...confirmed, ...cancelled]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.status(200).json({ success: true, data: allLeads });
    } catch {
        return res.status(500).json({ success: false, message: "Fetch failed." });
    }
});

// 🔥 3. Master POST Update Route (Dynamic Folder Swapping & Custom Emails)
app.post('/admin/enquiry/update/:id', async (req, res) => {
    try {
        const { status, totalAmount, advanceAmount, remainingAmount, cancellationReason, followUpDate, adminNotes } = req.body;
        
        // 1. Sanitize/Validate target status
        const targetModel = modelsMap[status];
        if (!targetModel) {
            return res.status(400).json({ success: false, message: "Invalid or unsupported lead status." });
        }

        // 2. Locate current lead location
        const searchResult = await findLeadAcrossCollections(req.params.id);
        if (!searchResult) return res.status(404).json({ success: false, message: "Record not found." });

        const { doc, currentModel } = searchResult;
        let updatedData;

        if (currentModel !== targetModel) {
            // 3. Save to target collection FIRST to prevent accidental data loss
            const newDocData = { 
                ...doc.toObject(), 
                status, 
                totalAmount: Number(totalAmount) || 0, 
                advanceAmount: Number(advanceAmount) || 0, 
                remainingAmount: Number(remainingAmount) || 0, 
                cancellationReason, 
                followUpDate, 
                adminNotes 
            };
            const newRecord = new targetModel(newDocData);
            updatedData = await newRecord.save();

            // 4. Delete old record only AFTER successful save
            await currentModel.findByIdAndDelete(req.params.id);
        } else {
            // Standard update inside the same collection
            updatedData = await currentModel.findByIdAndUpdate(
                req.params.id,
                { 
                    status, 
                    totalAmount: Number(totalAmount) || 0, 
                    advanceAmount: Number(advanceAmount) || 0, 
                    remainingAmount: Number(remainingAmount) || 0, 
                    cancellationReason, 
                    followUpDate, 
                    adminNotes 
                },
                { new: true }
            );
        }

        // 5. Safe Awaited Email Notification
        if (status === 'Confirmed' && updatedData.email && !updatedData.email.includes('offline-client')) {
            const clientConfirm = {
                from: process.env.EMAIL_USER,
                to: updatedData.email,
                subject: `🎉 Your Banaras Yatra Trip is Confirmed!`,
                html: `<div style="font-family: Arial; padding: 20px; border: 1px solid #16a34a;">
                         <h2>Booking Confirmed Status</h2>
                         <p>Hello ${updatedData.name}, your package details are locked:<br/>
                         Total Amount: ₹${totalAmount}<br/>
                         Advance Received: ₹${advanceAmount}<br/>
                         Balance Outstanding: ₹${remainingAmount}</p>
                       </div>`
            };
            try {
                await transporter.sendMail(clientConfirm);
            } catch (mailError) {
                console.error("❌ Confirmation Email failed to send:", mailError);
            }
        }

        return res.status(200).json({ success: true, message: "Saved!", data: updatedData });
    } catch (error) {
        console.error("❌ Update Route Failure:", error);
        return res.status(500).json({ success: false, message: "Update failed." });
    }
});

// ➕ 4. Add Offline Direct Local Entry
app.post('/admin/enquiry/manual', async (req, res) => {
    try {
        const { name, mobile, email, pickup, date, travelers, status, totalAmount, advanceAmount, adminNotes } = req.body;
        if (!name || !mobile) return res.status(400).json({ success: false, message: "Fields required." });

        const total = Number(totalAmount) || 0;
        const advance = Number(advanceAmount) || 0;
        const currentStatus = status || 'Pending';
        const targetModel = modelsMap[currentStatus];

        const manualLead = new targetModel({
            name, mobile,
            email: email || 'offline-client@banarasyatra.com',
            pickup: pickup || 'Direct Local Visit',
            date: date || new Date().toISOString().split('T')[0],
            travelers: travelers || "1",
            status: currentStatus,
            totalAmount: total, advanceAmount: advance, remainingAmount: total - advance, adminNotes
        });

        await manualLead.save();
        return res.status(200).json({ success: true, data: manualLead });
    } catch {
        return res.status(500).json({ success: false, message: "Manual save failed." });
    }
});

exports.api = functions.https.onRequest(app);
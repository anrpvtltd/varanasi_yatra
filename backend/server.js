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
// 🗂️ MONGODB SEPARATE SCHEMAS (LOCAL COMPATIBILITY REPLICA)
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

const Enquiry = mongoose.model('Enquiry', EnquirySchema, 'enquiries');
const InProgressBooking = mongoose.model('InProgressBooking', EnquirySchema, 'inprogress_bookings');
const ConfirmedBooking = mongoose.model('ConfirmedBooking', EnquirySchema, 'confirmed_bookings');
const CancelledBooking = mongoose.model('CancelledBooking', EnquirySchema, 'cancelled_bookings');

const modelsMap = {
    'Pending': Enquiry, 'In-Progress': InProgressBooking, 'Confirmed': ConfirmedBooking, 'Cancelled': CancelledBooking
};

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🟢 Local Engine: Connected to Cloud MongoDB Atlas"))
    .catch((err) => console.error("❌ Mongoose Connection Error:", err));

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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { success: false, message: "Too many incorrect PIN attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
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

app.post('/api/enquiry', async (req, res) => {
    try {
        const { name, mobile, email, pickup, date, travelers } = req.body;
        const newLead = new Enquiry({ name, mobile, email, pickup, date, travelers, status: 'Pending' });
        await newLead.save();

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
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">
                    <a href="mailto:${email}" style="color: #d97706; text-decoration: none;">${email}</a>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">📍 Pickup Point:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${pickup}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">📅 Travel Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${date}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">👥 No. of Travelers:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${travelers || '1'}</td>
            </tr>
        </table>
    </div>

    <div style="text-align: center; margin-top: 25px; border-top: 1px solid #e7e5e4; padding-top: 15px;">
        <a href="https://varanasi-yatra.vercel.app/?view=admin" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 12px; font-weight: bold; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Open Admin CRM Portal ➔</a>
        <p style="margin: 15px 0 0 0; font-size: 10px; color: #a8a29e;">This is an automated system notification from your website. Do not reply directly to this mail.</p>
    </div>
</div>`
        };
        try {
            await transporter.sendMail(adminMail);
        } catch (mailError) {
            console.error("❌ Admin Alert Email failed to send:", mailError);
        }

        return res.status(200).json({ success: true, message: "Saved locally!" });
    } catch { return res.status(500).json({ success: false }); }
});

app.get('/admin/enquiries', async (req, res) => {
    try {
        const [pending, inProgress, confirmed, cancelled] = await Promise.all([
            Enquiry.find(), InProgressBooking.find(), ConfirmedBooking.find(), CancelledBooking.find()
        ]);
        const allLeads = [...pending, ...inProgress, ...confirmed, ...cancelled].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return res.status(200).json({ success: true, data: allLeads });
    } catch { return res.status(500).json({ success: false }); }
});

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
                html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1.5px solid #d97706; border-radius: 16px; background-color: #fafaf9; color: #1c1917;">
    <div style="text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #d97706; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">🚩 BANARAS YATRA</h2>
        <p style="color: #78716c; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Trip Confirmation Receipt</p>
    </div>
    
    <div style="margin-bottom: 25px;">
        <p style="font-size: 14px; margin: 0 0 15px 0; color: #44403c; line-height: 1.6;">Dear <strong>${updatedData.name}</strong>, Namaste!</p>
        <p style="font-size: 14px; margin: 0 0 15px 0; color: #44403c; line-height: 1.6;">We are pleased to inform you that your tour package details are locked and officially <strong>Confirmed</strong>! We are excited to make your journey to Varanasi divine and memorable.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #fafaf9;">
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706; width: 45%;">📅 Travel Date:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${updatedData.date}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">📍 Pickup Point:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${updatedData.pickup}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #d97706;">👥 No. of Travelers:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 600;">${updatedData.travelers} Pax</td>
            </tr>
            <tr style="background-color: #fafaf9;">
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #1c1917;">💰 Total Package Value:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #1c1917; font-weight: 700;">₹${totalAmount}</td>
            </tr>
            <tr style="background-color: #f0fdf4;">
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #16a34a;">🟢 Advance Token Paid:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #16a34a; font-weight: 700;">₹${advanceAmount}</td>
            </tr>
            <tr style="background-color: #fef2f2;">
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: bold; font-size: 13px; color: #dc2626;">⏳ Balance Due:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e7e5e4; font-size: 13px; color: #dc2626; font-weight: 800;">₹${remainingAmount}</td>
            </tr>
        </table>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 12px; color: #b45309; line-height: 1.5;">
        <strong>📜 Next Steps:</strong><br/>
        Our travel coordinators will call you 24 hours prior to your travel to share details of the pickup vehicle and assigned pilot/driver. Please keep the balance outstanding ready for settlement upon pickup.
    </div>

    <div style="text-align: center; border-top: 1px solid #e7e5e4; padding-top: 15px;">
        <p style="margin: 0; font-size: 12px; color: #44403c;">Need assistance? Connect with our 24/7 Helpline: <strong>+91 8400554029</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 10px; color: #a8a29e;">Thank you for choosing Banaras Yatra. Have a divine pilgrimage!</p>
    </div>
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Local Engine active on http://localhost:${PORT}`));
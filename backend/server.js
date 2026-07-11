const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Enquiry = require('./models/Enquiry'); // Model Connect Kiya

const app = express();

// 🌐 CORS Fix: Frontend Port 5173 ko allow karna
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 🟢 MongoDB Database Se Connection Setup
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🟢 Cloud Database (MongoDB) Connected Successfully!"))
    .catch((err) => console.error("❌ Database Connection Error:", err));

// 📧 Mail Sender Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 📥 Customer Lead Input API Endpoint
app.post('/api/enquiry', async (req, res) => {
    try {
        const { name, mobile, email, pickup, date, travelers } = req.body;

        // Validation Check
        if (!name || !mobile || !email || !pickup || !date) {
            return res.status(400).json({ success: false, message: "Please fill all required fields properly." });
        }

        // 1. Database Mein Permanent Save Karna
        const newEnquiry = new Enquiry({ name, mobile, email, pickup, date, travelers });
        await newEnquiry.save();
        console.log(`💾 Lead for client "${name}" successfully locked in Database.`);

        // 2. Beautiful Professional Layout Email Notification Send Karna
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Aapko aapki hi mail par alert aayega
            subject: `🚨 New Enquire Alert: ${name} is reaching out!`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ea580c 0%, #d97706 100%); padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 20px;">Banaras Yatra — New Travel Inquiry</h1>
          </div>
          <div style="padding: 20px; color: #334155;">
            <p style="font-size: 14px;">Hello Admin, a new customer has submitted details on the website:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
              <tr style="background-color: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Name:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Mobile:</td><td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;"><a href="tel:${mobile}" style="color: #ea580c; text-decoration: none;">${mobile}</a></td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Email:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${email}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Pickup:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${pickup}</td></tr>
              <tr style="background-color: #f8fafc;"><td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Date:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${date}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Travelers:</td><td style="padding: 8px; border: 1px solid #e2e8f0;">${travelers} Persons</td></tr>
            </table>
            <div style="text-align: center; margin-top: 20px;">
              <a href="https://wa.me/91${mobile}" target="_blank" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">💬 Connect on WhatsApp</a>
            </div>
          </div>
        </div>
      `
        };

        // Async Email trigger
        transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) console.error("❌ Email Trigger Error:", mailErr);
            else console.log("📧 Alert Email sent successfully to admin inbox!");
        });

        return res.status(200).json({ success: true, message: "🎉 Data saved and team notified successfully!" });

    } catch (error) {
        console.error("System Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Varanasi Yatra Backend Engine active on port ${PORT}`);
});
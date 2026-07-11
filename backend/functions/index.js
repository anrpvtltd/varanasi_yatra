const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const Enquiry = require('./models/Enquiry'); // Model Connect Kiya

const app = express();

// 🌐 CORS Fix: origin true karne se Vercel frontend bina kisi dikkat ke connect ho jayega
app.use(cors({
    origin: true,
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
app.post('/enquiry', async (req, res) => {
    try {
        const { name, mobile, email, pickup, date, travelers } = req.body;

        if (!name || !mobile || !email || !pickup || !date) {
            return res.status(400).json({ success: false, message: "Please fill all required fields properly." });
        }

        const newEnquiry = new Enquiry({ name, mobile, email, pickup, date, travelers });
        await newEnquiry.save();
        console.log(`💾 Lead for client "${name}" successfully locked in Database.`);

        // 🌟 Naya Sundar HTML Email Template Jo Aapki Photo Se Inspired Hai
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: `🚩 Banaras Yatra — Confirmed Customer Details (${name})`,
            html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #ebdccb; border-radius: 12px; overflow: hidden; background-color: #fdfbfc; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              
              <!-- Premium Header Banner -->
              <div style="background-color: #7d3c16; padding: 25px 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase;">BANARAS YATRA — CONFIRMED CUSTOMER DETAILS</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; letter-spacing: 0.5px;">New Travel Inquiry Received</p>
              </div>

              <!-- Greeting Message -->
              <div style="padding: 24px 24px 10px 24px;">
                <p style="font-size: 15px; color: #475569; margin: 0; line-height: 1.5;">Hello Admin, a new customer has submitted details on the website:</p>
              </div>

              <!-- 2-Column Main Layout (Using Table for Email Client Compatibility) -->
              <div style="padding: 10px 24px 24px 24px;">
                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <!-- Left Column: Customer Profile Box -->
                    <td width="48%" valign="top" style="background-color: #fcf8f4; border: 1px solid #ebdccb; border-radius: 10px; padding: 18px; box-sizing: border-box;">
                      <h3 style="margin: 0 0 14px 0; color: #7d3c16; font-size: 14px; letter-spacing: 0.5px; border-bottom: 2px solid #ebdccb; padding-bottom: 6px;">👤 CUSTOMER PROFILE</h3>
                      
                      <p style="margin: 8px 0; font-size: 16px; color: #1e293b; font-weight: bold;">${name}</p>
                      
                      <p style="margin: 12px 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Mobile Number</p>
                      <p style="margin: 0; font-size: 14px; color: #7d3c16; font-weight: bold;"><a href="tel:${mobile}" style="color: #7d3c16; text-decoration: none;">[${mobile}]</a></p>
                      
                      <p style="margin: 12px 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Email Address</p>
                      <p style="margin: 0; font-size: 14px; color: #334155; word-break: break-all;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">[${email}]</a></p>
                    </td>

                    <!-- Center Spacer Column -->
                    <td width="4%"></td>

                    <!-- Right Column: Trip Details Box -->
                    <td width="48%" valign="top" style="background-color: #fcf8f4; border: 1px solid #ebdccb; border-radius: 10px; padding: 18px; box-sizing: border-box;">
                      <h3 style="margin: 0 0 14px 0; color: #7d3c16; font-size: 14px; letter-spacing: 0.5px; border-bottom: 2px solid #ebdccb; padding-bottom: 6px;">📋 TRIP AT A GLANCE</h3>
                      
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                        <strong style="color: #64748b; font-size: 11px; display: block; text-transform: uppercase; margin-bottom: 2px;">📅 Travel Date:</strong>
                        <span style="font-weight: 600; color: #1e293b;">${date}</span>
                      </p>
                      
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                        <strong style="color: #64748b; font-size: 11px; display: block; text-transform: uppercase; margin-bottom: 2px;">📍 Pickup Location:</strong>
                        <span style="font-weight: 600; color: #1e293b;">${pickup}</span>
                      </p>
                      
                      <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
                        <strong style="color: #64748b; font-size: 11px; display: block; text-transform: uppercase; margin-bottom: 2px;">👥 Total Travelers:</strong>
                        <span style="font-weight: 600; color: #1e293b;">${travelers} Persons</span>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Premium WhatsApp Button Setup -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://wa.me/91${mobile}?text=Hello%20${encodeURIComponent(name)},%20thank%20you%20for%20contacting%20Banaras%20Yatra.%20We%20received%20your%20tour%20inquiry!" 
                     target="_blank" 
                     style="background-color: #7d3c16; color: white; padding: 12px 28px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.15); transition: background 0.2s;">
                     💬 Connect on WhatsApp
                  </a>
                </div>
              </div>

              <!-- Professional Automated Footer -->
              <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #ebdccb;">
                This is an automated system generation from Banaras Yatra web application portal.
              </div>
            </div>
            `
        };

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

// 🚀 Firebase Cloud Functions Ke Liye Express Export Kiya
exports.api = functions.https.onRequest(app);
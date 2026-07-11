const mongoose = require('mongoose');

// Enquiry Schema Design
const EnquirySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    pickup: { type: String, required: true },
    date: { type: String, required: true },
    travelers: { type: String, default: '1' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Enquiry', EnquirySchema);
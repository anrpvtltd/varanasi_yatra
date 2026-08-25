const DEFAULT_TEMPLATES = [
    {
        templateId: 'NEW_ENQUIRY_CONFIRMATION',
        name: 'New Enquiry Customer Confirmation',
        category: 'ENQUIRY',
        channel: 'WHATSAPP',
        subject: 'Namaste {{customerName}}! We received your Varanasi Yatra enquiry 🙏',
        body: 'Namaste {{customerName}} ji! 🙏\n\nThank you for reaching out to Varanasi Yatra. We have received your enquiry for {{packageName}}.\n\nOur Yatra specialist will contact you shortly to plan your spiritual journey!\n\nBest regards,\nVaranasi Yatra Team 🚩',
        variables: ['customerName', 'packageName'],
        isSystemDefault: true
    },
    {
        templateId: 'MANAGER_NEW_LEAD_ALERT',
        name: 'Manager New Lead Notification',
        category: 'INTERNAL_ALERT',
        channel: 'BOTH',
        subject: '🚨 New Lead Received: {{customerName}} ({{leadSource}})',
        body: '🚨 NEW LEAD ALERT 🚨\n\nCustomer: {{customerName}}\nMobile: {{mobile}}\nSource: {{leadSource}}\nPackage Interest: {{packageName}}\nDate: {{tripDate}}\n\nPlease assign and initiate follow-up within 15 minutes!',
        variables: ['customerName', 'mobile', 'leadSource', 'packageName', 'tripDate'],
        isSystemDefault: true
    },
    {
        templateId: 'QUOTE_READY',
        name: 'Quote Ready Customer Message',
        category: 'QUOTE',
        channel: 'WHATSAPP',
        subject: 'Your Varanasi Yatra Itinerary & Custom Quote is Ready! 🕉️',
        body: 'Namaste {{customerName}} ji!\n\nYour customized itinerary for {{packageName}} ({{tripDate}}) is ready!\n\nQuote Reference: {{quoteId}}\nTotal Amount: ₹{{totalAmount}}\n\nView details or request modifications by replying to this message.\n\nWarm regards,\nVaranasi Yatra',
        variables: ['customerName', 'packageName', 'tripDate', 'quoteId', 'totalAmount'],
        isSystemDefault: true
    },
    {
        templateId: 'BOOKING_CONFIRMATION',
        name: 'Booking Confirmation Message',
        category: 'BOOKING',
        channel: 'BOTH',
        subject: 'Booking Confirmed! Welcome to Varanasi Yatra ({{bookingId}}) 🎉',
        body: 'Hari Om {{customerName}} ji! 🙏\n\nYour booking for {{packageName}} starting on {{tripDate}} is CONFIRMED!\n\nBooking Reference: {{bookingId}}\nAdvance Paid: ₹{{paidAmount}}\nRemaining Due: ₹{{amountDue}}\n\nWe look forward to hosting your sacred journey!',
        variables: ['customerName', 'packageName', 'tripDate', 'bookingId', 'paidAmount', 'amountDue'],
        isSystemDefault: true
    },
    {
        templateId: 'PAYMENT_REMINDER',
        name: 'Customer Payment Reminder',
        category: 'PAYMENT',
        channel: 'WHATSAPP',
        subject: 'Payment Reminder for Booking {{bookingId}} 💳',
        body: 'Namaste {{customerName}} ji!\n\nThis is a friendly reminder regarding your upcoming trip on {{tripDate}} (Booking: {{bookingId}}).\n\nPending Due: ₹{{amountDue}}\n\nPlease complete your payment using this link: {{paymentLink}}\n\nThank you for choosing Varanasi Yatra!',
        variables: ['customerName', 'tripDate', 'bookingId', 'amountDue', 'paymentLink'],
        isSystemDefault: true
    },
    {
        templateId: 'PAYMENT_RECEIPT',
        name: 'Payment Received Confirmation',
        category: 'PAYMENT',
        channel: 'BOTH',
        subject: 'Payment Received for Booking {{bookingId}} ✅',
        body: 'Namaste {{customerName}} ji!\n\nWe have received your payment of ₹{{paidAmount}} for Booking {{bookingId}}.\n\nTotal Paid: ₹{{paidAmount}}\nRemaining Due: ₹{{amountDue}}\n\nThank you!',
        variables: ['customerName', 'paidAmount', 'bookingId', 'amountDue'],
        isSystemDefault: true
    },
    {
        templateId: 'TRIP_REMINDER',
        name: 'Upcoming Trip Reminder & Driver Details',
        category: 'TRIP',
        channel: 'WHATSAPP',
        subject: 'Your Varanasi Trip Starts Tomorrow! Driver Details Inside 🚗',
        body: 'Namaste {{customerName}} ji!\n\nYour Varanasi Yatra begins on {{tripDate}}!\n\nDriver Name: {{driverName}}\nDriver Contact: {{driverMobile}}\nBooking Ref: {{bookingId}}\n\nOur team is at your service 24/7. Have a blessed Yatra! 🕉️',
        variables: ['customerName', 'tripDate', 'driverName', 'driverMobile', 'bookingId'],
        isSystemDefault: true
    },
    {
        templateId: 'TRIP_COMPLETED',
        name: 'Trip Completed & Feedback Request',
        category: 'FEEDBACK',
        channel: 'WHATSAPP',
        subject: 'Thank You for Travelling with Varanasi Yatra! 🙏',
        body: 'Namaste {{customerName}} ji!\n\nWe hope you had a divine and joyful experience on your Varanasi Yatra (Booking: {{bookingId}}).\n\nPlease share your valuable feedback with us to help us serve yatris better!\n\nJai Kashi Vishwanath! 🚩',
        variables: ['customerName', 'bookingId'],
        isSystemDefault: true
    }
];

/**
 * Replace placeholders in template text with actual payload values
 * @param {string} text 
 * @param {object} data 
 * @returns {string}
 */
function renderTemplate(text, data = {}) {
    if (!text) return '';
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
        if (key in data && data[key] !== undefined && data[key] !== null) {
            return String(data[key]);
        }
        return match; // Keep {{key}} if unreplaced
    });
}

module.exports = {
    DEFAULT_TEMPLATES,
    renderTemplate
};

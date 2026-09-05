/**
 * HTML/SVG template builders for all 7 Varanasi Yatra business document types
 */

const BRAND_HEADER = `
<div style="background-gradient: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; border-radius: 12px; margin-bottom: 24px; color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h1 style="margin: 0; color: #f97316; font-size: 26px; font-weight: 800; letter-spacing: 1px;">VARANASI YATRA</h1>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; font-style: italic;">Your Journey Begins with Trust 🚩</p>
        </div>
        <div style="text-align: right; color: #cbd5e1; font-size: 11px; line-height: 1.5;">
            <div>Dashashwamedh Ghat Road, Varanasi, UP 221001</div>
            <div>Phone: +91 84005 54029 | WhatsApp: +91 81497 83494</div>
            <div>info.varanasi.yatra@gmail.com | https://varanasiyatra.com</div>
        </div>
    </div>
</div>
`;

const FOOTER_NOTE = `
<div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 10px; font-family: sans-serif; line-height: 1.6;">
    <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">Varanasi Yatra · Authentic Pilgrimages & Custom Tours</div>
    <div>Phone: +91 84005 54029 · WhatsApp: +91 81497 83494 · Email: info.varanasi.yatra@gmail.com</div>
    <div>Instagram: @info.varanasi.yatra · Website: https://varanasiyatra.com</div>
    <div style="margin-top: 6px; font-size: 9px; color: #94a3b8;">Computer Generated Official Document — Varanasi Yatra Travel OS</div>
</div>
`;

function buildQuoteTemplate(data) {
    const q = data.quote || data;
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #334155;">
            ${BRAND_HEADER}
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #f97316; pb: 10px;">
                <h2 style="color: #0f172a; margin: 0;">OFFICIAL TRAVEL QUOTATION</h2>
                <div style="font-weight: bold; color: #ea580c;">Ref: ${data.documentId || q.quoteId || 'VY-QUOTE'}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <tr>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc; width: 25%;">Customer Name:</td>
                    <td style="padding: 8px;">${q.customerName || data.name || 'Valued Guest'}</td>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc; width: 25%;">Travel Date:</td>
                    <td style="padding: 8px;">${q.tripDate || q.date || 'To Be Confirmed'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Mobile:</td>
                    <td style="padding: 8px;">${q.mobile || 'N/A'}</td>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Travelers:</td>
                    <td style="padding: 8px;">${q.travelers || '1'} Person(s)</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Package Name:</td>
                    <td style="padding: 8px; color: #ea580c; font-weight: bold;">${q.packageName || 'Kashi Special Yatra'}</td>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Valid Until:</td>
                    <td style="padding: 8px;">${q.validUntil || '7 Days from Issue'}</td>
                </tr>
            </table>

            <h3 style="color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-size: 14px;">Included Services</h3>
            <ul style="font-size: 12px; line-height: 1.6; color: #475569;">
                <li>Hotel accommodation with breakfast</li>
                <li>Private AC Sedan/SUV for transfers & sightseeing</li>
                <li>VIP Darshan assistance at Kashi Vishwanath Temple</li>
                <li>Evening Ganga Aarti boat ride</li>
            </ul>

            <div style="margin-top: 24px; background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 16px; text-align: right;">
                <span style="font-size: 14px; color: #9a3412;">Quoted Total Package Price:</span>
                <span style="font-size: 22px; font-weight: bold; color: #ea580c; margin-left: 12px;">₹${Number(q.totalAmount || q.quotedPrice || 0).toLocaleString('en-IN')}</span>
            </div>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function buildBookingConfirmationTemplate(data) {
    const b = data.booking || data;
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #334155;">
            ${BRAND_HEADER}
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
                <h2 style="color: #047857; margin: 0;">🎉 BOOKING CONFIRMED</h2>
                <div style="font-size: 12px; color: #065f46; margin-top: 4px;">Booking Reference ID: <strong>${b.bookingId || 'VY-B-2026-0001'}</strong></div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold; width: 25%;">Guest Name:</td>
                    <td style="padding: 8px;">${b.customerName || 'Valued Guest'}</td>
                    <td style="padding: 8px; font-weight: bold; width: 25%;">Mobile:</td>
                    <td style="padding: 8px;">${b.mobile || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold;">Package Name:</td>
                    <td style="padding: 8px;">${b.packageName || 'Varanasi Yatra'}</td>
                    <td style="padding: 8px; font-weight: bold;">Travel Date:</td>
                    <td style="padding: 8px;">${b.tripDate || 'Confirmed Date'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold;">Pickup Location:</td>
                    <td style="padding: 8px;">${b.pickup || 'Varanasi Airport / Station'}</td>
                    <td style="padding: 8px; font-weight: bold;">Travelers:</td>
                    <td style="padding: 8px;">${b.travelers || '1'} Person(s)</td>
                </tr>
            </table>

            <h3 style="color: #0f172a; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">Confirmed Trip Services</h3>
            <div style="font-size: 12px; line-height: 1.8; color: #334155;">
                <div>🏨 <strong>Hotel:</strong> ${b.hotelDetails || 'Standard 3-Star Accommodation'}</div>
                <div>🚗 <strong>Cab / Transport:</strong> ${b.vehicleModel || 'AC Sedan'} (${b.vehicleNumber || 'Assigned on arrival'})</div>
                <div>🕉️ <strong>Temple Darshan:</strong> Kashi Vishwanath Special Entry Included</div>
                <div>🚤 <strong>Boat Tour:</strong> Dashashwamedh Evening Aarti Boat Ride</div>
            </div>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function buildTravelVoucherTemplate(data) {
    const b = data.booking || data;
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #334155;">
            ${BRAND_HEADER}
            <div style="border: 2px solid #ea580c; border-radius: 12px; padding: 20px; margin-bottom: 24px; background: #fff7ed;">
                <h2 style="color: #9a3412; margin: 0; font-size: 18px; text-align: center; text-transform: uppercase; tracking: 1px;">
                    CUSTOMER TRAVEL VOUCHER
                </h2>
                <div style="text-align: center; font-size: 12px; color: #c2410c; margin-top: 4px;">
                    Booking Ref: <strong>${b.bookingId || 'VY-B-2026-0001'}</strong> | Date of Issue: ${new Date().toLocaleDateString('en-IN')}
                </div>
            </div>

            <h3 style="color: #0f172a; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #ea580c; padding-bottom: 4px;">1. Guest & Trip Overview</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <tr>
                    <td style="padding: 6px; font-weight: bold;">Lead Passenger:</td>
                    <td style="padding: 6px;">${b.customerName || 'Valued Guest'}</td>
                    <td style="padding: 6px; font-weight: bold;">Contact Number:</td>
                    <td style="padding: 6px;">${b.mobile || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; font-weight: bold;">Package Selected:</td>
                    <td style="padding: 6px;">${b.packageName || 'Kashi Special Tour'}</td>
                    <td style="padding: 6px; font-weight: bold;">Total Passengers:</td>
                    <td style="padding: 6px;">${b.travelers || '1'} Adult(s)</td>
                </tr>
            </table>

            <h3 style="color: #0f172a; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #ea580c; padding-bottom: 4px;">2. Day-by-Day Itinerary</h3>
            <div style="font-size: 11px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                <div style="margin-bottom: 8px;"><strong>DAY 1: Arrival & Evening Ganga Aarti</strong><br/>Pickup from Airport/Station, Hotel Check-in. Evening special boat tour at Dashashwamedh Ghat for Ganga Aarti.</div>
                <div style="margin-bottom: 8px;"><strong>DAY 2: Kashi Vishwanath & Sarnath Tour</strong><br/>Early morning VIP Darshan at Kashi Vishwanath. Afternoon excursion to Sarnath Stupa & Museum.</div>
                <div><strong>DAY 3: Morning Ghat Walk & Departure</strong><br/>Assi Ghat Subah-e-Banaras experience. Local shopping & departure drop.</div>
            </div>

            <h3 style="color: #0f172a; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #ea580c; padding-bottom: 4px;">3. Assigned Contacts</h3>
            <div style="font-size: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                <div>🚘 <strong>Driver:</strong> ${b.driverName || 'Ramesh Kumar'} (${b.driverMobile || '+91 91111 22222'})</div>
                <div>🏨 <strong>Hotel:</strong> ${b.hotelDetails || 'Varanasi Heritage Stay'}</div>
                <div>📞 <strong>Helpline:</strong> +91 84005 54029 | 💬 <strong>WhatsApp:</strong> +91 81497 83494</div>
            </div>

            <h3 style="color: #0f172a; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #ea580c; padding-bottom: 4px;">4. Payment Status Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr style="background: #f1f5f9;">
                    <td style="padding: 8px;">Total Package Amount:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">₹${Number(b.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style="background: #f1f5f9;">
                    <td style="padding: 8px;">Amount Paid:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold; color: #16a34a;">₹${Number(b.advanceAmount || b.paidAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style="background: #f1f5f9; font-weight: bold;">
                    <td style="padding: 8px; color: #dc2626;">Balance Due on Arrival:</td>
                    <td style="padding: 8px; text-align: right; color: #dc2626;">₹${Number(b.remainingAmount || b.amountDue || 0).toLocaleString('en-IN')}</td>
                </tr>
            </table>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function buildPaymentReceiptTemplate(data) {
    const p = data.payment || data;
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #334155;">
            ${BRAND_HEADER}
            <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #16a34a; margin: 0;">PAYMENT RECEIPT</h2>
                <div style="font-size: 12px; font-weight: bold; color: #475569;">Receipt No: ${p.receiptNo || data.documentId || 'VY-REC-001'}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
                <tr>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Payment ID:</td>
                    <td style="padding: 8px;">${p.paymentId || 'PAY-100'}</td>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Date & Time:</td>
                    <td style="padding: 8px;">${p.date || new Date().toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Booking Ref:</td>
                    <td style="padding: 8px;">${p.bookingId || 'VY-B-2026-0001'}</td>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Payment Method:</td>
                    <td style="padding: 8px;">${p.method || 'UPI / Online'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Customer Name:</td>
                    <td style="padding: 8px;">${p.customerName || 'Valued Guest'}</td>
                    <td style="padding: 8px; font-weight: bold; background: #f8fafc;">Ref Number:</td>
                    <td style="padding: 8px;">${p.referenceNo || 'TXN-998811'}</td>
                </tr>
            </table>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #15803d; text-transform: uppercase;">Amount Received</div>
                <div style="font-size: 28px; font-weight: 800; color: #16a34a; margin-top: 4px;">₹${Number(p.amount || p.paidAmount || 0).toLocaleString('en-IN')}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr>
                    <td style="padding: 6px;">Total Package Cost:</td>
                    <td style="padding: 6px; text-align: right;">₹${Number(p.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 6px;">Total Paid Till Date:</td>
                    <td style="padding: 6px; text-align: right; color: #16a34a; font-weight: bold;">₹${Number(p.totalPaid || p.paidAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style="font-weight: bold; border-top: 1px solid #cbd5e1;">
                    <td style="padding: 6px; color: #dc2626;">Remaining Balance Due:</td>
                    <td style="padding: 6px; text-align: right; color: #dc2626;">₹${Number(p.remainingAmount || p.amountDue || 0).toLocaleString('en-IN')}</td>
                </tr>
            </table>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function buildCustomerInvoiceTemplate(data) {
    const inv = data.invoice || data;
    const taxMode = inv.taxMode || 'NO_TAX';
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #334155;">
            ${BRAND_HEADER}
            <div style="display: flex; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
                <div>
                    <h2 style="color: #0f172a; margin: 0;">TAX INVOICE</h2>
                    <div style="font-size: 11px; color: #64748b;">Tax Mode: ${taxMode}</div>
                </div>
                <div style="text-align: right; font-size: 12px; font-weight: bold;">
                    <div>Invoice No: ${inv.invoiceNo || data.documentId || 'VY-INV-001'}</div>
                    <div style="color: #64748b; font-weight: normal; font-size: 11px;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
                </div>
            </div>

            <div style="margin-bottom: 20px; font-size: 12px;">
                <strong>Billed To:</strong><br/>
                ${inv.customerName || 'Valued Guest'}<br/>
                Mobile: ${inv.mobile || 'N/A'}<br/>
                Booking Ref: ${inv.bookingId || 'VY-B-2026-0001'}
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
                <thead>
                    <tr style="background: #0f172a; color: #ffffff;">
                        <th style="padding: 10px; text-align: left;">Service Description</th>
                        <th style="padding: 10px; text-align: right;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px;">${inv.packageName || 'Varanasi Yatra Customized Spiritual Tour Package'}</td>
                        <td style="padding: 10px; text-align: right;">1</td>
                        <td style="padding: 10px; text-align: right;">₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                </tbody>
            </table>

            <table style="width: 40%; margin-left: auto; border-collapse: collapse; font-size: 12px;">
                <tr>
                    <td style="padding: 6px;">Subtotal:</td>
                    <td style="padding: 6px; text-align: right;">₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 6px;">Tax (${taxMode}):</td>
                    <td style="padding: 6px; text-align: right;">₹0</td>
                </tr>
                <tr style="font-weight: bold; font-size: 14px; border-top: 2px solid #0f172a;">
                    <td style="padding: 8px;">Total Amount:</td>
                    <td style="padding: 8px; text-align: right; color: #ea580c;">₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
            </table>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function buildOperationSheetTemplate(data, type) {
    const op = data.operation || data;
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #334155;">
            ${BRAND_HEADER}
            <div style="background: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px 16px; margin-bottom: 20px;">
                <h2 style="color: #0369a1; margin: 0; font-size: 16px;">
                    OPERATIONAL ASSIGNMENT SHEET (${type === 'DRIVER' ? 'DRIVER SHEET' : 'VENDOR SHEET'})
                </h2>
                <div style="font-size: 11px; color: #475569; margin-top: 4px;">Booking Ref: ${op.bookingId || 'VY-B-2026-0001'}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold; width: 25%;">Pickup Date/Time:</td>
                    <td style="padding: 8px;">${op.pickupDate || op.date || 'Immediate'}</td>
                    <td style="padding: 8px; font-weight: bold; width: 25%;">Pickup Location:</td>
                    <td style="padding: 8px;">${op.pickup || 'Airport / Railway Station'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold;">Customer Name:</td>
                    <td style="padding: 8px;">${op.customerName || 'Guest'}</td>
                    <td style="padding: 8px; font-weight: bold;">Travelers Count:</td>
                    <td style="padding: 8px;">${op.travelers || '1'} Person(s)</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px; font-weight: bold;">Assigned Driver / Vendor:</td>
                    <td style="padding: 8px;">${op.driverName || op.vendorName || 'Assigned Partner'}</td>
                    <td style="padding: 8px; font-weight: bold;">Vehicle / Contact:</td>
                    <td style="padding: 8px;">${op.vehicleDetails || op.driverMobile || 'Assigned Details'}</td>
                </tr>
            </table>

            <div style="font-size: 11px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 6px;">
                <strong>SECURITY NOTE:</strong> Internal financial details, margins, and customer payment information are strictly excluded from operational assignment sheets.
            </div>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function buildInternalFinancialReportTemplate(data) {
    const f = data.financial || data;
    return `
        <html>
        <body style="font-family: sans-serif; padding: 30px; color: #0f172a;">
            ${BRAND_HEADER}
            <div style="background: #1e1b4b; color: #e0e7ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 18px; letter-spacing: 1px;">👑 CEO INTERNAL BOOKING FINANCIAL AUDIT REPORT</h2>
                <div style="font-size: 11px; color: #a5b4fc; margin-top: 4px;">STRICTLY CONFIDENTIAL — CEO ACCESS ONLY</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;">
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px; text-align: left;">Financial Metric</th>
                    <th style="padding: 10px; text-align: right;">Amount (₹)</th>
                </tr>
                <tr>
                    <td style="padding: 8px;">Quoted Customer Package Price:</td>
                    <td style="padding: 8px; text-align: right; font-weight: bold;">₹${Number(f.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;">Customer Payments Received:</td>
                    <td style="padding: 8px; text-align: right; color: #16a34a; font-weight: bold;">₹${Number(f.paidAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;">Planned Vendor Expense Budget:</td>
                    <td style="padding: 8px; text-align: right;">₹${Number(f.plannedVendorCost || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;">Actual Vendor Expenses Incurred:</td>
                    <td style="padding: 8px; text-align: right; color: #dc2626;">₹${Number(f.actualVendorCost || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;">Business Overhead Expenses:</td>
                    <td style="padding: 8px; text-align: right;">₹${Number(f.expenses || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;">Shopping / Referral Commission:</td>
                    <td style="padding: 8px; text-align: right; color: #16a34a;">+₹${Number(f.commission || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style="background: #fff7ed; font-weight: bold; border-top: 2px solid #ea580c;">
                    <td style="padding: 10px; color: #9a3412;">Expected Profit (Quoted - Planned):</td>
                    <td style="padding: 10px; text-align: right; color: #c2410c;">₹${Number(f.expectedProfit || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style="background: #ecfdf5; font-weight: bold; font-size: 14px;">
                    <td style="padding: 10px; color: #065f46;">Actual Profit (Revenue - Expense - Overhead + Comm):</td>
                    <td style="padding: 10px; text-align: right; color: #047857;">₹${Number(f.actualProfit || 0).toLocaleString('en-IN')}</td>
                </tr>
            </table>
            ${FOOTER_NOTE}
        </body>
        </html>
    `;
}

function renderHTMLForDocument(documentType, data) {
    switch (documentType) {
        case 'QUOTE_PDF':
            return buildQuoteTemplate(data);
        case 'BOOKING_CONFIRMATION':
            return buildBookingConfirmationTemplate(data);
        case 'TRAVEL_VOUCHER':
            return buildTravelVoucherTemplate(data);
        case 'PAYMENT_RECEIPT':
            return buildPaymentReceiptTemplate(data);
        case 'CUSTOMER_INVOICE':
            return buildCustomerInvoiceTemplate(data);
        case 'DRIVER_OPERATIONS_SHEET':
            return buildOperationSheetTemplate(data, 'DRIVER');
        case 'VENDOR_OPERATIONS_SHEET':
            return buildOperationSheetTemplate(data, 'VENDOR');
        case 'INTERNAL_FINANCIAL_REPORT':
            return buildInternalFinancialReportTemplate(data);
        default:
            return buildBookingConfirmationTemplate(data);
    }
}

module.exports = {
    renderHTMLForDocument
};

/**
 * Customer AI Assistant Public & Admin Routes
 * Varanasi Yatra Platform — Prompt 6
 */

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const {
    AI_ASSISTANT_STATES,
    AI_MODULES,
    AI_AUDIT_DECISIONS,
    AI_RISK_LEVELS
} = require('./aiConstants');
const { processAssistantMessage, buildRequirementSummary } = require('./customerAssistantService');
const { getOrCreateConfig, recordAuditEvent } = require('./aiService');

// Public rate limiter for AI Assistant (30 requests/minute per IP)
const assistantLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Aapne kaafi messages bhej diye hain. Kripya 1 minute baad dobara prayas karein."
    }
});

// Session creation rate limiter (15 sessions/hour per IP)
const sessionCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Session limit reached. Kripya kuch samay baad aaiye."
    }
});

function registerCustomerAssistantRoutes(app, {
    AIAssistantSession,
    AIConfig,
    AIAuditLog,
    Enquiry,
    HotelPartner,
    QRRecord,
    authenticateToken,
    requireRole
}) {

    // -------------------------------------------------------------
    // 1. CREATE ASSISTANT SESSION (POST /public/ai/assistant/session)
    // -------------------------------------------------------------
    app.post('/public/ai/assistant/session', sessionCreationLimiter, async (req, res) => {
        try {
            const body = req.body || {};
            const config = await getOrCreateConfig(AIConfig);
            const isModuleActive = config.masterEnabled && !config.emergencyStop && config.modules?.customerAssistant?.enabled;

            // Generate unique IDs
            const sessionId = `asst_${crypto.randomBytes(8).toString('hex')}`;
            const conversationId = body.conversationId || `conv_${crypto.randomBytes(8).toString('hex')}`;

            // Snapshot attribution safely (preserving AREA_QR, HOTEL_QR, WEBSITE)
            const incomingSource = body.source ? String(body.source).toUpperCase().trim() : 'WEBSITE';
            const validSources = ['WEBSITE', 'HOTEL_QR', 'AREA_QR', 'PARTNER', 'WHATSAPP'];
            const source = validSources.includes(incomingSource) ? incomingSource : 'WEBSITE';

            const attribution = {
                source,
                qrId: body.qrId ? String(body.qrId).trim() : null,
                areaId: body.areaId ? String(body.areaId).trim() : null,
                partnerId: body.partnerId ? String(body.partnerId).trim() : null,
                qrType: body.qrType ? String(body.qrType).trim() : null,
                rawQuery: typeof body.rawQuery === 'object' ? body.rawQuery : {}
            };

            const initialMessage = {
                role: 'assistant',
                content: "Namaste 🙏\nMain Kashi-Vashi ka AI travel assistant hoon.\nAap Varanasi trip ke liye kya plan kar rahe hain?",
                timestamp: new Date(),
                quickReplies: [
                    "Plan a trip",
                    "Hotel",
                    "Darshan",
                    "Boat Ride",
                    "Transport",
                    "Pandit",
                    "Complete Package"
                ]
            };

            // Create session document
            const session = new AIAssistantSession({
                sessionId,
                conversationId,
                status: isModuleActive ? AI_ASSISTANT_STATES.NEW : AI_ASSISTANT_STATES.ERROR,
                attribution,
                messages: [initialMessage],
                requirementState: {},
                serviceInterests: [],
                messageCount: 1,
                lastMessageAt: new Date(),
                ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
                userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']).substring(0, 200) : null
            });

            await session.save();

            // Audit
            await recordAuditEvent(AIAuditLog, {
                runId: `ASST-${sessionId}`,
                userId: session._id,
                actorRole: 'ANONYMOUS_PUBLIC',
                module: AI_MODULES.CUSTOMER_ASSISTANT,
                action: 'SESSION_CREATED',
                decision: isModuleActive ? AI_AUDIT_DECISIONS.ALLOWED : AI_AUDIT_DECISIONS.BLOCKED,
                reason: isModuleActive ? 'Session initiated' : 'Module disabled or emergency stop',
                riskLevel: AI_RISK_LEVELS.LOW,
                metadata: { source: attribution.source, qrId: attribution.qrId }
            });

            if (!isModuleActive) {
                return res.status(200).json({
                    success: true,
                    sessionId,
                    conversationId,
                    available: false,
                    message: "Main abhi available nahi hoon. Aap normal Plan My Trip form use kar sakte hain ya WhatsApp par team se contact kar sakte hain.",
                    quickReplies: ["Plan My Trip Form", "WhatsApp Team"]
                });
            }

            return res.status(201).json({
                success: true,
                sessionId,
                conversationId,
                available: true,
                status: session.status,
                initialMessage: initialMessage.content,
                quickReplies: initialMessage.quickReplies,
                attribution: session.attribution
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 2. SEND ASSISTANT MESSAGE (POST /public/ai/assistant/message)
    // -------------------------------------------------------------
    app.post('/public/ai/assistant/message', assistantLimiter, async (req, res) => {
        try {
            const { sessionId, message } = req.body || {};

            if (!sessionId) {
                return res.status(400).json({ success: false, message: "Session ID is required." });
            }

            // Input length limits (Max 500 characters)
            const cleanMessage = String(message || '').trim();
            if (!cleanMessage || cleanMessage.length === 0) {
                return res.status(400).json({ success: false, message: "Message cannot be empty." });
            }
            if (cleanMessage.length > 500) {
                return res.status(400).json({ success: false, message: "Message too long. Maximum limit is 500 characters." });
            }

            const session = await AIAssistantSession.findOne({ sessionId });
            if (!session) {
                return res.status(404).json({ success: false, message: "Session expired or not found." });
            }

            // Bounded session protection (Max 25 messages per session to prevent flooding)
            if (session.messageCount >= 30) {
                return res.status(400).json({
                    success: false,
                    message: "Iss conversation ki limit poori ho gayi hai. Kripya hamari team se WhatsApp ya phone par connect karein."
                });
            }

            // Record user message
            session.messages.push({
                role: 'user',
                content: cleanMessage,
                timestamp: new Date()
            });
            session.messageCount += 1;
            session.lastMessageAt = new Date();

            // Process conversation turn
            const result = await processAssistantMessage(session, cleanMessage, { AIConfig, AIAuditLog });

            // Record assistant reply
            session.messages.push({
                role: 'assistant',
                content: result.reply,
                timestamp: new Date(),
                quickReplies: result.quickReplies || []
            });
            session.messageCount += 1;

            // Check if ready to submit lead automatically from consent
            let leadCreated = null;
            if (result.shouldSubmitLead) {
                leadCreated = await submitLeadFromSession(session, { Enquiry, HotelPartner, QRRecord });
                if (leadCreated) {
                    session.leadId = leadCreated._id;
                    session.submittedAt = new Date();
                    session.status = AI_ASSISTANT_STATES.COMPLETED;
                    result.reply = `Dhanyawad 🙏 **${session.requirementState?.customerName || ''}** ji!\n\nAapki trip enquiry Kashi-Vashi team ko safaltapoorvak bhej di gayi hai.\n\n**Trip Overview:**\n• Guests: ${session.requirementState?.totalGuests || 'N/A'}\n• Duration: ${session.requirementState?.duration || 'N/A'}\n• Travel: ${session.requirementState?.travelWindow || session.requirementState?.travelStartDate || 'Flexible'}\n\nHamare travel expert aapse jaldi hi contact karenge.`;
                    result.quickReplies = ["WhatsApp Team", "Plan Another Trip"];
                }
            }

            await session.save();

            return res.status(200).json({
                success: true,
                sessionId: session.sessionId,
                conversationId: session.conversationId,
                status: session.status,
                reply: result.reply,
                quickReplies: result.quickReplies || [],
                requirementState: session.requirementState,
                serviceInterests: session.serviceInterests,
                readyForConfirmation: result.readyForConfirmation || false,
                humanHandoffRequired: result.humanHandoffRequired || false,
                escalationReason: result.escalationReason || null,
                leadId: session.leadId
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 3. CONFIRM & SUBMIT LEAD (POST /public/ai/assistant/confirm)
    // -------------------------------------------------------------
    app.post('/public/ai/assistant/confirm', assistantLimiter, async (req, res) => {
        try {
            const { sessionId, name, phone, email, consentGiven } = req.body || {};

            if (!sessionId) {
                return res.status(400).json({ success: false, message: "Session ID is required." });
            }

            const session = await AIAssistantSession.findOne({ sessionId });
            if (!session) {
                return res.status(404).json({ success: false, message: "Session not found." });
            }

            // Deduplication Check (Rule 22)
            if (session.leadId) {
                return res.status(200).json({
                    success: true,
                    message: "Aapki requirement pehle hi submit ho chuki hai.",
                    leadId: session.leadId,
                    duplicate: true
                });
            }

            // Check if an existing lead already has this conversationId
            const existingLead = await Enquiry.findOne({ aiConversationId: session.conversationId });
            if (existingLead) {
                session.leadId = existingLead._id;
                session.status = AI_ASSISTANT_STATES.COMPLETED;
                await session.save();
                return res.status(200).json({
                    success: true,
                    message: "Aapki requirement pehle hi submit ho chuki hai.",
                    leadId: existingLead._id,
                    duplicate: true
                });
            }

            // Update contact details if provided
            session.requirementState = session.requirementState || {};
            if (name) session.requirementState.customerName = String(name).trim();
            if (phone) session.requirementState.phone = String(phone).replace(/\D/g, '');
            if (email) session.requirementState.email = String(email).trim().toLowerCase();

            // Validate phone
            const cleanPhone = String(session.requirementState.phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length < 10) {
                return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required." });
            }

            // Consent check
            if (consentGiven !== false) {
                session.consentGiven = true;
                session.consentTimestamp = new Date();
            }

            // Submit lead to CRM
            const lead = await submitLeadFromSession(session, { Enquiry, HotelPartner, QRRecord });
            session.leadId = lead._id;
            session.submittedAt = new Date();
            session.status = AI_ASSISTANT_STATES.COMPLETED;
            await session.save();

            // Audit
            await recordAuditEvent(AIAuditLog, {
                runId: `ASST-${sessionId}`,
                userId: session._id,
                actorRole: 'ANONYMOUS_PUBLIC',
                module: AI_MODULES.CUSTOMER_ASSISTANT,
                action: 'AI_LEAD_SUBMITTED',
                decision: AI_AUDIT_DECISIONS.ALLOWED,
                reason: 'Customer requirement confirmed and lead created',
                targetType: 'lead',
                targetId: String(lead._id),
                riskLevel: AI_RISK_LEVELS.LOW,
                metadata: { source: session.attribution.source, leadId: lead._id }
            });

            return res.status(200).json({
                success: true,
                message: "Aapki trip requirement Kashi-Vashi team ko bhej di gayi hai.",
                leadId: lead._id,
                conversationId: session.conversationId,
                status: session.status
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 4. GET SESSION DETAILS (GET /public/ai/assistant/session/:id)
    // -------------------------------------------------------------
    app.get('/public/ai/assistant/session/:id', async (req, res) => {
        try {
            const session = await AIAssistantSession.findOne({ sessionId: req.params.id });
            if (!session) {
                return res.status(404).json({ success: false, message: "Session not found." });
            }

            return res.status(200).json({
                success: true,
                session: {
                    sessionId: session.sessionId,
                    conversationId: session.conversationId,
                    status: session.status,
                    attribution: session.attribution,
                    requirementState: session.requirementState,
                    serviceInterests: session.serviceInterests,
                    messages: session.messages,
                    readyForConfirmation: session.readyForConfirmation,
                    humanHandoffRequired: session.humanHandoffRequired,
                    escalationReason: session.escalationReason,
                    leadId: session.leadId,
                    createdAt: session.createdAt
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });

    // -------------------------------------------------------------
    // 5. CEO / MANAGER METRICS (GET /admin/ai/assistant/metrics)
    // -------------------------------------------------------------
    app.get('/admin/ai/assistant/metrics', authenticateToken, requireRole('CEO', 'MANAGER'), async (req, res) => {
        try {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const [
                sessionsToday,
                totalSessions,
                completedSessions,
                handoffSessions,
                leadsCreated
            ] = await Promise.all([
                AIAssistantSession.countDocuments({ createdAt: { $gte: startOfToday } }),
                AIAssistantSession.countDocuments({}),
                AIAssistantSession.countDocuments({ status: AI_ASSISTANT_STATES.COMPLETED }),
                AIAssistantSession.countDocuments({ humanHandoffRequired: true }),
                AIAssistantSession.countDocuments({ leadId: { $ne: null } })
            ]);

            const conversionRate = totalSessions > 0 ? ((leadsCreated / totalSessions) * 100).toFixed(1) : '0.0';

            return res.status(200).json({
                success: true,
                metrics: {
                    sessionsToday,
                    totalSessions,
                    completedRequirements: completedSessions,
                    handoffs: handoffSessions,
                    leadsCreated,
                    conversionRate: `${conversionRate}%`
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    });
}

/**
 * Helper: Submits confirmed AI requirement into the CRM Enquiry model,
 * strictly preserving attribution (AREA_QR, HOTEL_QR, WEBSITE).
 */
async function submitLeadFromSession(session, { Enquiry, HotelPartner, QRRecord }) {
    const req = session.requirementState || {};
    const attr = session.attribution || {};

    const cleanPhone = String(req.phone || '').replace(/\D/g, '');
    const cleanEmail = req.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email) ? req.email : 'offline-client@banarasyatra.com';

    // Verify source & attribution
    let source = attr.source || 'WEBSITE';
    let partnerId = attr.partnerId || null;
    let partnerName = '';
    let qrId = attr.qrId || null;
    let areaId = attr.areaId || null;
    let areaName = '';
    let qrType = attr.qrType || '';
    let qrAttribution = null;

    if (source === 'HOTEL_QR' && partnerId && HotelPartner) {
        const partner = await HotelPartner.findOne({ partnerCode: partnerId });
        if (partner) {
            partnerName = partner.name;
        }
    }

    if (source === 'AREA_QR' && qrId && QRRecord) {
        const qrDoc = await QRRecord.findOne({ qrId: String(qrId).toUpperCase() });
        if (qrDoc) {
            areaId = String(qrDoc.areaId);
            areaName = qrDoc.areaName;
            qrType = qrDoc.qrType;
            qrAttribution = {
                qrId: qrDoc.qrId,
                areaId: String(qrDoc.areaId),
                areaName: qrDoc.areaName,
                qrType: qrDoc.qrType
            };
            await QRRecord.updateOne({ qrId: qrDoc.qrId }, { $inc: { leadCount: 1 } });
        }
    }

    // Requirements mapping
    const reqObj = {
        hotel: req.hotelRequired || false,
        darshan: req.darshanRequired || false,
        boat: req.boatRequired || false,
        transport: req.transportRequired || false,
        pandit: req.panditRequired || false,
        guide: req.guideRequired || false,
        shopping: req.shoppingRequired || false,
        package: req.packageRequired || false
    };

    const summaryText = buildRequirementSummary(req, session.serviceInterests || []);

    const newLead = new Enquiry({
        name: req.customerName || 'AI Guest',
        mobile: cleanPhone,
        email: cleanEmail,
        pickup: req.origin || 'Varanasi',
        destination: 'Varanasi',
        date: req.travelWindow || req.travelStartDate || 'Flexible',
        travelers: req.totalGuests ? `${req.totalGuests} Guests` : '2 Adults',
        tripDuration: req.duration || '3 Days',
        specialRequirements: summaryText,
        requirements: reqObj,
        city: req.origin || '',

        // Preserved Acquisition Attribution
        source,
        leadSource: (source === 'HOTEL_QR' || source === 'AREA_QR') ? 'QR' : 'Website',
        partnerId,
        partnerName,
        qrId,
        areaId,
        areaName,
        qrType,
        qrAttribution,

        // Additive AI Metadata
        aiAssisted: true,
        aiConversationId: session.conversationId,
        aiRequirementSummary: summaryText,
        aiDetectedIntent: req.tripIntent || 'Kashi-Vashi',
        aiServiceInterests: session.serviceInterests || [],
        aiInteraction: {
            sessionId: session.sessionId,
            conversationId: session.conversationId,
            messageCount: session.messageCount,
            budget: req.budget || '',
            accommodationPreference: req.accommodationPreference || '',
            consentGiven: session.consentGiven
        },

        capturedAt: new Date(),
        createdBy: `AI Customer Assistant (${source})`,
        stage: 'NEW',
        status: 'Pending',
        activityHistory: [{
            timestamp: new Date().toISOString(),
            action: 'AI_ASSISTED_LEAD_CREATED',
            actor: 'AI Customer Assistant',
            details: `Lead qualified via AI Customer Assistant with ${source} attribution. Summary: ${req.totalGuests || 0} guests, ${req.duration || 'N/A'}`
        }],
        statusHistory: [{
            previousStatus: 'None',
            newStatus: 'Pending',
            updatedBy: 'AI Assistant',
            updatedTime: new Date().toISOString(),
            remarks: `Qualified via AI Customer Assistant`
        }]
    });

    await newLead.save();
    return newLead;
}

module.exports = {
    registerCustomerAssistantRoutes
};

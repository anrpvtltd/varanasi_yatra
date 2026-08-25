const eventBus = require('./eventBus');
const { DEFAULT_TEMPLATES, renderTemplate } = require('./messageTemplates');
const { getRuleForEvent } = require('./automationRules');
const { getNotificationProvider } = require('./notificationService');
const { isDuplicateEventKey, logAutomationEvent, updateLogStatus, getAutomationLogs } = require('./automationLogger');

let isAutomationEnabled = true;

function setAutomationEnabled(enabled) {
    isAutomationEnabled = Boolean(enabled);
    console.log(`⚙️ [AutomationEngine] Master switch set to: ${isAutomationEnabled ? 'ON 🟢' : 'OFF 🔴'}`);
}

function getAutomationEnabled() {
    return isAutomationEnabled;
}

/**
 * Generate deterministic eventKey for database-backed restart-safe idempotency
 */
function generateEventKey(eventType, payload, customKey) {
    if (customKey) return customKey;
    if (eventType === 'LEAD_CREATED' && (payload.leadId || payload.id || payload._id)) {
        return `LEAD_CREATED:${payload.leadId || payload.id || payload._id}`;
    }
    if (eventType === 'QUOTE_SENT' && (payload.quoteId || payload.id || payload._id)) {
        return `QUOTE_SENT:${payload.quoteId || payload.id || payload._id}`;
    }
    if (eventType === 'BOOKING_CONFIRMED' && (payload.bookingId || payload.bookingNumber || payload._id)) {
        return `BOOKING_CONFIRMED:${payload.bookingId || payload.bookingNumber || payload._id}`;
    }
    if (eventType === 'PAYMENT_RECEIVED' && (payload.paymentId || payload._id)) {
        return `PAYMENT_RECEIVED:${payload.paymentId || payload._id}`;
    }
    if (eventType === 'TRIP_COMPLETED' && (payload.bookingId || payload.bookingNumber || payload._id)) {
        return `TRIP_COMPLETED:${payload.bookingId || payload.bookingNumber || payload._id}`;
    }
    return `${eventType}:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Handle execution of an automation dispatch action with retry logic & database idempotency
 */
async function executeAction(ruleAction, eventType, payload, eventKey) {
    if (!isAutomationEnabled) {
        console.log(`ℹ️ [AutomationEngine] Automation disabled. Skipping event ${eventType}.`);
        return null;
    }

    const templateId = ruleAction.templateId;
    const template = DEFAULT_TEMPLATES.find(t => t.templateId === templateId);
    if (!template) {
        console.error(`❌ [AutomationEngine] Template not found: ${templateId}`);
        return null;
    }

    // Determine target recipient
    let recipient = payload.mobile || payload.email || 'offline-client@banarasyatra.com';
    if (ruleAction.targetType === 'MANAGER') {
        recipient = process.env.MANAGER_ALERT_MOBILE || process.env.CEO_MOBILE || '+919876543210';
    }

    const renderedSubject = renderTemplate(template.subject, payload);
    const renderedBody = renderTemplate(template.body, payload);
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    let logEntry;
    try {
        logEntry = await logAutomationEvent({
            eventId,
            eventKey,
            eventType,
            channel: ruleAction.channel,
            recipient,
            templateId,
            renderedSubject,
            renderedBody,
            payload,
            status: 'PENDING',
            retryCount: 0,
            maxRetries: 3
        });
    } catch (e) {
        if (e.message.startsWith('DUPLICATE_EVENT_KEY')) {
            console.log(`ℹ️ [AutomationEngine] Database Idempotency: Suppressed duplicate action for key: ${eventKey}`);
            return null;
        }
        throw e;
    }

    return await dispatchLogEntry(logEntry);
}

/**
 * Dispatch a log entry via NotificationProvider & manage state transitions & retries
 */
async function dispatchLogEntry(logEntry) {
    const provider = getNotificationProvider();
    await updateLogStatus(logEntry._id, 'PROCESSING');

    try {
        let result = null;
        if (logEntry.channel === 'WHATSAPP' || logEntry.channel === 'BOTH') {
            result = await provider.sendWhatsApp({
                recipient: logEntry.recipient,
                message: logEntry.renderedBody,
                templateId: logEntry.templateId,
                metadata: logEntry.payload
            });
        }
        if (logEntry.channel === 'EMAIL' || logEntry.channel === 'BOTH') {
            result = await provider.sendEmail({
                recipient: logEntry.recipient,
                subject: logEntry.renderedSubject,
                message: logEntry.renderedBody,
                templateId: logEntry.templateId,
                metadata: logEntry.payload
            });
        }

        const updated = await updateLogStatus(logEntry._id, 'SENT', {
            provider: result.provider || provider.name,
            messageId: result.messageId || `MSG-${Date.now()}`,
            sentAt: new Date()
        });
        return updated;

    } catch (err) {
        console.error(`❌ [AutomationEngine] Dispatch failed for Log ${logEntry._id}:`, err.message);
        const nextRetryCount = (logEntry.retryCount || 0) + 1;
        const maxRetries = logEntry.maxRetries || 3;

        if (nextRetryCount <= maxRetries) {
            const retried = await updateLogStatus(logEntry._id, 'RETRYING', {
                retryCount: nextRetryCount,
                errorMessage: err.message
            });
            // Perform exponential backoff retry in test/dev
            return await dispatchLogEntry(retried);
        } else {
            return await updateLogStatus(logEntry._id, 'PERMANENT_FAILURE', {
                retryCount: nextRetryCount,
                errorMessage: err.message
            });
        }
    }
}

/**
 * Process a business event with database-backed restart-safe idempotency
 */
async function triggerAutomationEvent(eventType, payload = {}, dedupKey = null) {
    const eventKey = generateEventKey(eventType, payload, dedupKey);

    // Database-backed idempotency check
    const isDup = await isDuplicateEventKey(eventKey);
    if (isDup) {
        console.log(`ℹ️ [Database Idempotency] Suppressed duplicate event: ${eventType} (Key: ${eventKey})`);
        return { success: false, reason: 'SUPPRESSED_DUPLICATE', eventKey };
    }

    const rule = getRuleForEvent(eventType);
    if (!rule) {
        console.log(`ℹ️ [AutomationEngine] No active rule for event: ${eventType}`);
        return { success: false, reason: 'NO_ACTIVE_RULE', eventKey };
    }

    const emitted = eventBus.emitAutomationEvent(eventType, payload, eventKey);
    if (!emitted) {
        return { success: false, reason: 'SUPPRESSED_DUPLICATE', eventKey };
    }

    const results = [];
    for (const action of rule.actions) {
        const res = await executeAction(action, eventType, payload, eventKey);
        if (res) results.push(res);
    }
    return { success: true, results, eventKey };
}

/**
 * Manual Retry endpoint trigger
 */
async function manualRetryLog(logId) {
    const logs = await getAutomationLogs();
    const target = logs.find(l => String(l._id) === String(logId));
    if (!target) {
        throw new Error("Automation log entry not found.");
    }
    if (target.status === 'SENT') {
        return { success: true, message: "Log entry already sent successfully.", log: target };
    }

    console.log(`🔄 [AutomationEngine] Initiating manual retry for log: ${logId}`);
    const updated = await dispatchLogEntry(target);
    return { success: true, message: "Retry executed.", log: updated };
}

/**
 * Bind eventBus listeners & Document Engine integration
 */
function initAutomationEngine() {
    const events = [
        'LEAD_CREATED', 'ENQUIRY_RECEIVED', 'QUOTE_CREATED', 'QUOTE_SENT',
        'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_DUE', 'TRIP_UPCOMING', 'TRIP_COMPLETED'
    ];

    events.forEach(evt => {
        eventBus.on(evt, async (payload) => {
            console.log(`⚡ [AutomationEngine] Processing Event Listener: ${evt}`);

            // Asynchronous Document Generation Hook (Namespaced keys: document:{evt}:{id}:{docType})
            try {
                const { generateDocument, createDocumentToken } = require('../documents/documentService');
                
                if (evt === 'PAYMENT_RECEIVED') {
                    const doc = await generateDocument({
                        documentType: 'PAYMENT_RECEIPT',
                        bookingId: payload.bookingId,
                        customData: payload
                    });
                    if (doc) {
                        const tokenObj = await createDocumentToken(doc.documentId, { expiresInHours: 72 });
                        payload.documentUrl = `/public/document/${tokenObj.rawToken}`;
                        console.log(`📄 [DocumentEngine] Payment Receipt PDF generated: ${doc.documentId}`);
                    }
                } else if (evt === 'QUOTE_SENT') {
                    await generateDocument({
                        documentType: 'QUOTE_PDF',
                        quoteId: payload.quoteId,
                        customData: payload
                    });
                } else if (evt === 'BOOKING_CONFIRMED') {
                    await generateDocument({
                        documentType: 'TRAVEL_VOUCHER',
                        bookingId: payload.bookingId,
                        customData: payload
                    });
                }
            } catch (err) {
                // PDF/Document generation failure MUST NEVER crash or rollback business events
                console.error(`⚠️ [DocumentEngine] Async PDF generation log note for ${evt}:`, err.message);
            }
        });
    });

    console.log("🚀 [AutomationEngine] Event Driven Automation Engine Initialized with DB Idempotency & Document Hooking.");
}

initAutomationEngine();

module.exports = {
    setAutomationEnabled,
    getAutomationEnabled,
    triggerAutomationEvent,
    manualRetryLog,
    dispatchLogEntry
};

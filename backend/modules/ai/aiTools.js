/**
 * AI Tool Registry & Allowlist
 * Varanasi Yatra Platform — Prompt 5
 * 
 * Invariants:
 * 1. Isolated from MongoDB directly.
 * 2. Every tool specifies: name, module, permission, scope, riskLevel, safeModeAllowed, enabled, description, execute.
 * 3. Hunter tools strictly DISABLED in Prompt 5 (enabled: false).
 * 4. Mutation/write tools strictly blocked in Safe Mode (safeModeAllowed: false).
 */

const { AI_MODULES, AI_RISK_LEVELS } = require('./aiConstants');

const AI_TOOLS_REGISTRY = {
    // -------------------------------------------------------------
    // LOW RISK — Read-Only Tools (Allowed in Safe Mode)
    // -------------------------------------------------------------
    'crm.getLead': {
        name: 'crm.getLead',
        module: AI_MODULES.CUSTOMER_ASSISTANT,
        permission: 'LEADS_VIEW',
        scope: 'LEAD_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Fetches authorized lead details by lead ID or phone with financial cost sanitization.',
        execute: async (input, context, { Enquiry }) => {
            const { leadId, phone } = input;
            const query = {};
            if (leadId) query._id = leadId;
            else if (phone) query.phone = phone;
            else throw new Error('leadId or phone is required');

            const lead = await Enquiry.findOne(query);
            if (!lead) return { found: false, lead: null };

            const sanitized = lead.toObject ? lead.toObject() : { ...lead };
            
            // Financial Privacy Guard: Strip internal margin/vendor notes for non-CEO
            if (context.role !== 'CEO') {
                delete sanitized.vendorCost;
                delete sanitized.companyMargin;
                delete sanitized.expectedProfit;
                delete sanitized.ceoNotes;
            }

            return { found: true, lead: sanitized };
        }
    },

    'crm.getCustomer': {
        name: 'crm.getCustomer',
        module: AI_MODULES.CUSTOMER_ASSISTANT,
        permission: 'CUSTOMERS_VIEW',
        scope: 'CUSTOMER_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Fetches basic customer profile by customer ID or phone.',
        execute: async (input, context, { Customer, Enquiry }) => {
            const { customerId, phone } = input;
            if (!customerId && !phone) throw new Error('customerId or phone is required');

            let customer = null;
            if (Customer) {
                customer = await Customer.findOne(customerId ? { _id: customerId } : { phone });
            }
            if (!customer && Enquiry) {
                const lead = await Enquiry.findOne(customerId ? { _id: customerId } : { phone });
                if (lead) {
                    customer = {
                        name: lead.name,
                        phone: lead.phone,
                        email: lead.email,
                        city: lead.city,
                        requirement: lead.requirement
                    };
                }
            }

            return { found: !!customer, customer };
        }
    },

    'crm.getBooking': {
        name: 'crm.getBooking',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'BOOKINGS_VIEW',
        scope: 'BOOKING_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Fetches booking itinerary and travel dates by booking ID with financial shielding.',
        execute: async (input, context, { Booking }) => {
            const { bookingId, bookingNumber } = input;
            const query = {};
            if (bookingId) query._id = bookingId;
            else if (bookingNumber) query.bookingNumber = bookingNumber;
            else throw new Error('bookingId or bookingNumber is required');

            const bkg = await Booking.findOne(query);
            if (!bkg) return { found: false, booking: null };

            const sanitized = bkg.toObject ? bkg.toObject() : { ...bkg };
            if (context.role !== 'CEO') {
                delete sanitized.vendorCost;
                delete sanitized.vendorPaymentSummary;
                delete sanitized.expectedProfit;
                delete sanitized.realizedProfit;
                delete sanitized.companyMargin;
                delete sanitized.margin;
                delete sanitized.ceoNotes;
                if (Array.isArray(sanitized.services)) {
                    sanitized.services = sanitized.services.map(s => {
                        const copy = { ...s };
                        delete copy.vendorCost;
                        delete copy.referenceCost;
                        return copy;
                    });
                }
            }

            return { found: true, booking: sanitized };
        }
    },

    'crm.getQuote': {
        name: 'crm.getQuote',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'QUOTES_VIEW',
        scope: 'QUOTE_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Fetches customer package quote details by quote ID.',
        execute: async (input, context, { Quote }) => {
            if (!Quote) return { found: false, message: 'Quote collection not available' };
            const quote = await Quote.findById(input.quoteId);
            if (!quote) return { found: false, quote: null };

            const sanitized = quote.toObject ? quote.toObject() : { ...quote };
            if (context.role !== 'CEO') {
                delete sanitized.vendorCost;
                delete sanitized.expectedProfit;
                delete sanitized.margin;
            }
            return { found: true, quote: sanitized };
        }
    },

    'crm.getTrip': {
        name: 'crm.getTrip',
        module: AI_MODULES.CUSTOMER_ASSISTANT,
        permission: 'TRIPS_VIEW',
        scope: 'TRIP_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Retrieves trip coordination checklist and day-wise schedule.',
        execute: async (input, context, { Booking }) => {
            const bkg = await Booking.findById(input.tripId || input.bookingId);
            if (!bkg) return { found: false, trip: null };
            return {
                found: true,
                trip: {
                    bookingNumber: bkg.bookingNumber,
                    customerDetails: bkg.customerDetails,
                    travelDetails: bkg.travelDetails,
                    itinerary: bkg.itinerary,
                    tripStatus: bkg.tripStatus,
                    readiness: bkg.readiness
                }
            };
        }
    },

    'crm.getSalesLeadContext': {
        name: 'crm.getSalesLeadContext',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'LEADS_VIEW',
        scope: 'LEAD_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Fetches authorized customer requirements, communications, and quotes with proprietary financial data scrubbed for non-CEO roles.',
        execute: async (input, context, { Enquiry, Quote }) => {
            const { leadId } = input;
            if (!leadId) throw new Error('leadId is required');

            const lead = await Enquiry.findById(leadId);
            if (!lead) return { found: false, lead: null };

            const role = (context.role || '').toUpperCase();
            const userId = String(context.userId || '');

            // Enforce Scope: Team Leader & Team Member cannot view out-of-scope leads
            if (role === 'TEAM_MEMBER' && lead.assignedTo && String(lead.assignedTo) !== userId) {
                const err = new Error('Access denied: Lead not assigned to requesting team member');
                err.code = 'SCOPE_DENIED';
                throw err;
            }
            if (role === 'TEAM_LEADER' && lead.teamLeaderId && String(lead.teamLeaderId) !== userId && lead.assignedTo && String(lead.assignedTo) !== userId) {
                const err = new Error('Access denied: Lead outside team leader scope');
                err.code = 'SCOPE_DENIED';
                throw err;
            }

            const sanitized = lead.toObject ? lead.toObject() : { ...lead };
            
            // Financial Privacy Guard: Non-CEO users must NEVER see internal cost/margins
            if (role !== 'CEO') {
                delete sanitized.vendorCost;
                delete sanitized.companyMargin;
                delete sanitized.expectedProfit;
                delete sanitized.realizedProfit;
                delete sanitized.margin;
                delete sanitized.ceoNotes;
            }

            let quotes = [];
            if (Quote) {
                const rawQuotes = await Quote.find({ leadId });
                quotes = rawQuotes.map(q => {
                    const qObj = q.toObject ? q.toObject() : { ...q };
                    if (role !== 'CEO') {
                        delete qObj.vendorCost;
                        delete qObj.expectedProfit;
                        delete qObj.margin;
                    }
                    return qObj;
                });
            }

            return {
                found: true,
                lead: sanitized,
                quotes,
                requirementSummary: sanitized.aiRequirementSummary || sanitized.specialRequirements || ''
            };
        }
    },

    // -------------------------------------------------------------
    // MEDIUM & HIGH RISK — Write/Contact Tools (BLOCKED in Safe Mode)
    // -------------------------------------------------------------
    'crm.generateCustomerMessage': {
        name: 'crm.generateCustomerMessage',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'COMMUNICATION_CREATE',
        scope: 'COMMUNICATION_WRITE',
        riskLevel: AI_RISK_LEVELS.HIGH,
        safeModeAllowed: true, // Draft generation permitted in Safe Mode!
        enabled: true,
        description: 'Generates a draft customer follow-up or objection response for human review. Does NOT send.',
        execute: async (input) => {
            const { customerName = 'Guest', actionType = 'FOLLOW_UP', channel = 'WHATSAPP' } = input;
            return {
                draftOnly: true,
                requiresHumanApproval: true,
                channel,
                actionType,
                draftContent: `Namaste ${customerName} Ji! Kashi-Vashi team ki taraf se pranam...`
            };
        }
    },

    'crm.applyQuoteSuggestion': {
        name: 'crm.applyQuoteSuggestion',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'QUOTES_CREATE',
        scope: 'QUOTE_WRITE',
        riskLevel: AI_RISK_LEVELS.HIGH,
        safeModeAllowed: false, // Blocked in Safe Mode
        enabled: true,
        description: 'Applies AI suggested line items to a draft quote. (Requires Human Action in Quote Builder).',
        execute: async () => {
            throw new Error('crm.applyQuoteSuggestion requires human approval and QuoteBuilder execution');
        }
    },

    'crm.updateLead': {
        name: 'crm.updateLead',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'LEADS_EDIT',
        scope: 'LEAD_WRITE',
        riskLevel: AI_RISK_LEVELS.MEDIUM,
        safeModeAllowed: false, // Disallowed in Safe Mode
        enabled: true,
        description: 'Updates lead qualification tags or travel window.',
        execute: async () => {
            throw new Error('crm.updateLead requires human approval in Prompt 5');
        }
    },

    'crm.createLead': {
        name: 'crm.createLead',
        module: AI_MODULES.CUSTOMER_ASSISTANT,
        permission: 'LEADS_CREATE',
        scope: 'LEAD_WRITE',
        riskLevel: AI_RISK_LEVELS.HIGH,
        safeModeAllowed: false,
        enabled: true,
        description: 'Creates a new CRM lead. (Blocked in Safe Mode; Requires Human Approval).',
        execute: async () => {
            throw new Error('crm.createLead is blocked by Safe Mode policy');
        }
    },

    'crm.sendCustomerMessage': {
        name: 'crm.sendCustomerMessage',
        module: AI_MODULES.CUSTOMER_ASSISTANT,
        permission: 'COMMUNICATION_CREATE',
        scope: 'COMMUNICATION_WRITE',
        riskLevel: AI_RISK_LEVELS.HIGH,
        safeModeAllowed: false,
        enabled: true,
        description: 'Sends message to customer. (Blocked in Safe Mode; Prohibited in Prompt 5).',
        execute: async () => {
            throw new Error('crm.sendCustomerMessage is blocked by Safe Mode policy');
        }
    },

    'crm.createBooking': {
        name: 'crm.createBooking',
        module: AI_MODULES.SALES_ASSISTANT,
        permission: 'BOOKINGS_CREATE',
        scope: 'BOOKING_WRITE',
        riskLevel: AI_RISK_LEVELS.CRITICAL,
        safeModeAllowed: false,
        enabled: true,
        description: 'Creates a booking reservation. (Critical Action: Prohibited from automated execution).',
        execute: async () => {
            throw new Error('crm.createBooking is blocked by Safe Mode policy');
        }
    },

    'crm.modifyFinancialData': {
        name: 'crm.modifyFinancialData',
        module: AI_MODULES.SYSTEM_ANALYSIS,
        permission: 'FINANCIALS_MANAGE',
        scope: 'FINANCIAL_WRITE',
        riskLevel: AI_RISK_LEVELS.CRITICAL,
        safeModeAllowed: false,
        enabled: true,
        description: 'Modifies pricing, costs or balances. (Critical Action: Prohibited from automated execution).',
        execute: async () => {
            throw new Error('crm.modifyFinancialData is blocked by Safe Mode policy');
        }
    },

    // -------------------------------------------------------------
    // AI CUSTOMER HUNTER TOOLS (Prompt 8)
    // -------------------------------------------------------------
    'hunter.fetchSignals': {
        name: 'hunter.fetchSignals',
        module: AI_MODULES.CUSTOMER_HUNTER,
        permission: 'AI_MANAGE',
        scope: 'HUNTER_READ',
        riskLevel: AI_RISK_LEVELS.MEDIUM,
        safeModeAllowed: true,
        enabled: true,
        description: 'Fetches raw public signals from authorized sources.',
        execute: async (_input, _context) => {
            const { getMockSignals } = require('./hunter/hunterService');
            return { success: true, signals: getMockSignals() };
        }
    },

    'hunter.detectIntent': {
        name: 'hunter.detectIntent',
        module: AI_MODULES.CUSTOMER_HUNTER,
        permission: 'AI_MANAGE',
        scope: 'HUNTER_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Classifies detected intent into local or outside travel categories.',
        execute: async (input, _context) => {
            const { detectIntent, normalizeSignal } = require('./hunter/hunterService');
            const norm = normalizeSignal(input, 'TOOL_CALL', 'MOCK');
            const result = detectIntent(norm);
            return { success: true, ...result };
        }
    },

    'hunter.qualifySignal': {
        name: 'hunter.qualifySignal',
        module: AI_MODULES.CUSTOMER_HUNTER,
        permission: 'AI_MANAGE',
        scope: 'HUNTER_READ',
        riskLevel: AI_RISK_LEVELS.LOW,
        safeModeAllowed: true,
        enabled: true,
        description: 'Scores opportunity quality and returns transparent business reasons.',
        execute: async (input, _context) => {
            const { qualifyOpportunity, normalizeSignal, detectIntent } = require('./hunter/hunterService');
            const norm = normalizeSignal(input, 'TOOL_CALL', 'MOCK');
            const intentData = detectIntent(norm);
            const qual = qualifyOpportunity(norm, intentData);
            return { success: true, ...qual };
        }
    },

    'hunter.createOpportunity': {
        name: 'hunter.createOpportunity',
        module: AI_MODULES.CUSTOMER_HUNTER,
        permission: 'AI_MANAGE',
        scope: 'HUNTER_WRITE',
        riskLevel: AI_RISK_LEVELS.HIGH,
        safeModeAllowed: false,
        enabled: true,
        description: 'Logs qualified opportunity into human review queue (Blocked in Safe Mode).',
        execute: async (input, context, { AIOpportunity }) => {
            if (!AIOpportunity) throw new Error('AIOpportunity model unavailable');
            const opp = new AIOpportunity(input);
            await opp.save();
            return { success: true, opportunityId: opp.opportunityId };
        }
    },

    'hunter.approveOpportunity': {
        name: 'hunter.approveOpportunity',
        module: AI_MODULES.CUSTOMER_HUNTER,
        permission: 'AI_MANAGE',
        scope: 'HUNTER_WRITE',
        riskLevel: AI_RISK_LEVELS.HIGH,
        safeModeAllowed: false,
        enabled: true,
        description: 'Human approval action for verified opportunity (Requires human authenticated actor).',
        execute: async (input, context, models) => {
            const { approveOpportunity } = require('./hunter/hunterService');
            const opp = await approveOpportunity(input.opportunityId, models, context.user);
            return { success: true, opportunityId: opp.opportunityId, status: opp.status };
        }
    }
};

function getToolDefinition(toolName) {
    return AI_TOOLS_REGISTRY[toolName] || null;
}

function getAllTools() {
    return Object.values(AI_TOOLS_REGISTRY);
}

function getAllowedToolsForModule(moduleName) {
    return Object.values(AI_TOOLS_REGISTRY).filter(t => t.module === moduleName && t.enabled);
}

function isToolAllowedInSafeMode(toolName) {
    const tool = getToolDefinition(toolName);
    return Boolean(tool && tool.safeModeAllowed);
}

module.exports = {
    AI_TOOLS_REGISTRY,
    getToolDefinition,
    getAITool: getToolDefinition,
    isToolAllowedInSafeMode,
    getAllTools,
    getAllowedToolsForModule
};

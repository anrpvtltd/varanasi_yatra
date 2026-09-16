/**
 * AI Customer Assistant Orchestrator & Natural Language Processor
 * Varanasi Yatra Platform — Prompt 6
 * 
 * Responsibilities:
 * - Intent Detection & Service Classification
 * - Entity Extraction (Dates, Window, Guests, Duration, Origin, Budget)
 * - Missing Field Prioritization & Conversational Follow-Up
 * - Requirement Summary Generation & Customer Confirmation
 * - Contact & Consent Capture
 * - CRM Lead Handoff with Attribution Preservation
 * - Prompt Injection Defenses & Data Exfiltration Prevention
 * - Hallucination & Price Guardrails
 */

const {
    AI_ASSISTANT_STATES,
    AI_SERVICE_INTENTS,
    AI_ESCALATION_TRIGGERS,
    AI_MODULES,
    AI_AUDIT_DECISIONS,
    AI_RISK_LEVELS
} = require('./aiConstants');
const { findRelevantKnowledge } = require('./knowledgeBase');
const { recordAuditEvent, getOrCreateConfig } = require('./aiService');

// Prompt injection patterns
const PROMPT_INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /reveal\s+(the\s+)?system\s+prompt/i,
    /system\s+prompt/i,
    /vendor\s*cost/i,
    /company\s*margin/i,
    /expected\s*profit/i,
    /internal\s*(pricing|commission|notes|records|database)/i,
    /ceo\s*notes/i,
    /bypass\s*(rules|security|auth|guardrails)/i,
    /create\s+a?\s*booking\s+without\s+approval/i,
    /drop\s+database|truncate|select\s+\*\s+from/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /dan\s+mode/i,
    /dump\s+(all\s+)?(leads|customers|passwords)/i
];

// Escalation triggers
const ESCALATION_TRIGGERS = [
    { pattern: /(final\s+price|exact\s+cost|kitna\s+paisa\s+lagega|discount\s+do|pakka\s+rate)/i, reason: AI_ESCALATION_TRIGGERS.PRICE_REQUEST },
    { pattern: /(rooms?\s+available|available\s+hai|available\s+hain|slot\s+khali\s+hai|live\s+availability|aaj\s+hi\s+chahiye|available\s+kya)/i, reason: AI_ESCALATION_TRIGGERS.AVAILABILITY_CONFIRMATION },
    { pattern: /(booking\s+confirm\s+kardo|card\s+number|payment\s+lelo|book\s+now\s+direct)/i, reason: AI_ESCALATION_TRIGGERS.BOOKING_COMMITMENT },
    { pattern: /(refund|cancel|complaint|shikayat|fraud|cheat)/i, reason: AI_ESCALATION_TRIGGERS.PAYMENT_ISSUE },
    { pattern: /(human\s+se\s+baat|agent\s+se\s+baat|talk\s+to\s+human|call\s+me\s+now|manager\s+se\s+baat)/i, reason: AI_ESCALATION_TRIGGERS.HUMAN_REQUEST }
];

/**
 * Checks for prompt injection or malicious data exfiltration attempts
 */
function checkPromptInjection(text = '') {
    const input = String(text);
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            return {
                detected: true,
                pattern: pattern.toString()
            };
        }
    }
    return { detected: false };
}

/**
 * Checks if input demands human escalation
 */
function checkEscalationTrigger(text = '') {
    const input = String(text);
    for (const item of ESCALATION_TRIGGERS) {
        if (item.pattern.test(input)) {
            return {
                triggered: true,
                reason: item.reason
            };
        }
    }
    return { triggered: false, reason: null };
}

/**
 * Extracts services from natural language input
 */
function extractServices(text = '', currentServices = []) {
    const t = text.toLowerCase();
    const services = new Set(currentServices);

    if (/\b(hotel|room|rooms|stay|resort|dharamsala|rukna|thaharna|staying)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.HOTEL);
    }
    if (/\b(darshan|mandir|temple|vishwanath|kashi\s*vishwanath|aarti|ganga\s*aarti|kaal\s*bhairav|sankat\s*mochan)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.DARSHAN);
    }
    if (/\b(boat|boating|nao|shikara|cruise|bajra|subah\s*e\s*banaras|ganga\s*ride)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.BOAT);
    }
    if (/\b(transport|cab|cabs|taxi|car|gaadi|innova|dzire|tempo|pickup|drop|airport\s*pickup|railway\s*transfer)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.TRANSPORT);
    }
    if (/\b(pandit|purohit|pooja|puja|rudrabhishek|pind\s*daan|havan|shradh)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.PANDIT);
    }
    if (/\b(guide|guided\s*tour|heritage\s*walk|walking\s*tour)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.GUIDE);
    }
    if (/\b(shopping|saree|sari|banarasi\s*saree|silk|handloom)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.SHOPPING);
    }
    if (/\b(package|complete\s*package|full\s*trip|all\s*inclusive|pure\s*yatra|sab\s*kuchh)\b/i.test(t)) {
        services.add(AI_SERVICE_INTENTS.PACKAGE);
    }

    return Array.from(services);
}

/**
 * Extracts guest counts safely
 */
function extractGuests(text = '', currentState = {}) {
    const t = text.toLowerCase();
    let total = currentState.totalGuests || null;
    let adults = currentState.adults || null;
    let children = currentState.children || null;

    // "2 adults aur 1 child" / "3 adult 2 kids"
    const adultMatch = t.match(/(\d+)\s*(adult|bade|elder)/i);
    const childMatch = t.match(/(\d+)\s*(child|children|bachche|kid|kids)/i);

    if (adultMatch) adults = parseInt(adultMatch[1], 10);
    if (childMatch) children = parseInt(childMatch[1], 10);

    if (adults !== null || children !== null) {
        total = (adults || 0) + (children || 0);
    } else {
        // "4 log", "4 people", "4 persons", "total 7 log"
        const generalMatch = t.match(/(\d+)\s*(log|people|persons|members|pax|guest|guests)/i);
        if (generalMatch) {
            total = parseInt(generalMatch[1], 10);
        } else {
            // "hum 4 log hain"
            const humMatch = t.match(/hum\s*(\d+)/i);
            if (humMatch) {
                total = parseInt(humMatch[1], 10);
            }
        }
    }

    // Single travelers: "akela", "solo"
    if (/\b(solo|akela|single)\b/i.test(t) && !total) {
        total = 1;
        adults = 1;
    }

    // Couple: "couple", "hum dono", "husband wife"
    if (/\b(couple|hum\s*dono|husband\s*wife)\b/i.test(t) && !total) {
        total = 2;
        adults = 2;
    }

    return { totalGuests: total, adults, children };
}

/**
 * Extracts date & travel window without fabricating exact dates
 */
function extractDatesAndWindow(text = '', currentState = {}) {
    const t = text.toLowerCase();
    let travelStartDate = currentState.travelStartDate || '';
    let travelEndDate = currentState.travelEndDate || '';
    let travelWindow = currentState.travelWindow || '';

    // Exact dates: "12-15 Nov", "12 to 15 November", "2026-11-12", "12/11/2026", "15 October"
    const dateRangeMatch = t.match(/(\d{1,2})\s*(?:to|-|se)\s*(\d{1,2})\s*([a-z]+|\d{4})?/i);
    if (dateRangeMatch) {
        const startDay = dateRangeMatch[1];
        const endDay = dateRangeMatch[2];
        const monthOrYear = dateRangeMatch[3] || '';
        travelWindow = `${startDay}–${endDay} ${monthOrYear}`.trim();
        travelStartDate = `${startDay} ${monthOrYear}`.trim();
        travelEndDate = `${endDay} ${monthOrYear}`.trim();
    } else {
        const singleDateMatch = t.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);
        if (singleDateMatch) {
            travelWindow = `${singleDateMatch[1]} ${singleDateMatch[2]}`;
            travelStartDate = travelWindow;
        }
    }

    // Approximate travel window patterns:
    if (!travelWindow) {
        if (/(next\s+month|agle\s+mahine)/i.test(t)) {
            travelWindow = 'Next Month';
        } else if (/(this\s+weekend|weekend|iss\s+weekend)/i.test(t)) {
            travelWindow = 'Upcoming Weekend';
        } else if (/(diwali|dev\s+deepawali|shivratri|huanuman\s+jayanti)/i.test(t)) {
            const festiveMatch = t.match(/(diwali|dev\s+deepawali|shivratri)/i);
            travelWindow = festiveMatch ? `${festiveMatch[0]} season` : 'Festive Season';
        } else if (/(second|first|third|fourth|last)\s+week\s+of\s+([a-z]+)/i.test(t)) {
            const m = t.match(/(second|first|third|fourth|last)\s+week\s+of\s+([a-z]+)/i);
            travelWindow = `${m[1]} week of ${m[2]}`;
        } else if (/([a-z]+)\s+ke\s+(first|second|third|fourth|last)\s+week/i.test(t)) {
            const m = t.match(/([a-z]+)\s+ke\s+(first|second|third|fourth|last)\s+week/i);
            travelWindow = `${m[2]} week of ${m[1]}`;
        } else {
            const monthOnlyMatch = t.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
            if (monthOnlyMatch) {
                travelWindow = monthOnlyMatch[1];
            }
        }
    }

    return { travelStartDate, travelEndDate, travelWindow };
}

/**
 * Extracts duration in days/nights
 */
function extractDuration(text = '', currentState = {}) {
    const t = text.toLowerCase();
    let duration = currentState.duration || '';
    let durationDays = currentState.durationDays || null;
    let durationNights = currentState.durationNights || null;

    // "2 nights / 3 days", "3 days 2 nights", "3 din 2 raat"
    const nightsDaysMatch = t.match(/(\d+)\s*(?:nights?|raat)\s*(?:\/|aur|and)?\s*(\d+)\s*(?:days?|din)/i);
    const daysNightsMatch = t.match(/(\d+)\s*(?:days?|din)\s*(?:\/|aur|and)?\s*(\d+)\s*(?:nights?|raat)/i);

    if (nightsDaysMatch) {
        durationNights = parseInt(nightsDaysMatch[1], 10);
        durationDays = parseInt(nightsDaysMatch[2], 10);
        duration = `${durationDays} Days / ${durationNights} Nights`;
    } else if (daysNightsMatch) {
        durationDays = parseInt(daysNightsMatch[1], 10);
        durationNights = parseInt(daysNightsMatch[2], 10);
        duration = `${durationDays} Days / ${durationNights} Nights`;
    } else {
        // "3 din ke liye", "3 days", "4-day trip"
        const daysMatch = t.match(/(\d+)\s*(?:days?|din)/i);
        if (daysMatch) {
            durationDays = parseInt(daysMatch[1], 10);
            durationNights = Math.max(0, durationDays - 1);
            duration = `${durationDays} Days${durationNights > 0 ? ` / ${durationNights} Nights` : ''}`;
        } else if (/\b(same\s*day|1\s*day|ek\s*din)\b/i.test(t)) {
            durationDays = 1;
            durationNights = 0;
            duration = '1 Day (Same Day)';
        } else if (/\b(weekend)\b/i.test(t)) {
            durationDays = 2;
            durationNights = 1;
            duration = 'Weekend (2 Days / 1 Night)';
        }
    }

    return { duration, durationDays, durationNights };
}

/**
 * Extracts origin / arrival location
 */
function extractOrigin(text = '', currentState = {}) {
    const t = text.toLowerCase();
    let origin = currentState.origin || '';
    let pickupRequired = currentState.pickupRequired || false;

    // "from Delhi", "Delhi se", "Mumbai se aa rahe hain"
    const originMatch = t.match(/(?:from|se|coming from)\s+([a-z\s]{3,20})(?:\s+se|\s+aa|\s+flight|\s+train|$)/i);
    if (originMatch) {
        const candidate = originMatch[1].trim();
        if (!['varanasi', 'banaras', 'kashi', 'hotel', 'darshan'].includes(candidate.toLowerCase())) {
            origin = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
    }

    // Direct major Indian cities
    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'Ahmedabad', 'Lucknow', 'Patna', 'Jaipur', 'Kanpur', 'Surat', 'Nagpur', 'Indore'];
    for (const city of cities) {
        const regex = new RegExp(`\\b${city}\\b`, 'i');
        if (regex.test(t)) {
            origin = city;
            break;
        }
    }

    if (/\b(airport\s*pickup|flight\s*se|babatpur)\b/i.test(t)) {
        pickupRequired = true;
        if (!origin) origin = 'Airport (Flight)';
    } else if (/\b(train\s*se|railway\s*station|cantt|banaras\s*station)\b/i.test(t)) {
        pickupRequired = true;
        if (!origin) origin = 'Train';
    } else if (/\b(own\s*car|khud\s*ki\s*car|by\s*road)\b/i.test(t)) {
        if (!origin) origin = 'Own Vehicle';
    }

    return { origin, pickupRequired };
}

/**
 * Extracts budget information
 */
function extractBudget(text = '', currentState = {}) {
    const t = text.toLowerCase();
    let budget = currentState.budget || '';

    // "20k", "25,000", "₹25000", "around 30000"
    const budgetKMatch = t.match(/(?:budget|around|approx|lagbhag|upto)?\s*(?:rs\.?|inr|₹)?\s*(\d+)\s*k\b/i);
    const budgetNumMatch = t.match(/(?:budget|around|approx|lagbhag|upto)?\s*(?:rs\.?|inr|₹)\s*([\d,]+)/i) ||
                           t.match(/(?:budget|around|approx|lagbhag)\s+([\d,]{4,6})/i);

    if (budgetKMatch) {
        const val = parseInt(budgetKMatch[1], 10) * 1000;
        budget = `₹${val.toLocaleString('en-IN')} approx`;
    } else if (budgetNumMatch) {
        const cleanNum = budgetNumMatch[1].replace(/,/g, '');
        const val = parseInt(cleanNum, 10);
        if (val >= 1000) {
            budget = `₹${val.toLocaleString('en-IN')} approx`;
        }
    }

    return { budget };
}

/**
 * Extracts preferences and special requirements
 */
function extractPreferences(text = '', currentState = {}) {
    const t = text.toLowerCase();
    let specialRequirements = currentState.specialRequirements || '';
    let accommodationPreference = currentState.accommodationPreference || '';

    const reqs = specialRequirements ? specialRequirements.split(', ').map(s => s.trim()) : [];

    if (/\b(family|family\s*trip|parivar)\b/i.test(t) && !reqs.includes('Family')) reqs.push('Family');
    if (/\b(senior\s*citizens?|elderly|buzurg|mata\s*ji|pitaji)\b/i.test(t) && !reqs.includes('Senior Citizens (Assistance)')) reqs.push('Senior Citizens (Assistance)');
    if (/\b(couple|honeymoon|anniversary)\b/i.test(t) && !reqs.includes('Couple Trip')) reqs.push('Couple Trip');
    if (/\b(pure\s*veg|jain\s*food|vegetarian|satvik)\b/i.test(t) && !reqs.includes('Pure Veg / Satvik Food')) reqs.push('Pure Veg / Satvik Food');
    if (/\b(wheelchair|accessibility)\b/i.test(t) && !reqs.includes('Wheelchair / Accessible')) reqs.push('Wheelchair / Accessible');
    if (/\b(sunrise\s*boat|mangla\s*aarti)\b/i.test(t) && !reqs.includes('Early Morning Aarti')) reqs.push('Early Morning Aarti');

    if (/\b(luxury|5\s*star|heritage\s*haveli|deluxe)\b/i.test(t)) {
        accommodationPreference = 'Deluxe / Heritage / 5-Star';
    } else if (/\b(3\s*star|standard\s*hotel)\b/i.test(t)) {
        accommodationPreference = 'Standard 3-Star Hotel';
    } else if (/\b(budget|economical|sasta|homestay)\b/i.test(t)) {
        accommodationPreference = 'Budget Clean Hotel / Homestay';
    }

    return {
        specialRequirements: reqs.join(', '),
        accommodationPreference
    };
}

/**
 * Extracts contact details (Name, Phone, Email)
 */
function extractContact(text = '', currentState = {}) {
    const t = text.trim();
    let customerName = currentState.customerName || '';
    let phone = currentState.phone || '';
    let email = currentState.email || '';

    // Phone: match valid 10-digit mobile number
    const phoneMatch = t.match(/(?:\+91[-\s]?)?([6-9]\d{9})\b/);
    if (phoneMatch) {
        phone = phoneMatch[1];
    }

    // Email
    const emailMatch = t.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
        email = emailMatch[1].toLowerCase();
    }

    // Name extraction: if input has "Mera naam X hai" or "My name is X" or first 2 words if phone matches
    const namePhraseMatch = t.match(/(?:mera\s+naam|my\s+name\s+is|name\s+is|i\s+am)\s+([^,\d\n]+?)(?:\s+(?:hai|he|h|phone|mobile|contact|email|aur|and)\b|[,;\n]|\s*$)/i);
    if (namePhraseMatch) {
        customerName = namePhraseMatch[1].trim();
    } else if (!customerName && !phoneMatch && t.length >= 2 && t.length <= 40 && !t.includes('?')) {
        // If in awaiting contact state and string has no digits
        if (!/\d/.test(t) && !['yes', 'no', 'confirm', 'edit', 'submit'].includes(t.toLowerCase())) {
            customerName = t;
        }
    }

    return { customerName, phone, email };
}

/**
 * Updates requirement state from user message
 */
function updateRequirementState(currentReq = {}, text = '', currentServices = []) {
    const services = extractServices(text, currentServices);
    const guests = extractGuests(text, currentReq);
    const dates = extractDatesAndWindow(text, currentReq);
    const duration = extractDuration(text, currentReq);
    const origin = extractOrigin(text, currentReq);
    const budget = extractBudget(text, currentReq);
    const preferences = extractPreferences(text, currentReq);
    const contact = extractContact(text, currentReq);

    const updated = {
        ...currentReq,
        tripIntent: currentReq.tripIntent || (services.length > 0 ? services.join(' + ') : 'Kashi-Vashi'),
        destination: 'Varanasi',
        origin: origin.origin || currentReq.origin || '',
        travelStartDate: dates.travelStartDate || currentReq.travelStartDate || '',
        travelEndDate: dates.travelEndDate || currentReq.travelEndDate || '',
        travelWindow: dates.travelWindow || currentReq.travelWindow || '',
        duration: duration.duration || currentReq.duration || '',
        durationDays: duration.durationDays !== null ? duration.durationDays : currentReq.durationDays,
        durationNights: duration.durationNights !== null ? duration.durationNights : currentReq.durationNights,
        totalGuests: guests.totalGuests !== null ? guests.totalGuests : currentReq.totalGuests,
        adults: guests.adults !== null ? guests.adults : currentReq.adults,
        children: guests.children !== null ? guests.children : currentReq.children,

        hotelRequired: services.includes(AI_SERVICE_INTENTS.HOTEL),
        darshanRequired: services.includes(AI_SERVICE_INTENTS.DARSHAN),
        boatRequired: services.includes(AI_SERVICE_INTENTS.BOAT),
        transportRequired: services.includes(AI_SERVICE_INTENTS.TRANSPORT),
        panditRequired: services.includes(AI_SERVICE_INTENTS.PANDIT),
        guideRequired: services.includes(AI_SERVICE_INTENTS.GUIDE),
        shoppingRequired: services.includes(AI_SERVICE_INTENTS.SHOPPING),
        packageRequired: services.includes(AI_SERVICE_INTENTS.PACKAGE),
        pickupRequired: origin.pickupRequired || currentReq.pickupRequired || false,

        budget: budget.budget || currentReq.budget || '',
        accommodationPreference: preferences.accommodationPreference || currentReq.accommodationPreference || '',
        specialRequirements: preferences.specialRequirements || currentReq.specialRequirements || '',

        customerName: contact.customerName || currentReq.customerName || '',
        phone: contact.phone || currentReq.phone || '',
        email: contact.email || currentReq.email || ''
    };

    // Calculate missing fields
    const missing = [];
    if (!updated.travelWindow && !updated.travelStartDate) missing.push('travelWindow');
    if (!updated.totalGuests) missing.push('totalGuests');
    if (!updated.duration) missing.push('duration');
    if (services.length === 0) missing.push('services');
    if (!updated.origin) missing.push('origin');

    updated.missingFields = missing;
    return { updatedReq: updated, services };
}

/**
 * Generates the single next best question based on missing fields
 */
function getNextQuestion(reqState, services = []) {
    // Priority order:
    // 1. Travel Window / Dates
    if (!reqState.travelWindow && !reqState.travelStartDate) {
        return {
            question: "Aap Varanasi kis date ya month mein aane ka plan kar rahe hain? (Jaise: 12-15 November, ya November ke second week)",
            field: 'travelWindow',
            quickReplies: ["Next Month", "Upcoming Weekend", "October", "November", "Diwali Season"]
        };
    }

    // 2. Total Guests
    if (!reqState.totalGuests) {
        return {
            question: "Aapke saath total kitne log travel karenge? (Adults aur Bachche)",
            field: 'totalGuests',
            quickReplies: ["2 Adults (Couple)", "4 Log (Family)", "Solo (1 Person)", "6+ Log (Group)"]
        };
    }

    // 3. Duration
    if (!reqState.duration) {
        return {
            question: "Varanasi mein kitne din rukne ka plan hai? (Jaise: 3 Days / 2 Nights)",
            field: 'duration',
            quickReplies: ["1 Day (Same Day)", "2 Days / 1 Night", "3 Days / 2 Nights", "4+ Days"]
        };
    }

    // 4. Required Services
    if (services.length === 0) {
        return {
            question: "Aapko kaun-kaun si services chahiye? (Hotel, Darshan, Ganga Aarti Boat, Cab)",
            field: 'services',
            quickReplies: ["Hotel + Darshan + Boat", "Hotel Only", "Boat Ride & Darshan", "Complete Package"]
        };
    }

    // 5. Origin / Arrival
    if (!reqState.origin) {
        return {
            question: "Aap kahan se Varanasi aa rahe hain? (City name ya Airport/Train pickup)",
            field: 'origin',
            quickReplies: ["Delhi", "Mumbai", "Lucknow", "Airport Pickup", "Train Transfer"]
        };
    }

    // 6. Hotel preference (if hotel requested but no category specified)
    if (reqState.hotelRequired && !reqState.accommodationPreference) {
        return {
            question: "Hotel kis category ka prefer karenge? (Budget, 3-Star, Riverfront Heritage)",
            field: 'accommodationPreference',
            quickReplies: ["Standard 3-Star", "Budget Clean Hotel", "Heritage / Ghat View", "4-Star Luxury"]
        };
    }

    return null; // All key info collected!
}

/**
 * Builds formatted text summary for customer confirmation
 */
function buildRequirementSummary(reqState, services = []) {
    const lines = [];
    lines.push("📋 **Aapki Trip Requirement Summary:**\n");
    
    if (reqState.travelWindow || reqState.travelStartDate) {
        lines.push(`• **Travel Dates:** ${reqState.travelWindow || reqState.travelStartDate}`);
    }
    if (reqState.totalGuests) {
        lines.push(`• **Total Guests:** ${reqState.totalGuests} Guests ${reqState.adults ? `(${reqState.adults} Adults${reqState.children ? `, ${reqState.children} Children` : ''})` : ''}`.trim());
    }
    if (reqState.duration) {
        lines.push(`• **Trip Duration:** ${reqState.duration}`);
    }
    if (services.length > 0) {
        const formattedServices = services.map(s => `✓ ${s.charAt(0) + s.slice(1).toLowerCase()}`).join(', ');
        lines.push(`• **Selected Services:** ${formattedServices}`);
    }
    if (reqState.origin) {
        lines.push(`• **Coming From:** ${reqState.origin}`);
    }
    if (reqState.accommodationPreference) {
        lines.push(`• **Hotel Preference:** ${reqState.accommodationPreference}`);
    }
    if (reqState.budget) {
        lines.push(`• **Estimated Budget:** ${reqState.budget}`);
    }
    if (reqState.specialRequirements) {
        lines.push(`• **Preferences:** ${reqState.specialRequirements}`);
    }

    return lines.join('\n');
}

/**
 * Main conversation handler for customer assistant message
 */
async function processAssistantMessage(session, userMessage, models) {
    const { AIConfig, AIAuditLog } = models;
    const cleanText = String(userMessage || '').trim();
    const config = await getOrCreateConfig(AIConfig);

    // 1. Module Feature Flag & Safe Mode Check
    const moduleConfig = config.modules?.customerAssistant;
    const isModuleEnabled = config.masterEnabled && !config.emergencyStop && moduleConfig?.enabled;

    if (!isModuleEnabled) {
        await recordAuditEvent(AIAuditLog, {
            runId: `ASST-${session.sessionId}`,
            userId: session._id,
            actorRole: 'ANONYMOUS_PUBLIC',
            module: AI_MODULES.CUSTOMER_ASSISTANT,
            action: 'CUSTOMER_MESSAGE_PROCESSED',
            decision: AI_AUDIT_DECISIONS.BLOCKED,
            reason: config.emergencyStop ? 'Emergency stop active' : 'Customer Assistant module is disabled',
            riskLevel: AI_RISK_LEVELS.LOW
        });

        return {
            reply: "Main abhi available nahi hoon. Aap normal Plan My Trip form use kar sakte hain ya WhatsApp par team se contact kar sakte hain.",
            status: AI_ASSISTANT_STATES.ERROR,
            quickReplies: ["Plan My Trip Form", "WhatsApp Team"],
            readyForConfirmation: false,
            humanHandoffRequired: true,
            escalationReason: 'MODULE_DISABLED'
        };
    }

    // 2. Prompt Injection Guardrail
    const injectionCheck = checkPromptInjection(cleanText);
    if (injectionCheck.detected) {
        await recordAuditEvent(AIAuditLog, {
            runId: `ASST-${session.sessionId}`,
            userId: session._id,
            actorRole: 'ANONYMOUS_PUBLIC',
            module: AI_MODULES.CUSTOMER_ASSISTANT,
            action: 'PROMPT_INJECTION_DEFENSE',
            decision: AI_AUDIT_DECISIONS.BLOCKED,
            reason: `Malicious prompt pattern detected: ${injectionCheck.pattern}`,
            riskLevel: AI_RISK_LEVELS.HIGH,
            metadata: { snippet: cleanText.substring(0, 50) }
        });

        return {
            reply: "Main sirf aapki Varanasi yatra plan karne mein madad kar sakta hoon. Internal business data ya system instructions share nahi kiye ja sakte. Chaliye aapki trip planning par wapas aate hain.",
            status: session.status,
            requirementState: session.requirementState,
            quickReplies: ["Plan a trip", "Check Darshan info", "Boat Ride"],
            readyForConfirmation: false,
            humanHandoffRequired: false
        };
    }

    // 3. Escalation & Hallucination Guardrail Check
    const escalationCheck = checkEscalationTrigger(cleanText);
    if (escalationCheck.triggered) {
        let politeHandoffReply = "Main aapki requirement note kar leta hoon; final pricing aur live availability humari Kashi-Vashi operations team confirm karegi.";
        if (escalationCheck.reason === AI_ESCALATION_TRIGGERS.HUMAN_REQUEST) {
            politeHandoffReply = "Bilkul! Main aapki requirement hamari Kashi-Vashi travel team ko bhej deta hoon taaki hamare expert aapse direct connect kar sakein.";
        } else if (escalationCheck.reason === AI_ESCALATION_TRIGGERS.PRICE_REQUEST) {
            politeHandoffReply = "Humari pricing selected dates, guest count aur services par depend karti hai. Hum transparent quotes provide karte hain jo humari team direct share karegi.";
        } else if (escalationCheck.reason === AI_ESCALATION_TRIGGERS.AVAILABILITY_CONFIRMATION) {
            politeHandoffReply = "Main aapki requirement note kar sakta hoon; real-time room ya boat availability humari team verify karke confirm karegi.";
        }

        session.humanHandoffRequired = true;
        session.escalationReason = escalationCheck.reason;
        session.status = AI_ASSISTANT_STATES.HANDOFF_REQUIRED;

        return {
            reply: `${politeHandoffReply}\n\nAap WhatsApp par bhi humare travel specialist se direct connect kar sakte hain.`,
            status: session.status,
            requirementState: session.requirementState,
            quickReplies: ["WhatsApp Team", "Request Callback", "Continue Planning"],
            readyForConfirmation: false,
            humanHandoffRequired: true,
            escalationReason: escalationCheck.reason
        };
    }

    // 4. State-Specific Flow Handling
    let currentReq = session.requirementState?.toObject ? session.requirementState.toObject() : (session.requirementState || {});
    let currentServices = session.serviceInterests || [];

    // State: READY_FOR_CONFIRMATION
    if (session.status === AI_ASSISTANT_STATES.READY_FOR_CONFIRMATION) {
        const lowerText = cleanText.toLowerCase();
        if (/^(yes|haan|sahi\s*hai|submit|confirm|done|thik\s*hai|proceed)/i.test(lowerText)) {
            session.status = AI_ASSISTANT_STATES.AWAITING_CONTACT;
            return {
                reply: "Bahut badhiya! 👍\nKripya apna **Naam** aur **10-digit Mobile Number** share karein, taaki Kashi-Vashi team aapse contact kar sake.",
                status: session.status,
                requirementState: currentReq,
                quickReplies: [],
                readyForConfirmation: false,
                humanHandoffRequired: false
            };
        } else if (/^(edit|badlo|change|no|nahi)/i.test(lowerText)) {
            session.status = AI_ASSISTANT_STATES.COLLECTING_DETAILS;
            return {
                reply: "Aap kya badalna chahte hain? (Dates, Guests, Duration ya Services)",
                status: session.status,
                requirementState: currentReq,
                quickReplies: ["Change Dates", "Change Guests", "Change Services"],
                readyForConfirmation: false,
                humanHandoffRequired: false
            };
        }
    }

    // State: AWAITING_CONTACT
    if (session.status === AI_ASSISTANT_STATES.AWAITING_CONTACT) {
        const contact = extractContact(cleanText, currentReq);
        if (contact.phone) {
            currentReq.phone = contact.phone;
        }
        if (contact.customerName) {
            currentReq.customerName = contact.customerName;
        }
        if (contact.email) {
            currentReq.email = contact.email;
        }

        if (!currentReq.phone || currentReq.phone.length < 10) {
            return {
                reply: "Kripya ek valid **10-digit mobile number** provide karein taaki humari team aapse contact kar sake.",
                status: session.status,
                requirementState: currentReq,
                quickReplies: [],
                readyForConfirmation: false,
                humanHandoffRequired: false
            };
        }

        if (!currentReq.customerName || currentReq.customerName.length < 2) {
            return {
                reply: "Dhanyawad! Kripya apna **Full Name** bhi share kar dijiye.",
                status: session.status,
                requirementState: currentReq,
                quickReplies: [],
                readyForConfirmation: false,
                humanHandoffRequired: false
            };
        }

        // Both Name and Phone collected -> move to AWAITING_CONSENT
        session.status = AI_ASSISTANT_STATES.AWAITING_CONSENT;
        session.requirementState = currentReq;

        return {
            reply: `Thank you, **${currentReq.customerName}** ji!\n\n🔒 **Privacy & Consent:**\nAapki trip requirement Kashi-Vashi team ke saath share ki jayegi taaki hamare travel expert aapse best customized itinerary aur quotation ke liye connect kar sakein.\n\nKya hum ye lead create karein?`,
            status: session.status,
            requirementState: currentReq,
            quickReplies: ["I Agree, Submit", "Cancel"],
            readyForConfirmation: false,
            humanHandoffRequired: false
        };
    }

    // State: AWAITING_CONSENT
    if (session.status === AI_ASSISTANT_STATES.AWAITING_CONSENT) {
        const lowerText = cleanText.toLowerCase();
        if (/^(i\s*agree|agree|yes|submit|confirm|haan|theek\s*hai)/i.test(lowerText)) {
            session.consentGiven = true;
            session.consentTimestamp = new Date();
            session.status = AI_ASSISTANT_STATES.SUBMITTED;

            return {
                reply: "Bahut aabhar! 🙏 Hum aapki enquiry Kashi-Vashi CRM mein submit kar rahe hain...",
                status: session.status,
                requirementState: currentReq,
                shouldSubmitLead: true,
                quickReplies: [],
                readyForConfirmation: false,
                humanHandoffRequired: false
            };
        } else if (/^(cancel|no|nahi|stop)/i.test(lowerText)) {
            session.status = AI_ASSISTANT_STATES.ABANDONED;
            return {
                reply: "Samajh gaya. Aapki requirement submit nahi ki gayi hai. Jab bhi aap ready hon, hum yahan hain!",
                status: session.status,
                requirementState: currentReq,
                quickReplies: ["Plan a trip"],
                readyForConfirmation: false,
                humanHandoffRequired: false
            };
        }
    }

    // 5. General NLU Extraction & State Update
    const { updatedReq, services } = updateRequirementState(currentReq, cleanText, currentServices);
    session.requirementState = updatedReq;
    session.serviceInterests = services;
    session.status = AI_ASSISTANT_STATES.COLLECTING_DETAILS;

    // Check if we have enough key information to present summary:
    // Need: travelWindow OR travelStartDate, totalGuests, duration, and at least 1 service
    const hasEnoughData = (updatedReq.travelWindow || updatedReq.travelStartDate) &&
                          updatedReq.totalGuests &&
                          updatedReq.duration &&
                          services.length > 0;

    if (hasEnoughData) {
        session.status = AI_ASSISTANT_STATES.READY_FOR_CONFIRMATION;
        session.readyForConfirmation = true;
        const summaryText = buildRequirementSummary(updatedReq, services);

        return {
            reply: `${summaryText}\n\n**Ye requirement sahi hai?** Aap confirm kar sakte hain ya koi badlav ho toh bata sakte hain.`,
            status: session.status,
            requirementState: updatedReq,
            serviceInterests: services,
            quickReplies: ["Yes, Submit", "Edit Requirement"],
            readyForConfirmation: true,
            humanHandoffRequired: false
        };
    }

    // 6. Otherwise, ask the next single high-value question
    const nextQ = getNextQuestion(updatedReq, services);
    if (nextQ) {
        session.nextQuestion = nextQ.question;
        
        // Find relevant factual knowledge snippet if applicable
        const knowledgeSnippets = findRelevantKnowledge(cleanText);
        let prefix = "Bilkul 👍 ";
        if (knowledgeSnippets.length > 0 && Math.random() > 0.4) {
            prefix = `Ji bilkul! ${knowledgeSnippets[0]}\n\n`;
        }

        return {
            reply: `${prefix}${nextQ.question}`,
            status: session.status,
            requirementState: updatedReq,
            serviceInterests: services,
            missingFields: updatedReq.missingFields,
            nextQuestion: nextQ.question,
            quickReplies: nextQ.quickReplies,
            readyForConfirmation: false,
            humanHandoffRequired: false
        };
    }

    // Fallback if everything is mostly known
    session.status = AI_ASSISTANT_STATES.READY_FOR_CONFIRMATION;
    session.readyForConfirmation = true;
    const summaryText = buildRequirementSummary(updatedReq, services);

    return {
        reply: `${summaryText}\n\n**Ye requirement sahi hai?**`,
        status: session.status,
        requirementState: updatedReq,
        serviceInterests: services,
        quickReplies: ["Yes, Submit", "Edit Requirement"],
        readyForConfirmation: true,
        humanHandoffRequired: false
    };
}

module.exports = {
    checkPromptInjection,
    checkEscalationTrigger,
    extractServices,
    extractGuests,
    extractDatesAndWindow,
    extractDuration,
    extractOrigin,
    extractBudget,
    extractPreferences,
    extractContact,
    updateRequirementState,
    getNextQuestion,
    buildRequirementSummary,
    processAssistantMessage
};

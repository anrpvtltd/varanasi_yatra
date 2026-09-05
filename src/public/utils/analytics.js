/**
 * Analytics Event Dispatcher Abstraction for Varanasi Yatra Public Portal
 * Dispatches custom events to window.dataLayer or external analytics providers (GA4 via VITE_GA_MEASUREMENT_ID) if configured.
 * STRICT PRIVACY: Enforces zero-PII sanitization on all outbound payloads.
 */

// Keys strictly prohibited in any analytics payload
const PII_FIELDS = ['name', 'phone', 'mobile', 'email', 'customerName', 'address', 'customerEmail'];

function sanitizePayload(params = {}) {
    const clean = {};
    for (const [key, value] of Object.entries(params)) {
        if (!PII_FIELDS.includes(key)) {
            clean[key] = value;
        }
    }
    return clean;
}

export const trackEvent = (eventName, params = {}) => {
    try {
        const safeParams = sanitizePayload(params);
        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            ...safeParams
        };

        // Push to Google Tag Manager dataLayer if available
        if (typeof window !== 'undefined') {
            if (Array.isArray(window.dataLayer)) {
                window.dataLayer.push(payload);
            }

            // If GA4 gtag is initialized via VITE_GA_MEASUREMENT_ID
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, safeParams);
            }
        }

        // Development logger
        if (import.meta.env?.DEV) {
            // console.log(`[Analytics Event] ${eventName}:`, payload);
        }
    } catch {
        // Analytics failure should never impact user experience
    }
};

export const analyticsEvents = {
    TRIP_PLANNER_START: 'track_trip_planner_start',
    TRIP_PLANNER_SUBMIT: 'track_trip_planner_submit',
    WHATSAPP_CLICK: 'track_whatsapp_click',
    CALL_CLICK: 'track_call_click',
    PACKAGE_VIEW: 'track_package_view',
    EXPERIENCE_VIEW: 'track_experience_view',
    QR_SCAN: 'track_qr_scan'
};

export const trackTripPlannerStart = (location = 'public_portal', extra = {}) => {
    trackEvent(analyticsEvents.TRIP_PLANNER_START, { location, ...extra });
};

export const trackTripPlannerSubmit = ({ success, requirements = [], source = 'WEBSITE', partnerId = null }) => {
    trackEvent(analyticsEvents.TRIP_PLANNER_SUBMIT, { success, requirements, source, partnerId });
};

export const trackWhatsAppClick = (location = 'general', context = {}) => {
    trackEvent(analyticsEvents.WHATSAPP_CLICK, { location, ...context });
};

export const trackCallClick = (location = 'general', context = {}) => {
    trackEvent(analyticsEvents.CALL_CLICK, { location, ...context });
};

export const trackPackageView = (packageSlug) => {
    trackEvent(analyticsEvents.PACKAGE_VIEW, { packageSlug });
};

export const trackExperienceView = (experienceSlug) => {
    trackEvent(analyticsEvents.EXPERIENCE_VIEW, { experienceSlug });
};

export const trackQRScan = (partnerId, qrId = null) => {
    trackEvent(analyticsEvents.QR_SCAN, { partnerId, qrId: qrId || partnerId });
};

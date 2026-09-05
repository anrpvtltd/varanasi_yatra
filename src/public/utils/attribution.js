/**
 * Attribution Management Utility for Varanasi Yatra
 * Captures, persists (in sessionStorage), and retrieves UTM parameters and Hotel Partner QR attribution.
 */

const STORAGE_KEY_PARTNER = 'vy_partner_attribution';
const STORAGE_KEY_UTM = 'vy_utm_attribution';

export function getUrlParams() {
    if (typeof window === 'undefined') return {};
    try {
        const search = window.location.search;
        return Object.fromEntries(new URLSearchParams(search));
    } catch {
        return {};
    }
}

/**
 * Capture UTM parameters from URL search params on initial load and store in sessionStorage.
 * Preserves first-touch attribution within the session unless new UTMs are explicitly present.
 */
export function captureUtmParameters() {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
        const params = getUrlParams();
        const hasUtm = params.utm_source || params.utm_medium || params.utm_campaign || params.utm_term || params.utm_content;

        if (hasUtm) {
            const utmData = {
                source: params.utm_source || '',
                medium: params.utm_medium || '',
                campaign: params.utm_campaign || '',
                term: params.utm_term || '',
                content: params.utm_content || '',
                capturedAt: new Date().toISOString()
            };
            window.sessionStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(utmData));
        }
    } catch {
        // Safe fallback if sessionStorage is blocked
    }
}

/**
 * Persist Hotel Partner attribution when landing on /p/:partnerId
 */
export function setPartnerAttribution({ partnerId, partnerName = '', qrId = null, landingPath = '' }) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
        const attribution = {
            source: 'HOTEL_QR',
            partnerId: partnerId ? String(partnerId).toLowerCase().trim() : null,
            partnerName: partnerName || '',
            qrId: qrId ? String(qrId).trim() : (partnerId || null),
            landingPath: landingPath || window.location.pathname,
            capturedAt: new Date().toISOString()
        };
        window.sessionStorage.setItem(STORAGE_KEY_PARTNER, JSON.stringify(attribution));
    } catch {
        // Safe fallback
    }
}

/**
 * Get the current active attribution (Partner QR or standard Website + UTMs)
 */
export function getAttribution() {
    let partnerAttribution = null;
    let utmAttribution = null;

    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            const rawPartner = window.sessionStorage.getItem(STORAGE_KEY_PARTNER);
            if (rawPartner) partnerAttribution = JSON.parse(rawPartner);
        } catch {}

        try {
            const rawUtm = window.sessionStorage.getItem(STORAGE_KEY_UTM);
            if (rawUtm) utmAttribution = JSON.parse(rawUtm);
        } catch {}
    }

    // Default to WEBSITE if no partner attribution is active
    const source = partnerAttribution?.source || 'WEBSITE';
    const partnerId = partnerAttribution?.partnerId || null;
    const partnerName = partnerAttribution?.partnerName || '';
    const qrId = partnerAttribution?.qrId || null;
    const landingPath = partnerAttribution?.landingPath || (typeof window !== 'undefined' ? window.location.pathname : '');

    return {
        source,
        partnerId,
        partnerName,
        qrId,
        landingPath,
        utmSource: utmAttribution?.source || '',
        utmMedium: utmAttribution?.medium || '',
        utmCampaign: utmAttribution?.campaign || '',
        utmTerm: utmAttribution?.term || '',
        utmContent: utmAttribution?.content || ''
    };
}

/**
 * Clear attribution post submission (optional)
 */
export function clearAttribution() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            window.sessionStorage.removeItem(STORAGE_KEY_PARTNER);
        } catch {}
    }
}

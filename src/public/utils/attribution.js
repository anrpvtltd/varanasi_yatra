/**
 * Attribution Management Utility for Kashi-Vashi
 * Captures, persists (in sessionStorage), and retrieves UTM parameters and Hotel Partner QR attribution.
 */

const STORAGE_KEY_PARTNER = 'vy_partner_attribution';
const STORAGE_KEY_AREA_QR = 'vy_area_qr_attribution';
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
 * Persist Area QR attribution when landing on /q/:qrId
 */
export function setAreaQrAttribution({
    qrId,
    areaId = '',
    areaName = '',
    qrType = '',
    placementName = '',
    venueName = '',
    landingPath = ''
}) {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
        const attribution = {
            source: 'AREA_QR',
            qrId: qrId ? String(qrId).trim().toUpperCase() : '',
            areaId: areaId ? String(areaId).trim() : '',
            areaName: areaName || '',
            qrType: qrType || '',
            placementName: placementName || '',
            venueName: venueName || '',
            landingPath: landingPath || window.location.pathname,
            capturedAt: new Date().toISOString()
        };
        window.sessionStorage.setItem(STORAGE_KEY_AREA_QR, JSON.stringify(attribution));
    } catch {
        // Safe fallback
    }
}

/**
 * Get the current active attribution (Area QR, Partner QR, or standard Website + UTMs)
 */
export function getAttribution() {
    let areaQrAttribution = null;
    let partnerAttribution = null;
    let utmAttribution = null;

    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            const rawArea = window.sessionStorage.getItem(STORAGE_KEY_AREA_QR);
            if (rawArea) areaQrAttribution = JSON.parse(rawArea);
        } catch {}

        try {
            const rawPartner = window.sessionStorage.getItem(STORAGE_KEY_PARTNER);
            if (rawPartner) partnerAttribution = JSON.parse(rawPartner);
        } catch {}

        try {
            const rawUtm = window.sessionStorage.getItem(STORAGE_KEY_UTM);
            if (rawUtm) utmAttribution = JSON.parse(rawUtm);
        } catch {}
    }

    // Area QR takes precedence if present
    if (areaQrAttribution?.qrId) {
        return {
            source: 'AREA_QR',
            qrId: areaQrAttribution.qrId,
            areaId: areaQrAttribution.areaId || null,
            areaName: areaQrAttribution.areaName || '',
            qrType: areaQrAttribution.qrType || '',
            placementName: areaQrAttribution.placementName || '',
            venueName: areaQrAttribution.venueName || '',
            partnerId: null,
            partnerName: '',
            landingPath: areaQrAttribution.landingPath || (typeof window !== 'undefined' ? window.location.pathname : ''),
            qrAttribution: {
                qrId: areaQrAttribution.qrId,
                areaId: areaQrAttribution.areaId || null,
                areaName: areaQrAttribution.areaName || '',
                qrType: areaQrAttribution.qrType || ''
            },
            utmSource: utmAttribution?.source || '',
            utmMedium: utmAttribution?.medium || '',
            utmCampaign: utmAttribution?.campaign || '',
            utmTerm: utmAttribution?.term || '',
            utmContent: utmAttribution?.content || ''
        };
    }

    // Next check Hotel Partner QR
    if (partnerAttribution?.partnerId) {
        return {
            source: 'HOTEL_QR',
            partnerId: partnerAttribution.partnerId,
            partnerName: partnerAttribution.partnerName || '',
            qrId: partnerAttribution.qrId || null,
            areaId: null,
            areaName: '',
            qrType: '',
            placementName: '',
            venueName: '',
            landingPath: partnerAttribution.landingPath || (typeof window !== 'undefined' ? window.location.pathname : ''),
            qrAttribution: null,
            utmSource: utmAttribution?.source || '',
            utmMedium: utmAttribution?.medium || '',
            utmCampaign: utmAttribution?.campaign || '',
            utmTerm: utmAttribution?.term || '',
            utmContent: utmAttribution?.content || ''
        };
    }

    // Default to WEBSITE
    return {
        source: 'WEBSITE',
        partnerId: null,
        partnerName: '',
        qrId: null,
        areaId: null,
        areaName: '',
        qrType: '',
        placementName: '',
        venueName: '',
        landingPath: typeof window !== 'undefined' ? window.location.pathname : '',
        qrAttribution: null,
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
            window.sessionStorage.removeItem(STORAGE_KEY_AREA_QR);
        } catch {}
    }
}

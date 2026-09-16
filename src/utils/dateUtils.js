/**
 * Safe date parsing and formatting utility for Kashi-Vashi CRM.
 * Prevents "Invalid Date" and "Invalid time value" crashes across all CRM routes.
 */

export function parseSafeDate(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) {
        if (isNaN(dateVal.getTime())) return null;
        const year = dateVal.getFullYear();
        return (year >= 1970 && year <= 2100) ? dateVal : null;
    }
    if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (!trimmed || trimmed.toLowerCase() === 'flexible' || trimmed.toLowerCase() === 'upcoming' || trimmed.toLowerCase() === 'invalid date' || trimmed.toLowerCase().includes('not scheduled') || trimmed.toLowerCase().includes('date not set')) {
            return null;
        }
        if (/invalid|error|undefined|null|nan/i.test(trimmed)) {
            return null;
        }
    }
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        if (year < 1970 || year > 2100) return null;
        return d;
    } catch {
        return null;
    }
}

export function safeDateToISOString(dateVal, fallback = '') {
    const d = parseSafeDate(dateVal);
    if (!d) return fallback;
    try {
        return d.toISOString();
    } catch {
        return fallback;
    }
}

export function safeDateOnly(dateVal, fallback = '') {
    if (!dateVal) return fallback;
    const d = parseSafeDate(dateVal);
    if (!d) return fallback;
    try {
        return d.toISOString().split('T')[0];
    } catch {
        return fallback;
    }
}

export function formatSafeDate(
    dateVal,
    options = { day: 'numeric', month: 'short', year: 'numeric' },
    fallback = '—'
) {
    const d = parseSafeDate(dateVal);
    if (!d) return fallback;

    try {
        return d.toLocaleDateString('en-IN', options);
    } catch {
        return fallback;
    }
}


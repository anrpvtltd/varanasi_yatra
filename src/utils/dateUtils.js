/**
 * Safe date parsing and formatting utility for Varanasi Yatra CRM.
 * Guaranteed never to return 'Invalid Date' or throw exceptions.
 */

export function formatSafeDate(
    dateVal,
    options = { day: 'numeric', month: 'short', year: 'numeric' },
    fallback = '—'
) {
    if (!dateVal) return fallback;

    // Handle common non-date strings
    if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (!trimmed || trimmed.toLowerCase() === 'flexible' || trimmed.toLowerCase() === 'upcoming' || trimmed.toLowerCase() === 'invalid date') {
            return fallback;
        }
    }

    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) {
            return fallback;
        }
        return d.toLocaleDateString('en-IN', options);
    } catch {
        return fallback;
    }
}

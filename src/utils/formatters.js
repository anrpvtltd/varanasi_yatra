export function formatDateString(dateStr) {
    if (!dateStr) return 'Flexible Date';
    return dateStr;
}

export function formatIndianCurrency(amount) {
    const num = Number(amount) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
}

export function getStatusStyle(status) {
    switch (status) {
        case 'Completed':
            return 'bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs';
        case 'Trip Started':
            return 'bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs';
        case 'Confirmed':
            return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs';
        case 'In-Progress':
            return 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs';
        case 'Cancelled':
            return 'bg-rose-50/80 text-rose-700 border border-rose-200/60 shadow-xs';
        default:
            return 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs';
    }
}

export function getStatusLabel(status) {
    switch (status) {
        case 'Completed': return '✅ Completed';
        case 'Trip Started': return '🚖 Trip Started';
        case 'Confirmed': return '🟢 Confirmed';
        case 'In-Progress': return '🔵 In-Progress';
        case 'Cancelled': return '🔴 Cancelled';
        default: return '🟡 Pending';
    }
}

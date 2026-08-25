export function computeTripReadiness(lead) {
    if (lead.status !== 'Confirmed' && lead.status !== 'Trip Started') {
        return null;
    }

    const now = new Date();
    const checks = [
        { key: 'driver', label: 'Driver', field: 'driverName', done: !!(lead.driverName && lead.driverName.trim()), severity: 'HIGH' },
        { key: 'vehicle', label: 'Vehicle', field: 'vehicleModel', done: !!(lead.vehicleModel || lead.vehicleNumber), severity: 'HIGH' },
        { key: 'hotel', label: 'Hotel', field: 'hotelDetails', done: !!(lead.hotelDetails && lead.hotelDetails.trim()), severity: 'HIGH' },
        { key: 'guide', label: 'Guide/Pandit', field: 'panditDetails', done: !!(lead.panditDetails && lead.panditDetails.trim()), severity: 'MEDIUM' },
        { key: 'pickup', label: 'Pickup', field: 'pickup', done: !!(lead.pickup && lead.pickup.trim() && lead.pickup !== 'Direct Booking'), severity: 'LOW' }
    ];

    const doneCount = checks.filter(c => c.done).length;
    const percent = Math.round((doneCount / checks.length) * 100);
    const missing = checks.filter(c => !c.done).map(c => c.label);

    let daysUntil = 999;
    let isPast = false;
    if (lead.date) {
        const todayStr = now.toISOString().split('T')[0];
        const travelStr = lead.date.split('T')[0];
        if (travelStr < todayStr) {
            isPast = true;
        }
        daysUntil = Math.ceil((new Date(lead.date) - now) / (1000 * 60 * 60 * 24));
    }

    let urgency = 'LOW';
    if (!isPast) {
        if (daysUntil <= 1 && daysUntil >= 0) {
            urgency = 'CRITICAL';
        } else if (daysUntil <= 3 && daysUntil > 1) {
            urgency = 'HIGH';
        } else if (daysUntil <= 7 && daysUntil > 3) {
            urgency = 'MEDIUM';
        }
    }

    let status = 'READY';
    if (isPast) {
        status = 'ELAPSED';
    } else if (percent < 100) {
        status = 'INCOMPLETE';
        if (daysUntil >= 0 && daysUntil <= 3 && percent < 80) {
            status = 'AT RISK';
        }
    }

    let reason = 'All required arrangements are complete.';
    if (status === 'ELAPSED') {
        reason = 'Trip travel date has passed.';
    } else if (status === 'AT RISK') {
        reason = `Trip begins ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`} and ${missing.length} arrangement${missing.length > 1 ? 's are' : ' is'} missing.`;
    } else if (status === 'INCOMPLETE') {
        reason = `${missing.length} arrangement${missing.length > 1 ? 's are' : ' is'} still missing (${missing.join(', ')}).`;
    }

    return {
        percent,
        status,
        checks,
        missing,
        urgency,
        reason,
        daysUntil
    };
}

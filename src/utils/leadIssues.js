export function isTestOrStaleLead(lead) {
    if (!lead) return false;
    const name = (lead.name || '').toLowerCase().trim();
    const email = (lead.email || '').toLowerCase().trim();
    const phone = (lead.mobile || '').trim();
    const now = new Date();

    const nameSignal = name === 'test' || name === 'demo' || name === 'asdf' || name.startsWith('test') || name.endsWith('test') || name === 'hii' || name === 'aftertest' || name.includes('qa test');
    const phoneSignal = phone === '1234567890' || phone === '0000000000' || phone === '9999999999' || phone.length < 10 || phone === '1144772255' || phone === '1234444444';
    const emailSignal = email.includes('test.com') || email.includes('example.com') || email.includes('null@gmail.com') || email.includes('none@gmail.com') || email.includes('qa.test');

    const updatedAt = lead.updatedAt ? new Date(lead.updatedAt) : (lead.createdAt ? new Date(lead.createdAt) : new Date('2020-01-01'));
    const daysInactive = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
    const staleSignal = (lead.status === 'Pending' || lead.status === 'In-Progress') && daysInactive >= 30;

    let pastDateSignal = false;
    if (lead.date) {
        const travelDate = new Date(lead.date);
        const daysPast = Math.floor((now - travelDate) / (1000 * 60 * 60 * 24));
        if (daysPast >= 30) pastDateSignal = true;
    }

    // Require MULTI-SIGNAL COMBINED EVIDENCE:
    // 1. Dummy phone + (test name OR test email)
    if (phoneSignal && (nameSignal || emailSignal)) return true;

    // 2. Test name/email + (stale activity OR past travel date)
    if ((nameSignal || emailSignal) && (staleSignal || pastDateSignal)) return true;

    // 3. Stale inactive for 30+ days AND travel date passed 30+ days ago
    if (staleSignal && pastDateSignal && !lead.followUpDate) return true;

    return false;
}


export function detectIssues(lead) {
    const issues = [];
    const warnings = [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (lead.status === 'Completed' || lead.status === 'Cancelled') {
        return { hasIssue: false, warnings: [], issues: [] };
    }

    const isTestOrStale = isTestOrStaleLead(lead);

    // 1. Confirmed / Trip Started operational allocation gaps (Upcoming trips only: 0 <= daysUntil <= 3)
    if ((lead.status === 'Confirmed' || lead.status === 'Trip Started') && lead.date) {
        const travelStr = lead.date.split('T')[0];
        if (travelStr >= todayStr) {
            const daysUntil = Math.ceil((new Date(lead.date) - now) / (1000 * 60 * 60 * 24));
            if (daysUntil >= 0 && daysUntil <= 3) {
                const severity = daysUntil <= 1 ? 'CRITICAL' : 'HIGH';
                if (!lead.driverName) {
                    const text = `Trip ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}. Driver not assigned.`;
                    warnings.push(text);
                    issues.push({
                        type: 'MISSING_DRIVER',
                        severity: isTestOrStale ? 'LOW' : severity,
                        title: 'Driver Missing',
                        reason: text,
                        leadId: lead._id,
                        nextAction: { action: 'ASSIGN_DRIVER', label: 'Assign Driver' }
                    });
                }
                if (!lead.vehicleModel && !lead.vehicleNumber) {
                    const text = `Trip ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}. Vehicle not assigned.`;
                    warnings.push(text);
                    issues.push({
                        type: 'MISSING_VEHICLE',
                        severity: isTestOrStale ? 'LOW' : severity,
                        title: 'Vehicle Missing',
                        reason: text,
                        leadId: lead._id,
                        nextAction: { action: 'ASSIGN_VEHICLE', label: 'Assign Vehicle' }
                    });
                }
                if (!lead.hotelDetails) {
                    const text = `Trip ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}. Hotel not assigned.`;
                    warnings.push(text);
                    issues.push({
                        type: 'MISSING_HOTEL',
                        severity: isTestOrStale ? 'LOW' : severity,
                        title: 'Hotel Missing',
                        reason: text,
                        leadId: lead._id,
                        nextAction: { action: 'CONFIRM_HOTEL', label: 'Confirm Hotel' }
                    });
                }
            }
        }
    }

    // 2. Overdue follow-up (Prioritize active leads with recent follow-ups)
    if (lead.followUpDate && (lead.status === 'In-Progress' || lead.status === 'Pending')) {
        const followUpStr = lead.followUpDate.split('T')[0];
        if (followUpStr < todayStr) {
            const overdueDays = Math.max(1, Math.floor((now - new Date(lead.followUpDate)) / (1000 * 60 * 60 * 24)));
            const text = `Follow-up overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}.`;
            warnings.push(text);
            
            let severity = 'LOW';
            if (!isTestOrStale) {
                severity = overdueDays <= 7 ? 'HIGH' : 'MEDIUM';
            }

            issues.push({
                type: 'OVERDUE_FOLLOWUP',
                severity,
                title: 'Overdue Follow-up',
                reason: text,
                leadId: lead._id,
                nextAction: { action: 'FOLLOW_UP', label: 'Follow Up' }
            });
        }
    }

    // 3. Stale lead
    if (!isTestOrStale && lead.updatedAt && (lead.status === 'Pending' || lead.status === 'In-Progress')) {
        const daysSinceUpdate = Math.floor((now - new Date(lead.updatedAt)) / (1000 * 60 * 60 * 24));
        if (daysSinceUpdate >= 7 && daysSinceUpdate < 30) {
            const text = `No activity for ${daysSinceUpdate} days. Lead may go cold.`;
            warnings.push(text);
            issues.push({
                type: 'STALE_LEAD',
                severity: 'MEDIUM',
                title: 'Stale Enquiry',
                reason: text,
                leadId: lead._id,
                nextAction: { action: 'CALL', label: 'Contact Lead' }
            });
        }
    }

    return {
        hasIssue: issues.length > 0 || warnings.length > 0,
        warnings,
        issues
    };
}


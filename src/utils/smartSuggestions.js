import { computeTripReadiness } from './tripReadiness';

export function generateSmartSuggestions(leads) {
    const suggestions = [];
    const now = new Date();

    const stalePending = leads.filter(l => l.status === 'Pending' && l.updatedAt && Math.floor((now - new Date(l.updatedAt)) / (1000 * 60 * 60 * 24)) >= 3).length;
    if (stalePending > 0) suggestions.push(`${stalePending} pending lead${stalePending > 1 ? 's have' : ' has'} not been contacted in 3+ days.`);

    const overdueFollowUps = leads.filter(l => l.followUpDate && new Date(l.followUpDate) < now && (l.status === 'In-Progress' || l.status === 'Pending')).length;
    if (overdueFollowUps > 0) suggestions.push(`${overdueFollowUps} follow-up${overdueFollowUps > 1 ? 's are' : ' is'} overdue. Prioritize callbacks today.`);

    const incompleteTrips = leads.filter(l => {
        const r = computeTripReadiness(l);
        return r && r.status !== 'READY';
    }).length;
    if (incompleteTrips > 0) suggestions.push(`${incompleteTrips} confirmed trip${incompleteTrips > 1 ? 's' : ''} still need${incompleteTrips === 1 ? 's' : ''} operational assignments.`);

    const specialReqLeads = leads.filter(l => l.specialRequirements && l.specialRequirements.trim().length > 5 && (l.status === 'Confirmed' || l.status === 'In-Progress')).length;
    if (specialReqLeads > 0) suggestions.push(`${specialReqLeads} lead${specialReqLeads > 1 ? 's have' : ' has'} special requirements — verify before confirmation.`);

    const upcomingBigGroups = leads.filter(l => (parseInt(l.travelers) || 1) >= 5 && (l.status === 'Confirmed' || l.status === 'In-Progress')).length;
    if (upcomingBigGroups > 0 && suggestions.length < 4) suggestions.push(`${upcomingBigGroups} large group${upcomingBigGroups > 1 ? 's' : ''} (5+ travelers) need${upcomingBigGroups === 1 ? 's' : ''} extra coordination.`);

    return suggestions.slice(0, 4);
}

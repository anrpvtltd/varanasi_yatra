/**
 * Contactability Service — Prompt 9.8 + Prompt 9.9
 * Varanasi Yatra Platform
 *
 * Orchestrates contact route discovery, manual route addition,
 * route verification, and human contact outcome recording
 * for AI Hunter opportunities.
 *
 * INVARIANTS:
 * 1. All discovery is human-triggered (CEO/Manager clicks button).
 * 2. Only authorized public data — NEVER private PII.
 * 3. Truthful provider status reporting.
 * 4. All mutations logged to AIAuditLog.
 * 5. Kill switch honored.
 * 6. Prompt 9.9: Real provider (PublicPageContactProvider) is primary.
 * 7. Prompt 9.9: Human contact outcomes logged and masked.
 */

const crypto = require('crypto');
const {
    CONTACT_STATUSES,
    CONTACT_VERIFICATION_STATUSES,
    ALL_CONTACT_ROUTE_TYPES,
    HUNTER_ERROR_CODES
} = require('../hunterConstants');

const { contactProviderRegistry } = require('./contactProviderRegistry');
const { MockContactProvider } = require('./mockContactProvider');
const { PublicPageContactProvider } = require('./publicPageContactProvider');
const { AuthorizedIdentityProvider } = require('./authorizedIdentityProvider');
const { determineBestContactRoute } = require('../scoring/prospectExplainer');

// ─── Provider Registration ────────────────────────────────────────────────────
// Prompt 9.9: Real provider registered as primary
const publicPageProvider = new PublicPageContactProvider({ enabled: true });
contactProviderRegistry.registerProvider('PUBLIC_PAGE_CONTACT', publicPageProvider);

// Authorized identity provider stub (NOT_CONFIGURED until licensed)
const identityProvider = new AuthorizedIdentityProvider();
contactProviderRegistry.registerProvider('AUTHORIZED_IDENTITY', identityProvider);

// Mock provider: test/dev environments only
const mockProvider = new MockContactProvider({ enabled: process.env.NODE_ENV !== 'production' });
contactProviderRegistry.registerProvider('MOCK_CONTACT', mockProvider);


/**
 * Discover contact routes for an opportunity.
 * Human-triggered only — CEO/Manager clicks "Discover Contact Routes".
 */
async function discoverContactRoutes(opportunityId, models, user, options = {}) {
    const { AIOpportunity, AIAuditLog } = models;
    const providerId = options.providerId || null;

    if (!AIOpportunity) {
        throw Object.assign(new Error('AIOpportunity model not available.'), { status: 500 });
    }

    const opp = await AIOpportunity.findOne({ opportunityId });
    if (!opp) {
        throw Object.assign(
            new Error(`Opportunity ${opportunityId} not found.`),
            { status: 404, errorCode: HUNTER_ERROR_CODES.OPPORTUNITY_NOT_FOUND }
        );
    }

    // Mark in-progress
    const enrichmentRunId = `CONTACT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    opp.contactability = opp.contactability || {};
    opp.contactability.status = CONTACT_STATUSES.IN_PROGRESS;
    opp.contactability.attemptedAt = new Date();
    opp.contactability.lastEnrichmentRunId = enrichmentRunId;
    await opp.save();

    // Run discovery
    const result = await contactProviderRegistry.discoverRoutes(opp.toObject(), providerId);

    // Update opportunity with results
    opp.contactability.status = result.status;
    opp.contactability.completedAt = new Date();
    opp.contactability.provider = result.provider || null;
    opp.contactability.providerStatus = result.providerStatus || null;

    if (result.routes && result.routes.length > 0) {
        // Append discovered routes (don't overwrite existing ones)
        const existingRoutes = opp.contactability.routes || [];
        const existingValues = new Set(existingRoutes.map(r => `${r.type}:${r.value}`));

        for (const route of result.routes) {
            const key = `${route.type}:${route.value}`;
            if (!existingValues.has(key)) {
                existingRoutes.push({
                    ...route,
                    provider: route.provider || result.provider || 'UNKNOWN',
                    discoveredAt: route.discoveredAt || new Date(),
                    freshnessStatus: route.freshnessStatus || 'FRESH',
                    verificationStatus: route.verificationStatus || 'UNVERIFIED'
                });
                existingValues.add(key);
            }
        }
        opp.contactability.routes = existingRoutes;
    }

    // Update route count (routes + manualRoutes)
    opp.contactability.routeCount =
        (opp.contactability.routes || []).length +
        (opp.contactability.manualRoutes || []).length;

    if (result.error) {
        opp.contactability.notes = result.error;
    }

    const bestRoute = determineBestContactRoute(opp.contactability.routes, opp.contactability.manualRoutes);

    await opp.save();

    // Audit log
    if (AIAuditLog) {
        await new AIAuditLog({
            runId: enrichmentRunId,
            userId: user?.id || user?._id,
            actorRole: user?.role || 'CEO',
            module: 'CUSTOMER_HUNTER',
            action: 'CONTACT_DISCOVERY_RUN',
            decision: result.status === CONTACT_STATUSES.ROUTES_FOUND ? 'ROUTES_FOUND' : result.status,
            reason: `Contact discovery for ${opportunityId}: ${result.routes?.length || 0} routes found via ${result.provider || 'none'}.`,
            metadata: {
                opportunityId,
                provider: result.provider,
                routesFound: result.routes?.length || 0,
                status: result.status,
                bestRouteType: bestRoute?.type || null
            }
        }).save();
    }

    const contactabilityObj = opp.contactability.toObject ? opp.contactability.toObject() : opp.contactability;

    return {
        opportunityId,
        contactability: contactabilityObj,
        bestContactRoute: bestRoute,
        enrichmentRunId,
        discoveryResult: {
            status: result.status,
            provider: result.provider,
            routesFound: result.routes?.length || 0,
            bestContactRoute: bestRoute,
            error: result.error || null
        }
    };
}

/**
 * Add a manual contact route.
 * CEO/Manager enters a contact route they found themselves.
 */
async function addManualContactRoute(opportunityId, routeData, models, user) {
    const { AIOpportunity, AIAuditLog } = models;

    if (!AIOpportunity) {
        throw Object.assign(new Error('AIOpportunity model not available.'), { status: 500 });
    }

    // Validate route data
    if (!routeData || !routeData.type || !routeData.value) {
        throw Object.assign(
            new Error('Route type and value are required.'),
            { status: 400, errorCode: HUNTER_ERROR_CODES.INVALID_PAYLOAD }
        );
    }

    if (!ALL_CONTACT_ROUTE_TYPES.includes(routeData.type)) {
        throw Object.assign(
            new Error(`Invalid route type: ${routeData.type}`),
            { status: 400, errorCode: HUNTER_ERROR_CODES.CONTACT_ROUTE_INVALID }
        );
    }

    const opp = await AIOpportunity.findOne({ opportunityId });
    if (!opp) {
        throw Object.assign(
            new Error(`Opportunity ${opportunityId} not found.`),
            { status: 404, errorCode: HUNTER_ERROR_CODES.OPPORTUNITY_NOT_FOUND }
        );
    }

    opp.contactability = opp.contactability || {};
    const manualRoutes = opp.contactability.manualRoutes || [];

    const newRoute = {
        type: routeData.type,
        value: String(routeData.value).trim(),
        label: String(routeData.label || '').trim(),
        confidence: 1.0, // Manual entry = full confidence
        provider: 'MANUAL_ENTRY',
        provenance: `MANUAL_ENTRY:${user?.role || 'UNKNOWN'}`,
        discoveredAt: new Date(),
        freshnessStatus: 'FRESH',
        verificationStatus: CONTACT_VERIFICATION_STATUSES.UNVERIFIED,
        verifiedByHuman: false,
        verifiedAt: null,
        addedAt: new Date()
    };

    manualRoutes.push(newRoute);
    opp.contactability.manualRoutes = manualRoutes;

    // Update status if this is the first route
    if (opp.contactability.status === CONTACT_STATUSES.NOT_ATTEMPTED ||
        opp.contactability.status === CONTACT_STATUSES.NO_ROUTES_FOUND) {
        opp.contactability.status = CONTACT_STATUSES.ROUTES_FOUND;
    }

    // Update total route count
    opp.contactability.routeCount =
        (opp.contactability.routes || []).length +
        opp.contactability.manualRoutes.length;

    await opp.save();

    // Audit log
    if (AIAuditLog) {
        await new AIAuditLog({
            runId: `MANUAL-ROUTE-${Date.now()}`,
            userId: user?.id || user?._id,
            actorRole: user?.role || 'CEO',
            module: 'CUSTOMER_HUNTER',
            action: 'MANUAL_CONTACT_ROUTE_ADDED',
            decision: 'ALLOWED',
            reason: `Manual contact route added for ${opportunityId}: ${newRoute.type} = ${newRoute.value}`,
            metadata: {
                opportunityId,
                routeType: newRoute.type,
                routeValue: newRoute.value
            }
        }).save();
    }

    return {
        opportunityId,
        addedRoute: newRoute,
        totalRoutes: opp.contactability.routeCount,
        contactability: opp.contactability.toObject ? opp.contactability.toObject() : opp.contactability
    };
}

/**
 * Verify a contact route (human marks it as verified or rejected).
 */
async function verifyContactRoute(opportunityId, routeIndex, verificationData, models, user) {
    const { AIOpportunity, AIAuditLog } = models;

    if (!AIOpportunity) {
        throw Object.assign(new Error('AIOpportunity model not available.'), { status: 500 });
    }

    const opp = await AIOpportunity.findOne({ opportunityId });
    if (!opp) {
        throw Object.assign(
            new Error(`Opportunity ${opportunityId} not found.`),
            { status: 404, errorCode: HUNTER_ERROR_CODES.OPPORTUNITY_NOT_FOUND }
        );
    }

    opp.contactability = opp.contactability || {};

    // Determine if it's a discovered route or manual route
    const allRoutes = opp.contactability.routes || [];
    const manualRoutes = opp.contactability.manualRoutes || [];
    const idx = Number(routeIndex);

    let targetRoute = null;
    let routeSource = null;

    if (idx < allRoutes.length) {
        targetRoute = allRoutes[idx];
        routeSource = 'routes';
    } else {
        const manualIdx = idx - allRoutes.length;
        if (manualIdx < manualRoutes.length) {
            targetRoute = manualRoutes[manualIdx];
            routeSource = 'manualRoutes';
        }
    }

    if (!targetRoute) {
        throw Object.assign(
            new Error(`Route at index ${routeIndex} not found.`),
            { status: 404, errorCode: HUNTER_ERROR_CODES.CONTACT_ROUTE_INVALID }
        );
    }

    const newStatus = verificationData?.status || CONTACT_VERIFICATION_STATUSES.HUMAN_VERIFIED;
    const isVerified = newStatus === 'VERIFIED' || newStatus === CONTACT_VERIFICATION_STATUSES.HUMAN_VERIFIED;

    targetRoute.verificationStatus = newStatus;
    targetRoute.verifiedByHuman = isVerified;
    if (isVerified) {
        targetRoute.freshnessStatus = 'FRESH';
    }
    targetRoute.verifiedAt = new Date();
    targetRoute.verifiedBy = user?.id || user?._id || null;

    // Write back
    if (routeSource === 'routes') {
        opp.contactability.routes[idx] = targetRoute;
    } else {
        const manualIdx = idx - allRoutes.length;
        opp.contactability.manualRoutes[manualIdx] = targetRoute;
    }

    // Mark the array as modified so Mongoose persists subdocument changes
    opp.markModified('contactability');
    await opp.save();

    // Audit log
    if (AIAuditLog) {
        await new AIAuditLog({
            runId: `VERIFY-ROUTE-${Date.now()}`,
            userId: user?.id || user?._id,
            actorRole: user?.role || 'CEO',
            module: 'CUSTOMER_HUNTER',
            action: 'CONTACT_ROUTE_VERIFIED',
            decision: newStatus,
            reason: `Route ${routeIndex} (${targetRoute.type}: ${targetRoute.value}) marked as ${newStatus} for ${opportunityId}.`,
            metadata: {
                opportunityId,
                routeIndex: idx,
                routeType: targetRoute.type,
                newStatus
            }
        }).save();
    }

    return {
        opportunityId,
        routeIndex: idx,
        routeSource,
        updatedRoute: targetRoute,
        contactability: opp.contactability.toObject ? opp.contactability.toObject() : opp.contactability
    };
}

/**
 * Get contactability data for an opportunity.
 */
async function getContactability(opportunityId, models) {
    const { AIOpportunity } = models;

    if (!AIOpportunity) {
        throw Object.assign(new Error('AIOpportunity model not available.'), { status: 500 });
    }

    const opp = await AIOpportunity.findOne({ opportunityId }).lean();
    if (!opp) {
        throw Object.assign(
            new Error(`Opportunity ${opportunityId} not found.`),
            { status: 404, errorCode: HUNTER_ERROR_CODES.OPPORTUNITY_NOT_FOUND }
        );
    }

    const contactability = opp.contactability || {
        status: CONTACT_STATUSES.NOT_ATTEMPTED,
        routes: [],
        manualRoutes: [],
        routeCount: 0
    };

    const bestRoute = determineBestContactRoute(contactability.routes, contactability.manualRoutes);

    return {
        opportunityId,
        contactability,
        bestContactRoute: bestRoute,
        providers: contactProviderRegistry.listProviders()
    };
}

module.exports = {
    discoverContactRoutes,
    addManualContactRoute,
    verifyContactRoute,
    getContactability,
    contactProviderRegistry
};

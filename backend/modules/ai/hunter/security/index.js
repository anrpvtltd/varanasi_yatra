/**
 * AI Customer Hunter Security & Governance Barrel Export
 * Varanasi Yatra Platform — Prompt 9.5
 */

const {
    validateUrlForOutboundRequest,
    isPrivateIPv4,
    isPrivateIPv6,
    PROHIBITED_HOSTS,
    PROHIBITED_SUFFIXES
} = require('./ssrfProtection');

const {
    APPROVED_PROVIDERS,
    ALL_APPROVED_DOMAINS,
    isDomainAllowed,
    resolveApprovedEndpoint
} = require('./providerAllowlist');

const {
    SIGNAL_RELEVANCE_CATEGORIES,
    ALL_RELEVANCE_CATEGORIES,
    classifySignalRelevance
} = require('./relevanceGate');

module.exports = {
    // SSRF Protections
    validateUrlForOutboundRequest,
    isPrivateIPv4,
    isPrivateIPv6,
    PROHIBITED_HOSTS,
    PROHIBITED_SUFFIXES,

    // Provider Allowlist
    APPROVED_PROVIDERS,
    ALL_APPROVED_DOMAINS,
    isDomainAllowed,
    resolveApprovedEndpoint,

    // Relevance Gate
    SIGNAL_RELEVANCE_CATEGORIES,
    ALL_RELEVANCE_CATEGORIES,
    classifySignalRelevance
};

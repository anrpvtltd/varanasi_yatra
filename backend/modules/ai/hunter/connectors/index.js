/**
 * Hunter Source Connectors Registry Barrel
 * Varanasi Yatra Platform — Prompt 9
 */

const { BaseSourceConnector } = require('./baseSourceConnector');
const { MockConnector } = require('./mockConnector');
const { SearchApiConnector } = require('./searchApiConnector');
const { PublicFeedConnector } = require('./publicFeedConnector');
const { PartnerFeedConnector } = require('./partnerFeedConnector');
const { FirstPartyConnector } = require('./firstPartyConnector');

module.exports = {
    BaseSourceConnector,
    MockConnector,
    SearchApiConnector,
    PublicFeedConnector,
    PartnerFeedConnector,
    FirstPartyConnector
};

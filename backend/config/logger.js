const { validateEnvironment } = require('./env');
const { logger, requestLogger, sanitizePayload } = require('../middleware/productionLogger');
const env = validateEnvironment();

const loggerConfig = {
    level: env.logLevel,
    format: 'json',
    redactKeys: ['password', 'jwtSecret', 'jwtRefreshSecret', 'authorization', 'token', 'apiKey', 'secret']
};

module.exports = {
    loggerConfig,
    logger,
    requestLogger,
    sanitizePayload
};

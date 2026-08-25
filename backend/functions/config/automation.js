const { validateEnvironment } = require('./env');
const env = validateEnvironment();

const automationConfig = {
    enabled: env.automationEnabled,
    provider: env.notificationProvider,
    whatsapp: {
        accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || ''
    },
    email: {
        provider: process.env.EMAIL_PROVIDER || (env.isProduction ? 'SMTP' : 'ConsoleProvider'),
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: Number(process.env.SMTP_PORT) || 587,
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'support@varanasiyatra.com'
    }
};

module.exports = {
    automationConfig
};

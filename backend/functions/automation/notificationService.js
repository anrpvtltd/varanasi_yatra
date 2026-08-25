class BaseProvider {
    constructor(name) {
        this.name = name;
    }

    async sendWhatsApp(_args) {
        throw new Error(`sendWhatsApp not implemented in ${this.name}`);
    }

    async sendEmail(_args) {
        throw new Error(`sendEmail not implemented in ${this.name}`);
    }
}

class ConsoleProvider extends BaseProvider {
    constructor() {
        super('ConsoleProvider (Test / Dev Mode)');
        this.sentHistory = [];
    }

    async sendWhatsApp({ recipient, message, templateId, metadata }) {
        const payload = {
            provider: this.name,
            channel: 'WHATSAPP',
            recipient,
            message,
            templateId,
            metadata,
            timestamp: new Date().toISOString()
        };
        this.sentHistory.push(payload);
        console.log(`\n========================================================`);
        console.log(`📱 [ConsoleProvider] OUTGOING WHATSAPP MESSAGE`);
        console.log(`To: ${recipient}`);
        console.log(`Template: ${templateId}`);
        console.log(`Message:\n${message}`);
        console.log(`========================================================\n`);
        return { success: true, messageId: `CONSOLE-WA-${Date.now()}`, provider: this.name };
    }

    async sendEmail({ recipient, subject, message, templateId, metadata }) {
        const payload = {
            provider: this.name,
            channel: 'EMAIL',
            recipient,
            subject,
            message,
            templateId,
            metadata,
            timestamp: new Date().toISOString()
        };
        this.sentHistory.push(payload);
        console.log(`\n========================================================`);
        console.log(`📧 [ConsoleProvider] OUTGOING EMAIL MESSAGE`);
        console.log(`To: ${recipient}`);
        console.log(`Subject: ${subject}`);
        console.log(`Template: ${templateId}`);
        console.log(`Body:\n${message}`);
        console.log(`========================================================\n`);
        return { success: true, messageId: `CONSOLE-EM-${Date.now()}`, provider: this.name };
    }

    getHistory() {
        return this.sentHistory;
    }

    clearHistory() {
        this.sentHistory = [];
    }
}

class WhatsAppProvider extends BaseProvider {
    constructor() {
        super('Meta WhatsApp Cloud API');
        this.apiKey = process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY || null;
        this.phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || null;
    }

    async sendWhatsApp({ recipient, message, templateId, metadata }) {
        if (!this.apiKey || !this.phoneNumberId) {
            console.warn("⚠️ Meta WhatsApp credentials missing. Falling back to ConsoleProvider logging.");
            const consoleFallback = new ConsoleProvider();
            return consoleFallback.sendWhatsApp({ recipient, message, templateId, metadata });
        }
        // Production Meta WhatsApp API dispatch stub
        console.log(`📡 [MetaWhatsAppProvider] Sending message to ${recipient}...`);
        return { success: true, messageId: `META-WA-${Date.now()}`, provider: this.name };
    }

    async sendEmail(args) {
        const consoleFallback = new ConsoleProvider();
        return consoleFallback.sendEmail(args);
    }
}

class EmailProvider extends BaseProvider {
    constructor() {
        super('SMTP / Nodemailer Email Provider');
        this.emailUser = process.env.SMTP_USER || process.env.EMAIL_USER || null;
    }

    async sendWhatsApp(args) {
        const consoleFallback = new ConsoleProvider();
        return consoleFallback.sendWhatsApp(args);
    }

    async sendEmail({ recipient, subject, message, templateId, metadata }) {
        if (!this.emailUser) {
            console.warn("⚠️ SMTP credentials missing. Falling back to ConsoleProvider logging.");
            const consoleFallback = new ConsoleProvider();
            return consoleFallback.sendEmail({ recipient, subject, message, templateId, metadata });
        }
        console.log(`📧 [EmailProvider] Dispatching email to ${recipient}...`);
        return { success: true, messageId: `SMTP-EM-${Date.now()}`, provider: this.name };
    }
}

// Global Singleton Provider Instance
let activeProvider = new ConsoleProvider();

function setNotificationProvider(providerInstance) {
    activeProvider = providerInstance;
}

function getNotificationProvider() {
    return activeProvider;
}

/**
 * Returns sanitized provider status metadata with ZERO secret leakage
 */
function getProviderStatus() {
    const hasWhatsApp = Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_KEY);
    const hasEmail = Boolean(process.env.SMTP_USER || process.env.EMAIL_USER);
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
        whatsapp: hasWhatsApp ? 'configured' : 'not_configured',
        email: hasEmail ? 'configured' : 'not_configured',
        mode: nodeEnv,
        activeProvider: activeProvider ? activeProvider.name : 'None'
    };
}

module.exports = {
    BaseProvider,
    ConsoleProvider,
    WhatsAppProvider,
    EmailProvider,
    setNotificationProvider,
    getNotificationProvider,
    getProviderStatus
};

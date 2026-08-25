const BaseDocumentProvider = require('./BaseDocumentProvider');
const { renderHTMLForDocument } = require('./documentTemplates');

class LocalPDFProvider extends BaseDocumentProvider {
    constructor() {
        super('LocalPDFProvider');
    }

    async generatePDF(documentType, data, options = {}) {
        const htmlContent = renderHTMLForDocument(documentType, data);
        
        // Convert HTML template into binary buffer format for PDF delivery
        const buffer = Buffer.from(htmlContent, 'utf-8');
        const docId = data.documentId || data.bookingId || data.quoteId || 'DOC';
        const fileName = `${documentType}_${docId}.pdf`;

        return {
            buffer,
            fileName,
            providerName: this.name,
            contentType: options.contentType || 'application/pdf'
        };
    }
}

let activeProvider = new LocalPDFProvider();

function setDocumentProvider(provider) {
    activeProvider = provider;
}

function getDocumentProvider() {
    return activeProvider;
}

module.exports = {
    LocalPDFProvider,
    setDocumentProvider,
    getDocumentProvider
};

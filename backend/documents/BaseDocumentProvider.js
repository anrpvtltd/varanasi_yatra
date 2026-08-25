/**
 * Base abstract document provider interface
 */
class BaseDocumentProvider {
    constructor(name) {
        this.name = name;
    }

    async generatePDF(_documentType, _data, _options = {}) {
        throw new Error(`generatePDF method not implemented in ${this.name}`);
    }
}

module.exports = BaseDocumentProvider;

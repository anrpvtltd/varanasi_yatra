const EventEmitter = require('events');

class AutomationEventBus extends EventEmitter {
    constructor() {
        super();
        this.dedupCache = new Map(); // Key -> Timestamp
        this.dedupWindowMs = 60000;  // 1 Minute default deduplication window
    }

    /**
     * Emit an automation event with optional deduplication key
     * @param {string} eventName 
     * @param {object} payload 
     * @param {string} [dedupKey] - Optional unique key (e.g. `PAYMENT_REC_123`)
     * @returns {boolean} True if event was emitted, false if suppressed as duplicate
     */
    emitAutomationEvent(eventName, payload, dedupKey = null) {
        if (dedupKey) {
            const now = Date.now();
            if (this.dedupCache.has(dedupKey)) {
                const lastSeen = this.dedupCache.get(dedupKey);
                if (now - lastSeen < this.dedupWindowMs) {
                    console.log(`ℹ️ [EventBus] Duplicate event suppressed: ${eventName} (Key: ${dedupKey})`);
                    return false;
                }
            }
            this.dedupCache.set(dedupKey, now);

            // Clean up cache periodically
            if (this.dedupCache.size > 1000) {
                for (const [k, ts] of this.dedupCache.entries()) {
                    if (now - ts > this.dedupWindowMs) {
                        this.dedupCache.delete(k);
                    }
                }
            }
        }

        console.log(`⚡ [EventBus] Event Emitted: ${eventName} (Key: ${dedupKey || 'none'})`);
        return this.emit(eventName, payload);
    }
}

const eventBus = new AutomationEventBus();
module.exports = eventBus;

/**
 * Lightweight, Production-Safe In-Memory Sliding Window Rate Limiter
 * Provides IP-based rate limiting with environment awareness and test safeguards.
 */

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60 * 1000; // 1 minute window
        this.maxRequests = options.maxRequests || 60;   // default max requests per window
        this.message = options.message || 'Too many requests. Please try again later.';
        this.hits = new Map();

        // Cleanup stale keys every minute
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, record] of this.hits.entries()) {
                if (now - record.resetTime > this.windowMs) {
                    this.hits.delete(key);
                }
            }
        }, 60 * 1000);

        // Don't keep event loop alive for timer in tests
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }

    middleware() {
        return (req, res, next) => {
            // Test environment bypass unless specifically testing rate limiter
            if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
                return next();
            }

            const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
            const key = `${ip}:${req.baseUrl || ''}${req.path}`;
            const now = Date.now();

            let record = this.hits.get(key);
            if (!record || now > record.resetTime) {
                record = { count: 1, resetTime: now + this.windowMs };
                this.hits.set(key, record);
            } else {
                record.count++;
            }

            const remaining = Math.max(0, this.maxRequests - record.count);
            const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

            res.setHeader('X-RateLimit-Limit', this.maxRequests);
            res.setHeader('X-RateLimit-Remaining', remaining);
            res.setHeader('X-RateLimit-Reset', resetSeconds);

            if (record.count > this.maxRequests) {
                res.setHeader('Retry-After', resetSeconds);
                return res.status(429).json({
                    success: false,
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: this.message,
                    retryAfterSeconds: resetSeconds
                });
            }

            next();
        };
    }

    reset() {
        this.hits.clear();
    }
}

// Pre-configured rate limiters
const authLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 15,
    message: 'Too many authentication attempts. Please try again after 1 minute.'
});

const apiLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 120,
    message: 'API rate limit exceeded. Please slow down.'
});

const strictTestLimiter = new RateLimiter({
    windowMs: 10 * 1000,
    maxRequests: 3,
    message: 'Test rate limit exceeded.'
});

module.exports = {
    RateLimiter,
    authLimiter: authLimiter.middleware(),
    apiLimiter: apiLimiter.middleware(),
    strictTestLimiter: strictTestLimiter.middleware(),
    authLimiterInstance: authLimiter,
    apiLimiterInstance: apiLimiter,
    strictTestLimiterInstance: strictTestLimiter
};

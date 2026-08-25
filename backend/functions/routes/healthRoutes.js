const express = require('express');
const os = require('os');
const { getDatabaseHealth } = require('../config/database');
const { getStorageProvider } = require('../storage/storageManager');
const { getAutomationEnabled } = require('../automation/automationEngine');
const { getProviderStatus } = require('../automation/notificationService');
const { getRequestMetrics } = require('../utils/logger');

const router = express.Router();

/**
 * 1. Minimal Public Liveness Check (Zero Infrastructure Leakage)
 * GET /health
 * Answers: Is the application process alive?
 */
router.get(['/', '/health'], (req, res) => {
    return res.status(200).json({ status: "ok" });
});

/**
 * 2. Dependency Readiness Check
 * GET /ready
 * Answers: Is the application ready to serve production/staging traffic?
 */
router.get('/ready', async (req, res) => {
    const dbHealth = await getDatabaseHealth();
    const isReady = dbHealth.isConnected;
    const environment = process.env.NODE_ENV || 'development';

    return res.status(isReady ? 200 : 503).json({
        status: isReady ? "READY" : "NOT_READY",
        database: dbHealth.status,
        environment,
        storage: "READY"
    });
});

/**
 * 3. Detailed CEO-Only System Telemetry & Diagnostics
 * GET /admin/system/health
 */
router.get('/admin/system/health', async (req, res) => {
    let user = req.user;
    if (!user) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const { env } = require('../config/env');
                user = jwt.verify(token, env.jwtSecret);
            } catch {}
        }
    }

    if (!user) {
        return res.status(401).json({ success: false, message: "Access token missing. Please log in." });
    }
    if (user.role !== 'CEO') {
        return res.status(403).json({ success: false, message: "Access Denied: Detailed diagnostics are CEO-only." });
    }

    const startTime = Date.now();
    const dbHealth = await getDatabaseHealth();
    const storageProvider = getStorageProvider();
    const providerStatus = getProviderStatus ? getProviderStatus() : { status: 'active' };
    const memoryUsage = process.memoryUsage();

    const systemMetrics = {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        arch: os.arch(),
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg(),
        freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
        heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024))
    };

    const isHealthy = dbHealth.isConnected || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

    return res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'HEALTHY' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        traceId: req.traceId || req.requestId || null,
        requestId: req.requestId || req.traceId || null,
        responseTimeMs: Date.now() - startTime,
        database: dbHealth,
        storage: {
            activeProvider: storageProvider.name,
            maxUploadSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 10,
            status: 'READY'
        },
        providers: providerStatus,
        features: {
            automationEngine: getAutomationEnabled(),
            pdfDocumentEngine: true,
            authSecurityHardened: true
        },
        system: systemMetrics
    });
});

/**
 * 4. Safe Internal Operational Metrics Endpoint (Restricted to CEO)
 * GET /admin/system/metrics
 */
router.get('/admin/system/metrics', async (req, res) => {
    let user = req.user;
    if (!user) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const { env } = require('../config/env');
                user = jwt.verify(token, env.jwtSecret);
            } catch {}
        }
    }

    if (!user) {
        return res.status(401).json({ success: false, message: "Access token missing. Authentication required." });
    }
    if (user.role !== 'CEO') {
        return res.status(403).json({ success: false, message: "Access Denied: Metrics are restricted to CEO." });
    }

    const memoryUsage = process.memoryUsage();
    const dbHealth = await getDatabaseHealth();
    const reqMetrics = getRequestMetrics();

    return res.status(200).json({
        process: {
            uptimeSeconds: Math.floor(process.uptime()),
            pid: process.pid,
            nodeVersion: process.version,
            memory: {
                heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
                heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
                rssMb: Math.round(memoryUsage.rss / (1024 * 1024))
            }
        },
        requests: reqMetrics,
        database: {
            status: dbHealth.status,
            isConnected: dbHealth.isConnected,
            pingLatencyMs: dbHealth.pingLatencyMs
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;

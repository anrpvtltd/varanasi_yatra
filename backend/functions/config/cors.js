const { validateEnvironment } = require('./env');
const env = validateEnvironment();

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isProd = process.env.NODE_ENV === 'production';
        if (!isProd || env.allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy violation: Origin '${origin}' is not in the allowed production list.`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Trace-ID'],
    credentials: true,
    maxAge: 86400
};

module.exports = {
    corsOptions
};

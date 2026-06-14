require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const errorHandler = require('./common/middlewares/errorHandlerMiddleware');
const logger = require('./common/utils/logger');
const { attachRequestContext } = require('./common/utils/requestContext');
const { sendSuccess } = require('./common/utils/apiResponse');

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.APP_HOST || 'localhost';
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5174'];

const parseAllowedOrigins = () => {
     const configuredValue = String(process.env.CORS_ALLOWED_ORIGINS || '').trim();
     let configuredOrigins = [];

     if (configuredValue) {
          try {
               const parsedOrigins = JSON.parse(configuredValue);
               configuredOrigins = Array.isArray(parsedOrigins) ? parsedOrigins : [];
          } catch (error) {
               configuredOrigins = configuredValue.split(',');
          }
     }

     configuredOrigins = configuredOrigins.map((origin) => origin.trim()).filter(Boolean);

     return new Set([...defaultOrigins, ...configuredOrigins]);
};

const allowedOrigins = parseAllowedOrigins();

const securityHeaders = (req, res, next) => {
     res.setHeader('X-Content-Type-Options', 'nosniff');
     res.setHeader('X-Frame-Options', 'DENY');
     res.setHeader('Referrer-Policy', 'no-referrer');
     res.setHeader('X-XSS-Protection', '0');
     next();
};

const corsOptions = {
     origin(origin, callback) {
          if (!origin) return callback(null, true);

          // Allow all origins in non-production (local dev) or when explicitly enabled
          if (process.env.CORS_ALLOW_ALL === 'true' || process.env.NODE_ENV !== 'production') {
               return callback(null, true);
          }

          if (allowedOrigins.has(origin)) {
               return callback(null, true);
          }

          // Accept common local/lan hostnames and IP ranges (useful for dev on different hosts)
          try {
               const parsed = new URL(origin);
               const host = parsed.hostname;

               if (
                    host === 'localhost' ||
                    host === '::1' ||
                    host === '127.0.0.1' ||
                    /^10\./.test(host) ||
                    /^192\.168\./.test(host) ||
                    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
               ) {
                    return callback(null, true);
               }
          } catch (e) {
               // If URL parsing fails, fall through to block
          }

          logger.warn('Blocked CORS origin', { origin });
          return callback(new Error('Origin not allowed by CORS'));
     },
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-File-Name', 'X-Folder-Path', 'X-Message', 'X-Reply-Only', 'X-Status'],
     credentials: true
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(attachRequestContext);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use((req, res, next) => {
     const isBidFileUpload = req.method === 'POST' && /^(?:\/employee)?\/admin\/bids\/\d+(?:\/folders\/\d+)?\/files\/?$/.test(req.path);
     const isGalleryFileUpload = req.method === 'POST' && /^(?:\/employee)?\/admin\/bids\/\d+\/gallery\/\d+\/photos\/?$/.test(req.path);
     const isSubmittalVersionUpload = req.method === 'POST' && /^(?:\/employee)?\/admin\/bids\/\d+\/submittals\/\d+\/versions\/?$/.test(req.path);
     const isRfiHistoryUpload = req.method === 'POST' && /^(?:\/employee)?\/admin\/bids\/\d+\/rfis\/\d+\/history\/?$/.test(req.path);
     if (!isBidFileUpload && !isGalleryFileUpload && !isSubmittalVersionUpload && !isRfiHistoryUpload) {
          return next();
     }

     return express.raw({ type: '*/*', limit: '50mb' })(req, res, next);
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.use((req, res, next) => {
     logger.info('Incoming request', {
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          ip: req.ip
     });
     next();
});

app.get('/health', async (req, res, next) => {
     try {
          await db.query('SELECT 1');
          return sendSuccess(res, 'Service is healthy', {
               uptime: process.uptime()
          });
     } catch (error) {
          error.statusCode = 503;
          return next(error);
     }
});

app.use('/employee/auth', require('./employee/routes/authRoute'));
app.use('/employee/admin', require('./employee/routes/adminRoute'));
app.use('/employee/client', require('./employee/routes/clientRoute'));

app.use('/vendor/auth', require('./vendor/routes/authRoute'));
app.use('/vendor/dashboard', require('./vendor/routes/dashboardRoute'));

app.use((req, res, next) => {
     const error = new Error(`Not Found - ${req.originalUrl}`);
     error.statusCode = 404;
     next(error);
});

app.use(errorHandler);

app.listen(port, host, () => {
     // logger.info('Server started successfully', { host, port });
});

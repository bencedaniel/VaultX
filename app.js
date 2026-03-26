import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './database/db.js';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import MongoStore from "connect-mongo";
import { logger, logInfo, logWarn, logError } from './logger.js';
import { HTTP_STATUS, MESSAGES } from './config/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { JWT_CONFIG, COOKIE_CONFIG } from './config/index.js';
import { MONGODB_URI, PORT, SECRET_ACCESS_TOKEN, SECURE_MODE, SECRET_API_KEY, TESTDB, TRUST_PROXY, DOMAIN, TIMEOUT,BACKUP_CONTAINER} from './config/env.js';
import Event from './models/Event.js';
import Alert from './models/Alert.js';
import { StoreUserWithoutValidation } from './middleware/Verify.js';
import setupRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { log } from 'console';

// ============================================
// INITIALIZATION
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version = '1.1.0a';

const app = express();

// Validate environment variables
if (!MONGODB_URI || !PORT || !SECRET_ACCESS_TOKEN || !SECRET_API_KEY || !TRUST_PROXY || !DOMAIN || !TIMEOUT || !BACKUP_CONTAINER) {
  logError('ENV_VALIDATION', 'Missing required environment variables ');
  process.exit(1);
} else {
  logInfo('All required environment variables are set');
}


connectDB(); // Database connection

// ============================================
// VIEW ENGINE CONFIGURATION
// ============================================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', TRUST_PROXY === 'true'); // Enable if behind a proxy (e.g., Heroku, Nginx)

// ============================================
// GLOBAL MIDDLEWARE - ORDER MATTERS
// ============================================

// 1. Logging & Security
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.disable('x-powered-by');
app.use(cookieParser());

// Security headers to prevent crawling of sensitive pages
app.use((req, res, next) => {
  // Apply X-Robots-Tag to sensitive paths
  const sensitivePaths = ['/login', '/scoring', '/office', '/scoresheet', '/admin'];
  if (sensitivePaths.some(path => req.path.startsWith(path))) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// 2. Static files
app.use('/static', express.static(path.join(__dirname, '/static')));

// 3. Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(session({
  secret: SECRET_API_KEY,            // titkos kulcs a session-hoz
  resave: false,                // csak ha változott a session, mentsük
  saveUninitialized: false,
       // üres session-t ne mentsünk
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: "sessions",
    touchAfter: 24 * 3600 // resave session every 24 hours (lazy session update)
  }),
  cookie: { 
    ...COOKIE_CONFIG.OPTIONS,
    maxAge: JWT_CONFIG.SESSION_MAX_AGE, // 1 nap
    secure: SECURE_MODE !== 'true'             // élesben: true
  }
}));

// 5. Request logging
app.use((req, res, next) => {
  res.on('finish', () => {
    const userInfo = req.user ? req.user.username || req.user._id : 'Anonymous';
    logInfo(
      `${req.method} ${req.originalUrl} - ${req.ip} - User-Agent: ${req.get('User-Agent')} - User: ${userInfo}`
    );
  });
  next();
});

// 6. Global context middleware
app.use(async (req, res, next) => {
  try {
    res.locals.test = TESTDB === 'true';
    res.locals.alerts = await Alert.find({ active: true }).populate('permission');
    res.locals.parent = '/dashboard';
    res.locals.selectedEvent = await Event.findOne({ selected: true });
    res.locals.version = version;
    res.locals.timeout = parseInt(TIMEOUT, 10);
    res.locals.backup_container = BACKUP_CONTAINER === 'true';
    next();
  } catch (err) {
    logError('GLOBAL_MIDDLEWARE', `Error in global middleware: ${err}`);
    res.locals.alerts = [];
    res.locals.test = false;
    res.locals.parent = '/dashboard';
    res.locals.selectedEvent = null;
    res.locals.version = version;
    res.locals.timeout = parseInt(TIMEOUT, 10);
    res.locals.backup_container = BACKUP_CONTAINER === 'true';
    next();
  }
});

// ============================================
// ROUTES INITIALIZATION
// ============================================
setupRoutes(app);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 Not Found handler
app.use(StoreUserWithoutValidation);
app.use((req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).render('errorpage', {
    rolePermissons: req.user?.role?.permissions,
    errorCode: HTTP_STATUS.NOT_FOUND,
    failMessage: req.session?.failMessage || MESSAGES.ERROR.PAGE_NOT_FOUND,
    message: MESSAGES.ERROR.PAGE_NOT_FOUND,
    user: req.user,
    successMessage: req.session?.successMessage
  });
});

// 404 handler - must be before error handler
app.use((req, res, next) => {
  req.session.failMessage = MESSAGES.ERROR.PAGE_NOT_FOUND;
  res.status(HTTP_STATUS.NOT_FOUND).render('errorpage', {
    rolePermissons: req.user?.role?.permissions,
    errorCode: HTTP_STATUS.NOT_FOUND,
    failMessage: req.session.failMessage,
    message: MESSAGES.ERROR.PAGE_NOT_FOUND,
    user: req.user,
    successMessage: null
  });
});

// Error handling - must be last
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  logInfo('---------------------------------------------');
  logInfo('VaultingEventEcosystemScoring server startup');
  logInfo(`Start time: ${new Date().toISOString()}`);
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logWarn('VERSION', `Version: ${version}`);
  logInfo(`Port: ${PORT}`);
  logInfo(`Node.js version: ${process.version}`);
  logInfo(`MongoDB: ${MONGODB_URI ? 'connected' : 'NOT SET'}`);
  logWarn('SECURE_MODE', `Secure mode: ${SECURE_MODE}`);
  logWarn('TEST_DB', `Test DB: ${TESTDB === 'true' ? 'ACTIVE' : 'inactive'}`);
  logInfo(`Trust Proxy: ${TRUST_PROXY}`);
  logInfo(`Domain: ${DOMAIN}`);
  logInfo(`Timeout: ${TIMEOUT} minutes`);
  logWarn('BACKUP_CONTAINER', `Backup Container: ${BACKUP_CONTAINER ? 'ENABLED' : 'disabled'}`);
  logInfo('---------------------------------------------');
  logInfo(
    `Server running at ${process.env.NODE_ENV === 'development'
      ? `http://localhost:${PORT}`
      : `https://${DOMAIN}`}`
  );
});

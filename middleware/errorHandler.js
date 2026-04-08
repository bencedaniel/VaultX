import { logError, logValidation } from '../logger.js';
import { MESSAGES } from '../config/index.js';
import { HTTP_STATUS } from '../config/index.js';

/**
 * Egyedi alkalmazás hibaosztály (alap hibakezeléshez).
 * @class
 * @extends Error
 * @param {string} message - Hibaüzenet.
 * @param {number} [statusCode=500] - HTTP státuszkód.
 * @param {string} [type='ERROR'] - Hibatípus.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, type = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validációs hiba (HTTP 400)
 * @class
 * @extends AppError
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * Nem található hiba (HTTP 404)
 * @class
 * @extends AppError
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Jogosultsági hiba (HTTP 401)
 * @class
 * @extends AppError
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Adatbázis/Mongoose hiba (HTTP 500)
 * @class
 * @extends AppError
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database error occurred') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * Duplikált kulcs hiba (HTTP 400)
 * @class
 * @extends AppError
 */
export class DuplicateError extends AppError {
  constructor(field = 'field') {
    super(`${field} already exists`, 400, 'DUPLICATE_ERROR');
  }
}

/**
 * Cast hiba (érvénytelen ObjectId vagy típuskonverzió, HTTP 400)
 * @class
 * @extends AppError
 */
export class CastError extends AppError {
  constructor(field = 'ID') {
    super(`Invalid ${field}`, 400, 'CAST_ERROR');
  }
}

/**
 * Központi hibakezelő Express middleware-hez.
 * Minden route-ból érkező hibát egységesen kezel, naplóz és visszairányítja a felhasználót.
 * Kezeli az Express, Mongoose és egyedi hibákat is.
 * @param {Error} err - A dobott hibaobjektum.
 * @param {Request} req - Express kérés objektum.
 * @param {Response} res - Express válasz objektum.
 * @param {Function} next - Express next függvény.
 * @returns {Response} Átirányítás hibával a referer oldalra.
 */
export function errorHandler(err, req, res, next) {
  // Alapértelmezett hibaértékek
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    type: err.type || 'INTERNAL_ERROR'
  };

  // Hibák naplózása felhasználói kontextussal
  const userInfo = req.user ? `${req.user.username}` : 'unknown';
  logError(error.type, error.message, `User: ${userInfo}`);

  // =============================
  // MONGOOSE VALIDÁCIÓS HIBÁK
  // =============================
  // Séma validációs hibák (kötelező mezők, enum, stb.)
  if (err.name === 'ValidationError') {
    const fields = Object.keys(err.errors);
    const messages = Object.entries(err.errors)
      .map(([field, error]) => {
        // Egyedi validációs üzenet, ha van
        if (error.message) return error.message;
        switch (error.kind) {
          case 'required':
            return `${field} is required`;
          case 'enum':
            return `${field} must be one of: ${error.enumValues?.join(', ')}`;
          case 'minlength':
            return `${field} must be at least ${error.minlength} characters`;
          case 'maxlength':
            return `${field} must not exceed ${error.maxlength} characters`;
          case 'min':
            return `${field} must be at least ${error.min}`;
          case 'max':
            return `${field} must not exceed ${error.max}`;
          case 'regex':
            return `${field} format is invalid`;
          default:
            return error.message || `${field} validation failed`;
        }
      })
      .join('; ');

    // Validációs hiba naplózása
    logValidation('MONGOOSE_VALIDATION', `Fields: ${fields.join(', ')}`, {
      user: userInfo,
      errors: err.errors
    });

    error = {
      statusCode: 400,
      message: messages,
      type: 'VALIDATION_ERROR',
      fields: err.errors
    };
  }

  // Duplikált kulcs hiba (egyedi mező megsértése)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = {
      statusCode: 400,
      message: `${field} "${value}" already exists`,
      type: 'DUPLICATE_ERROR',
      field: field
    };
  }

  // CastError - érvénytelen MongoDB ObjectId vagy típuskonverziós hiba
  if (err.name === 'CastError') {
    error = {
      statusCode: 400,
      message: `Invalid ${err.kind}: ${err.value}`,
      type: 'CAST_ERROR'
    };
  }

  // =============================
  // JWT & AUTHENTIKÁCIÓS HIBÁK
  // =============================
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: MESSAGES.AUTH.INVALID_TOKEN,
      type: 'AUTH_ERROR'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: MESSAGES.AUTH.SESSION_EXPIRED,
      type: 'TOKEN_EXPIRED'
    };
  }

  // MongoDB hálózati hiba
  if (err.name === 'MongoNetworkError') {
    error = {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: MESSAGES.ERROR.DATABASE_ERROR || 'Database connection error',
      type: 'DATABASE_ERROR'
    };
  }

  // =============================
  // VÁLASZ KÜLDÉSE
  // =============================
  // Mindig beállítjuk a hibát a session-ben
  req.session.failMessage = error.message;
  // Visszairányítás az előző oldalra (vagy dashboardra)
  const referer = req.get('referer') || '/dashboard';
  return res.redirect(referer);
}

/**
 * Aszinkron hibakezelő wrapper controllerekhez.
 * Kiváltja a try-catch blokkokat, minden hibát automatikusan továbbad a hibakezelőnek.
 * @param {Function} fn - Aszinkron controller vagy middleware függvény.
 * @returns {Function} Express middleware, amely automatikusan kezeli az aszinkron hibákat.
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

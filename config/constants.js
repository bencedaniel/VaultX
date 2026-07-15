
/**
 * Application-wide constants.
 *
 * This module centralizes shared numeric and string values so they can be
 * reused consistently across controllers, services, and middleware.
 */

/**
 * Standard HTTP status codes used by API responses.
 */
export const HTTP_STATUS = {
  // 2xx: successful requests
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // 4xx: client-side errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  UNPROCESSABLE_ENTITY: 422,

  // 5xx: server-side errors
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503
};

/**
 * JWT and session-related timing values.
 */
export const JWT_CONFIG = {
  // Default session lifetime for token-based authentication.
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  // Default cookie lifetime mirrors the session lifetime unless overridden.
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000
};

/**
 * Cookie defaults used when issuing authentication cookies.
 */
export const COOKIE_CONFIG = {
  TOKEN_NAME: 'token',
  OPTIONS: {
    httpOnly: true,
    sameSite: 'lax'
    // `secure` is enabled dynamically when the app runs in secure mode.
  }
};

/**
 * Pagination defaults used when no explicit query parameters are provided.
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
};

/**
 * File upload limits and accepted MIME types.
 */
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword']
};

/**
 * Validation thresholds shared across request validators.
 */
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PERCENTAGE_SUM_REQUIRED: 100
};

/**
 * Time constants expressed in milliseconds.
 */
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

/**
 * Database operation labels used for structured logging and auditing.
 */
export const DB_OPERATIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  FIND: 'FIND',
  COUNT: 'COUNT'
};



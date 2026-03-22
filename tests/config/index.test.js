import {
  MESSAGES,
  HTTP_STATUS,
  JWT_CONFIG,
  COOKIE_CONFIG,
  PAGINATION,
  FILE_UPLOAD,
  VALIDATION,
  TIME,
  DB_OPERATIONS,
} from '../../config/index.js';

import {
  MONGODB_URI,
  PORT,
  SECRET_ACCESS_TOKEN,
  SECURE_MODE,
  SECRET_API_KEY,
  TESTDB,
  TRUST_PROXY,
  DOMAIN,
  TIMEOUT,
} from '../../config/env.js';

describe('config exports contract', () => {
  test('re-exports core message and constants objects', () => {
    expect(MESSAGES).toBeDefined();
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(JWT_CONFIG.SESSION_MAX_AGE).toBeGreaterThan(0);
    expect(COOKIE_CONFIG.TOKEN_NAME).toBe('token');
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
    expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/png');
    expect(VALIDATION.PERCENTAGE_SUM_REQUIRED).toBe(100);
    expect(TIME.MINUTE).toBe(60000);
    expect(DB_OPERATIONS.CREATE).toBe('CREATE');
  });

  test('env module exports all required keys', () => {
    expect(MONGODB_URI).toBeDefined();
    expect(PORT).toBeDefined();
    expect(SECRET_ACCESS_TOKEN).toBeDefined();
    expect(SECRET_API_KEY).toBeDefined();
    expect(SECURE_MODE).toBeDefined();
    expect(TESTDB).toBeDefined();
    expect(TRUST_PROXY).toBeDefined();
    expect(DOMAIN).toBeDefined();
    expect(TIMEOUT).toBeDefined();
  });
});

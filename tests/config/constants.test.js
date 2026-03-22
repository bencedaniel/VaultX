import {
  HTTP_STATUS,
  JWT_CONFIG,
  COOKIE_CONFIG,
  PAGINATION,
  FILE_UPLOAD,
  VALIDATION,
  TIME,
  DB_OPERATIONS,
} from '../../config/constants.js';

describe('config/constants', () => {
  test('exports expected HTTP status codes', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
  });

  test('exports JWT and cookie defaults', () => {
    expect(JWT_CONFIG.SESSION_MAX_AGE).toBe(24 * 60 * 60 * 1000);
    expect(JWT_CONFIG.COOKIE_MAX_AGE).toBe(24 * 60 * 60 * 1000);

    expect(COOKIE_CONFIG.TOKEN_NAME).toBe('token');
    expect(COOKIE_CONFIG.OPTIONS).toEqual({
      httpOnly: true,
      sameSite: 'lax',
    });
  });

  test('exports pagination, validation, time and DB constants', () => {
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(10);
    expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);

    expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(8);
    expect(VALIDATION.USERNAME_MIN_LENGTH).toBe(3);
    expect(VALIDATION.USERNAME_MAX_LENGTH).toBe(50);
    expect(VALIDATION.PERCENTAGE_SUM_REQUIRED).toBe(100);

    expect(TIME.SECOND).toBe(1000);
    expect(TIME.MINUTE).toBe(60 * 1000);
    expect(TIME.HOUR).toBe(60 * 60 * 1000);
    expect(TIME.DAY).toBe(24 * 60 * 60 * 1000);

    expect(DB_OPERATIONS).toEqual({
      CREATE: 'CREATE',
      READ: 'READ',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      FIND: 'FIND',
      COUNT: 'COUNT',
    });
  });

  test('exports upload configuration arrays', () => {
    expect(FILE_UPLOAD.MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
    expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/png');
    expect(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES).toContain('application/pdf');
  });
});

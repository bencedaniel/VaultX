import { logError, logValidation } from '../../logger.js';
import { MESSAGES, HTTP_STATUS } from '../../config/index.js';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  DuplicateError,
  CastError,
  errorHandler,
  catchAsync
} from '../../middleware/errorHandler.js';

jest.mock('../../logger.js', () => ({
  logError: jest.fn(),
  logValidation: jest.fn()
}));

describe('middleware/errorHandler - custom errors', () => {
  test('AppError stores message, statusCode and type', () => {
    const err = new AppError('boom', 418, 'TEAPOT');

    expect(err.message).toBe('boom');
    expect(err.statusCode).toBe(418);
    expect(err.type).toBe('TEAPOT');
    expect(err).toBeInstanceOf(Error);
  });

  test('specialized errors use expected defaults', () => {
    expect(new ValidationError('bad input')).toMatchObject({
      message: 'bad input',
      statusCode: 400,
      type: 'VALIDATION_ERROR'
    });
    expect(new NotFoundError()).toMatchObject({
      message: 'Resource not found',
      statusCode: 404,
      type: 'NOT_FOUND'
    });
    expect(new UnauthorizedError()).toMatchObject({
      message: 'Unauthorized',
      statusCode: 401,
      type: 'UNAUTHORIZED'
    });
    expect(new DatabaseError()).toMatchObject({
      message: 'Database error occurred',
      statusCode: 500,
      type: 'DATABASE_ERROR'
    });
    expect(new DuplicateError('username')).toMatchObject({
      message: 'username already exists',
      statusCode: 400,
      type: 'DUPLICATE_ERROR'
    });
    expect(new CastError()).toMatchObject({
      message: 'Invalid ID',
      statusCode: 400,
      type: 'CAST_ERROR'
    });
  });
});

describe('middleware/errorHandler - middleware behavior', () => {
  const buildReqRes = ({
    user = { username: 'tester' },
    referer = '/previous'
  } = {}) => {
    const req = {
      user,
      session: {},
      get: jest.fn().mockImplementation(header => {
        if (header === 'referer') return referer;
        return undefined;
      })
    };
    const res = {
      redirect: jest.fn(path => path)
    };

    return { req, res };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles generic AppError and redirects to referer', () => {
    const { req, res } = buildReqRes();
    const err = new AppError('oops', 400, 'SOME_ERROR');

    const result = errorHandler(err, req, res, jest.fn());

    expect(logError).toHaveBeenCalledWith('SOME_ERROR', 'oops', 'User: tester');
    expect(req.session.failMessage).toBe('oops');
    expect(res.redirect).toHaveBeenCalledWith('/previous');
    expect(result).toBe('/previous');
  });

  test('uses unknown user context when req.user is missing', () => {
    const { req, res } = buildReqRes({ user: null });

    errorHandler(new Error('x'), req, res, jest.fn());

    expect(logError).toHaveBeenCalledWith('INTERNAL_ERROR', 'x', 'User: unknown');
  });

  test('maps mongoose ValidationError and logs validation details', () => {
    const { req, res } = buildReqRes();
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is invalid' },
        age: { kind: 'min', min: 18 }
      }
    };

    errorHandler(err, req, res, jest.fn());

    expect(logValidation).toHaveBeenCalledWith(
      'MONGOOSE_VALIDATION',
      'Fields: email, age',
      { user: 'tester', errors: err.errors }
    );
    expect(req.session.failMessage).toBe('Email is invalid; age must be at least 18');
    expect(res.redirect).toHaveBeenCalledWith('/previous');
  });

  test('maps duplicate key error (11000)', () => {
    const { req, res } = buildReqRes();
    const err = {
      code: 11000,
      keyValue: { username: 'alice' }
    };

    errorHandler(err, req, res, jest.fn());

    expect(req.session.failMessage).toBe('username "alice" already exists');
    expect(res.redirect).toHaveBeenCalledWith('/previous');
  });

  test('maps cast error', () => {
    const { req, res } = buildReqRes();
    const err = {
      name: 'CastError',
      kind: 'ObjectId',
      value: 'abc'
    };

    errorHandler(err, req, res, jest.fn());

    expect(req.session.failMessage).toBe('Invalid ObjectId: abc');
    expect(res.redirect).toHaveBeenCalledWith('/previous');
  });

  test('maps JWT errors to auth messages', () => {
    const { req, res } = buildReqRes();

    errorHandler({ name: 'JsonWebTokenError' }, req, res, jest.fn());
    expect(req.session.failMessage).toBe(MESSAGES.AUTH.INVALID_TOKEN);

    errorHandler({ name: 'TokenExpiredError' }, req, res, jest.fn());
    expect(req.session.failMessage).toBe(MESSAGES.AUTH.SESSION_EXPIRED);
  });

  test('maps mongo network error to service unavailable message', () => {
    const { req, res } = buildReqRes();
    const err = { name: 'MongoNetworkError' };

    errorHandler(err, req, res, jest.fn());

    expect(req.session.failMessage).toBe('Database connection error');
    expect(res.redirect).toHaveBeenCalledWith('/previous');
  });

  test('falls back to /dashboard when referer is missing', () => {
    const { req, res } = buildReqRes({ referer: null });

    errorHandler(new Error('fallback'), req, res, jest.fn());

    expect(res.redirect).toHaveBeenCalledWith('/dashboard');
  });

  test('JWT mapping uses unauthorized HTTP status constant', () => {
    const { req, res } = buildReqRes();

    errorHandler({ name: 'JsonWebTokenError' }, req, res, jest.fn());

    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
  });
});

describe('middleware/errorHandler - catchAsync', () => {
  test('passes resolved handlers through', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    const fn = jest.fn().mockResolvedValue('ok');
    const wrapped = catchAsync(fn);

    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('forwards rejected async handlers to next', async () => {
    const err = new Error('wrapped error');
    const next = jest.fn();
    const wrapped = catchAsync(async () => {
      throw err;
    });

    await wrapped({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(err);
  });
});

import { jest } from '@jest/globals';
import Validate from '../../middleware/Validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { logValidation } from '../../logger.js';
import { validationResult } from 'express-validator';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('../../logger.js', () => ({
  logValidation: jest.fn(),
  logError: jest.fn(),
  logger: { db: jest.fn() },
}));

describe('middleware/index integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Validate short-circuits chain when validation fails', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn(() => false),
      array: jest.fn(() => [{ msg: 'Bad payload' }]),
    });

    const req = {
      originalUrl: '/form',
      session: {},
      body: { name: '' },
      user: { username: 'judge1' },
    };
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    Validate(req, res, next);

    expect(logValidation).toHaveBeenCalledWith('FIELD_VALIDATION', 'Bad payload', {
      user: 'judge1',
    });
    expect(req.session.failMessage).toBe('Bad payload');
    expect(req.session.formData).toEqual({ name: '' });
    expect(res.redirect).toHaveBeenCalledWith('/form');
    expect(next).not.toHaveBeenCalled();
  });

  test('Validate success + asyncHandler error reaches errorHandler redirect flow', async () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn(() => true),
    });

    const req = {
      originalUrl: '/edit',
      session: {},
      body: { name: 'ok' },
      user: { username: 'judge1' },
      get: jest.fn(() => '/back'),
    };
    const res = {
      redirect: jest.fn(),
    };

    const nextValidate = jest.fn();
    Validate(req, res, nextValidate);
    expect(nextValidate).toHaveBeenCalledTimes(1);

    const boom = new Error('controller failed');
    const wrapped = asyncHandler(async () => {
      throw boom;
    });

    const nextAsync = jest.fn();
    await expect(wrapped(req, res, nextAsync)).rejects.toBe(boom);
    expect(nextAsync).toHaveBeenCalledWith(boom);

    errorHandler(boom, req, res, jest.fn());
    expect(req.session.failMessage).toBe('controller failed');
    expect(res.redirect).toHaveBeenCalledWith('/back');
  });
});

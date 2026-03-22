import { validationResult } from 'express-validator';
import Validate from '../../middleware/Validate.js';
import { logValidation } from '../../logger.js';

jest.mock('express-validator');
jest.mock('../../logger.js', () => ({
  logValidation: jest.fn()
}));

describe('middleware/Validate', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      originalUrl: '/form',
      session: {},
      body: { email: 'test@example.com', name: 'John' },
      user: { username: 'judge1' }
    };

    res = { redirect: jest.fn(path => path) };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('calls validationResult with req', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true)
    });

    Validate(req, res, next);

    expect(validationResult).toHaveBeenCalledWith(req);
  });

  test('on success calls next and does not touch session error fields', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true)
    });

    Validate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(logValidation).not.toHaveBeenCalled();
    expect(req.session.failMessage).toBeUndefined();
    expect(req.session.formData).toBeUndefined();
  });

  test('on failure joins messages, logs validation, stores session data and redirects', () => {
    const errors = [
      { msg: 'Email is invalid' },
      { msg: 'Name is required' }
    ];
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    const result = Validate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(logValidation).toHaveBeenCalledWith(
      'FIELD_VALIDATION',
      'Email is invalid, Name is required',
      { user: 'judge1' }
    );
    expect(req.session.failMessage).toBe('Email is invalid, Name is required');
    expect(req.session.formData).toEqual(req.body);
    expect(res.redirect).toHaveBeenCalledWith('/form');
    expect(result).toBe('/form');
  });

  test('logs with undefined user when req.user is missing', () => {
    req.user = undefined;
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([{ msg: 'Invalid data' }])
    });

    Validate(req, res, next);

    expect(logValidation).toHaveBeenCalledWith('FIELD_VALIDATION', 'Invalid data', { user: undefined });
  });

  test('preserves existing session keys while setting failMessage and formData', () => {
    req.session = { auth: true, locale: 'hu' };
    req.body = { nested: { x: 1 }, list: [1, 2] };
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([{ msg: 'Bad payload' }])
    });

    Validate(req, res, next);

    expect(req.session.auth).toBe(true);
    expect(req.session.locale).toBe('hu');
    expect(req.session.failMessage).toBe('Bad payload');
    expect(req.session.formData).toEqual({ nested: { x: 1 }, list: [1, 2] });
  });

  test('handles empty error array by setting empty fail message', () => {
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue([])
    });

    Validate(req, res, next);

    expect(req.session.failMessage).toBe('');
    expect(res.redirect).toHaveBeenCalledWith('/form');
  });
});

import asyncHandler, { asyncHandler as namedAsyncHandler } from '../../middleware/asyncHandler.js';

describe('middleware/asyncHandler', () => {
  test('exports default and named function', () => {
    expect(typeof asyncHandler).toBe('function');
    expect(namedAsyncHandler).toBe(asyncHandler);
  });

  test('returns an express-style middleware function', () => {
    const wrapped = asyncHandler(async () => {});

    expect(typeof wrapped).toBe('function');
    expect(wrapped.length).toBe(3);
  });

  test('passes req/res/next through to wrapped handler', async () => {
    const req = { id: 'req1' };
    const res = { json: jest.fn() };
    const next = jest.fn();
    const fn = jest.fn(async (r, s, n) => {
      expect(r).toBe(req);
      expect(s).toBe(res);
      expect(n).toBe(next);
      s.json({ ok: true });
    });

    const wrapped = asyncHandler(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  test('resolves non-promise handler return values', async () => {
    const wrapped = asyncHandler(() => 42);

    await expect(wrapped({}, {}, jest.fn())).resolves.toBe(42);
  });

  test('on async throw: calls next(err) and rethrows same error', async () => {
    const err = new Error('boom');
    const next = jest.fn();
    const wrapped = asyncHandler(async () => {
      throw err;
    });

    await expect(wrapped({}, {}, next)).rejects.toBe(err);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(err);
  });

  test('on sync throw: throws immediately and does not call next', () => {
    const err = new TypeError('sync boom');
    const next = jest.fn();
    const wrapped = asyncHandler(() => {
      throw err;
    });

    expect(() => wrapped({}, {}, next)).toThrow(err);
    expect(next).not.toHaveBeenCalled();
  });

  test('if next is not a function, still rethrows but does not try to call next', async () => {
    const err = new Error('no next');
    const wrapped = asyncHandler(async () => {
      throw err;
    });

    await expect(wrapped({}, {}, undefined)).rejects.toBe(err);
  });
});

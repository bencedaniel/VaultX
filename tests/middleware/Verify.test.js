import jwt from 'jsonwebtoken';
import {
  Verify,
  VerifyNoerror,
  VerifyRole,
  UserIDValidator,
  StoreUserWithoutValidation,
  CheckLoggedIn
} from '../../middleware/Verify.js';
import { COOKIE_CONFIG, HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
  isTokenBlacklisted,
  blacklistToken,
  findUserByIdWithRole,
  getRoleWithPermissions
} from '../../DataServices/authMiddlewareData.js';
import { getHelpMessagebyUri } from '../../DataServices/helpMessageData.js';
import { logAuth, logError, logWarn } from '../../logger.js';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

jest.mock('../../config/env.js', () => ({
  SECRET_ACCESS_TOKEN: 'secret-token',
  SECURE_MODE: 'true',
  TIMEOUT: '30'
}));

jest.mock('../../DataServices/authMiddlewareData.js', () => ({
  isTokenBlacklisted: jest.fn(),
  blacklistToken: jest.fn(),
  findUserByIdWithRole: jest.fn(),
  getRoleWithPermissions: jest.fn()
}));


jest.mock('../../logger.js', () => ({
  logAuth: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn()
}));

jest.mock('../../DataServices/helpMessageData.js', () => ({
  getHelpMessagebyUri: jest.fn()
}));


describe('middleware/Verify', () => {
    // Mock getHelpMessagebyUri for helpMessage population test
    jest.mock('../../DataServices/helpMessageData.js', () => ({
      ...jest.requireActual('../../DataServices/helpMessageData.js'),
      getHelpMessagebyUri: jest.fn()
    }));
  const createReqRes = ({
    accept = 'application/json',
    tokenInCookie,
    authorization,
    cookieHeader,
    originalUrl = '/target',
    user,
    params = {}
  } = {}) => {
    const req = {
      cookies: tokenInCookie ? { token: tokenInCookie } : {},
      headers: {
        accept,
        ...(authorization ? { authorization } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {})
      },
      session: {},
      originalUrl,
      params,
      user,
      get: jest.fn(header => {
        if (header === 'Referer') return '/from-referer';
        return undefined;
      })
    };

    const res = {
      status: jest.fn(function status() {
        return this;
      }),
      json: jest.fn(function json(body) {
        return body;
      }),
      send: jest.fn(function send(body) {
        return body;
      }),
      sendStatus: jest.fn(function sendStatus(code) {
        return code;
      }),
      redirect: jest.fn(function redirect(path) {
        return path;
      }),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      locals: {},
      render: jest.fn(function render(view, options) {
        // Csak azt ellenőrizzük, hogy a megfelelő template renderelődik
        expect(view).toBe('errorpage');
        expect(options).toEqual(expect.objectContaining({ errorCode: 401, message: MESSAGES.AUTH.SESSION_EXPIRED }));
      })
    };

    return { req, res, next: jest.fn() };
  };

  const activeUser = {
    _id: 'u1',
    username: 'john',
    active: true,
    _doc: {
      _id: 'u1',
      username: 'john',
      role: 'judge',
      password: 'secret'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isTokenBlacklisted.mockResolvedValue(false);
    findUserByIdWithRole.mockResolvedValue(activeUser);
    jwt.verify.mockReturnValue({ id: 'u1' });
    jwt.sign.mockReturnValue('new-token');
  });

  describe('Verify', () => {
        test('sets res.locals.helpMessage from getHelpMessagebyUri', async () => {
          const { req, res, next } = createReqRes({ tokenInCookie: 'ok-token', originalUrl: '/test-url' });
          const fakeHelp = { HelpMessage: 'Teszt súgó', style: 'info', url: '/test-url', active: true };
          getHelpMessagebyUri.mockResolvedValueOnce(fakeHelp);

          await Verify(req, res, next);

          expect(getHelpMessagebyUri).toHaveBeenCalledWith('/test-url');
          expect(res.locals.helpMessage).toEqual(fakeHelp);
          expect(next).toHaveBeenCalledTimes(1);
        });
    test('returns unauthorized JSON when token is missing', async () => {
      const { req, res, next } = createReqRes();

      await Verify(req, res, next);

      expect(logAuth).toHaveBeenCalledWith('VERIFY_TOKEN', 'unknown', false, 'TOKEN_MISSING');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.SESSION_EXPIRED
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns unauthorized HTML when token is missing and browser request', async () => {
      const { req, res, next } = createReqRes({ accept: 'text/html,application/xhtml+xml' });

      await Verify(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.render).toHaveBeenCalledWith('errorpage', { errorCode: 401, message: MESSAGES.AUTH.SESSION_EXPIRED });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns unauthorized when token is blacklisted', async () => {
      isTokenBlacklisted.mockResolvedValue(true);
      const { req, res, next } = createReqRes({ tokenInCookie: 'blocked-token' });

      await Verify(req, res, next);

      expect(logAuth).toHaveBeenCalledWith('VERIFY_TOKEN', 'unknown', false, 'TOKEN_BLACKLISTED');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.SESSION_LOGGED_OUT
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns unauthorized when jwt verification fails', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });
      const { req, res, next } = createReqRes({ tokenInCookie: 'bad-token' });

      await Verify(req, res, next);

      expect(logError).toHaveBeenCalledWith('TOKEN_VERIFICATION_FAILED', 'invalid signature', 'Token validation');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.INVALID_TOKEN
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns unauthorized when user is not found', async () => {
      findUserByIdWithRole.mockResolvedValue(null);
      const { req, res, next } = createReqRes({ tokenInCookie: 'ok-token' });

      await Verify(req, res, next);

      expect(logAuth).toHaveBeenCalledWith('VERIFY_TOKEN', 'u1', false, 'USER_NOT_FOUND');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.USER_NOT_FOUND
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('inactive user without cookie header returns 204', async () => {
      findUserByIdWithRole.mockResolvedValue({ ...activeUser, active: false });
      const { req, res, next } = createReqRes({ tokenInCookie: 'ok-token' });

      await Verify(req, res, next);

      expect(logAuth).toHaveBeenCalledWith('VERIFY_TOKEN', 'john', false, 'ACCOUNT_DEACTIVATED');
      expect(res.sendStatus).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
      expect(next).not.toHaveBeenCalled();
    });

    test('inactive user blacklists session cookie then returns unauthorized', async () => {
      findUserByIdWithRole.mockResolvedValue({ ...activeUser, active: false });
      isTokenBlacklisted
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      const { req, res, next } = createReqRes({
        tokenInCookie: 'ok-token',
        cookieHeader: 'token=access-token-123; Path=/'
      });

      await Verify(req, res, next);

      expect(blacklistToken).toHaveBeenCalledWith('access-token-123');
      expect(res.clearCookie).toHaveBeenCalledWith(COOKIE_CONFIG.TOKEN_NAME, {
        ...COOKIE_CONFIG.OPTIONS,
        secure: false
      });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.ACCOUNT_DEACTIVATED
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('successful verification issues rolling token, stores req.user and calls next', async () => {
      const { req, res, next } = createReqRes({ tokenInCookie: 'ok-token' });

      await Verify(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('ok-token', 'secret-token');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'u1' }, 'secret-token', { expiresIn: '90m' });
      expect(res.cookie).toHaveBeenCalledWith(COOKIE_CONFIG.TOKEN_NAME, 'new-token', {
        ...COOKIE_CONFIG.OPTIONS,
        secure: true,
        maxAge: 1800000
      });
      expect(req.user).toEqual({
        _id: 'u1',
        username: 'john',
        role: 'judge'
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('reads token from Authorization header', async () => {
      const { req, res, next } = createReqRes({ authorization: 'Bearer header-token' });

      await Verify(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('header-token', 'secret-token');
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('VerifyNoerror', () => {
    test('missing token returns unauthorized', async () => {
      const { req, res, next } = createReqRes();

      await VerifyNoerror(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });

    test('token present calls next', async () => {
      const { req, res, next } = createReqRes({ tokenInCookie: 'x' });

      await VerifyNoerror(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('VerifyRole', () => {
    test('returns unauthorized when req.user.role is missing', async () => {
      const { req, res, next } = createReqRes({ user: { username: 'john' } });

      await VerifyRole()(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.USER_ROLE_NOT_FOUND
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns unauthorized when role data is missing', async () => {
      getRoleWithPermissions.mockResolvedValue(null);
      const { req, res, next } = createReqRes({ user: { username: 'john', role: 'judge' } });

      await VerifyRole()(req, res, next);

      expect(getRoleWithPermissions).toHaveBeenCalledWith('judge');
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(next).not.toHaveBeenCalled();
    });

    test('sets parent and calls next when permission URL matches parameterized route', async () => {
      getRoleWithPermissions.mockResolvedValue({
        role: { roleName: 'Judge' },
        permissions: [
          {
            attachedURL: [
              { url: '/entries/:id', parent: '/entries' }
            ]
          }
        ]
      });
      const { req, res, next } = createReqRes({
        user: { username: 'john', role: 'judge' },
        originalUrl: '/entries/42'
      });

      await VerifyRole()(req, res, next);

      expect(req.session.parent).toBe('/entries');
      expect(res.locals.parent).toBe('/entries');
      expect(next).toHaveBeenCalledTimes(1);
    });

    test('returns forbidden when no matching permission is found', async () => {
      getRoleWithPermissions.mockResolvedValue({
        role: { roleName: 'Judge' },
        permissions: [{ attachedURL: [{ url: '/users/:id', parent: '/users' }] }]
      });
      const { req, res, next } = createReqRes({
        user: { username: 'john', role: 'judge' },
        originalUrl: '/entries/42'
      });

      await VerifyRole()(req, res, next);

      expect(logWarn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: MESSAGES.AUTH.PERMISSION_DENIED
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('UserIDValidator', () => {
    test('returns unauthorized when route id is missing', async () => {
      const { req, res, next } = createReqRes({ user: { _id: 'u1' }, params: {} });

      await UserIDValidator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: MESSAGES.AUTH.USER_ID_REQUIRED
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns forbidden when route id differs from logged user id', async () => {
      const { req, res, next } = createReqRes({ user: { _id: 'u1' }, params: { id: 'u2' } });

      await UserIDValidator(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: MESSAGES.AUTH.PERMISSION_DENIED
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('calls next when route id matches logged user id', async () => {
      const { req, res, next } = createReqRes({ user: { _id: 'u1' }, params: { id: 'u1' } });

      await UserIDValidator(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('StoreUserWithoutValidation', () => {
    test('continues when token is missing', async () => {
      const { req, res, next } = createReqRes();

      await StoreUserWithoutValidation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    test('continues when token is blacklisted', async () => {
      isTokenBlacklisted.mockResolvedValue(true);
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await StoreUserWithoutValidation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    test('continues when jwt verify throws', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('bad token');
      });
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await StoreUserWithoutValidation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(findUserByIdWithRole).not.toHaveBeenCalled();
    });

    test('continues when user does not exist', async () => {
      findUserByIdWithRole.mockResolvedValue(null);
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await StoreUserWithoutValidation(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    test('stores user and sets rolling cookie when token is valid', async () => {
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await StoreUserWithoutValidation(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(COOKIE_CONFIG.TOKEN_NAME, 'new-token', {
        ...COOKIE_CONFIG.OPTIONS,
        secure: true,
        maxAge: 1800000
      });
      expect(req.user).toEqual({
        _id: 'u1',
        username: 'john',
        role: 'judge'
      });
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('CheckLoggedIn', () => {
    test('continues when token is missing', async () => {
      const { req, res, next } = createReqRes();

      await CheckLoggedIn(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test('continues when token is blacklisted', async () => {
      isTokenBlacklisted.mockResolvedValue(true);
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await CheckLoggedIn(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test('continues when token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('bad token');
      });
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await CheckLoggedIn(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test('continues when user cannot be loaded', async () => {
      findUserByIdWithRole.mockResolvedValue(null);
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await CheckLoggedIn(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    test('redirects to dashboard when user is already logged in', async () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      const { req, res, next } = createReqRes({ tokenInCookie: 't1' });

      await CheckLoggedIn(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
      expect(next).not.toHaveBeenCalled();
      infoSpy.mockRestore();
    });
  });
});

// tests/controllers/loginController.test.js - Login Controller Unit Tests
import loginController from '../../controllers/loginController.js';

// Mock modules
jest.mock('../../middleware/asyncHandler.js', () => ({
  asyncHandler: (fn) => fn
}));
jest.mock('../../logger.js');

describe('Login Controller - Unit Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    fullname: 'Test User',
    role: {
      _id: 'role1',
      name: 'Admin',
      permissions: ['view', 'create', 'edit', 'delete']
    }
  };

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      session: {
        failMessage: null,
        successMessage: null
      },
      user: mockUser
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {}
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getLoginPage', () => {
    
    test('should render login page', async () => {
      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.any(Object)
      );
    });

    test('should pass failMessage from session to template', async () => {
      req.session.failMessage = 'Invalid credentials';

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: 'Invalid credentials'
        })
      );
    });

    test('should pass successMessage from session to template', async () => {
      req.session.successMessage = 'Password reset successful';

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          successMessage: 'Password reset successful'
        })
      );
    });

    test('should pass both messages when present', async () => {
      req.session.failMessage = 'Error message';
      req.session.successMessage = 'Success message';

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: 'Error message',
          successMessage: 'Success message'
        })
      );
    });

    test('should extract user role permissions', async () => {
      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: ['view', 'create', 'edit', 'delete']
        })
      );
    });

    test('should set noindex flag for SEO', async () => {
      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          noindex: true
        })
      );
    });

    test('should clear failMessage after rendering', async () => {
      req.session.failMessage = 'Error';

      await loginController.getLoginPage(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', async () => {
      req.session.successMessage = 'Success';

      await loginController.getLoginPage(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });

    test('should clear both messages independently', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      await loginController.getLoginPage(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle null failMessage', async () => {
      req.session.failMessage = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: null
        })
      );
    });

    test('should handle null successMessage', async () => {
      req.session.successMessage = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          successMessage: null
        })
      );
    });

    test('should handle undefined failMessage', async () => {
      req.session.failMessage = undefined;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: undefined
        })
      );
    });

    test('should handle undefined successMessage', async () => {
      req.session.successMessage = undefined;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          successMessage: undefined
        })
      );
    });

    test('should handle missing session', async () => {
      req.session = {};

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: undefined,
          successMessage: undefined
        })
      );
    });

    test('should always include noindex flag', async () => {
      req.session.failMessage = 'Error';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.noindex).toBe(true);
    });

    test('should preserve noindex as boolean true', async () => {
      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(typeof renderCall.noindex).toBe('boolean');
      expect(renderCall.noindex).toBe(true);
    });
  });

  describe('Optional Chaining & User Permissions', () => {
    
    test('should handle null user gracefully', async () => {
      req.user = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle undefined user', async () => {
      req.user = undefined;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle user without role property', async () => {
      req.user = { _id: 'user123', username: 'testuser' };

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle null user role', async () => {
      req.user.role = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle undefined user role', async () => {
      req.user.role = undefined;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle role without permissions array', async () => {
      req.user.role = { _id: 'role1', name: 'User' };

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle null permissions array', async () => {
      req.user.role.permissions = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: null
        })
      );
    });

    test('should handle empty permissions array', async () => {
      req.user.role.permissions = [];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: []
        })
      );
    });

    test('should handle different permission sets', async () => {
      req.user.role.permissions = ['view', 'edit'];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should handle single permission', async () => {
      req.user.role.permissions = ['view'];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: ['view']
        })
      );
    });

    test('should handle extended permission sets', async () => {
      req.user.role.permissions = ['create', 'read', 'update', 'delete', 'admin'];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: ['create', 'read', 'update', 'delete', 'admin']
        })
      );
    });
  });

  describe('Message Handling', () => {
    
    test('should handle long failMessage', async () => {
      req.session.failMessage = 'Invalid username or password. Please try again. If you believe this is an error, contact support.';

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: expect.stringContaining('Invalid username')
        })
      );
    });

    test('should handle long successMessage', async () => {
      req.session.successMessage = 'Your account has been successfully registered. Please wait while we redirect you to the dashboard.';

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          successMessage: expect.stringContaining('successfully registered')
        })
      );
    });

    test('should handle messages with special characters', async () => {
      req.session.failMessage = "Invalid credentials! Please check your username & password.";

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.failMessage).toContain('&');
    });

    test('should handle messages with unicode characters', async () => {
      req.session.successMessage = 'Sikeres bejelentkezés! Üdvözöljük.';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.successMessage).toContain('Sikeres');
      expect(renderCall.successMessage).toContain('Üdvözöljük');
    });

    test('should handle messages with HTML-like content (plain text)', async () => {
      req.session.failMessage = '<script>alert("test")</script>';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.failMessage).toBe('<script>alert("test")</script>');
    });

    test('should handle messages with quotes', async () => {
      req.session.failMessage = 'User said "goodbye"';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.failMessage).toBe('User said "goodbye"');
    });

    test('should handle messages with apostrophes', async () => {
      req.session.successMessage = "You've successfully logged in!";

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.successMessage).toContain("You've");
    });

    test('should handle empty string messages', async () => {
      req.session.failMessage = '';
      req.session.successMessage = '';

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: '',
          successMessage: ''
        })
      );
    });

    test('should handle whitespace-only messages', async () => {
      req.session.failMessage = '   ';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.failMessage).toBe('   ');
    });

    test('should handle messages with newlines', async () => {
      req.session.failMessage = 'Error:\nInvalid credentials\nPlease try again';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.failMessage).toContain('\n');
    });

    test('should preserve message exactly as stored', async () => {
      const exactMessage = 'Exact Error !@#$%';
      req.session.failMessage = exactMessage;

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.failMessage).toBe(exactMessage);
    });
  });

  describe('Session Lifecycle', () => {
    
    test('should read failMessage before clearing', async () => {
      req.session.failMessage = 'Error message';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][0];
      expect(renderCall).toBe('login');
    });

    test('should read successMessage before clearing', async () => {
      req.session.successMessage = 'Success message';

      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0][0];
      expect(renderCall).toBe('login');
    });

    test('should not affect other session properties', async () => {
      req.session.failMessage = 'Error';
      req.session.customProperty = 'custom value';

      await loginController.getLoginPage(req, res, next);

      expect(req.session.customProperty).toBe('custom value');
    });

    test('should only clear messages, preserve other session data', async () => {
      req.session.failMessage = 'Error';
      req.session.userId = 'user123';
      req.session.loginCount = 5;

      await loginController.getLoginPage(req, res, next);

      expect(req.session.userId).toBe('user123');
      expect(req.session.loginCount).toBe(5);
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle already cleared messages', async () => {
      req.session.failMessage = null;
      req.session.successMessage = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          failMessage: null,
          successMessage: null
        })
      );
    });

    test('should be safe to call multiple times', async () => {
      req.session.failMessage = 'Error 1';

      await loginController.getLoginPage(req, res, next);

      req.session.failMessage = 'Error 2';

      await loginController.getLoginPage(req, res, next);

      const secondRenderCall = res.render.mock.calls[1][1];
      expect(secondRenderCall.failMessage).toBe('Error 2');
    });
  });

  describe('Render Template Verification', () => {
    
    test('should use correct template name', async () => {
      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith('login', expect.any(Object));
    });

    test('should pass object as second argument', async () => {
      await loginController.getLoginPage(req, res, next);

      const renderCall = res.render.mock.calls[0];
      expect(renderCall.length).toBe(2);
      expect(typeof renderCall[1]).toBe('object');
    });

    test('should include all required properties in render data', async () => {
      await loginController.getLoginPage(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData).toHaveProperty('failMessage');
      expect(renderData).toHaveProperty('successMessage');
      expect(renderData).toHaveProperty('rolePermissons');
      expect(renderData).toHaveProperty('noindex');
    });

    test('should not include additional properties beyond specified ones', async () => {
      await loginController.getLoginPage(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      const expectedKeys = ['failMessage', 'successMessage', 'rolePermissons', 'noindex'];
      const actualKeys = Object.keys(renderData);
      
      actualKeys.forEach(key => {
        expect(expectedKeys).toContain(key);
      });
    });

    test('should call render exactly once', async () => {
      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different User Contexts', () => {
    
    test('should handle admin user permissions', async () => {
      req.user.role.permissions = ['view', 'create', 'edit', 'delete', 'admin'];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: ['view', 'create', 'edit', 'delete', 'admin']
        })
      );
    });

    test('should handle regular user permissions', async () => {
      req.user.role.permissions = ['view'];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: ['view']
        })
      );
    });

    test('should handle guest user (no permissions)', async () => {
      req.user.role.permissions = [];

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: []
        })
      );
    });

    test('should handle unauthenticated request (no user)', async () => {
      req.user = null;

      await loginController.getLoginPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'login',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });
  });

});

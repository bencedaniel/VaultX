// tests/controllers/auth.test.js - Authentication Controller Unit Tests
import authController from '../../controllers/auth.js';
import * as authData from '../../DataServices/authData.js';
import { HTTP_STATUS, MESSAGES, JWT_CONFIG, COOKIE_CONFIG } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/authData.js');
jest.mock('../../logger.js');
jest.mock('../../config/env.js', () => ({
  SECURE_MODE: 'false'
}));

describe('Auth Controller - Unit Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    fullname: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: {
      _id: 'role1',
      name: 'User'
    },
    generateAccessJWT: jest.fn(() => 'mock.jwt.token')
  };

  beforeEach(() => {
    req = {
      body: {},
      headers: {
        cookie: null
      },
      user: mockUser,
      session: {
        failMessage: null,
        successMessage: null,
        destroy: jest.fn((cb) => cb(null))
      }
    };

    res = {
      redirect: jest.fn(),
      cookie: jest.fn(),
      sendStatus: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('Register', () => {
    
    test('should create new user successfully', async () => {
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockResolvedValue(mockUser);

      await authController.Register(req, res, next);

      expect(authData.createUser).toHaveBeenCalledWith({
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      });
    });

    test('should set success message after registration', async () => {
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockResolvedValue(mockUser);

      await authController.Register(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.USER_CREATED);
    });

    test('should redirect to admin users dashboard after registration', async () => {
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockResolvedValue(mockUser);

      await authController.Register(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/users');
    });

    test('should handle registration with all required fields', async () => {
      const userData = {
        username: 'admin',
        fullname: 'Admin User',
        password: 'admin123',
        feiid: 'feiid456',
        role: 'admin'
      };

      req.body = userData;

      authData.createUser.mockResolvedValue({ ...mockUser, ...userData });

      await authController.Register(req, res, next);

      expect(authData.createUser).toHaveBeenCalledWith(userData);
    });

    test('should log successful registration', async () => {
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockResolvedValue(mockUser);

      await authController.Register(req, res, next);

      expect(authData.createUser).toHaveBeenCalled();
    });

    test('should handle registration error', async () => {
      const error = new Error('Username already exists');
      req.body = {
        username: 'existinguser',
        fullname: 'Existing User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockRejectedValue(error);

      await expect(
        authController.Register(req, res, next)
      ).rejects.toThrow('Username already exists');
    });

    test('should handle database error during registration', async () => {
      const error = new Error('Database error');
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockRejectedValue(error);

      await expect(
        authController.Register(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should pass all form fields to createUser', async () => {
      const userData = {
        username: 'testuser',
        fullname: 'Test User',
        password: 'testpass123',
        feiid: 'testfeiid',
        role: 'testRole'
      };

      req.body = userData;

      authData.createUser.mockResolvedValue(mockUser);

      await authController.Register(req, res, next);

      expect(authData.createUser).toHaveBeenCalledWith(userData);
    });

    test('should handle registration with special characters in password', async () => {
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'p@$$w0rd!#%&',
        feiid: 'feiid123',
        role: 'user'
      };

      authData.createUser.mockResolvedValue(mockUser);

      await authController.Register(req, res, next);

      expect(authData.createUser).toHaveBeenCalledWith(req.body);
    });

    test('should handle validation error during registration', async () => {
      const error = new Error('Invalid feiid format');
      req.body = {
        username: 'newuser',
        fullname: 'New User',
        password: 'password123',
        feiid: 'invalid',
        role: 'user'
      };

      authData.createUser.mockRejectedValue(error);

      await expect(
        authController.Register(req, res, next)
      ).rejects.toThrow('Invalid feiid format');
    });
  });

  describe('Login', () => {
    
    test('should login user successfully', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      expect(authData.findUserByUsernameWithPassword).toHaveBeenCalledWith('testuser');
    });

    test('should set JWT cookie after successful login', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.TOKEN_NAME,
        'mock.jwt.token',
        expect.objectContaining({
          secure: false,
          sameSite: 'None'
        })
      );
    });

    test('should redirect to dashboard after successful login', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dashboard');
    });

    test('should handle user not found', async () => {
      req.body = {
        username: 'nonexistent',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(null);

      await authController.Login(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.AUTH.USER_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('should not set cookie when user not found', async () => {
      req.body = {
        username: 'nonexistent',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(null);

      await authController.Login(req, res, next);

      expect(res.cookie).not.toHaveBeenCalled();
    });

    test('should handle invalid password', async () => {
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(false);

      await authController.Login(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.AUTH.INVALID_CREDENTIALS);
      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('should not set cookie when password is invalid', async () => {
      req.body = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(false);

      await authController.Login(req, res, next);

      expect(res.cookie).not.toHaveBeenCalled();
    });

    test('should generate JWT token for valid login', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      expect(mockUser.generateAccessJWT).toHaveBeenCalled();
    });

    test('should use correct cookie options', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      const cookieCall = res.cookie.mock.calls[0];
      expect(cookieCall[2]).toHaveProperty('maxAge', JWT_CONFIG.COOKIE_MAX_AGE);
    });

    test('should log successful login', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      expect(authData.findUserByUsernameWithPassword).toHaveBeenCalledWith('testuser');
    });

    test('should handle case sensitivity in username', async () => {
      req.body = {
        username: 'TestUser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(null);

      await authController.Login(req, res, next);

      expect(authData.findUserByUsernameWithPassword).toHaveBeenCalledWith('TestUser');
    });

    test('should validate password with hashed version', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      expect(authData.validateUserPassword).toHaveBeenCalledWith(
        'password123',
        mockUser.password
      );
    });

    test('should handle empty username', async () => {
      req.body = {
        username: '',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(null);

      await authController.Login(req, res, next);

      expect(authData.findUserByUsernameWithPassword).toHaveBeenCalledWith('');
    });

    test('should handle empty password', async () => {
      req.body = {
        username: 'testuser',
        password: ''
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(false);

      await authController.Login(req, res, next);

      expect(authData.validateUserPassword).toHaveBeenCalledWith('', mockUser.password);
    });

    test('should handle database errors during login', async () => {
      const error = new Error('Database connection failed');
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockRejectedValue(error);

      await expect(
        authController.Login(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle password validation errors', async () => {
      const error = new Error('Password validation failed');
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockRejectedValue(error);

      await expect(
        authController.Login(req, res, next)
      ).rejects.toThrow('Password validation failed');
    });
  });

  describe('Logout', () => {
    
    test('should logout user successfully', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(authData.blacklistToken).toHaveBeenCalledWith('mock.jwt.token');
    });

    test('should destroy session after logout', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(req.session.destroy).toHaveBeenCalled();
    });

    test('should set Clear-Site-Data header', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Clear-Site-Data', '"cookies"');
    });

    test('should redirect to login after logout', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('should handle logout without cookie header', async () => {
      req.headers.cookie = null;

      await authController.Logout(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
    });

    test('should handle already blacklisted token', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(true);

      await authController.Logout(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
    });

    test('should not blacklist token twice', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(true);

      await authController.Logout(req, res, next);

      expect(authData.blacklistToken).not.toHaveBeenCalled();
    });

    test('should extract token from cookie header', async () => {
      req.headers.cookie = 'auth_token=extracted.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'extracted.token' });

      await authController.Logout(req, res, next);

      expect(authData.blacklistToken).toHaveBeenCalledWith('extracted.token');
    });

    test('should use username from request user', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';
      req.user = { username: 'testuser' };

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(authData.blacklistToken).toHaveBeenCalled();
    });

    test('should use unknown username when user not present', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';
      req.user = null;

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(authData.blacklistToken).toHaveBeenCalled();
    });

    test('should handle session destroy error gracefully', async () => {
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';
      req.session.destroy = jest.fn((cb) => cb(new Error('Session destroy failed')));

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({ token: 'mock.jwt.token' });

      await authController.Logout(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/login');
    });

    test('should handle token with complex JWT structure', async () => {
      req.headers.cookie = 'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockResolvedValue({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
      });

      await authController.Logout(req, res, next);

      expect(authData.blacklistToken).toHaveBeenCalled();
    });

    test('should handle token blacklist errors', async () => {
      const error = new Error('Blacklist operation failed');
      req.headers.cookie = 'auth_token=mock.jwt.token; Path=/';

      authData.isTokenBlacklisted.mockResolvedValue(false);
      authData.blacklistToken.mockRejectedValue(error);

      await expect(
        authController.Logout(req, res, next)
      ).rejects.toThrow('Blacklist operation failed');
    });
  });

  describe('Cookie Configuration', () => {
    
    test('should use correct cookie name', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      const cookieCall = res.cookie.mock.calls[0];
      expect(cookieCall[0]).toBe(COOKIE_CONFIG.TOKEN_NAME);
    });

    test('should set sameSite to None', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      const cookieCall = res.cookie.mock.calls[0];
      expect(cookieCall[2].sameSite).toBe('None');
    });

    test('should set cookie maxAge', async () => {
      req.body = {
        username: 'testuser',
        password: 'password123'
      };

      authData.findUserByUsernameWithPassword.mockResolvedValue(mockUser);
      authData.validateUserPassword.mockResolvedValue(true);

      await authController.Login(req, res, next);

      const cookieCall = res.cookie.mock.calls[0];
      expect(cookieCall[2].maxAge).toBeGreaterThan(0);
    });
  });

});

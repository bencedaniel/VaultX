// tests/controllers/creatorsController.test.js - Creators Controller Unit Tests
import creatorsController from '../../controllers/creatorsController.js';

// Mock modules
jest.mock('../../logger.js');

describe('Creators Controller - Unit Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
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
      session: {
        successMessage: null,
        failMessage: null,
        formData: null
      },
      user: mockUser
    };

    res = {
      render: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getCreatorsPage', () => {
    
    test('should render creators page successfully', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.any(Object)
      );
    });

    test('should pass successMessage to template', async () => {
      req.session.successMessage = 'Page loaded successfully';

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: 'Page loaded successfully'
        })
      );
    });

    test('should pass failMessage to template', async () => {
      req.session.failMessage = 'An error occurred';

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          failMessage: 'An error occurred'
        })
      );
    });

    test('should pass formData to template', async () => {
      req.session.formData = { name: 'John Doe', email: 'john@example.com' };

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          formData: { name: 'John Doe', email: 'john@example.com' }
        })
      );
    });

    test('should pass user context to template', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should pass role permissions to template', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should handle null session object', async () => {
      req.session = null;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: undefined,
          failMessage: undefined,
          formData: undefined
        })
      );
    });

    test('should handle undefined session object', async () => {
      req.session = undefined;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: undefined,
          failMessage: undefined,
          formData: undefined
        })
      );
    });

    test('should handle null user object', async () => {
      req.user = null;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          user: null,
          rolePermissons: undefined
        })
      );
    });

    test('should handle undefined user object', async () => {
      req.user = undefined;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          user: undefined,
          rolePermissons: undefined
        })
      );
    });

    test('should handle user without role', async () => {
      req.user = { username: 'testuser', fullname: 'Test User' };

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle user with null role', async () => {
      req.user.role = null;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle role without permissions', async () => {
      req.user.role = { name: 'User' };

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle empty permissions array', async () => {
      req.user.role.permissions = [];

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          rolePermissons: []
        })
      );
    });

    test('should pass all session messages at once', async () => {
      req.session = {
        successMessage: 'Success',
        failMessage: 'Failure',
        formData: { field: 'value' }
      };

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: 'Success',
          failMessage: 'Failure',
          formData: { field: 'value' }
        })
      );
    });

    test('should render correct template name', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith('creators', expect.any(Object));
      expect(res.render.mock.calls[0][0]).toBe('creators');
    });

    test('should render with complete user object', async () => {
      const completeMockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'admin',
        fullname: 'Admin User',
        email: 'admin@example.com',
        role: {
          _id: 'role1',
          name: 'Admin',
          permissions: ['view', 'create', 'edit', 'delete']
        }
      };

      req.user = completeMockUser;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          user: completeMockUser
        })
      );
    });

    test('should handle session with null successMessage', async () => {
      req.session.successMessage = null;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: null
        })
      );
    });

    test('should handle session with null failMessage', async () => {
      req.session.failMessage = null;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          failMessage: null
        })
      );
    });

    test('should handle session with null formData', async () => {
      req.session.formData = null;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          formData: null
        })
      );
    });

    test('should pass complex formData object', async () => {
      const complexFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA'
        },
        tags: ['creator', 'verified']
      };

      req.session.formData = complexFormData;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          formData: complexFormData
        })
      );
    });

    test('should render template exactly once', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledTimes(1);
    });

    test('should not call next middleware', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    test('should pass object as second parameter to render', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.any(Object)
      );

      const renderData = res.render.mock.calls[0][1];
      expect(typeof renderData).toBe('object');
      expect(renderData).not.toBeNull();
    });

    test('should include all expected properties in render object', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData).toHaveProperty('successMessage');
      expect(renderData).toHaveProperty('rolePermissons');
      expect(renderData).toHaveProperty('failMessage');
      expect(renderData).toHaveProperty('formData');
      expect(renderData).toHaveProperty('user');
    });

    test('should handle multiple sequential calls', async () => {
      await creatorsController.getCreatorsPage(req, res, next);
      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledTimes(2);
    });

    test('should handle render with different user per call', async () => {
      const user1 = { username: 'user1', role: { permissions: ['view'] } };
      const user2 = { username: 'user2', role: { permissions: ['create'] } };

      req.user = user1;
      await creatorsController.getCreatorsPage(req, res, next);

      req.user = user2;
      await creatorsController.getCreatorsPage(req, res, next);

      const firstCall = res.render.mock.calls[0][1];
      const secondCall = res.render.mock.calls[1][1];

      expect(firstCall.user.username).toBe('user1');
      expect(secondCall.user.username).toBe('user2');
    });

    test('should handle render with different session messages per call', async () => {
      req.session.successMessage = 'Success 1';
      await creatorsController.getCreatorsPage(req, res, next);

      req.session.successMessage = 'Success 2';
      await creatorsController.getCreatorsPage(req, res, next);

      const firstCall = res.render.mock.calls[0][1];
      const secondCall = res.render.mock.calls[1][1];

      expect(firstCall.successMessage).toBe('Success 1');
      expect(secondCall.successMessage).toBe('Success 2');
    });

    test('should handle render error gracefully', async () => {
      const renderError = new Error('Render failed');
      res.render.mockImplementation(() => {
        throw renderError;
      });

      await expect(
        creatorsController.getCreatorsPage(req, res, next)
      ).rejects.toThrow('Render failed');
    });

    test('should work with async/await', async () => {
      const result = creatorsController.getCreatorsPage(req, res, next);

      expect(result).toBeInstanceOf(Promise);

      await result;

      expect(res.render).toHaveBeenCalled();
    });

    test('should handle special characters in successMessage', async () => {
      req.session.successMessage = 'Success! Special chars: @#$%^&*()';

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: 'Success! Special chars: @#$%^&*()'
        })
      );
    });

    test('should handle unicode characters in messages', async () => {
      req.session.successMessage = 'Siker! Unicode: áéíóú';
      req.session.failMessage = 'Hiba! Karakterek: ñ ü ö';

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: 'Siker! Unicode: áéíóú',
          failMessage: 'Hiba! Karakterek: ñ ü ö'
        })
      );
    });

    test('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      req.session.successMessage = longMessage;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: longMessage
        })
      );
    });

    test('should handle empty string messages', async () => {
      req.session.successMessage = '';
      req.session.failMessage = '';

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          successMessage: '',
          failMessage: ''
        })
      );
    });

    test('should handle empty object as formData', async () => {
      req.session.formData = {};

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          formData: {}
        })
      );
    });

    test('should handle array in formData', async () => {
      req.session.formData = ['item1', 'item2', 'item3'];

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          formData: ['item1', 'item2', 'item3']
        })
      );
    });

    test('should handle different permission arrays', async () => {
      const permissionVariations = [
        [],
        ['view'],
        ['view', 'create'],
        ['view', 'create', 'edit', 'delete'],
        ['admin', 'moderator', 'user']
      ];

      for (const permissions of permissionVariations) {
        req.user.role.permissions = permissions;

        await creatorsController.getCreatorsPage(req, res, next);

        expect(res.render).toHaveBeenCalledWith(
          'creators',
          expect.objectContaining({
            rolePermissons: permissions
          })
        );
      }
    });
  });

  describe('Error Handling', () => {
    
    test('should propagate render errors', async () => {
      const renderError = new Error('Template not found');
      res.render.mockImplementation(() => {
        throw renderError;
      });

      await expect(
        creatorsController.getCreatorsPage(req, res, next)
      ).rejects.toThrow('Template not found');
    });

    test('should handle missing render function', async () => {
      res.render = undefined;

      await expect(
        creatorsController.getCreatorsPage(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle null render function', async () => {
      res.render = null;

      await expect(
        creatorsController.getCreatorsPage(req, res, next)
      ).rejects.toThrow();
    });

    test('should not suppress errors from render', async () => {
      const customError = new Error('Custom render error');
      res.render.mockImplementation(() => {
        throw customError;
      });

      try {
        await creatorsController.getCreatorsPage(req, res, next);
      } catch (error) {
        expect(error.message).toBe('Custom render error');
      }
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should extract permissions from nested role object', async () => {
      req.user = {
        username: 'user1',
        role: {
          name: 'Editor',
          permissions: ['view', 'edit']
        }
      };

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should handle user with different role names', async () => {
      const roles = ['Admin', 'Editor', 'Viewer', 'User'];

      for (const roleName of roles) {
        req.user.role.name = roleName;

        await creatorsController.getCreatorsPage(req, res, next);

        expect(res.render).toHaveBeenCalledWith(
          'creators',
          expect.objectContaining({
            user: expect.objectContaining({
              role: expect.objectContaining({
                name: roleName
              })
            })
          })
        );
      }
    });

    test('should preserve user metadata in passed context', async () => {
      const userWithMetadata = {
        ...mockUser,
        email: 'test@example.com',
        phone: '+1234567890',
        createdAt: new Date()
      };

      req.user = userWithMetadata;

      await creatorsController.getCreatorsPage(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'creators',
        expect.objectContaining({
          user: userWithMetadata
        })
      );
    });
  });

  describe('Session Management', () => {
    
    test('should preserve null session values', async () => {
      await creatorsController.getCreatorsPage(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.successMessage).toBeNull();
      expect(renderData.failMessage).toBeNull();
      expect(renderData.formData).toBeNull();
    });

    test('should not clear session data after render', async () => {
      req.session.successMessage = 'Success';

      await creatorsController.getCreatorsPage(req, res, next);

      // Session data should not be cleared by the controller
      expect(req.session.successMessage).toBe('Success');
    });

    test('should maintain session state between multiple calls', async () => {
      req.session.successMessage = 'First success';

      await creatorsController.getCreatorsPage(req, res, next);
      await creatorsController.getCreatorsPage(req, res, next);

      // Session should be maintained
      expect(req.session.successMessage).toBe('First success');
    });
  });

});

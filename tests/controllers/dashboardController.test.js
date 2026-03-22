// tests/controllers/dashboardController.test.js - Dashboard Controller Unit Tests
import dashboardController from '../../controllers/dashboardController.js';
import * as dashboardData from '../../DataServices/dashboardData.js';

// Mock modules
jest.mock('../../DataServices/dashboardData.js');
jest.mock('../../logger.js');

describe('Dashboard Controller - Unit Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    fullname: 'Test User',
    email: 'test@example.com',
    role: {
      _id: 'role1',
      name: 'User',
      permissions: ['view', 'create']
    }
  };

  const mockDashCards = [
    {
      _id: 'card1',
      type: 'user',
      title: 'My Events',
      description: 'Events I am participating in'
    },
    {
      _id: 'card2',
      type: 'user',
      title: 'My Results',
      description: 'My competition results'
    },
    {
      _id: 'card3',
      type: 'user',
      title: 'My Profile',
      description: 'User profile information'
    }
  ];

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

  describe('getDashboard', () => {
    
    test('should render dashboard successfully', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.any(Object)
      );
    });

    test('should fetch dashboard cards for user type', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(dashboardData.getDashCardsByType).toHaveBeenCalledWith('user');
    });

    test('should pass dashboard cards to template', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: mockDashCards
        })
      );
    });

    test('should pass user role to template', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          userrole: mockUser.role
        })
      );
    });

    test('should pass role permissions to template', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass user context to template', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should pass successMessage from session', async () => {
      req.session.successMessage = 'Login successful';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          successMessage: 'Login successful'
        })
      );
    });

    test('should pass failMessage from session', async () => {
      req.session.failMessage = 'An error occurred';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          failMessage: 'An error occurred'
        })
      );
    });

    test('should pass formData from session', async () => {
      req.session.formData = { field1: 'value1', field2: 'value2' };

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          formData: { field1: 'value1', field2: 'value2' }
        })
      );
    });

    test('should render correct template name', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render.mock.calls[0][0]).toBe('dashboard');
    });

    test('should clear successMessage after rendering', async () => {
      req.session.successMessage = 'Previous success';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });

    test('should clear failMessage after rendering', async () => {
      req.session.failMessage = 'Previous error';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear both messages independently', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle empty dashboard cards array', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue([]);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: []
        })
      );
    });

    test('should handle null cardsFromDB', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(null);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: null
        })
      );
    });

    test('should handle multiple dashboard cards', async () => {
      const multipleCards = [
        ...mockDashCards,
        { _id: 'card4', type: 'user', title: 'Statistics' },
        { _id: 'card5', type: 'user', title: 'Notifications' }
      ];

      dashboardData.getDashCardsByType.mockResolvedValue(multipleCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: multipleCards
        })
      );
    });

    test('should pass all expected properties to render', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData).toHaveProperty('userrole');
      expect(renderData).toHaveProperty('cardsFromDB');
      expect(renderData).toHaveProperty('successMessage');
      expect(renderData).toHaveProperty('rolePermissons');
      expect(renderData).toHaveProperty('failMessage');
      expect(renderData).toHaveProperty('formData');
      expect(renderData).toHaveProperty('user');
    });

    test('should not call next middleware', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    test('should render only once', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledTimes(1);
    });

    test('should work with async/await', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      const result = dashboardController.getDashboard(req, res, next);

      expect(result).toBeInstanceOf(Promise);

      await result;

      expect(res.render).toHaveBeenCalled();
    });

    test('should pass exact role object reference', async () => {
      const customRole = { name: 'Admin', permissions: ['all'] };
      req.user.role = customRole;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.userrole).toBe(customRole);
    });

    test('should preserve user object exactly', async () => {
      const customUser = { ...mockUser, customField: 'customValue' };
      req.user = customUser;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          user: customUser
        })
      );
    });

    test('should handle null successMessage', async () => {
      req.session.successMessage = null;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          successMessage: null
        })
      );
    });

    test('should handle null failMessage', async () => {
      req.session.failMessage = null;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          failMessage: null
        })
      );
    });

    test('should handle null formData', async () => {
      req.session.formData = null;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          formData: null
        })
      );
    });

    test('should handle special characters in successMessage', async () => {
      req.session.successMessage = 'Success! Special chars: @#$%^&*()';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          successMessage: 'Success! Special chars: @#$%^&*()'
        })
      );
    });

    test('should handle unicode characters in messages', async () => {
      req.session.successMessage = 'Siker! Üdvözlünk';
      req.session.failMessage = 'Hiba! Karakterek: áéíóú';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          successMessage: 'Siker! Üdvözlünk',
          failMessage: 'Hiba! Karakterek: áéíóú'
        })
      );
    });

    test('should handle long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      req.session.successMessage = longMessage;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          successMessage: longMessage
        })
      );
    });

    test('should handle empty string messages', async () => {
      req.session.successMessage = '';
      req.session.failMessage = '';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          successMessage: '',
          failMessage: ''
        })
      );
    });

    test('should handle complex formData object', async () => {
      const complexFormData = {
        nested: {
          field1: 'value1',
          field2: ['item1', 'item2']
        },
        array: [1, 2, 3],
        boolean: true
      };

      req.session.formData = complexFormData;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          formData: complexFormData
        })
      );
    });

    test('should handle card objects with deep nesting', async () => {
      const nestedCards = [
        {
          _id: 'card1',
          type: 'user',
          metadata: {
            nested: {
              deep: {
                property: 'value'
              }
            }
          }
        }
      ];

      dashboardData.getDashCardsByType.mockResolvedValue(nestedCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: nestedCards
        })
      );
    });

    test('should handle multiple sequential calls', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);
      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledTimes(2);
      expect(dashboardData.getDashCardsByType).toHaveBeenCalledTimes(2);
    });

    test('should handle different users in sequential calls', async () => {
      const user1 = { ...mockUser, username: 'user1' };
      const user2 = { ...mockUser, username: 'user2' };

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      req.user = user1;
      await dashboardController.getDashboard(req, res, next);

      req.user = user2;
      await dashboardController.getDashboard(req, res, next);

      const firstCall = res.render.mock.calls[0][1];
      const secondCall = res.render.mock.calls[1][1];

      expect(firstCall.user.username).toBe('user1');
      expect(secondCall.user.username).toBe('user2');
    });
  });

  describe('Error Handling', () => {
    
    test('should propagate DataServices error', async () => {
      const error = new Error('Database connection failed');

      dashboardData.getDashCardsByType.mockRejectedValue(error);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle render errors', async () => {
      const renderError = new Error('Template not found');
      res.render.mockImplementation(() => {
        throw renderError;
      });

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow('Template not found');
    });

    test('should not suppress errors from DataServices', async () => {
      const customError = new Error('Custom error');

      dashboardData.getDashCardsByType.mockRejectedValue(customError);

      try {
        await dashboardController.getDashboard(req, res, next);
      } catch (error) {
        expect(error.message).toBe('Custom error');
      }
    });

    test('should handle undefined user', async () => {
      req.user = undefined;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle null user', async () => {
      req.user = null;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle missing user.role', async () => {
      req.user = { username: 'testuser', fullname: 'Test User' };

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle missing user.role.permissions', async () => {
      req.user.role = { name: 'User' };

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.rolePermissons).toBeUndefined();
    });

    test('should handle null session object', async () => {
      req.session = null;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle undefined session object', async () => {
      req.session = undefined;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await expect(
        dashboardController.getDashboard(req, res, next)
      ).rejects.toThrow();
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should extract user role correctly', async () => {
      const customRole = { name: 'Editor', permissions: ['edit', 'view'] };
      req.user.role = customRole;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          userrole: customRole
        })
      );
    });

    test('should extract permissions from role', async () => {
      const permissions = ['view', 'create', 'edit', 'delete'];
      req.user.role.permissions = permissions;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          rolePermissons: permissions
        })
      );
    });

    test('should handle different role types', async () => {
      const roles = ['Admin', 'User', 'Editor', 'Viewer'];

      for (const roleName of roles) {
        req.user.role.name = roleName;

        dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

        await dashboardController.getDashboard(req, res, next);

        expect(res.render).toHaveBeenCalledWith(
          'dashboard',
          expect.objectContaining({
            userrole: expect.objectContaining({
              name: roleName
            })
          })
        );
      }
    });

    test('should preserve user metadata', async () => {
      const userWithMetadata = {
        ...mockUser,
        email: 'updated@example.com',
        phone: '+1234567890',
        createdAt: new Date('2024-01-01')
      };

      req.user = userWithMetadata;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          user: userWithMetadata
        })
      );
    });

    test('should handle empty permissions array', async () => {
      req.user.role.permissions = [];

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          rolePermissons: []
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should always request user type cards', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(dashboardData.getDashCardsByType).toHaveBeenCalledWith('user');
    });

    test('should use cards returned from DataServices directly', async () => {
      const customCards = [
        { _id: 'custom1', title: 'Custom Card' },
        { _id: 'custom2', title: 'Another Card' }
      ];

      dashboardData.getDashCardsByType.mockResolvedValue(customCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: customCards
        })
      );
    });

    test('should handle cards with missing fields', async () => {
      const incompleteCards = [
        { _id: 'card1' },
        { title: 'Card without ID' },
        { _id: 'card3', title: 'Complete Card' }
      ];

      dashboardData.getDashCardsByType.mockResolvedValue(incompleteCards);

      await dashboardController.getDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dashboard',
        expect.objectContaining({
          cardsFromDB: incompleteCards
        })
      );
    });

    test('should verify DataServices called before render', async () => {
      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      const callOrder = [
        dashboardData.getDashCardsByType.mock.invocationCallOrder[0],
        res.render.mock.invocationCallOrder[0]
      ];

      expect(callOrder[0]).toBeLessThan(callOrder[1]);
    });
  });

  describe('Session Management', () => {
    
    test('should not modify formData in session', async () => {
      const originalFormData = { field: 'value' };
      req.session.formData = originalFormData;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.formData).toEqual(originalFormData);
    });

    test('should preserve null messages until render', async () => {
      req.session.successMessage = null;
      req.session.failMessage = null;

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle rapid successive calls', async () => {
      req.session.successMessage = 'Message 1';

      dashboardData.getDashCardsByType.mockResolvedValue(mockDashCards);

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();

      req.session.successMessage = 'Message 2';

      await dashboardController.getDashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });
  });

});

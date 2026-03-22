// tests/controllers/adminDashboardController.test.js - Admin Dashboard Controller Tests
import adminDashboardController from '../../controllers/adminDashboardController.js';
import * as adminDashboardData from '../../DataServices/adminDashboardData.js';

// Mock DataServices
jest.mock('../../DataServices/adminDashboardData.js');
jest.mock('../../logger.js');

describe('Admin Dashboard Controller - Integration Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'adminuser',
    role: {
      permissions: ['admin.dashboard.view', 'admin.user.view', 'admin.permission.view', 'admin.role.view']
    }
  };

  beforeEach(() => {
    req = {
      user: mockUser,
      session: {
        failMessage: null,
        successMessage: null
      }
    };

    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getAdminDashboard', () => {
    
    test('should render dashboard with all statistics', async () => {
      const dashboardData = {
        cards: [
          { _id: '1', title: 'Card 1', permissions: [] },
          { _id: '2', title: 'Card 2', permissions: [] }
        ],
        userCount: 25,
        permissionCount: 12,
        roleCount: 5
      };

      adminDashboardData.getAdminDashboardData.mockResolvedValue(dashboardData);

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(adminDashboardData.getAdminDashboardData).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          cardsFromDB: dashboardData.cards,
          userCount: dashboardData.userCount,
          permissionCount: dashboardData.permissionCount,
          roleCount: dashboardData.roleCount
        })
      );
    });

    test('should include role permissions in response', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include session messages in response', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Operation successful';

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Operation successful'
        })
      );
    });

    test('should pass user to template', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty cards array', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 10,
        permissionCount: 5,
        roleCount: 3
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          cardsFromDB: []
        })
      );
    });

    test('should handle zero statistics', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          userCount: 0,
          permissionCount: 0,
          roleCount: 0
        })
      );
    });

    test('should handle large number of cards', async () => {
      const manyCards = Array.from({ length: 100 }, (_, i) => ({
        _id: `${i}`,
        title: `Card ${i}`,
        permissions: []
      }));

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: manyCards,
        userCount: 500,
        permissionCount: 50,
        roleCount: 20
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          cardsFromDB: manyCards,
          userCount: 500
        })
      );
    });

    test('should handle missing cards in response', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: undefined,
        userCount: 10,
        permissionCount: 5,
        roleCount: 3
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          cardsFromDB: undefined
        })
      );
    });

    test('should render correct template name', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.any(Object)
      );
    });

    test('should pass all card details to template', async () => {
      const cardsWithDetails = [
        {
          _id: '1',
          title: 'Card 1',
          description: 'Description 1',
          permissions: ['perm1', 'perm2'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: cardsWithDetails,
        userCount: 25,
        permissionCount: 12,
        roleCount: 5
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          cardsFromDB: cardsWithDetails
        })
      );
    });

    test('should not call next() on success', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Role Permissions', () => {
    
    test('should preserve user role permissions', async () => {
      const customPermissions = ['custom.perm1', 'custom.perm2', 'custom.perm3'];
      req.user.role.permissions = customPermissions;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          rolePermissons: customPermissions
        })
      );
    });

    test('should handle empty permissions array', async () => {
      req.user.role.permissions = [];

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          rolePermissons: []
        })
      );
    });

    test('should handle missing role', async () => {
      req.user.role = undefined;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });
  });

  describe('Statistics Accuracy', () => {
    
    test('should display correct user count', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 42,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          userCount: 42
        })
      );
    });

    test('should display correct permission count', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 18,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          permissionCount: 18
        })
      );
    });

    test('should display correct role count', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 7
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          roleCount: 7
        })
      );
    });

    test('should handle large statistics numbers', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 10000,
        permissionCount: 1000,
        roleCount: 100
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          userCount: 10000,
          permissionCount: 1000,
          roleCount: 100
        })
      );
    });
  });

  describe('Session Message Handling', () => {
    
    test('should preserve only fail message', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = null;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: null
        })
      );
    });

    test('should preserve only success message', async () => {
      req.session.failMessage = null;
      req.session.successMessage = 'Operation successful';

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          failMessage: null,
          successMessage: 'Operation successful'
        })
      );
    });

    test('should handle both messages', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'But also success';

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'But also success'
        })
      );
    });

    test('should handle neither message', async () => {
      req.session.failMessage = null;
      req.session.successMessage = null;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          failMessage: null,
          successMessage: null
        })
      );
    });

    test('should handle long error messages', async () => {
      const longError = 'A'.repeat(500);
      req.session.failMessage = longError;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          failMessage: longError
        })
      );
    });

    test('should clear messages only after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      // Call the function
      await adminDashboardController.getAdminDashboard(req, res, next);

      // Verify render was called with the original messages
      const renderCall = res.render.mock.calls[0];
      expect(renderCall[1].failMessage).toBe('Error');
      expect(renderCall[1].successMessage).toBe('Success');

      // Verify messages were cleared after
      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });
  });

  describe('Error Handling', () => {
    
    test('should propagate database errors', async () => {
      const error = new Error('Database connection failed');
      adminDashboardData.getAdminDashboardData.mockRejectedValue(error);

      await expect(
        adminDashboardController.getAdminDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle null response from data service', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue(null);

      // Should handle gracefully
      await expect(
        adminDashboardController.getAdminDashboard(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle missing user in request', async () => {
      req.user = undefined;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      // Should still attempt to render
      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });

    test('should handle service timeout', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      adminDashboardData.getAdminDashboardData.mockRejectedValue(timeoutError);

      await expect(
        adminDashboardController.getAdminDashboard(req, res, next)
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('User Context', () => {
    
    test('should include full user object', async () => {
      const fulUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'adminuser',
        fullname: 'Admin User',
        email: 'admin@example.com',
        role: {
          _id: '1',
          name: 'Admin',
          permissions: ['admin.*']
        }
      };

      req.user = fulUser;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          user: fulUser
        })
      );
    });

    test('should work with different user types', async () => {
      const differentUser = {
        _id: '507f1f77bcf86cd799439012',
        username: 'otheruser',
        role: {
          permissions: ['limited.perm']
        }
      };

      req.user = differentUser;

      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          user: differentUser,
          rolePermissons: ['limited.perm']
        })
      );
    });
  });

  describe('Data Service Integration', () => {
    
    test('should call getAdminDashboardData once per request', async () => {
      adminDashboardData.getAdminDashboardData.mockResolvedValue({
        cards: [],
        userCount: 0,
        permissionCount: 0,
        roleCount: 0
      });

      await adminDashboardController.getAdminDashboard(req, res, next);

      expect(adminDashboardData.getAdminDashboardData).toHaveBeenCalledTimes(1);
    });

    test('should not modify data service response', async () => {
      const originalData = {
        cards: [{ _id: '1', title: 'Card 1' }],
        userCount: 25,
        permissionCount: 12,
        roleCount: 5
      };

      adminDashboardData.getAdminDashboardData.mockResolvedValue(originalData);

      await adminDashboardController.getAdminDashboard(req, res, next);

      // Data should be passed unchanged
      expect(res.render).toHaveBeenCalledWith(
        'admin/admindash',
        expect.objectContaining({
          cardsFromDB: originalData.cards,
          userCount: originalData.userCount,
          permissionCount: originalData.permissionCount,
          roleCount: originalData.roleCount
        })
      );
    });
  });

});

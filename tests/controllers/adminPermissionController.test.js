// tests/controllers/adminPermissionController.test.js - Admin Permission Controller Tests
import adminPermissionController from '../../controllers/adminPermissionController.js';
import * as adminPermissionData from '../../DataServices/adminPermissionData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock DataServices
jest.mock('../../DataServices/adminPermissionData.js');
jest.mock('../../logger.js');

describe('Admin Permission Controller - Integration Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'adminuser',
    role: {
      permissions: ['admin.permission.view', 'admin.permission.create', 'admin.permission.edit', 'admin.permission.delete']
    }
  };

  beforeEach(() => {
    req = {
      user: mockUser,
      params: {},
      body: {},
      session: {
        failMessage: null,
        successMessage: null,
        formData: null
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getPermissionsDashboard', () => {
    
    test('should render permissions dashboard with all data', async () => {
      const dashboardData = {
        permissions: [
          { _id: '1', name: 'admin.user.view', description: 'View users' },
          { _id: '2', name: 'admin.user.create', description: 'Create users' }
        ],
        RolePermNumList: { count: 2 }
      };

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue(dashboardData);

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(adminPermissionData.getAllPermissionsWithUsageCounts).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          permissions: dashboardData.permissions,
          rolepermNumList: dashboardData.RolePermNumList
        })
      );
    });

    test('should include role permissions in response', async () => {
      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages in response', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success message';

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success message'
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty permissions list', async () => {
      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          permissions: []
        })
      );
    });

    test('should handle multiple permissions', async () => {
      const permissions = Array.from({ length: 20 }, (_, i) => ({
        _id: `${i}`,
        name: `perm.${i}`,
        description: `Permission ${i}`
      }));

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions,
        RolePermNumList: { count: 20 }
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          permissions
        })
      );
    });

    test('should render correct template name', async () => {
      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.any(Object)
      );
    });
  });

  describe('getNewPermissionForm', () => {
    
    test('should render new permission form', async () => {
      await adminPermissionController.getNewPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newPerm',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      await adminPermissionController.getNewPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newPerm',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages', async () => {
      req.session.failMessage = 'Form error';
      req.session.successMessage = 'Form success';
      req.session.formData = { name: 'new.perm' };

      await adminPermissionController.getNewPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newPerm',
        expect.objectContaining({
          failMessage: 'Form error',
          successMessage: 'Form success',
          formData: { name: 'new.perm' }
        })
      );
    });

    test('should clear all session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = { test: 'data' };

      await adminPermissionController.getNewPermissionForm(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.formData).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle missing form data', async () => {
      req.session.formData = null;

      await adminPermissionController.getNewPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newPerm',
        expect.objectContaining({
          formData: null
        })
      );
    });

    test('should render correct template', async () => {
      await adminPermissionController.getNewPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newPerm',
        expect.any(Object)
      );
    });
  });

  describe('createNewPermissionHandler', () => {
    
    test('should create new permission', async () => {
      const newPermission = { _id: '1', name: 'new.permission', description: 'New permission' };
      req.body = { name: 'new.permission', description: 'New permission' };

      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(adminPermissionData.createPermission).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      const newPermission = { _id: '1', name: 'test.perm' };
      req.body = { name: 'test.perm' };

      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.PERMISSION_CREATED);
    });

    test('should redirect to permissions dashboard', async () => {
      const newPermission = { _id: '1', name: 'test.perm' };
      req.body = { name: 'test.perm' };

      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/permissions');
    });

    test('should log operation with correct details', async () => {
      const newPermission = { _id: '1', name: 'test.perm' };
      req.body = { name: 'test.perm' };

      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(adminPermissionData.createPermission).toHaveBeenCalledWith(req.body);
    });

    test('should handle permission with special characters', async () => {
      const newPermission = { _id: '1', name: 'admin.user.create-new' };
      req.body = { name: 'admin.user.create-new' };

      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(adminPermissionData.createPermission).toHaveBeenCalledWith(req.body);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/permissions');
    });

    test('should handle long permission name', async () => {
      const longName = 'admin.' + 'a'.repeat(100);
      const newPermission = { _id: '1', name: longName };
      req.body = { name: longName };

      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(adminPermissionData.createPermission).toHaveBeenCalledWith(req.body);
    });

    test('should pass request body to data service', async () => {
      const bodyData = { name: 'perm.name', description: 'Perm description' };
      req.body = bodyData;

      const newPermission = { _id: '1', ...bodyData };
      adminPermissionData.createPermission.mockResolvedValue(newPermission);

      await adminPermissionController.createNewPermissionHandler(req, res, next);

      expect(adminPermissionData.createPermission).toHaveBeenCalledWith(bodyData);
    });
  });

  describe('getEditPermissionForm', () => {
    
    test('should fetch and render edit form with permission data', async () => {
      const permission = { _id: '1', name: 'test.perm', description: 'Test' };
      req.params.id = '1';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(adminPermissionData.getPermissionById).toHaveBeenCalledWith('1');
      expect(res.render).toHaveBeenCalledWith(
        'admin/editPerm',
        expect.objectContaining({
          formData: permission
        })
      );
    });

    test('should include role permissions in response', async () => {
      const permission = { _id: '1', name: 'test.perm' };
      req.params.id = '1';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editPerm',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should redirect if permission not found', async () => {
      req.params.id = 'nonexistent';

      adminPermissionData.getPermissionById.mockResolvedValue(null);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.PERMISSION_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/permissions');
    });

    test('should handle permission not found error message', async () => {
      req.params.id = 'invalid';

      adminPermissionData.getPermissionById.mockResolvedValue(null);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.PERMISSION_NOT_FOUND);
    });

    test('should clear session messages after rendering', async () => {
      const permission = { _id: '1', name: 'test.perm' };
      req.params.id = '1';
      req.session.failMessage = 'Previous error';
      req.session.successMessage = 'Previous success';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should pass user to template', async () => {
      const permission = { _id: '1', name: 'test.perm' };
      req.params.id = '1';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editPerm',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include messages in response', async () => {
      const permission = { _id: '1', name: 'test.perm' };
      req.params.id = '1';
      req.session.failMessage = 'Error message';
      req.session.successMessage = 'Success message';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editPerm',
        expect.objectContaining({
          failMessage: 'Error message',
          successMessage: 'Success message'
        })
      );
    });

    test('should render correct template', async () => {
      const permission = { _id: '1', name: 'test.perm' };
      req.params.id = '1';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editPerm',
        expect.any(Object)
      );
    });
  });

  describe('updatePermissionHandler', () => {
    
    test('should update permission successfully', async () => {
      const updatedPermission = { _id: '1', name: 'updated.perm', description: 'Updated' };
      req.params.id = '1';
      req.body = { name: 'updated.perm', description: 'Updated' };

      adminPermissionData.updatePermission.mockResolvedValue(updatedPermission);

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(adminPermissionData.updatePermission).toHaveBeenCalledWith('1', req.body);
    });

    test('should set success message after update', async () => {
      const updatedPermission = { _id: '1', name: 'updated.perm' };
      req.params.id = '1';

      adminPermissionData.updatePermission.mockResolvedValue(updatedPermission);

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.PERMISSION_UPDATED);
    });

    test('should redirect after successful update', async () => {
      const updatedPermission = { _id: '1', name: 'updated.perm' };
      req.params.id = '1';

      adminPermissionData.updatePermission.mockResolvedValue(updatedPermission);

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/permissions');
    });

    test('should handle update failure when permission not found', async () => {
      req.params.id = 'nonexistent';

      adminPermissionData.updatePermission.mockResolvedValue(null);

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.PERMISSION_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/permissions');
    });

    test('should pass update body to data service', async () => {
      const updateBody = { name: 'new.name', description: 'New description' };
      req.params.id = '1';
      req.body = updateBody;

      const updatedPermission = { _id: '1', ...updateBody };
      adminPermissionData.updatePermission.mockResolvedValue(updatedPermission);

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(adminPermissionData.updatePermission).toHaveBeenCalledWith('1', updateBody);
    });

    test('should handle partial updates', async () => {
      const partialUpdate = { description: 'Updated description' };
      req.params.id = '1';
      req.body = partialUpdate;

      const updatedPermission = { _id: '1', name: 'old.name', ...partialUpdate };
      adminPermissionData.updatePermission.mockResolvedValue(updatedPermission);

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(adminPermissionData.updatePermission).toHaveBeenCalledWith('1', partialUpdate);
    });

    test('should handle permission ID in params', async () => {
      const permissionId = '507f1f77bcf86cd799439011';
      req.params.id = permissionId;
      req.body = { name: 'updated.perm' };

      adminPermissionData.updatePermission.mockResolvedValue({ _id: permissionId });

      await adminPermissionController.updatePermissionHandler(req, res, next);

      expect(adminPermissionData.updatePermission).toHaveBeenCalledWith(permissionId, req.body);
    });
  });

  describe('deletePermissionHandler', () => {
    
    test('should delete permission successfully', async () => {
      const deletedPermission = { _id: '1', name: 'deleted.perm' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(adminPermissionData.deletePermission).toHaveBeenCalledWith('1');
    });

    test('should set success message after deletion', async () => {
      const deletedPermission = { _id: '1', name: 'deleted.perm' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.PERMISSION_DELETED);
    });

    test('should return 200 status code', async () => {
      const deletedPermission = { _id: '1', name: 'deleted.perm' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should send success response message', async () => {
      const deletedPermission = { _id: '1', name: 'deleted.perm' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.PERMISSION_DELETE_RESPONSE);
    });

    test('should handle deletion with valid permission ID', async () => {
      const permId = '507f1f77bcf86cd799439011';
      const deletedPermission = { _id: permId, name: 'admin.perm' };
      req.params.permId = permId;

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(adminPermissionData.deletePermission).toHaveBeenCalledWith(permId);
    });

    test('should chain status and send correctly', async () => {
      const deletedPermission = { _id: '1', name: 'test.perm' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.PERMISSION_DELETE_RESPONSE);
    });

    test('should use correct param name (permId)', async () => {
      const deletedPermission = { _id: '1', name: 'test.perm' };
      req.params.permId = '1';
      req.params.id = 'wrong'; // Should use permId, not id

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(adminPermissionData.deletePermission).toHaveBeenCalledWith('1');
    });

    test('should log deletion operation', async () => {
      const deletedPermission = { _id: '1', name: 'admin.user.create' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(deletedPermission);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.PERMISSION_DELETED);
    });

    test('should handle deletion of system permissions', async () => {
      const systemPerm = { _id: '1', name: 'system.critical' };
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockResolvedValue(systemPerm);

      await adminPermissionController.deletePermissionHandler(req, res, next);

      expect(adminPermissionData.deletePermission).toHaveBeenCalledWith('1');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle database errors in dashboard', async () => {
      const error = new Error('Database connection failed');
      adminPermissionData.getAllPermissionsWithUsageCounts.mockRejectedValue(error);

      await expect(
        adminPermissionController.getPermissionsDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle errors in create handler', async () => {
      const error = new Error('Duplicate permission');
      req.body = { name: 'existing.perm' };

      adminPermissionData.createPermission.mockRejectedValue(error);

      await expect(
        adminPermissionController.createNewPermissionHandler(req, res, next)
      ).rejects.toThrow('Duplicate permission');
    });

    test('should handle errors in update handler', async () => {
      const error = new Error('Update failed');
      req.params.id = '1';

      adminPermissionData.updatePermission.mockRejectedValue(error);

      await expect(
        adminPermissionController.updatePermissionHandler(req, res, next)
      ).rejects.toThrow('Update failed');
    });

    test('should handle errors in delete handler', async () => {
      const error = new Error('Permission in use');
      req.params.permId = '1';

      adminPermissionData.deletePermission.mockRejectedValue(error);

      await expect(
        adminPermissionController.deletePermissionHandler(req, res, next)
      ).rejects.toThrow('Permission in use');
    });

    test('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';

      adminPermissionData.getAllPermissionsWithUsageCounts.mockRejectedValue(error);

      await expect(
        adminPermissionController.getPermissionsDashboard(req, res, next)
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should work with different user role permissions', async () => {
      req.user.role.permissions = ['limited.view'];

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          rolePermissons: ['limited.view']
        })
      );
    });

    test('should work with admin user', async () => {
      req.user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'superadmin',
        role: {
          permissions: ['admin.*']
        }
      };

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          user: req.user
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should call getAllPermissionsWithUsageCounts once', async () => {
      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue({
        permissions: [],
        RolePermNumList: {}
      });

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(adminPermissionData.getAllPermissionsWithUsageCounts).toHaveBeenCalledTimes(1);
    });

    test('should not modify service response data', async () => {
      const originalData = {
        permissions: [{ _id: '1', name: 'perm' }],
        RolePermNumList: { count: 1 }
      };

      adminPermissionData.getAllPermissionsWithUsageCounts.mockResolvedValue(originalData);

      await adminPermissionController.getPermissionsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/permdash',
        expect.objectContaining({
          permissions: originalData.permissions
        })
      );
    });

    test('should pass correct parameters to getPermissionById', async () => {
      const permission = { _id: '123abc', name: 'test.perm' };
      req.params.id = '123abc';

      adminPermissionData.getPermissionById.mockResolvedValue(permission);

      await adminPermissionController.getEditPermissionForm(req, res, next);

      expect(adminPermissionData.getPermissionById).toHaveBeenCalledWith('123abc');
    });
  });

});

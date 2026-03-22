// tests/controllers/adminRoleController.test.js - Admin Role Controller Tests
import adminRoleController from '../../controllers/adminRoleController.js';
import * as adminRoleData from '../../DataServices/adminRoleData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock DataServices
jest.mock('../../DataServices/adminRoleData.js');
jest.mock('../../logger.js');

describe('Admin Role Controller - Integration Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'adminuser',
    role: {
      permissions: ['admin.role.view', 'admin.role.create', 'admin.role.edit', 'admin.role.delete']
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

  describe('getRolesDashboard', () => {
    
    test('should render roles dashboard with all data', async () => {
      const dashboardData = {
        roles: [
          { _id: '1', roleName: 'Admin', permissions: [] },
          { _id: '2', roleName: 'User', permissions: [] }
        ],
        RoleNumList: { Admin: 5, User: 15 }
      };

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue(dashboardData);

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(adminRoleData.getAllRolesWithUserCounts).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          roles: dashboardData.roles,
          rolenumlist: dashboardData.RoleNumList
        })
      );
    });

    test('should include role permissions in response', async () => {
      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages in response', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success message';

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success message'
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty roles list', async () => {
      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          roles: []
        })
      );
    });

    test('should handle multiple roles with user counts', async () => {
      const roles = Array.from({ length: 10 }, (_, i) => ({
        _id: `${i}`,
        roleName: `Role${i}`,
        permissions: []
      }));

      const userCounts = {};
      roles.forEach((r, i) => userCounts[r.roleName] = i * 5);

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles,
        RoleNumList: userCounts
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          roles,
          rolenumlist: userCounts
        })
      );
    });

    test('should render correct template name', async () => {
      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.any(Object)
      );
    });
  });

  describe('getNewRoleForm', () => {
    
    test('should render new role form with permissions', async () => {
      const permissions = [
        { _id: '1', name: 'admin.view' },
        { _id: '2', name: 'admin.create' }
      ];

      adminRoleData.getRoleFormData.mockResolvedValue({ permissions });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(adminRoleData.getRoleFormData).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.objectContaining({
          permissions
        })
      );
    });

    test('should include user permissions in response', async () => {
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages and form data', async () => {
      req.session.failMessage = 'Form error';
      req.session.successMessage = 'Form success';
      req.session.formData = { roleName: 'TestRole' };

      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.objectContaining({
          failMessage: 'Form error',
          successMessage: 'Form success',
          formData: { roleName: 'TestRole' }
        })
      );
    });

    test('should clear all session data after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = { test: 'data' };

      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(req.session.formData).toBeNull();
      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty permissions list', async () => {
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.objectContaining({
          permissions: []
        })
      );
    });

    test('should render correct template', async () => {
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.any(Object)
      );
    });
  });

  describe('createNewRoleHandler', () => {
    
    test('should create new role', async () => {
      const newRole = { _id: '1', roleName: 'NewRole', permissions: [] };
      req.body = { roleName: 'NewRole', permissions: [] };

      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(adminRoleData.createRole).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      const newRole = { _id: '1', roleName: 'TestRole' };
      req.body = { roleName: 'TestRole' };

      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ROLE_CREATED);
    });

    test('should redirect to roles dashboard', async () => {
      const newRole = { _id: '1', roleName: 'TestRole' };
      req.body = { roleName: 'TestRole' };

      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/roles');
    });

    test('should log operation', async () => {
      const newRole = { _id: '1', roleName: 'TestRole' };
      req.body = { roleName: 'TestRole' };

      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(adminRoleData.createRole).toHaveBeenCalledWith(req.body);
    });

    test('should handle role with special characters', async () => {
      const newRole = { _id: '1', roleName: 'Test-Role_V2' };
      req.body = { roleName: 'Test-Role_V2' };

      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(adminRoleData.createRole).toHaveBeenCalledWith(req.body);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/roles');
    });

    test('should handle role with multiple permissions', async () => {
      const newRole = {
        _id: '1',
        roleName: 'ComplexRole',
        permissions: ['perm1', 'perm2', 'perm3']
      };
      req.body = { roleName: 'ComplexRole', permissions: ['perm1', 'perm2', 'perm3'] };

      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(adminRoleData.createRole).toHaveBeenCalledWith(req.body);
    });

    test('should pass request body to data service', async () => {
      const bodyData = { roleName: 'role.name', permissions: ['perm1', 'perm2'] };
      req.body = bodyData;

      const newRole = { _id: '1', ...bodyData };
      adminRoleData.createRole.mockResolvedValue(newRole);

      await adminRoleController.createNewRoleHandler(req, res, next);

      expect(adminRoleData.createRole).toHaveBeenCalledWith(bodyData);
    });
  });

  describe('getEditRoleForm', () => {
    
    test('should fetch and render edit form with role data', async () => {
      const role = { _id: '1', roleName: 'TestRole', permissions: [] };
      req.params.id = '1';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(adminRoleData.getRoleById).toHaveBeenCalledWith('1');
      expect(res.render).toHaveBeenCalledWith(
        'admin/editRole',
        expect.objectContaining({
          formData: role
        })
      );
    });

    test('should include available permissions in response', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      const permissions = [{ _id: '1', name: 'admin.view' }];
      req.params.id = '1';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editRole',
        expect.objectContaining({
          permissions
        })
      );
    });

    test('should include role permissions in response', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      req.params.id = '1';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editRole',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should redirect if role not found', async () => {
      req.params.id = 'nonexistent';

      adminRoleData.getRoleById.mockResolvedValue(null);

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.ROLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/roles');
    });

    test('should clear session messages after rendering', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      req.params.id = '1';
      req.session.failMessage = 'Previous error';
      req.session.successMessage = 'Previous success';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should pass user to template', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      req.params.id = '1';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editRole',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include messages in response', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      req.params.id = '1';
      req.session.failMessage = 'Error message';
      req.session.successMessage = 'Success message';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editRole',
        expect.objectContaining({
          failMessage: 'Error message',
          successMessage: 'Success message'
        })
      );
    });

    test('should render correct template', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      req.params.id = '1';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editRole',
        expect.any(Object)
      );
    });
  });

  describe('updateRoleHandler', () => {
    
    test('should update role successfully', async () => {
      const updatedRole = { _id: '1', roleName: 'UpdatedRole', permissions: [] };
      req.params.id = '1';
      req.body = { roleName: 'UpdatedRole', permissions: [] };

      adminRoleData.updateRole.mockResolvedValue(updatedRole);

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(adminRoleData.updateRole).toHaveBeenCalledWith('1', req.body);
    });

    test('should set success message after update', async () => {
      const updatedRole = { _id: '1', roleName: 'UpdatedRole' };
      req.params.id = '1';
      req.body = { roleName: 'UpdatedRole' };

      adminRoleData.updateRole.mockResolvedValue(updatedRole);

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ROLE_UPDATED);
    });

    test('should redirect after successful update', async () => {
      const updatedRole = { _id: '1', roleName: 'UpdatedRole' };
      req.params.id = '1';

      adminRoleData.updateRole.mockResolvedValue(updatedRole);

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/roles');
    });

    test('should handle update failure when role not found', async () => {
      req.params.id = 'nonexistent';

      adminRoleData.updateRole.mockResolvedValue(null);

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.ROLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/roles');
    });

    test('should pass update body to data service', async () => {
      const updateBody = { roleName: 'NewName', permissions: ['perm1'] };
      req.params.id = '1';
      req.body = updateBody;

      const updatedRole = { _id: '1', ...updateBody };
      adminRoleData.updateRole.mockResolvedValue(updatedRole);

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(adminRoleData.updateRole).toHaveBeenCalledWith('1', updateBody);
    });

    test('should handle partial updates', async () => {
      const partialUpdate = { roleName: 'UpdatedName' };
      req.params.id = '1';
      req.body = partialUpdate;

      const updatedRole = { _id: '1', ...partialUpdate };
      adminRoleData.updateRole.mockResolvedValue(updatedRole);

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(adminRoleData.updateRole).toHaveBeenCalledWith('1', partialUpdate);
    });

    test('should handle role ID in params', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      req.params.id = roleId;
      req.body = { roleName: 'updated.role' };

      adminRoleData.updateRole.mockResolvedValue({ _id: roleId });

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(adminRoleData.updateRole).toHaveBeenCalledWith(roleId, req.body);
    });

    test('should handle update with permission changes', async () => {
      const updateBody = {
        roleName: 'UpdatedRole',
        permissions: ['perm1', 'perm2', 'perm3']
      };
      req.params.id = '1';
      req.body = updateBody;

      adminRoleData.updateRole.mockResolvedValue({ _id: '1', ...updateBody });

      await adminRoleController.updateRoleHandler(req, res, next);

      expect(adminRoleData.updateRole).toHaveBeenCalledWith('1', updateBody);
    });
  });

  describe('deleteRoleHandler', () => {
    
    test('should delete role successfully', async () => {
      const deletedRole = { _id: '1', roleName: 'DeletedRole' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(adminRoleData.deleteRole).toHaveBeenCalledWith('1');
    });

    test('should set success message after deletion', async () => {
      const deletedRole = { _id: '1', roleName: 'DeletedRole' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ROLE_DELETED);
    });

    test('should return 200 status code', async () => {
      const deletedRole = { _id: '1', roleName: 'DeletedRole' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should send success response message', async () => {
      const deletedRole = { _id: '1', roleName: 'DeletedRole' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.ROLE_DELETE_RESPONSE);
    });

    test('should handle deletion with valid role ID', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const deletedRole = { _id: roleId, roleName: 'admin' };
      req.params.roleId = roleId;

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(adminRoleData.deleteRole).toHaveBeenCalledWith(roleId);
    });

    test('should chain status and send correctly', async () => {
      const deletedRole = { _id: '1', roleName: 'TestRole' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.ROLE_DELETE_RESPONSE);
    });

    test('should use correct param name (roleId)', async () => {
      const deletedRole = { _id: '1', roleName: 'TestRole' };
      req.params.roleId = '1';
      req.params.id = 'wrong';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(adminRoleData.deleteRole).toHaveBeenCalledWith('1');
    });

    test('should log deletion operation', async () => {
      const deletedRole = { _id: '1', roleName: 'AdminRole' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(deletedRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ROLE_DELETED);
    });

    test('should handle deletion of system roles', async () => {
      const systemRole = { _id: '1', roleName: 'system.admin' };
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockResolvedValue(systemRole);

      await adminRoleController.deleteRoleHandler(req, res, next);

      expect(adminRoleData.deleteRole).toHaveBeenCalledWith('1');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle database errors in dashboard', async () => {
      const error = new Error('Database connection failed');
      adminRoleData.getAllRolesWithUserCounts.mockRejectedValue(error);

      await expect(
        adminRoleController.getRolesDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle errors in create handler', async () => {
      const error = new Error('Duplicate role');
      req.body = { roleName: 'existing.role' };

      adminRoleData.createRole.mockRejectedValue(error);

      await expect(
        adminRoleController.createNewRoleHandler(req, res, next)
      ).rejects.toThrow('Duplicate role');
    });

    test('should handle errors in update handler', async () => {
      const error = new Error('Update failed');
      req.params.id = '1';

      adminRoleData.updateRole.mockRejectedValue(error);

      await expect(
        adminRoleController.updateRoleHandler(req, res, next)
      ).rejects.toThrow('Update failed');
    });

    test('should handle errors in delete handler', async () => {
      const error = new Error('Role has active users');
      req.params.roleId = '1';

      adminRoleData.deleteRole.mockRejectedValue(error);

      await expect(
        adminRoleController.deleteRoleHandler(req, res, next)
      ).rejects.toThrow('Role has active users');
    });

    test('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';

      adminRoleData.getAllRolesWithUserCounts.mockRejectedValue(error);

      await expect(
        adminRoleController.getRolesDashboard(req, res, next)
      ).rejects.toThrow('Request timeout');
    });

    test('should handle role form data fetch errors', async () => {
      const error = new Error('Failed to fetch permissions');
      adminRoleData.getRoleFormData.mockRejectedValue(error);

      await expect(
        adminRoleController.getNewRoleForm(req, res, next)
      ).rejects.toThrow('Failed to fetch permissions');
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should work with different user role permissions', async () => {
      req.user.role.permissions = ['limited.view'];

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
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

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          user: req.user
        })
      );
    });

    test('should preserve user identity across operations', async () => {
      const customUser = {
        _id: 'custom123',
        username: 'customuser',
        role: { permissions: ['custom.perm'] }
      };
      req.user = customUser;

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          user: customUser
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should call getAllRolesWithUserCounts once', async () => {
      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue({
        roles: [],
        RoleNumList: {}
      });

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(adminRoleData.getAllRolesWithUserCounts).toHaveBeenCalledTimes(1);
    });

    test('should not modify service response data', async () => {
      const originalData = {
        roles: [{ _id: '1', roleName: 'TestRole' }],
        RoleNumList: { TestRole: 10 }
      };

      adminRoleData.getAllRolesWithUserCounts.mockResolvedValue(originalData);

      await adminRoleController.getRolesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/roledash',
        expect.objectContaining({
          roles: originalData.roles,
          rolenumlist: originalData.RoleNumList
        })
      );
    });

    test('should pass correct permissions to getEditRoleForm', async () => {
      const role = { _id: '123abc', roleName: 'TestRole' };
      req.params.id = '123abc';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(adminRoleData.getRoleById).toHaveBeenCalledWith('123abc');
    });

    test('should call getRoleFormData during form rendering', async () => {
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(adminRoleData.getRoleFormData).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple data service calls in edit form', async () => {
      const role = { _id: '1', roleName: 'TestRole' };
      req.params.id = '1';

      adminRoleData.getRoleById.mockResolvedValue(role);
      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getEditRoleForm(req, res, next);

      expect(adminRoleData.getRoleById).toHaveBeenCalledTimes(1);
      expect(adminRoleData.getRoleFormData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Management', () => {
    
    test('should preserve session data in form before clearing', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = { role: 'data' };

      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      const renderCall = res.render.mock.calls[0];
      expect(renderCall[1].failMessage).toBe('Error');
      expect(renderCall[1].successMessage).toBe('Success');
      expect(renderCall[1].formData).toEqual({ role: 'data' });
    });

    test('should handle null session values', async () => {
      req.session.failMessage = null;
      req.session.successMessage = null;
      req.session.formData = null;

      adminRoleData.getRoleFormData.mockResolvedValue({ permissions: [] });

      await adminRoleController.getNewRoleForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newRole',
        expect.objectContaining({
          failMessage: null,
          successMessage: null,
          formData: null
        })
      );
    });
  });

});

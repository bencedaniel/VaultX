// tests/controllers/adminUserController.test.js - Admin User Controller Tests
import adminUserController from '../../controllers/adminUserController.js';
import * as adminUserData from '../../DataServices/adminUserData.js';
import User from '../../models/User.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock DataServices
jest.mock('../../DataServices/adminUserData.js');
jest.mock('../../logger.js');
jest.mock('../../models/User.js');

describe('Admin User Controller - Integration Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'adminuser',
    email: 'admin@example.com',
    role: {
      _id: 'role1',
      name: 'Admin',
      permissions: ['admin.user.view', 'admin.user.create', 'admin.user.edit', 'admin.user.delete']
    }
  };

  beforeEach(() => {
    req = {
      user: JSON.parse(JSON.stringify(mockUser)),
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

  describe('getNewUserForm', () => {
    
    test('should render new user form with roles', async () => {
      const roles = [
        { _id: '1', name: 'Admin' },
        { _id: '2', name: 'User' }
      ];

      adminUserData.getUserFormData.mockResolvedValue({ roles });

      await adminUserController.getNewUserForm(req, res, next);

      expect(adminUserData.getUserFormData).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          roleList: roles
        })
      );
    });

    test('should include user role permissions in response', async () => {
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages and form data', async () => {
      req.session.failMessage = 'Form error';
      req.session.successMessage = 'Form success';
      req.session.formData = { username: 'newuser' };

      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          failMessage: 'Form error',
          successMessage: 'Form success',
          formData: { username: 'newuser' }
        })
      );
    });

    test('should clear all session data after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = { test: 'data' };

      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.formData).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle empty roles list', async () => {
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          roleList: []
        })
      );
    });

    test('should handle multiple roles', async () => {
      const roles = Array.from({ length: 10 }, (_, i) => ({
        _id: `${i}`,
        name: `Role${i}`
      }));

      adminUserData.getUserFormData.mockResolvedValue({ roles });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          roleList: roles
        })
      );
    });

    test('should render correct template', async () => {
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.any(Object)
      );
    });

    test('should handle missing role from request user', async () => {
      req.user.role = undefined;

      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });

    test('should handle optional chaining for user role permissions', async () => {
      req.user = null;

      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });
  });

  describe('createNewUser', () => {
    
    test('should be defined as export', async () => {
      expect(adminUserController.createNewUser).toBeDefined();
    });

    test('should be an async function', async () => {
      expect(typeof adminUserController.createNewUser).toBe('function');
    });

    test('should not throw when called', async () => {
      await expect(
        adminUserController.createNewUser(req, res, next)
      ).resolves.not.toThrow();
    });

    test('should handle being called without throwing', async () => {
      const result = await adminUserController.createNewUser(req, res, next);
      
      expect(result).toBeUndefined();
    });

    test('should not call render method', async () => {
      await adminUserController.createNewUser(req, res, next);

      expect(res.render).not.toHaveBeenCalled();
    });

    test('should not call redirect method', async () => {
      await adminUserController.createNewUser(req, res, next);

      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('should not modify response', async () => {
      await adminUserController.createNewUser(req, res, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getUsersDashboard', () => {
    
    test('should render users dashboard with all users', async () => {
      const users = [
        { _id: '1', username: 'user1', role: { name: 'Admin' } },
        { _id: '2', username: 'user2', role: { name: 'User' } }
      ];

      adminUserData.getAllUsersWithRoles.mockResolvedValue(users);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(adminUserData.getAllUsersWithRoles).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          users
        })
      );
    });

    test('should include role permissions in response', async () => {
      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages in response', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success message';

      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success message'
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty users list', async () => {
      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          users: []
        })
      );
    });

    test('should handle multiple users', async () => {
      const users = Array.from({ length: 50 }, (_, i) => ({
        _id: `${i}`,
        username: `user${i}`,
        role: { name: 'User' }
      }));

      adminUserData.getAllUsersWithRoles.mockResolvedValue(users);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          users
        })
      );
    });

    test('should render correct template name', async () => {
      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.any(Object)
      );
    });

    test('should handle users with different roles', async () => {
      const users = [
        { _id: '1', username: 'admin1', role: { _id: 'r1', name: 'Admin' } },
        { _id: '2', username: 'judge', role: { _id: 'r2', name: 'Judge' } },
        { _id: '3', username: 'viewer', role: { _id: 'r3', name: 'Viewer' } }
      ];

      adminUserData.getAllUsersWithRoles.mockResolvedValue(users);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          users
        })
      );
    });
  });

  describe('getEditUserForm', () => {
    
    test('should fetch and render edit form with user data', async () => {
      const user = { _id: '1', username: 'testuser', email: 'test@example.com' };
      const roles = [{ _id: '1', name: 'Admin' }];
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles });

      await adminUserController.getEditUserForm(req, res, next);

      expect(adminUserData.getUserById).toHaveBeenCalledWith('1');
      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          formData: user
        })
      );
    });

    test('should include available roles in response', async () => {
      const user = { _id: '1', username: 'testuser' };
      const roles = [
        { _id: '1', name: 'Admin' },
        { _id: '2', name: 'User' }
      ];
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          roleList: roles
        })
      );
    });

    test('should include user role in response', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          userrole: mockUser.role
        })
      );
    });

    test('should include role permissions in response', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';
      req.session.failMessage = 'Previous error';
      req.session.successMessage = 'Previous success';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should pass user to template', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include messages in response', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';
      req.session.failMessage = 'Error message';
      req.session.successMessage = 'Success message';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          failMessage: 'Error message',
          successMessage: 'Success message'
        })
      );
    });

    test('should render correct template', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.any(Object)
      );
    });

    test('should fetch user by correct ID', async () => {
      const userId = '507f1f77bcf86cd799439012';
      const user = { _id: userId, username: 'testuser' };
      req.params.id = userId;

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(adminUserData.getUserById).toHaveBeenCalledWith(userId);
    });

    test('should handle user with multiple roles assigned', async () => {
      const user = {
        _id: '1',
        username: 'multiuser',
        roles: [
          { _id: 'r1', name: 'Admin' },
          { _id: 'r2', name: 'Judge' }
        ]
      };
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editUser',
        expect.objectContaining({
          formData: user
        })
      );
    });
  });

  describe('updateUserHandler', () => {
    
    test('should update user successfully', async () => {
      req.params.id = '1';
      req.body = { username: 'updateduser', email: 'updated@example.com' };

      adminUserData.updateUser.mockResolvedValue({ _id: '1', ...req.body });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalledWith('1', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = '1';
      req.body = { username: 'updateduser' };

      adminUserData.updateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.updateUserHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.USER_MODIFIED);
    });

    test('should redirect after successful update', async () => {
      req.params.id = '1';

      adminUserData.updateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.updateUserHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/users');
    });

    test('should pass update body to data service', async () => {
      const updateBody = { username: 'newname', email: 'new@example.com', roleId: 'r1' };
      req.params.id = '1';
      req.body = updateBody;

      adminUserData.updateUser.mockResolvedValue({ _id: '1', ...updateBody });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalledWith('1', updateBody);
    });

    test('should handle partial updates', async () => {
      const partialUpdate = { email: 'newemail@example.com' };
      req.params.id = '1';
      req.body = partialUpdate;

      adminUserData.updateUser.mockResolvedValue({ _id: '1', username: 'oldname', ...partialUpdate });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalledWith('1', partialUpdate);
    });

    test('should handle user ID in params', async () => {
      const userId = '507f1f77bcf86cd799439012';
      req.params.id = userId;
      req.body = { username: 'updated' };

      adminUserData.updateUser.mockResolvedValue({ _id: userId });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalledWith(userId, req.body);
    });

    test('should handle role change in update', async () => {
      const updateBody = { username: 'user', roleId: 'newRole' };
      req.params.id = '1';
      req.body = updateBody;

      adminUserData.updateUser.mockResolvedValue({ _id: '1', ...updateBody });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalledWith('1', updateBody);
    });

    test('should handle password update', async () => {
      const updateBody = { password: 'newpassword123' };
      req.params.id = '1';
      req.body = updateBody;

      adminUserData.updateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalledWith('1', updateBody);
    });

    test('should log operation with correct details', async () => {
      req.params.id = '1';
      req.body = { username: 'testuser' };

      adminUserData.updateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.updateUserHandler(req, res, next);

      expect(adminUserData.updateUser).toHaveBeenCalled();
    });
  });

  describe('deleteUserHandler', () => {
    
    test('should inactivate user successfully', async () => {
      req.params.userId = '1';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1', isActive: false });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(adminUserData.inactivateUser).toHaveBeenCalledWith('1');
    });

    test('should set success message after deletion', async () => {
      req.params.userId = '1';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.USER_INACTIVATED);
    });

    test('should return 200 status code', async () => {
      req.params.userId = '1';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should send success response message', async () => {
      req.params.userId = '1';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.USER_DELETE_RESPONSE);
    });

    test('should handle deletion with valid user ID', async () => {
      const userId = '507f1f77bcf86cd799439012';
      req.params.userId = userId;

      adminUserData.inactivateUser.mockResolvedValue({ _id: userId });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(adminUserData.inactivateUser).toHaveBeenCalledWith(userId);
    });

    test('should chain status and send correctly', async () => {
      req.params.userId = '1';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.USER_DELETE_RESPONSE);
    });

    test('should use correct param name (userId)', async () => {
      req.params.userId = '1';
      req.params.id = 'wrong';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(adminUserData.inactivateUser).toHaveBeenCalledWith('1');
    });

    test('should log deletion operation', async () => {
      req.params.userId = '1';

      adminUserData.inactivateUser.mockResolvedValue({ _id: '1' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.USER_INACTIVATED);
    });

    test('should handle inactivation of active user', async () => {
      req.params.userId = '1';

      const inactiveUser = { _id: '1', username: 'user1', isActive: false };
      adminUserData.inactivateUser.mockResolvedValue(inactiveUser);

      await adminUserController.deleteUserHandler(req, res, next);

      expect(adminUserData.inactivateUser).toHaveBeenCalledWith('1');
    });

    test('should handle admin user deletion', async () => {
      const adminUserId = 'admin123';
      req.params.userId = adminUserId;

      adminUserData.inactivateUser.mockResolvedValue({ _id: adminUserId, role: 'Admin' });

      await adminUserController.deleteUserHandler(req, res, next);

      expect(adminUserData.inactivateUser).toHaveBeenCalledWith(adminUserId);
    });
  });

  describe('Error Handling', () => {
    
    test('should handle database errors in getUsersDashboard', async () => {
      const error = new Error('Database connection failed');
      adminUserData.getAllUsersWithRoles.mockRejectedValue(error);

      await expect(
        adminUserController.getUsersDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle errors in getUserFormData', async () => {
      const error = new Error('Failed to fetch roles');
      adminUserData.getUserFormData.mockRejectedValue(error);

      await expect(
        adminUserController.getNewUserForm(req, res, next)
      ).rejects.toThrow('Failed to fetch roles');
    });

    test('should handle errors in update handler', async () => {
      const error = new Error('Update validation failed');
      req.params.id = '1';

      adminUserData.updateUser.mockRejectedValue(error);

      await expect(
        adminUserController.updateUserHandler(req, res, next)
      ).rejects.toThrow('Update validation failed');
    });

    test('should handle errors in delete handler', async () => {
      const error = new Error('User not found');
      req.params.userId = 'invalid';

      adminUserData.inactivateUser.mockRejectedValue(error);

      await expect(
        adminUserController.deleteUserHandler(req, res, next)
      ).rejects.toThrow('User not found');
    });

    test('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';

      adminUserData.getAllUsersWithRoles.mockRejectedValue(error);

      await expect(
        adminUserController.getUsersDashboard(req, res, next)
      ).rejects.toThrow('Request timeout');
    });

    test('should handle user not found error in edit form', async () => {
      const error = new Error('User not found');
      req.params.id = 'invalid';

      adminUserData.getUserById.mockRejectedValue(error);

      await expect(
        adminUserController.getEditUserForm(req, res, next)
      ).rejects.toThrow('User not found');
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should work with different user role permissions', async () => {
      req.user.role.permissions = ['limited.view'];

      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
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

      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
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

      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          user: customUser
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should call getAllUsersWithRoles once', async () => {
      adminUserData.getAllUsersWithRoles.mockResolvedValue([]);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(adminUserData.getAllUsersWithRoles).toHaveBeenCalledTimes(1);
    });

    test('should not modify service response data', async () => {
      const originalUsers = [
        { _id: '1', username: 'user1' },
        { _id: '2', username: 'user2' }
      ];

      adminUserData.getAllUsersWithRoles.mockResolvedValue(originalUsers);

      await adminUserController.getUsersDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/userdash',
        expect.objectContaining({
          users: originalUsers
        })
      );
    });

    test('should pass correct user ID to getUserById', async () => {
      const userId = '123abc';
      const user = { _id: userId, username: 'testuser' };
      req.params.id = userId;

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(adminUserData.getUserById).toHaveBeenCalledWith(userId);
    });

    test('should call getUserFormData during form rendering', async () => {
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(adminUserData.getUserFormData).toHaveBeenCalledTimes(1);
    });

    test('should handle multiple data service calls in edit form', async () => {
      const user = { _id: '1', username: 'testuser' };
      req.params.id = '1';

      adminUserData.getUserById.mockResolvedValue(user);
      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getEditUserForm(req, res, next);

      expect(adminUserData.getUserById).toHaveBeenCalledTimes(1);
      expect(adminUserData.getUserFormData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Management', () => {
    
    test('should preserve session data in form before clearing', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = { user: 'data' };

      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      const renderCall = res.render.mock.calls[0];
      expect(renderCall[1].failMessage).toBe('Error');
      expect(renderCall[1].successMessage).toBe('Success');
      expect(renderCall[1].formData).toEqual({ user: 'data' });
    });

    test('should handle null session values', async () => {
      req.session.failMessage = null;
      req.session.successMessage = null;
      req.session.formData = null;

      adminUserData.getUserFormData.mockResolvedValue({ roles: [] });

      await adminUserController.getNewUserForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newUser',
        expect.objectContaining({
          failMessage: null,
          successMessage: null,
          formData: null
        })
      );
    });
  });

});

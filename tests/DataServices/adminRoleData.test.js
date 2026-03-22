import {
  getAllRoles,
  getRoleById,
  getAllRolesWithUserCounts,
  getRoleFormData,
  createRole,
  updateRole,
  deleteRole
} from '../../DataServices/adminRoleData.js';
import Role from '../../models/Role.js';
import User from '../../models/User.js';
import Permissions from '../../models/Permissions.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Role.js', () => {
  const RoleMock = jest.fn();
  RoleMock.find = jest.fn();
  RoleMock.findById = jest.fn();
  RoleMock.findByIdAndUpdate = jest.fn();
  RoleMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: RoleMock
  };
});

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn()
  }
}));

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn()
  }
}));

describe('adminRoleData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    test('returns all roles', async () => {
      const roles = [{ _id: 'r1', roleName: 'Admin' }];
      Role.find.mockResolvedValue(roles);

      const result = await getAllRoles();

      expect(Role.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(roles);
    });

    test('propagates find errors', async () => {
      Role.find.mockRejectedValue(new Error('find failed'));

      await expect(getAllRoles()).rejects.toThrow('find failed');
    });
  });

  describe('getRoleById', () => {
    test('returns role by id', async () => {
      const role = { _id: 'r1', roleName: 'Editor' };
      Role.findById.mockResolvedValue(role);

      const result = await getRoleById('r1');

      expect(Role.findById).toHaveBeenCalledWith('r1');
      expect(result).toEqual(role);
    });

    test('returns null when role does not exist', async () => {
      Role.findById.mockResolvedValue(null);

      const result = await getRoleById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getAllRolesWithUserCounts', () => {
    test('returns roles with user counts', async () => {
      const roles = [
        { _id: 'r1', roleName: 'Admin' },
        { _id: 'r2', roleName: 'Judge' }
      ];

      Role.find.mockResolvedValue(roles);
      User.countDocuments
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(0);

      const result = await getAllRolesWithUserCounts();

      expect(Role.find).toHaveBeenCalledTimes(1);
      expect(User.countDocuments).toHaveBeenNthCalledWith(1, { role: 'r1' });
      expect(User.countDocuments).toHaveBeenNthCalledWith(2, { role: 'r2' });
      expect(result).toEqual({
        roles,
        RoleNumList: [
          { roleID: 'r1', count: 4 },
          { roleID: 'r2', count: 0 }
        ]
      });
    });

    test('propagates count errors', async () => {
      Role.find.mockResolvedValue([{ _id: 'r1', roleName: 'Admin' }]);
      User.countDocuments.mockRejectedValue(new Error('count failed'));

      await expect(getAllRolesWithUserCounts()).rejects.toThrow('count failed');
    });
  });

  describe('getRoleFormData', () => {
    test('returns permission list for role form', async () => {
      const permissions = [{ _id: 'p1', name: 'users.read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getRoleFormData();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ permissions });
    });

    test('propagates permission loading errors', async () => {
      Permissions.find.mockRejectedValue(new Error('permissions failed'));

      await expect(getRoleFormData()).rejects.toThrow('permissions failed');
    });
  });

  describe('createRole', () => {
    test('creates, saves and logs role', async () => {
      const input = {
        roleName: 'Coordinator',
        description: 'Event coordinator',
        permissions: ['event.read', 'event.update']
      };
      const created = {
        ...input,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Role.mockImplementation(() => created);

      const result = await createRole(input);

      expect(Role).toHaveBeenCalledWith({
        roleName: 'Coordinator',
        description: 'Event coordinator',
        permissions: ['event.read', 'event.update']
      });
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Role', 'Coordinator');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const input = {
        roleName: 'Coordinator',
        description: 'Event coordinator',
        permissions: ['event.read']
      };
      const created = {
        ...input,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Role.mockImplementation(() => created);

      await expect(createRole(input)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    test('updates role and logs update', async () => {
      const updated = {
        _id: 'r1',
        roleName: 'Chief Judge',
        description: 'Chief',
        permissions: ['results.read']
      };
      const payload = {
        roleName: 'Chief Judge',
        description: 'Chief',
        permissions: ['results.read']
      };
      Role.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateRole('r1', payload);

      expect(Role.findByIdAndUpdate).toHaveBeenCalledWith(
        'r1',
        payload,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Role', 'Chief Judge');
      expect(result).toEqual(updated);
    });

    test('propagates update errors', async () => {
      Role.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(
        updateRole('r1', {
          roleName: 'x',
          description: 'x',
          permissions: []
        })
      ).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteRole', () => {
    test('throws when role does not exist', async () => {
      Role.findById.mockResolvedValue(null);

      await expect(deleteRole('missing')).rejects.toThrow('Role not found');
      expect(User.countDocuments).not.toHaveBeenCalled();
      expect(Role.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('throws when role is assigned to users', async () => {
      Role.findById.mockResolvedValue({ _id: 'r1', roleName: 'Admin' });
      User.countDocuments.mockResolvedValue(2);

      await expect(deleteRole('r1')).rejects.toThrow(
        'Cannot delete role. It is assigned to one or more users.'
      );
      expect(Role.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('deletes role when it is not assigned and logs deletion', async () => {
      const role = { _id: 'r1', roleName: 'TempRole' };
      Role.findById.mockResolvedValue(role);
      User.countDocuments.mockResolvedValue(0);
      Role.findByIdAndDelete.mockResolvedValue(role);

      const result = await deleteRole('r1');

      expect(User.countDocuments).toHaveBeenCalledWith({ role: 'r1' });
      expect(Role.findByIdAndDelete).toHaveBeenCalledWith('r1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'Role', 'TempRole');
      expect(result).toEqual(role);
    });
  });
});

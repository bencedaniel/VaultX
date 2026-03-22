import {
  getAllPermissions,
  getPermissionById,
  getAllPermissionsWithUsageCounts,
  createPermission,
  updatePermission,
  deletePermission
} from '../../DataServices/adminPermissionData.js';
import Permissions from '../../models/Permissions.js';
import Role from '../../models/Role.js';
import DashCards from '../../models/DashCards.js';
import Alert from '../../models/Alert.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Permissions.js', () => {
  const PermissionsMock = jest.fn();
  PermissionsMock.find = jest.fn();
  PermissionsMock.findById = jest.fn();
  PermissionsMock.findByIdAndUpdate = jest.fn();
  PermissionsMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: PermissionsMock
  };
});

jest.mock('../../models/Role.js', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn()
  }
}));

jest.mock('../../models/DashCards.js', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn()
  }
}));

jest.mock('../../models/Alert.js', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn()
  }
}));

describe('adminPermissionData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPermissions', () => {
    test('returns all permissions', async () => {
      const permissions = [{ _id: 'p1', name: 'users.read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getAllPermissions();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });

    test('propagates find errors', async () => {
      Permissions.find.mockRejectedValue(new Error('find failed'));

      await expect(getAllPermissions()).rejects.toThrow('find failed');
    });
  });

  describe('getPermissionById', () => {
    test('returns permission by id', async () => {
      const permission = { _id: 'perm1', name: 'admin.read' };
      Permissions.findById.mockResolvedValue(permission);

      const result = await getPermissionById('perm1');

      expect(Permissions.findById).toHaveBeenCalledWith('perm1');
      expect(result).toEqual(permission);
    });

    test('returns null when permission is missing', async () => {
      Permissions.findById.mockResolvedValue(null);

      const result = await getPermissionById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getAllPermissionsWithUsageCounts', () => {
    test('returns permissions with role/card/alert usage counts', async () => {
      const permissions = [
        { _id: 'p1', name: 'perm.one' },
        { _id: 'p2', name: 'perm.two' }
      ];

      Permissions.find.mockResolvedValue(permissions);
      Role.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);
      DashCards.countDocuments
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(1);
      Alert.countDocuments
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4);

      const result = await getAllPermissionsWithUsageCounts();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(Role.countDocuments).toHaveBeenNthCalledWith(1, { permissions: 'perm.one' });
      expect(Role.countDocuments).toHaveBeenNthCalledWith(2, { permissions: 'perm.two' });
      expect(DashCards.countDocuments).toHaveBeenNthCalledWith(1, { perm: 'perm.one' });
      expect(DashCards.countDocuments).toHaveBeenNthCalledWith(2, { perm: 'perm.two' });
      expect(Alert.countDocuments).toHaveBeenNthCalledWith(1, { permission: 'perm.one' });
      expect(Alert.countDocuments).toHaveBeenNthCalledWith(2, { permission: 'perm.two' });
      expect(result).toEqual({
        permissions,
        RolePermNumList: [
          {
            permID: 'p1',
            Rolecount: 2,
            Cardcount: 5,
            Alertcount: 3
          },
          {
            permID: 'p2',
            Rolecount: 0,
            Cardcount: 1,
            Alertcount: 4
          }
        ]
      });
    });

    test('propagates count query errors', async () => {
      Permissions.find.mockResolvedValue([{ _id: 'p1', name: 'perm.one' }]);
      Role.countDocuments.mockRejectedValue(new Error('count failed'));

      await expect(getAllPermissionsWithUsageCounts()).rejects.toThrow('count failed');
    });
  });

  describe('createPermission', () => {
    test('creates, saves and logs new permission', async () => {
      const input = {
        name: 'users.create',
        displayName: 'Create user',
        attachedURL: '/users',
        requestType: 'POST'
      };
      const created = {
        ...input,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Permissions.mockImplementation(() => created);

      const result = await createPermission(input);

      expect(Permissions).toHaveBeenCalledWith({
        name: 'users.create',
        displayName: 'Create user',
        attachedURL: '/users',
        requestType: 'POST'
      });
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Permission', 'users.create');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const input = {
        name: 'users.create',
        displayName: 'Create user',
        attachedURL: '/users',
        requestType: 'POST'
      };
      const created = {
        ...input,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Permissions.mockImplementation(() => created);

      await expect(createPermission(input)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updatePermission', () => {
    test('updates permission and logs update', async () => {
      const updated = {
        _id: 'perm1',
        name: 'users.update',
        displayName: 'Update user',
        attachedURL: '/users'
      };
      Permissions.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updatePermission('perm1', {
        displayName: 'Update user',
        attachedURL: '/users'
      });

      expect(Permissions.findByIdAndUpdate).toHaveBeenCalledWith(
        'perm1',
        {
          displayName: 'Update user',
          attachedURL: '/users'
        },
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Permission', 'users.update');
      expect(result).toEqual(updated);
    });

    test('propagates update errors', async () => {
      Permissions.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(
        updatePermission('perm1', { displayName: 'x', attachedURL: '/x' })
      ).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deletePermission', () => {
    test('throws when permission does not exist', async () => {
      Permissions.findById.mockResolvedValue(null);

      await expect(deletePermission('missing')).rejects.toThrow('Permission not found');
      expect(DashCards.countDocuments).not.toHaveBeenCalled();
      expect(Alert.countDocuments).not.toHaveBeenCalled();
      expect(Role.countDocuments).not.toHaveBeenCalled();
      expect(Permissions.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('throws when permission is used by dashboard cards', async () => {
      Permissions.findById.mockResolvedValue({ _id: 'perm1', name: 'perm.in.use' });
      DashCards.countDocuments.mockResolvedValue(2);

      await expect(deletePermission('perm1')).rejects.toThrow(
        'Cannot delete permission. It is assigned to one or more dashboard cards.'
      );
      expect(Alert.countDocuments).not.toHaveBeenCalled();
      expect(Role.countDocuments).not.toHaveBeenCalled();
      expect(Permissions.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('throws when permission is used by alerts', async () => {
      Permissions.findById.mockResolvedValue({ _id: 'perm1', name: 'perm.alert' });
      DashCards.countDocuments.mockResolvedValue(0);
      Alert.countDocuments.mockResolvedValue(1);

      await expect(deletePermission('perm1')).rejects.toThrow(
        'Cannot delete permission. It is assigned to one or more alerts.'
      );
      expect(Role.countDocuments).not.toHaveBeenCalled();
      expect(Permissions.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('throws when permission is used by roles', async () => {
      Permissions.findById.mockResolvedValue({ _id: 'perm1', name: 'perm.role' });
      DashCards.countDocuments.mockResolvedValue(0);
      Alert.countDocuments.mockResolvedValue(0);
      Role.countDocuments.mockResolvedValue(4);

      await expect(deletePermission('perm1')).rejects.toThrow(
        'Cannot delete permission. It is assigned to one or more roles.'
      );
      expect(Permissions.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('deletes permission when unused and logs deletion', async () => {
      const permission = { _id: 'perm1', name: 'perm.free' };
      Permissions.findById.mockResolvedValue(permission);
      DashCards.countDocuments.mockResolvedValue(0);
      Alert.countDocuments.mockResolvedValue(0);
      Role.countDocuments.mockResolvedValue(0);
      Permissions.findByIdAndDelete.mockResolvedValue(permission);

      const result = await deletePermission('perm1');

      expect(Permissions.findByIdAndDelete).toHaveBeenCalledWith('perm1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'Permission', 'perm.free');
      expect(result).toEqual(permission);
    });
  });
});

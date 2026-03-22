import {
  isTokenBlacklisted,
  blacklistToken,
  findUserByIdWithRole,
  getRoleWithPermissions
} from '../../DataServices/authMiddlewareData.js';
import Blacklist from '../../models/Blacklist.js';
import User from '../../models/User.js';
import RoleModel from '../../models/Role.js';
import PermissionModel from '../../models/Permissions.js';
import { logger, logDb } from '../../logger.js';

jest.mock('../../models/Blacklist.js', () => {
  const BlacklistMock = jest.fn();
  BlacklistMock.findOne = jest.fn();

  return {
    __esModule: true,
    default: BlacklistMock
  };
});

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../models/Role.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
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
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('authMiddlewareData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isTokenBlacklisted', () => {
    test('returns blacklisted token document when token exists', async () => {
      const doc = { _id: 'b1', token: 'abc' };
      Blacklist.findOne.mockResolvedValue(doc);

      const result = await isTokenBlacklisted('abc');

      expect(Blacklist.findOne).toHaveBeenCalledWith({ token: 'abc' });
      expect(result).toEqual(doc);
    });

    test('returns null when token is not blacklisted', async () => {
      Blacklist.findOne.mockResolvedValue(null);

      const result = await isTokenBlacklisted('missing');

      expect(Blacklist.findOne).toHaveBeenCalledWith({ token: 'missing' });
      expect(result).toBeNull();
    });

    test('propagates blacklist query errors', async () => {
      Blacklist.findOne.mockRejectedValue(new Error('find failed'));

      await expect(isTokenBlacklisted('abc')).rejects.toThrow('find failed');
    });
  });

  describe('blacklistToken', () => {
    test('creates blacklist entry, saves it and logs events', async () => {
      const token = 'token-value';
      const created = {
        _id: 'b123',
        token,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Blacklist.mockImplementation(() => created);

      const result = await blacklistToken(token);

      expect(Blacklist).toHaveBeenCalledWith({ token: 'token-value' });
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logger.userManagement).toHaveBeenCalledWith('Token blacklisted successfully.');
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Blacklist', 'b123');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log success', async () => {
      const created = {
        _id: 'b123',
        token: 'token-value',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Blacklist.mockImplementation(() => created);

      await expect(blacklistToken('token-value')).rejects.toThrow('save failed');
      expect(logger.userManagement).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('findUserByIdWithRole', () => {
    test('returns user populated with role', async () => {
      const user = { _id: 'u1', username: 'alice', role: { _id: 'r1', roleName: 'Admin' } };
      const populateMock = jest.fn().mockResolvedValue(user);
      User.findById.mockReturnValue({ populate: populateMock });

      const result = await findUserByIdWithRole('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(populateMock).toHaveBeenCalledWith('role');
      expect(result).toEqual(user);
    });

    test('propagates populate errors', async () => {
      const populateMock = jest.fn().mockRejectedValue(new Error('populate failed'));
      User.findById.mockReturnValue({ populate: populateMock });

      await expect(findUserByIdWithRole('u1')).rejects.toThrow('populate failed');
    });
  });

  describe('getRoleWithPermissions', () => {
    test('returns role and matching permissions when role exists', async () => {
      const role = {
        _id: 'r1',
        roleName: 'Admin',
        permissions: ['users.read', 'users.update']
      };
      const permissions = [
        { _id: 'p1', name: 'users.read' },
        { _id: 'p2', name: 'users.update' }
      ];

      RoleModel.findById.mockResolvedValue(role);
      PermissionModel.find.mockResolvedValue(permissions);

      const result = await getRoleWithPermissions('r1');

      expect(RoleModel.findById).toHaveBeenCalledWith('r1');
      expect(PermissionModel.find).toHaveBeenCalledWith({
        name: { $in: ['users.read', 'users.update'] }
      });
      expect(result).toEqual({ role, permissions });
    });

    test('returns null when role does not exist', async () => {
      RoleModel.findById.mockResolvedValue(null);

      const result = await getRoleWithPermissions('missing');

      expect(result).toBeNull();
      expect(PermissionModel.find).not.toHaveBeenCalled();
    });

    test('propagates permission lookup errors', async () => {
      const role = {
        _id: 'r1',
        roleName: 'Admin',
        permissions: ['users.read']
      };
      RoleModel.findById.mockResolvedValue(role);
      PermissionModel.find.mockRejectedValue(new Error('permission query failed'));

      await expect(getRoleWithPermissions('r1')).rejects.toThrow('permission query failed');
    });
  });
});

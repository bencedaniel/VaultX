import {
  getUserById,
  getUserByIdWithRole,
  updateUserProfile,
  getAllRoles,
  getUserProfileFormData
} from '../../DataServices/userData.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import bcrypt from 'bcrypt';
import { logDb, logDebug } from '../../logger.js';

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.mock('../../models/Role.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    hash: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logDebug: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('userData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    test('returns user when found', async () => {
      const user = { _id: 'u1', username: 'alice' };
      User.findById.mockResolvedValue(user);

      const result = await getUserById('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual(user);
    });

    test('throws when user is not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(getUserById('missing')).rejects.toThrow('User not found');
    });
  });

  describe('getUserByIdWithRole', () => {
    test('returns user with populated role', async () => {
      const user = { _id: 'u1', role: { _id: 'r1', roleName: 'Admin' } };
      const populateMock = jest.fn().mockResolvedValue(user);
      User.findById.mockReturnValue({ populate: populateMock });

      const result = await getUserByIdWithRole('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(populateMock).toHaveBeenCalledWith('role');
      expect(result).toEqual(user);
    });

    test('throws when populated user is not found', async () => {
      const populateMock = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({ populate: populateMock });

      await expect(getUserByIdWithRole('missing')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    test('keeps old password when incoming password is empty', async () => {
      const existing = { _id: 'u1', password: 'old-hash' };
      const updated = { _id: 'u1', username: 'alice' };
      User.findById.mockResolvedValue(existing);
      User.findByIdAndUpdate.mockResolvedValue(updated);

      const payload = {
        username: 'alice',
        feiid: 'F1',
        fullname: 'Alice A',
        password: ''
      };

      const result = await updateUserProfile('u1', payload);

      expect(logDebug).toHaveBeenCalledWith(
        `Updating user u1 with data: ${JSON.stringify(payload)}`
      );
      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        {
          username: 'alice',
          feiid: 'F1',
          fullname: 'Alice A',
          password: 'old-hash'
        },
        { runValidators: true, new: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'User', 'u1');
      expect(result).toEqual(updated);
    });

    test('throws when user not found in empty password branch', async () => {
      User.findById.mockResolvedValue(null);

      await expect(
        updateUserProfile('missing', {
          username: 'x',
          feiid: 'F1',
          fullname: 'X',
          password: ''
        })
      ).rejects.toThrow('User not found');

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('hashes password when provided and updates user', async () => {
      bcrypt.hash.mockResolvedValue('new-hash');
      const updated = { _id: 'u1', username: 'alice' };
      User.findByIdAndUpdate.mockResolvedValue(updated);

      const payload = {
        username: 'alice',
        feiid: 'F1',
        fullname: 'Alice A',
        password: 'plain-secret'
      };

      const result = await updateUserProfile('u1', payload);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-secret', 10);
      expect(User.findById).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        {
          username: 'alice',
          feiid: 'F1',
          fullname: 'Alice A',
          password: 'new-hash'
        },
        { runValidators: true, new: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'User', 'u1');
      expect(result).toEqual(updated);
    });

    test('throws when updated user is not found', async () => {
      bcrypt.hash.mockResolvedValue('new-hash');
      User.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        updateUserProfile('u1', {
          username: 'alice',
          feiid: 'F1',
          fullname: 'Alice A',
          password: 'plain-secret'
        })
      ).rejects.toThrow('User not found');

      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates hash errors and does not update/log', async () => {
      bcrypt.hash.mockRejectedValue(new Error('hash failed'));

      await expect(
        updateUserProfile('u1', {
          username: 'alice',
          feiid: 'F1',
          fullname: 'Alice A',
          password: 'plain-secret'
        })
      ).rejects.toThrow('hash failed');

      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors and does not log db', async () => {
      bcrypt.hash.mockResolvedValue('new-hash');
      User.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(
        updateUserProfile('u1', {
          username: 'alice',
          feiid: 'F1',
          fullname: 'Alice A',
          password: 'plain-secret'
        })
      ).rejects.toThrow('update failed');

      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getAllRoles', () => {
    test('returns all roles', async () => {
      const roles = [{ _id: 'r1', roleName: 'Admin' }];
      Role.find.mockResolvedValue(roles);

      const result = await getAllRoles();

      expect(Role.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(roles);
    });

    test('propagates role query errors', async () => {
      Role.find.mockRejectedValue(new Error('roles failed'));

      await expect(getAllRoles()).rejects.toThrow('roles failed');
    });
  });

  describe('getUserProfileFormData', () => {
    test('returns role list in form data object', async () => {
      const roleList = [{ _id: 'r1', roleName: 'Admin' }];
      Role.find.mockResolvedValue(roleList);

      const result = await getUserProfileFormData();

      expect(Role.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ roleList });
    });

    test('propagates role list query errors', async () => {
      Role.find.mockRejectedValue(new Error('roles failed'));

      await expect(getUserProfileFormData()).rejects.toThrow('roles failed');
    });
  });
});

import {
  getAllUsersWithRoles,
  getUserById,
  getUserFormData,
  updateUser,
  inactivateUser
} from '../../DataServices/adminUserData.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import bcrypt from 'bcrypt';
import { logDb } from '../../logger.js';

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
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
  logger: {
    debug: jest.fn()
  }
}));

describe('adminUserData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsersWithRoles', () => {
    test('returns all users with populated role names', async () => {
      const users = [{ _id: 'u1', username: 'alice', role: { roleName: 'Admin' } }];
      const populateMock = jest.fn().mockResolvedValue(users);
      User.find.mockReturnValue({ populate: populateMock });

      const result = await getAllUsersWithRoles();

      expect(User.find).toHaveBeenCalledTimes(1);
      expect(populateMock).toHaveBeenCalledWith('role', 'roleName');
      expect(result).toEqual(users);
    });

    test('propagates query errors from populate chain', async () => {
      const populateMock = jest.fn().mockRejectedValue(new Error('populate failed'));
      User.find.mockReturnValue({ populate: populateMock });

      await expect(getAllUsersWithRoles()).rejects.toThrow('populate failed');
    });
  });

  describe('getUserById', () => {
    test('returns user by id', async () => {
      const user = { _id: 'u1', username: 'alice' };
      User.findById.mockResolvedValue(user);

      const result = await getUserById('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual(user);
    });

    test('returns null when user does not exist', async () => {
      User.findById.mockResolvedValue(null);

      const result = await getUserById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getUserFormData', () => {
    test('returns roles for user form', async () => {
      const roles = [{ _id: 'r1', roleName: 'Admin' }];
      Role.find.mockResolvedValue(roles);

      const result = await getUserFormData();

      expect(Role.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ roles });
    });

    test('propagates role loading errors', async () => {
      Role.find.mockRejectedValue(new Error('roles failed'));

      await expect(getUserFormData()).rejects.toThrow('roles failed');
    });
  });

  describe('updateUser', () => {
    test('keeps old password when incoming password is empty string', async () => {
      const existingUser = { _id: 'u1', username: 'alice', password: 'old-hash' };
      const updatedUser = { _id: 'u1', username: 'alice', password: 'old-hash' };

      User.findById.mockResolvedValue(existingUser);
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const input = {
        username: 'alice',
        email: 'alice@example.com',
        password: ''
      };

      const result = await updateUser('u1', input);

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        {
          username: 'alice',
          email: 'alice@example.com',
          password: 'old-hash'
        },
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'User', 'alice');
      expect(result).toEqual(updatedUser);
    });

    test('hashes provided password before updating user', async () => {
      bcrypt.hash.mockResolvedValue('new-hash');
      const updatedUser = { _id: 'u1', username: 'bob', password: 'new-hash' };
      User.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const input = {
        username: 'bob',
        email: 'bob@example.com',
        password: 'plain-secret'
      };

      const result = await updateUser('u1', input);

      expect(User.findById).not.toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('plain-secret', 10);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        {
          username: 'bob',
          email: 'bob@example.com',
          password: 'new-hash'
        },
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'User', 'bob');
      expect(result).toEqual(updatedUser);
    });

    test('propagates hashing errors', async () => {
      bcrypt.hash.mockRejectedValue(new Error('hash failed'));

      await expect(
        updateUser('u1', {
          username: 'bob',
          password: 'plain-secret'
        })
      ).rejects.toThrow('hash failed');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors after password processing', async () => {
      bcrypt.hash.mockResolvedValue('new-hash');
      User.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(
        updateUser('u1', {
          username: 'bob',
          password: 'plain-secret'
        })
      ).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('inactivateUser', () => {
    test('throws when user is not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(inactivateUser('missing')).rejects.toThrow('User not found');
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('marks user inactive, persists and logs update', async () => {
      const user = {
        _id: 'u1',
        username: 'charlie',
        active: true,
        role: 'r1'
      };
      User.findById.mockResolvedValue(user);
      User.findByIdAndUpdate.mockResolvedValue({ ...user, active: false });

      const result = await inactivateUser('u1');

      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(user.active).toBe(false);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        user,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'User', 'charlie');
      expect(result).toBe(user);
    });

    test('propagates update errors during inactivation', async () => {
      const user = { _id: 'u1', username: 'charlie', active: true };
      User.findById.mockResolvedValue(user);
      User.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(inactivateUser('u1')).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });
});

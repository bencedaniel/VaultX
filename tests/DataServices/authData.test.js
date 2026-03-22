import {
  findUserByUsername,
  findUserByUsernameWithPassword,
  createUser,
  validateUserPassword,
  isTokenBlacklisted,
  blacklistToken
} from '../../DataServices/authData.js';
import User from '../../models/User.js';
import Blacklist from '../../models/Blacklist.js';
import bcrypt from 'bcrypt';
import { logDb, logAuth } from '../../logger.js';

jest.mock('../../models/User.js', () => {
  const UserMock = jest.fn();
  UserMock.findOne = jest.fn();

  return {
    __esModule: true,
    default: UserMock
  };
});

jest.mock('../../models/Blacklist.js', () => {
  const BlacklistMock = jest.fn();
  BlacklistMock.findOne = jest.fn();

  return {
    __esModule: true,
    default: BlacklistMock
  };
});

jest.mock('bcrypt', () => ({
  __esModule: true,
  default: {
    compare: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logAuth: jest.fn(),
  logger: {
    debug: jest.fn()
  }
}));

describe('authData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserByUsername', () => {
    test('returns user when found', async () => {
      const user = { _id: 'u1', username: 'alice' };
      User.findOne.mockResolvedValue(user);

      const result = await findUserByUsername('alice');

      expect(User.findOne).toHaveBeenCalledWith({ username: 'alice' });
      expect(result).toEqual(user);
    });

    test('returns null when user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await findUserByUsername('missing');

      expect(result).toBeNull();
    });
  });

  describe('findUserByUsernameWithPassword', () => {
    test('returns user with password via select', async () => {
      const userWithPassword = { _id: 'u1', username: 'alice', password: 'hash' };
      const selectMock = jest.fn().mockResolvedValue(userWithPassword);
      User.findOne.mockReturnValue({ select: selectMock });

      const result = await findUserByUsernameWithPassword('alice');

      expect(User.findOne).toHaveBeenCalledWith({ username: 'alice' });
      expect(selectMock).toHaveBeenCalledWith('+password');
      expect(result).toEqual(userWithPassword);
    });

    test('propagates select errors', async () => {
      const selectMock = jest.fn().mockRejectedValue(new Error('select failed'));
      User.findOne.mockReturnValue({ select: selectMock });

      await expect(findUserByUsernameWithPassword('alice')).rejects.toThrow('select failed');
    });
  });

  describe('createUser', () => {
    test('creates new user and logs auth/db events', async () => {
      const payload = {
        username: 'bob',
        fullname: 'Bob Smith',
        password: 'hash123',
        feiid: 'F123',
        role: 'role1'
      };
      const createdUser = {
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => createdUser);

      const result = await createUser(payload);

      expect(User.findOne).toHaveBeenCalledWith({ username: 'bob' });
      expect(User).toHaveBeenCalledWith({
        username: 'bob',
        fullname: 'Bob Smith',
        password: 'hash123',
        feiid: 'F123',
        role: 'role1'
      });
      expect(createdUser.save).toHaveBeenCalledTimes(1);
      expect(logAuth).toHaveBeenCalledWith('CREATE', 'User', 'bob');
      expect(logDb).toHaveBeenCalledWith('CREATE', 'User', 'bob');
      expect(result).toBe(createdUser);
    });

    test('throws when username already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing', username: 'bob' });

      await expect(
        createUser({
          username: 'bob',
          fullname: 'Bob Smith',
          password: 'hash123',
          feiid: 'F123',
          role: 'role1'
        })
      ).rejects.toThrow('User already exists');

      expect(User).not.toHaveBeenCalled();
      expect(logAuth).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates save errors and does not log', async () => {
      const payload = {
        username: 'eve',
        fullname: 'Eve',
        password: 'hash123',
        feiid: 'F777',
        role: 'role2'
      };
      const createdUser = {
        ...payload,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };

      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => createdUser);

      await expect(createUser(payload)).rejects.toThrow('save failed');
      expect(logAuth).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('validateUserPassword', () => {
    test('returns compare result from bcrypt', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await validateUserPassword('plain', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(result).toBe(true);
    });

    test('propagates bcrypt compare errors', async () => {
      bcrypt.compare.mockRejectedValue(new Error('compare failed'));

      await expect(validateUserPassword('plain', 'hashed')).rejects.toThrow('compare failed');
    });
  });

  describe('isTokenBlacklisted', () => {
    test('returns true when token exists in blacklist', async () => {
      Blacklist.findOne.mockResolvedValue({ _id: 'b1', token: 'abc' });

      const result = await isTokenBlacklisted('abc');

      expect(Blacklist.findOne).toHaveBeenCalledWith({ token: 'abc' });
      expect(result).toBe(true);
    });

    test('returns false when token is not blacklisted', async () => {
      Blacklist.findOne.mockResolvedValue(null);

      const result = await isTokenBlacklisted('abc');

      expect(result).toBe(false);
    });
  });

  describe('blacklistToken', () => {
    test('creates blacklist entry, saves it and logs shortened token', async () => {
      const token = '1234567890abcdef';
      const blacklistEntry = {
        token,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Blacklist.mockImplementation(() => blacklistEntry);

      const result = await blacklistToken(token);

      expect(Blacklist).toHaveBeenCalledWith({ token });
      expect(blacklistEntry.save).toHaveBeenCalledTimes(1);
      expect(logAuth).toHaveBeenCalledWith('CREATE', 'Blacklist', '1234567890...');
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Blacklist', '1234567890...');
      expect(result).toBe(blacklistEntry);
    });

    test('propagates save errors for blacklist token and does not log', async () => {
      const token = '1234567890abcdef';
      const blacklistEntry = {
        token,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Blacklist.mockImplementation(() => blacklistEntry);

      await expect(blacklistToken(token)).rejects.toThrow('save failed');
      expect(logAuth).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });
});

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_ACCESS_TOKEN, TIMEOUT } from '../../config/env.js';
import User from '../../models/User.js';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

function runSavePreHook(doc) {
  return new Promise((resolve, reject) => {
    User.schema.s.hooks.execPre('save', doc, [], err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

describe('User Model - Unit Tests', () => {
  const roleId = new mongoose.Types.ObjectId();
  const validData = {
    username: 'johndoe',
    fullname: 'John Doe',
    password: 'PlainPassword123',
    feiid: 'ABCD1234',
    role: roleId
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Schema Validation', () => {
    test('creates valid user with required fields', () => {
      const user = new User(validData);
      const validationError = user.validateSync();

      expect(validationError).toBeUndefined();
      expect(user.username).toBe('johndoe');
      expect(user.fullname).toBe('John Doe');
      expect(user.role.toString()).toBe(roleId.toString());
    });

    test('fails validation when username is missing', () => {
      const { username, ...payload } = validData;
      const user = new User(payload);
      const validationError = user.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.username).toBeDefined();
      expect(validationError.errors.username.message).toBe('Username required!');
    });

    test('fails validation when role is missing', () => {
      const { role, ...payload } = validData;
      const user = new User(payload);
      const validationError = user.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.role).toBeDefined();
      expect(validationError.errors.role.message).toBe('Role required!');
    });

    test('applies active=true default', () => {
      const user = new User({
        username: 'anna',
        fullname: 'Anna Test',
        password: 'Secret123',
        role: roleId
      });

      expect(user.active).toBe(true);
    });

    test('converts empty feiid to undefined via setter', () => {
      const user = new User({ ...validData, feiid: '' });

      expect(user.feiid).toBeUndefined();
      expect(user.validateSync()).toBeUndefined();
    });

    test('fails validation when feiid length is not 8', () => {
      const user = new User({ ...validData, feiid: 'SHORT' });
      const validationError = user.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.message).toBe('FEI ID must be 8 characters!');
    });
  });

  describe('User Schema Properties', () => {
    test('username and feiid are unique and feiid is sparse', () => {
      expect(User.schema.paths.username.options.unique).toBe(true);
      expect(User.schema.paths.feiid.options.unique).toBe(true);
      expect(User.schema.paths.feiid.options.sparse).toBe(true);
    });

    test('role field is ObjectId referencing roles', () => {
      expect(User.schema.paths.role.instance).toBe('ObjectId');
      expect(User.schema.paths.role.options.ref).toBe('roles');
    });

    test('schema has timestamps enabled and model name users', () => {
      expect(User.schema.options.timestamps).toBe(true);
      expect(User.schema.paths.createdAt).toBeDefined();
      expect(User.schema.paths.updatedAt).toBeDefined();
      expect(User.modelName).toBe('users');
    });
  });

  describe('User pre-save password hashing hook', () => {
    test('hashes password when password is modified', async () => {
      bcrypt.genSalt.mockImplementation((rounds, cb) => cb(null, 'salt10'));
      bcrypt.hash.mockImplementation((password, salt, cb) => cb(null, 'hashed-password'));

      const user = new User(validData);
      user.isModified = jest.fn().mockReturnValue(true);

      await expect(runSavePreHook(user)).resolves.toBeUndefined();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10, expect.any(Function));
      expect(bcrypt.hash).toHaveBeenCalledWith('PlainPassword123', 'salt10', expect.any(Function));
      expect(user.password).toBe('hashed-password');
    });

    test('skips hashing when password is not modified', async () => {
      const user = new User(validData);
      user.isModified = jest.fn().mockReturnValue(false);

      await expect(runSavePreHook(user)).resolves.toBeUndefined();

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBe('PlainPassword123');
    });

    test('propagates genSalt error', async () => {
      bcrypt.genSalt.mockImplementation((rounds, cb) => cb(new Error('salt error')));

      const user = new User(validData);
      user.isModified = jest.fn().mockReturnValue(true);

      await expect(runSavePreHook(user)).rejects.toThrow('salt error');
    });

    test('propagates hash error', async () => {
      bcrypt.genSalt.mockImplementation((rounds, cb) => cb(null, 'salt10'));
      bcrypt.hash.mockImplementation((password, salt, cb) => cb(new Error('hash error')));

      const user = new User(validData);
      user.isModified = jest.fn().mockReturnValue(true);

      await expect(runSavePreHook(user)).rejects.toThrow('hash error');
    });
  });

  describe('generateAccessJWT', () => {
    test('calls jwt.sign with id payload and computed expiration', () => {
      jwt.sign.mockReturnValue('access-token');

      const user = new User(validData);
      user._id = new mongoose.Types.ObjectId();

      const token = user.generateAccessJWT();
      const timeoutMinutes = parseInt(TIMEOUT, 10) * 3 || 90;

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: user._id },
        SECRET_ACCESS_TOKEN,
        { expiresIn: `${timeoutMinutes}m` }
      );
      expect(token).toBe('access-token');
    });
  });
});

import Blacklist from '../../models/Blacklist.js';

describe('Blacklist Model - Unit Tests', () => {
  describe('Blacklist Schema Validation', () => {
    test('creates valid blacklist entry with token', () => {
      const entry = new Blacklist({ token: 'jwt-token-123' });
      const validationError = entry.validateSync();

      expect(validationError).toBeUndefined();
      expect(entry.token).toBe('jwt-token-123');
    });

    test('fails validation when token is missing', () => {
      const entry = new Blacklist({});
      const validationError = entry.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.token).toBeDefined();
      expect(validationError.errors.token.kind).toBe('required');
    });

    test('accepts token as string field', () => {
      const entry = new Blacklist({ token: 'header.payload.signature' });
      const validationError = entry.validateSync();

      expect(validationError).toBeUndefined();
      expect(typeof entry.token).toBe('string');
    });
  });

  describe('Blacklist Schema Properties', () => {
    test('token path references User model', () => {
      const tokenPath = Blacklist.schema.paths.token;

      expect(tokenPath.options.ref).toBe('User');
      expect(tokenPath.instance).toBe('String');
    });

    test('schema has timestamps enabled', () => {
      expect(Blacklist.schema.options.timestamps).toBe(true);
      expect(Blacklist.schema.paths.createdAt).toBeDefined();
      expect(Blacklist.schema.paths.updatedAt).toBeDefined();
    });

    test('model is registered with blacklist name', () => {
      expect(Blacklist.modelName).toBe('blacklist');
    });
  });
});

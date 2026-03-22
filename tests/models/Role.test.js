import Role from '../../models/Role.js';

describe('Role Model - Unit Tests', () => {
  const validRoleData = {
    roleName: 'Judge',
    permissions: ['VIEW_DASHBOARD', 'SUBMIT_SCORE'],
    description: 'Judge role with scoring permissions'
  };

  describe('Role Schema Validation', () => {
    test('creates a valid role with required fields', () => {
      const doc = new Role(validRoleData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.roleName).toBe('Judge');
      expect(doc.permissions).toEqual(['VIEW_DASHBOARD', 'SUBMIT_SCORE']);
      expect(doc.description).toBe('Judge role with scoring permissions');
    });

    test('fails validation when roleName is missing', () => {
      const { roleName, ...payload } = validRoleData;
      const doc = new Role(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.roleName).toBeDefined();
      expect(validationError.errors.roleName.message).toBe('Role name required!');
    });

    test('when permissions is omitted, mongoose initializes it as empty array', () => {
      const { permissions, ...payload } = validRoleData;
      const doc = new Role(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.permissions).toEqual([]);
    });

    test('fails validation when description is explicitly undefined', () => {
      const doc = new Role({
        roleName: 'Admin',
        permissions: ['ALL'],
        description: undefined
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
      expect(validationError.errors.description.message).toBe('Description required!');
    });
  });

  describe('Role Schema Defaults and Properties', () => {
    test('default empty description still fails required string validation', () => {
      const doc = new Role({
        roleName: 'Organizer',
        permissions: ['MANAGE_EVENTS']
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
      expect(doc.description).toBe('');
    });

    test('roleName path is unique', () => {
      expect(Role.schema.paths.roleName.options.unique).toBe(true);
    });

    test('schema has timestamps enabled and model name is roles', () => {
      expect(Role.schema.options.timestamps).toBe(true);
      expect(Role.schema.paths.createdAt).toBeDefined();
      expect(Role.schema.paths.updatedAt).toBeDefined();
      expect(Role.modelName).toBe('roles');
    });
  });
});

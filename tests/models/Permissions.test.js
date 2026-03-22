import Permission from '../../models/Permissions.js';

describe('Permissions Model - Unit Tests', () => {
  const validPermissionData = {
    name: 'VIEW_DASHBOARD',
    displayName: 'View Dashboard',
    attachedURL: [
      { url: '/dashboard', parent: '/dashboard' },
      { url: '/profile', parent: '/dashboard' }
    ]
  };

  describe('Permission Schema Validation', () => {
    test('creates a valid permission with required fields', () => {
      const doc = new Permission(validPermissionData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.name).toBe('VIEW_DASHBOARD');
      expect(doc.displayName).toBe('View Dashboard');
      expect(doc.attachedURL).toHaveLength(2);
    });

    test('fails validation when name is missing', () => {
      const { name, ...payload } = validPermissionData;
      const doc = new Permission(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.kind).toBe('required');
    });

    test('fails validation when displayName is missing', () => {
      const { displayName, ...payload } = validPermissionData;
      const doc = new Permission(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.displayName).toBeDefined();
      expect(validationError.errors.displayName.kind).toBe('required');
    });

    test('when attachedURL is omitted, mongoose initializes it as empty array', () => {
      const { attachedURL, ...payload } = validPermissionData;
      const doc = new Permission(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.attachedURL).toEqual([]);
    });

    test('fails validation when attachedURL item misses url', () => {
      const doc = new Permission({
        ...validPermissionData,
        attachedURL: [{ parent: '/dashboard' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['attachedURL.0.url']).toBeDefined();
      expect(validationError.errors['attachedURL.0.url'].kind).toBe('required');
    });

    test('fails validation when attachedURL item misses parent', () => {
      const doc = new Permission({
        ...validPermissionData,
        attachedURL: [{ url: '/dashboard' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['attachedURL.0.parent']).toBeDefined();
      expect(validationError.errors['attachedURL.0.parent'].kind).toBe('required');
    });
  });

  describe('Permission Schema Properties', () => {
    test('name path is unique', () => {
      expect(Permission.schema.paths.name.options.unique).toBe(true);
    });

    test('schema has timestamps enabled and model name is permission', () => {
      expect(Permission.schema.options.timestamps).toBe(true);
      expect(Permission.schema.paths.createdAt).toBeDefined();
      expect(Permission.schema.paths.updatedAt).toBeDefined();
      expect(Permission.modelName).toBe('permission');
    });
  });
});

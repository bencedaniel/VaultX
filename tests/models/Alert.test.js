import Alert from '../../models/Alert.js';

describe('Alert Model - Unit Tests', () => {
  describe('Alert Schema Validation', () => {
    test('creates valid alert with required fields', () => {
      const alert = new Alert({
        title: 'System Warning',
        description: 'Service interruption expected',
        permission: 'admin'
      });

      const validationError = alert.validateSync();

      expect(validationError).toBeUndefined();
      expect(alert.title).toBe('System Warning');
      expect(alert.description).toBe('Service interruption expected');
      expect(alert.permission).toBe('admin');
    });

    test('fails validation when title is missing', () => {
      const alert = new Alert({
        description: 'Missing title',
        permission: 'admin'
      });

      const validationError = alert.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Alert title required!');
    });

    test('fails validation when description is missing', () => {
      const alert = new Alert({
        title: 'Missing description',
        permission: 'admin'
      });

      const validationError = alert.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
      expect(validationError.errors.description.message).toBe('Alert description required!');
    });

    test('fails validation when permission is missing', () => {
      const alert = new Alert({
        title: 'Missing permission',
        description: 'No permission value'
      });

      const validationError = alert.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.permission).toBeDefined();
      expect(validationError.errors.permission.message).toBe('Permission required!');
    });
  });

  describe('Alert Schema Defaults and Properties', () => {
    test('applies default values for optional fields', () => {
      const alert = new Alert({
        title: 'Defaults check',
        description: 'Default fields should be set',
        permission: 'judge'
      });

      expect(alert.active).toBe(true);
      expect(alert.reappear).toBe(0);
      expect(alert.style).toBe('danger');
    });

    test('allows overriding default values', () => {
      const alert = new Alert({
        title: 'Custom defaults',
        description: 'Override defaults',
        permission: 'organizer',
        active: false,
        reappear: 3,
        style: 'warning'
      });

      const validationError = alert.validateSync();

      expect(validationError).toBeUndefined();
      expect(alert.active).toBe(false);
      expect(alert.reappear).toBe(3);
      expect(alert.style).toBe('warning');
    });

    test('schema has timestamps enabled', () => {
      expect(Alert.schema.options.timestamps).toBe(true);
      expect(Alert.schema.paths.createdAt).toBeDefined();
      expect(Alert.schema.paths.updatedAt).toBeDefined();
    });

    test('model is registered with alerts collection name', () => {
      expect(Alert.modelName).toBe('alerts');
    });
  });
});

import TableMapping from '../../models/TableMapping.js';

describe('TableMapping Model - Unit Tests', () => {
  const validData = {
    Table: 'A',
    TestType: 'compulsory',
    Role: 'horse'
  };

  describe('TableMapping Schema Validation', () => {
    test('creates valid table mapping with required fields', () => {
      const doc = new TableMapping(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.Table).toBe('A');
      expect(doc.TestType).toBe('compulsory');
      expect(doc.Role).toBe('horse');
    });

    test('fails validation when Table is missing', () => {
      const { Table, ...payload } = validData;
      const doc = new TableMapping(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Table).toBeDefined();
      expect(validationError.errors.Table.message).toBe('Judge Table ID required!');
    });

    test('fails validation when TestType is missing', () => {
      const { TestType, ...payload } = validData;
      const doc = new TableMapping(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.TestType).toBeDefined();
      expect(validationError.errors.TestType.message).toBe('Test type required!');
    });

    test('fails validation when Role is missing', () => {
      const { Role, ...payload } = validData;
      const doc = new TableMapping(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Role).toBeDefined();
      expect(validationError.errors.Role.message).toBe('Role required!');
    });

    test('fails validation when Table is outside enum', () => {
      const doc = new TableMapping({ ...validData, Table: 'Z' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Table).toBeDefined();
      expect(validationError.errors.Table.kind).toBe('enum');
    });

    test('fails validation when TestType is outside enum', () => {
      const doc = new TableMapping({ ...validData, TestType: 'warmup' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.TestType).toBeDefined();
      expect(validationError.errors.TestType.kind).toBe('enum');
    });

    test('fails validation when Role is outside enum', () => {
      const doc = new TableMapping({ ...validData, Role: 'music' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Role).toBeDefined();
      expect(validationError.errors.Role.kind).toBe('enum');
    });
  });

  describe('TableMapping Schema Properties', () => {
    test('Table enum includes A-H values', () => {
      expect(TableMapping.schema.paths.Table.enumValues).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    });

    test('schema has timestamps enabled and model name is tables', () => {
      expect(TableMapping.schema.options.timestamps).toBe(true);
      expect(TableMapping.schema.paths.createdAt).toBeDefined();
      expect(TableMapping.schema.paths.updatedAt).toBeDefined();
      expect(TableMapping.modelName).toBe('tables');
    });
  });
});

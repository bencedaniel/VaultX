import mongoose from 'mongoose';
import ResultGenerator from '../../models/resultGenerator.js';

describe('resultGenerator Model - Unit Tests', () => {
  const ids = {
    category: new mongoose.Types.ObjectId(),
    calcTemplate: new mongoose.Types.ObjectId()
  };

  const validData = {
    category: ids.category,
    calcSchemaTemplate: ids.calcTemplate,
    active: true
  };

  describe('resultGenerator Schema Validation', () => {
    test('creates a valid result generator with required fields', () => {
      const doc = new ResultGenerator(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.category.toString()).toBe(ids.category.toString());
      expect(doc.calcSchemaTemplate.toString()).toBe(ids.calcTemplate.toString());
      expect(doc.active).toBe(true);
    });

    test('fails validation when category is missing', () => {
      const { category, ...payload } = validData;
      const doc = new ResultGenerator(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
      expect(validationError.errors.category.message).toBe('Category required!');
    });

    test('fails validation when calcSchemaTemplate is missing', () => {
      const { calcSchemaTemplate, ...payload } = validData;
      const doc = new ResultGenerator(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.calcSchemaTemplate).toBeDefined();
      expect(validationError.errors.calcSchemaTemplate.message).toBe('Calculation template required!');
    });
  });

  describe('resultGenerator Schema Properties', () => {
    test('applies default active=true when omitted', () => {
      const doc = new ResultGenerator({
        category: ids.category,
        calcSchemaTemplate: ids.calcTemplate
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.active).toBe(true);
    });

    test('category and calcSchemaTemplate reference expected models', () => {
      expect(ResultGenerator.schema.paths.category.options.ref).toBe('categorys');
      expect(ResultGenerator.schema.paths.calcSchemaTemplate.options.ref).toBe('calculationtemplates');
    });

    test('category path has unique constraint configuration', () => {
      expect(ResultGenerator.schema.paths.category.options.unique).toEqual([
        true,
        'A result generator for this category already exists!'
      ]);
    });

    test('schema has timestamps enabled and model name is resultgenerator', () => {
      expect(ResultGenerator.schema.options.timestamps).toBe(true);
      expect(ResultGenerator.schema.paths.createdAt).toBeDefined();
      expect(ResultGenerator.schema.paths.updatedAt).toBeDefined();
      expect(ResultGenerator.modelName).toBe('resultgenerator');
    });
  });
});

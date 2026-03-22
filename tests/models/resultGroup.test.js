import mongoose from 'mongoose';
import ResultGroup from '../../models/resultGroup.js';

describe('resultGroup Model - Unit Tests', () => {
  const ids = {
    event: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId(),
    calcTemplate: new mongoose.Types.ObjectId(),
    part1: new mongoose.Types.ObjectId(),
    part2: new mongoose.Types.ObjectId(),
    part3: new mongoose.Types.ObjectId()
  };

  const validData = {
    event: ids.event,
    category: ids.category,
    calcTemplate: ids.calcTemplate,
    round1First: ids.part1,
    round1Second: ids.part2,
    round2First: ids.part3
  };

  describe('resultGroup Schema Validation', () => {
    test('creates a valid result group with required and optional fields', () => {
      const doc = new ResultGroup(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.event.toString()).toBe(ids.event.toString());
      expect(doc.category.toString()).toBe(ids.category.toString());
      expect(doc.calcTemplate.toString()).toBe(ids.calcTemplate.toString());
      expect(doc.round1First.toString()).toBe(ids.part1.toString());
      expect(doc.round1Second.toString()).toBe(ids.part2.toString());
      expect(doc.round2First.toString()).toBe(ids.part3.toString());
    });

    test('fails validation when event is missing', () => {
      const { event, ...payload } = validData;
      const doc = new ResultGroup(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.event).toBeDefined();
      expect(validationError.errors.event.message).toBe('Event required!');
    });

    test('fails validation when category is missing', () => {
      const { category, ...payload } = validData;
      const doc = new ResultGroup(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
      expect(validationError.errors.category.message).toBe('Category required!');
    });

    test('fails validation when calcTemplate is missing', () => {
      const { calcTemplate, ...payload } = validData;
      const doc = new ResultGroup(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.calcTemplate).toBeDefined();
      expect(validationError.errors.calcTemplate.message).toBe('Calculation template required!');
    });

    test('accepts missing optional round fields', () => {
      const doc = new ResultGroup({
        event: ids.event,
        category: ids.category,
        calcTemplate: ids.calcTemplate
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.round1First).toBeUndefined();
      expect(doc.round1Second).toBeUndefined();
      expect(doc.round2First).toBeUndefined();
    });
  });

  describe('resultGroup Schema Properties', () => {
    test('reference fields point to expected models', () => {
      expect(ResultGroup.schema.paths.event.options.ref).toBe('events');
      expect(ResultGroup.schema.paths.category.options.ref).toBe('categorys');
      expect(ResultGroup.schema.paths.calcTemplate.options.ref).toBe('calculationtemplates');
      expect(ResultGroup.schema.paths.round1First.options.ref).toBe('timetableparts');
      expect(ResultGroup.schema.paths.round1Second.options.ref).toBe('timetableparts');
      expect(ResultGroup.schema.paths.round2First.options.ref).toBe('timetableparts');
    });

    test('schema has timestamps enabled and model name is resultgroup', () => {
      expect(ResultGroup.schema.options.timestamps).toBe(true);
      expect(ResultGroup.schema.paths.createdAt).toBeDefined();
      expect(ResultGroup.schema.paths.updatedAt).toBeDefined();
      expect(ResultGroup.modelName).toBe('resultgroup');
    });
  });
});

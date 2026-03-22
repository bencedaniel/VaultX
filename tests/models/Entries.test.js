import mongoose from 'mongoose';
import Entries from '../../models/Entries.js';

describe('Entries Model - Unit Tests', () => {
  const ids = {
    event: new mongoose.Types.ObjectId(),
    vaulter1: new mongoose.Types.ObjectId(),
    vaulter2: new mongoose.Types.ObjectId(),
    horse: new mongoose.Types.ObjectId(),
    lunger: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId()
  };

  const validEntryData = {
    event: ids.event,
    vaulter: [ids.vaulter1, ids.vaulter2],
    horse: ids.horse,
    lunger: ids.lunger,
    category: ids.category,
    status: 'registered',
    teamName: 'Team Alpha'
  };

  describe('Entries Schema Validation', () => {
    test('creates a valid entry with required fields', () => {
      const doc = new Entries(validEntryData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.event.toString()).toBe(ids.event.toString());
      expect(doc.vaulter).toHaveLength(2);
      expect(doc.horse.toString()).toBe(ids.horse.toString());
      expect(doc.lunger.toString()).toBe(ids.lunger.toString());
      expect(doc.category.toString()).toBe(ids.category.toString());
    });

    test('fails validation when event is missing', () => {
      const { event, ...payload } = validEntryData;
      const doc = new Entries(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.event).toBeDefined();
      expect(validationError.errors.event.message).toBe('Event required!');
    });

    test('fails validation when horse is missing', () => {
      const { horse, ...payload } = validEntryData;
      const doc = new Entries(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.horse).toBeDefined();
      expect(validationError.errors.horse.message).toBe('Horse required!');
    });

    test('fails validation when lunger is missing', () => {
      const { lunger, ...payload } = validEntryData;
      const doc = new Entries(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.lunger).toBeDefined();
      expect(validationError.errors.lunger.message).toBe('Lunger required!');
    });

    test('fails validation when category is missing', () => {
      const { category, ...payload } = validEntryData;
      const doc = new Entries(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
      expect(validationError.errors.category.message).toBe('Category required!');
    });

    test('fails validation when status is outside enum', () => {
      const doc = new Entries({ ...validEntryData, status: 'invalid-status' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
      expect(validationError.errors.status.kind).toBe('enum');
    });

    test('fails validation when teamName exceeds max length', () => {
      const doc = new Entries({
        ...validEntryData,
        teamName: 'A'.repeat(101)
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.teamName).toBeDefined();
      expect(validationError.errors.teamName.kind).toBe('maxlength');
      expect(validationError.errors.teamName.message).toBe('Team name cannot exceed 100 characters.');
    });

    test('allows more than 6 vaulters with current schema maxlength placement', () => {
      const doc = new Entries({
        ...validEntryData,
        vaulter: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.vaulter).toHaveLength(7);
    });
  });

  describe('Entries Schema Defaults and Properties', () => {
    test('applies default values for status, teamName and entryDate', () => {
      const doc = new Entries({
        event: ids.event,
        vaulter: [ids.vaulter1],
        horse: ids.horse,
        lunger: ids.lunger,
        category: ids.category
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.status).toBe('registered');
      expect(doc.teamName).toBe('');
      expect(doc.entryDate).toBeInstanceOf(Date);
    });

    test('reference fields point to expected models', () => {
      expect(Entries.schema.paths.event.options.ref).toBe('events');
      expect(Entries.schema.paths.vaulter.caster.options.ref).toBe('vaulters');
      expect(Entries.schema.paths.horse.options.ref).toBe('horses');
      expect(Entries.schema.paths.lunger.options.ref).toBe('lungers');
      expect(Entries.schema.paths.category.options.ref).toBe('categorys');
    });

    test('schema has timestamps enabled and model name is entries', () => {
      expect(Entries.schema.options.timestamps).toBe(true);
      expect(Entries.schema.paths.createdAt).toBeDefined();
      expect(Entries.schema.paths.updatedAt).toBeDefined();
      expect(Entries.modelName).toBe('entries');
    });
  });
});

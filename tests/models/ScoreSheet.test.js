import mongoose from 'mongoose';
import ScoreSheet from '../../models/ScoreSheet.js';

function runSavePreHook(doc) {
  return new Promise((resolve, reject) => {
    ScoreSheet.schema.s.hooks.execPre('save', doc, [], err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

describe('ScoreSheet Model - Unit Tests', () => {
  const ids = {
    event: new mongoose.Types.ObjectId(),
    entry: new mongoose.Types.ObjectId(),
    template: new mongoose.Types.ObjectId(),
    timetablePart: new mongoose.Types.ObjectId(),
    judge: new mongoose.Types.ObjectId()
  };

  const validData = {
    EventId: ids.event,
    EntryId: ids.entry,
    TemplateId: ids.template,
    TimetablePartId: ids.timetablePart,
    Judge: {
      userId: ids.judge,
      table: 'A'
    },
    inputDatas: [{ id: 'field1', value: '10' }],
    totalScoreFE: 7.123,
    totalScoreBE: 7.123
  };

  describe('ScoreSheet Schema Validation', () => {
    test('creates a valid scoresheet with required fields', () => {
      const doc = new ScoreSheet(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.EventId.toString()).toBe(ids.event.toString());
      expect(doc.EntryId.toString()).toBe(ids.entry.toString());
      expect(doc.TemplateId.toString()).toBe(ids.template.toString());
      expect(doc.TimetablePartId.toString()).toBe(ids.timetablePart.toString());
      expect(doc.Judge.table).toBe('A');
    });

    test('fails validation when EventId is missing', () => {
      const { EventId, ...payload } = validData;
      const doc = new ScoreSheet(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.EventId).toBeDefined();
      expect(validationError.errors.EventId.message).toBe('Event ID required!');
    });

    test('fails validation when EntryId is missing', () => {
      const { EntryId, ...payload } = validData;
      const doc = new ScoreSheet(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.EntryId).toBeDefined();
      expect(validationError.errors.EntryId.message).toBe('Entry ID required!');
    });

    test('fails validation when TemplateId is missing', () => {
      const { TemplateId, ...payload } = validData;
      const doc = new ScoreSheet(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.TemplateId).toBeDefined();
      expect(validationError.errors.TemplateId.message).toBe('Template ID required!');
    });

    test('fails validation when TimetablePartId is missing', () => {
      const { TimetablePartId, ...payload } = validData;
      const doc = new ScoreSheet(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.TimetablePartId).toBeDefined();
      expect(validationError.errors.TimetablePartId.message).toBe('Timetable Part ID required!');
    });

    test('fails validation when Judge.userId is missing', () => {
      const doc = new ScoreSheet({
        ...validData,
        Judge: { table: 'A' }
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['Judge.userId']).toBeDefined();
      expect(validationError.errors['Judge.userId'].message).toBe('Judge info required!');
    });

    test('fails validation when totalScoreFE is missing', () => {
      const { totalScoreFE, ...payload } = validData;
      const doc = new ScoreSheet(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.totalScoreFE).toBeDefined();
      expect(validationError.errors.totalScoreFE.message).toBe('Total score required!');
    });

    test('fails validation when totalScoreBE is missing', () => {
      const { totalScoreBE, ...payload } = validData;
      const doc = new ScoreSheet(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.totalScoreBE).toBeDefined();
      expect(validationError.errors.totalScoreBE.message).toBe('Total score required!');
    });
  });

  describe('ScoreSheet pre-save hook', () => {
    test('rounds FE/BE to 3 decimals and allows save when they match', async () => {
      const doc = new ScoreSheet({
        ...validData,
        totalScoreFE: 6.12349,
        totalScoreBE: 6.12349
      });

      await expect(runSavePreHook(doc)).resolves.toBeUndefined();
      expect(doc.totalScoreFE).toBe(6.123);
      expect(doc.totalScoreBE).toBe(6.123);
    });

    test('throws error when FE/BE mismatch after normalization', async () => {
      const doc = new ScoreSheet({
        ...validData,
        totalScoreFE: 6.1234,
        totalScoreBE: 6.1235
      });

      await expect(runSavePreHook(doc)).rejects.toThrow('Total score mismatch between front-end and back-end values');
    });

    test('throws error when score values are not finite numbers', async () => {
      const doc = new ScoreSheet({
        ...validData,
        totalScoreFE: Infinity,
        totalScoreBE: 6.5
      });

      await expect(runSavePreHook(doc)).rejects.toThrow('Invalid total score value');
    });
  });

  describe('ScoreSheet Schema Properties', () => {
    test('has composite unique index on event, entry, template, timetable part and judge table', () => {
      const indexes = ScoreSheet.schema.indexes();
      const target = indexes.find(([keys]) =>
        keys.EventId === 1 &&
        keys.EntryId === 1 &&
        keys.TemplateId === 1 &&
        keys.TimetablePartId === 1 &&
        keys['Judge.table'] === 1
      );

      expect(target).toBeDefined();
      expect(target[1].unique).toBe(true);
    });

    test('reference paths and schema metadata are configured', () => {
      expect(ScoreSheet.schema.paths.EventId.options.ref).toBe('events');
      expect(ScoreSheet.schema.paths.EntryId.options.ref).toBe('entries');
      expect(ScoreSheet.schema.paths.TemplateId.options.ref).toBe('scoresheets_temp');
      expect(ScoreSheet.schema.paths.TimetablePartId.options.ref).toBe('timetableparts');
      expect(ScoreSheet.schema.paths['Judge.userId'].options.refPath).toBe('users');
      expect(ScoreSheet.schema.options.timestamps).toBe(true);
      expect(ScoreSheet.modelName).toBe('scoresheets');
    });
  });
});

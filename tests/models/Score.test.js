import mongoose from 'mongoose';
import Score from '../../models/Score.js';

describe('Score Model - Unit Tests', () => {
  const ids = {
    event: new mongoose.Types.ObjectId(),
    entry: new mongoose.Types.ObjectId(),
    timetablepart: new mongoose.Types.ObjectId(),
    scoreSheet: new mongoose.Types.ObjectId()
  };

  const validData = {
    event: ids.event,
    entry: ids.entry,
    timetablepart: ids.timetablepart,
    scoresheets: [
      {
        scoreId: ids.scoreSheet,
        table: 'A'
      }
    ],
    TotalScore: 7.85
  };

  describe('Score Schema Validation', () => {
    test('creates a valid score document with required fields', () => {
      const doc = new Score(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.event.toString()).toBe(ids.event.toString());
      expect(doc.entry.toString()).toBe(ids.entry.toString());
      expect(doc.timetablepart.toString()).toBe(ids.timetablepart.toString());
      expect(doc.TotalScore).toBe(7.85);
      expect(doc.scoresheets).toHaveLength(1);
    });

    test('fails validation when event is missing', () => {
      const { event, ...payload } = validData;
      const doc = new Score(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.event).toBeDefined();
      expect(validationError.errors.event.message).toBe('Event required!');
    });

    test('fails validation when entry is missing', () => {
      const { entry, ...payload } = validData;
      const doc = new Score(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.entry).toBeDefined();
      expect(validationError.errors.entry.message).toBe('Entry required!');
    });

    test('fails validation when timetablepart is missing', () => {
      const { timetablepart, ...payload } = validData;
      const doc = new Score(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.timetablepart).toBeDefined();
      expect(validationError.errors.timetablepart.message).toBe('Timetable part required!');
    });

    test('fails validation when TotalScore is missing', () => {
      const { TotalScore, ...payload } = validData;
      const doc = new Score(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.TotalScore).toBeDefined();
      expect(validationError.errors.TotalScore.message).toBe('Score required!');
    });

    test('fails validation when scoresheets item misses scoreId', () => {
      const doc = new Score({
        ...validData,
        scoresheets: [{ table: 'B' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['scoresheets.0.scoreId']).toBeDefined();
      expect(validationError.errors['scoresheets.0.scoreId'].message).toBe('Score required!');
    });

    test('fails validation when scoresheets item misses table', () => {
      const doc = new Score({
        ...validData,
        scoresheets: [{ scoreId: ids.scoreSheet }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['scoresheets.0.table']).toBeDefined();
      expect(validationError.errors['scoresheets.0.table'].message).toBe('Table required!');
    });
  });

  describe('Score Schema Properties', () => {
    test('reference fields point to expected models', () => {
      expect(Score.schema.paths.event.options.ref).toBe('events');
      expect(Score.schema.paths.entry.options.ref).toBe('entries');
      expect(Score.schema.paths.timetablepart.options.ref).toBe('timetableparts');
      expect(Score.schema.paths.scoresheets.schema.paths.scoreId.options.ref).toBe('scoresheets');
    });

    test('schema has timestamps enabled and model name is scores', () => {
      expect(Score.schema.options.timestamps).toBe(true);
      expect(Score.schema.paths.createdAt).toBeDefined();
      expect(Score.schema.paths.updatedAt).toBeDefined();
      expect(Score.modelName).toBe('scores');
    });
  });
});

import mongoose from 'mongoose';
import TimetablePart from '../../models/Timetablepart.js';

describe('Timetablepart Model - Unit Tests', () => {
  const ids = {
    daily: new mongoose.Types.ObjectId(),
    category: new mongoose.Types.ObjectId(),
    entry: new mongoose.Types.ObjectId(),
    judge: new mongoose.Types.ObjectId()
  };

  const validData = {
    Name: 'Round 1 - Individual',
    dailytimetable: ids.daily,
    StartTimePlanned: '09:30',
    Category: [ids.category],
    TestType: 'Compulsory',
    Round: '1',
    NumberOfJudges: 4,
    StartingOrder: [
      {
        Entry: ids.entry,
        Order: 1,
        submittedtables: [{ JudgeID: ids.judge, Table: 'A' }]
      }
    ]
  };

  describe('Timetablepart Schema Validation', () => {
    test('creates valid timetable part with required fields', () => {
      const doc = new TimetablePart(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.Name).toBe('Round 1 - Individual');
      expect(doc.StartTimePlanned).toBe('09:30');
      expect(doc.TestType).toBe('Compulsory');
      expect(doc.Round).toBe('1');
      expect(doc.NumberOfJudges).toBe(4);
    });

    test('fails validation when Name is missing', () => {
      const { Name, ...payload } = validData;
      const doc = new TimetablePart(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Name).toBeDefined();
      expect(validationError.errors.Name.message).toBe('Timetable part name required!');
    });

    test('fails validation when dailytimetable is missing', () => {
      const { dailytimetable, ...payload } = validData;
      const doc = new TimetablePart(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.dailytimetable).toBeDefined();
      expect(validationError.errors.dailytimetable.message).toBe('Daily timetable required!');
    });

    test('fails validation when StartTimePlanned is missing', () => {
      const { StartTimePlanned, ...payload } = validData;
      const doc = new TimetablePart(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.StartTimePlanned).toBeDefined();
      expect(validationError.errors.StartTimePlanned.message).toBe('Start time required!');
    });

    test('fails validation when StartTimePlanned has invalid format', () => {
      const doc = new TimetablePart({ ...validData, StartTimePlanned: '9:30' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.StartTimePlanned).toBeDefined();
      expect(validationError.errors.StartTimePlanned.message).toBe('Invalid time format (HH:MM required)');
    });

    test('accepts valid StartTimePlanned edge values', () => {
      const doc1 = new TimetablePart({ ...validData, StartTimePlanned: '00:00' });
      const doc2 = new TimetablePart({ ...validData, StartTimePlanned: '23:59' });

      expect(doc1.validateSync()).toBeUndefined();
      expect(doc2.validateSync()).toBeUndefined();
    });

    test('fails validation when TestType is outside enum', () => {
      const doc = new TimetablePart({ ...validData, TestType: 'Warmup' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.TestType).toBeDefined();
      expect(validationError.errors.TestType.kind).toBe('enum');
    });

    test('fails validation when Round is outside enum', () => {
      const doc = new TimetablePart({ ...validData, Round: '3' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Round).toBeDefined();
      expect(validationError.errors.Round.kind).toBe('enum');
    });

    test('fails validation when NumberOfJudges is outside enum', () => {
      const doc = new TimetablePart({ ...validData, NumberOfJudges: 3 });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.NumberOfJudges).toBeDefined();
      expect(validationError.errors.NumberOfJudges.kind).toBe('enum');
    });

    test('when Category is omitted, mongoose initializes it as an empty array', () => {
      const { Category, ...payload } = validData;
      const doc = new TimetablePart(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.Category).toEqual([]);
    });

    test('fails validation when StartingOrder item misses required fields', () => {
      const doc = new TimetablePart({
        ...validData,
        StartingOrder: [{ Order: 1 }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['StartingOrder.0.Entry']).toBeDefined();
      expect(validationError.errors['StartingOrder.0.Entry'].message).toBe('Entry is required');
    });
  });

  describe('Timetablepart Schema Defaults and Properties', () => {
    test('applies default values for StartTimeReal, drawingDone, conflictsChecked, Judges and JudgesList', () => {
      const doc = new TimetablePart({
        Name: 'Defaults check',
        dailytimetable: ids.daily,
        StartTimePlanned: '10:00',
        Category: [ids.category],
        TestType: 'Free Test',
        Round: '2 - Final',
        NumberOfJudges: 2
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.StartTimeReal).toBeNull();
      expect(doc.drawingDone).toBe(false);
      expect(doc.conflictsChecked).toBe(false);
      expect(doc.Judges).toEqual([]);
      expect(doc.JudgesList).toEqual([]);
      expect(doc.StartingOrder).toEqual([]);
    });

    test('reference paths point to expected models', () => {
      expect(TimetablePart.schema.paths.dailytimetable.options.ref).toBe('daily_timetables');
      expect(TimetablePart.schema.paths.Category.options.ref).toBe('categorys');
      expect(TimetablePart.schema.paths.StartingOrder.schema.paths.Entry.options.ref).toBe('entries');
      expect(TimetablePart.schema.paths.Judges.options.ref).toBe('entries');
    });

    test('schema has timestamps enabled and model name is timetableparts', () => {
      expect(TimetablePart.schema.options.timestamps).toBe(true);
      expect(TimetablePart.schema.paths.createdAt).toBeDefined();
      expect(TimetablePart.schema.paths.updatedAt).toBeDefined();
      expect(TimetablePart.modelName).toBe('timetableparts');
    });
  });
});

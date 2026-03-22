import mongoose from 'mongoose';
import DailyTimeTable from '../../models/DailyTimeTable.js';

describe('DailyTimeTable Model - Unit Tests', () => {
  const validObjectId = new mongoose.Types.ObjectId();

  describe('DailyTimeTable Schema Validation', () => {
    test('creates a valid daily timetable with required fields', () => {
      const doc = new DailyTimeTable({
        event: validObjectId,
        DayName: 'Friday',
        DisplayName: 'Day 1',
        Date: new Date('2026-03-22T00:00:00.000Z')
      });

      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.event.toString()).toBe(validObjectId.toString());
      expect(doc.DayName).toBe('Friday');
      expect(doc.DisplayName).toBe('Day 1');
      expect(doc.Date).toBeInstanceOf(Date);
    });

    test('fails validation when event is missing', () => {
      const doc = new DailyTimeTable({
        DayName: 'Friday',
        DisplayName: 'Day 1',
        Date: new Date('2026-03-22T00:00:00.000Z')
      });

      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.event).toBeDefined();
      expect(validationError.errors.event.message).toBe('Event required!');
    });

    test('fails validation when DayName is missing', () => {
      const doc = new DailyTimeTable({
        event: validObjectId,
        DisplayName: 'Day 1',
        Date: new Date('2026-03-22T00:00:00.000Z')
      });

      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.DayName).toBeDefined();
      expect(validationError.errors.DayName.message).toBe('Day name required!');
    });

    test('fails validation when DisplayName is missing', () => {
      const doc = new DailyTimeTable({
        event: validObjectId,
        DayName: 'Friday',
        Date: new Date('2026-03-22T00:00:00.000Z')
      });

      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.DisplayName).toBeDefined();
      expect(validationError.errors.DisplayName.message).toBe('Display name required!');
    });

    test('fails validation when Date is missing', () => {
      const doc = new DailyTimeTable({
        event: validObjectId,
        DayName: 'Friday',
        DisplayName: 'Day 1'
      });

      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Date).toBeDefined();
      expect(validationError.errors.Date.message).toBe('Date required!');
    });
  });

  describe('DailyTimeTable Schema Properties', () => {
    test('event path references events model with ObjectId type', () => {
      const eventPath = DailyTimeTable.schema.paths.event;

      expect(eventPath.instance).toBe('ObjectId');
      expect(eventPath.options.ref).toBe('events');
    });

    test('Date path is marked unique', () => {
      const datePath = DailyTimeTable.schema.paths.Date;

      expect(datePath.options.unique).toEqual([true, 'A Day for this date already exists!']);
    });

    test('schema has timestamps enabled', () => {
      expect(DailyTimeTable.schema.options.timestamps).toBe(true);
      expect(DailyTimeTable.schema.paths.createdAt).toBeDefined();
      expect(DailyTimeTable.schema.paths.updatedAt).toBeDefined();
    });

    test('model is registered with daily_timetables name', () => {
      expect(DailyTimeTable.modelName).toBe('daily_timetables');
    });
  });
});

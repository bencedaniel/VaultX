import mongoose from 'mongoose';
import Event from '../../models/Event.js';

describe('Event Model - Unit Tests', () => {
  const ids = {
    map: new mongoose.Types.ObjectId(),
    stablingMap: new mongoose.Types.ObjectId(),
    timetable1: new mongoose.Types.ObjectId(),
    timetable2: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId()
  };

  const validEventData = {
    EventName: 'Spring Cup 2026',
    EventLocation: 'Budapest Arena',
    EventDirectorName: 'Jane Director',
    EventDirectorContact: '+36123456789',
    map: ids.map,
    StablingMap: ids.stablingMap,
    DailyTimeTables: [ids.timetable1, ids.timetable2],
    AssignedOfficials: [
      {
        name: 'Official One',
        role: 'Judge',
        contact: 'judge@example.com',
        userID: ids.user
      }
    ]
  };

  describe('Event Schema Validation', () => {
    test('creates a valid event with required fields', () => {
      const doc = new Event(validEventData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.EventName).toBe('Spring Cup 2026');
      expect(doc.EventLocation).toBe('Budapest Arena');
      expect(doc.EventDirectorName).toBe('Jane Director');
      expect(doc.EventDirectorContact).toBe('+36123456789');
    });

    test('fails validation when EventName is missing', () => {
      const { EventName, ...payload } = validEventData;
      const doc = new Event(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.EventName).toBeDefined();
      expect(validationError.errors.EventName.message).toBe('Event name required!');
    });

    test('fails validation when EventLocation is missing', () => {
      const { EventLocation, ...payload } = validEventData;
      const doc = new Event(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.EventLocation).toBeDefined();
      expect(validationError.errors.EventLocation.message).toBe('Event location required!');
    });

    test('fails validation when EventDirectorName is missing', () => {
      const { EventDirectorName, ...payload } = validEventData;
      const doc = new Event(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.EventDirectorName).toBeDefined();
      expect(validationError.errors.EventDirectorName.message).toBe('Event director name required!');
    });

    test('fails validation when EventDirectorContact is missing', () => {
      const { EventDirectorContact, ...payload } = validEventData;
      const doc = new Event(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.EventDirectorContact).toBeDefined();
      expect(validationError.errors.EventDirectorContact.message).toBe('Event director contact required!');
    });

    test('fails validation when AssignedOfficials item is missing required nested fields', () => {
      const doc = new Event({
        ...validEventData,
        AssignedOfficials: [{ role: 'Judge' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['AssignedOfficials.0.name']).toBeDefined();
      expect(validationError.errors['AssignedOfficials.0.contact']).toBeDefined();
    });
  });

  describe('Event Schema Defaults and Properties', () => {
    test('applies defaults for selected and DailyTimeTables', () => {
      const doc = new Event({
        EventName: 'Defaults Event',
        EventLocation: 'City',
        EventDirectorName: 'Director',
        EventDirectorContact: 'contact'
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.selected).toBe(false);
      expect(doc.DailyTimeTables).toEqual([]);
    });

    test('map and StablingMap reference maps model', () => {
      expect(Event.schema.paths.map.options.ref).toBe('maps');
      expect(Event.schema.paths.StablingMap.options.ref).toBe('maps');
    });

    test('schema has timestamps enabled and model name is events', () => {
      expect(Event.schema.options.timestamps).toBe(true);
      expect(Event.schema.paths.createdAt).toBeDefined();
      expect(Event.schema.paths.updatedAt).toBeDefined();
      expect(Event.modelName).toBe('events');
    });
  });

  describe('Event.setSelected static method', () => {
    test('updates all other events to false, then selected event to true', async () => {
      const eventId = new mongoose.Types.ObjectId();
      const updateManySpy = jest.spyOn(Event, 'updateMany').mockResolvedValue({ acknowledged: true });
      const findByIdAndUpdateSpy = jest.spyOn(Event, 'findByIdAndUpdate').mockResolvedValue({ _id: eventId, selected: true });

      await Event.setSelected(eventId);

      expect(updateManySpy).toHaveBeenCalledWith(
        { _id: { $ne: eventId } },
        { $set: { selected: false } }
      );
      expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(eventId, { selected: true });

      updateManySpy.mockRestore();
      findByIdAndUpdateSpy.mockRestore();
    });
  });
});

import mongoose from 'mongoose';
import Horse from '../../models/Horse.js';

describe('Horse Model - Unit Tests', () => {
  const ids = {
    user: new mongoose.Types.ObjectId(),
    event: new mongoose.Types.ObjectId()
  };

  const validHorseData = {
    Horsename: 'Silver Star',
    feiid: 'ABC1234',
    sex: 'Mare',
    Bdate: new Date('2015-05-10T00:00:00.000Z'),
    Nationality: 'Hungary',
    ResponsiblePersonName: 'John Responsible',
    ResponsiblePersonContact: '+36111111111'
  };

  describe('Horse Schema Validation', () => {
    test('creates a valid horse with required fields', () => {
      const doc = new Horse(validHorseData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.Horsename).toBe('Silver Star');
      expect(doc.feiid).toBe('ABC1234');
      expect(doc.sex).toBe('Mare');
      expect(doc.Nationality).toBe('Hungary');
    });

    test('fails validation when Horsename is missing', () => {
      const { Horsename, ...payload } = validHorseData;
      const doc = new Horse(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Horsename).toBeDefined();
      expect(validationError.errors.Horsename.message).toBe('Horsename required!');
    });

    test('fails validation when feiid is missing', () => {
      const { feiid, ...payload } = validHorseData;
      const doc = new Horse(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.message).toBe('FEI-ID required!');
    });

    test('fails validation when feiid does not match 7-char alphanumeric pattern', () => {
      const doc = new Horse({ ...validHorseData, feiid: 'BAD-ID!' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.kind).toBe('regexp');
      expect(validationError.errors.feiid.message).toBe('FEI-ID must be exactly 7 characters!');
    });

    test('fails validation when sex is outside enum', () => {
      const doc = new Horse({ ...validHorseData, sex: 'Unknown' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.sex).toBeDefined();
      expect(validationError.errors.sex.kind).toBe('enum');
    });

    test('fails validation when Birthdate is missing', () => {
      const { Bdate, ...payload } = validHorseData;
      const doc = new Horse(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Bdate).toBeDefined();
      expect(validationError.errors.Bdate.message).toBe('Birthdate required!');
    });

    test('fails validation when ResponsiblePersonName is missing', () => {
      const { ResponsiblePersonName, ...payload } = validHorseData;
      const doc = new Horse(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.ResponsiblePersonName).toBeDefined();
      expect(validationError.errors.ResponsiblePersonName.message).toBe('Responsible person name required!');
    });

    test('fails validation when ResponsiblePersonContact is missing', () => {
      const { ResponsiblePersonContact, ...payload } = validHorseData;
      const doc = new Horse(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.ResponsiblePersonContact).toBeDefined();
      expect(validationError.errors.ResponsiblePersonContact.message).toBe('Responsible person contact required!');
    });
  });

  describe('Horse Nested Arrays and Defaults', () => {
    test('applies default HorseStatus and Notes', () => {
      const doc = new Horse(validHorseData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.HorseStatus).toBe('active');
      expect(doc.Notes).toEqual([]);
    });

    test('fails validation when VetCheckStatus item is missing required fields', () => {
      const doc = new Horse({
        ...validHorseData,
        VetCheckStatus: [{ status: 'passed' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['VetCheckStatus.0.eventID']).toBeDefined();
      expect(validationError.errors['VetCheckStatus.0.user']).toBeDefined();
    });

    test('fails validation when VetCheckStatus.status is outside enum', () => {
      const doc = new Horse({
        ...validHorseData,
        VetCheckStatus: [{
          status: 'invalid-status',
          eventID: ids.event,
          user: ids.user
        }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['VetCheckStatus.0.status']).toBeDefined();
      expect(validationError.errors['VetCheckStatus.0.status'].kind).toBe('enum');
    });

    test('fails validation when Notes item is missing required nested fields', () => {
      const doc = new Horse({
        ...validHorseData,
        Notes: [{ note: 'Needs attention' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['Notes.0.user']).toBeDefined();
      expect(validationError.errors['Notes.0.eventID']).toBeDefined();
    });

    test('schema has timestamps enabled and model name is horses', () => {
      expect(Horse.schema.options.timestamps).toBe(true);
      expect(Horse.schema.paths.createdAt).toBeDefined();
      expect(Horse.schema.paths.updatedAt).toBeDefined();
      expect(Horse.modelName).toBe('horses');
    });
  });
});

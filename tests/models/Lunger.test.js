import mongoose from 'mongoose';
import Lunger from '../../models/Lunger.js';

describe('Lunger Model - Unit Tests', () => {
  const ids = {
    user: new mongoose.Types.ObjectId(),
    event: new mongoose.Types.ObjectId()
  };

  const validLungerData = {
    Name: 'Anna Lunger',
    feiid: 'ABCD1234',
    Gender: 'Female',
    Nationality: 'Hungary'
  };

  describe('Lunger Schema Validation', () => {
    test('creates a valid lunger with required fields', () => {
      const doc = new Lunger(validLungerData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.Name).toBe('Anna Lunger');
      expect(doc.feiid).toBe('ABCD1234');
      expect(doc.Nationality).toBe('Hungary');
    });

    test('fails validation when Name is missing', () => {
      const { Name, ...payload } = validLungerData;
      const doc = new Lunger(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Name).toBeDefined();
      expect(validationError.errors.Name.message).toBe('Lunger name required!');
    });

    test('fails validation when feiid is missing', () => {
      const { feiid, ...payload } = validLungerData;
      const doc = new Lunger(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.message).toBe('FEI-ID required!');
    });

    test('fails validation when feiid is shorter than 8 characters', () => {
      const doc = new Lunger({ ...validLungerData, feiid: 'ABC1234' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.kind).toBe('minlength');
      expect(validationError.errors.feiid.message).toBe('FEI ID must be at 8 characters!');
    });

    test('fails validation when feiid is longer than 8 characters', () => {
      const doc = new Lunger({ ...validLungerData, feiid: 'ABCDE12345' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.kind).toBe('maxlength');
      expect(validationError.errors.feiid.message).toBe('FEI ID must be at 8 characters!');
    });

    test('fails validation when Nationality is missing', () => {
      const { Nationality, ...payload } = validLungerData;
      const doc = new Lunger(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Nationality).toBeDefined();
      expect(validationError.errors.Nationality.message).toBe('Nationality required!');
    });
  });

  describe('LungerIncident Nested Validation', () => {
    test('accepts valid incident item', () => {
      const doc = new Lunger({
        ...validLungerData,
        LungerIncident: [
          {
            incidentType: 'Warning',
            description: 'First warning',
            User: ids.user,
            eventID: ids.event
          }
        ]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.LungerIncident).toHaveLength(1);
      expect(doc.LungerIncident[0].incidentType).toBe('Warning');
    });

    test('fails validation when incidentType is outside enum', () => {
      const doc = new Lunger({
        ...validLungerData,
        LungerIncident: [
          {
            incidentType: 'Penalty',
            description: 'Invalid type',
            User: ids.user,
            eventID: ids.event
          }
        ]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['LungerIncident.0.incidentType']).toBeDefined();
      expect(validationError.errors['LungerIncident.0.incidentType'].kind).toBe('enum');
    });

    test('fails validation when nested required fields are missing', () => {
      const doc = new Lunger({
        ...validLungerData,
        LungerIncident: [
          {
            incidentType: 'Injury'
          }
        ]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['LungerIncident.0.description']).toBeDefined();
      expect(validationError.errors['LungerIncident.0.User']).toBeDefined();
      expect(validationError.errors['LungerIncident.0.eventID']).toBeDefined();
    });
  });

  describe('Lunger Schema Properties', () => {
    test('schema has timestamps enabled and model name is lungers', () => {
      expect(Lunger.schema.options.timestamps).toBe(true);
      expect(Lunger.schema.paths.createdAt).toBeDefined();
      expect(Lunger.schema.paths.updatedAt).toBeDefined();
      expect(Lunger.modelName).toBe('lungers');
    });

    test('feiid path is unique', () => {
      expect(Lunger.schema.paths.feiid.options.unique).toBe(true);
    });
  });
});

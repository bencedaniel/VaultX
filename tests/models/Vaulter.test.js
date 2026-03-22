import mongoose from 'mongoose';
import Vaulter from '../../models/Vaulter.js';

function runValidatePreHook(doc) {
  return new Promise((resolve, reject) => {
    Vaulter.schema.s.hooks.execPre('validate', doc, [], err => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

describe('Vaulter Model - Unit Tests', () => {
  const ids = {
    event1: new mongoose.Types.ObjectId(),
    event2: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId()
  };

  const validData = {
    Name: 'Eva Vaulter',
    feiid: 'ABCD1234',
    gender: 'Female',
    Bdate: new Date('2010-01-01T00:00:00.000Z'),
    Nationality: 'Hungary'
  };

  describe('Vaulter Schema Validation', () => {
    test('creates a valid vaulter with required fields', () => {
      const doc = new Vaulter(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.Name).toBe('Eva Vaulter');
      expect(doc.feiid).toBe('ABCD1234');
      expect(doc.Nationality).toBe('Hungary');
    });

    test('fails validation when Name is missing', () => {
      const { Name, ...payload } = validData;
      const doc = new Vaulter(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Name).toBeDefined();
      expect(validationError.errors.Name.message).toBe('Vaulter name required!');
    });

    test('fails validation when feiid is missing', () => {
      const { feiid, ...payload } = validData;
      const doc = new Vaulter(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.message).toBe('FEI-ID required!');
    });

    test('fails validation when feiid is shorter than 8 characters', () => {
      const doc = new Vaulter({ ...validData, feiid: 'ABC1234' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.kind).toBe('minlength');
      expect(validationError.errors.feiid.message).toBe('FEI ID must be at 8 characters!');
    });

    test('fails validation when feiid is longer than 8 characters', () => {
      const doc = new Vaulter({ ...validData, feiid: 'ABCDE12345' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.feiid).toBeDefined();
      expect(validationError.errors.feiid.kind).toBe('maxlength');
      expect(validationError.errors.feiid.message).toBe('FEI ID must be at 8 characters!');
    });

    test('fails validation when gender is outside enum', () => {
      const doc = new Vaulter({ ...validData, gender: 'Unknown' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.gender).toBeDefined();
      expect(validationError.errors.gender.kind).toBe('enum');
    });

    test('fails validation when Bdate is missing', () => {
      const { Bdate, ...payload } = validData;
      const doc = new Vaulter(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Bdate).toBeDefined();
      expect(validationError.errors.Bdate.message).toBe('Birthdate required!');
    });

    test('fails validation when Nationality is missing', () => {
      const { Nationality, ...payload } = validData;
      const doc = new Vaulter(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Nationality).toBeDefined();
      expect(validationError.errors.Nationality.message).toBe('Nationality required!');
    });

    test('fails validation when VaulterIncident nested required fields are missing', () => {
      const doc = new Vaulter({
        ...validData,
        VaulterIncident: [{ incidentType: 'Injury' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['VaulterIncident.0.description']).toBeDefined();
      expect(validationError.errors['VaulterIncident.0.User']).toBeDefined();
      expect(validationError.errors['VaulterIncident.0.eventID']).toBeDefined();
    });

    test('fails validation when VaulterIncident incidentType is outside enum', () => {
      const doc = new Vaulter({
        ...validData,
        VaulterIncident: [{
          incidentType: 'Penalty',
          description: 'invalid',
          User: ids.user,
          eventID: ids.event1
        }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['VaulterIncident.0.incidentType']).toBeDefined();
      expect(validationError.errors['VaulterIncident.0.incidentType'].kind).toBe('enum');
    });
  });

  describe('Vaulter pre-validate duplicate ArmNr check', () => {
    test('passes when ArmNr has unique eventIDs', async () => {
      const doc = new Vaulter({
        ...validData,
        ArmNr: [
          { eventID: ids.event1, armNumber: '101' },
          { eventID: ids.event2, armNumber: '202' }
        ]
      });

      await expect(runValidatePreHook(doc)).resolves.toBeUndefined();
    });

    test('fails when ArmNr contains duplicate eventID entries', async () => {
      const duplicateEventId = ids.event1;
      const doc = new Vaulter({
        ...validData,
        ArmNr: [
          { eventID: duplicateEventId, armNumber: '101' },
          { eventID: duplicateEventId, armNumber: '202' }
        ]
      });

      await expect(runValidatePreHook(doc)).rejects.toThrow(
        'Minden eventID-hez csak egy ArmNr adható meg az ArmNr tömbben.'
      );
    });
  });

  describe('Vaulter Schema Properties', () => {
    test('applies default Status active', () => {
      const doc = new Vaulter(validData);
      expect(doc.Status).toBe('active');
    });

    test('has compound unique index for _id + ArmNr.eventID with partial filter', () => {
      const indexes = Vaulter.schema.indexes();
      const target = indexes.find(([keys]) => keys._id === 1 && keys['ArmNr.eventID'] === 1);

      expect(target).toBeDefined();
      expect(target[1].unique).toBe(true);
      expect(target[1].partialFilterExpression).toEqual({ 'ArmNr.eventID': { $exists: true } });
    });

    test('schema has timestamps enabled and model name is vaulters', () => {
      expect(Vaulter.schema.options.timestamps).toBe(true);
      expect(Vaulter.schema.paths.createdAt).toBeDefined();
      expect(Vaulter.schema.paths.updatedAt).toBeDefined();
      expect(Vaulter.modelName).toBe('vaulters');
    });
  });
});

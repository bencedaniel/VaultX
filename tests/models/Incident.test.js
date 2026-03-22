import Incident from '../../models/Incident.js';

describe('Incident Model - Unit Tests', () => {
  const validIncidentData = {
    incidentType: 'Injury',
    description: 'Minor injury during warmup',
    date: new Date('2026-03-22T10:00:00.000Z')
  };

  describe('Incident Schema Validation', () => {
    test('creates a valid incident with required fields', () => {
      const doc = new Incident(validIncidentData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.incidentType).toBe('Injury');
      expect(doc.description).toBe('Minor injury during warmup');
      expect(doc.date).toBeInstanceOf(Date);
    });

    test('fails validation when incidentType is missing', () => {
      const { incidentType, ...payload } = validIncidentData;
      const doc = new Incident(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.incidentType).toBeDefined();
      expect(validationError.errors.incidentType.message).toBe('Incident type required!');
    });

    test('fails validation when incidentType is outside enum', () => {
      const doc = new Incident({ ...validIncidentData, incidentType: 'Medical' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.incidentType).toBeDefined();
      expect(validationError.errors.incidentType.kind).toBe('enum');
    });

    test('fails validation when description is missing', () => {
      const { description, ...payload } = validIncidentData;
      const doc = new Incident(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
      expect(validationError.errors.description.message).toBe('Incident description required!');
    });

    test('fails validation when date is missing', () => {
      const { date, ...payload } = validIncidentData;
      const doc = new Incident(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.date).toBeDefined();
      expect(validationError.errors.date.message).toBe('Incident date required!');
    });
  });

  describe('Incident Schema Properties', () => {
    test('incidentType enum includes all expected values', () => {
      const enumValues = Incident.schema.paths.incidentType.enumValues;

      expect(enumValues).toEqual(['Injury', 'Equipment Failure', 'Disqualification', 'Other']);
    });

    test('schema has timestamps enabled and model name is incidents', () => {
      expect(Incident.schema.options.timestamps).toBe(true);
      expect(Incident.schema.paths.createdAt).toBeDefined();
      expect(Incident.schema.paths.updatedAt).toBeDefined();
      expect(Incident.modelName).toBe('incidents');
    });
  });
});

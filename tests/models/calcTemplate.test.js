import CalcTemplate from '../../models/calcTemplate.js';

describe('calcTemplate Model - Unit Tests', () => {
  const validData = {
    round1FirstP: 40,
    round1SecondP: 30,
    round2FirstP: 30,
  };

  test('creates valid calculation template with required fields', () => {
    const doc = new CalcTemplate(validData);
    const validationError = doc.validateSync();

    expect(validationError).toBeUndefined();
    expect(doc.round1FirstP).toBe(40);
    expect(doc.round1SecondP).toBe(30);
    expect(doc.round2FirstP).toBe(30);
  });

  test('fails when round1FirstP is missing', () => {
    const { round1FirstP, ...payload } = validData;
    const doc = new CalcTemplate(payload);
    const validationError = doc.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError.errors.round1FirstP).toBeDefined();
    expect(validationError.errors.round1FirstP.message).toBe('Round 1 first percentage required!');
  });

  test('fails when round1SecondP is missing', () => {
    const { round1SecondP, ...payload } = validData;
    const doc = new CalcTemplate(payload);
    const validationError = doc.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError.errors.round1SecondP).toBeDefined();
    expect(validationError.errors.round1SecondP.message).toBe('Round 1 second percentage required!');
  });

  test('fails when round2FirstP is missing', () => {
    const { round2FirstP, ...payload } = validData;
    const doc = new CalcTemplate(payload);
    const validationError = doc.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError.errors.round2FirstP).toBeDefined();
    expect(validationError.errors.round2FirstP.message).toBe('Round 2 first percentage required!');
  });

  test('schema metadata is configured', () => {
    expect(CalcTemplate.schema.options.timestamps).toBe(true);
    expect(CalcTemplate.schema.paths.createdAt).toBeDefined();
    expect(CalcTemplate.schema.paths.updatedAt).toBeDefined();
    expect(CalcTemplate.modelName).toBe('calculationtemplates');
  });
});

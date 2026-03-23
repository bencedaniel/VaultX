import { calculateScore } from '../../LogicServices/scoreCalculations.js';

jest.mock('../../logger.js', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('LogicServices/scoreCalculations.calculateScore', () => {
  function makeCategory(overrides = {}) {
    return {
      CategoryDispName: 'Test Category',
      Type: 'Individual',
      Horse: { A1: 0.5, A2: 0.3, A3: 0.2 },
      Artistic: { CH: 0.2, C1: 0.2, C2: 0.2, C3: 0.2, C4: 0.2 },
      TechArtistic: { CH: 0.25, T1: 0.25, T2: 0.25, T3: 0.25, TechDivider: 10 },
      Free: { R: 1, D: 1, M: 1, E: 1, NumberOfMaxExercises: 10 },
      ...overrides
    };
  }

  function horseInputData() {
    return [
      { id: 'WandO', value: '10' },
      { id: 'bint', value: '10' },
      { id: 'BinC', value: '10' },
      { id: 'lunging', value: '10' },
      { id: 'rythm', value: '10' },
      { id: 'relaxation', value: '10' },
      { id: 'connection', value: '10' },
      { id: 'impulsion', value: '10' },
      { id: 'straightness', value: '10' },
      { id: 'collection', value: '10' },
      { id: 'a2ded1', value: '0' },
      { id: 'a2ded2', value: '0' },
      { id: 'a2ded3', value: '0' },
      { id: 'a2ded4', value: '0' },
      { id: 'a2ded5', value: '0' },
      { id: 'a3ded1', value: '0' },
      { id: 'a3ded2', value: '0' },
      { id: 'a3ded3', value: '0' },
      { id: 'a3ded4', value: '0' },
      { id: 'a3ded5', value: '0' }
    ];
  }

  test('returns horse score when all horse fields are present (highest priority)', () => {
    const inputs = [
      ...horseInputData(),
      { id: 'vault-on', value: '7.0' }
    ];

    const result = calculateScore(inputs, makeCategory());

    expect(result).toBe('10.000');
  });

  test('returns individual compulsory average when horse score is not applicable', () => {
    const inputs = [
      { id: 'vault-on', value: '7,5' },
      { id: 'flag', value: '8,5' }
    ];

    const result = calculateScore(inputs, makeCategory());

    expect(result).toBe('8.000');
  });

  test('returns artistic score when artistic fields are complete', () => {
    const inputs = [
      { id: 'coh', value: '8' },
      { id: 'c1', value: '8' },
      { id: 'c2', value: '8' },
      { id: 'c3', value: '8' },
      { id: 'c4', value: '8' },
      { id: 'deduction', value: '1' }
    ];

    const result = calculateScore(inputs, makeCategory());

    expect(result).toBe('7.000');
  });

  test('returns tech-artistic score when tech-artistic fields are complete', () => {
    const inputs = [
      { id: 'tcoh', value: '8' },
      { id: 't1', value: '8' },
      { id: 't2', value: '8' },
      { id: 't3', value: '8' },
      { id: 'deduction', value: '2' }
    ];

    const result = calculateScore(inputs, makeCategory());

    expect(result).toBe('6.000');
  });

  test('returns free-tech score from records when records are provided', () => {
    const inputs = [{ id: 'records', value: 'R D M E' }];

    const result = calculateScore(inputs, makeCategory());

    expect(result).toBe('8.200');
  });

  test('returns tech test score when techrecords are provided', () => {
    const inputs = [
      { id: 'techrecords', value: '5 5' },
      { id: 'standBackward', value: '10' },
      { id: 'cartwheel', value: '10' },
      { id: 'lowerarmstand', value: '10' },
      { id: 'mountreverse', value: '10' },
      { id: 'standsplit', value: '10' }
    ];

    const result = calculateScore(inputs, makeCategory({ Free: { R: 0, D: 0, M: 0, E: 0 } }));

    expect(result).toBe('5.500');
  });

  test('returns 0.000 fallback when no scoring branch applies', () => {
    const result = calculateScore([], makeCategory());

    expect(result).toBe('0.000');
  });

  describe('Number.EPSILON rounding behavior', () => {
    test('rounds up correctly at 4th decimal 5 boundary', () => {
      const roundingCategory = makeCategory({
        Artistic: { CH: 1, C1: 0, C2: 0, C3: 0, C4: 0 }
      });

      const inputs = [
        { id: 'coh', value: '7,1235' },
        { id: 'c1', value: '0' },
        { id: 'c2', value: '0' },
        { id: 'c3', value: '0' },
        { id: 'c4', value: '0' },
        { id: 'deduction', value: '0' }
      ];

      const result = calculateScore(inputs, roundingCategory);

      expect(result).toBe('7.124');
    });

    test('keeps floating point sum boundary stable when rounding to 3 decimals', () => {
      const roundingCategory = makeCategory({
        Artistic: { CH: 1, C1: 1, C2: 1, C3: 0, C4: 0 }
      });

      const inputs = [
        { id: 'coh', value: '0,1' },
        { id: 'c1', value: '0,2' },
        { id: 'c2', value: '0,705' },
        { id: 'c3', value: '0' },
        { id: 'c4', value: '0' },
        { id: 'deduction', value: '0' }
      ];

      const result = calculateScore(inputs, roundingCategory);

      expect(result).toBe('1.005');
    });
  });
});

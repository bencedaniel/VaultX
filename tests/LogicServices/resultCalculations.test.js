import {
  FirstLevel,
  SecondLevel,
  TotalLevel
} from '../../LogicServices/resultCalculations.js';
import {
  getSelectedEvent,
  getEntriesByEventAndCategory,
  getScoresForTimetablePart,
  getEntryWithPopulation
} from '../../DataServices/resultCalculationsData.js';

jest.mock('../../DataServices/resultCalculationsData.js', () => ({
  getSelectedEvent: jest.fn(),
  getEntriesByEventAndCategory: jest.fn(),
  getScoresForTimetablePart: jest.fn(),
  getEntryWithPopulation: jest.fn()
}));

function makeResultGroup(overrides = {}) {
  return {
    category: 'cat1',
    round1First: 'tpR1F',
    round1Second: 'tpR1S',
    round2First: 'tpR2F',
    calcTemplate: {
      round1FirstP: 40,
      round1SecondP: 60,
      round2FirstP: 50
    },
    ...overrides
  };
}

describe('LogicServices/resultCalculations', () => {
  const entries = [{ _id: 'e1' }, { _id: 'e2' }];

  beforeEach(() => {
    jest.clearAllMocks();
    getSelectedEvent.mockResolvedValue({ _id: 'ev1' });
    getEntriesByEventAndCategory.mockResolvedValue(entries);
    getEntryWithPopulation.mockImplementation(async (id) => ({ _id: id, populated: true }));
  });

  describe('FirstLevel', () => {
    test('returns R1F title and scores for round1First timetable part', async () => {
      const group = makeResultGroup();
      const scores = [{ entry: { _id: 'e1' }, TotalScore: 10 }];
      getScoresForTimetablePart.mockResolvedValue(scores);

      const result = await FirstLevel(group, 'R1F');

      expect(getSelectedEvent).toHaveBeenCalledTimes(1);
      expect(getEntriesByEventAndCategory).toHaveBeenCalledWith('ev1', 'cat1');
      expect(getScoresForTimetablePart).toHaveBeenCalledWith(['e1', 'e2'], 'tpR1F');
      expect(result).toEqual({
        title: 'Round 1 - First Part Results',
        results: scores
      });
    });

    test('uses null timetable part and empty title for unknown part key', async () => {
      const group = makeResultGroup();
      getScoresForTimetablePart.mockResolvedValue([]);

      const result = await FirstLevel(group, 'X');

      expect(getScoresForTimetablePart).toHaveBeenCalledWith(['e1', 'e2'], null);
      expect(result).toEqual({ title: '', results: [] });
    });
  });

  describe('SecondLevel', () => {
    test('R1 branch returns R1S directly when round1First multiplier is 0', async () => {
      const group = makeResultGroup({
        calcTemplate: { round1FirstP: 0, round1SecondP: 100, round2FirstP: 0 }
      });

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR1S') {
          return [{ entry: { _id: 'e1' }, TotalScore: 7.2 }];
        }
        return [];
      });

      const result = await SecondLevel(group, 'R1');

      expect(result.title).toBe('Round 2 - Final Results');
      expect(result.sizeOfpointDetails).toBe(2);
      expect(result.results[0].secondTotalScore).toBe(7.2);
    });

    test('R1 branch returns R1F directly when round1Second multiplier is 0', async () => {
      const group = makeResultGroup({
        calcTemplate: { round1FirstP: 100, round1SecondP: 0, round2FirstP: 0 }
      });

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR1F') {
          return [{ entry: { _id: 'e1' }, TotalScore: 8.5 }];
        }
        return [];
      });

      const result = await SecondLevel(group, 'R1');

      expect(result.title).toBe('Round 2 - Final Results');
      expect(result.sizeOfpointDetails).toBe(2);
      expect(result.results[0].firstTotalScore).toBe(8.5);
    });

    test('R1 branch combines first and second round scores with normalized multipliers', async () => {
      const group = makeResultGroup({
        calcTemplate: { round1FirstP: 40, round1SecondP: 60, round2FirstP: 0 }
      });

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR1F') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 10 },
            { entry: { _id: 'e2' }, TotalScore: 5 }
          ];
        }
        if (timetablePartId === 'tpR1S') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 20 },
            { entry: { _id: 'e2' }, TotalScore: 15 }
          ];
        }
        return [];
      });

      const result = await SecondLevel(group, 'R1');

      expect(result.title).toBe('Round 1 - Final Results');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].entry._id).toBe('e1');
      expect(result.results[0].TotalScore).toBeCloseTo(16, 6);
      expect(result.results[1].entry._id).toBe('e2');
      expect(result.results[1].TotalScore).toBeCloseTo(11, 6);
    });

    test('R2 branch returns first-level R2F results with firstTotalScore', async () => {
      const group = makeResultGroup();

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR2F') {
          return [{ entry: { _id: 'e1' }, TotalScore: 12.3 }];
        }
        return [];
      });

      const result = await SecondLevel(group, 'R2');

      expect(result.title).toBe('Round 2 - Final Results');
      expect(result.sizeOfpointDetails).toBe(2);
      expect(result.results[0].firstTotalScore).toBe(12.3);
    });

    test('throws for invalid second-level part', async () => {
      await expect(SecondLevel(makeResultGroup(), 'INVALID')).rejects.toThrow(
        'Invalid part for SecondLevel calculation'
      );
    });
  });

  describe('TotalLevel', () => {
    test('returns round2 results only when round1 multiplier is 0', async () => {
      const group = makeResultGroup({
        calcTemplate: { round1FirstP: 0, round1SecondP: 0, round2FirstP: 100 }
      });

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR1S') {
          return [{ entry: { _id: 'e1' }, TotalScore: 6 }];
        }
        if (timetablePartId === 'tpR2F') {
          return [{ entry: { _id: 'e1' }, TotalScore: 9 }];
        }
        return [];
      });

      const result = await TotalLevel(group);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].round2TotalScore).toBe(9);
    });

    test('returns round1 results only when round2 multiplier is 0', async () => {
      const group = makeResultGroup({
        calcTemplate: { round1FirstP: 40, round1SecondP: 60, round2FirstP: 0 }
      });

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR1F') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 10 },
            { entry: { _id: 'e2' }, TotalScore: 5 }
          ];
        }
        if (timetablePartId === 'tpR1S') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 20 },
            { entry: { _id: 'e2' }, TotalScore: 15 }
          ];
        }
        if (timetablePartId === 'tpR2F') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 8 },
            { entry: { _id: 'e2' }, TotalScore: 7 }
          ];
        }
        return [];
      });

      const result = await TotalLevel(group);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].round1TotalScore).toBeCloseTo(16, 6);
      expect(result.results[1].round1TotalScore).toBeCloseTo(11, 6);
    });

    test('combines round1 and round2 totals and sorts descending', async () => {
      const group = makeResultGroup({
        calcTemplate: { round1FirstP: 40, round1SecondP: 60, round2FirstP: 50 }
      });

      getScoresForTimetablePart.mockImplementation(async (_entryIds, timetablePartId) => {
        if (timetablePartId === 'tpR1F') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 10 },
            { entry: { _id: 'e2' }, TotalScore: 5 }
          ];
        }
        if (timetablePartId === 'tpR1S') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 20 },
            { entry: { _id: 'e2' }, TotalScore: 15 }
          ];
        }
        if (timetablePartId === 'tpR2F') {
          return [
            { entry: { _id: 'e1' }, TotalScore: 18 },
            { entry: { _id: 'e2' }, TotalScore: 8 }
          ];
        }
        return [];
      });

      const result = await TotalLevel(group);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].entry._id).toBe('e1');
      expect(result.results[0].round1TotalScore).toBeCloseTo(16, 6);
      expect(result.results[0].round2TotalScore).toBeCloseTo(18, 6);
      expect(result.results[0].TotalScore).toBeCloseTo(25, 6);
      expect(result.results[1].entry._id).toBe('e2');
      expect(result.results[1].TotalScore).toBeCloseTo(15, 6);
    });
  });
});

import {
  getSelectedEvent,
  getEntriesByEventAndCategory,
  getScoresForTimetablePart,
  getEntryWithPopulation
} from '../../DataServices/resultCalculationsData.js';
import Event from '../../models/Event.js';
import Entries from '../../models/Entries.js';
import Score from '../../models/Score.js';

jest.mock('../../models/Event.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

jest.mock('../../models/Entries.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../../models/Score.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

describe('resultCalculationsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSelectedEvent', () => {
    test('returns selected event', async () => {
      const selectedEvent = { _id: 'ev1', selected: true };
      Event.findOne.mockResolvedValue(selectedEvent);

      const result = await getSelectedEvent();

      expect(Event.findOne).toHaveBeenCalledWith({ selected: true });
      expect(result).toEqual(selectedEvent);
    });

    test('returns null when no selected event exists', async () => {
      Event.findOne.mockResolvedValue(null);

      const result = await getSelectedEvent();

      expect(result).toBeNull();
    });
  });

  describe('getEntriesByEventAndCategory', () => {
    test('returns entries filtered by event and category', async () => {
      const rows = [{ _id: 'en1' }, { _id: 'en2' }];
      Entries.find.mockResolvedValue(rows);

      const result = await getEntriesByEventAndCategory('ev1', 'cat1');

      expect(Entries.find).toHaveBeenCalledWith({ event: 'ev1', category: 'cat1' });
      expect(result).toEqual(rows);
    });

    test('propagates query errors', async () => {
      Entries.find.mockRejectedValue(new Error('entries query failed'));

      await expect(getEntriesByEventAndCategory('ev1', 'cat1')).rejects.toThrow('entries query failed');
    });
  });

  describe('getScoresForTimetablePart', () => {
    test('returns scores with nested population for entry and scoresheets', async () => {
      const scores = [{ _id: 's1' }];
      const secondPopulateMock = jest.fn().mockResolvedValue(scores);
      const firstPopulateMock = jest.fn().mockReturnValue({ populate: secondPopulateMock });
      Score.find.mockReturnValue({ populate: firstPopulateMock });

      const result = await getScoresForTimetablePart(['en1', 'en2'], 'tp1');

      expect(Score.find).toHaveBeenCalledWith({
        entry: { $in: ['en1', 'en2'] },
        timetablepart: 'tp1'
      });
      expect(firstPopulateMock).toHaveBeenCalledWith({
        path: 'entry',
        populate: [
          { path: 'horse' },
          { path: 'vaulter' },
          { path: 'lunger' }
        ]
      });
      expect(secondPopulateMock).toHaveBeenCalledWith({
        path: 'scoresheets.scoreId',
        select: 'totalScoreBE'
      });
      expect(result).toEqual(scores);
    });

    test('propagates population chain errors', async () => {
      const secondPopulateMock = jest.fn().mockRejectedValue(new Error('populate failed'));
      const firstPopulateMock = jest.fn().mockReturnValue({ populate: secondPopulateMock });
      Score.find.mockReturnValue({ populate: firstPopulateMock });

      await expect(getScoresForTimetablePart(['en1'], 'tp1')).rejects.toThrow('populate failed');
    });
  });

  describe('getEntryWithPopulation', () => {
    test('returns entry with horse, vaulter and lunger populated', async () => {
      const entry = { _id: 'en1' };
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 3) {
          return Promise.resolve(entry);
        }
        return chain;
      });
      Entries.findById.mockReturnValue(chain);

      const result = await getEntryWithPopulation('en1');

      expect(Entries.findById).toHaveBeenCalledWith('en1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'horse');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'vaulter');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'lunger');
      expect(result).toEqual(entry);
    });

    test('returns null when populated entry is not found', async () => {
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 3) {
          return Promise.resolve(null);
        }
        return chain;
      });
      Entries.findById.mockReturnValue(chain);

      const result = await getEntryWithPopulation('missing');

      expect(result).toBeNull();
    });
  });
});

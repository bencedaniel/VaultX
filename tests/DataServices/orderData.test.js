import {
  getTimetablePartById,
  getEntriesForCategories,
  validateAndFilterStartingOrder,
  updateStartingOrder,
  generateNewOrderNumber,
  updateEntryOrderNumber,
  checkAndGenerateConflictingOrders,
  generateCompleteStartingOrder,
  updateTimetablePartStatus,
  parseCategoriesArray
} from '../../DataServices/orderData.js';
import TimetablePart from '../../models/Timetablepart.js';
import Entries from '../../models/Entries.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Timetablepart.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../models/Entries.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('orderData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTimetablePartById', () => {
    test('returns timetable part with populated daily timetable', async () => {
      const part = { _id: 'tp1' };
      const execMock = jest.fn().mockResolvedValue(part);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      TimetablePart.findById.mockReturnValue({ populate: populateMock });

      const result = await getTimetablePartById('tp1');

      expect(TimetablePart.findById).toHaveBeenCalledWith('tp1');
      expect(populateMock).toHaveBeenCalledWith('dailytimetable');
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(part);
    });

    test('throws when timetable part is not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      TimetablePart.findById.mockReturnValue({ populate: populateMock });

      await expect(getTimetablePartById('missing')).rejects.toThrow('Timetable part not found.');
    });
  });

  describe('getEntriesForCategories', () => {
    test('returns entries for categories with default confirmed status', async () => {
      const rows = [{ _id: 'e1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      Entries.find.mockReturnValue({ populate: populateMock });

      const result = await getEntriesForCategories('ev1', ['c1', 'c2']);

      expect(Entries.find).toHaveBeenCalledWith({
        event: 'ev1',
        status: 'confirmed',
        category: { $in: ['c1', 'c2'] }
      });
      expect(populateMock).toHaveBeenCalledWith('vaulter horse lunger');
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });

    test('uses provided status when specified', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      Entries.find.mockReturnValue({ populate: populateMock });

      await getEntriesForCategories('ev1', ['c1'], 'pending');

      expect(Entries.find).toHaveBeenCalledWith({
        event: 'ev1',
        status: 'pending',
        category: { $in: ['c1'] }
      });
    });
  });

  describe('validateAndFilterStartingOrder', () => {
    test('filters out invalid entries, saves and logs update', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          { Entry: { toString: () => 'e1' }, Order: 1 },
          { Entry: { toString: () => 'e2' }, Order: 2 },
          { Entry: { toString: () => 'e3' }, Order: 3 }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };

      const result = await validateAndFilterStartingOrder(timetablePart, ['e1', 'e3']);

      expect(timetablePart.StartingOrder).toHaveLength(2);
      expect(timetablePart.StartingOrder.map(x => x.Order)).toEqual([1, 3]);
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(result).toBe(timetablePart);
    });
  });

  describe('updateStartingOrder', () => {
    test('throws when timetable part is not found', async () => {
      TimetablePart.findById.mockResolvedValue(null);

      await expect(
        updateStartingOrder('missing', { entryId: 'e1', newOrder: 3 })
      ).rejects.toThrow('Timetable part not found.');
    });

    test('replaces existing order slot and removes displaced entry', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          { Entry: 'e1', Order: 1 },
          { Entry: 'e2', Order: 2 },
          { Entry: 'e3', Order: 3 }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      const result = await updateStartingOrder('tp1', { entryId: 'e1', newOrder: 2 });

      expect(timetablePart.StartingOrder).toEqual([
        { Entry: 'e1', Order: 2 },
        { Entry: 'e3', Order: 3 }
      ]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(timetablePart);
    });

    test('adds entry to free order slot when not changed', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          { Entry: 'e2', Order: 2 },
          { Entry: 'e3', Order: 3 }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      await updateStartingOrder('tp1', { entryId: 'e1', newOrder: 1 });

      expect(timetablePart.StartingOrder).toContainEqual({ Entry: 'e1', Order: 1 });
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateNewOrderNumber', () => {
    test('returns generated unique order number', async () => {
      const timetablePart = {
        StartingOrder: [{ Order: 1 }, { Order: 2 }]
      };
      const spy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.0)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.6);

      const result = await generateNewOrderNumber(timetablePart, 4, 4);

      expect(result).toBe(3);
      spy.mockRestore();
    });

    test('throws when cannot generate after max attempts', async () => {
      const timetablePart = {
        StartingOrder: [{ Order: 1 }]
      };
      const spy = jest.spyOn(Math, 'random').mockReturnValue(0.0);

      await expect(generateNewOrderNumber(timetablePart, 1, 1)).rejects.toThrow(
        'Could not generate a new order number, please try again.'
      );

      spy.mockRestore();
    });
  });

  describe('updateEntryOrderNumber', () => {
    test('throws when timetable part is not found', async () => {
      TimetablePart.findById.mockResolvedValue(null);

      await expect(updateEntryOrderNumber('missing', 'e1', 9)).rejects.toThrow('Timetable part not found.');
    });

    test('updates order for matching entry, saves and logs', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          { Entry: 'e1', Order: 1 },
          { Entry: 'e2', Order: 2 }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      const result = await updateEntryOrderNumber('tp1', 'e2', 5);

      expect(timetablePart.StartingOrder).toEqual([
        { Entry: 'e1', Order: 1 },
        { Entry: 'e2', Order: 5 }
      ]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(timetablePart);
    });
  });

  describe('checkAndGenerateConflictingOrders', () => {
    test('adds conflicting entries without assigned orders and saves', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [],
        save: jest.fn().mockResolvedValue(undefined)
      };
      const entries = [
        { _id: 'e1', horse: 'h1', lunger: 'l1' },
        { _id: 'e2', horse: 'h1', lunger: 'l2' },
        { _id: 'e3', horse: 'h3', lunger: 'l3' }
      ];

      const spy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.0)
        .mockReturnValueOnce(0.6);

      const result = await checkAndGenerateConflictingOrders(timetablePart, entries);

      expect(result.conflictedEntries).toEqual([entries[0], entries[1]]);
      expect(timetablePart.StartingOrder).toHaveLength(2);
      expect(timetablePart.StartingOrder[0].Entry).toBe('e1');
      expect(timetablePart.StartingOrder[1].Entry).toBe('e2');
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    test('does not generate duplicate order when conflicted entry already has one', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [{ Entry: 'e1', Order: 1 }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      const entries = [
        { _id: 'e1', horse: 'h1', lunger: 'l1' },
        { _id: 'e2', horse: 'h1', lunger: 'l2' }
      ];

      const spy = jest.spyOn(Math, 'random').mockReturnValue(0.7);

      const result = await checkAndGenerateConflictingOrders(timetablePart, entries);

      expect(result.conflictedEntries).toEqual([entries[0], entries[1]]);
      expect(timetablePart.StartingOrder).toHaveLength(2);
      expect(timetablePart.StartingOrder[0]).toEqual({ Entry: 'e1', Order: 1 });
      spy.mockRestore();
    });
  });

  describe('generateCompleteStartingOrder', () => {
    test('adds missing entries, marks drawingDone and saves', async () => {
      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [{ Entry: 'e1', Order: 1 }],
        drawingDone: false,
        save: jest.fn().mockResolvedValue(undefined)
      };
      const entries = [{ _id: 'e1' }, { _id: 'e2' }, { _id: 'e3' }];

      const spy = jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.0)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.9);

      const result = await generateCompleteStartingOrder(timetablePart, entries);

      expect(timetablePart.StartingOrder.map(x => x.Entry)).toEqual(['e1', 'e2', 'e3']);
      expect(timetablePart.drawingDone).toBe(true);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(timetablePart);
      spy.mockRestore();
    });
  });

  describe('updateTimetablePartStatus', () => {
    test('throws when timetable part is not found', async () => {
      TimetablePart.findById.mockResolvedValue(null);

      await expect(
        updateTimetablePartStatus('missing', { drawingDone: true })
      ).rejects.toThrow('Timetable part not found.');
    });

    test('assigns status fields, saves and logs', async () => {
      const timetablePart = {
        _id: 'tp1',
        drawingDone: false,
        conflictsChecked: false,
        creationMethod: 'manual',
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      const result = await updateTimetablePartStatus('tp1', {
        drawingDone: true,
        conflictsChecked: true,
        creationMethod: 'auto'
      });

      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(timetablePart.drawingDone).toBe(true);
      expect(timetablePart.conflictsChecked).toBe(true);
      expect(timetablePart.creationMethod).toBe('auto');
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(timetablePart);
    });
  });

  describe('parseCategoriesArray', () => {
    test('returns same array when category is already an array', () => {
      const categories = ['c1', 'c2'];

      const result = parseCategoriesArray(categories);

      expect(result).toBe(categories);
    });

    test('wraps single value into array', () => {
      const result = parseCategoriesArray('c1');

      expect(result).toEqual(['c1']);
    });

    test('returns empty array for nullish category', () => {
      expect(parseCategoriesArray(null)).toEqual([]);
      expect(parseCategoriesArray(undefined)).toEqual([]);
    });
  });
});

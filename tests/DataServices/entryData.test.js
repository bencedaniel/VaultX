import {
  getAllVaulters,
  getAllLungers,
  getAllHorses,
  getAllCategories,
  getAllEvents,
  createEntry,
  getEntriesByEvent,
  getEntryByIdWithPopulation,
  updateEntry,
  deleteEntryIncident,
  addEntryIncident,
  getHorsesForEvent,
  updateHorseVetStatus,
  getSelectedEvent
} from '../../DataServices/entryData.js';
import Entries from '../../models/Entries.js';
import Vaulter from '../../models/Vaulter.js';
import Lunger from '../../models/Lunger.js';
import Horse from '../../models/Horse.js';
import Category from '../../models/Category.js';
import Event from '../../models/Event.js';
import TimetablePart from '../../models/Timetablepart.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Entries.js', () => {
  const EntriesMock = jest.fn();
  EntriesMock.find = jest.fn();
  EntriesMock.findById = jest.fn();
  EntriesMock.findByIdAndDelete = jest.fn();
  EntriesMock.findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: EntriesMock
  };
});

jest.mock('../../models/Vaulter.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/Lunger.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/Horse.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

jest.mock('../../models/Category.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/Event.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.mock('../../models/Timetablepart.js', () => ({
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

describe('entryData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic list getters', () => {
    test('getAllVaulters returns all vaulters', async () => {
      const vaulters = [{ _id: 'v1' }];
      Vaulter.find.mockResolvedValue(vaulters);

      const result = await getAllVaulters();

      expect(Vaulter.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(vaulters);
    });

    test('getAllLungers returns all lungers', async () => {
      const lungers = [{ _id: 'l1' }];
      Lunger.find.mockResolvedValue(lungers);

      const result = await getAllLungers();

      expect(Lunger.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(lungers);
    });

    test('getAllHorses returns all horses', async () => {
      const horses = [{ _id: 'h1' }];
      Horse.find.mockResolvedValue(horses);

      const result = await getAllHorses();

      expect(Horse.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(horses);
    });

    test('getAllCategories returns categories sorted by Star', async () => {
      const categories = [{ _id: 'c1', Star: 1 }];
      const sortMock = jest.fn().mockResolvedValue(categories);
      Category.find.mockReturnValue({ sort: sortMock });

      const result = await getAllCategories();

      expect(Category.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ Star: 1 });
      expect(result).toEqual(categories);
    });

    test('getAllEvents returns all events', async () => {
      const events = [{ _id: 'e1' }];
      Event.find.mockResolvedValue(events);

      const result = await getAllEvents();

      expect(Event.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(events);
    });
  });

  describe('createEntry', () => {
    test('creates, saves and logs entry', async () => {
      const payload = { name: 'Entry 1', status: 'confirmed' };
      const created = {
        _id: 'en1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Entries.mockImplementation(() => created);

      const result = await createEntry(payload);

      expect(Entries).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Entry', 'en1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const payload = { name: 'Entry 1' };
      const created = {
        _id: 'en1',
        ...payload,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Entries.mockImplementation(() => created);

      await expect(createEntry(payload)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getEntriesByEvent', () => {
    test('returns entries with full population sorted by name', async () => {
      const rows = [{ _id: 'en1', name: 'A' }];
      const chain = {
        populate: jest.fn(),
        sort: jest.fn()
      };
      chain.populate.mockReturnValue(chain);
      chain.sort.mockResolvedValue(rows);
      Entries.find.mockReturnValue(chain);

      const result = await getEntriesByEvent('e1');

      expect(Entries.find).toHaveBeenCalledWith({ event: 'e1' });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'vaulter');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'horse');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'lunger');
      expect(chain.populate).toHaveBeenNthCalledWith(4, 'category');
      expect(chain.sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(rows);
    });
  });

  describe('getEntryByIdWithPopulation', () => {
    test('returns entry with full population when found', async () => {
      const entry = { _id: 'en1', name: 'A' };
      const chain = {
        populate: jest.fn()
      };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 5) {
          return Promise.resolve(entry);
        }
        return chain;
      });
      Entries.findById.mockReturnValue(chain);

      const result = await getEntryByIdWithPopulation('en1');

      expect(Entries.findById).toHaveBeenCalledWith('en1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'vaulter');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'horse');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'lunger');
      expect(chain.populate).toHaveBeenNthCalledWith(4, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(5, 'event');
      expect(result).toEqual(entry);
    });

    test('throws when entry is not found', async () => {
      const chain = {
        populate: jest.fn()
      };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 5) {
          return Promise.resolve(null);
        }
        return chain;
      });
      Entries.findById.mockReturnValue(chain);

      await expect(getEntryByIdWithPopulation('missing')).rejects.toThrow('Entry not found');
    });
  });

  describe('updateEntry', () => {
    test('throws when old entry is not found', async () => {
      Entries.findByIdAndDelete.mockResolvedValue(null);

      await expect(updateEntry('missing', { status: 'draft' }, 'e1')).rejects.toThrow('Entry not found');

      expect(logDb).not.toHaveBeenCalled();
    });

    test('recreates entry and skips timetable cleanup when status is confirmed', async () => {
      const oldEntry = { _id: 'old1' };
      const recreated = {
        _id: 'new1',
        status: 'confirmed',
        category: 'cat1',
        save: jest.fn().mockResolvedValue(undefined)
      };
      Entries.findByIdAndDelete.mockResolvedValue(oldEntry);
      Entries.mockImplementation(() => recreated);

      const result = await updateEntry('old1', { status: 'confirmed', category: 'cat1' }, 'e1');

      expect(Entries.findByIdAndDelete).toHaveBeenCalledWith('old1');
      expect(recreated.save).toHaveBeenCalledTimes(1);
      expect(TimetablePart.find).not.toHaveBeenCalled();
      expect(logDb).toHaveBeenNthCalledWith(1, 'DELETE', 'Entry', 'old1');
      expect(logDb).toHaveBeenNthCalledWith(2, 'CREATE', 'Entry', 'new1');
      expect(result).toEqual({ oldEntry, newEntry: recreated });
    });

    test('removes recreated entry from timetable parts when status is not confirmed', async () => {
      const oldEntry = { _id: 'old1' };
      const recreated = {
        _id: {
          toString: () => 'new1'
        },
        status: 'pending',
        category: 'cat1',
        save: jest.fn().mockResolvedValue(undefined)
      };

      const tp1 = {
        _id: 'tp1',
        StartingOrder: [
          { Entry: { toString: () => 'new1' } },
          { Entry: { toString: () => 'other' } }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      const tp2 = {
        _id: 'tp2',
        StartingOrder: [{ Entry: { toString: () => 'other' } }],
        save: jest.fn().mockResolvedValue(undefined)
      };

      Entries.findByIdAndDelete.mockResolvedValue(oldEntry);
      Entries.mockImplementation(() => recreated);
      TimetablePart.find.mockResolvedValue([tp1, tp2]);

      const result = await updateEntry('old1', { status: 'pending', category: 'cat1' }, 'e1');

      expect(TimetablePart.find).toHaveBeenCalledWith({
        event: 'e1',
        Category: 'cat1'
      });
      expect(tp1.StartingOrder).toHaveLength(1);
      expect(tp1.save).toHaveBeenCalledTimes(1);
      expect(tp2.save).not.toHaveBeenCalled();
      expect(logDb).toHaveBeenNthCalledWith(3, 'UPDATE', 'TimetablePart', 'tp1');
      expect(result).toEqual({ oldEntry, newEntry: recreated });
    });
  });

  describe('deleteEntryIncident', () => {
    test('removes matching incident and updates entry', async () => {
      const entry = {
        _id: 'en1',
        EntryIncident: [
          { description: 'A', incidentType: 'warn' },
          { description: 'B', incidentType: 'error' }
        ]
      };
      Entries.findById.mockResolvedValue(entry);
      Entries.findByIdAndUpdate.mockResolvedValue(entry);

      const result = await deleteEntryIncident('en1', {
        description: 'A',
        type: 'warn'
      });

      expect(Entries.findById).toHaveBeenCalledWith('en1');
      expect(entry.EntryIncident).toEqual([{ description: 'B', incidentType: 'error' }]);
      expect(Entries.findByIdAndUpdate).toHaveBeenCalledWith('en1', entry, { runValidators: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Entry', 'en1');
      expect(result).toBe(entry);
    });

    test('throws when entry is not found', async () => {
      Entries.findById.mockResolvedValue(null);

      await expect(
        deleteEntryIncident('missing', { description: 'x', type: 'warn' })
      ).rejects.toThrow('Entry not found');
      expect(Entries.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('addEntryIncident', () => {
    test('adds incident and updates entry', async () => {
      const entry = {
        _id: 'en1',
        EntryIncident: []
      };
      Entries.findById.mockResolvedValue(entry);
      Entries.findByIdAndUpdate.mockResolvedValue(entry);

      const before = Date.now();
      const result = await addEntryIncident('en1', {
        description: 'Late arrival',
        incidentType: 'warn',
        userId: 'u1'
      });
      const after = Date.now();

      expect(Entries.findById).toHaveBeenCalledWith('en1');
      expect(entry.EntryIncident).toHaveLength(1);
      expect(entry.EntryIncident[0].description).toBe('Late arrival');
      expect(entry.EntryIncident[0].incidentType).toBe('warn');
      expect(entry.EntryIncident[0].User).toBe('u1');
      expect(entry.EntryIncident[0].date).toBeGreaterThanOrEqual(before);
      expect(entry.EntryIncident[0].date).toBeLessThanOrEqual(after);
      expect(Entries.findByIdAndUpdate).toHaveBeenCalledWith('en1', entry, { runValidators: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Entry', 'en1');
      expect(result).toBe(entry);
    });

    test('throws when entry is not found', async () => {
      Entries.findById.mockResolvedValue(null);

      await expect(
        addEntryIncident('missing', {
          description: 'x',
          incidentType: 'warn',
          userId: 'u1'
        })
      ).rejects.toThrow('Entry not found');
      expect(Entries.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getHorsesForEvent', () => {
    test('throws when event has no entries', async () => {
      const selectMock = jest.fn().mockResolvedValue([]);
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      Entries.find.mockReturnValue({ populate: populateMock });

      await expect(getHorsesForEvent('e1')).rejects.toThrow('No entries found for the selected event');
      expect(Horse.find).not.toHaveBeenCalled();
    });

    test('returns unique horses sorted by name', async () => {
      const entries = [
        { horse: { _id: { toString: () => 'h1' } } },
        { horse: { _id: { toString: () => 'h1' } } },
        { horse: { _id: { toString: () => 'h2' } } }
      ];
      const selectMock = jest.fn().mockResolvedValue(entries);
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });
      Entries.find.mockReturnValue({ populate: populateMock });

      const horseRows = [{ _id: 'h1' }, { _id: 'h2' }];
      const horseSortMock = jest.fn().mockResolvedValue(horseRows);
      Horse.find.mockReturnValue({ sort: horseSortMock });

      const result = await getHorsesForEvent('e1');

      expect(Entries.find).toHaveBeenCalledWith({ event: 'e1' });
      expect(populateMock).toHaveBeenCalledWith('horse');
      expect(selectMock).toHaveBeenCalledWith('horse');
      expect(Horse.find).toHaveBeenCalledWith({ _id: { $in: ['h1', 'h2'] } });
      expect(horseSortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(horseRows);
    });
  });

  describe('updateHorseVetStatus', () => {
    test('throws when horse is not found', async () => {
      Horse.findById.mockResolvedValue(null);

      await expect(
        updateHorseVetStatus('h1', { status: 'ok', userId: 'u1', eventId: 'e1' })
      ).rejects.toThrow('Horse not found');
      expect(Horse.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('adds vet check status and updates horse', async () => {
      const horse = {
        _id: 'h1',
        VetCheckStatus: []
      };
      Horse.findById.mockResolvedValue(horse);
      Horse.findByIdAndUpdate.mockResolvedValue(horse);

      const before = Date.now();
      const result = await updateHorseVetStatus('h1', {
        status: 'ok',
        userId: 'u1',
        eventId: 'e1'
      });
      const after = Date.now();

      expect(Horse.findById).toHaveBeenCalledWith('h1');
      expect(horse.VetCheckStatus).toHaveLength(1);
      expect(horse.VetCheckStatus[0].status).toBe('ok');
      expect(horse.VetCheckStatus[0].user).toBe('u1');
      expect(horse.VetCheckStatus[0].eventID).toBe('e1');
      expect(horse.VetCheckStatus[0].date).toBeGreaterThanOrEqual(before);
      expect(horse.VetCheckStatus[0].date).toBeLessThanOrEqual(after);
      expect(Horse.findByIdAndUpdate).toHaveBeenCalledWith('h1', horse, { runValidators: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Horse', 'h1');
      expect(result).toBe(horse);
    });
  });

  describe('getSelectedEvent', () => {
    test('returns selected event when available', async () => {
      const selected = { _id: 'e1', selected: true };
      Event.findOne.mockResolvedValue(selected);

      const result = await getSelectedEvent();

      expect(Event.findOne).toHaveBeenCalledWith({ selected: true });
      expect(result).toEqual(selected);
    });

    test('throws when no selected event exists', async () => {
      Event.findOne.mockResolvedValue(null);

      await expect(getSelectedEvent()).rejects.toThrow('No event selected');
    });
  });
});

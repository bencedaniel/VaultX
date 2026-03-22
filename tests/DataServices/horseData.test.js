import {
  getAllHorses,
  getHorseById,
  getHorseByIdWithPopulation,
  createHorse,
  updateHorse,
  deleteHorseNote,
  addHorseNote,
  updateHorseNumbers,
  getHorsesForEvent,
  getAllPermissions
} from '../../DataServices/horseData.js';
import Horse from '../../models/Horse.js';
import Permissions from '../../models/Permissions.js';
import Entries from '../../models/Entries.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Horse.js', () => {
  const HorseMock = jest.fn();
  HorseMock.find = jest.fn();
  HorseMock.findById = jest.fn();
  HorseMock.findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: HorseMock
  };
});

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
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

describe('horseData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllHorses', () => {
    test('returns all horses sorted by name', async () => {
      const horses = [{ _id: 'h1', name: 'Apollo' }];
      const sortMock = jest.fn().mockResolvedValue(horses);
      Horse.find.mockReturnValue({ sort: sortMock });

      const result = await getAllHorses();

      expect(Horse.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(horses);
    });

    test('propagates query errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('query failed'));
      Horse.find.mockReturnValue({ sort: sortMock });

      await expect(getAllHorses()).rejects.toThrow('query failed');
    });
  });

  describe('getHorseById', () => {
    test('returns horse when found', async () => {
      const horse = { _id: 'h1', name: 'Apollo' };
      Horse.findById.mockResolvedValue(horse);

      const result = await getHorseById('h1');

      expect(Horse.findById).toHaveBeenCalledWith('h1');
      expect(result).toEqual(horse);
    });

    test('throws when horse not found', async () => {
      Horse.findById.mockResolvedValue(null);

      await expect(getHorseById('missing')).rejects.toThrow('Horse not found');
    });
  });

  describe('getHorseByIdWithPopulation', () => {
    test('returns horse with populated relations', async () => {
      const horse = { _id: 'h1', name: 'Apollo' };
      const chain = { populate: jest.fn() };
      let count = 0;
      chain.populate.mockImplementation(() => {
        count += 1;
        if (count === 4) {
          return Promise.resolve(horse);
        }
        return chain;
      });
      Horse.findById.mockReturnValue(chain);

      const result = await getHorseByIdWithPopulation('h1');

      expect(Horse.findById).toHaveBeenCalledWith('h1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'Notes.user', '-password -__v');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'VetCheckStatus.eventID', 'EventName');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'VetCheckStatus.user', '-password -__v');
      expect(chain.populate).toHaveBeenNthCalledWith(4, 'Notes.eventID', 'EventName');
      expect(result).toEqual(horse);
    });

    test('throws when populated horse is not found', async () => {
      const chain = { populate: jest.fn() };
      let count = 0;
      chain.populate.mockImplementation(() => {
        count += 1;
        if (count === 4) {
          return Promise.resolve(null);
        }
        return chain;
      });
      Horse.findById.mockReturnValue(chain);

      await expect(getHorseByIdWithPopulation('missing')).rejects.toThrow('Horse not found');
    });
  });

  describe('createHorse', () => {
    test('creates horse and pushes head/box numbers for event', async () => {
      const payload = { name: 'Apollo' };
      const created = {
        _id: 'h1',
        ...payload,
        HeadNr: [],
        BoxNr: [],
        save: jest.fn().mockResolvedValue(undefined)
      };
      Horse.mockImplementation(() => created);

      const result = await createHorse(payload, 12, 7, 'e1');

      expect(Horse).toHaveBeenCalledWith(payload);
      expect(created.HeadNr).toEqual([{ headNumber: 12, eventID: 'e1' }]);
      expect(created.BoxNr).toEqual([{ boxNumber: 7, eventID: 'e1' }]);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Horse', 'h1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 'h1',
        HeadNr: [],
        BoxNr: [],
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Horse.mockImplementation(() => created);

      await expect(createHorse({ name: 'Apollo' }, 12, 7, 'e1')).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateHorse', () => {
    test('throws when horse not found in initial update step', async () => {
      Horse.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateHorse('h1', { name: 'A' }, 10, 5, 'e1')).rejects.toThrow('Horse not found');
      expect(Horse.findById).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('updates existing head/box numbers for matching event', async () => {
      const returnedHorse = { _id: 'h1', name: 'Apollo' };
      const horseToUpdate = {
        _id: 'h1',
        BoxNr: [{ eventID: 'e1', boxNumber: 1 }],
        HeadNr: [{ eventID: 'e1', headNumber: 2 }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      Horse.findByIdAndUpdate.mockResolvedValue(returnedHorse);
      Horse.findById.mockResolvedValue(horseToUpdate);

      const result = await updateHorse('h1', { name: 'Apollo v2' }, 99, 88, 'e1');

      expect(Horse.findByIdAndUpdate).toHaveBeenCalledWith(
        'h1',
        { name: 'Apollo v2' },
        { runValidators: true }
      );
      expect(horseToUpdate.BoxNr).toEqual([{ eventID: 'e1', boxNumber: 88 }]);
      expect(horseToUpdate.HeadNr).toEqual([{ eventID: 'e1', headNumber: 99 }]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Horse', 'h1');
      expect(horseToUpdate.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(returnedHorse);
    });

    test('adds new head/box numbers when event-specific records are missing', async () => {
      const returnedHorse = { _id: 'h1', name: 'Apollo' };
      const horseToUpdate = {
        _id: 'h1',
        BoxNr: [{ eventID: 'other', boxNumber: 1 }],
        HeadNr: [{ eventID: 'other', headNumber: 2 }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      Horse.findByIdAndUpdate.mockResolvedValue(returnedHorse);
      Horse.findById.mockResolvedValue(horseToUpdate);

      await updateHorse('h1', { name: 'Apollo v2' }, 77, 66, 'e1');

      expect(horseToUpdate.BoxNr).toContainEqual({ eventID: 'e1', boxNumber: 66 });
      expect(horseToUpdate.HeadNr).toContainEqual({ eventID: 'e1', headNumber: 77 });
      expect(horseToUpdate.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteHorseNote', () => {
    test('removes note text and updates horse', async () => {
      const horse = {
        _id: 'h1',
        Notes: [
          { note: 'keep me' },
          { note: 'remove me' }
        ]
      };
      Horse.findById.mockResolvedValue(horse);
      Horse.findByIdAndUpdate.mockResolvedValue(horse);

      const result = await deleteHorseNote('h1', 'remove me');

      expect(Horse.findById).toHaveBeenCalledWith('h1');
      expect(horse.Notes).toEqual([{ note: 'keep me' }]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Horse', 'h1');
      expect(Horse.findByIdAndUpdate).toHaveBeenCalledWith('h1', horse, { runValidators: true });
      expect(result).toBe(horse);
    });

    test('throws when horse not found', async () => {
      Horse.findById.mockResolvedValue(null);

      await expect(deleteHorseNote('missing', 'x')).rejects.toThrow('Horse not found');
      expect(Horse.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('addHorseNote', () => {
    test('adds note with timestamp and logs update twice', async () => {
      const horse = {
        _id: 'h1',
        Notes: []
      };
      Horse.findById.mockResolvedValue(horse);
      Horse.findByIdAndUpdate.mockResolvedValue(horse);

      const before = Date.now();
      const result = await addHorseNote('h1', {
        note: 'Important note',
        user: 'u1',
        eventID: 'e1'
      });
      const after = Date.now();

      expect(Horse.findById).toHaveBeenCalledWith('h1');
      expect(horse.Notes).toHaveLength(1);
      expect(horse.Notes[0].note).toBe('Important note');
      expect(horse.Notes[0].user).toBe('u1');
      expect(horse.Notes[0].eventID).toBe('e1');
      expect(horse.Notes[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(horse.Notes[0].timestamp).toBeLessThanOrEqual(after);
      expect(Horse.findByIdAndUpdate).toHaveBeenCalledWith('h1', horse, { runValidators: true });
      expect(logDb).toHaveBeenCalledTimes(2);
      expect(logDb).toHaveBeenNthCalledWith(1, 'UPDATE', 'Horse', 'h1');
      expect(logDb).toHaveBeenNthCalledWith(2, 'UPDATE', 'Horse', 'h1');
      expect(result).toBe(horse);
    });

    test('throws when horse not found', async () => {
      Horse.findById.mockResolvedValue(null);

      await expect(addHorseNote('missing', { note: 'x', user: 'u1', eventID: 'e1' })).rejects.toThrow(
        'Horse not found'
      );
      expect(Horse.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateHorseNumbers', () => {
    test('throws when horse not found', async () => {
      Horse.findById.mockResolvedValue(null);

      await expect(updateHorseNumbers('h1', 10, 20, 'e1')).rejects.toThrow('Horse not found');
      expect(Horse.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('updates existing event-specific head/box numbers', async () => {
      const horse = {
        _id: 'h1',
        HeadNr: [{ eventID: 'e1', headNumber: 1 }],
        BoxNr: [{ eventID: 'e1', boxNumber: 2 }]
      };
      Horse.findById.mockResolvedValue(horse);
      Horse.findByIdAndUpdate.mockResolvedValue(horse);

      const result = await updateHorseNumbers('h1', 11, 22, 'e1');

      expect(horse.HeadNr).toEqual([{ eventID: 'e1', headNumber: 11 }]);
      expect(horse.BoxNr).toEqual([{ eventID: 'e1', boxNumber: 22 }]);
      expect(Horse.findByIdAndUpdate).toHaveBeenCalledWith('h1', horse, { runValidators: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Horse', 'h1');
      expect(result).toBe(horse);
    });

    test('adds new event-specific head/box numbers when missing', async () => {
      const horse = {
        _id: 'h1',
        HeadNr: [{ eventID: 'other', headNumber: 1 }],
        BoxNr: [{ eventID: 'other', boxNumber: 2 }]
      };
      Horse.findById.mockResolvedValue(horse);
      Horse.findByIdAndUpdate.mockResolvedValue(horse);

      await updateHorseNumbers('h1', 11, 22, 'e1');

      expect(horse.HeadNr).toContainEqual({ headNumber: 11, eventID: 'e1' });
      expect(horse.BoxNr).toContainEqual({ boxNumber: 22, eventID: 'e1' });
    });
  });

  describe('getHorsesForEvent', () => {
    test('throws when no entries exist for event', async () => {
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

      const horses = [{ _id: 'h1' }, { _id: 'h2' }];
      const sortMock = jest.fn().mockResolvedValue(horses);
      Horse.find.mockReturnValue({ sort: sortMock });

      const result = await getHorsesForEvent('e1');

      expect(Entries.find).toHaveBeenCalledWith({ event: 'e1' });
      expect(populateMock).toHaveBeenCalledWith('horse');
      expect(selectMock).toHaveBeenCalledWith('horse');
      expect(Horse.find).toHaveBeenCalledWith({ _id: { $in: ['h1', 'h2'] } });
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(horses);
    });
  });

  describe('getAllPermissions', () => {
    test('returns all permissions', async () => {
      const permissions = [{ _id: 'p1', name: 'horses.read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getAllPermissions();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });

    test('propagates permission query errors', async () => {
      Permissions.find.mockRejectedValue(new Error('permission query failed'));

      await expect(getAllPermissions()).rejects.toThrow('permission query failed');
    });
  });
});

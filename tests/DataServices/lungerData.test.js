import {
  getAllLungers,
  getLungerById,
  getLungerByIdWithPopulation,
  createLunger,
  updateLunger,
  deleteLungerIncident,
  addLungerIncident,
  getAllUsers,
  getAllPermissions
} from '../../DataServices/lungerData.js';
import Lunger from '../../models/Lunger.js';
import Permissions from '../../models/Permissions.js';
import User from '../../models/User.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Lunger.js', () => {
  const LungerMock = jest.fn();
  LungerMock.find = jest.fn();
  LungerMock.findById = jest.fn();
  LungerMock.findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: LungerMock
  };
});

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/User.js', () => ({
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

describe('lungerData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLungers', () => {
    test('returns all lungers sorted by name', async () => {
      const lungers = [{ _id: 'l1', name: 'Anna' }];
      const sortMock = jest.fn().mockResolvedValue(lungers);
      Lunger.find.mockReturnValue({ sort: sortMock });

      const result = await getAllLungers();

      expect(Lunger.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(lungers);
    });

    test('propagates query errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('query failed'));
      Lunger.find.mockReturnValue({ sort: sortMock });

      await expect(getAllLungers()).rejects.toThrow('query failed');
    });
  });

  describe('getLungerById', () => {
    test('returns lunger when found', async () => {
      const lunger = { _id: 'l1', name: 'Anna' };
      Lunger.findById.mockResolvedValue(lunger);

      const result = await getLungerById('l1');

      expect(Lunger.findById).toHaveBeenCalledWith('l1');
      expect(result).toEqual(lunger);
    });

    test('throws when lunger is not found', async () => {
      Lunger.findById.mockResolvedValue(null);

      await expect(getLungerById('missing')).rejects.toThrow('Lunger not found');
    });
  });

  describe('getLungerByIdWithPopulation', () => {
    test('returns lunger with populated incidents', async () => {
      const lunger = { _id: 'l1', name: 'Anna' };
      const populateMock = jest.fn().mockResolvedValue(lunger);
      Lunger.findById.mockReturnValue({ populate: populateMock });

      const result = await getLungerByIdWithPopulation('l1');

      expect(Lunger.findById).toHaveBeenCalledWith('l1');
      expect(populateMock).toHaveBeenCalledWith('LungerIncident.eventID', 'EventName');
      expect(result).toEqual(lunger);
    });

    test('throws when populated lunger is not found', async () => {
      const populateMock = jest.fn().mockResolvedValue(null);
      Lunger.findById.mockReturnValue({ populate: populateMock });

      await expect(getLungerByIdWithPopulation('missing')).rejects.toThrow('Lunger not found');
    });
  });

  describe('createLunger', () => {
    test('creates, saves and logs new lunger', async () => {
      const payload = { name: 'Anna' };
      const created = {
        _id: 'l1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Lunger.mockImplementation(() => created);

      const result = await createLunger(payload);

      expect(Lunger).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Lunger', 'l1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 'l1',
        name: 'Anna',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Lunger.mockImplementation(() => created);

      await expect(createLunger({ name: 'Anna' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateLunger', () => {
    test('updates lunger and logs update when found', async () => {
      const updated = { _id: 'l1', name: 'Anna Updated' };
      const payload = { name: 'Anna Updated' };
      Lunger.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateLunger('l1', payload);

      expect(Lunger.findByIdAndUpdate).toHaveBeenCalledWith(
        'l1',
        payload,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Lunger', 'l1');
      expect(result).toEqual(updated);
    });

    test('throws when lunger not found during update', async () => {
      Lunger.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateLunger('missing', { name: 'x' })).rejects.toThrow('Lunger not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors', async () => {
      Lunger.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateLunger('l1', { name: 'x' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteLungerIncident', () => {
    test('removes matching incident and updates lunger', async () => {
      const lunger = {
        _id: 'l1',
        LungerIncident: [
          { description: 'A', incidentType: 'warn' },
          { description: 'B', incidentType: 'error' }
        ]
      };
      Lunger.findById.mockResolvedValue(lunger);
      Lunger.findByIdAndUpdate.mockResolvedValue(lunger);

      const result = await deleteLungerIncident('l1', {
        description: 'A',
        type: 'warn'
      });

      expect(Lunger.findById).toHaveBeenCalledWith('l1');
      expect(lunger.LungerIncident).toEqual([{ description: 'B', incidentType: 'error' }]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Lunger', 'l1');
      expect(Lunger.findByIdAndUpdate).toHaveBeenCalledWith('l1', lunger, { runValidators: true });
      expect(result).toBe(lunger);
    });

    test('throws when lunger is not found', async () => {
      Lunger.findById.mockResolvedValue(null);

      await expect(
        deleteLungerIncident('missing', { description: 'A', type: 'warn' })
      ).rejects.toThrow('Lunger not found');

      expect(Lunger.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('addLungerIncident', () => {
    test('adds incident with metadata and updates lunger', async () => {
      const lunger = {
        _id: 'l1',
        LungerIncident: []
      };
      Lunger.findById.mockResolvedValue(lunger);
      Lunger.findByIdAndUpdate.mockResolvedValue(lunger);

      const before = Date.now();
      const result = await addLungerIncident('l1', {
        description: 'Late check-in',
        incidentType: 'warn',
        userId: 'u1',
        eventId: 'e1'
      });
      const after = Date.now();

      expect(Lunger.findById).toHaveBeenCalledWith('l1');
      expect(lunger.LungerIncident).toHaveLength(1);
      expect(lunger.LungerIncident[0].description).toBe('Late check-in');
      expect(lunger.LungerIncident[0].incidentType).toBe('warn');
      expect(lunger.LungerIncident[0].User).toBe('u1');
      expect(lunger.LungerIncident[0].eventID).toBe('e1');
      expect(lunger.LungerIncident[0].date).toBeGreaterThanOrEqual(before);
      expect(lunger.LungerIncident[0].date).toBeLessThanOrEqual(after);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Lunger', 'l1');
      expect(Lunger.findByIdAndUpdate).toHaveBeenCalledWith('l1', lunger, { runValidators: true });
      expect(result).toBe(lunger);
    });

    test('throws when lunger is not found', async () => {
      Lunger.findById.mockResolvedValue(null);

      await expect(
        addLungerIncident('missing', {
          description: 'x',
          incidentType: 'warn',
          userId: 'u1',
          eventId: 'e1'
        })
      ).rejects.toThrow('Lunger not found');

      expect(Lunger.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    test('returns all users', async () => {
      const users = [{ _id: 'u1', username: 'alice' }];
      User.find.mockResolvedValue(users);

      const result = await getAllUsers();

      expect(User.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    test('propagates user query errors', async () => {
      User.find.mockRejectedValue(new Error('users failed'));

      await expect(getAllUsers()).rejects.toThrow('users failed');
    });
  });

  describe('getAllPermissions', () => {
    test('returns all permissions', async () => {
      const permissions = [{ _id: 'p1', name: 'lunger.read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getAllPermissions();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });

    test('propagates permission query errors', async () => {
      Permissions.find.mockRejectedValue(new Error('permissions failed'));

      await expect(getAllPermissions()).rejects.toThrow('permissions failed');
    });
  });
});

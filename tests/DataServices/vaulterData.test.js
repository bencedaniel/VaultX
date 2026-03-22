import {
  getAllVaulters,
  getVaulterById,
  getVaulterByIdLean,
  createVaulter,
  updateVaulter,
  updateVaulterArmNumber,
  addIncidentToVaulter,
  removeIncidentFromVaulter,
  getAllEntriesWithVaulters,
  getAllPermissions,
  getAllUsers
} from '../../DataServices/vaulterData.js';
import Vaulter from '../../models/Vaulter.js';
import Entries from '../../models/Entries.js';
import Permissions from '../../models/Permissions.js';
import User from '../../models/User.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Vaulter.js', () => {
  const VaulterMock = jest.fn();
  VaulterMock.find = jest.fn();
  VaulterMock.findById = jest.fn();
  VaulterMock.findByIdAndUpdate = jest.fn();

  return {
    __esModule: true,
    default: VaulterMock
  };
});

jest.mock('../../models/Entries.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

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

describe('vaulterData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllVaulters', () => {
    test('returns all vaulters sorted by name', async () => {
      const rows = [{ _id: 'v1', Name: 'Alice' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      Vaulter.find.mockReturnValue({ sort: sortMock });

      const result = await getAllVaulters();

      expect(Vaulter.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getVaulterById', () => {
    test('returns vaulter with incident event populated', async () => {
      const row = { _id: 'v1' };
      const execMock = jest.fn().mockResolvedValue(row);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      Vaulter.findById.mockReturnValue({ populate: populateMock });

      const result = await getVaulterById('v1');

      expect(Vaulter.findById).toHaveBeenCalledWith('v1');
      expect(populateMock).toHaveBeenCalledWith('VaulterIncident.eventID', 'EventName');
      expect(result).toEqual(row);
    });
  });

  describe('getVaulterByIdLean', () => {
    test('returns lean vaulter document by id', async () => {
      const row = { _id: 'v1' };
      const execMock = jest.fn().mockResolvedValue(row);
      const leanMock = jest.fn().mockReturnValue({ exec: execMock });
      Vaulter.findById.mockReturnValue({ lean: leanMock });

      const result = await getVaulterByIdLean('v1');

      expect(Vaulter.findById).toHaveBeenCalledWith('v1');
      expect(leanMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(row);
    });
  });

  describe('createVaulter', () => {
    test('creates, saves and logs vaulter', async () => {
      const payload = { Name: 'Alice' };
      const created = {
        _id: 'v1',
        Name: 'Alice',
        save: jest.fn().mockResolvedValue(undefined)
      };
      Vaulter.mockImplementation(() => created);

      const result = await createVaulter(payload);

      expect(Vaulter).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Vaulter', 'Alice');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log', async () => {
      const created = {
        Name: 'Alice',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Vaulter.mockImplementation(() => created);

      await expect(createVaulter({ Name: 'Alice' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateVaulter', () => {
    test('updates vaulter and logs update', async () => {
      const updated = { _id: 'v1', Name: 'Alice' };
      const execMock = jest.fn().mockResolvedValue(updated);
      Vaulter.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await updateVaulter('v1', { Name: 'Alice' });

      expect(Vaulter.findByIdAndUpdate).toHaveBeenCalledWith(
        'v1',
        { Name: 'Alice' },
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Vaulter', 'Alice');
      expect(result).toEqual(updated);
    });
  });

  describe('updateVaulterArmNumber', () => {
    test('throws when vaulter is not found', async () => {
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(updateVaulterArmNumber('v1', 'e1', 11)).rejects.toThrow('Vaulter not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('updates existing event arm number and logs', async () => {
      const vaulter = {
        Name: 'Alice',
        ArmNr: [{ eventID: 'e1', armNumber: 2 }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });

      const result = await updateVaulterArmNumber('v1', 'e1', 9);

      expect(vaulter.ArmNr).toEqual([{ eventID: 'e1', armNumber: 9 }]);
      expect(vaulter.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Vaulter', 'Alice');
      expect(result).toBe(vaulter);
    });

    test('adds new event arm number when missing', async () => {
      const vaulter = {
        Name: 'Alice',
        ArmNr: [{ eventID: 'other', armNumber: 2 }],
        save: jest.fn().mockResolvedValue(undefined)
      };
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });

      await updateVaulterArmNumber('v1', 'e1', 9);

      expect(vaulter.ArmNr).toContainEqual({ eventID: 'e1', armNumber: 9 });
    });
  });

  describe('addIncidentToVaulter', () => {
    test('adds incident, updates vaulter and logs', async () => {
      const vaulter = {
        Name: 'Alice',
        VaulterIncident: []
      };
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });
      Vaulter.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });

      const incident = { description: 'Late', incidentType: 'warn', userId: 'u1' };
      const result = await addIncidentToVaulter('v1', incident);

      expect(vaulter.VaulterIncident).toEqual([incident]);
      expect(Vaulter.findByIdAndUpdate).toHaveBeenCalledWith('v1', vaulter, { runValidators: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Vaulter', 'Alice');
      expect(result).toBe(vaulter);
    });

    test('throws when vaulter not found', async () => {
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(addIncidentToVaulter('v1', { description: 'x' })).rejects.toThrow('Vaulter not found');
      expect(Vaulter.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('removeIncidentFromVaulter', () => {
    test('throws when vaulter not found', async () => {
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(removeIncidentFromVaulter('v1', { description: 'x' })).rejects.toThrow('Vaulter not found');
      expect(Vaulter.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('removes matching incident with date tolerance and keeps others', async () => {
      const baseDate = new Date('2025-11-05T12:44:05.000Z').getTime();
      const vaulter = {
        Name: 'Alice',
        VaulterIncident: [
          {
            description: 'A',
            incidentType: 'warn',
            user: 'u1',
            date: baseDate
          },
          {
            description: 'A',
            incidentType: 'warn',
            user: 'u1',
            date: baseDate + 30000
          },
          {
            description: 'B',
            incidentType: 'error',
            User: 'u2',
            date: '2025. 11. 05. 12:44:01'
          }
        ]
      };
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });
      Vaulter.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });

      const result = await removeIncidentFromVaulter('v1', {
        description: 'A',
        incidentType: 'warn',
        userId: 'u1',
        date: new Date(baseDate + 10000).toISOString()
      });

      expect(vaulter.VaulterIncident).toHaveLength(1);
      expect(vaulter.VaulterIncident[0].description).toBe('B');
      expect(Vaulter.findByIdAndUpdate).toHaveBeenCalledWith('v1', vaulter, { runValidators: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Vaulter', 'Alice');
      expect(result).toBe(vaulter);
    });

    test('ignores date comparison when requested date is unparsable', async () => {
      const vaulter = {
        Name: 'Alice',
        VaulterIncident: [
          {
            description: 'A',
            incidentType: 'warn',
            user: 'u1',
            date: 100
          }
        ]
      };
      Vaulter.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });
      Vaulter.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(vaulter) });

      await removeIncidentFromVaulter('v1', {
        description: 'A',
        type: 'warn',
        userId: 'u1',
        date: 'not a date'
      });

      expect(vaulter.VaulterIncident).toEqual([]);
    });
  });

  describe('getAllEntriesWithVaulters', () => {
    test('returns entries with vaulter populated', async () => {
      const rows = [{ _id: 'e1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      Entries.find.mockReturnValue({ populate: populateMock });

      const result = await getAllEntriesWithVaulters();

      expect(Entries.find).toHaveBeenCalledTimes(1);
      expect(populateMock).toHaveBeenCalledWith('vaulter');
      expect(result).toEqual(rows);
    });
  });

  describe('getAllPermissions', () => {
    test('loads permissions through dynamic import and returns them', async () => {
      const permissions = [{ _id: 'p1', name: 'read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getAllPermissions();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });
  });

  describe('getAllUsers', () => {
    test('loads users through dynamic import and returns them', async () => {
      const users = [{ _id: 'u1', username: 'alice' }];
      User.find.mockResolvedValue(users);

      const result = await getAllUsers();

      expect(User.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });
  });
});

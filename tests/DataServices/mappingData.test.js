import {
  getAllMappings,
  getMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
  getAllPermissions
} from '../../DataServices/mappingData.js';
import TableMapping from '../../models/TableMapping.js';
import Permissions from '../../models/Permissions.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/TableMapping.js', () => {
  const TableMappingMock = jest.fn();
  TableMappingMock.find = jest.fn();
  TableMappingMock.findById = jest.fn();
  TableMappingMock.findByIdAndUpdate = jest.fn();
  TableMappingMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: TableMappingMock
  };
});

jest.mock('../../models/Permissions.js', () => ({
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

describe('mappingData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllMappings', () => {
    test('returns all mappings sorted by name', async () => {
      const mappings = [{ _id: 'm1', name: 'Map A' }];
      const sortMock = jest.fn().mockResolvedValue(mappings);
      TableMapping.find.mockReturnValue({ sort: sortMock });

      const result = await getAllMappings();

      expect(TableMapping.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(mappings);
    });

    test('propagates query errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('query failed'));
      TableMapping.find.mockReturnValue({ sort: sortMock });

      await expect(getAllMappings()).rejects.toThrow('query failed');
    });
  });

  describe('getMappingById', () => {
    test('returns mapping when found', async () => {
      const mapping = { _id: 'm1', name: 'Map A' };
      TableMapping.findById.mockResolvedValue(mapping);

      const result = await getMappingById('m1');

      expect(TableMapping.findById).toHaveBeenCalledWith('m1');
      expect(result).toEqual(mapping);
    });

    test('throws when mapping is not found', async () => {
      TableMapping.findById.mockResolvedValue(null);

      await expect(getMappingById('missing')).rejects.toThrow('Mapping not found');
    });
  });

  describe('createMapping', () => {
    test('creates, saves and logs mapping', async () => {
      const payload = { name: 'Map A' };
      const created = {
        _id: 'm1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      TableMapping.mockImplementation(() => created);

      const result = await createMapping(payload);

      expect(TableMapping).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'TableMapping', 'm1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 'm1',
        name: 'Map A',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      TableMapping.mockImplementation(() => created);

      await expect(createMapping({ name: 'Map A' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateMapping', () => {
    test('updates mapping and logs update when found', async () => {
      const updated = { _id: 'm1', name: 'Map Updated' };
      const payload = { name: 'Map Updated' };
      TableMapping.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateMapping('m1', payload);

      expect(TableMapping.findByIdAndUpdate).toHaveBeenCalledWith(
        'm1',
        payload,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TableMapping', 'm1');
      expect(result).toEqual(updated);
    });

    test('throws when mapping not found during update', async () => {
      TableMapping.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateMapping('missing', { name: 'X' })).rejects.toThrow('Mapping not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors', async () => {
      TableMapping.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateMapping('m1', { name: 'X' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteMapping', () => {
    test('deletes mapping and logs deletion when found', async () => {
      const deleted = { _id: 'm1', name: 'Map A' };
      TableMapping.findByIdAndDelete.mockResolvedValue(deleted);

      const result = await deleteMapping('m1');

      expect(TableMapping.findByIdAndDelete).toHaveBeenCalledWith('m1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'TableMapping', 'm1');
      expect(result).toEqual(deleted);
    });

    test('throws when mapping not found during delete', async () => {
      TableMapping.findByIdAndDelete.mockResolvedValue(null);

      await expect(deleteMapping('missing')).rejects.toThrow('Mapping not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates delete errors', async () => {
      TableMapping.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteMapping('m1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getAllPermissions', () => {
    test('returns all permissions', async () => {
      const permissions = [{ _id: 'p1', name: 'mapping.read' }];
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

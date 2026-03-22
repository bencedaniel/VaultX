import {
  getAllGenerators,
  getGeneratorById,
  getGeneratorFormData,
  createGenerator,
  updateGenerator,
  updateGeneratorStatus,
  deleteGenerator
} from '../../DataServices/resultGeneratorData.js';
import resultGenerator from '../../models/resultGenerator.js';
import Category from '../../models/Category.js';
import calcTemplate from '../../models/calcTemplate.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/resultGenerator.js', () => {
  const ResultGeneratorMock = jest.fn();
  ResultGeneratorMock.find = jest.fn();
  ResultGeneratorMock.findById = jest.fn();
  ResultGeneratorMock.findByIdAndUpdate = jest.fn();
  ResultGeneratorMock.findByIdAndDelete = jest.fn();
  ResultGeneratorMock.findOne = jest.fn();

  return {
    __esModule: true,
    default: ResultGeneratorMock
  };
});

jest.mock('../../models/Category.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/calcTemplate.js', () => ({
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

describe('resultGeneratorData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllGenerators', () => {
    test('returns all generators with category and calc schema populated', async () => {
      const rows = [{ _id: 'g1' }];
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          return Promise.resolve(rows);
        }
        return chain;
      });
      resultGenerator.find.mockReturnValue(chain);

      const result = await getAllGenerators();

      expect(resultGenerator.find).toHaveBeenCalledTimes(1);
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'calcSchemaTemplate');
      expect(result).toEqual(rows);
    });

    test('propagates populate chain errors', async () => {
      const chain = { populate: jest.fn() };
      chain.populate
        .mockReturnValueOnce(chain)
        .mockRejectedValueOnce(new Error('populate failed'));
      resultGenerator.find.mockReturnValue(chain);

      await expect(getAllGenerators()).rejects.toThrow('populate failed');
    });
  });

  describe('getGeneratorById', () => {
    test('returns generator by id with populated fields', async () => {
      const row = { _id: 'g1' };
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          return Promise.resolve(row);
        }
        return chain;
      });
      resultGenerator.findById.mockReturnValue(chain);

      const result = await getGeneratorById('g1');

      expect(resultGenerator.findById).toHaveBeenCalledWith('g1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'calcSchemaTemplate');
      expect(result).toEqual(row);
    });

    test('returns null when generator does not exist', async () => {
      const chain = { populate: jest.fn() };
      chain.populate
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce(null);
      resultGenerator.findById.mockReturnValue(chain);

      const result = await getGeneratorById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getGeneratorFormData', () => {
    test('returns categories and calculation templates', async () => {
      const categories = [{ _id: 'c1' }];
      const calcTemplates = [{ _id: 't1' }];
      Category.find.mockResolvedValue(categories);
      calcTemplate.find.mockResolvedValue(calcTemplates);

      const result = await getGeneratorFormData();

      expect(Category.find).toHaveBeenCalledTimes(1);
      expect(calcTemplate.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ categories, calcTemplates });
    });

    test('propagates form data query errors', async () => {
      Category.find.mockRejectedValue(new Error('category query failed'));

      await expect(getGeneratorFormData()).rejects.toThrow('category query failed');
    });
  });

  describe('createGenerator', () => {
    test('throws when generator already exists for category', async () => {
      resultGenerator.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        createGenerator({ category: 'c1', calcSchemaTemplate: 't1', active: true })
      ).rejects.toThrow('A result generator for the selected category already exists.');

      expect(resultGenerator).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('creates, saves and logs generator when category is unique', async () => {
      const payload = { category: 'c1', calcSchemaTemplate: 't1', active: true };
      const created = {
        _id: 'g1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      resultGenerator.findOne.mockResolvedValue(null);
      resultGenerator.mockImplementation(() => created);

      const result = await createGenerator(payload);

      expect(resultGenerator.findOne).toHaveBeenCalledWith({ category: 'c1' });
      expect(resultGenerator).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'ResultGenerator', 'g1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const payload = { category: 'c1', calcSchemaTemplate: 't1', active: true };
      const created = {
        _id: 'g1',
        ...payload,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      resultGenerator.findOne.mockResolvedValue(null);
      resultGenerator.mockImplementation(() => created);

      await expect(createGenerator(payload)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateGenerator', () => {
    test('throws when another generator with same category exists', async () => {
      resultGenerator.findOne.mockResolvedValue({ _id: 'other' });

      await expect(
        updateGenerator('g1', { category: 'c1', calcSchemaTemplate: 't1', active: true })
      ).rejects.toThrow('A result generator for the selected category already exists.');

      expect(resultGenerator.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('updates and logs when category uniqueness check passes', async () => {
      const updated = { _id: 'g1', category: 'c1' };
      const payload = { category: 'c1', calcSchemaTemplate: 't2', active: false };
      resultGenerator.findOne.mockResolvedValue(null);
      resultGenerator.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateGenerator('g1', payload);

      expect(resultGenerator.findOne).toHaveBeenCalledWith({
        category: 'c1',
        _id: { $ne: 'g1' }
      });
      expect(resultGenerator.findByIdAndUpdate).toHaveBeenCalledWith('g1', payload, { new: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'ResultGenerator', 'g1');
      expect(result).toEqual(updated);
    });

    test('propagates update errors and does not log', async () => {
      resultGenerator.findOne.mockResolvedValue(null);
      resultGenerator.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(
        updateGenerator('g1', { category: 'c1', calcSchemaTemplate: 't1', active: true })
      ).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateGeneratorStatus', () => {
    test('throws when generator is not found', async () => {
      resultGenerator.findById.mockResolvedValue(null);

      await expect(updateGeneratorStatus('missing', true)).rejects.toThrow('Result generator not found.');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('updates active status, saves and logs', async () => {
      const generator = {
        _id: 'g1',
        active: false,
        save: jest.fn().mockResolvedValue(undefined)
      };
      resultGenerator.findById.mockResolvedValue(generator);

      const result = await updateGeneratorStatus('g1', true);

      expect(resultGenerator.findById).toHaveBeenCalledWith('g1');
      expect(generator.active).toBe(true);
      expect(generator.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'ResultGenerator', 'g1');
      expect(result).toBe(generator);
    });

    test('propagates save errors and does not log', async () => {
      const generator = {
        _id: 'g1',
        active: false,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      resultGenerator.findById.mockResolvedValue(generator);

      await expect(updateGeneratorStatus('g1', true)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteGenerator', () => {
    test('deletes generator and logs deletion', async () => {
      resultGenerator.findByIdAndDelete.mockResolvedValue({ _id: 'g1' });

      const result = await deleteGenerator('g1');

      expect(resultGenerator.findByIdAndDelete).toHaveBeenCalledWith('g1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'ResultGenerator', 'g1');
      expect(result).toBeUndefined();
    });

    test('propagates delete errors and does not log', async () => {
      resultGenerator.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteGenerator('g1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });
});

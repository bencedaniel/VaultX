import {
  getAllCalcTemplates,
  getCalcTemplateById,
  createCalcTemplate,
  updateCalcTemplate,
  deleteCalcTemplate,
  getCalcTemplateFormData
} from '../../DataServices/resultCalcTemplateData.js';
import calcTemplate from '../../models/calcTemplate.js';
import resultGenerator from '../../models/resultGenerator.js';
import resultGroup from '../../models/resultGroup.js';
import Category from '../../models/Category.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/calcTemplate.js', () => {
  const CalcTemplateMock = jest.fn();
  CalcTemplateMock.find = jest.fn();
  CalcTemplateMock.findById = jest.fn();
  CalcTemplateMock.findByIdAndUpdate = jest.fn();
  CalcTemplateMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: CalcTemplateMock
  };
});

jest.mock('../../models/resultGenerator.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

jest.mock('../../models/resultGroup.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

jest.mock('../../models/Category.js', () => ({
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

describe('resultCalcTemplateData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCalcTemplates', () => {
    test('returns all calculation templates', async () => {
      const templates = [{ _id: 't1', name: 'Template 1' }];
      calcTemplate.find.mockResolvedValue(templates);

      const result = await getAllCalcTemplates();

      expect(calcTemplate.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(templates);
    });

    test('propagates query errors', async () => {
      calcTemplate.find.mockRejectedValue(new Error('query failed'));

      await expect(getAllCalcTemplates()).rejects.toThrow('query failed');
    });
  });

  describe('getCalcTemplateById', () => {
    test('returns calculation template by id', async () => {
      const template = { _id: 't1', name: 'Template 1' };
      calcTemplate.findById.mockResolvedValue(template);

      const result = await getCalcTemplateById('t1');

      expect(calcTemplate.findById).toHaveBeenCalledWith('t1');
      expect(result).toEqual(template);
    });

    test('returns null when template does not exist', async () => {
      calcTemplate.findById.mockResolvedValue(null);

      const result = await getCalcTemplateById('missing');

      expect(result).toBeNull();
    });
  });

  describe('createCalcTemplate', () => {
    test('creates, saves and logs new calculation template', async () => {
      const payload = { name: 'Template 1', rules: [] };
      const created = {
        _id: 't1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      calcTemplate.mockImplementation(() => created);

      const result = await createCalcTemplate(payload);

      expect(calcTemplate).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'CalcTemplate', 't1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 't1',
        name: 'Template 1',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      calcTemplate.mockImplementation(() => created);

      await expect(createCalcTemplate({ name: 'Template 1' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateCalcTemplate', () => {
    test('updates template and logs update', async () => {
      const updated = { _id: 't1', name: 'Template Updated' };
      const payload = { name: 'Template Updated' };
      calcTemplate.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateCalcTemplate('t1', payload);

      expect(calcTemplate.findByIdAndUpdate).toHaveBeenCalledWith('t1', payload, { new: true });
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'CalcTemplate', 't1');
      expect(result).toEqual(updated);
    });

    test('returns null when update target does not exist but still logs attempted update', async () => {
      calcTemplate.findByIdAndUpdate.mockResolvedValue(null);

      const result = await updateCalcTemplate('missing', { name: 'x' });

      expect(result).toBeNull();
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'CalcTemplate', 'missing');
    });

    test('propagates update errors and does not log', async () => {
      calcTemplate.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateCalcTemplate('t1', { name: 'x' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteCalcTemplate', () => {
    test('throws when template is used by result group', async () => {
      resultGroup.findOne.mockResolvedValue({ _id: 'g1', calcTemplate: 't1' });
      resultGenerator.findOne.mockResolvedValue(null);

      await expect(deleteCalcTemplate('t1')).rejects.toThrow(
        'Cannot delete calculation template as it is in use by a result group or generator.'
      );

      expect(calcTemplate.findByIdAndDelete).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('throws when template is used by result generator', async () => {
      resultGroup.findOne.mockResolvedValue(null);
      resultGenerator.findOne.mockResolvedValue({ _id: 'rg1', calcSchemaTemplate: 't1' });

      await expect(deleteCalcTemplate('t1')).rejects.toThrow(
        'Cannot delete calculation template as it is in use by a result group or generator.'
      );

      expect(calcTemplate.findByIdAndDelete).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('deletes template and logs when not used', async () => {
      resultGroup.findOne.mockResolvedValue(null);
      resultGenerator.findOne.mockResolvedValue(null);
      calcTemplate.findByIdAndDelete.mockResolvedValue({ _id: 't1' });

      const result = await deleteCalcTemplate('t1');

      expect(resultGroup.findOne).toHaveBeenCalledWith({ calcTemplate: 't1' });
      expect(resultGenerator.findOne).toHaveBeenCalledWith({ calcSchemaTemplate: 't1' });
      expect(calcTemplate.findByIdAndDelete).toHaveBeenCalledWith('t1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'CalcTemplate', 't1');
      expect(result).toBeUndefined();
    });

    test('propagates delete errors and does not log', async () => {
      resultGroup.findOne.mockResolvedValue(null);
      resultGenerator.findOne.mockResolvedValue(null);
      calcTemplate.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteCalcTemplate('t1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getCalcTemplateFormData', () => {
    test('returns form data with categories', async () => {
      const categories = [{ _id: 'c1', name: 'Cat A' }];
      Category.find.mockResolvedValue(categories);

      const result = await getCalcTemplateFormData();

      expect(Category.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ categories });
    });

    test('propagates category query errors', async () => {
      Category.find.mockRejectedValue(new Error('category query failed'));

      await expect(getCalcTemplateFormData()).rejects.toThrow('category query failed');
    });
  });
});

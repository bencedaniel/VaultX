import {
  deleteImageFile,
  parseJSONArrayField,
  getAllScoreSheetTemplates,
  getScoreSheetTemplateById,
  getAllCategories,
  getCategoriesByIds,
  createScoreSheetTemplate,
  updateScoreSheetTemplate,
  deleteScoreSheetTemplate,
  validateCategoriesAgegroup
} from '../../DataServices/scoreSheetTemplateData.js';
import ScoreSheetTemp from '../../models/ScoreSheetTemp.js';
import Category from '../../models/Category.js';
import fs from 'fs/promises';
import {
  logDb,
  logValidation,
  logWarn,
  logInfo
} from '../../logger.js';

jest.mock('../../models/ScoreSheetTemp.js', () => {
  const ScoreSheetTempMock = jest.fn();
  ScoreSheetTempMock.find = jest.fn();
  ScoreSheetTempMock.findById = jest.fn();
  ScoreSheetTempMock.findByIdAndUpdate = jest.fn();
  ScoreSheetTempMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: ScoreSheetTempMock
  };
});

jest.mock('../../models/Category.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    unlink: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  },
  logDb: jest.fn(),
  logValidation: jest.fn(),
  logWarn: jest.fn(),
  logInfo: jest.fn()
}));

describe('scoreSheetTemplateData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteImageFile', () => {
    test('skips delete when path is not under /static/uploads', async () => {
      await deleteImageFile('/foo/bar.png');

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(logWarn).toHaveBeenCalledWith('DELETE_IMAGE', 'Skip delete (not static uploads): /foo/bar.png');
    });

    test('skips delete when resolved path escapes uploads directory', async () => {
      await deleteImageFile('/static/uploads/../outside.png');

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(logWarn).toHaveBeenCalledWith(
        'DELETE_IMAGE',
        expect.stringContaining('Skip delete (outside uploads):')
      );
    });

    test('deletes file and logs info for valid uploads path', async () => {
      fs.unlink.mockResolvedValue(undefined);

      await deleteImageFile('/static/uploads/image.png');

      expect(fs.unlink).toHaveBeenCalledTimes(1);
      expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('Deleted file:'));
    });

    test('logs warning when delete fails', async () => {
      fs.unlink.mockRejectedValue(new Error('no such file'));

      await deleteImageFile('/static/uploads/image.png');

      expect(logWarn).toHaveBeenCalledWith(
        'DELETE_IMAGE_FAILED',
        expect.stringContaining('Delete failed or file missing:'),
        'no such file'
      );
    });
  });

  describe('parseJSONArrayField', () => {
    test('returns empty array for falsy input', () => {
      expect(parseJSONArrayField('', 'fields')).toEqual([]);
      expect(parseJSONArrayField(null, 'fields')).toEqual([]);
      expect(parseJSONArrayField(undefined, 'fields')).toEqual([]);
    });

    test('returns the same array when input is already array', () => {
      const arr = [{ name: 'x' }];

      const result = parseJSONArrayField(arr, 'fields');

      expect(result).toBe(arr);
    });

    test('parses JSON array and maps width into position.w', () => {
      const input = JSON.stringify([
        {
          key: 'A',
          width: 150,
          position: { x: 10, y: 20 }
        }
      ]);

      const result = parseJSONArrayField(input, 'fields');

      expect(result).toEqual([
        {
          key: 'A',
          width: 150,
          position: { x: 10, y: 20, w: 150 }
        }
      ]);
    });

    test('throws and logs validation error for invalid JSON', () => {
      expect(() => parseJSONArrayField('{invalid', 'fields')).toThrow('fields parse error:');
      expect(logValidation).toHaveBeenCalledWith(
        'JSON_PARSE_ERROR',
        'Field: fields',
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    test('throws and logs validation error when parsed value is not array', () => {
      expect(() => parseJSONArrayField(JSON.stringify({ a: 1 }), 'fields')).toThrow(
        'fields parse error: fields must be an array'
      );
      expect(logValidation).toHaveBeenCalledWith(
        'JSON_PARSE_ERROR',
        'Field: fields',
        expect.objectContaining({ error: 'fields must be an array' })
      );
    });
  });

  describe('getAllScoreSheetTemplates', () => {
    test('returns templates with populated category', async () => {
      const rows = [{ _id: 's1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      ScoreSheetTemp.find.mockReturnValue({ populate: populateMock });

      const result = await getAllScoreSheetTemplates();

      expect(ScoreSheetTemp.find).toHaveBeenCalledTimes(1);
      expect(populateMock).toHaveBeenCalledWith('CategoryId');
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getScoreSheetTemplateById', () => {
    test('returns template by id with populated category', async () => {
      const row = { _id: 's1' };
      const execMock = jest.fn().mockResolvedValue(row);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      ScoreSheetTemp.findById.mockReturnValue({ populate: populateMock });

      const result = await getScoreSheetTemplateById('s1');

      expect(ScoreSheetTemp.findById).toHaveBeenCalledWith('s1');
      expect(populateMock).toHaveBeenCalledWith('CategoryId');
      expect(result).toEqual(row);
    });
  });

  describe('getAllCategories', () => {
    test('returns categories sorted by Star', async () => {
      const rows = [{ _id: 'c1', Star: 1 }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const sortMock = jest.fn().mockReturnValue({ exec: execMock });
      Category.find.mockReturnValue({ sort: sortMock });

      const result = await getAllCategories();

      expect(Category.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ Star: 1 });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getCategoriesByIds', () => {
    test('returns categories by ids', async () => {
      const rows = [{ _id: 'c1' }, { _id: 'c2' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      Category.find.mockReturnValue({ exec: execMock });

      const result = await getCategoriesByIds(['c1', 'c2']);

      expect(Category.find).toHaveBeenCalledWith({ _id: { $in: ['c1', 'c2'] } });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('createScoreSheetTemplate', () => {
    test('creates, saves and logs template', async () => {
      const payload = { name: 'Template A' };
      const created = {
        _id: 's1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      ScoreSheetTemp.mockImplementation(() => created);

      const result = await createScoreSheetTemplate(payload);

      expect(ScoreSheetTemp).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'ScoreSheetTemplate', 's1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 's1',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      ScoreSheetTemp.mockImplementation(() => created);

      await expect(createScoreSheetTemplate({ name: 'x' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateScoreSheetTemplate', () => {
    test('updates template and logs', async () => {
      const updated = { _id: 's1', name: 'Updated' };
      const execMock = jest.fn().mockResolvedValue(updated);
      ScoreSheetTemp.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await updateScoreSheetTemplate('s1', { name: 'Updated' });

      expect(ScoreSheetTemp.findByIdAndUpdate).toHaveBeenCalledWith(
        's1',
        { name: 'Updated' },
        { runValidators: true, new: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'ScoreSheetTemplate', 's1');
      expect(result).toEqual(updated);
    });

    test('propagates update errors and does not log', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('update failed'));
      ScoreSheetTemp.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      await expect(updateScoreSheetTemplate('s1', { name: 'x' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteScoreSheetTemplate', () => {
    test('deletes template, removes bgImage file and logs', async () => {
      fs.unlink.mockResolvedValue(undefined);
      const execMock = jest.fn().mockResolvedValue({ _id: 's1', bgImage: '/static/uploads/bg.png' });
      ScoreSheetTemp.findByIdAndDelete.mockReturnValue({ exec: execMock });

      const result = await deleteScoreSheetTemplate('s1');

      expect(ScoreSheetTemp.findByIdAndDelete).toHaveBeenCalledWith('s1');
      expect(fs.unlink).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('DELETE', 'ScoreSheetTemplate', 's1');
      expect(result).toEqual({ _id: 's1', bgImage: '/static/uploads/bg.png' });
    });

    test('deletes template without bgImage and logs', async () => {
      const execMock = jest.fn().mockResolvedValue({ _id: 's1', bgImage: null });
      ScoreSheetTemp.findByIdAndDelete.mockReturnValue({ exec: execMock });

      const result = await deleteScoreSheetTemplate('s1');

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(logDb).toHaveBeenCalledWith('DELETE', 'ScoreSheetTemplate', 's1');
      expect(result).toEqual({ _id: 's1', bgImage: null });
    });

    test('handles null deleted sheet and still logs delete action', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      ScoreSheetTemp.findByIdAndDelete.mockReturnValue({ exec: execMock });

      const result = await deleteScoreSheetTemplate('missing');

      expect(fs.unlink).not.toHaveBeenCalled();
      expect(logDb).toHaveBeenCalledWith('DELETE', 'ScoreSheetTemplate', 'missing');
      expect(result).toBeNull();
    });
  });

  describe('validateCategoriesAgegroup', () => {
    test('throws when categories is empty', () => {
      expect(() => validateCategoriesAgegroup([])).toThrow('Selected category does not exist');
    });

    test('returns true when all categories have same type', () => {
      const categories = [
        { Type: 'Junior', CategoryDispName: 'Cat A' },
        { Type: 'Junior', CategoryDispName: 'Cat B' }
      ];

      const result = validateCategoriesAgegroup(categories);

      expect(result).toBe(true);
    });

    test('throws with mismatched category names when agegroup types differ', () => {
      const categories = [
        { Type: 'Junior', CategoryDispName: 'Cat A' },
        { Type: 'Senior', CategoryDispName: 'Cat B' },
        { Type: 'Senior', CategoryDispName: 'Cat C' }
      ];

      expect(() => validateCategoriesAgegroup(categories)).toThrow(
        'Selected categories must be of the same Agegroup type. Mismatched: Cat B, Cat C'
      );
    });
  });
});

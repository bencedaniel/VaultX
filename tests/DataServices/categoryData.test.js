import {
  getAllCategories,
  getAllCategoriesByStar,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryFormData
} from '../../DataServices/categoryData.js';
import Category from '../../models/Category.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Category.js', () => {
  const CategoryMock = jest.fn();
  CategoryMock.find = jest.fn();
  CategoryMock.findById = jest.fn();
  CategoryMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: CategoryMock
  };
});

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn()
  }
}));

describe('categoryData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    test('returns categories sorted by name', async () => {
      const categories = [{ _id: 'c1', name: 'A' }];
      const sortMock = jest.fn().mockResolvedValue(categories);
      Category.find.mockReturnValue({ sort: sortMock });

      const result = await getAllCategories();

      expect(Category.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(categories);
    });

    test('propagates sorting errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('sort failed'));
      Category.find.mockReturnValue({ sort: sortMock });

      await expect(getAllCategories()).rejects.toThrow('sort failed');
    });
  });

  describe('getAllCategoriesByStar', () => {
    test('returns categories sorted by star', async () => {
      const categories = [{ _id: 'c1', Star: 1 }];
      const sortMock = jest.fn().mockResolvedValue(categories);
      Category.find.mockReturnValue({ sort: sortMock });

      const result = await getAllCategoriesByStar();

      expect(Category.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ Star: 1 });
      expect(result).toEqual(categories);
    });

    test('propagates star sort errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('star sort failed'));
      Category.find.mockReturnValue({ sort: sortMock });

      await expect(getAllCategoriesByStar()).rejects.toThrow('star sort failed');
    });
  });

  describe('getCategoryById', () => {
    test('returns category by id when it exists', async () => {
      const category = { _id: 'c1', CategoryDispName: 'Junior' };
      Category.findById.mockResolvedValue(category);

      const result = await getCategoryById('c1');

      expect(Category.findById).toHaveBeenCalledWith('c1');
      expect(result).toEqual(category);
    });

    test('throws when category is not found', async () => {
      Category.findById.mockResolvedValue(null);

      await expect(getCategoryById('missing')).rejects.toThrow('Category not found');
    });
  });

  describe('createCategory', () => {
    test('creates, saves and logs new category', async () => {
      const input = {
        CategoryDispName: 'Senior',
        Star: 3
      };
      const created = {
        ...input,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Category.mockImplementation(() => created);

      const result = await createCategory(input);

      expect(Category).toHaveBeenCalledWith(input);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Category', 'Senior');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const input = {
        CategoryDispName: 'Senior',
        Star: 3
      };
      const created = {
        ...input,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Category.mockImplementation(() => created);

      await expect(createCategory(input)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    test('deletes old category, recreates updated one and logs update', async () => {
      const oldCategory = { _id: 'c1', CategoryDispName: 'Old Name', Star: 1 };
      const input = { CategoryDispName: 'New Name', Star: 2 };
      const recreated = {
        _id: 'c1',
        CategoryDispName: 'New Name',
        Star: 2,
        save: jest.fn().mockResolvedValue(undefined)
      };

      Category.findById.mockResolvedValue(oldCategory);
      Category.findByIdAndDelete.mockResolvedValue(oldCategory);
      Category.mockImplementation(() => recreated);

      const result = await updateCategory('c1', input);

      expect(Category.findById).toHaveBeenCalledWith('c1');
      expect(Category.findByIdAndDelete).toHaveBeenCalledWith('c1');
      expect(Category).toHaveBeenCalledWith({
        CategoryDispName: 'New Name',
        Star: 2,
        _id: 'c1'
      });
      expect(recreated.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Category', 'New Name');
      expect(result).toBe(recreated);
    });

    test('throws when old category is not found', async () => {
      Category.findById.mockResolvedValue(null);

      await expect(
        updateCategory('missing', { CategoryDispName: 'X', Star: 1 })
      ).rejects.toThrow('Category not found');

      expect(Category.findByIdAndDelete).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates delete errors during update flow', async () => {
      Category.findById.mockResolvedValue({ _id: 'c1' });
      Category.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(
        updateCategory('c1', { CategoryDispName: 'X', Star: 1 })
      ).rejects.toThrow('delete failed');

      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates recreate save errors during update flow', async () => {
      Category.findById.mockResolvedValue({ _id: 'c1' });
      Category.findByIdAndDelete.mockResolvedValue({ _id: 'c1' });
      const recreated = {
        _id: 'c1',
        CategoryDispName: 'X',
        Star: 1,
        save: jest.fn().mockRejectedValue(new Error('recreate failed'))
      };
      Category.mockImplementation(() => recreated);

      await expect(
        updateCategory('c1', { CategoryDispName: 'X', Star: 1 })
      ).rejects.toThrow('recreate failed');

      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    test('deletes category and logs deletion', async () => {
      const deleted = { _id: 'c1', CategoryDispName: 'Delete Me' };
      Category.findByIdAndDelete.mockResolvedValue(deleted);

      const result = await deleteCategory('c1');

      expect(Category.findByIdAndDelete).toHaveBeenCalledWith('c1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'Category', 'Delete Me');
      expect(result).toEqual(deleted);
    });

    test('throws when deleting non-existing category', async () => {
      Category.findByIdAndDelete.mockResolvedValue(null);

      await expect(deleteCategory('missing')).rejects.toThrow('Category not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates delete errors', async () => {
      Category.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteCategory('c1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getCategoryFormData', () => {
    test('returns empty form data object', async () => {
      const result = await getCategoryFormData();

      expect(result).toEqual({});
    });
  });
});

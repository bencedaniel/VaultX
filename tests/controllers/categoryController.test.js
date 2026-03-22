// tests/controllers/categoryController.test.js - Category Controller Unit Tests
import categoryController from '../../controllers/categoryController.js';
import * as categoryData from '../../DataServices/categoryData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/categoryData.js');
jest.mock('../../logger.js');

describe('Category Controller - Unit Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    fullname: 'Test User',
    role: {
      _id: 'role1',
      name: 'Admin',
      permissions: ['view', 'create', 'edit', 'delete']
    }
  };

  const mockCategory = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Vaulting',
    CategoryDispName: 'Vaulting',
    description: 'Vaulting category'
  };

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      session: {
        formData: null,
        failMessage: null,
        successMessage: null
      },
      user: JSON.parse(JSON.stringify(mockUser))
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getNewCategoryForm', () => {
    
    test('should render newCategory form successfully', async () => {
      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          formData: null,
          rolePermissons: mockUser.role.permissions,
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should pass existing formData to form', async () => {
      req.session.formData = { name: 'Test Category' };

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          formData: { name: 'Test Category' }
        })
      );
    });

    test('should pass failMessage from session', async () => {
      req.session.failMessage = 'Category name already exists';

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          failMessage: 'Category name already exists'
        })
      );
    });

    test('should pass successMessage from session', async () => {
      req.session.successMessage = 'Category created successfully';

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          successMessage: 'Category created successfully'
        })
      );
    });

    test('should clear failMessage after rendering', async () => {
      req.session.failMessage = 'Some error';

      await categoryController.getNewCategoryForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', async () => {
      req.session.successMessage = 'Some success';

      await categoryController.getNewCategoryForm(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });

    test('should handle optional user role permissions', async () => {
      req.user.role = null;

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should pass user context to form', async () => {
      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });
  });

  describe('createNewCategoryHandler', () => {
    
    test('should create new category successfully', async () => {
      req.body = {
        name: 'Vaulting',
        description: 'Vaulting category'
      };

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(categoryData.createCategory).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = {
        name: 'Vaulting',
        description: 'Vaulting category'
      };

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CATEGORY_CREATED);
    });

    test('should redirect to dashboard after creation', async () => {
      req.body = {
        name: 'Vaulting',
        description: 'Vaulting category'
      };

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/category/dashboard');
    });

    test('should handle category creation with special characters', async () => {
      req.body = {
        name: 'Vaulting & Dressage',
        description: 'Special category'
      };

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(categoryData.createCategory).toHaveBeenCalledWith(req.body);
    });

    test('should handle category creation with unicode characters', async () => {
      req.body = {
        name: 'Kategória',
        description: 'Unicode description'
      };

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(categoryData.createCategory).toHaveBeenCalledWith(req.body);
    });

    test('should handle database error during creation', async () => {
      const error = new Error('Database error');
      req.body = {
        name: 'Vaulting',
        description: 'Vaulting category'
      };

      categoryData.createCategory.mockRejectedValue(error);

      await expect(
        categoryController.createNewCategoryHandler(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle duplicate category name error', async () => {
      const error = new Error('Category name already exists');
      req.body = {
        name: 'Vaulting',
        description: 'Vaulting category'
      };

      categoryData.createCategory.mockRejectedValue(error);

      await expect(
        categoryController.createNewCategoryHandler(req, res, next)
      ).rejects.toThrow('Category name already exists');
    });

    test('should pass all form fields to DataServices', async () => {
      const categoryData_input = {
        name: 'Vaulting',
        description: 'Vaulting category',
        active: true
      };

      req.body = categoryData_input;

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(categoryData.createCategory).toHaveBeenCalledWith(categoryData_input);
    });

    test('should handle empty category data', async () => {
      req.body = {
        name: '',
        description: ''
      };

      const error = new Error('Validation error');
      categoryData.createCategory.mockRejectedValue(error);

      await expect(
        categoryController.createNewCategoryHandler(req, res, next)
      ).rejects.toThrow('Validation error');
    });
  });

  describe('getCategoriesDashboard', () => {
    
    test('should render categorydash with all categories', async () => {
      const categories = [mockCategory, { ...mockCategory, _id: 'id2', name: 'Dressage' }];

      categoryData.getAllCategories.mockResolvedValue(categories);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          categorys: categories
        })
      );
    });

    test('should render empty categories list', async () => {
      categoryData.getAllCategories.mockResolvedValue([]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          categorys: []
        })
      );
    });

    test('should pass role permissions to dashboard', async () => {
      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass failMessage to dashboard', async () => {
      req.session.failMessage = 'Failed to create category';

      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          failMessage: 'Failed to create category'
        })
      );
    });

    test('should pass successMessage to dashboard', async () => {
      req.session.successMessage = 'Category created successfully';

      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          successMessage: 'Category created successfully'
        })
      );
    });

    test('should clear failMessage after rendering', async () => {
      req.session.failMessage = 'Some error';

      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', async () => {
      req.session.successMessage = 'Some success';

      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass user context to dashboard', async () => {
      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should handle database error when fetching categories', async () => {
      const error = new Error('Database connection failed');

      categoryData.getAllCategories.mockRejectedValue(error);

      await expect(
        categoryController.getCategoriesDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle multiple categories correctly', async () => {
      const categories = [
        { ...mockCategory, _id: 'id1', name: 'Vaulting' },
        { ...mockCategory, _id: 'id2', name: 'Dressage' },
        { ...mockCategory, _id: 'id3', name: 'Jumping' }
      ];

      categoryData.getAllCategories.mockResolvedValue(categories);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          categorys: categories
        })
      );
    });
  });

  describe('getEditCategoryForm', () => {
    
    test('should render editCategory form with category data', async () => {
      req.params.id = 'category123';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/editCategory',
        expect.objectContaining({
          formData: mockCategory
        })
      );
    });

    test('should fetch category by ID from params', async () => {
      req.params.id = 'category123';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(categoryData.getCategoryById).toHaveBeenCalledWith('category123');
    });

    test('should pass role permissions to edit form', async () => {
      req.params.id = 'category123';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/editCategory',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass failMessage to edit form', async () => {
      req.params.id = 'category123';
      req.session.failMessage = 'Failed to update category';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/editCategory',
        expect.objectContaining({
          failMessage: 'Failed to update category'
        })
      );
    });

    test('should pass successMessage to edit form', async () => {
      req.params.id = 'category123';
      req.session.successMessage = 'Category updated successfully';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/editCategory',
        expect.objectContaining({
          successMessage: 'Category updated successfully'
        })
      );
    });

    test('should clear failMessage after rendering', async () => {
      req.params.id = 'category123';
      req.session.failMessage = 'Some error';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', async () => {
      req.params.id = 'category123';
      req.session.successMessage = 'Some success';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass user context to edit form', async () => {
      req.params.id = 'category123';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/editCategory',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should handle category not found error', async () => {
      req.params.id = 'nonexistent';

      categoryData.getCategoryById.mockResolvedValue(null);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/editCategory',
        expect.objectContaining({
          formData: null
        })
      );
    });

    test('should handle database error during fetch', async () => {
      const error = new Error('Database error');
      req.params.id = 'category123';

      categoryData.getCategoryById.mockRejectedValue(error);

      await expect(
        categoryController.getEditCategoryForm(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateCategoryHandler', () => {
    
    test('should update category successfully', async () => {
      req.params.id = 'category123';
      req.body = {
        name: 'Updated Vaulting',
        description: 'Updated description'
      };

      categoryData.updateCategory.mockResolvedValue(mockCategory);

      await categoryController.updateCategoryHandler(req, res, next);

      expect(categoryData.updateCategory).toHaveBeenCalledWith('category123', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = 'category123';
      req.body = {
        name: 'Updated Vaulting',
        description: 'Updated description'
      };

      categoryData.updateCategory.mockResolvedValue(mockCategory);

      await categoryController.updateCategoryHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CATEGORY_UPDATED);
    });

    test('should redirect to dashboard after update', async () => {
      req.params.id = 'category123';
      req.body = {
        name: 'Updated Vaulting',
        description: 'Updated description'
      };

      categoryData.updateCategory.mockResolvedValue(mockCategory);

      await categoryController.updateCategoryHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/category/dashboard');
    });

    test('should handle partial category update', async () => {
      req.params.id = 'category123';
      req.body = {
        name: 'Updated Vaulting'
      };

      categoryData.updateCategory.mockResolvedValue(mockCategory);

      await categoryController.updateCategoryHandler(req, res, next);

      expect(categoryData.updateCategory).toHaveBeenCalledWith('category123', req.body);
    });

    test('should use CategoryDispName for logging', async () => {
      req.params.id = 'category123';
      req.body = {
        name: 'Updated Vaulting',
        description: 'Updated description'
      };

      const updatedCategory = {
        ...mockCategory,
        CategoryDispName: 'Updated Vaulting'
      };

      categoryData.updateCategory.mockResolvedValue(updatedCategory);

      await categoryController.updateCategoryHandler(req, res, next);

      expect(categoryData.updateCategory).toHaveBeenCalledWith('category123', req.body);
    });

    test('should handle database error during update', async () => {
      const error = new Error('Database error');
      req.params.id = 'category123';
      req.body = {
        name: 'Updated Vaulting',
        description: 'Updated description'
      };

      categoryData.updateCategory.mockRejectedValue(error);

      await expect(
        categoryController.updateCategoryHandler(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle category not found error', async () => {
      const error = new Error('Category not found');
      req.params.id = 'nonexistent';
      req.body = {
        name: 'Updated Vaulting',
        description: 'Updated description'
      };

      categoryData.updateCategory.mockRejectedValue(error);

      await expect(
        categoryController.updateCategoryHandler(req, res, next)
      ).rejects.toThrow('Category not found');
    });

    test('should handle duplicate name error during update', async () => {
      const error = new Error('Category name already exists');
      req.params.id = 'category123';
      req.body = {
        name: 'Existing Category Name',
        description: 'Updated description'
      };

      categoryData.updateCategory.mockRejectedValue(error);

      await expect(
        categoryController.updateCategoryHandler(req, res, next)
      ).rejects.toThrow('Category name already exists');
    });
  });

  describe('deleteCategoryHandler', () => {
    
    test('should delete category successfully', async () => {
      req.params.id = 'category123';

      categoryData.deleteCategory.mockResolvedValue(mockCategory);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(categoryData.deleteCategory).toHaveBeenCalledWith('category123');
    });

    test('should return success message when category deleted', async () => {
      req.params.id = 'category123';

      categoryData.deleteCategory.mockResolvedValue(mockCategory);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.CATEGORY_DELETED
      });
    });

    test('should return OK status after deletion', async () => {
      req.params.id = 'category123';

      categoryData.deleteCategory.mockResolvedValue(mockCategory);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should handle category not found error', async () => {
      req.params.id = 'nonexistent';

      categoryData.deleteCategory.mockResolvedValue(null);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.CATEGORY_NOT_FOUND);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.ERROR.CATEGORY_NOT_FOUND
      });
    });

    test('should return NOT_FOUND status when category not found', async () => {
      req.params.id = 'nonexistent';

      categoryData.deleteCategory.mockResolvedValue(null);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });

    test('should set fail message when category not found', async () => {
      req.params.id = 'nonexistent';

      categoryData.deleteCategory.mockResolvedValue(null);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.CATEGORY_NOT_FOUND);
    });

    test('should handle database error during deletion', async () => {
      const error = new Error('Database error');
      req.params.id = 'category123';

      categoryData.deleteCategory.mockRejectedValue(error);

      await expect(
        categoryController.deleteCategoryHandler(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle category with associated data', async () => {
      const error = new Error('Cannot delete category with associated data');
      req.params.id = 'category123';

      categoryData.deleteCategory.mockRejectedValue(error);

      await expect(
        categoryController.deleteCategoryHandler(req, res, next)
      ).rejects.toThrow('Cannot delete category with associated data');
    });

    test('should use deleted category name for logging', async () => {
      req.params.id = 'category123';

      categoryData.deleteCategory.mockResolvedValue(mockCategory);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(categoryData.deleteCategory).toHaveBeenCalledWith('category123');
    });

    test('should return JSON response after deletion', async () => {
      req.params.id = 'category123';

      categoryData.deleteCategory.mockResolvedValue(mockCategory);

      await categoryController.deleteCategoryHandler(req, res, next);

      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle async errors in form rendering', async () => {
      const error = new Error('Render error');

      res.render.mockImplementation(() => {
        throw error;
      });

      req.params.id = 'category123';
      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await expect(
        categoryController.getEditCategoryForm(req, res, next)
      ).rejects.toThrow('Render error');
    });

    test('should handle null user in permission checks', async () => {
      req.user = null;

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing role in user', async () => {
      req.user = { username: 'testuser' };

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing permissions in role', async () => {
      req.user.role = { name: 'User' };

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle malformed ID parameter', async () => {
      const error = new Error('Invalid ID format');
      req.params.id = 'invalid-id-format';

      categoryData.getCategoryById.mockRejectedValue(error);

      await expect(
        categoryController.getEditCategoryForm(req, res, next)
      ).rejects.toThrow('Invalid ID format');
    });

    test('should handle network timeout during create', async () => {
      const error = new Error('Network timeout');
      req.body = { name: 'Vaulting', description: 'Test' };

      categoryData.createCategory.mockRejectedValue(error);

      await expect(
        categoryController.createNewCategoryHandler(req, res, next)
      ).rejects.toThrow('Network timeout');
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should preserve user context across operations', async () => {
      const customUser = { ...mockUser, username: 'customuser' };
      req.user = customUser;

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          user: customUser
        })
      );
    });

    test('should include role permissions for admin users', async () => {
      req.user.role.permissions = ['create', 'view', 'edit', 'delete'];

      await categoryController.getNewCategoryForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/newCategory',
        expect.objectContaining({
          rolePermissons: ['create', 'view', 'edit', 'delete']
        })
      );
    });

    test('should handle users with limited permissions', async () => {
      req.user.role.permissions = ['view'];

      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          rolePermissons: ['view']
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should call getAllCategories from DataServices', async () => {
      categoryData.getAllCategories.mockResolvedValue([mockCategory]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(categoryData.getAllCategories).toHaveBeenCalled();
    });

    test('should verify DataServices receives correct parameters', async () => {
      req.params.id = 'category123';

      categoryData.getCategoryById.mockResolvedValue(mockCategory);

      await categoryController.getEditCategoryForm(req, res, next);

      expect(categoryData.getCategoryById).toHaveBeenCalledWith('category123');
    });

    test('should pass complete request body to createCategory', async () => {
      const categoryBody = {
        name: 'Vaulting',
        description: 'Test Category',
        active: true
      };

      req.body = categoryBody;

      categoryData.createCategory.mockResolvedValue(mockCategory);

      await categoryController.createNewCategoryHandler(req, res, next);

      expect(categoryData.createCategory).toHaveBeenCalledWith(categoryBody);
    });

    test('should use returned category object from DataServices', async () => {
      const returnedCategory = { ...mockCategory, name: 'Updated' };
      req.params.id = 'category123';
      req.body = { name: 'Updated' };

      categoryData.updateCategory.mockResolvedValue(returnedCategory);

      await categoryController.updateCategoryHandler(req, res, next);

      expect(categoryData.updateCategory).toHaveBeenCalled();
    });

    test('should handle empty response from getAllCategories', async () => {
      categoryData.getAllCategories.mockResolvedValue([]);

      await categoryController.getCategoriesDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'category/categorydash',
        expect.objectContaining({
          categorys: []
        })
      );
    });
  });

  describe('Session Management', () => {
    
    test('should preserve session data structure', async () => {
      req.session = {
        formData: { name: 'test' },
        failMessage: 'error',
        successMessage: null
      };

      await categoryController.getNewCategoryForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should not clear session on error responses', async () => {
      const error = new Error('Database error');
      req.params.id = 'category123';
      req.session.failMessage = 'Previous error';

      categoryData.getCategoryById.mockRejectedValue(error);

      await expect(
        categoryController.getEditCategoryForm(req, res, next)
      ).rejects.toThrow('Database error');

      // Session should remain unchanged on error
      expect(req.session.failMessage).toBe('Previous error');
    });
  });

});

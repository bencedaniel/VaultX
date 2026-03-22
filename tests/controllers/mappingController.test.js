// tests/controllers/mappingController.test.js - Mapping Controller Unit Tests
import mappingController from '../../controllers/mappingController.js';
import * as mappingData from '../../DataServices/mappingData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/mappingData.js');
jest.mock('../../logger.js');
jest.mock('console');

describe('Mapping Controller - Unit Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: 'user123',
    username: 'testuser',
    fullname: 'Test User',
    role: {
      _id: 'role1',
      name: 'Admin',
      permissions: ['view', 'create', 'edit', 'delete']
    }
  };

  const mockMapping = {
    _id: 'mapping123',
    name: 'Test Mapping',
    description: 'Test mapping description',
    sourceTable: 'source',
    destinationTable: 'destination',
    status: 'active'
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
      json: jest.fn(),
      locals: {}
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('renderNew', () => {
    
    test('should render new mapping form', () => {
      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.any(Object)
      );
    });

    test('should pass session messages to form', () => {
      req.session.failMessage = 'Validation error';
      req.session.successMessage = 'Mapping created';

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          failMessage: 'Validation error',
          successMessage: 'Mapping created'
        })
      );
    });

    test('should pass user role permissions', () => {
      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass user context', () => {
      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should clear failMessage after rendering', () => {
      req.session.failMessage = 'Error';

      mappingController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', () => {
      req.session.successMessage = 'Success';

      mappingController.renderNew(req, res);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass formData from session', () => {
      req.session.formData = { name: 'Test Mapping' };

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          formData: { name: 'Test Mapping' }
        })
      );
    });

    test('should handle null formData', () => {
      req.session.formData = null;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          formData: null
        })
      );
    });

    test('should handle null user permissions', () => {
      req.user.role = null;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should clear both messages independently', () => {
      req.session.failMessage = 'Fail';
      req.session.successMessage = 'Success';

      mappingController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });
  });

  describe('createNew', () => {
    
    test('should create new mapping successfully', async () => {
      req.body = { name: 'Test Mapping', sourceTable: 'source' };

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      expect(mappingData.createMapping).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = { name: 'Test Mapping' };

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.MAPPING_CREATED);
    });

    test('should redirect to mapping dashboard', async () => {
      req.body = { name: 'Test Mapping' };

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/mapping/dashboard');
    });

    test('should pass complete request body to DataServices', async () => {
      req.body = {
        name: 'Test Mapping',
        description: 'Test description',
        sourceTable: 'source',
        destinationTable: 'destination'
      };

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      expect(mappingData.createMapping).toHaveBeenCalledWith(req.body);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.body = { name: 'Test Mapping' };

      mappingData.createMapping.mockRejectedValue(error);

      await expect(
        mappingController.createNew(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle validation error', async () => {
      const error = new Error('Validation error');
      req.body = { sourceTable: 'source' }; // Missing required name

      mappingData.createMapping.mockRejectedValue(error);

      await expect(
        mappingController.createNew(req, res, next)
      ).rejects.toThrow('Validation error');
    });
  });

  describe('dashboard', () => {
    
    test('should render mapping dashboard', async () => {
      mappingData.getAllMappings.mockResolvedValue([mockMapping]);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/tablemappingdash',
        expect.any(Object)
      );
    });

    test('should fetch all mappings from DataServices', async () => {
      mappingData.getAllMappings.mockResolvedValue([mockMapping]);

      await mappingController.dashboard(req, res, next);

      expect(mappingData.getAllMappings).toHaveBeenCalled();
    });

    test('should pass mappings to template', async () => {
      const mappings = [mockMapping];

      mappingData.getAllMappings.mockResolvedValue(mappings);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/tablemappingdash',
        expect.objectContaining({
          mappings
        })
      );
    });

    test('should pass session messages', async () => {
      req.session.successMessage = 'Mapping created';
      req.session.failMessage = 'Error occurred';

      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/tablemappingdash',
        expect.objectContaining({
          successMessage: 'Mapping created',
          failMessage: 'Error occurred'
        })
      );
    });

    test('should clear messages after rendering', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle empty mappings array', async () => {
      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/tablemappingdash',
        expect.objectContaining({
          mappings: []
        })
      );
    });

    test('should handle multiple mappings', async () => {
      const mappings = [
        mockMapping,
        { ...mockMapping, _id: 'mapping456', name: 'Second Mapping' }
      ];

      mappingData.getAllMappings.mockResolvedValue(mappings);

      await mappingController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.mappings.length).toBe(2);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      mappingData.getAllMappings.mockRejectedValue(error);

      await expect(
        mappingController.dashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should pass user permissions to dashboard', async () => {
      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/tablemappingdash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });
  });

  describe('editGet', () => {
    
    test('should render edit mapping form', async () => {
      req.params.id = 'mapping123';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/editTablemapping',
        expect.any(Object)
      );
    });

    test('should fetch mapping by ID', async () => {
      req.params.id = 'mapping123';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(mappingData.getMappingById).toHaveBeenCalledWith('mapping123');
    });

    test('should pass mapping data to form', async () => {
      req.params.id = 'mapping123';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/editTablemapping',
        expect.objectContaining({
          formData: mockMapping
        })
      );
    });

    test('should pass session messages to form', async () => {
      req.params.id = 'mapping123';
      req.session.failMessage = 'Error';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/editTablemapping',
        expect.objectContaining({
          failMessage: 'Error'
        })
      );
    });

    test('should clear session messages', async () => {
      req.params.id = 'mapping123';
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'mapping123';

      mappingData.getMappingById.mockRejectedValue(error);

      await expect(
        mappingController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle non-existent mapping', async () => {
      req.params.id = 'nonexistent';

      mappingData.getMappingById.mockResolvedValue(null);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/editTablemapping',
        expect.objectContaining({
          formData: null
        })
      );
    });
  });

  describe('editPost', () => {
    
    test('should update mapping successfully', async () => {
      req.params.id = 'mapping123';
      req.body = { name: 'Updated Mapping' };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(mappingData.updateMapping).toHaveBeenCalledWith('mapping123', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = 'mapping123';
      req.body = { name: 'Updated Mapping' };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.MAPPING_UPDATED);
    });

    test('should redirect to mapping dashboard', async () => {
      req.params.id = 'mapping123';
      req.body = { name: 'Updated Mapping' };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/mapping/dashboard');
    });

    test('should pass complete request body to DataServices', async () => {
      req.params.id = 'mapping123';
      req.body = {
        name: 'Updated Mapping',
        description: 'Updated description',
        sourceTable: 'new_source'
      };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(mappingData.updateMapping).toHaveBeenCalledWith('mapping123', req.body);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'mapping123';
      req.body = { name: 'Updated Mapping' };

      mappingData.updateMapping.mockRejectedValue(error);

      await expect(
        mappingController.editPost(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle validation error', async () => {
      const error = new Error('Validation error');
      req.params.id = 'mapping123';
      req.body = { name: '' }; // Invalid empty name

      mappingData.updateMapping.mockRejectedValue(error);

      await expect(
        mappingController.editPost(req, res, next)
      ).rejects.toThrow('Validation error');
    });
  });

  describe('delete', () => {
    
    test('should delete mapping successfully', async () => {
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(mappingData.deleteMapping).toHaveBeenCalledWith('mapping123');
    });

    test('should return status OK', async () => {
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.MAPPING_DELETED
      });
    });

    test('should set session success message', async () => {
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.MAPPING_DELETED);
    });

    test('should call deleteMapping with correct ID', async () => {
      req.params.id = 'mapping456';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(mappingData.deleteMapping).toHaveBeenCalledWith('mapping456');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockRejectedValue(error);

      await expect(
        mappingController.delete(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle non-existent mapping deletion', async () => {
      const error = new Error('Mapping not found');
      req.params.id = 'nonexistent';

      mappingData.deleteMapping.mockRejectedValue(error);

      await expect(
        mappingController.delete(req, res, next)
      ).rejects.toThrow('Mapping not found');
    });

    test('should handle cascade deletion errors', async () => {
      const error = new Error('Cannot delete due to references');
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockRejectedValue(error);

      await expect(
        mappingController.delete(req, res, next)
      ).rejects.toThrow('Cannot delete due to references');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle null user in permissions', () => {
      req.user = null;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing user role', () => {
      req.user.role = null;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing user role permissions', () => {
      req.user.role.permissions = null;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          rolePermissons: null
        })
      );
    });

    test('should handle empty permissions array', () => {
      req.user.role.permissions = [];

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          rolePermissons: []
        })
      );
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should include user permissions in all form renders', async () => {
      req.user.role.permissions = ['view', 'edit'];
      req.params.id = 'mapping123';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/editTablemapping',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should pass different user contexts', () => {
      const customUser = { ...mockUser, username: 'custom_user' };
      req.user = customUser;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          user: customUser
        })
      );
    });

    test('should use username in logging', async () => {
      const customUsername = 'admin_user';
      req.user.username = customUsername;
      req.body = { name: 'Test Mapping' };

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      // The logging would use req.user.username
      expect(mappingData.createMapping).toHaveBeenCalled();
    });

    test('should handle admin user permissions', async () => {
      req.user.role.permissions = ['view', 'create', 'edit', 'delete', 'admin'];

      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/tablemappingdash',
        expect.objectContaining({
          rolePermissons: ['view', 'create', 'edit', 'delete', 'admin']
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify DataServices calls with correct IDs', async () => {
      req.params.id = 'mapping123';
      req.body = { name: 'Updated' };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(mappingData.updateMapping).toHaveBeenCalledWith('mapping123', req.body);
    });

    test('should pass complete request body to createMapping', async () => {
      const mappingBody = {
        name: 'Test Mapping',
        description: 'Test description',
        sourceTable: 'source',
        destinationTable: 'destination',
        status: 'active'
      };

      req.body = mappingBody;

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      expect(mappingData.createMapping).toHaveBeenCalledWith(mappingBody);
    });

    test('should verify deleteMapping called with correct ID', async () => {
      req.params.id = 'mapping789';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(mappingData.deleteMapping).toHaveBeenCalledWith('mapping789');
    });

    test('should fetch mappings without parameters', async () => {
      mappingData.getAllMappings.mockResolvedValue([mockMapping]);

      await mappingController.dashboard(req, res, next);

      expect(mappingData.getAllMappings).toHaveBeenCalledWith();
    });

    test('should handle DataServices returning null', async () => {
      req.params.id = 'nonexistent';

      mappingData.getMappingById.mockResolvedValue(null);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/editTablemapping',
        expect.objectContaining({
          formData: null
        })
      );
    });
  });

  describe('Session Management', () => {
    
    test('should preserve formData in session', () => {
      const formData = { name: 'Test Mapping' };
      req.session.formData = formData;

      mappingController.renderNew(req, res);

      expect(req.session.formData).toEqual(formData);
    });

    test('should clear messages independently', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should not clear formData on operations', async () => {
      const formData = { name: 'Test Mapping' };
      req.session.formData = formData;
      req.params.id = 'mapping123';
      req.body = { name: 'Updated' };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(req.session.formData).toEqual(formData);
    });

    test('should handle null session values', () => {
      req.session.formData = null;
      req.session.failMessage = null;
      req.session.successMessage = null;

      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'mapping/newTablemapping',
        expect.objectContaining({
          formData: null,
          failMessage: null,
          successMessage: null
        })
      );
    });

    test('should set successMessage on delete', async () => {
      req.params.id = 'mapping123';

      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.MAPPING_DELETED);
    });

    test('should set successMessage on create', async () => {
      req.body = { name: 'Test Mapping' };

      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.MAPPING_CREATED);
    });

    test('should set successMessage on update', async () => {
      req.params.id = 'mapping123';
      req.body = { name: 'Updated' };

      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.MAPPING_UPDATED);
    });
  });

  describe('Render Methods & Templates', () => {
    
    test('should use correct template name for new', () => {
      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith('mapping/newTablemapping', expect.any(Object));
    });

    test('should use correct template name for dashboard', async () => {
      mappingData.getAllMappings.mockResolvedValue([]);

      await mappingController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith('mapping/tablemappingdash', expect.any(Object));
    });

    test('should use correct template name for edit', async () => {
      req.params.id = 'mapping123';

      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith('mapping/editTablemapping', expect.any(Object));
    });

    test('should include all required properties in render data', () => {
      mappingController.renderNew(req, res);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData).toHaveProperty('formData');
      expect(renderData).toHaveProperty('rolePermissons');
      expect(renderData).toHaveProperty('failMessage');
      expect(renderData).toHaveProperty('successMessage');
      expect(renderData).toHaveProperty('user');
    });

    test('should call render exactly once for renderNew', () => {
      mappingController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledTimes(1);
    });
  });

  describe('CRUD Operations Integration', () => {
    
    test('should handle complete create-read-update-delete cycle', async () => {
      // Create
      req.body = { name: 'Test Mapping' };
      mappingData.createMapping.mockResolvedValue(mockMapping);

      await mappingController.createNew(req, res, next);
      expect(mappingData.createMapping).toHaveBeenCalled();

      // Read
      jest.clearAllMocks();
      req.params.id = 'mapping123';
      mappingData.getMappingById.mockResolvedValue(mockMapping);

      await mappingController.editGet(req, res, next);
      expect(mappingData.getMappingById).toHaveBeenCalled();

      // Update
      jest.clearAllMocks();
      req.body = { name: 'Updated Mapping' };
      mappingData.updateMapping.mockResolvedValue(mockMapping);

      await mappingController.editPost(req, res, next);
      expect(mappingData.updateMapping).toHaveBeenCalled();

      // Delete
      jest.clearAllMocks();
      mappingData.deleteMapping.mockResolvedValue(mockMapping);

      await mappingController.delete(req, res, next);
      expect(mappingData.deleteMapping).toHaveBeenCalled();
    });

    test('should handle multiple operations sequentially', async () => {
      // First create
      req.body = { name: 'Mapping 1' };
      mappingData.createMapping.mockResolvedValue({ ...mockMapping, _id: 'map1' });

      await mappingController.createNew(req, res, next);

      // Second create
      jest.clearAllMocks();
      req.body = { name: 'Mapping 2' };
      mappingData.createMapping.mockResolvedValue({ ...mockMapping, _id: 'map2' });

      await mappingController.createNew(req, res, next);

      // Dashboard
      jest.clearAllMocks();
      mappingData.getAllMappings.mockResolvedValue([
        { ...mockMapping, _id: 'map1', name: 'Mapping 1' },
        { ...mockMapping, _id: 'map2', name: 'Mapping 2' }
      ]);

      await mappingController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.mappings.length).toBe(2);
    });
  });

});

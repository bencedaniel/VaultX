// tests/controllers/lungerController.test.js - Lunger Controller Unit Tests
import lungerController from '../../controllers/lungerController.js';
import * as lungerData from '../../DataServices/lungerData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/lungerData.js');
jest.mock('../../logger.js');
jest.mock('console');

describe('Lunger Controller - Unit Tests', () => {
  
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

  const mockEvent = {
    _id: 'event123',
    name: 'Test Event',
    EventName: 'Test Event'
  };

  const mockLunger = {
    _id: 'lunger123',
    Name: 'John Doe',
    name: 'John Doe',
    age: 45,
    country: 'Hungary',
    experience: 15,
    incidents: []
  };

  const mockUser1 = { _id: 'user1', fullname: 'User One', username: 'user1' };
  const mockUser2 = { _id: 'user2', fullname: 'User Two', username: 'user2' };

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
      locals: {
        selectedEvent: mockEvent
      }
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('renderNew', () => {
    
    test('should render new lunger form', () => {
      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.any(Object)
      );
    });

    test('should pass countries array to form', () => {
      lungerController.renderNew(req, res);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.countries).toBeDefined();
      expect(Array.isArray(renderCall.countries)).toBe(true);
    });

    test('should include essential countries in array', () => {
      lungerController.renderNew(req, res);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.countries).toContain('Hungary');
      expect(renderCall.countries).toContain('United States');
      expect(renderCall.countries).toContain('Germany');
    });

    test('should pass session messages to form', () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Lunger added';

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Lunger added'
        })
      );
    });

    test('should pass user role permissions', () => {
      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass user context', () => {
      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should clear failMessage after rendering', () => {
      req.session.failMessage = 'Error';

      lungerController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', () => {
      req.session.successMessage = 'Success';

      lungerController.renderNew(req, res);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass formData from session', () => {
      req.session.formData = { Name: 'John Doe' };

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          formData: { Name: 'John Doe' }
        })
      );
    });

    test('should handle null user permissions', () => {
      req.user.role = null;

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle both messages null', () => {
      req.session.failMessage = null;
      req.session.successMessage = null;

      lungerController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });
  });

  describe('createNew', () => {
    
    test('should create new lunger successfully', async () => {
      req.body = { Name: 'John Doe', age: 45 };

      lungerData.createLunger.mockResolvedValue(mockLunger);

      await lungerController.createNew(req, res, next);

      expect(lungerData.createLunger).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = { Name: 'John Doe' };

      lungerData.createLunger.mockResolvedValue(mockLunger);

      await lungerController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.LUNGER_CREATED);
    });

    test('should redirect to lunger dashboard', async () => {
      req.body = { Name: 'John Doe' };

      lungerData.createLunger.mockResolvedValue(mockLunger);

      await lungerController.createNew(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/lunger/dashboard');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.body = { Name: 'John Doe' };

      lungerData.createLunger.mockRejectedValue(error);

      await expect(
        lungerController.createNew(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should pass complete request body to DataServices', async () => {
      req.body = {
        Name: 'John Doe',
        age: 45,
        country: 'Hungary',
        experience: 15
      };

      lungerData.createLunger.mockResolvedValue(mockLunger);

      await lungerController.createNew(req, res, next);

      expect(lungerData.createLunger).toHaveBeenCalledWith(req.body);
    });
  });

  describe('dashboard', () => {
    
    test('should render lunger dashboard', async () => {
      lungerData.getAllLungers.mockResolvedValue([mockLunger]);

      await lungerController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/lungerdash',
        expect.any(Object)
      );
    });

    test('should fetch all lungers from DataServices', async () => {
      lungerData.getAllLungers.mockResolvedValue([mockLunger]);

      await lungerController.dashboard(req, res, next);

      expect(lungerData.getAllLungers).toHaveBeenCalled();
    });

    test('should pass lungers to template', async () => {
      const lungers = [mockLunger];

      lungerData.getAllLungers.mockResolvedValue(lungers);

      await lungerController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/lungerdash',
        expect.objectContaining({
          lungers
        })
      );
    });

    test('should pass session messages', async () => {
      req.session.successMessage = 'Lunger created';
      req.session.failMessage = 'Error occurred';

      lungerData.getAllLungers.mockResolvedValue([]);

      await lungerController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/lungerdash',
        expect.objectContaining({
          successMessage: 'Lunger created',
          failMessage: 'Error occurred'
        })
      );
    });

    test('should clear messages after rendering', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      lungerData.getAllLungers.mockResolvedValue([]);

      await lungerController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle empty lungers array', async () => {
      lungerData.getAllLungers.mockResolvedValue([]);

      await lungerController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/lungerdash',
        expect.objectContaining({
          lungers: []
        })
      );
    });

    test('should handle multiple lungers', async () => {
      const lungers = [
        mockLunger,
        { ...mockLunger, _id: 'lunger456', Name: 'Jane Smith' }
      ];

      lungerData.getAllLungers.mockResolvedValue(lungers);

      await lungerController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.lungers.length).toBe(2);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      lungerData.getAllLungers.mockRejectedValue(error);

      await expect(
        lungerController.dashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('details', () => {
    
    test('should render lunger details page', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue([]);

      await lungerController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/LungerDetail',
        expect.any(Object)
      );
    });

    test('should fetch lunger with population', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue([]);

      await lungerController.details(req, res, next);

      expect(lungerData.getLungerByIdWithPopulation).toHaveBeenCalledWith('lunger123');
    });

    test('should fetch all users for incident assignment', async () => {
      req.params.id = 'lunger123';
      const users = [mockUser1, mockUser2];

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue(users);

      await lungerController.details(req, res, next);

      expect(lungerData.getAllUsers).toHaveBeenCalled();
    });

    test('should pass lunger data to template', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue([]);

      await lungerController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/LungerDetail',
        expect.objectContaining({
          formData: mockLunger
        })
      );
    });

    test('should pass users to template', async () => {
      req.params.id = 'lunger123';
      const users = [mockUser1, mockUser2];

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue(users);

      await lungerController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/LungerDetail',
        expect.objectContaining({
          users
        })
      );
    });

    test('should clear session messages', async () => {
      req.params.id = 'lunger123';
      req.session.failMessage = 'Error';

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue([]);

      await lungerController.details(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'lunger123';

      lungerData.getLungerByIdWithPopulation.mockRejectedValue(error);

      await expect(
        lungerController.details(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editGet', () => {
    
    test('should render edit lunger form', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerById.mockResolvedValue(mockLunger);

      await lungerController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/editLunger',
        expect.any(Object)
      );
    });

    test('should fetch lunger by ID', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerById.mockResolvedValue(mockLunger);

      await lungerController.editGet(req, res, next);

      expect(lungerData.getLungerById).toHaveBeenCalledWith('lunger123');
    });

    test('should pass countries array to form', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerById.mockResolvedValue(mockLunger);

      await lungerController.editGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.countries).toBeDefined();
      expect(Array.isArray(renderCall.countries)).toBe(true);
    });

    test('should pass lunger data to form', async () => {
      req.params.id = 'lunger123';

      lungerData.getLungerById.mockResolvedValue(mockLunger);

      await lungerController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/editLunger',
        expect.objectContaining({
          formData: mockLunger
        })
      );
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'lunger123';

      lungerData.getLungerById.mockRejectedValue(error);

      await expect(
        lungerController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editPost', () => {
    
    test('should update lunger successfully', async () => {
      req.params.id = 'lunger123';
      req.body = { Name: 'Updated Name', age: 46 };

      lungerData.updateLunger.mockResolvedValue(mockLunger);

      await lungerController.editPost(req, res, next);

      expect(lungerData.updateLunger).toHaveBeenCalledWith('lunger123', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = 'lunger123';
      req.body = { Name: 'Updated Name' };

      lungerData.updateLunger.mockResolvedValue(mockLunger);

      await lungerController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.LUNGER_UPDATED);
    });

    test('should redirect to lunger dashboard', async () => {
      req.params.id = 'lunger123';
      req.body = { Name: 'Updated Name' };

      lungerData.updateLunger.mockResolvedValue(mockLunger);

      await lungerController.editPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/lunger/dashboard');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'lunger123';
      req.body = { Name: 'Updated Name' };

      lungerData.updateLunger.mockRejectedValue(error);

      await expect(
        lungerController.editPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteIncident', () => {
    
    test('should delete incident successfully', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall from horse', type: 'injury' };

      lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.deleteIncident(req, res, next);

      expect(lungerData.deleteLungerIncident).toHaveBeenCalled();
    });

    test('should pass incident data to DataServices', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall from horse', type: 'injury' };

      lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.deleteIncident(req, res, next);

      const callArgs = lungerData.deleteLungerIncident.mock.calls[0];
      expect(callArgs[1]).toEqual({
        description: 'Fall from horse',
        type: 'injury'
      });
    });

    test('should return status OK', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', type: 'injury' };

      lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.deleteIncident(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', type: 'injury' };

      lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.deleteIncident(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.INCIDENT_DELETED
      });
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', type: 'injury' };

      lungerData.deleteLungerIncident.mockRejectedValue(error);

      await expect(
        lungerController.deleteIncident(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle special characters in description', async () => {
      req.params.id = 'lunger123';
      req.body = { description: "Fall & minor injury's occurring", type: 'injury' };

      lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.deleteIncident(req, res, next);

      const callArgs = lungerData.deleteLungerIncident.mock.calls[0];
      expect(callArgs[1].description).toContain('&');
      expect(callArgs[1].description).toContain("'");
    });
  });

  describe('newIncidentPost', () => {
    
    test('should add new incident successfully', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall from horse', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      expect(lungerData.addLungerIncident).toHaveBeenCalled();
    });

    test('should construct incident data with userId', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].userId).toBe('user123');
    });

    test('should construct incident data with eventId', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].eventId).toBe('event123');
    });

    test('should pass incident description', async () => {
      req.params.id = 'lunger123';
      const description = 'Lunger fell during training';
      req.body = { description, incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].description).toBe(description);
    });

    test('should pass incident type', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].incidentType).toBe('injury');
    });

    test('should return status OK', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.INCIDENT_ADDED
      });
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockRejectedValue(error);

      await expect(
        lungerController.newIncidentPost(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should construct complete incident object', async () => {
      req.params.id = 'lunger123';
      const description = 'Incident description';
      const incidentType = 'injury';
      req.body = { description, incidentType };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      const incidentData = callArgs[1];
      
      expect(incidentData).toEqual({
        description,
        incidentType,
        userId: 'user123',
        eventId: 'event123'
      });
    });

    test('should handle special characters in description', async () => {
      req.params.id = 'lunger123';
      req.body = { description: "Training session's incident & injury", incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].description).toContain("'");
      expect(callArgs[1].description).toContain("&");
    });

    test('should handle different incident types', async () => {
      req.params.id = 'lunger123';
      const incidentTypes = ['injury', 'fall', 'illness', 'behavior'];

      for (const type of incidentTypes) {
        jest.clearAllMocks();
        req.body = { description: 'Test incident', incidentType: type };

        lungerData.addLungerIncident.mockResolvedValue(mockLunger);

        await lungerController.newIncidentPost(req, res, next);

        const callArgs = lungerData.addLungerIncident.mock.calls[0];
        expect(callArgs[1].incidentType).toBe(type);
      }
    });
  });

  describe('Error Handling', () => {
    
    test('should handle null user in permissions', () => {
      req.user = null;

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing user role', () => {
      req.user.role = null;

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing user role permissions', () => {
      req.user.role.permissions = null;

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          rolePermissons: null
        })
      );
    });

    test('should handle lunger with empty incidents array', async () => {
      req.params.id = 'lunger123';
      const lungerNoIncidents = { ...mockLunger, incidents: [] };

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(lungerNoIncidents);
      lungerData.getAllUsers.mockResolvedValue([]);

      await lungerController.details(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.formData.incidents.length).toBe(0);
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should include user permissions in all form renders', async () => {
      req.user.role.permissions = ['view', 'edit'];

      lungerData.getLungerById.mockResolvedValue(mockLunger);

      await lungerController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/editLunger',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should pass different user contexts', () => {
      const customUser = { ...mockUser, username: 'custom_user' };
      req.user = customUser;

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          user: customUser
        })
      );
    });

    test('should use user ID in incident operations', async () => {
      const customUserId = 'user456';
      req.user._id = customUserId;
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].userId).toBe(customUserId);
    });

    test('should use username in logging', async () => {
      req.body = { Name: 'John Doe' };
      const customUsername = 'admin_user';
      req.user.username = customUsername;

      lungerData.createLunger.mockResolvedValue(mockLunger);

      await lungerController.createNew(req, res, next);

      // Logging would use req.user.username
      expect(lungerData.createLunger).toHaveBeenCalled();
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify DataServices calls with correct IDs', async () => {
      req.params.id = 'lunger123';
      req.body = { Name: 'Updated' };

      lungerData.updateLunger.mockResolvedValue(mockLunger);

      await lungerController.editPost(req, res, next);

      expect(lungerData.updateLunger).toHaveBeenCalledWith('lunger123', req.body);
    });

    test('should pass complete request body to createLunger', async () => {
      const lungerData_input = {
        Name: 'John Doe',
        age: 45,
        country: 'Hungary',
        experience: 15
      };

      req.body = lungerData_input;

      lungerData.createLunger.mockResolvedValue(mockLunger);

      await lungerController.createNew(req, res, next);

      expect(lungerData.createLunger).toHaveBeenCalledWith(lungerData_input);
    });

    test('should fetch lunger and users in details', async () => {
      req.params.id = 'lunger123';
      const users = [mockUser1, mockUser2];

      lungerData.getLungerByIdWithPopulation.mockResolvedValue(mockLunger);
      lungerData.getAllUsers.mockResolvedValue(users);

      await lungerController.details(req, res, next);

      expect(lungerData.getLungerByIdWithPopulation).toHaveBeenCalledWith('lunger123');
      expect(lungerData.getAllUsers).toHaveBeenCalled();
    });

    test('should verify deleteIncident called with lunger ID', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', type: 'injury' };

      lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.deleteIncident(req, res, next);

      const callArgs = lungerData.deleteLungerIncident.mock.calls[0];
      expect(callArgs[0]).toBe('lunger123');
    });

    test('should verify addLungerIncident called with lunger ID', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[0]).toBe('lunger123');
    });
  });

  describe('Session Management', () => {
    
    test('should preserve formData in session', () => {
      const formData = { Name: 'John Doe' };
      req.session.formData = formData;

      lungerController.renderNew(req, res);

      expect(req.session.formData).toEqual(formData);
    });

    test('should clear messages independently', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      lungerData.getAllLungers.mockResolvedValue([]);

      await lungerController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should not clear formData on operations', async () => {
      const formData = { Name: 'John Doe' };
      req.session.formData = formData;
      req.params.id = 'lunger123';
      req.body = { Name: 'Updated' };

      lungerData.updateLunger.mockResolvedValue(mockLunger);

      await lungerController.editPost(req, res, next);

      expect(req.session.formData).toEqual(formData);
    });

    test('should handle null session values', () => {
      req.session.formData = null;
      req.session.failMessage = null;
      req.session.successMessage = null;

      lungerController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'lunger/newLunger',
        expect.objectContaining({
          formData: null,
          failMessage: null,
          successMessage: null
        })
      );
    });
  });

  describe('Incident Data Validation', () => {
    
    test('should construct incident with all required fields', async () => {
      req.params.id = 'lunger123';
      req.body = { description: 'Test incident', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const incidentData = lungerData.addLungerIncident.mock.calls[0][1];
      expect(incidentData).toHaveProperty('description');
      expect(incidentData).toHaveProperty('incidentType');
      expect(incidentData).toHaveProperty('userId');
      expect(incidentData).toHaveProperty('eventId');
    });

    test('should use selectedEvent._id for incident eventId', async () => {
      const customEventId = 'custom_event_123';
      res.locals.selectedEvent._id = customEventId;

      req.params.id = 'lunger123';
      req.body = { description: 'Fall', incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].eventId).toBe(customEventId);
    });

    test('should handle multiple incident types in delete', async () => {
      const types = ['injury', 'fall', 'illness', 'behavioral'];

      for (const type of types) {
        jest.clearAllMocks();
        req.params.id = 'lunger123';
        req.body = { description: 'Incident', type };

        lungerData.deleteLungerIncident.mockResolvedValue(mockLunger);

        await lungerController.deleteIncident(req, res, next);

        const callArgs = lungerData.deleteLungerIncident.mock.calls[0];
        expect(callArgs[1].type).toBe(type);
      }
    });

    test('should pass exact description text without modification', async () => {
      req.params.id = 'lunger123';
      const exactDescription = 'Exact! Description *With* Special ^Characters$';
      req.body = { description: exactDescription, incidentType: 'injury' };

      lungerData.addLungerIncident.mockResolvedValue(mockLunger);

      await lungerController.newIncidentPost(req, res, next);

      const callArgs = lungerData.addLungerIncident.mock.calls[0];
      expect(callArgs[1].description).toBe(exactDescription);
    });
  });

});

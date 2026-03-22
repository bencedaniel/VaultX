// tests/controllers/dailyTimetableController.test.js - Daily Timetable Controller Unit Tests
import dailyTimetableController from '../../controllers/dailyTimetableController.js';
import * as dailyTimetableData from '../../DataServices/dailyTimetableData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/dailyTimetableData.js');
jest.mock('../../logger.js');
jest.mock('../../models/DailyTimeTable.js');
jest.mock('../../models/Timetablepart.js');

describe('Daily Timetable Controller - Unit Tests', () => {
  
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

  const mockEvent = {
    _id: 'event123',
    name: 'Test Event'
  };

  const mockDailyTimeTable = {
    _id: 'table123',
    DayName: 'Monday',
    eventID: 'event123'
  };

  const mockTimetablePart = {
    _id: 'part123',
    Name: 'Morning Session',
    dailytimetable: 'table123'
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
      user: mockUser
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
    
    test('should render new daily timetable form', () => {
      dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          formData: null,
          rolePermissons: mockUser.role.permissions,
          user: mockUser
        })
      );
    });

    test('should pass session messages to form', () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success message';

      dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success message'
        })
      );
    });

    test('should clear failMessage after rendering', () => {
      req.session.failMessage = 'Error';

      dailyTimetableController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', () => {
      req.session.successMessage = 'Success';

      dailyTimetableController.renderNew(req, res);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass existing formData to form', () => {
      req.session.formData = { DayName: 'Monday' };

      dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          formData: { DayName: 'Monday' }
        })
      );
    });
  });

  describe('createNew', () => {
    
    test('should create new daily timetable', async () => {
      req.body = { DayName: 'Monday' };

      dailyTimetableData.createDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.createNew(req, res, next);

      expect(dailyTimetableData.createDailyTimeTable).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = { DayName: 'Monday' };

      dailyTimetableData.createDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.DAILY_TIMETABLE_CREATED);
    });

    test('should redirect to dashboard after creation', async () => {
      req.body = { DayName: 'Monday' };

      dailyTimetableData.createDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.createNew(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should handle database error during creation', async () => {
      const error = new Error('Database error');
      req.body = { DayName: 'Monday' };

      dailyTimetableData.createDailyTimeTable.mockRejectedValue(error);

      await expect(
        dailyTimetableController.createNew(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('dashboard', () => {
    
    test('should render dashboard with timetables', async () => {
      const timetableParts = [mockTimetablePart];
      const dailyTimetables = [mockDailyTimeTable];

      dailyTimetableData.getAllTimetableParts.mockResolvedValue(timetableParts);
      dailyTimetableData.getAllDailyTimeTables.mockResolvedValue(dailyTimetables);

      await dailyTimetableController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/dailytimetabledash',
        expect.objectContaining({
          timetableparts: timetableParts,
          dailytimetables: dailyTimetables
        })
      );
    });

    test('should fetch timetables for selected event', async () => {
      const timetableParts = [];
      const dailyTimetables = [];

      dailyTimetableData.getAllTimetableParts.mockResolvedValue(timetableParts);
      dailyTimetableData.getAllDailyTimeTables.mockResolvedValue(dailyTimetables);

      await dailyTimetableController.dashboard(req, res, next);

      expect(dailyTimetableData.getAllDailyTimeTables).toHaveBeenCalledWith(mockEvent._id);
    });

    test('should pass role permissions to dashboard', async () => {
      dailyTimetableData.getAllTimetableParts.mockResolvedValue([]);
      dailyTimetableData.getAllDailyTimeTables.mockResolvedValue([]);

      await dailyTimetableController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/dailytimetabledash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      dailyTimetableData.getAllTimetableParts.mockResolvedValue([]);
      dailyTimetableData.getAllDailyTimeTables.mockResolvedValue([]);

      await dailyTimetableController.dashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty timetables list', async () => {
      dailyTimetableData.getAllTimetableParts.mockResolvedValue([]);
      dailyTimetableData.getAllDailyTimeTables.mockResolvedValue([]);

      await dailyTimetableController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/dailytimetabledash',
        expect.objectContaining({
          timetableparts: [],
          dailytimetables: []
        })
      );
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      dailyTimetableData.getAllTimetableParts.mockRejectedValue(error);

      await expect(
        dailyTimetableController.dashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('details', () => {
    
    test('should render timetable details', async () => {
      req.params.id = 'table123';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/dailytimetableDetail',
        expect.objectContaining({
          formData: mockDailyTimeTable
        })
      );
    });

    test('should handle timetable not found', async () => {
      req.params.id = 'nonexistent';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(null);

      await dailyTimetableController.details(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should clear session messages after rendering', async () => {
      req.params.id = 'table123';
      req.session.failMessage = 'Error';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.details(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      req.params.id = 'table123';
      const error = new Error('Database error');

      dailyTimetableData.getDailyTimeTableById.mockRejectedValue(error);

      await expect(
        dailyTimetableController.details(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editGet', () => {
    
    test('should render edit form with timetable data', async () => {
      req.params.id = 'table123';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/editdailytimetable',
        expect.objectContaining({
          formData: mockDailyTimeTable
        })
      );
    });

    test('should handle timetable not found', async () => {
      req.params.id = 'nonexistent';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(null);

      await dailyTimetableController.editGet(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should pass role permissions to edit form', async () => {
      req.params.id = 'table123';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/editdailytimetable',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should handle database error', async () => {
      req.params.id = 'table123';
      const error = new Error('Database error');

      dailyTimetableData.getDailyTimeTableById.mockRejectedValue(error);

      await expect(
        dailyTimetableController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editPost', () => {
    
    test('should update timetable successfully', async () => {
      req.params.id = 'table123';
      req.body = { DayName: 'Tuesday' };

      dailyTimetableData.updateDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.editPost(req, res, next);

      expect(dailyTimetableData.updateDailyTimeTable).toHaveBeenCalledWith('table123', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = 'table123';
      req.body = { DayName: 'Tuesday' };

      dailyTimetableData.updateDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.DAILY_TIMETABLE_UPDATED);
    });

    test('should redirect to dashboard after update', async () => {
      req.params.id = 'table123';
      req.body = { DayName: 'Tuesday' };

      dailyTimetableData.updateDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.editPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should handle timetable not found during update', async () => {
      req.params.id = 'nonexistent';
      req.body = { DayName: 'Tuesday' };

      dailyTimetableData.updateDailyTimeTable.mockResolvedValue(null);

      await dailyTimetableController.editPost(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should handle database error during update', async () => {
      req.params.id = 'table123';
      req.body = { DayName: 'Tuesday' };
      const error = new Error('Database error');

      dailyTimetableData.updateDailyTimeTable.mockRejectedValue(error);

      await expect(
        dailyTimetableController.editPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    
    test('should delete timetable successfully', async () => {
      req.params.id = 'table123';

      dailyTimetableData.deleteDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.delete(req, res, next);

      expect(dailyTimetableData.deleteDailyTimeTable).toHaveBeenCalledWith('table123');
    });

    test('should return success response after deletion', async () => {
      req.params.id = 'table123';

      dailyTimetableData.deleteDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.delete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.DAILY_TIMETABLE_DELETED
      });
    });

    test('should handle timetable not found during deletion', async () => {
      req.params.id = 'nonexistent';

      dailyTimetableData.deleteDailyTimeTable.mockResolvedValue(null);

      await dailyTimetableController.delete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND
      });
    });

    test('should handle database error during deletion', async () => {
      req.params.id = 'table123';
      const error = new Error('Database error');

      dailyTimetableData.deleteDailyTimeTable.mockRejectedValue(error);

      await expect(
        dailyTimetableController.delete(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('dayparts', () => {
    
    test('should render dayparts with timetable parts', async () => {
      req.params.id = 'table123';
      const timetableParts = [mockTimetablePart];

      dailyTimetableData.getTimetablePartsByDailyTimeTable.mockResolvedValue(timetableParts);
      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.dayparts(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/attacheddash',
        expect.objectContaining({
          dailytable: mockDailyTimeTable,
          formData: timetableParts
        })
      );
    });

    test('should handle timetable not found', async () => {
      req.params.id = 'nonexistent';

      dailyTimetableData.getTimetablePartsByDailyTimeTable.mockResolvedValue(null);

      await dailyTimetableController.dayparts(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should clear session messages after rendering', async () => {
      req.params.id = 'table123';
      req.session.failMessage = 'Error';

      dailyTimetableData.getTimetablePartsByDailyTimeTable.mockResolvedValue([mockTimetablePart]);
      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.dayparts(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });
  });

  describe('deleteTTelement', () => {
    
    test('should delete timetable part successfully', async () => {
      req.params.id = 'part123';

      dailyTimetableData.deleteTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.deleteTTelement(req, res, next);

      expect(dailyTimetableData.deleteTimetablePart).toHaveBeenCalledWith('part123');
    });

    test('should return success response after deletion', async () => {
      req.params.id = 'part123';

      dailyTimetableData.deleteTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.deleteTTelement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.TIMETABLE_ELEMENT_DELETED
      });
    });

    test('should handle timetable part not found', async () => {
      req.params.id = 'nonexistent';

      dailyTimetableData.deleteTimetablePart.mockResolvedValue(null);

      await dailyTimetableController.deleteTTelement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.ERROR.TIMETABLE_ELEMENT_NOT_FOUND
      });
    });

    test('should handle database error during deletion', async () => {
      req.params.id = 'part123';
      const error = new Error('Database error');

      dailyTimetableData.deleteTimetablePart.mockRejectedValue(error);

      await expect(
        dailyTimetableController.deleteTTelement(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editTTelementGet', () => {
    
    test('should render edit form with timetable part data', async () => {
      req.params.id = 'part123';
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);
      dailyTimetableData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.editTTelementGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/editttelement',
        expect.objectContaining({
          judges: formData.judges,
          days: formData.days,
          categorys: formData.categorys,
          formData: mockTimetablePart
        })
      );
    });

    test('should fetch form data for selected event', async () => {
      req.params.id = 'part123';
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);
      dailyTimetableData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.editTTelementGet(req, res, next);

      expect(dailyTimetableData.getTimetablePartFormData).toHaveBeenCalledWith(mockEvent._id);
    });

    test('should handle timetable part not found', async () => {
      req.params.id = 'nonexistent';
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);
      dailyTimetableData.getTimetablePartById.mockResolvedValue(null);

      await dailyTimetableController.editTTelementGet(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.TIMETABLE_ELEMENT_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should handle database error', async () => {
      req.params.id = 'part123';
      const error = new Error('Database error');

      dailyTimetableData.getTimetablePartFormData.mockRejectedValue(error);

      await expect(
        dailyTimetableController.editTTelementGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editTTelementPost', () => {
    
    test('should update timetable part successfully', async () => {
      req.params.id = 'part123';
      req.body = { Name: 'Afternoon Session', dailytimetable: 'table123' };

      dailyTimetableData.updateTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.editTTelementPost(req, res, next);

      expect(dailyTimetableData.updateTimetablePart).toHaveBeenCalledWith('part123', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = 'part123';
      req.body = { Name: 'Afternoon Session', dailytimetable: 'table123' };

      dailyTimetableData.updateTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.editTTelementPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.TIMETABLE_ELEMENT_UPDATED);
    });

    test('should redirect to dayparts after update', async () => {
      req.params.id = 'part123';
      req.body = { Name: 'Afternoon Session', dailytimetable: 'table123' };

      dailyTimetableData.updateTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.editTTelementPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dayparts/table123');
    });

    test('should use dailytimetable from request body', async () => {
      req.params.id = 'part123';
      req.body = { Name: 'Afternoon Session', dailytimetable: 'table456' };

      dailyTimetableData.updateTimetablePart.mockResolvedValue({
        ...mockTimetablePart,
        dailytimetable: 'table456'
      });

      await dailyTimetableController.editTTelementPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dayparts/table456');
    });

    test('should handle missing dailytimetable in request and response', async () => {
      req.params.id = 'part123';
      req.body = { Name: 'Afternoon Session' };

      dailyTimetableData.updateTimetablePart.mockResolvedValue({
        ...mockTimetablePart,
        dailytimetable: null
      });

      await dailyTimetableController.editTTelementPost(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.PARENT_DAY_MISSING);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should handle database error during update', async () => {
      req.params.id = 'part123';
      req.body = { Name: 'Afternoon Session' };
      const error = new Error('Database error');

      dailyTimetableData.updateTimetablePart.mockRejectedValue(error);

      await expect(
        dailyTimetableController.editTTelementPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('saveTTelement', () => {
    
    test('should save timetable part start time', async () => {
      req.params.id = 'part123';

      dailyTimetableData.saveTimetablePartStartTime.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.saveTTelement(req, res, next);

      expect(dailyTimetableData.saveTimetablePartStartTime).toHaveBeenCalledWith('part123');
    });

    test('should return success response after save', async () => {
      req.params.id = 'part123';

      dailyTimetableData.saveTimetablePartStartTime.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.saveTTelement(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.TIMETABLE_ELEMENT_UPDATED
      });
    });

    test('should handle database error during save', async () => {
      req.params.id = 'part123';
      const error = new Error('Database error');

      dailyTimetableData.saveTimetablePartStartTime.mockRejectedValue(error);

      await expect(
        dailyTimetableController.saveTTelement(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('newTTelementGetById', () => {
    
    test('should render new timetable element form with daily table', async () => {
      req.params.id = 'table123';
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);
      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.newTTelementGetById(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newttelement',
        expect.objectContaining({
          judges: formData.judges,
          days: formData.days,
          categorys: formData.categorys,
          dailytable: mockDailyTimeTable,
          formData: { dailytimetable: mockDailyTimeTable._id }
        })
      );
    });

    test('should handle daily table not found', async () => {
      req.params.id = 'nonexistent';
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);
      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(null);

      await dailyTimetableController.newTTelementGetById(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND);
      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dashboard');
    });

    test('should handle database error', async () => {
      req.params.id = 'table123';
      const error = new Error('Database error');

      dailyTimetableData.getTimetablePartFormData.mockRejectedValue(error);

      await expect(
        dailyTimetableController.newTTelementGetById(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('newTTelementGet', () => {
    
    test('should render new timetable element form', async () => {
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);

      await dailyTimetableController.newTTelementGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newttelement',
        expect.objectContaining({
          judges: formData.judges,
          days: formData.days,
          categorys: formData.categorys,
          formData: null
        })
      );
    });

    test('should fetch form data for selected event', async () => {
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);

      await dailyTimetableController.newTTelementGet(req, res, next);

      expect(dailyTimetableData.getTimetablePartFormData).toHaveBeenCalledWith(mockEvent._id);
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockResolvedValue(formData);

      await dailyTimetableController.newTTelementGet(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      dailyTimetableData.getTimetablePartFormData.mockRejectedValue(error);

      await expect(
        dailyTimetableController.newTTelementGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('newTTelementPost', () => {
    
    test('should create new timetable element successfully', async () => {
      req.body = { Name: 'Morning Session', dailytimetable: 'table123' };

      dailyTimetableData.createTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.newTTelementPost(req, res, next);

      expect(dailyTimetableData.createTimetablePart).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = { Name: 'Morning Session', dailytimetable: 'table123' };

      dailyTimetableData.createTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.newTTelementPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.TIMETABLE_ELEMENT_CREATED);
    });

    test('should redirect to dayparts after creation', async () => {
      req.body = { Name: 'Morning Session', dailytimetable: 'table123' };

      dailyTimetableData.createTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.newTTelementPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/dailytimetable/dayparts/table123');
    });

    test('should pass all form fields to DataServices', async () => {
      const partData = {
        Name: 'Morning Session',
        dailytimetable: 'table123',
        judges: ['judge1', 'judge2'],
        category: 'vaulting'
      };

      req.body = partData;

      dailyTimetableData.createTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.newTTelementPost(req, res, next);

      expect(dailyTimetableData.createTimetablePart).toHaveBeenCalledWith(partData);
    });

    test('should handle database error during creation', async () => {
      req.body = { Name: 'Morning Session', dailytimetable: 'table123' };
      const error = new Error('Database error');

      dailyTimetableData.createTimetablePart.mockRejectedValue(error);

      await expect(
        dailyTimetableController.newTTelementPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle missing selected event', async () => {
      res.locals.selectedEvent = null;
      const formData = { judges: [], days: [], categorys: [] };

      dailyTimetableData.getTimetablePartFormData.mockRejectedValue(new Error('Event required'));

      await expect(
        dailyTimetableController.newTTelementGet(req, res, next)
      ).rejects.toThrow('Event required');
    });

    test('should handle null user in permissions', async () => {
      req.user = null;

      await dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing role in user', async () => {
      req.user = { username: 'testuser' };

      await dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should include user permissions in all form renders', async () => {
      req.user.role.permissions = ['view', 'edit'];

      await dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should pass user context in all renders', async () => {
      const customUser = { ...mockUser, username: 'customuser' };
      req.user = customUser;

      await dailyTimetableController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'dailytimetable/newdailytimetable',
        expect.objectContaining({
          user: customUser
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify DataServices parameters are correct', async () => {
      req.params.id = 'table123';
      req.body = { DayName: 'Tuesday' };

      dailyTimetableData.updateDailyTimeTable.mockResolvedValue(mockDailyTimeTable);

      await dailyTimetableController.editPost(req, res, next);

      expect(dailyTimetableData.updateDailyTimeTable).toHaveBeenCalledWith('table123', req.body);
    });

    test('should pass complete form data to createTimetablePart', async () => {
      const formData = {
        Name: 'Morning Session',
        dailytimetable: 'table123',
        judges: ['judge1'],
        category: 'vaulting',
        startTime: '09:00'
      };

      req.body = formData;

      dailyTimetableData.createTimetablePart.mockResolvedValue(mockTimetablePart);

      await dailyTimetableController.newTTelementPost(req, res, next);

      expect(dailyTimetableData.createTimetablePart).toHaveBeenCalledWith(formData);
    });
  });

  describe('Session Management', () => {
    
    test('should not clear session on redirect for not found', async () => {
      req.params.id = 'nonexistent';
      req.session.failMessage = 'Some error';

      dailyTimetableData.getDailyTimeTableById.mockResolvedValue(null);

      await dailyTimetableController.details(req, res, next);

      // SessionM essage is set, not cleared on redirect
      expect(req.session.failMessage).toBe(MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND);
    });

    test('should clear session messages after successful render', async () => {
      req.session.failMessage = 'Previous error';
      req.session.successMessage = 'Previous success';

      dailyTimetableData.getAllTimetableParts.mockResolvedValue([]);
      dailyTimetableData.getAllDailyTimeTables.mockResolvedValue([]);

      await dailyTimetableController.dashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });
  });

});

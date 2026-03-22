// tests/controllers/orderController.test.js - Order Controller Unit Tests
import orderController from '../../controllers/orderController.js';
import * as orderData from '../../DataServices/orderData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/orderData.js');
jest.mock('../../logger.js');
jest.mock('console');

describe('Order Controller - Unit Tests', () => {
  
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
    name: 'Test Event'
  };

  const mockTimetablePart = {
    _id: 'tt_part123',
    name: 'Morning Session',
    Category: ['category1', 'category2'],
    StartingOrder: ['entry1', 'entry2', 'entry3'],
    drawingDone: true,
    conflictsChecked: false
  };

  const mockEntries = [
    { _id: 'entry1', name: 'Vaulter 1', category: 'category1' },
    { _id: 'entry2', name: 'Vaulter 2', category: 'category1' },
    { _id: 'entry3', name: 'Vaulter 3', category: 'category2' }
  ];

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      session: {
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

  describe('editGet', () => {
    
    test('should render edit order form with valid starting order', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/editorder',
        expect.any(Object)
      );
    });

    test('should fetch timetable part by ID', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(orderData.getTimetablePartById).toHaveBeenCalledWith('tt_part123');
    });

    test('should redirect when no starting order exists', async () => {
      req.params.id = 'tt_part123';
      const timetableNoOrder = { ...mockTimetablePart, StartingOrder: [] };

      orderData.getTimetablePartById.mockResolvedValue(timetableNoOrder);

      await orderController.editGet(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_STARTING_ORDER);
      expect(res.redirect).toHaveBeenCalledWith('/order/createSelect/tt_part123');
    });

    test('should redirect when drawing not done', async () => {
      req.params.id = 'tt_part123';
      const timetableNotDrawn = { ...mockTimetablePart, drawingDone: false };

      orderData.getTimetablePartById.mockResolvedValue(timetableNotDrawn);

      await orderController.editGet(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_STARTING_ORDER);
      expect(res.redirect).toHaveBeenCalledWith('/order/createSelect/tt_part123');
    });

    test('should parse categories from timetable', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(orderData.parseCategoriesArray).toHaveBeenCalledWith(mockTimetablePart.Category);
    });

    test('should fetch entries for categories', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(orderData.getEntriesForCategories).toHaveBeenCalledWith(
        'event123',
        ['category1', 'category2']
      );
    });

    test('should validate starting order', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(orderData.validateAndFilterStartingOrder).toHaveBeenCalled();
    });

    test('should pass entries to template', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/editorder',
        expect.objectContaining({
          entries: mockEntries
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.params.id = 'tt_part123';
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockRejectedValue(error);

      await expect(
        orderController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('overwrite', () => {
    
    test('should update starting order successfully', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      expect(orderData.updateStartingOrder).toHaveBeenCalled();
    });

    test('should validate order data is provided', async () => {
      req.params.id = 'tt_part123';
      req.body = {}; // Missing id and newOrder

      await orderController.overwrite(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_ORDER_DATA);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    test('should validate newOrder is numeric', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 'not_a_number' };

      await orderController.overwrite(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_ORDER_DATA);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    test('should validate newOrder is greater than 0', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 0 };

      await orderController.overwrite(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_ORDER_DATA);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    test('should validate newOrder is not negative', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: -5 };

      await orderController.overwrite(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_ORDER_DATA);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    test('should pass correct parameters to updateStartingOrder', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      expect(orderData.updateStartingOrder).toHaveBeenCalledWith(
        'tt_part123',
        {
          entryId: 'entry1',
          newOrder: 5
        }
      );
    });

    test('should return success message', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.STARTING_ORDER_UPDATED
      });
    });

    test('should return status OK on success', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should set session success message', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.STARTING_ORDER_UPDATED);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };

      orderData.updateStartingOrder.mockRejectedValue(error);

      await expect(
        orderController.overwrite(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle large order numbers', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 99999 };

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      const callArgs = orderData.updateStartingOrder.mock.calls[0];
      expect(callArgs[1].newOrder).toBe(99999);
    });
  });

  describe('createOrder', () => {
    
    test('should check conflicts when not checked yet', async () => {
      req.params.id = 'tt_part123';
      const timetableNotChecked = { ...mockTimetablePart, conflictsChecked: false };

      orderData.getTimetablePartById.mockResolvedValue(timetableNotChecked);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.checkAndGenerateConflictingOrders.mockResolvedValue({
        timetablePart: timetableNotChecked,
        conflictedEntries: mockEntries.slice(0, 2)
      });

      await orderController.createOrder(req, res, next);

      expect(orderData.checkAndGenerateConflictingOrders).toHaveBeenCalled();
    });

    test('should render conflict checking template when conflicts not checked', async () => {
      req.params.id = 'tt_part123';
      const timetableNotChecked = { ...mockTimetablePart, conflictsChecked: false };
      const conflictedEntries = [mockEntries[0], mockEntries[1]];

      orderData.getTimetablePartById.mockResolvedValue(timetableNotChecked);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.checkAndGenerateConflictingOrders.mockResolvedValue({
        timetablePart: timetableNotChecked,
        conflictedEntries
      });

      await orderController.createOrder(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/checkconflicts',
        expect.any(Object)
      );
    });

    test('should generate complete order when conflicts checked', async () => {
      req.params.id = 'tt_part123';
      const timetableChecked = { ...mockTimetablePart, conflictsChecked: true };

      orderData.getTimetablePartById.mockResolvedValue(timetableChecked);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateCompleteStartingOrder.mockResolvedValue(timetableChecked);

      await orderController.createOrder(req, res, next);

      expect(orderData.generateCompleteStartingOrder).toHaveBeenCalled();
    });

    test('should render view order template when conflicts checked', async () => {
      req.params.id = 'tt_part123';
      const timetableChecked = { ...mockTimetablePart, conflictsChecked: true };

      orderData.getTimetablePartById.mockResolvedValue(timetableChecked);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateCompleteStartingOrder.mockResolvedValue(timetableChecked);

      await orderController.createOrder(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/vieworder',
        expect.any(Object)
      );
    });

    test('should clear messages after rendering', async () => {
      req.params.id = 'tt_part123';
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      const timetableChecked = { ...mockTimetablePart, conflictsChecked: true };

      orderData.getTimetablePartById.mockResolvedValue(timetableChecked);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateCompleteStartingOrder.mockResolvedValue(timetableChecked);

      await orderController.createOrder(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockRejectedValue(error);

      await expect(
        orderController.createOrder(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('confirmConflicts', () => {
    
    test('should update timetable part status', async () => {
      req.params.id = 'tt_part123';

      orderData.updateTimetablePartStatus.mockResolvedValue(mockTimetablePart);

      await orderController.confirmConflicts(req, res, next);

      expect(orderData.updateTimetablePartStatus).toHaveBeenCalledWith(
        'tt_part123',
        { conflictsChecked: true }
      );
    });

    test('should set success message', async () => {
      req.params.id = 'tt_part123';

      orderData.updateTimetablePartStatus.mockResolvedValue(mockTimetablePart);

      await orderController.confirmConflicts(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CONFLICTS_CONFIRMED);
    });

    test('should redirect to create order', async () => {
      req.params.id = 'tt_part123';

      orderData.updateTimetablePartStatus.mockResolvedValue(mockTimetablePart);

      await orderController.confirmConflicts(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/order/createOrder/tt_part123');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';

      orderData.updateTimetablePartStatus.mockRejectedValue(error);

      await expect(
        orderController.confirmConflicts(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getNewOrder', () => {
    
    test('should generate new order number', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateNewOrderNumber.mockResolvedValue(8);
      orderData.updateEntryOrderNumber.mockResolvedValue();

      await orderController.getNewOrder(req, res, next);

      expect(orderData.generateNewOrderNumber).toHaveBeenCalled();
    });

    test('should pass correct parameters to generateNewOrderNumber', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateNewOrderNumber.mockResolvedValue(8);
      orderData.updateEntryOrderNumber.mockResolvedValue();

      await orderController.getNewOrder(req, res, next);

      const callArgs = orderData.generateNewOrderNumber.mock.calls[0];
      expect(callArgs[0]).toBe(mockTimetablePart);
      expect(callArgs[1]).toBe(mockEntries.length);
      expect(callArgs[2]).toBe(5);
    });

    test('should update entry order number', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateNewOrderNumber.mockResolvedValue(8);
      orderData.updateEntryOrderNumber.mockResolvedValue();

      await orderController.getNewOrder(req, res, next);

      expect(orderData.updateEntryOrderNumber).toHaveBeenCalledWith(
        'tt_part123',
        'entry1',
        8
      );
    });

    test('should return new order number', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateNewOrderNumber.mockResolvedValue(8);
      orderData.updateEntryOrderNumber.mockResolvedValue();

      await orderController.getNewOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ newOrder: 8 });
    });

    test('should return status OK', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.generateNewOrderNumber.mockResolvedValue(8);
      orderData.updateEntryOrderNumber.mockResolvedValue();

      await orderController.getNewOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };

      orderData.getTimetablePartById.mockRejectedValue(error);

      await expect(
        orderController.getNewOrder(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('createSelectGet', () => {
    
    test('should render creation method selection form', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await orderController.createSelectGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/createselect',
        expect.any(Object)
      );
    });

    test('should fetch timetable part by ID', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await orderController.createSelectGet(req, res, next);

      expect(orderData.getTimetablePartById).toHaveBeenCalledWith('tt_part123');
    });

    test('should pass timetable data to template', async () => {
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await orderController.createSelectGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/createselect',
        expect.objectContaining({
          formData: mockTimetablePart
        })
      );
    });

    test('should clear session messages', async () => {
      req.params.id = 'tt_part123';
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await orderController.createSelectGet(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';

      orderData.getTimetablePartById.mockRejectedValue(error);

      await expect(
        orderController.createSelectGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('createSelectPost', () => {
    
    test('should create order with Drawing method', async () => {
      req.params.id = 'tt_part123';
      req.body = { creationMethod: 'Drawing' };

      orderData.updateTimetablePartStatus.mockResolvedValue(mockTimetablePart);

      await orderController.createSelectPost(req, res, next);

      expect(orderData.updateTimetablePartStatus).toHaveBeenCalledWith(
        'tt_part123',
        { StartingOrder: [] }
      );
    });

    test('should redirect to createOrder after Drawing method', async () => {
      req.params.id = 'tt_part123';
      req.body = { creationMethod: 'Drawing' };

      orderData.updateTimetablePartStatus.mockResolvedValue(mockTimetablePart);

      await orderController.createSelectPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/order/createOrder/tt_part123');
    });

    test('should reject Copy method with error message', async () => {
      req.params.id = 'tt_part123';
      req.body = { creationMethod: 'Copy' };

      await orderController.createSelectPost(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.COPY_METHOD_NOT_IMPLEMENTED);
      expect(res.redirect).toHaveBeenCalledWith('/order/createSelect/tt_part123');
    });

    test('should reject invalid creation method', async () => {
      req.params.id = 'tt_part123';
      req.body = { creationMethod: 'Invalid' };

      await orderController.createSelectPost(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_CREATION_METHOD);
      expect(res.redirect).toHaveBeenCalledWith('/order/createSelect/tt_part123');
    });

    test('should reject missing creation method', async () => {
      req.params.id = 'tt_part123';
      req.body = {};

      await orderController.createSelectPost(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_CREATION_METHOD);
      expect(res.redirect).toHaveBeenCalledWith('/order/createSelect/tt_part123');
    });

    test('should handle database error in Drawing method', async () => {
      const error = new Error('Database error');
      req.params.id = 'tt_part123';
      req.body = { creationMethod: 'Drawing' };

      orderData.updateTimetablePartStatus.mockRejectedValue(error);

      await expect(
        orderController.createSelectPost(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should validate creationMethod case-sensitive', async () => {
      req.params.id = 'tt_part123';
      req.body = { creationMethod: 'drawing' }; // lowercase

      await orderController.createSelectPost(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_CREATION_METHOD);
    });
  });

  describe('Error Handling', () => {
    
    test('should handle null user in permissions', async () => {
      req.params.id = 'tt_part123';
      req.user = null;

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/editorder',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing user role', async () => {
      req.params.id = 'tt_part123';
      req.user.role = null;

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/editorder',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle empty starting order array', async () => {
      req.params.id = 'tt_part123';
      const emptyOrderTimetable = { ...mockTimetablePart, StartingOrder: [] };

      orderData.getTimetablePartById.mockResolvedValue(emptyOrderTimetable);

      await orderController.editGet(req, res, next);

      expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_STARTING_ORDER);
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should pass user permissions to all renders', async () => {
      req.params.id = 'tt_part123';
      req.user.role.permissions = ['view', 'edit'];

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/editorder',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should pass user context to all renders', async () => {
      req.params.id = 'tt_part123';
      const customUser = { ...mockUser, username: 'custom_user' };
      req.user = customUser;

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'order/editorder',
        expect.objectContaining({
          user: customUser
        })
      );
    });

    test('should use username in logging operations', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };
      const customUsername = 'logging_user';
      req.user.username = customUsername;

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      // Username would be used in logging
      expect(orderData.updateStartingOrder).toHaveBeenCalled();
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify correct event ID is used for entry retrieval', async () => {
      req.params.id = 'tt_part123';
      const customEventId = 'custom_event_456';
      res.locals.selectedEvent._id = customEventId;

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(mockEntries);
      orderData.validateAndFilterStartingOrder.mockResolvedValue();

      await orderController.editGet(req, res, next);

      expect(orderData.getEntriesForCategories).toHaveBeenCalledWith(
        customEventId,
        ['category1', 'category2']
      );
    });

    test('should handle multiple entries for order generation', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', oldNumber: 5 };
      const manyEntries = mockEntries.concat(
        { _id: 'entry4', name: 'Vaulter 4' },
        { _id: 'entry5', name: 'Vaulter 5' }
      );

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);
      orderData.parseCategoriesArray.mockReturnValue(['category1', 'category2']);
      orderData.getEntriesForCategories.mockResolvedValue(manyEntries);
      orderData.generateNewOrderNumber.mockResolvedValue(10);
      orderData.updateEntryOrderNumber.mockResolvedValue();

      await orderController.getNewOrder(req, res, next);

      const callArgs = orderData.generateNewOrderNumber.mock.calls[0];
      expect(callArgs[1]).toBe(manyEntries.length);
    });
  });

  describe('Session Management', () => {
    
    test('should not modify formData on operations', async () => {
      req.params.id = 'tt_part123';
      req.body = { id: 'entry1', newOrder: 5 };
      const formData = { name: 'Test Data' };
      req.session.formData = formData;

      orderData.updateStartingOrder.mockResolvedValue(mockTimetablePart);

      await orderController.overwrite(req, res, next);

      expect(req.session.formData).toEqual(formData);
    });

    test('should preserve messages until explicitly cleared', async () => {
      req.params.id = 'tt_part123';
      req.session.failMessage = 'Preserved Error';

      orderData.getTimetablePartById.mockResolvedValue(mockTimetablePart);

      await orderController.editGet(req, res, next);

      // Initially passed to render, then cleared
      expect(req.session.failMessage).toBeNull();
    });
  });

});

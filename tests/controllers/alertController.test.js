// tests/controllers/alertController.test.js - Alert Controller Tests
import alertController from '../../controllers/alertController.js';
import * as alertData from '../../DataServices/alertData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock DataServices
jest.mock('../../DataServices/alertData.js');
jest.mock('../../logger.js');

describe('Alert Controller - Integration Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'adminuser',
    email: 'admin@example.com',
    role: {
      permissions: ['alert.view', 'alert.create', 'alert.edit', 'alert.delete']
    }
  };

  beforeEach(() => {
    req = {
      user: JSON.parse(JSON.stringify(mockUser)),
      params: {},
      body: {},
      session: {
        failMessage: null,
        successMessage: null,
        formData: null
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
      locals: {
        selectedEvent: null
      }
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('getNewAlertForm', () => {
    
    test('should render new alert form with permission list', async () => {
      const permissionList = [
        { _id: '1', name: 'admin_dashboard' },
        { _id: '2', name: 'user_view' }
      ];

      alertData.getAlertFormData.mockResolvedValue({ permissionList });

      await alertController.getNewAlertForm(req, res, next);

      expect(alertData.getAlertFormData).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          permissionList
        })
      );
    });

    test('should include user role permissions in response', async () => {
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages and form data', async () => {
      req.session.failMessage = 'Form error';
      req.session.successMessage = 'Form success';
      req.session.formData = { title: 'Test Alert' };

      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          failMessage: 'Form error',
          successMessage: 'Form success',
          formData: { title: 'Test Alert' }
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty permission list', async () => {
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          permissionList: []
        })
      );
    });

    test('should handle multiple permissions', async () => {
      const permissions = Array.from({ length: 15 }, (_, i) => ({
        _id: `${i}`,
        name: `permission${i}`
      }));

      alertData.getAlertFormData.mockResolvedValue({ permissionList: permissions });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          permissionList: permissions
        })
      );
    });

    test('should render correct template', async () => {
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.any(Object)
      );
    });

    test('should handle missing user role permissions', async () => {
      req.user.role = undefined;

      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });
  });

  describe('createNewAlertHandler', () => {
    
    test('should create new alert', async () => {
      const newAlert = { _id: '1', title: 'Test Alert', description: 'Test' };
      req.body = { title: 'Test Alert', description: 'Test' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      const newAlert = { _id: '1', title: 'Test Alert' };
      req.body = { title: 'Test Alert' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ALERT_CREATED);
    });

    test('should redirect to alerts dashboard', async () => {
      const newAlert = { _id: '1', title: 'Test Alert' };
      req.body = { title: 'Test Alert' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/alerts/dashboard');
    });

    test('should log operation', async () => {
      const newAlert = { _id: '1', title: 'Test Alert' };
      req.body = { title: 'Test Alert' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalledWith(req.body);
    });

    test('should handle alert with all properties', async () => {
      const newAlert = {
        _id: '1',
        title: 'Critical Alert',
        description: 'Important notification',
        permission: 'admin_dashboard',
        active: true,
        style: 'danger'
      };
      req.body = newAlert;

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalledWith(req.body);
    });

    test('should pass request body to data service', async () => {
      const bodyData = {
        title: 'Alert Title',
        description: 'Alert Description',
        permission: 'admin_view'
      };
      req.body = bodyData;

      const newAlert = { _id: '1', ...bodyData };
      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalledWith(bodyData);
    });

    test('should handle alert with special characters', async () => {
      const newAlert = {
        _id: '1',
        title: 'Alert: System & Event (Test)',
        description: 'Test "alert" with <special> chars'
      };
      req.body = newAlert;

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.createNewAlertHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalledWith(req.body);
    });
  });

  describe('getAlertsDashboard', () => {
    
    test('should render alerts dashboard with all alerts', async () => {
      const alerts = [
        { _id: '1', title: 'Alert 1', description: 'Description 1' },
        { _id: '2', title: 'Alert 2', description: 'Description 2' }
      ];

      alertData.getAllAlerts.mockResolvedValue(alerts);

      await alertController.getAlertsDashboard(req, res, next);

      expect(alertData.getAllAlerts).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          alerts
        })
      );
    });

    test('should include role permissions in response', async () => {
      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include user in response', async () => {
      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include session messages in response', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success message';

      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success message'
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty alerts list', async () => {
      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          alerts: []
        })
      );
    });

    test('should handle multiple alerts', async () => {
      const alerts = Array.from({ length: 30 }, (_, i) => ({
        _id: `${i}`,
        title: `Alert ${i}`,
        description: `Description ${i}`
      }));

      alertData.getAllAlerts.mockResolvedValue(alerts);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          alerts
        })
      );
    });

    test('should render correct template name', async () => {
      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.any(Object)
      );
    });
  });

  describe('getEditAlertForm', () => {
    
    test('should fetch and render edit form with alert data', async () => {
      const alert = { _id: '1', title: 'Test Alert', description: 'Test' };
      const permissionList = [{ _id: '1', name: 'admin_dashboard' }];
      req.params.id = '1';

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList });

      await alertController.getEditAlertForm(req, res, next);

      expect(alertData.getAlertById).toHaveBeenCalledWith('1');
      expect(res.render).toHaveBeenCalledWith(
        'alert/editAlert',
        expect.objectContaining({
          formData: alert,
          permissionList
        })
      );
    });

    test('should include role permissions in response', async () => {
      const alert = { _id: '1', title: 'Test' };
      req.params.id = '1';

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/editAlert',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      const alert = { _id: '1', title: 'Test' };
      req.params.id = '1';
      req.session.failMessage = 'Previous error';
      req.session.successMessage = 'Previous success';

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should pass user to template', async () => {
      const alert = { _id: '1', title: 'Test' };
      req.params.id = '1';

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/editAlert',
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should include messages in response', async () => {
      const alert = { _id: '1', title: 'Test' };
      req.params.id = '1';
      req.session.failMessage = 'Error message';
      req.session.successMessage = 'Success message';

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/editAlert',
        expect.objectContaining({
          failMessage: 'Error message',
          successMessage: 'Success message'
        })
      );
    });

    test('should render correct template', async () => {
      const alert = { _id: '1', title: 'Test' };
      req.params.id = '1';

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/editAlert',
        expect.any(Object)
      );
    });

    test('should fetch alert by correct ID', async () => {
      const alertId = '507f1f77bcf86cd799439012';
      const alert = { _id: alertId, title: 'Test Alert' };
      req.params.id = alertId;

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(alertData.getAlertById).toHaveBeenCalledWith(alertId);
    });
  });

  describe('updateAlertHandler', () => {
    
    test('should update alert successfully', async () => {
      const updatedAlert = { _id: '1', title: 'Updated Alert', description: 'Updated' };
      req.params.id = '1';
      req.body = { title: 'Updated Alert', description: 'Updated' };

      alertData.updateAlert.mockResolvedValue(updatedAlert);

      await alertController.updateAlertHandler(req, res, next);

      expect(alertData.updateAlert).toHaveBeenCalledWith('1', req.body);
    });

    test('should set success message after update', async () => {
      const updatedAlert = { _id: '1', title: 'Updated Alert' };
      req.params.id = '1';

      alertData.updateAlert.mockResolvedValue(updatedAlert);

      await alertController.updateAlertHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ALERT_UPDATED);
    });

    test('should redirect after successful update', async () => {
      const updatedAlert = { _id: '1', title: 'Updated Alert' };
      req.params.id = '1';

      alertData.updateAlert.mockResolvedValue(updatedAlert);

      await alertController.updateAlertHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/alerts/dashboard');
    });

    test('should pass update body to data service', async () => {
      const updateBody = { title: 'New Title', description: 'New description' };
      req.params.id = '1';
      req.body = updateBody;

      const updatedAlert = { _id: '1', ...updateBody };
      alertData.updateAlert.mockResolvedValue(updatedAlert);

      await alertController.updateAlertHandler(req, res, next);

      expect(alertData.updateAlert).toHaveBeenCalledWith('1', updateBody);
    });

    test('should handle partial updates', async () => {
      const partialUpdate = { title: 'Updated Title' };
      req.params.id = '1';
      req.body = partialUpdate;

      const updatedAlert = { _id: '1', ...partialUpdate };
      alertData.updateAlert.mockResolvedValue(updatedAlert);

      await alertController.updateAlertHandler(req, res, next);

      expect(alertData.updateAlert).toHaveBeenCalledWith('1', partialUpdate);
    });

    test('should handle alert ID in params', async () => {
      const alertId = '507f1f77bcf86cd799439011';
      req.params.id = alertId;
      req.body = { title: 'updated.alert' };

      alertData.updateAlert.mockResolvedValue({ _id: alertId });

      await alertController.updateAlertHandler(req, res, next);

      expect(alertData.updateAlert).toHaveBeenCalledWith(alertId, req.body);
    });

    test('should handle alert property changes', async () => {
      const updateBody = {
        title: 'New Title',
        description: 'New Description',
        permission: 'user_view',
        active: false,
        style: 'warning'
      };
      req.params.id = '1';
      req.body = updateBody;

      alertData.updateAlert.mockResolvedValue({ _id: '1', ...updateBody });

      await alertController.updateAlertHandler(req, res, next);

      expect(alertData.updateAlert).toHaveBeenCalledWith('1', updateBody);
    });

    test('should log operation with correct details', async () => {
      req.params.id = '1';
      req.body = { title: 'Test Alert' };

      alertData.updateAlert.mockResolvedValue({ _id: '1', title: 'Test Alert' });

      await alertController.updateAlertHandler(req, res, next);

      expect(alertData.updateAlert).toHaveBeenCalled();
    });
  });

  describe('deleteAlertHandler', () => {
    
    test('should delete alert successfully', async () => {
      const deletedAlert = { _id: '1', title: 'Deleted Alert' };
      req.params.id = '1';

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(alertData.deleteAlert).toHaveBeenCalledWith('1');
    });

    test('should return 200 status code', async () => {
      const deletedAlert = { _id: '1', title: 'Deleted Alert' };
      req.params.id = '1';

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should send JSON response with success message', async () => {
      const deletedAlert = { _id: '1', title: 'Deleted Alert' };
      req.params.id = '1';

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.ALERT_DELETED
      });
    });

    test('should handle deletion with valid alert ID', async () => {
      const alertId = '507f1f77bcf86cd799439011';
      const deletedAlert = { _id: alertId, title: 'Alert' };
      req.params.id = alertId;

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(alertData.deleteAlert).toHaveBeenCalledWith(alertId);
    });

    test('should chain status and json correctly', async () => {
      const deletedAlert = { _id: '1', title: 'Test Alert' };
      req.params.id = '1';

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.ALERT_DELETED
      });
    });

    test('should use correct param name (id)', async () => {
      const deletedAlert = { _id: '1', title: 'Test Alert' };
      req.params.id = '1';

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(alertData.deleteAlert).toHaveBeenCalledWith('1');
    });

    test('should log deletion operation', async () => {
      const deletedAlert = { _id: '1', title: 'Critical Alert' };
      req.params.id = '1';

      alertData.deleteAlert.mockResolvedValue(deletedAlert);

      await alertController.deleteAlertHandler(req, res, next);

      expect(alertData.deleteAlert).toHaveBeenCalled();
    });
  });

  describe('checkEventAlertsHandler', () => {
    
    test('should create alert for selected event', async () => {
      const newAlert = { _id: '1', title: 'Event Alert' };
      res.locals.selectedEvent = { _id: 'event123' };
      req.body = {};

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalled();
    });

    test('should set system-generated alert data', async () => {
      const newAlert = { _id: '1', title: 'Needed to define why needed this alert' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      const callArgs = alertData.createAlert.mock.calls[0][0];
      expect(callArgs.title).toContain('Needed to define');
      expect(callArgs.active).toBe(true);
    });

    test('should return error when no event selected', async () => {
      res.locals.selectedEvent = null;

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.ERROR.NO_EVENT_SELECTED
      });
    });

    test('should return error when selectedEvent is undefined', async () => {
      res.locals.selectedEvent = undefined;

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.ERROR.NO_EVENT_SELECTED
      });
    });

    test('should set success message after alert creation', async () => {
      const newAlert = { _id: '1', title: 'Event Alert' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ALERTS_CREATED);
    });

    test('should redirect to alerts dashboard', async () => {
      const newAlert = { _id: '1', title: 'Event Alert' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/alerts/dashboard');
    });

    test('should set active property to true', async () => {
      const newAlert = { _id: '1', active: true };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      const callArgs = alertData.createAlert.mock.calls[0][0];
      expect(callArgs.active).toBe(true);
    });

    test('should set correct permission for system alerts', async () => {
      const newAlert = { _id: '1' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      const callArgs = alertData.createAlert.mock.calls[0][0];
      expect(callArgs.permission).toBe('admin_dashboard');
    });

    test('should set style property for system alerts', async () => {
      const newAlert = { _id: '1' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      const callArgs = alertData.createAlert.mock.calls[0][0];
      expect(callArgs.style).toBe('info');
    });

    test('should set reappear property for system alerts', async () => {
      const newAlert = { _id: '1' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      const callArgs = alertData.createAlert.mock.calls[0][0];
      expect(callArgs.reappear).toBe(100);
    });

    test('should handle event with regular ID', async () => {
      const eventId = '507f1f77bcf86cd799439011';
      const newAlert = { _id: '1', title: 'Event Alert' };
      res.locals.selectedEvent = { _id: eventId };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(alertData.createAlert).toHaveBeenCalled();
    });

    test('should not create alert if no event ID', async () => {
      res.locals = {};

      alertData.createAlert.mockResolvedValue({ _id: '1' });

      await alertController.checkEventAlertsHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(alertData.createAlert).not.toHaveBeenCalled();
    });

    test('should include incomplete description', async () => {
      const newAlert = { _id: '1' };
      res.locals.selectedEvent = { _id: 'event123' };

      alertData.createAlert.mockResolvedValue(newAlert);

      await alertController.checkEventAlertsHandler(req, res, next);

      const callArgs = alertData.createAlert.mock.calls[0][0];
      expect(callArgs.description).toBe('Incomplete');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle database errors in getAlertsDashboard', async () => {
      const error = new Error('Database connection failed');
      alertData.getAllAlerts.mockRejectedValue(error);

      await expect(
        alertController.getAlertsDashboard(req, res, next)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle errors in create handler', async () => {
      const error = new Error('Invalid alert data');
      req.body = { title: 'Test' };

      alertData.createAlert.mockRejectedValue(error);

      await expect(
        alertController.createNewAlertHandler(req, res, next)
      ).rejects.toThrow('Invalid alert data');
    });

    test('should handle errors in update handler', async () => {
      const error = new Error('Update failed');
      req.params.id = '1';

      alertData.updateAlert.mockRejectedValue(error);

      await expect(
        alertController.updateAlertHandler(req, res, next)
      ).rejects.toThrow('Update failed');
    });

    test('should handle errors in delete handler', async () => {
      const error = new Error('Alert not found');
      req.params.id = 'invalid';

      alertData.deleteAlert.mockRejectedValue(error);

      await expect(
        alertController.deleteAlertHandler(req, res, next)
      ).rejects.toThrow('Alert not found');
    });

    test('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      error.code = 'ETIMEDOUT';

      alertData.getAllAlerts.mockRejectedValue(error);

      await expect(
        alertController.getAlertsDashboard(req, res, next)
      ).rejects.toThrow('Request timeout');
    });

    test('should handle alert form data fetch errors', async () => {
      const error = new Error('Failed to fetch form data');
      alertData.getAlertFormData.mockRejectedValue(error);

      await expect(
        alertController.getNewAlertForm(req, res, next)
      ).rejects.toThrow('Failed to fetch form data');
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should work with different user role permissions', async () => {
      req.user.role.permissions = ['limited.view'];

      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          rolePermissons: ['limited.view']
        })
      );
    });

    test('should work with admin user', async () => {
      req.user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'superadmin',
        role: {
          permissions: ['admin.*']
        }
      };

      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          user: req.user
        })
      );
    });

    test('should handle missing user role', async () => {
      req.user.role = undefined;

      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });
  });

  describe('DataServices Integration', () => {
    
    test('should call getAllAlerts once', async () => {
      alertData.getAllAlerts.mockResolvedValue([]);

      await alertController.getAlertsDashboard(req, res, next);

      expect(alertData.getAllAlerts).toHaveBeenCalledTimes(1);
    });

    test('should not modify service response data', async () => {
      const originalAlerts = [
        { _id: '1', title: 'Alert 1' },
        { _id: '2', title: 'Alert 2' }
      ];

      alertData.getAllAlerts.mockResolvedValue(originalAlerts);

      await alertController.getAlertsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/alertdash',
        expect.objectContaining({
          alerts: originalAlerts
        })
      );
    });

    test('should pass correct alert ID to getAlertById', async () => {
      const alertId = '123abc';
      const alert = { _id: alertId, title: 'Test Alert' };
      req.params.id = alertId;

      alertData.getAlertById.mockResolvedValue(alert);
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getEditAlertForm(req, res, next);

      expect(alertData.getAlertById).toHaveBeenCalledWith(alertId);
    });

    test('should call getAlertFormData during form rendering', async () => {
      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(alertData.getAlertFormData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Management', () => {
    
    test('should preserve session data in form before clearing', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = { alert: 'data' };

      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      const renderCall = res.render.mock.calls[0];
      expect(renderCall[1].failMessage).toBe('Error');
      expect(renderCall[1].successMessage).toBe('Success');
      expect(renderCall[1].formData).toEqual({ alert: 'data' });
    });

    test('should handle null session values', async () => {
      req.session.failMessage = null;
      req.session.successMessage = null;
      req.session.formData = null;

      alertData.getAlertFormData.mockResolvedValue({ permissionList: [] });

      await alertController.getNewAlertForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'alert/newAlert',
        expect.objectContaining({
          failMessage: null,
          successMessage: null,
          formData: null
        })
      );
    });
  });

});

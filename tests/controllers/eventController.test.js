// tests/controllers/eventController.test.js - Event Controller Unit Tests
import eventController from '../../controllers/eventController.js';
import * as eventData from '../../DataServices/eventData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/eventData.js');
jest.mock('../../logger.js');
jest.mock('console');

describe('Event Controller - Unit Tests', () => {
  
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
    EventName: 'Test Event Display',
    date: '2024-06-15',
    location: 'Test Location'
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
        successMessage: null,
        selectedEvent: null
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

  describe('renderNew', () => {
    
    test('should render new event form', () => {
      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.any(Object)
      );
    });

    test('should pass session messages to form', () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success message';

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success message'
        })
      );
    });

    test('should pass user role permissions to form', () => {
      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass user context to form', () => {
      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should clear failMessage after rendering', () => {
      req.session.failMessage = 'Error';

      eventController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', () => {
      req.session.successMessage = 'Success';

      eventController.renderNew(req, res);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass formData from session', () => {
      req.session.formData = { name: 'Test Event' };

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          formData: { name: 'Test Event' }
        })
      );
    });

    test('should handle null user', () => {
      req.user = null;

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          rolePermissons: undefined,
          user: null
        })
      );
    });

    test('should handle missing user role', () => {
      req.user.role = null;

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });
  });

  describe('createNew', () => {
    
    test('should create new event successfully', async () => {
      req.body = { name: 'New Event', date: '2024-06-15' };

      eventData.createEvent.mockResolvedValue(mockEvent);

      await eventController.createNew(req, res, next);

      expect(eventData.createEvent).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = { name: 'New Event' };

      eventData.createEvent.mockResolvedValue(mockEvent);

      await eventController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.EVENT_CREATED);
    });

    test('should redirect to event dashboard', async () => {
      req.body = { name: 'New Event' };

      eventData.createEvent.mockResolvedValue(mockEvent);

      await eventController.createNew(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/event/dashboard');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.body = { name: 'New Event' };

      eventData.createEvent.mockRejectedValue(error);

      await expect(
        eventController.createNew(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('dashboard', () => {
    
    test('should render event dashboard', async () => {
      const events = [mockEvent];

      eventData.getAllEvents.mockResolvedValue(events);

      await eventController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/eventdash',
        expect.any(Object)
      );
    });

    test('should fetch all events from DataServices', async () => {
      eventData.getAllEvents.mockResolvedValue([mockEvent]);

      await eventController.dashboard(req, res, next);

      expect(eventData.getAllEvents).toHaveBeenCalled();
    });

    test('should pass events to template', async () => {
      const events = [mockEvent];

      eventData.getAllEvents.mockResolvedValue(events);

      await eventController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/eventdash',
        expect.objectContaining({
          events
        })
      );
    });

    test('should pass session messages to dashboard', async () => {
      req.session.successMessage = 'Event updated';
      req.session.failMessage = 'Some error';

      eventData.getAllEvents.mockResolvedValue([]);

      await eventController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/eventdash',
        expect.objectContaining({
          successMessage: 'Event updated',
          failMessage: 'Some error'
        })
      );
    });

    test('should clear messages after rendering', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      eventData.getAllEvents.mockResolvedValue([]);

      await eventController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle empty events array', async () => {
      eventData.getAllEvents.mockResolvedValue([]);

      await eventController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/eventdash',
        expect.objectContaining({
          events: []
        })
      );
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      eventData.getAllEvents.mockRejectedValue(error);

      await expect(
        eventController.dashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editGet', () => {
    
    test('should render edit event form', async () => {
      req.params.id = 'event123';

      eventData.getEventById.mockResolvedValue(mockEvent);

      await eventController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/editEvent',
        expect.any(Object)
      );
    });

    test('should fetch event by ID', async () => {
      req.params.id = 'event123';

      eventData.getEventById.mockResolvedValue(mockEvent);

      await eventController.editGet(req, res, next);

      expect(eventData.getEventById).toHaveBeenCalledWith('event123');
    });

    test('should pass event data to edit form', async () => {
      req.params.id = 'event123';

      eventData.getEventById.mockResolvedValue(mockEvent);

      await eventController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/editEvent',
        expect.objectContaining({
          formData: mockEvent
        })
      );
    });

    test('should clear session messages', async () => {
      req.params.id = 'event123';
      req.session.failMessage = 'Error';

      eventData.getEventById.mockResolvedValue(mockEvent);

      await eventController.editGet(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'event123';

      eventData.getEventById.mockRejectedValue(error);

      await expect(
        eventController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editPost', () => {
    
    test('should update event successfully', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Updated Event' };

      eventData.updateEvent.mockResolvedValue(mockEvent);

      await eventController.editPost(req, res, next);

      expect(eventData.updateEvent).toHaveBeenCalledWith('event123', req.body);
    });

    test('should set success message after update', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Updated Event' };

      eventData.updateEvent.mockResolvedValue(mockEvent);

      await eventController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.EVENT_UPDATED);
    });

    test('should redirect to event dashboard', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Updated Event' };

      eventData.updateEvent.mockResolvedValue(mockEvent);

      await eventController.editPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/admin/event/dashboard');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'event123';
      req.body = { name: 'Updated Event' };

      eventData.updateEvent.mockRejectedValue(error);

      await expect(
        eventController.editPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('details', () => {
    
    test('should render event details', async () => {
      req.params.id = 'event123';
      const users = [mockUser1, mockUser2];

      eventData.getEventById.mockResolvedValue(mockEvent);
      eventData.getAllUsers.mockResolvedValue(users);

      await eventController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/EventDetail',
        expect.any(Object)
      );
    });

    test('should fetch event and users', async () => {
      req.params.id = 'event123';

      eventData.getEventById.mockResolvedValue(mockEvent);
      eventData.getAllUsers.mockResolvedValue([]);

      await eventController.details(req, res, next);

      expect(eventData.getEventById).toHaveBeenCalledWith('event123');
      expect(eventData.getAllUsers).toHaveBeenCalled();
    });

    test('should pass event data to template', async () => {
      req.params.id = 'event123';

      eventData.getEventById.mockResolvedValue(mockEvent);
      eventData.getAllUsers.mockResolvedValue([]);

      await eventController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/EventDetail',
        expect.objectContaining({
          formData: mockEvent
        })
      );
    });

    test('should pass users to template', async () => {
      req.params.id = 'event123';
      const users = [mockUser1, mockUser2];

      eventData.getEventById.mockResolvedValue(mockEvent);
      eventData.getAllUsers.mockResolvedValue(users);

      await eventController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/EventDetail',
        expect.objectContaining({
          users
        })
      );
    });

    test('should clear session messages', async () => {
      req.params.id = 'event123';
      req.session.failMessage = 'Error';

      eventData.getEventById.mockResolvedValue(mockEvent);
      eventData.getAllUsers.mockResolvedValue([]);

      await eventController.details(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'event123';

      eventData.getEventById.mockRejectedValue(error);

      await expect(
        eventController.details(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteResponsiblePersonHandler', () => {
    
    test('should delete responsible person successfully', async () => {
      req.params.id = 'event123';
      req.body = { name: 'John Doe', userId: 'user1' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      expect(eventData.deleteResponsiblePerson).toHaveBeenCalledWith('event123', req.body);
    });

    test('should return status OK', async () => {
      req.params.id = 'event123';
      req.body = { name: 'John Doe', userId: 'user1' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return JSON response with person name and deleted message', async () => {
      req.params.id = 'event123';
      req.body = { name: 'John Doe', userId: 'user1' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('John Doe');
      expect(response.message).toContain(MESSAGES.SUCCESS.RESPONSIBLE_PERSON_DELETED);
      expect(response.message).toContain(mockUser.username);
    });

    test('should include user username in response message', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Jane Smith', userId: 'user2' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain(req.user.username);
    });

    test('should construct message correctly with person name', async () => {
      req.params.id = 'event123';
      const personName = 'Test Person';
      req.body = { name: personName, userId: 'user1' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toMatch(new RegExp(personName));
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'event123';
      req.body = { name: 'John Doe', userId: 'user1' };

      eventData.deleteResponsiblePerson.mockRejectedValue(error);

      await expect(
        eventController.deleteResponsiblePersonHandler(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle special characters in person name', async () => {
      req.params.id = 'event123';
      req.body = { name: "O'Brien-Smith", userId: 'user1' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain("O'Brien-Smith");
    });
  });

  describe('addResponsiblePersonHandler', () => {
    
    test('should add responsible person successfully', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Jane Doe', userId: 'user2' };

      eventData.addResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.addResponsiblePersonHandler(req, res, next);

      expect(eventData.addResponsiblePerson).toHaveBeenCalledWith('event123', req.body);
    });

    test('should return status OK', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Jane Doe', userId: 'user2' };

      eventData.addResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.addResponsiblePersonHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Jane Doe', userId: 'user2' };

      eventData.addResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.addResponsiblePersonHandler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.RESPONSIBLE_PERSON_ADDED
      });
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'event123';
      req.body = { name: 'Jane Doe', userId: 'user2' };

      eventData.addResponsiblePerson.mockRejectedValue(error);

      await expect(
        eventController.addResponsiblePersonHandler(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('selectEventHandler', () => {
    
    test('should select event successfully', async () => {
      req.params.eventId = 'event123';

      eventData.selectEvent.mockResolvedValue(mockEvent);

      await eventController.selectEventHandler(req, res, next);

      expect(eventData.selectEvent).toHaveBeenCalledWith('event123');
    });

    test('should store event ID in session', async () => {
      req.params.eventId = 'event123';

      eventData.selectEvent.mockResolvedValue(mockEvent);

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.selectedEvent).toBe(mockEvent._id);
    });

    test('should set success message with event name', async () => {
      req.params.eventId = 'event123';

      eventData.selectEvent.mockResolvedValue(mockEvent);

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.successMessage).toContain(MESSAGES.SUCCESS.EVENT_SELECTED);
      expect(req.session.successMessage).toContain(mockEvent.EventName);
    });

    test('should return status OK', async () => {
      req.params.eventId = 'event123';

      eventData.selectEvent.mockResolvedValue(mockEvent);

      await eventController.selectEventHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return JSON response with success message and event name', async () => {
      req.params.eventId = 'event123';

      eventData.selectEvent.mockResolvedValue(mockEvent);

      await eventController.selectEventHandler(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain(MESSAGES.SUCCESS.EVENT_SELECTED);
      expect(response.message).toContain(mockEvent.EventName);
    });

    test('should construct message correctly', async () => {
      req.params.eventId = 'event123';
      const eventName = 'National Championships';

      const event = { ...mockEvent, EventName: eventName, _id: 'event123' };

      eventData.selectEvent.mockResolvedValue(event);

      await eventController.selectEventHandler(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toMatch(new RegExp(eventName));
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.eventId = 'event123';

      eventData.selectEvent.mockRejectedValue(error);

      await expect(
        eventController.selectEventHandler(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle event with special characters in name', async () => {
      req.params.eventId = 'event123';
      const event = { ...mockEvent, EventName: "2024 Spring O'Cup & League" };

      eventData.selectEvent.mockResolvedValue(event);

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.successMessage).toContain("2024 Spring O'Cup & League");
    });

    test('should store correct event ID from response', async () => {
      req.params.eventId = 'event123';
      const eventId = 'specific_event_id';
      const event = { ...mockEvent, _id: eventId };

      eventData.selectEvent.mockResolvedValue(event);

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.selectedEvent).toBe(eventId);
    });
  });

  describe('Error Handling', () => {
    
    test('should handle null user in permissions', () => {
      req.user = null;

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          rolePermissons: undefined,
          user: null
        })
      );
    });

    test('should handle missing user role', () => {
      req.user.role = null;

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing user role permissions', () => {
      req.user.role.permissions = null;

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          rolePermissons: null
        })
      );
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should include user permissions in all form renders', async () => {
      req.user.role.permissions = ['view', 'edit'];

      eventData.getEventById.mockResolvedValue(mockEvent);

      await eventController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'event/editEvent',
        expect.objectContaining({
          rolePermissons: ['view', 'edit']
        })
      );
    });

    test('should pass different user contexts', () => {
      const customUser = { ...mockUser, username: 'custom_user' };
      req.user = customUser;

      eventController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'event/newEvent',
        expect.objectContaining({
          user: customUser
        })
      );
    });

    test('should use user ID in responsible person operations', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Jane Doe', userId: 'user2' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain(req.user.username);
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify DataServices calls with correct IDs', async () => {
      req.params.id = 'event123';
      req.body = { name: 'Updated' };

      eventData.updateEvent.mockResolvedValue(mockEvent);

      await eventController.editPost(req, res, next);

      expect(eventData.updateEvent).toHaveBeenCalledWith('event123', req.body);
    });

    test('should pass complete request body to createEvent', async () => {
      const eventData_input = {
        name: 'New Event',
        date: '2024-06-15',
        location: 'Stadium',
        description: 'Test event'
      };

      req.body = eventData_input;

      eventData.createEvent.mockResolvedValue(mockEvent);

      await eventController.createNew(req, res, next);

      expect(eventData.createEvent).toHaveBeenCalledWith(eventData_input);
    });

    test('should fetch events and users in details', async () => {
      req.params.id = 'event123';
      const users = [mockUser1, mockUser2];

      eventData.getEventById.mockResolvedValue(mockEvent);
      eventData.getAllUsers.mockResolvedValue(users);

      await eventController.details(req, res, next);

      expect(eventData.getEventById).toHaveBeenCalledWith('event123');
      expect(eventData.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    
    test('should preserve formData in session during renderNew', () => {
      const formData = { name: 'Test' };
      req.session.formData = formData;

      eventController.renderNew(req, res);

      expect(req.session.formData).toEqual(formData);
    });

    test('should clear messages independently', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      eventData.getAllEvents.mockResolvedValue([]);

      await eventController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should not clear formData on operations', async () => {
      const formData = { name: 'Test' };
      req.session.formData = formData;
      req.params.id = 'event123';
      req.body = { name: 'Updated' };

      eventData.updateEvent.mockResolvedValue(mockEvent);

      await eventController.editPost(req, res, next);

      expect(req.session.formData).toEqual(formData);
    });

    test('should set selectedEvent in session when event selected', async () => {
      req.params.eventId = 'event123';
      const selectedEventId = 'selected_event_id';

      eventData.selectEvent.mockResolvedValue({
        ...mockEvent,
        _id: selectedEventId
      });

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.selectedEvent).toBe(selectedEventId);
    });

    test('should set successMessage with event name in selectEventHandler', async () => {
      req.params.eventId = 'event123';
      const eventName = 'Spring Tournament';

      eventData.selectEvent.mockResolvedValue({
        ...mockEvent,
        EventName: eventName
      });

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.successMessage).toContain(eventName);
    });
  });

  describe('Message Formatting', () => {
    
    test('should format delete message with person name', async () => {
      req.params.id = 'event123';
      const personName = 'Alice Smith';
      req.body = { name: personName, userId: 'user1' };

      eventData.deleteResponsiblePerson.mockResolvedValue(mockEvent);

      await eventController.deleteResponsiblePersonHandler(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe(personName + ' ' + MESSAGES.SUCCESS.RESPONSIBLE_PERSON_DELETED + req.user.username);
    });

    test('should format select message with event name', async () => {
      req.params.eventId = 'event123';
      const eventName = 'Summer Games 2024';

      eventData.selectEvent.mockResolvedValue({
        ...mockEvent,
        EventName: eventName,
        _id: 'event123'
      });

      await eventController.selectEventHandler(req, res, next);

      const expectedMessage = MESSAGES.SUCCESS.EVENT_SELECTED + ' ' + eventName;
      expect(req.session.successMessage).toBe(expectedMessage);
    });

    test('should handle unicode in event names', async () => {
      req.params.eventId = 'event123';
      const eventName = 'Nyári Versenyek 2024';

      eventData.selectEvent.mockResolvedValue({
        ...mockEvent,
        EventName: eventName
      });

      await eventController.selectEventHandler(req, res, next);

      expect(req.session.successMessage).toContain('Nyári Versenyek 2024');
    });
  });

});

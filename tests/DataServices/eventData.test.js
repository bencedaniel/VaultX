import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteResponsiblePerson,
  addResponsiblePerson,
  selectEvent,
  getAllPermissions,
  getAllUsers
} from '../../DataServices/eventData.js';
import Event from '../../models/Event.js';
import Permissions from '../../models/Permissions.js';
import User from '../../models/User.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Event.js', () => {
  const EventMock = jest.fn();
  EventMock.find = jest.fn();
  EventMock.findById = jest.fn();
  EventMock.findByIdAndUpdate = jest.fn();
  EventMock.setSelected = jest.fn();

  return {
    __esModule: true,
    default: EventMock
  };
});

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/User.js', () => ({
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

describe('eventData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllEvents', () => {
    test('returns all events sorted by name', async () => {
      const events = [{ _id: 'e1', name: 'A Event' }];
      const sortMock = jest.fn().mockResolvedValue(events);
      Event.find.mockReturnValue({ sort: sortMock });

      const result = await getAllEvents();

      expect(Event.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(events);
    });

    test('propagates query errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('query failed'));
      Event.find.mockReturnValue({ sort: sortMock });

      await expect(getAllEvents()).rejects.toThrow('query failed');
    });
  });

  describe('getEventById', () => {
    test('returns event by id when found', async () => {
      const event = { _id: 'e1', name: 'Main Event' };
      Event.findById.mockResolvedValue(event);

      const result = await getEventById('e1');

      expect(Event.findById).toHaveBeenCalledWith('e1');
      expect(result).toEqual(event);
    });

    test('throws when event is not found', async () => {
      Event.findById.mockResolvedValue(null);

      await expect(getEventById('missing')).rejects.toThrow('Event not found');
    });
  });

  describe('createEvent', () => {
    test('creates, saves and logs event', async () => {
      const payload = { name: 'New Event' };
      const created = {
        _id: 'e1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Event.mockImplementation(() => created);

      const result = await createEvent(payload);

      expect(Event).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Event', 'e1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 'e1',
        name: 'Broken Event',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Event.mockImplementation(() => created);

      await expect(createEvent({ name: 'Broken Event' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    test('updates event and logs update when found', async () => {
      const updated = { _id: 'e1', name: 'Updated Event' };
      const payload = { name: 'Updated Event' };
      Event.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateEvent('e1', payload);

      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith(
        'e1',
        payload,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Event', 'e1');
      expect(result).toEqual(updated);
    });

    test('throws when event is not found during update', async () => {
      Event.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateEvent('missing', { name: 'X' })).rejects.toThrow('Event not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors', async () => {
      Event.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateEvent('e1', { name: 'X' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteResponsiblePerson', () => {
    test('removes matching official, updates event and logs', async () => {
      const event = {
        _id: 'e1',
        AssignedOfficials: [
          { name: 'Alice', role: 'Judge', contact: '123' },
          { name: 'Bob', role: 'Office', contact: '456' }
        ]
      };
      Event.findById.mockResolvedValue(event);
      Event.findByIdAndUpdate.mockResolvedValue(event);

      const result = await deleteResponsiblePerson('e1', {
        name: 'Alice',
        role: 'Judge',
        contact: '123'
      });

      expect(Event.findById).toHaveBeenCalledWith('e1');
      expect(event.AssignedOfficials).toEqual([{ name: 'Bob', role: 'Office', contact: '456' }]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Event', 'e1');
      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith('e1', event, { runValidators: true });
      expect(result).toBe(event);
    });

    test('throws when event is not found', async () => {
      Event.findById.mockResolvedValue(null);

      await expect(
        deleteResponsiblePerson('missing', { name: 'Alice', role: 'Judge', contact: '123' })
      ).rejects.toThrow('Event not found');

      expect(Event.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('addResponsiblePerson', () => {
    test('adds official, updates event and logs', async () => {
      const event = {
        _id: 'e1',
        AssignedOfficials: []
      };
      Event.findById.mockResolvedValue(event);
      Event.findByIdAndUpdate.mockResolvedValue(event);

      const result = await addResponsiblePerson('e1', {
        name: 'Alice',
        role: 'Judge',
        contact: '123',
        userID: 'u1'
      });

      expect(Event.findById).toHaveBeenCalledWith('e1');
      expect(event.AssignedOfficials).toEqual([
        { name: 'Alice', role: 'Judge', contact: '123', userID: 'u1' }
      ]);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Event', 'e1');
      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith('e1', event, { runValidators: true });
      expect(result).toBe(event);
    });

    test('throws when event is not found', async () => {
      Event.findById.mockResolvedValue(null);

      await expect(
        addResponsiblePerson('missing', {
          name: 'Alice',
          role: 'Judge',
          contact: '123',
          userID: 'u1'
        })
      ).rejects.toThrow('Event not found');

      expect(Event.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('selectEvent', () => {
    test('returns event and calls setSelected', async () => {
      const event = { _id: 'e1', name: 'Main Event' };
      Event.findById.mockResolvedValue(event);
      Event.setSelected.mockResolvedValue(undefined);

      const result = await selectEvent('e1');

      expect(Event.findById).toHaveBeenCalledWith('e1');
      expect(Event.setSelected).toHaveBeenCalledWith('e1');
      expect(result).toEqual(event);
    });

    test('throws when event not found', async () => {
      Event.findById.mockResolvedValue(null);

      await expect(selectEvent('missing')).rejects.toThrow('Event not found');
      expect(Event.setSelected).not.toHaveBeenCalled();
    });
  });

  describe('getAllPermissions', () => {
    test('returns all permissions', async () => {
      const permissions = [{ _id: 'p1', name: 'events.read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getAllPermissions();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });
  });

  describe('getAllUsers', () => {
    test('returns users with selected fields', async () => {
      const users = [{ _id: 'u1', username: 'alice' }];
      const selectMock = jest.fn().mockResolvedValue(users);
      User.find.mockReturnValue({ select: selectMock });

      const result = await getAllUsers();

      expect(User.find).toHaveBeenCalledTimes(1);
      expect(selectMock).toHaveBeenCalledWith('_id username');
      expect(result).toEqual(users);
    });

    test('propagates select errors', async () => {
      const selectMock = jest.fn().mockRejectedValue(new Error('select failed'));
      User.find.mockReturnValue({ select: selectMock });

      await expect(getAllUsers()).rejects.toThrow('select failed');
    });
  });
});

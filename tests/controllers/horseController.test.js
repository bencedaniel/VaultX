// tests/controllers/horseController.test.js - Horse Controller Unit Tests
import horseController from '../../controllers/horseController.js';
import * as horseData from '../../DataServices/horseData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/horseData.js');
jest.mock('../../logger.js');
jest.mock('console');

describe('Horse Controller - Unit Tests', () => {
  
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

  const mockHorse = {
    _id: 'horse123',
    Horsename: 'Thunder',
    HorseName: 'Thunder',
    name: 'Thunder',
    breed: 'Thoroughbred',
    color: 'Black',
    age: 8,
    HeadNr: [
      { eventID: 'event123', number: 1 },
      { eventID: 'event456', number: 2 }
    ],
    BoxNr: [
      { eventID: 'event123', number: 10 },
      { eventID: 'event456', number: 20 }
    ]
  };

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
    'Argentina', 'Austria', 'Australia', 'Belgium', 'Brazil',
    'Canada', 'China', 'France', 'Germany', 'Hungary',
    'India', 'Italy', 'Japan', 'Mexico', 'Netherlands',
    'Poland', 'Russia', 'Spain', 'Sweden', 'Switzerland',
    'Turkey', 'Ukraine', 'United Kingdom', 'United States'
  ];

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
        selectedEvent: { ...mockEvent }
      }
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('renderNew', () => {
    
    test('should render new horse form with countries', () => {
      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.any(Object)
      );
    });

    test('should pass countries array to form', () => {
      horseController.renderNew(req, res);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.countries).toBeDefined();
      expect(Array.isArray(renderCall.countries)).toBe(true);
    });

    test('should include essential countries in array', () => {
      horseController.renderNew(req, res);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.countries).toContain('Hungary');
      expect(renderCall.countries).toContain('United States');
      expect(renderCall.countries).toContain('Germany');
    });

    test('should pass session messages to form', () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Horse added';

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Horse added'
        })
      );
    });

    test('should pass user role permissions', () => {
      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should pass user context', () => {
      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          user: JSON.parse(JSON.stringify(mockUser))
        })
      );
    });

    test('should clear failMessage after rendering', () => {
      req.session.failMessage = 'Error';

      horseController.renderNew(req, res);

      expect(req.session.failMessage).toBeNull();
    });

    test('should clear successMessage after rendering', () => {
      req.session.successMessage = 'Success';

      horseController.renderNew(req, res);

      expect(req.session.successMessage).toBeNull();
    });

    test('should pass formData from session', () => {
      req.session.formData = { Horsename: 'Thunder' };

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          formData: { Horsename: 'Thunder' }
        })
      );
    });

    test('should handle null user permissions', () => {
      req.user.role = null;

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });
  });

  describe('createNew', () => {
    
    test('should create new horse successfully', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10',
        breed: 'Thoroughbred',
        color: 'Black'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      expect(horseData.createHorse).toHaveBeenCalledWith(
        expect.any(Object),
        '1',
        '10',
        'event123'
      );
    });

    test('should extract HeadNr and BoxNr before creating', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '5',
        BoxNr: '15',
        breed: 'Thoroughbred'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      const callArgs = horseData.createHorse.mock.calls[0];
      expect(callArgs[1]).toBe('5');
      expect(callArgs[2]).toBe('15');
    });

    test('should remove HeadNr and BoxNr from request body', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10',
        breed: 'Thoroughbred'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      const bodyArg = horseData.createHorse.mock.calls[0][0];
      expect(bodyArg.HeadNr).toBeUndefined();
      expect(bodyArg.BoxNr).toBeUndefined();
    });

    test('should use selectedEvent._id for horse creation', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      const callArgs = horseData.createHorse.mock.calls[0];
      expect(callArgs[3]).toBe('event123');
    });

    test('should set success message after creation', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.HORSE_CREATED);
    });

    test('should redirect to horse dashboard', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/horse/dashboard');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.createHorse.mockRejectedValue(error);

      await expect(
        horseController.createNew(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('dashboard', () => {
    
    test('should render horse dashboard', async () => {
      horseData.getAllHorses.mockResolvedValue([mockHorse]);

      await horseController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/horsedash',
        expect.any(Object)
      );
    });

    test('should fetch all horses from DataServices', async () => {
      horseData.getAllHorses.mockResolvedValue([mockHorse]);

      await horseController.dashboard(req, res, next);

      expect(horseData.getAllHorses).toHaveBeenCalled();
    });

    test('should filter HeadNr by event ID', async () => {
      horseData.getAllHorses.mockResolvedValue([mockHorse]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      const horse = renderCall.horses[0];
      
      expect(horse.HeadNr.length).toBe(1);
      expect(horse.HeadNr[0].eventID).toBe('event123');
    });

    test('should filter BoxNr by event ID', async () => {
      horseData.getAllHorses.mockResolvedValue([mockHorse]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      const horse = renderCall.horses[0];
      
      expect(horse.BoxNr.length).toBe(1);
      expect(horse.BoxNr[0].eventID).toBe('event123');
    });

    test('should use string comparison for event ID filtering', async () => {
      const horseWithNumberEventId = {
        ...mockHorse,
        HeadNr: [{ eventID: 123, number: 1 }],
        BoxNr: [{ eventID: 123, number: 10 }]
      };

      res.locals.selectedEvent._id = '123';

      horseData.getAllHorses.mockResolvedValue([horseWithNumberEventId]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].HeadNr.length).toBe(1);
    });

    test('should pass session messages', async () => {
      req.session.successMessage = 'Horse updated';
      req.session.failMessage = 'Error occurred';

      horseData.getAllHorses.mockResolvedValue([]);

      await horseController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/horsedash',
        expect.objectContaining({
          successMessage: 'Horse updated',
          failMessage: 'Error occurred'
        })
      );
    });

    test('should clear messages after rendering', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      horseData.getAllHorses.mockResolvedValue([]);

      await horseController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle empty horses array', async () => {
      horseData.getAllHorses.mockResolvedValue([]);

      await horseController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/horsedash',
        expect.objectContaining({
          horses: []
        })
      );
    });

    test('should handle multiple horses', async () => {
      const horses = [
        mockHorse,
        { ...mockHorse, _id: 'horse456', Horsename: 'Storm' }
      ];

      horseData.getAllHorses.mockResolvedValue(horses);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses.length).toBe(2);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      horseData.getAllHorses.mockRejectedValue(error);

      await expect(
        horseController.dashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('details', () => {
    
    test('should render horse details page', async () => {
      req.params.id = 'horse123';

      horseData.getHorseByIdWithPopulation.mockResolvedValue(mockHorse);

      await horseController.details(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/horseDetail',
        expect.any(Object)
      );
    });

    test('should fetch horse with population', async () => {
      req.params.id = 'horse123';

      horseData.getHorseByIdWithPopulation.mockResolvedValue(mockHorse);

      await horseController.details(req, res, next);

      expect(horseData.getHorseByIdWithPopulation).toHaveBeenCalledWith('horse123');
    });

    test('should filter HeadNr by event ID', async () => {
      req.params.id = 'horse123';

      horseData.getHorseByIdWithPopulation.mockResolvedValue(mockHorse);

      await horseController.details(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.formData.HeadNr.length).toBe(1);
      expect(renderCall.formData.HeadNr[0].eventID).toBe('event123');
    });

    test('should filter BoxNr by event ID', async () => {
      req.params.id = 'horse123';

      horseData.getHorseByIdWithPopulation.mockResolvedValue(mockHorse);

      await horseController.details(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.formData.BoxNr.length).toBe(1);
      expect(renderCall.formData.BoxNr[0].eventID).toBe('event123');
    });

    test('should clear session messages', async () => {
      req.params.id = 'horse123';
      req.session.failMessage = 'Error';

      horseData.getHorseByIdWithPopulation.mockResolvedValue(mockHorse);

      await horseController.details(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'horse123';

      horseData.getHorseByIdWithPopulation.mockRejectedValue(error);

      await expect(
        horseController.details(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editGet', () => {
    
    test('should render edit horse form', async () => {
      req.params.id = 'horse123';

      horseData.getHorseById.mockResolvedValue(mockHorse);

      await horseController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/editHorse',
        expect.any(Object)
      );
    });

    test('should fetch horse by ID', async () => {
      req.params.id = 'horse123';

      horseData.getHorseById.mockResolvedValue(mockHorse);

      await horseController.editGet(req, res, next);

      expect(horseData.getHorseById).toHaveBeenCalledWith('horse123');
    });

    test('should pass countries array to form', async () => {
      req.params.id = 'horse123';

      horseData.getHorseById.mockResolvedValue(mockHorse);

      await horseController.editGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.countries).toBeDefined();
      expect(Array.isArray(renderCall.countries)).toBe(true);
    });

    test('should filter HeadNr by event ID', async () => {
      req.params.id = 'horse123';

      horseData.getHorseById.mockResolvedValue(mockHorse);

      await horseController.editGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.formData.HeadNr.length).toBe(1);
    });

    test('should filter BoxNr by event ID', async () => {
      req.params.id = 'horse123';

      horseData.getHorseById.mockResolvedValue(mockHorse);

      await horseController.editGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.formData.BoxNr.length).toBe(1);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'horse123';

      horseData.getHorseById.mockRejectedValue(error);

      await expect(
        horseController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editPost', () => {
    
    test('should update horse successfully', async () => {
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Updated Thunder',
        HeadNr: '2',
        BoxNr: '20',
        breed: 'Thoroughbred'
      };

      horseData.updateHorse.mockResolvedValue(mockHorse);

      await horseController.editPost(req, res, next);

      expect(horseData.updateHorse).toHaveBeenCalledWith(
        'horse123',
        expect.any(Object),
        '2',
        '20',
        'event123'
      );
    });

    test('should extract HeadNr and BoxNr before update', async () => {
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '3',
        BoxNr: '30',
        breed: 'Thoroughbred'
      };

      horseData.updateHorse.mockResolvedValue(mockHorse);

      await horseController.editPost(req, res, next);

      const callArgs = horseData.updateHorse.mock.calls[0];
      expect(callArgs[2]).toBe('3');
      expect(callArgs[3]).toBe('30');
    });

    test('should remove HeadNr and BoxNr from body before DataServices call', async () => {
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10',
        breed: 'Thoroughbred'
      };

      horseData.updateHorse.mockResolvedValue(mockHorse);

      await horseController.editPost(req, res, next);

      const bodyArg = horseData.updateHorse.mock.calls[0][1];
      expect(bodyArg.HeadNr).toBeUndefined();
      expect(bodyArg.BoxNr).toBeUndefined();
    });

    test('should set success message after update', async () => {
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.updateHorse.mockResolvedValue(mockHorse);

      await horseController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.HORSE_UPDATED);
    });

    test('should redirect to horse dashboard', async () => {
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.updateHorse.mockResolvedValue(mockHorse);

      await horseController.editPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/horse/dashboard');
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10'
      };

      horseData.updateHorse.mockRejectedValue(error);

      await expect(
        horseController.editPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteNote', () => {
    
    test('should delete horse note successfully', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'note123' };

      horseData.deleteHorseNote.mockResolvedValue(mockHorse);

      await horseController.deleteNote(req, res, next);

      expect(horseData.deleteHorseNote).toHaveBeenCalledWith('horse123', 'note123');
    });

    test('should return status OK', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'note123' };

      horseData.deleteHorseNote.mockResolvedValue(mockHorse);

      await horseController.deleteNote(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'note123' };

      horseData.deleteHorseNote.mockResolvedValue(mockHorse);

      await horseController.deleteNote(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.NOTE_DELETED
      });
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'horse123';
      req.body = { note: 'note123' };

      horseData.deleteHorseNote.mockRejectedValue(error);

      await expect(
        horseController.deleteNote(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('newNotePost', () => {
    
    test('should add new horse note successfully', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'Good temperament' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      expect(horseData.addHorseNote).toHaveBeenCalled();
    });

    test('should construct note data with user ID', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'Good temperament' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      const callArgs = horseData.addHorseNote.mock.calls[0];
      expect(callArgs[1].user).toBe('user123');
    });

    test('should construct note data with event ID', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'Good temperament' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      const callArgs = horseData.addHorseNote.mock.calls[0];
      expect(callArgs[1].eventID).toBe('event123');
    });

    test('should construct note data with note text', async () => {
      req.params.id = 'horse123';
      const noteText = 'Excellent condition';
      req.body = { note: noteText };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      const callArgs = horseData.addHorseNote.mock.calls[0];
      expect(callArgs[1].note).toBe(noteText);
    });

    test('should return status OK', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'Good temperament' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'Good temperament' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.NOTE_ADDED
      });
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'horse123';
      req.body = { note: 'Good temperament' };

      horseData.addHorseNote.mockRejectedValue(error);

      await expect(
        horseController.newNotePost(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle special characters in note', async () => {
      req.params.id = 'horse123';
      req.body = { note: "Needs check-up & vaccination's today" };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      const callArgs = horseData.addHorseNote.mock.calls[0];
      expect(callArgs[1].note).toBe("Needs check-up & vaccination's today");
    });
  });

  describe('numbersGet', () => {
    
    test('should render horse numbers edit page', async () => {
      horseData.getHorsesForEvent.mockResolvedValue([mockHorse]);

      await horseController.numbersGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/numberedit',
        expect.any(Object)
      );
    });

    test('should fetch horses for selected event', async () => {
      horseData.getHorsesForEvent.mockResolvedValue([mockHorse]);

      await horseController.numbersGet(req, res, next);

      expect(horseData.getHorsesForEvent).toHaveBeenCalledWith('event123');
    });

    test('should filter HeadNr by event ID', async () => {
      horseData.getHorsesForEvent.mockResolvedValue([mockHorse]);

      await horseController.numbersGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].HeadNr.length).toBe(1);
      expect(renderCall.horses[0].HeadNr[0].eventID).toBe('event123');
    });

    test('should filter BoxNr by event ID', async () => {
      horseData.getHorsesForEvent.mockResolvedValue([mockHorse]);

      await horseController.numbersGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].BoxNr.length).toBe(1);
      expect(renderCall.horses[0].BoxNr[0].eventID).toBe('event123');
    });

    test('should pass session messages', async () => {
      req.session.successMessage = 'Numbers updated';
      req.session.failMessage = null;

      horseData.getHorsesForEvent.mockResolvedValue([]);

      await horseController.numbersGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/numberedit',
        expect.objectContaining({
          successMessage: 'Numbers updated'
        })
      );
    });

    test('should clear messages after rendering', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      horseData.getHorsesForEvent.mockResolvedValue([]);

      await horseController.numbersGet(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle multiple horses for event', async () => {
      const horses = [
        mockHorse,
        { ...mockHorse, _id: 'horse456', Horsename: 'Storm' }
      ];

      horseData.getHorsesForEvent.mockResolvedValue(horses);

      await horseController.numbersGet(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses.length).toBe(2);
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      horseData.getHorsesForEvent.mockRejectedValue(error);

      await expect(
        horseController.numbersGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateNums', () => {
    
    test('should update horse numbers successfully', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '5', boxNumber: '50' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      expect(horseData.updateHorseNumbers).toHaveBeenCalledWith(
        'horse123',
        '5',
        '50',
        'event123'
      );
    });

    test('should pass correct head number', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '7', boxNumber: '70' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      const callArgs = horseData.updateHorseNumbers.mock.calls[0];
      expect(callArgs[1]).toBe('7');
    });

    test('should pass correct box number', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '7', boxNumber: '70' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      const callArgs = horseData.updateHorseNumbers.mock.calls[0];
      expect(callArgs[2]).toBe('70');
    });

    test('should use selectedEvent ID', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '1', boxNumber: '10' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      const callArgs = horseData.updateHorseNumbers.mock.calls[0];
      expect(callArgs[3]).toBe('event123');
    });

    test('should return status OK', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '1', boxNumber: '10' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should return success message', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '1', boxNumber: '10' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.NUMBERS_UPDATED
      });
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'horse123';
      req.body = { headNumber: '1', boxNumber: '10' };

      horseData.updateHorseNumbers.mockRejectedValue(error);

      await expect(
        horseController.updateNums(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle numeric string numbers', async () => {
      req.params.id = 'horse123';
      req.body = { headNumber: '99', boxNumber: '999' };

      horseData.updateHorseNumbers.mockResolvedValue(mockHorse);

      await horseController.updateNums(req, res, next);

      const callArgs = horseData.updateHorseNumbers.mock.calls[0];
      expect(callArgs[1]).toBe('99');
      expect(callArgs[2]).toBe('999');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle null user permissions in renderNew', () => {
      req.user.role = null;

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          rolePermissons: undefined
        })
      );
    });

    test('should handle missing permissions array', () => {
      req.user.role.permissions = null;

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          rolePermissons: null
        })
      );
    });

    test('should handle horses with empty HeadNr array', async () => {
      const horseNoHead = { ...mockHorse, HeadNr: [] };

      horseData.getAllHorses.mockResolvedValue([horseNoHead]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].HeadNr.length).toBe(0);
    });

    test('should handle horses with empty BoxNr array', async () => {
      const horseNoBox = { ...mockHorse, BoxNr: [] };

      horseData.getAllHorses.mockResolvedValue([horseNoBox]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].BoxNr.length).toBe(0);
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should pass user permissions to all renders', async () => {
      const customPermissions = ['view', 'edit'];
      req.user.role.permissions = customPermissions;

      horseData.getHorseById.mockResolvedValue(mockHorse);

      await horseController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'horse/editHorse',
        expect.objectContaining({
          rolePermissons: customPermissions
        })
      );
    });

    test('should store user ID in new note', async () => {
      const customUserId = 'user456';
      req.user._id = customUserId;
      req.params.id = 'horse123';
      req.body = { note: 'Test note' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      const callArgs = horseData.addHorseNote.mock.calls[0];
      expect(callArgs[1].user).toBe(customUserId);
    });

    test('should pass user context to all renders', () => {
      const customUser = { ...mockUser, username: 'custom_user' };
      req.user = customUser;

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          user: customUser
        })
      );
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify createHorse called with correct parameters', async () => {
      req.body = {
        Horsename: 'Thunder',
        HeadNr: '1',
        BoxNr: '10',
        breed: 'Thoroughbred'
      };

      horseData.createHorse.mockResolvedValue(mockHorse);

      await horseController.createNew(req, res, next);

      expect(horseData.createHorse).toHaveBeenCalledWith(
        expect.objectContaining({
          Horsename: 'Thunder',
          breed: 'Thoroughbred'
        }),
        '1',
        '10',
        'event123'
      );
    });

    test('should verify updateHorse called with correct parameters', async () => {
      req.params.id = 'horse123';
      req.body = {
        Horsename: 'Updated Thunder',
        HeadNr: '2',
        BoxNr: '20'
      };

      horseData.updateHorse.mockResolvedValue(mockHorse);

      await horseController.editPost(req, res, next);

      expect(horseData.updateHorse).toHaveBeenCalledWith(
        'horse123',
        expect.objectContaining({
          Horsename: 'Updated Thunder'
        }),
        '2',
        '20',
        'event123'
      );
    });

    test('should verify deleteHorseNote called with correct parameters', async () => {
      req.params.id = 'horse123';
      const noteId = 'note456';
      req.body = { note: noteId };

      horseData.deleteHorseNote.mockResolvedValue(mockHorse);

      await horseController.deleteNote(req, res, next);

      expect(horseData.deleteHorseNote).toHaveBeenCalledWith('horse123', noteId);
    });

    test('should verify addHorseNote called with complete note object', async () => {
      req.params.id = 'horse123';
      req.body = { note: 'Test note' };

      horseData.addHorseNote.mockResolvedValue(mockHorse);

      await horseController.newNotePost(req, res, next);

      const noteData = horseData.addHorseNote.mock.calls[0][1];
      expect(noteData).toHaveProperty('note', 'Test note');
      expect(noteData).toHaveProperty('user', 'user123');
      expect(noteData).toHaveProperty('eventID', 'event123');
    });
  });

  describe('Session Management', () => {
    
    test('should preserve formData in session', () => {
      const formData = { Horsename: 'Thunder' };
      req.session.formData = formData;

      horseController.renderNew(req, res);

      expect(req.session.formData).toEqual(formData);
    });

    test('should clear messages independently', async () => {
      req.session.successMessage = 'Success';
      req.session.failMessage = 'Failure';

      horseData.getAllHorses.mockResolvedValue([]);

      await horseController.dashboard(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should not modify formData on dashboard', async () => {
      const formData = { Horsename: 'Thunder' };
      req.session.formData = formData;

      horseData.getAllHorses.mockResolvedValue([mockHorse]);

      await horseController.dashboard(req, res, next);

      expect(req.session.formData).toEqual(formData);
    });

    test('should handle null session values', () => {
      req.session.formData = null;
      req.session.failMessage = null;
      req.session.successMessage = null;

      horseController.renderNew(req, res);

      expect(res.render).toHaveBeenCalledWith(
        'horse/newHorse',
        expect.objectContaining({
          formData: null,
          failMessage: null,
          successMessage: null
        })
      );
    });
  });

  describe('Event ID Filtering', () => {
    
    test('should handle numeric event IDs in filtering', async () => {
      const horseWithNumericEventIds = {
        ...mockHorse,
        HeadNr: [
          { eventID: 123, number: 1 },
          { eventID: 456, number: 2 }
        ],
        BoxNr: [
          { eventID: 123, number: 10 },
          { eventID: 456, number: 20 }
        ]
      };

      res.locals.selectedEvent._id = 123;

      horseData.getAllHorses.mockResolvedValue([horseWithNumericEventIds]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].HeadNr.length).toBe(1);
      expect(renderCall.horses[0].BoxNr.length).toBe(1);
    });

    test('should match event ID after string conversion', async () => {
      const horseWithMixedIds = {
        ...mockHorse,
        HeadNr: [
          { eventID: '123', number: 1 },
          { eventID: 456, number: 2 }
        ]
      };

      res.locals.selectedEvent._id = '123';

      horseData.getAllHorses.mockResolvedValue([horseWithMixedIds]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].HeadNr.length).toBe(1);
    });

    test('should filter all non-matching event IDs', async () => {
      const horseMultipleEvents = {
        ...mockHorse,
        HeadNr: [
          { eventID: 'event1', number: 1 },
          { eventID: 'event2', number: 2 },
          { eventID: 'event3', number: 3 }
        ]
      };

      res.locals.selectedEvent._id = 'event2';

      horseData.getAllHorses.mockResolvedValue([horseMultipleEvents]);

      await horseController.dashboard(req, res, next);

      const renderCall = res.render.mock.calls[0][1];
      expect(renderCall.horses[0].HeadNr.length).toBe(1);
      expect(renderCall.horses[0].HeadNr[0].number).toBe(2);
    });
  });

});

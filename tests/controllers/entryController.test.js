// tests/controllers/entryController.test.js - Entry Controller Unit Tests
import entryController from '../../controllers/entryController.js';
import * as entryData from '../../DataServices/entryData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock modules
jest.mock('../../DataServices/entryData.js');
jest.mock('../../logger.js');

describe('Entry Controller - Unit Tests', () => {
  
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

  const mockVaulter = { _id: 'vaulter1', name: 'John Vaulter' };
  const mockLunger = { _id: 'lunger1', name: 'Jane Lunger' };
  const mockHorse = { _id: 'horse1', Horsename: 'Tornado' };
  const mockCategory = { _id: 'cat1', name: 'Vaulting' };
  const mockEntry = { _id: 'entry1', name: 'Entry 1', EntryDispName: 'Entry Display' };

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
    
    test('should render new entry form', async () => {
      entryData.getAllVaulters.mockResolvedValue([mockVaulter]);
      entryData.getAllLungers.mockResolvedValue([mockLunger]);
      entryData.getAllHorses.mockResolvedValue([mockHorse]);
      entryData.getAllCategories.mockResolvedValue([mockCategory]);
      entryData.getAllEvents.mockResolvedValue([mockEvent]);

      await entryController.renderNew(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/newEntry',
        expect.any(Object)
      );
    });

    test('should fetch vaulters from DataServices', async () => {
      entryData.getAllVaulters.mockResolvedValue([mockVaulter]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(entryData.getAllVaulters).toHaveBeenCalled();
    });

    test('should fetch lungers from DataServices', async () => {
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([mockLunger]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(entryData.getAllLungers).toHaveBeenCalled();
    });

    test('should fetch horses from DataServices', async () => {
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([mockHorse]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(entryData.getAllHorses).toHaveBeenCalled();
    });

    test('should fetch categories from DataServices', async () => {
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([mockCategory]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(entryData.getAllCategories).toHaveBeenCalled();
    });

    test('should fetch events from DataServices', async () => {
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([mockEvent]);

      await entryController.renderNew(req, res, next);

      expect(entryData.getAllEvents).toHaveBeenCalled();
    });

    test('should pass all fetched data to template', async () => {
      const vaulters = [mockVaulter];
      const lungers = [mockLunger];
      const horses = [mockHorse];
      const categories = [mockCategory];
      const events = [mockEvent];

      entryData.getAllVaulters.mockResolvedValue(vaulters);
      entryData.getAllLungers.mockResolvedValue(lungers);
      entryData.getAllHorses.mockResolvedValue(horses);
      entryData.getAllCategories.mockResolvedValue(categories);
      entryData.getAllEvents.mockResolvedValue(events);

      await entryController.renderNew(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/newEntry',
        expect.objectContaining({
          vaulters,
          lungers,
          horses,
          categorys: categories,
          events
        })
      );
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty arrays from DataServices', async () => {
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/newEntry',
        expect.objectContaining({
          vaulters: [],
          lungers: [],
          horses: [],
          categorys: [],
          events: []
        })
      );
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      entryData.getAllVaulters.mockRejectedValue(error);

      await expect(
        entryController.renderNew(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('createNew', () => {
    
    test('should create new entry successfully', async () => {
      req.body = { name: 'New Entry' };

      entryData.createEntry.mockResolvedValue(mockEntry);

      await entryController.createNew(req, res, next);

      expect(entryData.createEntry).toHaveBeenCalledWith(req.body);
    });

    test('should set success message after creation', async () => {
      req.body = { name: 'New Entry' };

      entryData.createEntry.mockResolvedValue(mockEntry);

      await entryController.createNew(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ENTRY_CREATED);
    });

    test('should redirect to dashboard after creation', async () => {
      req.body = { name: 'New Entry' };

      entryData.createEntry.mockResolvedValue(mockEntry);

      await entryController.createNew(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/entry/dashboard');
    });

    test('should handle database error during creation', async () => {
      const error = new Error('Database error');
      req.body = { name: 'New Entry' };

      entryData.createEntry.mockRejectedValue(error);

      await expect(
        entryController.createNew(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('dashboard', () => {
    
    test('should render dashboard with entries', async () => {
      const entries = [mockEntry];

      entryData.getSelectedEvent.mockResolvedValue(mockEvent);
      entryData.getEntriesByEvent.mockResolvedValue(entries);

      await entryController.dashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/entrydash',
        expect.objectContaining({
          entrys: entries
        })
      );
    });

    test('should fetch selected event', async () => {
      entryData.getSelectedEvent.mockResolvedValue(mockEvent);
      entryData.getEntriesByEvent.mockResolvedValue([]);

      await entryController.dashboard(req, res, next);

      expect(entryData.getSelectedEvent).toHaveBeenCalled();
    });

    test('should fetch entries for selected event', async () => {
      entryData.getSelectedEvent.mockResolvedValue(mockEvent);
      entryData.getEntriesByEvent.mockResolvedValue([]);

      await entryController.dashboard(req, res, next);

      expect(entryData.getEntriesByEvent).toHaveBeenCalledWith(mockEvent._id);
    });

    test('should clear session messages after rendering', async () => {
      req.session.failMessage = 'Error';

      entryData.getSelectedEvent.mockResolvedValue(mockEvent);
      entryData.getEntriesByEvent.mockResolvedValue([]);

      await entryController.dashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      entryData.getSelectedEvent.mockRejectedValue(error);

      await expect(
        entryController.dashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editGet', () => {
    
    test('should render edit form with entry data', async () => {
      req.params.id = 'entry1';

      entryData.getEntryByIdWithPopulation.mockResolvedValue(mockEntry);
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/editEntry',
        expect.objectContaining({
          formData: mockEntry
        })
      );
    });

    test('should fetch entry by ID with population', async () => {
      req.params.id = 'entry1';

      entryData.getEntryByIdWithPopulation.mockResolvedValue(mockEntry);
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.editGet(req, res, next);

      expect(entryData.getEntryByIdWithPopulation).toHaveBeenCalledWith('entry1');
    });

    test('should fetch all related data for edit form', async () => {
      req.params.id = 'entry1';

      entryData.getEntryByIdWithPopulation.mockResolvedValue(mockEntry);
      entryData.getAllVaulters.mockResolvedValue([mockVaulter]);
      entryData.getAllLungers.mockResolvedValue([mockLunger]);
      entryData.getAllHorses.mockResolvedValue([mockHorse]);
      entryData.getAllCategories.mockResolvedValue([mockCategory]);
      entryData.getAllEvents.mockResolvedValue([mockEvent]);

      await entryController.editGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/editEntry',
        expect.objectContaining({
          vaulters: [mockVaulter],
          lungers: [mockLunger],
          horses: [mockHorse],
          categorys: [mockCategory],
          events: [mockEvent]
        })
      );
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');
      req.params.id = 'entry1';

      entryData.getEntryByIdWithPopulation.mockRejectedValue(error);

      await expect(
        entryController.editGet(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('editPost', () => {
    
    test('should update entry successfully', async () => {
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      const oldEntry = mockEntry;
      const newEntry = { ...mockEntry, name: 'Updated Entry' };

      entryData.updateEntry.mockResolvedValue({ oldEntry, newEntry });

      await entryController.editPost(req, res, next);

      expect(entryData.updateEntry).toHaveBeenCalledWith(
        'entry1',
        expect.objectContaining({ _id: 'entry1' }),
        mockEvent._id
      );
    });

    test('should include _id in update data', async () => {
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      entryData.updateEntry.mockResolvedValue({ oldEntry: mockEntry, newEntry: mockEntry });

      await entryController.editPost(req, res, next);

      const updateData = entryData.updateEntry.mock.calls[0][1];
      expect(updateData._id).toBe('entry1');
    });

    test('should use selected event ID', async () => {
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      entryData.updateEntry.mockResolvedValue({ oldEntry: mockEntry, newEntry: mockEntry });

      await entryController.editPost(req, res, next);

      expect(entryData.updateEntry).toHaveBeenCalledWith(
        'entry1',
        expect.any(Object),
        mockEvent._id
      );
    });

    test('should set success message after update', async () => {
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      entryData.updateEntry.mockResolvedValue({ oldEntry: mockEntry, newEntry: mockEntry });

      await entryController.editPost(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.ENTRY_UPDATED);
    });

    test('should redirect to dashboard after update', async () => {
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      entryData.updateEntry.mockResolvedValue({ oldEntry: mockEntry, newEntry: mockEntry });

      await entryController.editPost(req, res, next);

      expect(res.redirect).toHaveBeenCalledWith('/entry/dashboard');
    });

    test('should handle database error during update', async () => {
      const error = new Error('Database error');
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      entryData.updateEntry.mockRejectedValue(error);

      await expect(
        entryController.editPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('deleteIncident', () => {
    
    test('should delete incident successfully', async () => {
      req.params.id = 'entry1';
      req.body = { incidentId: 'incident1' };

      entryData.deleteEntryIncident.mockResolvedValue(mockEntry);

      await entryController.deleteIncident(req, res, next);

      expect(entryData.deleteEntryIncident).toHaveBeenCalledWith('entry1', req.body);
    });

    test('should return success response after deletion', async () => {
      req.params.id = 'entry1';
      req.body = { incidentId: 'incident1' };

      entryData.deleteEntryIncident.mockResolvedValue(mockEntry);

      await entryController.deleteIncident(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Incident deleted successfully'
      });
    });

    test('should handle database error during deletion', async () => {
      const error = new Error('Database error');
      req.params.id = 'entry1';
      req.body = { incidentId: 'incident1' };

      entryData.deleteEntryIncident.mockRejectedValue(error);

      await expect(
        entryController.deleteIncident(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('newIncidentPost', () => {
    
    test('should add incident successfully', async () => {
      req.params.id = 'entry1';
      req.body = {
        description: 'Fell during entry',
        incidentType: 'Fall'
      };

      entryData.addEntryIncident.mockResolvedValue(mockEntry);

      await entryController.newIncidentPost(req, res, next);

      expect(entryData.addEntryIncident).toHaveBeenCalledWith(
        'entry1',
        expect.objectContaining({
          description: 'Fell during entry',
          incidentType: 'Fall',
          userId: mockUser._id
        })
      );
    });

    test('should include user ID in incident data', async () => {
      req.params.id = 'entry1';
      req.body = {
        description: 'Fell during entry',
        incidentType: 'Fall'
      };

      entryData.addEntryIncident.mockResolvedValue(mockEntry);

      await entryController.newIncidentPost(req, res, next);

      const incidentData = entryData.addEntryIncident.mock.calls[0][1];
      expect(incidentData.userId).toBe(mockUser._id);
    });

    test('should return success message after adding incident', async () => {
      req.params.id = 'entry1';
      req.body = {
        description: 'Fell during entry',
        incidentType: 'Fall'
      };

      entryData.addEntryIncident.mockResolvedValue(mockEntry);

      await entryController.newIncidentPost(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.INCIDENT_ADDED
      });
    });

    test('should handle database error during incident addition', async () => {
      const error = new Error('Database error');
      req.params.id = 'entry1';
      req.body = {
        description: 'Fell during entry',
        incidentType: 'Fall'
      };

      entryData.addEntryIncident.mockRejectedValue(error);

      await expect(
        entryController.newIncidentPost(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('vetCheckGet', () => {
    
    test('should render vet check dashboard', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [{ eventID: 'event123', value: '1' }],
          BoxNr: [{ eventID: 'event123', value: 'A1' }],
          VetCheckStatus: [{ eventID: 'event123', status: 'passed' }]
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/vetcheckdash',
        expect.any(Object)
      );
    });

    test('should fetch horses for event', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [],
          BoxNr: [],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      expect(entryData.getHorsesForEvent).toHaveBeenCalledWith(mockEvent._id);
    });

    test('should filter HeadNr by event ID', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [
            { eventID: 'event123', value: '1' },
            { eventID: 'other_event', value: '2' }
          ],
          BoxNr: [],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.horses[0].HeadNr).toHaveLength(1);
      expect(renderData.horses[0].HeadNr[0].eventID).toBe('event123');
    });

    test('should filter BoxNr by event ID', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [],
          BoxNr: [
            { eventID: 'event123', value: 'A1' },
            { eventID: 'other_event', value: 'B2' }
          ],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.horses[0].BoxNr).toHaveLength(1);
      expect(renderData.horses[0].BoxNr[0].eventID).toBe('event123');
    });

    test('should filter VetCheckStatus by event ID', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [],
          BoxNr: [],
          VetCheckStatus: [
            { eventID: 'event123', status: 'passed' },
            { eventID: 'other_event', status: 'failed' }
          ]
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.horses[0].VetCheckStatus).toHaveLength(1);
      expect(renderData.horses[0].VetCheckStatus[0].status).toBe('passed');
    });

    test('should filter all arrays for each horse', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [
            { eventID: 'event123', value: '1' },
            { eventID: 'other', value: '2' }
          ],
          BoxNr: [
            { eventID: 'event123', value: 'A1' },
            { eventID: 'other', value: 'B2' }
          ],
          VetCheckStatus: [
            { eventID: 'event123', status: 'passed' },
            { eventID: 'other', status: 'failed' }
          ]
        },
        {
          _id: 'horse2',
          Horsename: 'Shadow',
          HeadNr: [{ eventID: 'event123', value: '3' }],
          BoxNr: [{ eventID: 'event123', value: 'C3' }],
          VetCheckStatus: [{ eventID: 'event123', status: 'pending' }]
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      expect(renderData.horses).toHaveLength(2);
      expect(renderData.horses[0].HeadNr).toHaveLength(1);
      expect(renderData.horses[0].BoxNr).toHaveLength(1);
      expect(renderData.horses[0].VetCheckStatus).toHaveLength(1);
      expect(renderData.horses[1].HeadNr).toHaveLength(1);
    });

    test('should handle string event ID conversion', async () => {
      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [
            { eventID: 'event123', value: '1' },
            { eventID: 123, value: '2' } // Different type
          ],
          BoxNr: [],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      const renderData = res.render.mock.calls[0][1];
      // String comparison should work with type conversion
      expect(renderData.horses[0].HeadNr.length).toBeGreaterThan(0);
    });

    test('should clear session messages', async () => {
      req.session.failMessage = 'Error';

      const horses = [
        {
          _id: 'horse1',
          Horsename: 'Tornado',
          HeadNr: [],
          BoxNr: [],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      expect(req.session.failMessage).toBeNull();
    });

    test('should handle database error', async () => {
      const error = new Error('Database error');

      entryData.getHorsesForEvent.mockRejectedValue(error);

      await expect(
        entryController.vetCheckGet(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should handle empty horses array', async () => {
      entryData.getHorsesForEvent.mockResolvedValue([]);

      await entryController.vetCheckGet(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/vetcheckdash',
        expect.objectContaining({
          horses: []
        })
      );
    });
  });

  describe('updateVetStatus', () => {
    
    test('should update horse vet status successfully', async () => {
      req.params.horseId = 'horse1';
      req.body = { status: 'passed' };

      entryData.updateHorseVetStatus.mockResolvedValue(mockHorse);

      await entryController.updateVetStatus(req, res, next);

      expect(entryData.updateHorseVetStatus).toHaveBeenCalledWith(
        'horse1',
        expect.objectContaining({
          status: 'passed',
          userId: mockUser._id,
          eventId: mockEvent._id
        })
      );
    });

    test('should include user ID in status data', async () => {
      req.params.horseId = 'horse1';
      req.body = { status: 'passed' };

      entryData.updateHorseVetStatus.mockResolvedValue(mockHorse);

      await entryController.updateVetStatus(req, res, next);

      const statusData = entryData.updateHorseVetStatus.mock.calls[0][1];
      expect(statusData.userId).toBe(mockUser._id);
    });

    test('should include event ID in status data', async () => {
      req.params.horseId = 'horse1';
      req.body = { status: 'passed' };

      entryData.updateHorseVetStatus.mockResolvedValue(mockHorse);

      await entryController.updateVetStatus(req, res, next);

      const statusData = entryData.updateHorseVetStatus.mock.calls[0][1];
      expect(statusData.eventId).toBe(mockEvent._id);
    });

    test('should return success response after update', async () => {
      req.params.horseId = 'horse1';
      req.body = { status: 'passed' };

      entryData.updateHorseVetStatus.mockResolvedValue(mockHorse);

      await entryController.updateVetStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: MESSAGES.SUCCESS.VET_STATUS_UPDATED
      });
    });

    test('should handle different vet statuses', async () => {
      const statuses = ['passed', 'failed', 'pending', 'rejected'];

      for (const status of statuses) {
        req.params.horseId = 'horse1';
        req.body = { status };

        entryData.updateHorseVetStatus.mockResolvedValue(mockHorse);

        await entryController.updateVetStatus(req, res, next);

        const statusData = entryData.updateHorseVetStatus.mock.calls[
          entryData.updateHorseVetStatus.mock.calls.length - 1
        ][1];
        expect(statusData.status).toBe(status);
      }
    });

    test('should handle database error during update', async () => {
      const error = new Error('Database error');
      req.params.horseId = 'horse1';
      req.body = { status: 'passed' };

      entryData.updateHorseVetStatus.mockRejectedValue(error);

      await expect(
        entryController.updateVetStatus(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Error Handling', () => {
    
    test('should handle null user in permission checks', async () => {
      req.user = null;

      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await expect(
        entryController.renderNew(req, res, next)
      ).resolves.toBeUndefined();
    });

    test('should handle missing selected event in editPost', async () => {
      res.locals.selectedEvent = null;
      req.params.id = 'entry1';
      req.body = { name: 'Updated Entry' };

      entryData.updateEntry.mockResolvedValue({ oldEntry: mockEntry, newEntry: mockEntry });

      await expect(
        entryController.editPost(req, res, next)
      ).rejects.toThrow();
    });

    test('should handle missing selected event in vetCheckGet', async () => {
      res.locals.selectedEvent = null;

      const horses = [
        {
          _id: 'horse1',
          HeadNr: [],
          BoxNr: [],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await expect(
        entryController.vetCheckGet(req, res, next)
      ).rejects.toThrow();
    });
  });

  describe('DataServices Integration', () => {
    
    test('should verify all DataServices calls in renderNew', async () => {
      entryData.getAllVaulters.mockResolvedValue([mockVaulter]);
      entryData.getAllLungers.mockResolvedValue([mockLunger]);
      entryData.getAllHorses.mockResolvedValue([mockHorse]);
      entryData.getAllCategories.mockResolvedValue([mockCategory]);
      entryData.getAllEvents.mockResolvedValue([mockEvent]);

      await entryController.renderNew(req, res, next);

      expect(entryData.getAllVaulters).toHaveBeenCalled();
      expect(entryData.getAllLungers).toHaveBeenCalled();
      expect(entryData.getAllHorses).toHaveBeenCalled();
      expect(entryData.getAllCategories).toHaveBeenCalled();
      expect(entryData.getAllEvents).toHaveBeenCalled();
    });

    test('should pass complete form body to createEntry', async () => {
      const formData = {
        vaulter: 'vaulter1',
        horse: 'horse1',
        category: 'category1'
      };

      req.body = formData;

      entryData.createEntry.mockResolvedValue(mockEntry);

      await entryController.createNew(req, res, next);

      expect(entryData.createEntry).toHaveBeenCalledWith(formData);
    });

    test('should preserve body spread in editPost update', async () => {
      req.params.id = 'entry1';
      req.body = {
        vaulter: 'vaulter1',
        horse: 'horse1',
        category: 'category1'
      };

      entryData.updateEntry.mockResolvedValue({ oldEntry: mockEntry, newEntry: mockEntry });

      await entryController.editPost(req, res, next);

      const updateData = entryData.updateEntry.mock.calls[0][1];
      expect(updateData.vaulter).toBe('vaulter1');
      expect(updateData.horse).toBe('horse1');
      expect(updateData.category).toBe('category1');
      expect(updateData._id).toBe('entry1');
    });
  });

  describe('User Context & Permissions', () => {
    
    test('should include user permissions in renders', async () => {
      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'entry/newEntry',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should use user ID in incident operations', async () => {
      const customUserId = 'custom_user123';
      req.user._id = customUserId;
      req.params.id = 'entry1';
      req.body = {
        description: 'Test incident',
        incidentType: 'Fall'
      };

      entryData.addEntryIncident.mockResolvedValue(mockEntry);

      await entryController.newIncidentPost(req, res, next);

      const incidentData = entryData.addEntryIncident.mock.calls[0][1];
      expect(incidentData.userId).toBe(customUserId);
    });
  });

  describe('Session Management', () => {
    
    test('should preserve formData in session during renderNew', async () => {
      const formData = { field: 'value' };
      req.session.formData = formData;

      entryData.getAllVaulters.mockResolvedValue([]);
      entryData.getAllLungers.mockResolvedValue([]);
      entryData.getAllHorses.mockResolvedValue([]);
      entryData.getAllCategories.mockResolvedValue([]);
      entryData.getAllEvents.mockResolvedValue([]);

      await entryController.renderNew(req, res, next);

      expect(req.session.formData).toEqual(formData);
    });

    test('should clear messages only after render', async () => {
      req.session.successMessage = 'Success';

      const horses = [
        {
          _id: 'horse1',
          HeadNr: [],
          BoxNr: [],
          VetCheckStatus: []
        }
      ];

      entryData.getHorsesForEvent.mockResolvedValue(horses);

      await entryController.vetCheckGet(req, res, next);

      expect(req.session.successMessage).toBeNull();
    });
  });

});

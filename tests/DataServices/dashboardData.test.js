import {
  getDashCardsByType,
  getDashCardById,
  createDashCard,
  updateDashCard,
  deleteDashCard
} from '../../DataServices/dashboardData.js';
import DashCards from '../../models/DashCards.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/DashCards.js', () => {
  const DashCardsMock = jest.fn();
  DashCardsMock.find = jest.fn();
  DashCardsMock.findById = jest.fn();
  DashCardsMock.findByIdAndUpdate = jest.fn();
  DashCardsMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: DashCardsMock
  };
});

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('dashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashCardsByType', () => {
    test('returns dashboard cards by type sorted by priority', async () => {
      const cards = [{ _id: 'c1', dashtype: 'admin', priority: 1 }];
      const sortMock = jest.fn().mockResolvedValue(cards);
      DashCards.find.mockReturnValue({ sort: sortMock });

      const result = await getDashCardsByType('admin');

      expect(DashCards.find).toHaveBeenCalledWith({ dashtype: 'admin' });
      expect(sortMock).toHaveBeenCalledWith({ priority: 1 });
      expect(result).toEqual(cards);
    });

    test('propagates query errors', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('query failed'));
      DashCards.find.mockReturnValue({ sort: sortMock });

      await expect(getDashCardsByType('admin')).rejects.toThrow('query failed');
    });
  });

  describe('getDashCardById', () => {
    test('returns dashboard card when found', async () => {
      const card = { _id: 'c1', title: 'Card A' };
      DashCards.findById.mockResolvedValue(card);

      const result = await getDashCardById('c1');

      expect(DashCards.findById).toHaveBeenCalledWith('c1');
      expect(result).toEqual(card);
    });

    test('throws when dashboard card is not found', async () => {
      DashCards.findById.mockResolvedValue(null);

      await expect(getDashCardById('missing')).rejects.toThrow('Dashboard card not found');
    });
  });

  describe('createDashCard', () => {
    test('creates, saves and logs new dashboard card', async () => {
      const input = { title: 'New Card', dashtype: 'admin', priority: 1 };
      const created = {
        _id: 'c1',
        ...input,
        save: jest.fn().mockResolvedValue(undefined)
      };
      DashCards.mockImplementation(() => created);

      const result = await createDashCard(input);

      expect(DashCards).toHaveBeenCalledWith(input);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'DashCard', 'c1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const input = { title: 'Broken Card', dashtype: 'admin', priority: 1 };
      const created = {
        _id: 'c1',
        ...input,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      DashCards.mockImplementation(() => created);

      await expect(createDashCard(input)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateDashCard', () => {
    test('updates dashboard card and logs update when found', async () => {
      const updated = { _id: 'c1', title: 'Updated Card' };
      const payload = { title: 'Updated Card' };
      DashCards.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateDashCard('c1', payload);

      expect(DashCards.findByIdAndUpdate).toHaveBeenCalledWith(
        'c1',
        payload,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'DashCard', 'c1');
      expect(result).toEqual(updated);
    });

    test('throws when updating non-existing dashboard card', async () => {
      DashCards.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateDashCard('missing', { title: 'X' })).rejects.toThrow('Dashboard card not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors', async () => {
      DashCards.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateDashCard('c1', { title: 'X' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteDashCard', () => {
    test('deletes dashboard card and logs deletion when found', async () => {
      const deleted = { _id: 'c1', title: 'Delete Me' };
      DashCards.findByIdAndDelete.mockResolvedValue(deleted);

      const result = await deleteDashCard('c1');

      expect(DashCards.findByIdAndDelete).toHaveBeenCalledWith('c1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'DashCard', 'c1');
      expect(result).toEqual(deleted);
    });

    test('throws when deleting non-existing dashboard card', async () => {
      DashCards.findByIdAndDelete.mockResolvedValue(null);

      await expect(deleteDashCard('missing')).rejects.toThrow('Dashboard card not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates delete errors', async () => {
      DashCards.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteDashCard('c1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });
});

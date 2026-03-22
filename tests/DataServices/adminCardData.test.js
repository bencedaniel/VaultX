import {
  getAllCards,
  getCardById,
  getCardFormData,
  createCard,
  updateCard,
  deleteCard
} from '../../DataServices/adminCardData.js';
import DashCards from '../../models/DashCards.js';
import Permissions from '../../models/Permissions.js';
import { logDb, logger } from '../../logger.js';

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

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn()
  }
}));

describe('adminCardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCards', () => {
    test('returns all dashboard cards', async () => {
      const cards = [{ _id: '1', title: 'Card 1' }, { _id: '2', title: 'Card 2' }];
      DashCards.find.mockResolvedValue(cards);

      const result = await getAllCards();

      expect(DashCards.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(cards);
    });

    test('propagates database errors', async () => {
      DashCards.find.mockRejectedValue(new Error('find failed'));

      await expect(getAllCards()).rejects.toThrow('find failed');
    });
  });

  describe('getCardById', () => {
    test('returns a card by id', async () => {
      const card = { _id: 'card123', title: 'Main card' };
      DashCards.findById.mockResolvedValue(card);

      const result = await getCardById('card123');

      expect(DashCards.findById).toHaveBeenCalledWith('card123');
      expect(result).toEqual(card);
    });

    test('returns null when card is not found', async () => {
      DashCards.findById.mockResolvedValue(null);

      const result = await getCardById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getCardFormData', () => {
    test('returns permission list for form', async () => {
      const permissionList = [{ _id: 'p1', name: 'admin.read' }];
      Permissions.find.mockResolvedValue(permissionList);

      const result = await getCardFormData();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ permissionList });
    });

    test('propagates permission loading errors', async () => {
      Permissions.find.mockRejectedValue(new Error('permissions failed'));

      await expect(getCardFormData()).rejects.toThrow('permissions failed');
    });
  });

  describe('createCard', () => {
    test('creates, saves and logs a new card', async () => {
      const cardData = { title: 'New Card', permission: 'admin.read' };
      const savedCard = {
        _id: 'new123',
        ...cardData,
        save: jest.fn().mockResolvedValue(undefined)
      };

      DashCards.mockImplementation(() => savedCard);

      const result = await createCard(cardData);

      expect(DashCards).toHaveBeenCalledWith(cardData);
      expect(savedCard.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'DashCard', 'new123');
      expect(result).toBe(savedCard);
    });

    test('propagates save errors', async () => {
      const cardData = { title: 'Broken card' };
      const unsavedCard = {
        _id: 'fail1',
        ...cardData,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      DashCards.mockImplementation(() => unsavedCard);

      await expect(createCard(cardData)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateCard', () => {
    test('updates card by id with validators and logs operation', async () => {
      const cardId = 'card999';
      const cardData = { title: 'Updated Title' };
      const updated = { _id: cardId, ...cardData };
      DashCards.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateCard(cardId, cardData);

      expect(logger.debug).toHaveBeenCalledWith(
        `Updating card ${cardId} with data: ${JSON.stringify(cardData)}`
      );
      expect(DashCards.findByIdAndUpdate).toHaveBeenCalledWith(
        cardId,
        cardData,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'DashCard', cardId);
      expect(result).toEqual(updated);
    });

    test('returns null when card does not exist', async () => {
      DashCards.findByIdAndUpdate.mockResolvedValue(null);

      const result = await updateCard('missing', { title: 'x' });

      expect(result).toBeNull();
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'DashCard', 'missing');
    });

    test('propagates update errors', async () => {
      DashCards.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateCard('card1', { title: 'x' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalledWith('UPDATE', 'DashCard', 'card1');
    });
  });

  describe('deleteCard', () => {
    test('deletes card by id and logs operation', async () => {
      const deletedCard = { _id: 'card7', title: 'To delete' };
      DashCards.findByIdAndDelete.mockResolvedValue(deletedCard);

      const result = await deleteCard('card7');

      expect(DashCards.findByIdAndDelete).toHaveBeenCalledWith('card7');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'DashCard', 'card7');
      expect(result).toEqual(deletedCard);
    });

    test('returns null when deleting non-existing card', async () => {
      DashCards.findByIdAndDelete.mockResolvedValue(null);

      const result = await deleteCard('missing');

      expect(result).toBeNull();
      expect(logDb).toHaveBeenCalledWith('DELETE', 'DashCard', 'missing');
    });
  });
});

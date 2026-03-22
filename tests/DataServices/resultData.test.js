import {
  getScoresByTimetableAndEntry,
  createScore,
  updateScore,
  deleteScore,
  deleteMultipleScores
} from '../../DataServices/resultData.js';
import Score from '../../models/Score.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Score.js', () => {
  const ScoreMock = jest.fn();
  ScoreMock.find = jest.fn();
  ScoreMock.findByIdAndUpdate = jest.fn();
  ScoreMock.findByIdAndDelete = jest.fn();
  ScoreMock.deleteMany = jest.fn();

  return {
    __esModule: true,
    default: ScoreMock
  };
});

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('resultData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getScoresByTimetableAndEntry', () => {
    test('returns scores filtered by timetable part, entry and event', async () => {
      const rows = [{ _id: 's1' }, { _id: 's2' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      Score.find.mockReturnValue({ exec: execMock });

      const result = await getScoresByTimetableAndEntry('tp1', 'en1', 'ev1');

      expect(Score.find).toHaveBeenCalledWith({
        timetablepart: 'tp1',
        entry: 'en1',
        event: 'ev1'
      });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });

    test('propagates query execution errors', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('exec failed'));
      Score.find.mockReturnValue({ exec: execMock });

      await expect(getScoresByTimetableAndEntry('tp1', 'en1', 'ev1')).rejects.toThrow('exec failed');
    });
  });

  describe('createScore', () => {
    test('creates, saves and logs score', async () => {
      const payload = { entry: 'en1', total: 7.5 };
      const created = {
        _id: 's1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Score.mockImplementation(() => created);

      const result = await createScore(payload);

      expect(Score).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Score', 's1');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const created = {
        _id: 's1',
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Score.mockImplementation(() => created);

      await expect(createScore({ entry: 'en1' })).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateScore', () => {
    test('updates, saves and logs score', async () => {
      const updated = {
        _id: 's1',
        total: 8.1,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Score.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateScore('s1', { total: 8.1 });

      expect(Score.findByIdAndUpdate).toHaveBeenCalledWith(
        's1',
        { total: 8.1 },
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Score', 's1');
      expect(updated.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(updated);
    });

    test('propagates update errors and does not log', async () => {
      Score.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateScore('s1', { total: 8.1 })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('throws when update returns null because save is called on null', async () => {
      Score.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateScore('missing', { total: 8.1 })).rejects.toThrow();
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Score', 'missing');
    });
  });

  describe('deleteScore', () => {
    test('deletes score and logs deletion', async () => {
      Score.findByIdAndDelete.mockResolvedValue({ _id: 's1' });

      const result = await deleteScore('s1');

      expect(Score.findByIdAndDelete).toHaveBeenCalledWith('s1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'Score', 's1');
      expect(result).toBeUndefined();
    });

    test('propagates delete errors and does not log', async () => {
      Score.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteScore('s1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteMultipleScores', () => {
    test('deletes scores by id list and logs joined ids', async () => {
      Score.deleteMany.mockResolvedValue({ deletedCount: 2 });

      const result = await deleteMultipleScores(['s1', 's2']);

      expect(Score.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['s1', 's2'] } });
      expect(logDb).toHaveBeenCalledWith('DELETE', 'Score', 's1,s2');
      expect(result).toBeUndefined();
    });

    test('propagates bulk delete errors and does not log', async () => {
      Score.deleteMany.mockRejectedValue(new Error('bulk delete failed'));

      await expect(deleteMultipleScores(['s1', 's2'])).rejects.toThrow('bulk delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });
});

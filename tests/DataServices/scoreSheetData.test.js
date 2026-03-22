import {
  getSubmittedScoreSheets,
  getEventScoreSheets,
  getScoreSheetById,
  saveScoreSheet,
  updateScoreSheet,
  getEventScores,
  getScoreById
} from '../../DataServices/scoreSheetData.js';
import ScoreSheet from '../../models/ScoreSheet.js';
import Score from '../../models/Score.js';
import TimetablePart from '../../models/Timetablepart.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/ScoreSheet.js', () => {
  const ScoreSheetMock = jest.fn();
  ScoreSheetMock.find = jest.fn();
  ScoreSheetMock.findById = jest.fn();

  return {
    __esModule: true,
    default: ScoreSheetMock
  };
});

jest.mock('../../models/Score.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../../models/Timetablepart.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('scoreSheetData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubmittedScoreSheets', () => {
    test('queries with entry and judge filters when provided', async () => {
      const rows = [{ _id: 'ss1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      ScoreSheet.find.mockReturnValue({ exec: execMock });

      const result = await getSubmittedScoreSheets('tp1', 'en1', 'ev1', 'j1');

      expect(ScoreSheet.find).toHaveBeenCalledWith({
        TimetablePartId: 'tp1',
        EventId: 'ev1',
        EntryId: 'en1',
        'Judge.userId': 'j1'
      });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });

    test('queries without optional filters when not provided', async () => {
      const execMock = jest.fn().mockResolvedValue([]);
      ScoreSheet.find.mockReturnValue({ exec: execMock });

      await getSubmittedScoreSheets('tp1', null, 'ev1', undefined);

      expect(ScoreSheet.find).toHaveBeenCalledWith({
        TimetablePartId: 'tp1',
        EventId: 'ev1'
      });
    });
  });

  describe('getEventScoreSheets', () => {
    test('returns score sheets with full event relationships populated', async () => {
      const rows = [{ _id: 'ss1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 3) {
          return { exec: execMock };
        }
        return chain;
      });
      ScoreSheet.find.mockReturnValue(chain);

      const result = await getEventScoreSheets('ev1');

      expect(ScoreSheet.find).toHaveBeenCalledWith({ EventId: 'ev1' });
      expect(chain.populate).toHaveBeenNthCalledWith(1, {
        path: 'EntryId',
        populate: [{ path: 'vaulter' }, { path: 'category' }]
      });
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'TimetablePartId');
      expect(chain.populate).toHaveBeenNthCalledWith(3, {
        path: 'Judge.userId',
        model: 'users'
      });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getScoreSheetById', () => {
    test('returns one score sheet with all relationships populated', async () => {
      const doc = { _id: 'ss1' };
      const execMock = jest.fn().mockResolvedValue(doc);
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 5) {
          return { exec: execMock };
        }
        return chain;
      });
      ScoreSheet.findById.mockReturnValue(chain);

      const result = await getScoreSheetById('ss1');

      expect(ScoreSheet.findById).toHaveBeenCalledWith('ss1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'EventId');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'TemplateId');
      expect(chain.populate).toHaveBeenNthCalledWith(3, {
        path: 'TimetablePartId',
        populate: [{ path: 'dailytimetable' }]
      });
      expect(chain.populate).toHaveBeenNthCalledWith(4, {
        path: 'Judge.userId',
        model: 'users'
      });
      expect(chain.populate).toHaveBeenNthCalledWith(5, {
        path: 'EntryId',
        populate: [{ path: 'vaulter' }, { path: 'lunger' }, { path: 'horse' }, { path: 'category' }]
      });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(doc);
    });
  });

  describe('saveScoreSheet', () => {
    test('creates score sheet and updates matching participant submitted tables', async () => {
      const input = {
        Judge: { userId: 'judge1', table: 'A' },
        EventId: 'ev1'
      };
      const created = {
        _id: 'ss1',
        ...input,
        save: jest.fn().mockResolvedValue(undefined)
      };
      ScoreSheet.mockImplementation(() => created);

      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          {
            Entry: { toString: () => 'en1' },
            submittedtables: []
          },
          {
            Entry: { toString: () => 'other' },
            submittedtables: []
          }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      const result = await saveScoreSheet(input, 'tp1', 'en1');

      expect(ScoreSheet).toHaveBeenCalledWith(input);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenNthCalledWith(1, 'CREATE', 'ScoreSheet', 'ss1');
      expect(TimetablePart.findById).toHaveBeenCalledWith('tp1');
      expect(timetablePart.StartingOrder[0].submittedtables).toEqual([
        { JudgeID: 'judge1', Table: 'A' }
      ]);
      expect(timetablePart.StartingOrder[1].submittedtables).toEqual([]);
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenNthCalledWith(2, 'UPDATE', 'TimetablePart', 'tp1');
      expect(result).toBe(created);
    });
  });

  describe('updateScoreSheet', () => {
    test('throws when score sheet not found', async () => {
      ScoreSheet.findById.mockResolvedValue(null);

      await expect(
        updateScoreSheet('missing', { Judge: { userId: 'j1', table: 'A' } }, 'tp1', 'en1')
      ).rejects.toThrow('ScoreSheet not found: missing');

      expect(TimetablePart.findById).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('updates score sheet and adds submitted table if missing', async () => {
      const sheet = {
        _id: 'ss1',
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      };
      ScoreSheet.findById.mockResolvedValue(sheet);

      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          {
            Entry: { toString: () => 'en1' },
            submittedtables: []
          }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      const payload = { Judge: { userId: 'j1', table: 'A' }, value: 10 };
      const result = await updateScoreSheet('ss1', payload, 'tp1', 'en1');

      expect(sheet.set).toHaveBeenCalledWith(payload);
      expect(sheet.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenNthCalledWith(1, 'UPDATE', 'ScoreSheet', 'ss1');
      expect(timetablePart.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenNthCalledWith(2, 'UPDATE', 'TimetablePart', 'tp1');
      expect(timetablePart.StartingOrder[0].submittedtables).toEqual([
        { JudgeID: 'j1', Table: 'A' }
      ]);
      expect(result).toBe(sheet);
    });

    test('does not duplicate submitted table entry if already present', async () => {
      const sheet = {
        _id: 'ss1',
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      };
      ScoreSheet.findById.mockResolvedValue(sheet);

      const timetablePart = {
        _id: 'tp1',
        StartingOrder: [
          {
            Entry: { toString: () => 'en1' },
            submittedtables: [
              {
                JudgeID: { toString: () => 'j1' },
                Table: 'A'
              }
            ]
          }
        ],
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(timetablePart);

      await updateScoreSheet('ss1', { Judge: { userId: 'j1', table: 'A' } }, 'tp1', 'en1');

      expect(timetablePart.StartingOrder[0].submittedtables).toHaveLength(1);
    });
  });

  describe('getEventScores', () => {
    test('returns event scores with populated timetable part and entry relations', async () => {
      const rows = [{ _id: 's1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const chain = { populate: jest.fn() };
      let callCount = 0;
      chain.populate.mockImplementation(() => {
        callCount += 1;
        if (callCount === 2) {
          return { exec: execMock };
        }
        return chain;
      });
      Score.find.mockReturnValue(chain);

      const result = await getEventScores('ev1');

      expect(Score.find).toHaveBeenCalledWith({ event: 'ev1' });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'timetablepart');
      expect(chain.populate).toHaveBeenNthCalledWith(2, {
        path: 'entry',
        populate: [{ path: 'vaulter' }, { path: 'category' }]
      });
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getScoreById', () => {
    test('returns score by id via exec', async () => {
      const score = { _id: 's1' };
      const execMock = jest.fn().mockResolvedValue(score);
      Score.findById.mockReturnValue({ exec: execMock });

      const result = await getScoreById('s1');

      expect(Score.findById).toHaveBeenCalledWith('s1');
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(score);
    });
  });
});

import {
  getTodaysTimetable,
  getTimetablePartsByDaily,
  getTimetablePartById,
  getTimetablePartByIdWithDay,
  getTimetablePartByIdWithDaily,
  getTimetablePartsByEvents,
  getJudgeById,
  getEntriesByEvent,
  getEntryById,
  getTableMapping,
  getEventById,
  getScoreSheetTemplate,
  getTimetablePartsByEvent
} from '../../DataServices/scoringData.js';
import DailyTimeTable from '../../models/DailyTimeTable.js';
import TimetablePart from '../../models/Timetablepart.js';
import User from '../../models/User.js';
import Entries from '../../models/Entries.js';
import TableMapping from '../../models/TableMapping.js';
import Event from '../../models/Event.js';
import ScoreSheetTemp from '../../models/ScoreSheetTemp.js';

jest.mock('../../models/DailyTimeTable.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    find: jest.fn()
  }
}));

jest.mock('../../models/Timetablepart.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../models/Entries.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn()
  }
}));

jest.mock('../../models/TableMapping.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

jest.mock('../../models/Event.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../models/ScoreSheetTemp.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

function makePopulateChain(finalValue, count) {
  const chain = { populate: jest.fn() };
  let calls = 0;
  chain.populate.mockImplementation(() => {
    calls += 1;
    if (calls === count) {
      return { exec: jest.fn().mockResolvedValue(finalValue) };
    }
    return chain;
  });
  return chain;
}

describe('scoringData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodaysTimetable', () => {
    test('queries daily timetable for current UTC day range', async () => {
      const row = { _id: 'd1' };
      DailyTimeTable.findOne.mockResolvedValue(row);

      const result = await getTodaysTimetable();

      expect(DailyTimeTable.findOne).toHaveBeenCalledTimes(1);
      const query = DailyTimeTable.findOne.mock.calls[0][0];
      expect(query.Date.$gte).toBeInstanceOf(Date);
      expect(query.Date.$lt).toBeInstanceOf(Date);
      expect(query.Date.$lt.getTime() - query.Date.$gte.getTime()).toBe(24 * 60 * 60 * 1000);
      expect(result).toEqual(row);
    });
  });

  describe('getTimetablePartsByDaily', () => {
    test('returns timetable parts by daily id with category populated', async () => {
      const rows = [{ _id: 'tp1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      TimetablePart.find.mockReturnValue({ populate: populateMock });

      const result = await getTimetablePartsByDaily('d1');

      expect(TimetablePart.find).toHaveBeenCalledWith({ dailytimetable: 'd1' });
      expect(populateMock).toHaveBeenCalledWith('Category');
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getTimetablePartById', () => {
    test('returns timetable part with nested starting order population', async () => {
      const row = { _id: 'tp1' };
      const chain = makePopulateChain(row, 2);
      TimetablePart.findById.mockReturnValue(chain);

      const result = await getTimetablePartById('tp1');

      expect(TimetablePart.findById).toHaveBeenCalledWith('tp1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'Category');
      expect(chain.populate).toHaveBeenNthCalledWith(2, {
        path: 'StartingOrder.Entry',
        populate: [
          { path: 'vaulter' },
          { path: 'category' },
          { path: 'lunger' },
          { path: 'horse' }
        ]
      });
      expect(result).toEqual(row);
    });
  });

  describe('getTimetablePartByIdWithDay', () => {
    test('returns timetable part with daily nested in starting order entry', async () => {
      const row = { _id: 'tp1' };
      const chain = makePopulateChain(row, 2);
      TimetablePart.findById.mockReturnValue(chain);

      const result = await getTimetablePartByIdWithDay('tp1');

      expect(chain.populate).toHaveBeenNthCalledWith(1, 'Category');
      expect(chain.populate).toHaveBeenNthCalledWith(2, {
        path: 'StartingOrder.Entry',
        populate: [
          { path: 'vaulter' },
          { path: 'category' },
          { path: 'lunger' },
          { path: 'horse' },
          { path: 'dailytimetable' }
        ]
      });
      expect(result).toEqual(row);
    });
  });

  describe('getTimetablePartByIdWithDaily', () => {
    test('returns timetable part with dailytimetable populated', async () => {
      const row = { _id: 'tp1' };
      const execMock = jest.fn().mockResolvedValue(row);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      TimetablePart.findById.mockReturnValue({ populate: populateMock });

      const result = await getTimetablePartByIdWithDaily('tp1');

      expect(TimetablePart.findById).toHaveBeenCalledWith('tp1');
      expect(populateMock).toHaveBeenCalledWith('dailytimetable');
      expect(result).toEqual(row);
    });
  });

  describe('getTimetablePartsByEvents', () => {
    test('loads daily tables for events and returns populated timetable parts', async () => {
      const daily = [{ _id: 'd1' }, { _id: 'd2' }];
      const dtExecMock = jest.fn().mockResolvedValue(daily);
      DailyTimeTable.find.mockReturnValue({ exec: dtExecMock });

      const rows = [{ _id: 'tp1' }];
      const tpExecMock = jest.fn().mockResolvedValue(rows);
      const chain = { populate: jest.fn() };
      let count = 0;
      chain.populate.mockImplementation(() => {
        count += 1;
        if (count === 2) {
          return { exec: tpExecMock };
        }
        return chain;
      });
      TimetablePart.find.mockReturnValue(chain);

      const result = await getTimetablePartsByEvents(['e1', 'e2']);

      expect(DailyTimeTable.find).toHaveBeenCalledWith({ event: { $in: ['e1', 'e2'] } });
      expect(TimetablePart.find).toHaveBeenCalledWith({ dailytimetable: { $in: ['d1', 'd2'] } });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'dailytimetable');
      expect(chain.populate).toHaveBeenNthCalledWith(2, {
        path: 'StartingOrder',
        populate: [
          {
            path: 'Entry',
            populate: [{ path: 'vaulter' }]
          }
        ]
      });
      expect(result).toEqual(rows);
    });
  });

  describe('getJudgeById', () => {
    test('returns judge by id', async () => {
      const judge = { _id: 'j1' };
      const execMock = jest.fn().mockResolvedValue(judge);
      User.findById.mockReturnValue({ exec: execMock });

      const result = await getJudgeById('j1');

      expect(User.findById).toHaveBeenCalledWith('j1');
      expect(result).toEqual(judge);
    });
  });

  describe('getEntriesByEvent', () => {
    test('returns entries with full participant population', async () => {
      const rows = [{ _id: 'en1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const chain = { populate: jest.fn() };
      let count = 0;
      chain.populate.mockImplementation(() => {
        count += 1;
        if (count === 4) {
          return { exec: execMock };
        }
        return chain;
      });
      Entries.find.mockReturnValue(chain);

      const result = await getEntriesByEvent('e1');

      expect(Entries.find).toHaveBeenCalledWith({ event: 'e1' });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'vaulter');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'lunger');
      expect(chain.populate).toHaveBeenNthCalledWith(4, 'horse');
      expect(result).toEqual(rows);
    });
  });

  describe('getEntryById', () => {
    test('returns entry by id with full participant population', async () => {
      const row = { _id: 'en1' };
      const execMock = jest.fn().mockResolvedValue(row);
      const chain = { populate: jest.fn() };
      let count = 0;
      chain.populate.mockImplementation(() => {
        count += 1;
        if (count === 4) {
          return { exec: execMock };
        }
        return chain;
      });
      Entries.findById.mockReturnValue(chain);

      const result = await getEntryById('en1');

      expect(Entries.findById).toHaveBeenCalledWith('en1');
      expect(result).toEqual(row);
    });
  });

  describe('getTableMapping', () => {
    test('queries table mapping with lowercase test type', async () => {
      const row = { _id: 'm1' };
      const execMock = jest.fn().mockResolvedValue(row);
      TableMapping.findOne.mockReturnValue({ exec: execMock });

      const result = await getTableMapping('A', 'FREE TEST');

      expect(TableMapping.findOne).toHaveBeenCalledWith({
        Table: 'A',
        TestType: 'free test'
      });
      expect(result).toEqual(row);
    });
  });

  describe('getEventById', () => {
    test('returns event by id', async () => {
      const event = { _id: 'e1' };
      const execMock = jest.fn().mockResolvedValue(event);
      Event.findById.mockReturnValue({ exec: execMock });

      const result = await getEventById('e1');

      expect(Event.findById).toHaveBeenCalledWith('e1');
      expect(result).toEqual(event);
    });
  });

  describe('getScoreSheetTemplate', () => {
    test('queries score sheet template by type/category/judges/role', async () => {
      const row = { _id: 'st1' };
      const execMock = jest.fn().mockResolvedValue(row);
      ScoreSheetTemp.findOne.mockReturnValue({ exec: execMock });

      const result = await getScoreSheetTemplate('Free Test', 'cat1', 3, 'judge');

      const query = ScoreSheetTemp.findOne.mock.calls[0][0];
      expect(query.TestType.$regex).toBeInstanceOf(RegExp);
      expect(query.TestType.$regex.source).toBe('^Free Test$');
      expect(query.TestType.$regex.flags).toContain('i');
      expect(query.CategoryId).toBe('cat1');
      expect(query.numberOfJudges).toBe(3);
      expect(query.typeOfScores).toBe('judge');
      expect(result).toEqual(row);
    });
  });

  describe('getTimetablePartsByEvent', () => {
    test('loads event daily tables then returns populated timetable parts', async () => {
      const daily = [{ _id: 'd1' }];
      const dtExecMock = jest.fn().mockResolvedValue(daily);
      DailyTimeTable.find.mockReturnValue({ exec: dtExecMock });

      const rows = [{ _id: 'tp1' }];
      const tpExecMock = jest.fn().mockResolvedValue(rows);
      const chain = { populate: jest.fn() };
      let count = 0;
      chain.populate.mockImplementation(() => {
        count += 1;
        if (count === 2) {
          return { exec: tpExecMock };
        }
        return chain;
      });
      TimetablePart.find.mockReturnValue(chain);

      const result = await getTimetablePartsByEvent('e1');

      expect(DailyTimeTable.find).toHaveBeenCalledWith({ event: 'e1' });
      expect(TimetablePart.find).toHaveBeenCalledWith({ dailytimetable: { $in: ['d1'] } });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'dailytimetable');
      expect(chain.populate).toHaveBeenNthCalledWith(2, {
        path: 'StartingOrder',
        populate: [
          {
            path: 'Entry',
            populate: [{ path: 'vaulter' }]
          }
        ]
      });
      expect(result).toEqual(rows);
    });
  });
});

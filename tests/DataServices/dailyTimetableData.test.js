import {
  getAllDailyTimeTables,
  getDailyTimeTableById,
  createDailyTimeTable,
  updateDailyTimeTable,
  deleteDailyTimeTable,
  getDailyTimeTableFormData,
  getTimetablePartsByDailyTimeTable,
  getAllTimetableParts,
  getTimetablePartById,
  createTimetablePart,
  updateTimetablePart,
  deleteTimetablePart,
  saveTimetablePartStartTime,
  getTimetablePartFormData
} from '../../DataServices/dailyTimetableData.js';
import DailyTimeTable from '../../models/DailyTimeTable.js';
import TimetablePart from '../../models/Timetablepart.js';
import Event from '../../models/Event.js';
import User from '../../models/User.js';
import ScoreSheet from '../../models/ScoreSheet.js';
import { getAllCategoriesByStar } from '../../DataServices/categoryData.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/DailyTimeTable.js', () => {
  const DailyTimeTableMock = jest.fn();
  DailyTimeTableMock.find = jest.fn();
  DailyTimeTableMock.findById = jest.fn();
  DailyTimeTableMock.findByIdAndUpdate = jest.fn();
  DailyTimeTableMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: DailyTimeTableMock
  };
});

jest.mock('../../models/Timetablepart.js', () => {
  const TimetablePartMock = jest.fn();
  TimetablePartMock.find = jest.fn();
  TimetablePartMock.findById = jest.fn();
  TimetablePartMock.findByIdAndUpdate = jest.fn();
  TimetablePartMock.findByIdAndDelete = jest.fn();
  TimetablePartMock.deleteMany = jest.fn();

  return {
    __esModule: true,
    default: TimetablePartMock
  };
});

jest.mock('../../models/Event.js', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('../../models/ScoreSheet.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../DataServices/categoryData.js', () => ({
  __esModule: true,
  getAllCategoriesByStar: jest.fn()
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

describe('dailyTimetableData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDailyTimeTables', () => {
    test('returns all daily timetables for an event sorted by date', async () => {
      const rows = [{ _id: 'd1', Date: new Date('2026-01-01') }];
      const sortMock = jest.fn().mockResolvedValue(rows);
      DailyTimeTable.find.mockReturnValue({ sort: sortMock });

      const result = await getAllDailyTimeTables('event1');

      expect(DailyTimeTable.find).toHaveBeenCalledWith({ event: 'event1' });
      expect(sortMock).toHaveBeenCalledWith({ Date: 1 });
      expect(result).toEqual(rows);
    });
  });

  describe('getDailyTimeTableById', () => {
    test('returns daily timetable by id', async () => {
      const row = { _id: 'd1' };
      DailyTimeTable.findById.mockResolvedValue(row);

      const result = await getDailyTimeTableById('d1');

      expect(DailyTimeTable.findById).toHaveBeenCalledWith('d1');
      expect(result).toEqual(row);
    });
  });

  describe('createDailyTimeTable', () => {
    test('creates, saves and logs daily timetable', async () => {
      const payload = { Date: '2026-01-01', event: 'event1' };
      const created = {
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      DailyTimeTable.mockImplementation(() => created);

      const result = await createDailyTimeTable(payload);

      expect(DailyTimeTable).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'DailyTimeTable', '2026-01-01');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const payload = { Date: '2026-01-01', event: 'event1' };
      const created = {
        ...payload,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      DailyTimeTable.mockImplementation(() => created);

      await expect(createDailyTimeTable(payload)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateDailyTimeTable', () => {
    test('updates and logs when no submitted score sheets exist', async () => {
      const selectMock = jest.fn().mockResolvedValue([{ _id: 'tp1' }, { _id: 'tp2' }]);
      TimetablePart.find.mockReturnValue({ select: selectMock });
      ScoreSheet.find.mockResolvedValue([]);
      DailyTimeTable.findByIdAndUpdate.mockResolvedValue({ _id: 'd1', Date: '2026-01-02' });

      const result = await updateDailyTimeTable('d1', { Date: '2026-01-02' });

      expect(TimetablePart.find).toHaveBeenCalledWith({ dailytimetable: 'd1' });
      expect(selectMock).toHaveBeenCalledWith('_id');
      expect(ScoreSheet.find).toHaveBeenCalledWith({ TimetablePartId: { $in: ['tp1', 'tp2'] } });
      expect(DailyTimeTable.findByIdAndUpdate).toHaveBeenCalledWith(
        'd1',
        { Date: '2026-01-02' },
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'DailyTimeTable', '2026-01-02');
      expect(result).toEqual({ _id: 'd1', Date: '2026-01-02' });
    });

    test('throws when submitted score sheets exist', async () => {
      const selectMock = jest.fn().mockResolvedValue([{ _id: 'tp1' }]);
      TimetablePart.find.mockReturnValue({ select: selectMock });
      ScoreSheet.find.mockResolvedValue([{ _id: 's1' }]);

      await expect(updateDailyTimeTable('d1', { Date: '2026-01-02' })).rejects.toThrow(
        'Cannot edit DailyTimeTable with submitted score sheets'
      );

      expect(DailyTimeTable.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteDailyTimeTable', () => {
    test('deletes timetable parts and daily timetable, then logs', async () => {
      TimetablePart.deleteMany.mockResolvedValue({ deletedCount: 2 });
      DailyTimeTable.findByIdAndDelete.mockResolvedValue({ _id: 'd1', Date: '2026-01-03' });

      const result = await deleteDailyTimeTable('d1');

      expect(TimetablePart.deleteMany).toHaveBeenCalledWith({ dailytimetable: 'd1' });
      expect(DailyTimeTable.findByIdAndDelete).toHaveBeenCalledWith('d1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'DailyTimeTable', '2026-01-03');
      expect(result).toEqual({ _id: 'd1', Date: '2026-01-03' });
    });
  });

  describe('getDailyTimeTableFormData', () => {
    test('returns empty object', async () => {
      const result = await getDailyTimeTableFormData();

      expect(result).toEqual({});
    });
  });

  describe('getTimetablePartsByDailyTimeTable', () => {
    test('returns timetable parts sorted and populated', async () => {
      const rows = [{ _id: 'tp1' }];
      const execMock = jest.fn().mockResolvedValue(rows);
      const populateMock = jest.fn().mockReturnValue({ exec: execMock });
      const sortMock = jest.fn().mockReturnValue({ populate: populateMock });
      TimetablePart.find.mockReturnValue({ sort: sortMock });

      const result = await getTimetablePartsByDailyTimeTable('d1');

      expect(TimetablePart.find).toHaveBeenCalledWith({ dailytimetable: 'd1' });
      expect(sortMock).toHaveBeenCalledWith({ StartTimePlanned: 1 });
      expect(populateMock).toHaveBeenCalledWith('Category');
      expect(execMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getAllTimetableParts', () => {
    test('returns all timetable parts', async () => {
      const rows = [{ _id: 'tp1' }];
      TimetablePart.find.mockResolvedValue(rows);

      const result = await getAllTimetableParts();

      expect(TimetablePart.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getTimetablePartById', () => {
    test('returns timetable part with populated dailytimetable', async () => {
      const row = { _id: 'tp1', dailytimetable: { _id: 'd1' } };
      const populateMock = jest.fn().mockResolvedValue(row);
      TimetablePart.findById.mockReturnValue({ populate: populateMock });

      const result = await getTimetablePartById('tp1');

      expect(TimetablePart.findById).toHaveBeenCalledWith('tp1');
      expect(populateMock).toHaveBeenCalledWith('dailytimetable');
      expect(result).toEqual(row);
    });
  });

  describe('createTimetablePart', () => {
    test('creates timetable part, saves and logs', async () => {
      const payload = { dailytimetable: 'd1', Category: 'c1' };
      const created = {
        _id: 'tp1',
        ...payload,
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.mockImplementation(() => created);

      const result = await createTimetablePart(payload);

      expect(TimetablePart).toHaveBeenCalledWith(payload);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'TimetablePart', 'tp1');
      expect(result).toBe(created);
    });
  });

  describe('updateTimetablePart', () => {
    test('updates timetable part when no score sheets exist and logs', async () => {
      ScoreSheet.find.mockResolvedValue([]);
      TimetablePart.findByIdAndUpdate.mockResolvedValue({ _id: 'tp1', note: 'ok' });

      const result = await updateTimetablePart('tp1', { note: 'ok' });

      expect(ScoreSheet.find).toHaveBeenCalledWith({ TimetablePartId: 'tp1' });
      expect(TimetablePart.findByIdAndUpdate).toHaveBeenCalledWith(
        'tp1',
        { note: 'ok' },
        { runValidators: true, new: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(result).toEqual({ _id: 'tp1', note: 'ok' });
    });

    test('throws when score sheets exist', async () => {
      ScoreSheet.find.mockResolvedValue([{ _id: 's1' }]);

      await expect(updateTimetablePart('tp1', { note: 'x' })).rejects.toThrow(
        'Cannot edit TimetablePart with submitted score sheets'
      );

      expect(TimetablePart.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteTimetablePart', () => {
    test('deletes timetable part and logs deletion', async () => {
      TimetablePart.findByIdAndDelete.mockResolvedValue({ _id: 'tp1' });

      await deleteTimetablePart('tp1');

      expect(TimetablePart.findByIdAndDelete).toHaveBeenCalledWith('tp1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'TimetablePart', 'tp1');
    });
  });

  describe('saveTimetablePartStartTime', () => {
    test('sets StartTimeReal to current date, saves and logs', async () => {
      const part = {
        _id: 'tp1',
        StartTimeReal: null,
        save: jest.fn().mockResolvedValue(undefined)
      };
      TimetablePart.findById.mockResolvedValue(part);

      const result = await saveTimetablePartStartTime('tp1');

      expect(TimetablePart.findById).toHaveBeenCalledWith('tp1');
      expect(part.StartTimeReal).toBeInstanceOf(Date);
      expect(part.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'TimetablePart', 'tp1');
      expect(result).toBe(part);
    });

    test('throws when timetable part not found', async () => {
      TimetablePart.findById.mockResolvedValue(null);

      await expect(saveTimetablePartStartTime('missing')).rejects.toThrow('Timetable element not found');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getTimetablePartFormData', () => {
    test('returns judges, days and categories for form data', async () => {
      const onsite = {
        AssignedOfficials: [
          { userID: 'u1' },
          { userID: 'u2' },
          { userID: null }
        ]
      };

      const eventSelectMock = jest.fn().mockResolvedValue(onsite);
      Event.findOne.mockReturnValue({ select: eventSelectMock });

      const user1SelectMock = jest.fn().mockResolvedValue({
        _id: 'u1',
        username: 'judge-1',
        role: { roleName: 'Judge A' }
      });
      const user1PopulateMock = jest.fn().mockReturnValue({ select: user1SelectMock });

      const user2SelectMock = jest.fn().mockResolvedValue({
        _id: 'u2',
        username: 'staff-1',
        role: { roleName: 'Office Staff' }
      });
      const user2PopulateMock = jest.fn().mockReturnValue({ select: user2SelectMock });

      User.findById
        .mockReturnValueOnce({ populate: user1PopulateMock })
        .mockReturnValueOnce({ populate: user2PopulateMock });

      const days = [{ _id: 'd1', Date: '2026-01-01' }];
      const daySortMock = jest.fn().mockResolvedValue(days);
      DailyTimeTable.find.mockReturnValue({ sort: daySortMock });

      const categories = [{ _id: 'c1', CategoryDispName: 'Senior' }];
      getAllCategoriesByStar.mockResolvedValue(categories);

      const result = await getTimetablePartFormData('event1');

      expect(Event.findOne).toHaveBeenCalledWith({ selected: true });
      expect(eventSelectMock).toHaveBeenCalledWith('AssignedOfficials');
      expect(User.findById).toHaveBeenNthCalledWith(1, 'u1');
      expect(User.findById).toHaveBeenNthCalledWith(2, 'u2');
      expect(user1PopulateMock).toHaveBeenCalledWith('role');
      expect(user1SelectMock).toHaveBeenCalledWith('-password');
      expect(user2PopulateMock).toHaveBeenCalledWith('role');
      expect(user2SelectMock).toHaveBeenCalledWith('-password');
      expect(DailyTimeTable.find).toHaveBeenCalledWith({ event: 'event1' });
      expect(daySortMock).toHaveBeenCalledWith({ Date: 1 });
      expect(getAllCategoriesByStar).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        judges: [{ _id: 'u1', username: 'judge-1', role: { roleName: 'Judge A' } }],
        days,
        categorys: categories
      });
    });

    test('throws when onsite officials are missing', async () => {
      const eventSelectMock = jest.fn().mockResolvedValue({ AssignedOfficials: null });
      Event.findOne.mockReturnValue({ select: eventSelectMock });

      await expect(getTimetablePartFormData('event1')).rejects.toThrow('No onsite officials found');

      expect(User.findById).not.toHaveBeenCalled();
      expect(DailyTimeTable.find).not.toHaveBeenCalled();
      expect(getAllCategoriesByStar).not.toHaveBeenCalled();
    });

    test('filters out missing users from resolved user list', async () => {
      const onsite = {
        AssignedOfficials: [{ userID: 'u1' }, { userID: 'u2' }]
      };

      const eventSelectMock = jest.fn().mockResolvedValue(onsite);
      Event.findOne.mockReturnValue({ select: eventSelectMock });

      const user1SelectMock = jest.fn().mockResolvedValue(null);
      const user1PopulateMock = jest.fn().mockReturnValue({ select: user1SelectMock });

      const user2SelectMock = jest.fn().mockResolvedValue({
        _id: 'u2',
        username: 'judge-2',
        role: { roleName: 'Judge B' }
      });
      const user2PopulateMock = jest.fn().mockReturnValue({ select: user2SelectMock });

      User.findById
        .mockReturnValueOnce({ populate: user1PopulateMock })
        .mockReturnValueOnce({ populate: user2PopulateMock });

      const daySortMock = jest.fn().mockResolvedValue([]);
      DailyTimeTable.find.mockReturnValue({ sort: daySortMock });
      getAllCategoriesByStar.mockResolvedValue([]);

      const result = await getTimetablePartFormData('event1');

      expect(result.judges).toEqual([
        { _id: 'u2', username: 'judge-2', role: { roleName: 'Judge B' } }
      ]);
    });
  });
});

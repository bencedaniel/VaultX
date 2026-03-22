import {
  getResultGroupsByEvent,
  getResultGroupsForResults,
  getResultGroupById,
  getResultGroupWithDetails,
  getGroupFormData,
  updateResultGroup,
  createResultGroup,
  deleteResultGroup,
  generateGroupsForActiveGenerators
} from '../../DataServices/resultGroupData.js';
import resultGroup from '../../models/resultGroup.js';
import resultGenerator from '../../models/resultGenerator.js';
import Category from '../../models/Category.js';
import calcTemplate from '../../models/calcTemplate.js';
import DailyTimeTable from '../../models/DailyTimeTable.js';
import TimetablePart from '../../models/Timetablepart.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/resultGroup.js', () => {
  const ResultGroupMock = jest.fn();
  ResultGroupMock.find = jest.fn();
  ResultGroupMock.findById = jest.fn();
  ResultGroupMock.findByIdAndUpdate = jest.fn();
  ResultGroupMock.findByIdAndDelete = jest.fn();
  ResultGroupMock.findOne = jest.fn();

  return {
    __esModule: true,
    default: ResultGroupMock
  };
});

jest.mock('../../models/resultGenerator.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/Category.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/calcTemplate.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/DailyTimeTable.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/Timetablepart.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logDebug: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

function makePopulateChain(finalValue, count) {
  const chain = { populate: jest.fn() };
  let calls = 0;
  chain.populate.mockImplementation(() => {
    calls += 1;
    if (calls === count) {
      return Promise.resolve(finalValue);
    }
    return chain;
  });
  return chain;
}

describe('resultGroupData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResultGroupsByEvent', () => {
    test('returns groups with full population sorted by category star desc', async () => {
      const groups = [
        { _id: 'g1', category: { Star: 1 } },
        { _id: 'g2', category: { Star: 4 } },
        { _id: 'g3', category: { Star: 2 } }
      ];
      const chain = makePopulateChain(groups, 6);
      resultGroup.find.mockReturnValue(chain);

      const result = await getResultGroupsByEvent('ev1');

      expect(resultGroup.find).toHaveBeenCalledWith({ event: 'ev1' });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'event');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'calcTemplate');
      expect(chain.populate).toHaveBeenNthCalledWith(4, {
        path: 'round1First',
        populate: { path: 'dailytimetable' }
      });
      expect(chain.populate).toHaveBeenNthCalledWith(5, {
        path: 'round1Second',
        populate: { path: 'dailytimetable' }
      });
      expect(chain.populate).toHaveBeenNthCalledWith(6, {
        path: 'round2First',
        populate: { path: 'dailytimetable' }
      });
      expect(result.map(g => g._id)).toEqual(['g2', 'g3', 'g1']);
    });
  });

  describe('getResultGroupsForResults', () => {
    test('returns groups with simplified population sorted by category star desc', async () => {
      const groups = [
        { _id: 'g1', category: { Star: 2 } },
        { _id: 'g2', category: { Star: 5 } }
      ];
      const chain = makePopulateChain(groups, 5);
      resultGroup.find.mockReturnValue(chain);

      const result = await getResultGroupsForResults('ev1');

      expect(resultGroup.find).toHaveBeenCalledWith({ event: 'ev1' });
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'calcTemplate');
      expect(result.map(g => g._id)).toEqual(['g2', 'g1']);
    });
  });

  describe('getResultGroupById', () => {
    test('returns result group by id', async () => {
      const group = { _id: 'g1' };
      resultGroup.findById.mockResolvedValue(group);

      const result = await getResultGroupById('g1');

      expect(resultGroup.findById).toHaveBeenCalledWith('g1');
      expect(result).toEqual(group);
    });
  });

  describe('getResultGroupWithDetails', () => {
    test('returns fully populated result group details', async () => {
      const group = { _id: 'g1' };
      const chain = makePopulateChain(group, 5);
      resultGroup.findById.mockReturnValue(chain);

      const result = await getResultGroupWithDetails('g1');

      expect(resultGroup.findById).toHaveBeenCalledWith('g1');
      expect(chain.populate).toHaveBeenNthCalledWith(1, 'category');
      expect(chain.populate).toHaveBeenNthCalledWith(2, 'calcTemplate');
      expect(chain.populate).toHaveBeenNthCalledWith(3, 'round1First');
      expect(chain.populate).toHaveBeenNthCalledWith(4, 'round1Second');
      expect(chain.populate).toHaveBeenNthCalledWith(5, 'round2First');
      expect(result).toEqual(group);
    });
  });

  describe('getGroupFormData', () => {
    test('returns categories/templates and timetable parts grouped by round', async () => {
      const categories = [{ _id: 'c1' }];
      const templates = [{ _id: 't1' }];
      const dailyTimetables = [{ _id: 'd1' }, { _id: 'd2' }];
      const allParts = [{ _id: 'tp1' }];
      const round1Parts = [{ _id: 'tp2' }];
      const round2Parts = [{ _id: 'tp3' }];

      Category.find.mockResolvedValue(categories);
      calcTemplate.find.mockResolvedValue(templates);

      const dtSelectMock = jest.fn().mockResolvedValue(dailyTimetables);
      DailyTimeTable.find.mockReturnValue({ select: dtSelectMock });

      const tpPopulate1 = jest.fn().mockResolvedValue(allParts);
      const tpPopulate2 = jest.fn().mockResolvedValue(round1Parts);
      const tpPopulate3 = jest.fn().mockResolvedValue(round2Parts);
      TimetablePart.find
        .mockReturnValueOnce({ populate: tpPopulate1 })
        .mockReturnValueOnce({ populate: tpPopulate2 })
        .mockReturnValueOnce({ populate: tpPopulate3 });

      const result = await getGroupFormData('ev1');

      expect(DailyTimeTable.find).toHaveBeenCalledWith({ event: 'ev1' });
      expect(dtSelectMock).toHaveBeenCalledWith('_id');
      expect(TimetablePart.find).toHaveBeenNthCalledWith(1, {
        dailytimetable: { $in: ['d1', 'd2'] }
      });
      expect(TimetablePart.find).toHaveBeenNthCalledWith(2, {
        dailytimetable: { $in: ['d1', 'd2'] },
        Round: '1'
      });
      expect(TimetablePart.find).toHaveBeenNthCalledWith(3, {
        dailytimetable: { $in: ['d1', 'd2'] },
        Round: '2 - Final'
      });
      expect(result).toEqual({
        categories,
        calcTemplates: templates,
        timetableParts: allParts,
        timetablePartsRound1: round1Parts,
        timetablePartsRound2: round2Parts
      });
    });
  });

  describe('updateResultGroup', () => {
    test('throws when same timetable part is selected for multiple rounds', async () => {
      const payload = {
        round1First: 'tp1',
        round1Second: 'tp1',
        round2First: 'tp2'
      };

      await expect(updateResultGroup('g1', payload)).rejects.toThrow(
        'The same timetable part cannot be selected for multiple rounds.'
      );
      expect(resultGroup.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('normalizes empty ids to null, updates and logs', async () => {
      const payload = {
        round1First: '',
        round1Second: 'tp2',
        round2First: null,
        note: 'ok'
      };
      const updated = { _id: 'g1' };
      resultGroup.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await updateResultGroup('g1', payload);

      expect(resultGroup.findByIdAndUpdate).toHaveBeenCalledWith(
        'g1',
        {
          round1First: null,
          round1Second: 'tp2',
          round2First: null,
          note: 'ok'
        },
        { new: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'ResultGroup', 'g1');
      expect(result).toEqual(updated);
    });
  });

  describe('createResultGroup', () => {
    test('throws when same timetable part is selected for multiple rounds', async () => {
      const payload = {
        round1First: 'tp1',
        round1Second: 'tp1',
        round2First: 'tp3'
      };

      await expect(createResultGroup('ev1', payload)).rejects.toThrow(
        'The same timetable part cannot be selected for multiple rounds.'
      );
      expect(resultGroup).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });

    test('normalizes ids, sets event, creates and logs group', async () => {
      const payload = {
        round1First: 'tp1',
        round1Second: '',
        round2First: undefined,
        calcTemplate: 't1'
      };
      const created = {
        _id: 'g1',
        save: jest.fn().mockResolvedValue(undefined)
      };
      resultGroup.mockImplementation(() => created);

      const result = await createResultGroup('ev1', payload);

      expect(resultGroup).toHaveBeenCalledWith({
        round1First: 'tp1',
        round1Second: null,
        round2First: null,
        calcTemplate: 't1',
        event: 'ev1'
      });
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'ResultGroup', 'g1');
      expect(result).toBe(created);
    });
  });

  describe('deleteResultGroup', () => {
    test('deletes result group and logs deletion', async () => {
      resultGroup.findByIdAndDelete.mockResolvedValue({ _id: 'g1' });

      const result = await deleteResultGroup('g1');

      expect(resultGroup.findByIdAndDelete).toHaveBeenCalledWith('g1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'ResultGroup', 'g1');
      expect(result).toBeUndefined();
    });
  });

  describe('generateGroupsForActiveGenerators', () => {
    test('creates groups only for active generators without existing group', async () => {
      const generators = [
        { _id: 'gen1', category: 'c1', calcSchemaTemplate: 't1' },
        { _id: 'gen2', category: 'c2', calcSchemaTemplate: 't2' }
      ];
      resultGenerator.find.mockResolvedValue(generators);
      resultGroup.findOne
        .mockResolvedValueOnce({ _id: 'existingGroup' })
        .mockResolvedValueOnce(null);

      const created = {
        _id: 'g-new',
        save: jest.fn().mockResolvedValue(undefined)
      };
      resultGroup.mockImplementation(() => created);

      const result = await generateGroupsForActiveGenerators('ev1', 'admin');

      expect(resultGenerator.find).toHaveBeenCalledWith({ active: true });
      expect(resultGroup.findOne).toHaveBeenNthCalledWith(1, { event: 'ev1', category: 'c1' });
      expect(resultGroup.findOne).toHaveBeenNthCalledWith(2, { event: 'ev1', category: 'c2' });
      expect(resultGroup).toHaveBeenCalledTimes(1);
      expect(resultGroup).toHaveBeenCalledWith({
        event: 'ev1',
        category: 'c2',
        calcTemplate: 't2'
      });
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'ResultGroup', 'g-new');
      expect(result).toBeUndefined();
    });

    test('does nothing when no active generators exist', async () => {
      resultGenerator.find.mockResolvedValue([]);

      await generateGroupsForActiveGenerators('ev1', 'admin');

      expect(resultGroup.findOne).not.toHaveBeenCalled();
      expect(resultGroup).not.toHaveBeenCalled();
      expect(logDb).not.toHaveBeenCalled();
    });
  });
});

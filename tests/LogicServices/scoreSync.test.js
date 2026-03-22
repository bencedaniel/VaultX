import { syncScoreTable } from '../../LogicServices/scoreSync.js';
import { logDebug, logDb } from '../../logger.js';
import {
  getScoresByTimetableAndEntry,
  createScore,
  updateScore
} from '../../DataServices/resultData.js';
import { getSubmittedScoreSheets } from '../../DataServices/scoreSheetData.js';
import { getTimetablePartById } from '../../DataServices/dailyTimetableData.js';
import { ValidationError } from '../../middleware/errorHandler.js';

jest.mock('../../logger.js', () => ({
  logDebug: jest.fn(),
  logDb: jest.fn(),
  logger: {
    debug: jest.fn(),
    userManagement: jest.fn()
  }
}));

jest.mock('../../DataServices/resultData.js', () => ({
  getScoresByTimetableAndEntry: jest.fn(),
  createScore: jest.fn(),
  updateScore: jest.fn(),
  deleteMultipleScores: jest.fn()
}));

jest.mock('../../DataServices/scoreSheetData.js', () => ({
  getSubmittedScoreSheets: jest.fn()
}));

jest.mock('../../DataServices/dailyTimetableData.js', () => ({
  getTimetablePartById: jest.fn()
}));

describe('LogicServices/scoreSync.syncScoreTable', () => {
  const timetablePartId = 'tp1';
  const entryId = 'en1';
  const eventId = 'ev1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates score when none exists and all judges submitted', async () => {
    getScoresByTimetableAndEntry.mockResolvedValue([]);
    getTimetablePartById.mockResolvedValue({ NumberOfJudges: 2 });
    getSubmittedScoreSheets.mockResolvedValue([
      { _id: 'ss1', Judge: { table: 'A' }, totalScoreBE: 8 },
      { _id: 'ss2', Judge: { table: 'B' }, totalScoreBE: 10 }
    ]);

    const created = { _id: 'score-new' };
    createScore.mockResolvedValue(created);

    const result = await syncScoreTable(timetablePartId, entryId, eventId);

    expect(getScoresByTimetableAndEntry).toHaveBeenCalledWith(timetablePartId, entryId, eventId);
    expect(getTimetablePartById).toHaveBeenCalledWith(timetablePartId);
    expect(getSubmittedScoreSheets).toHaveBeenCalledWith(timetablePartId, entryId, eventId);

    expect(createScore).toHaveBeenCalledWith({
      timetablepart: 'tp1',
      entry: 'en1',
      event: 'ev1',
      scoresheets: [
        { scoreId: 'ss1', table: 'A' },
        { scoreId: 'ss2', table: 'B' }
      ],
      TotalScore: 9
    });
    expect(logDb).toHaveBeenCalledWith('CREATE', 'Score', 'timetablePart:tp1, Entry:en1');
    expect(result).toBe(created);
  });

  test('updates existing score when exactly one exists', async () => {
    getScoresByTimetableAndEntry.mockResolvedValue([{ _id: 'score-1' }]);
    getTimetablePartById.mockResolvedValue({ NumberOfJudges: 3 });
    getSubmittedScoreSheets.mockResolvedValue([
      { _id: 'ss1', Judge: { table: 'A' }, totalScoreBE: 7.5 },
      { _id: 'ss2', Judge: { table: 'B' }, totalScoreBE: 8.5 }
    ]);

    const updated = { _id: 'score-1', TotalScore: 8 };
    updateScore.mockResolvedValue(updated);

    const result = await syncScoreTable(timetablePartId, entryId, eventId);

    expect(updateScore).toHaveBeenCalledWith('score-1', {
      timetablepart: 'tp1',
      entry: 'en1',
      event: 'ev1',
      scoresheets: [
        { scoreId: 'ss1', table: 'A' },
        { scoreId: 'ss2', table: 'B' }
      ],
      TotalScore: 8
    });
    expect(logDb).toHaveBeenCalledWith('UPDATE', 'Score', 'score-1');
    expect(result).toBe(updated);
  });

  test('returns null when no score exists and submissions are incomplete', async () => {
    getScoresByTimetableAndEntry.mockResolvedValue([]);
    getTimetablePartById.mockResolvedValue({ NumberOfJudges: 3 });
    getSubmittedScoreSheets.mockResolvedValue([
      { _id: 'ss1', Judge: { table: 'A' }, totalScoreBE: 8 }
    ]);

    const result = await syncScoreTable(timetablePartId, entryId, eventId);

    expect(createScore).not.toHaveBeenCalled();
    expect(updateScore).not.toHaveBeenCalled();
    expect(logDb).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test('throws ValidationError when multiple scores exist', async () => {
    getScoresByTimetableAndEntry.mockResolvedValue([{ _id: 's1' }, { _id: 's2' }]);
    getTimetablePartById.mockResolvedValue({ NumberOfJudges: 2 });
    getSubmittedScoreSheets.mockResolvedValue([
      { _id: 'ss1', Judge: { table: 'A' }, totalScoreBE: 8 },
      { _id: 'ss2', Judge: { table: 'B' }, totalScoreBE: 9 }
    ]);

    const action = syncScoreTable(timetablePartId, entryId, eventId);
    await expect(action).rejects.toBeInstanceOf(ValidationError);
    await expect(action).rejects.toThrow(
      'Data inconsistency: Multiple scores found for timetablePartId: tp1, EntryId: en1, EventId: ev1'
    );
  });

  test('logs debug message with score count context', async () => {
    getScoresByTimetableAndEntry.mockResolvedValue([]);
    getTimetablePartById.mockResolvedValue({ NumberOfJudges: 1 });
    getSubmittedScoreSheets.mockResolvedValue([{ _id: 'ss1', Judge: { table: 'A' }, totalScoreBE: 10 }]);
    createScore.mockResolvedValue({ _id: 'score-new' });

    await syncScoreTable(timetablePartId, entryId, eventId);

    expect(logDebug).toHaveBeenCalledWith(
      'Score sync',
      '0 scores found for timetablePartId: tp1, EntryId: en1, EventId: ev1'
    );
  });
});

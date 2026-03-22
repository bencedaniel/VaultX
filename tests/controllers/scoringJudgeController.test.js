import { logWarn } from '../../logger.js';
import { MESSAGES } from '../../config/index.js';
import { calculateScore } from '../../LogicServices/scoreCalculations.js';
import { syncScoreTable } from '../../LogicServices/scoreSync.js';
import { getSubmittedScoreSheets, saveScoreSheet } from '../../DataServices/scoreSheetData.js';
import {
    getTodaysTimetable,
    getTimetablePartsByDaily,
    getTimetablePartById,
    getJudgeById,
    getEntriesByEvent,
    getEntryById,
    getTableMapping,
    getEventById,
    getScoreSheetTemplate,
    getTimetablePartByIdWithDaily
} from '../../DataServices/scoringData.js';
import scoringJudgeController from '../../controllers/scoringJudgeController.js';

jest.mock('../../logger.js');
jest.mock('../../LogicServices/scoreCalculations.js');
jest.mock('../../LogicServices/scoreSync.js');
jest.mock('../../DataServices/scoreSheetData.js');
jest.mock('../../DataServices/scoringData.js');

describe('scoringJudgeController', () => {
    let req;
    let res;
    let next;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'judgeUser',
        role: {
            permissions: ['scoring:read', 'scoring:write']
        }
    };

    const mockEventId = '507f1f77bcf86cd799439099';

    beforeEach(() => {
        req = {
            params: { id: 'tp1', tpid: 'tp1', entryid: 'e1' },
            body: {},
            user: mockUser,
            session: {
                failMessage: null,
                successMessage: null
            }
        };

        res = {
            locals: {
                selectedEvent: { _id: mockEventId }
            },
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getScoringDashboard', () => {
        test('redirects to dashboard when no daily timetable found', async () => {
            getTodaysTimetable.mockResolvedValue(null);

            await scoringJudgeController.getScoringDashboard(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND_FOR_THIS_DAY);
            expect(res.redirect).toHaveBeenCalledWith('/dashboard');
            expect(getTimetablePartsByDaily).not.toHaveBeenCalled();
        });

        test('renders scoring dashboard with todays timetable parts', async () => {
            const day = { _id: 'day1', date: '2026-03-22' };
            const parts = [{ _id: 'tp1' }, { _id: 'tp2' }];

            getTodaysTimetable.mockResolvedValue(day);
            getTimetablePartsByDaily.mockResolvedValue(parts);

            await scoringJudgeController.getScoringDashboard(req, res, next);

            expect(getTimetablePartsByDaily).toHaveBeenCalledWith('day1');
            expect(res.render).toHaveBeenCalledWith('scoringJudge/dashboard', {
                timetableParts: parts,
                day,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('passes messages to view then clears them', async () => {
            req.session.failMessage = 'f';
            req.session.successMessage = 's';

            getTodaysTimetable.mockResolvedValue({ _id: 'day1' });
            getTimetablePartsByDaily.mockResolvedValue([]);

            await scoringJudgeController.getScoringDashboard(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('f');
            expect(data.successMessage).toBe('s');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });
    });

    describe('getProgramDetails', () => {
        test('redirects when drawing not done', async () => {
            getTimetablePartById.mockResolvedValue({ drawingDone: false, conflictsChecked: true, JudgesList: [] });

            await scoringJudgeController.getProgramDetails(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoring');
        });

        test('redirects when conflicts not checked', async () => {
            getTimetablePartById.mockResolvedValue({ drawingDone: true, conflictsChecked: false, JudgesList: [] });

            await scoringJudgeController.getProgramDetails(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoring');
        });

        test('renders program details for authorized judge', async () => {
            const timetablePart = {
                _id: 'tp1',
                drawingDone: true,
                conflictsChecked: true,
                JudgesList: [{ JudgeUserID: mockUser._id, Table: 'A' }]
            };
            const submitted = [{ _id: 'ss1' }];
            const entries = [{ _id: 'e1' }];

            getTimetablePartById.mockResolvedValue(timetablePart);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getSubmittedScoreSheets.mockResolvedValue(submitted);
            getEntriesByEvent.mockResolvedValue(entries);

            await scoringJudgeController.getProgramDetails(req, res, next);

            expect(getSubmittedScoreSheets).toHaveBeenCalledWith('tp1', null, mockEventId, mockUser._id);
            expect(getEntriesByEvent).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('scoringJudge/perprogram', {
                ScoreSheetsSubmitted: submitted,
                tablebyJudge: 'A',
                judgeName: 'Judge One',
                timetablePart: expect.objectContaining({ _id: 'tp1' }),
                entries,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('renders not authorized judge label when user not in judges list', async () => {
            const timetablePart = {
                _id: 'tp1',
                drawingDone: true,
                conflictsChecked: true,
                JudgesList: [{ JudgeUserID: 'another-judge-id', Table: 'B' }]
            };

            getTimetablePartById.mockResolvedValue(timetablePart);
            getSubmittedScoreSheets.mockResolvedValue([]);
            getEntriesByEvent.mockResolvedValue([]);

            await scoringJudgeController.getProgramDetails(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.judgeName).toBe('Not authorized judge');
            expect(data.tablebyJudge).toBe('');
            expect(getJudgeById).not.toHaveBeenCalled();
        });

        test('throws when timetablePart is null (current controller behavior)', async () => {
            getTimetablePartById.mockResolvedValue(null);

            await expect(scoringJudgeController.getProgramDetails(req, res, next)).rejects.toBeTruthy();
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('getNewScoresheetForm', () => {
        const baseTimetablePart = {
            _id: 'tp1',
            TestType: 'Compulsory',
            NumberOfJudges: 4,
            JudgesList: [{ JudgeUserID: mockUser._id, Table: 'A' }]
        };

        const baseEntry = {
            _id: 'e1',
            category: {
                _id: 'cat1',
                CategoryDispName: 'Category A'
            }
        };

        test('redirects when score already submitted', async () => {
            getTimetablePartByIdWithDaily.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([{ _id: 'existing-sheet' }]);

            await scoringJudgeController.getNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.SCORE_ALREADY_SUBMITTED);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/program/tp1');
            expect(getJudgeById).not.toHaveBeenCalled();
        });

        test('redirects when user is not assigned as judge', async () => {
            getTimetablePartByIdWithDaily.mockResolvedValue({
                ...baseTimetablePart,
                JudgesList: [{ JudgeUserID: 'other', Table: 'A' }]
            });
            getSubmittedScoreSheets.mockResolvedValue([]);

            await scoringJudgeController.getNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.NOT_ASSIGNED_AS_JUDGE);
            expect(res.redirect).toHaveBeenCalledWith('/scoring');
        });

        test('redirects with warning when no role mapping exists', async () => {
            getTimetablePartByIdWithDaily.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue(null);

            await scoringJudgeController.getNewScoresheetForm(req, res, next);

            expect(logWarn).toHaveBeenCalledWith(
                'NO_ROLE_MAPPING',
                expect.stringContaining('No RoleOfTable found for Table: A'),
                `User: ${mockUser.username}`
            );
            expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_ROLE_MAPPING);
            expect(res.redirect).toHaveBeenCalledWith('/scoring');
        });

        test('redirects when entry is not found', async () => {
            getTimetablePartByIdWithDaily.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue({ Role: 'Artistic' });
            getEntryById.mockResolvedValue(null);

            await scoringJudgeController.getNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.ENTRY_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoring');
        });

        test('redirects when no score sheet template found', async () => {
            getTimetablePartByIdWithDaily.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue({ Role: 'Artistic' });
            getEntryById.mockResolvedValue(baseEntry);
            getScoreSheetTemplate.mockResolvedValue(null);

            await scoringJudgeController.getNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_SCORE_SHEET_TEMPLATE);
            expect(logWarn).toHaveBeenCalledWith(
                'NO_SCORESHEET_TEMPLATE',
                expect.stringContaining('No ScoreSheetTemp found for TestType: Compulsory'),
                `User: ${mockUser.username}`
            );
            expect(res.redirect).toHaveBeenCalledWith('/scoring/program/tp1');
        });

        test('renders new scoresheet page on success', async () => {
            const timetablePart = { ...baseTimetablePart };
            const event = { _id: mockEventId, EventName: 'Event A' };
            const template = { _id: 'temp1', outputFieldList: [], inputFieldList: [] };

            getTimetablePartByIdWithDaily.mockResolvedValue(timetablePart);
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue({ Role: 'Artistic' });
            getEntryById.mockResolvedValue(baseEntry);
            getScoreSheetTemplate.mockResolvedValue(template);
            getEventById.mockResolvedValue(event);

            await scoringJudgeController.getNewScoresheetForm(req, res, next);

            expect(getScoreSheetTemplate).toHaveBeenCalledWith('Compulsory', 'cat1', 4, 'Artistic');
            expect(res.render).toHaveBeenCalledWith('scoringJudge/newscoresheetjudge', {
                judgeName: 'Judge One',
                judgesTable: 'A',
                event,
                scoresheetTemp: template,
                formData: { parent: 'tp1' },
                timetablePart: expect.objectContaining({ _id: 'tp1' }),
                entry: baseEntry,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });
    });

    describe('createNewScoresheet', () => {
        test('creates scoresheet, syncs table and redirects', async () => {
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: {
                    fieldA: 10,
                    fieldB: '9.5'
                }
            };

            const entry = { _id: 'e1', category: { _id: 'cat1' } };

            getEntryById.mockResolvedValue(entry);
            calculateScore.mockReturnValue(19.5);
            saveScoreSheet.mockResolvedValue(undefined);
            syncScoreTable.mockResolvedValue(undefined);

            await scoringJudgeController.createNewScoresheet(req, res, next);

            expect(req.body.ScoreSheetInput).toBeUndefined();
            expect(req.body.inputDatas).toEqual([
                { id: 'fieldA', value: '10' },
                { id: 'fieldB', value: '9.5' }
            ]);
            expect(calculateScore).toHaveBeenCalledWith(req.body.inputDatas, entry.category);
            expect(req.body.totalScoreBE).toBe(19.5);
            expect(saveScoreSheet).toHaveBeenCalledWith(req.body, 'tp1', 'e1');
            expect(syncScoreTable).toHaveBeenCalledWith('tp1', 'e1', mockEventId);
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.SCORE_SHEET_SAVED);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/program/tp1');
        });

        test('propagates save errors', async () => {
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: { fieldA: 10 }
            };

            getEntryById.mockResolvedValue({ _id: 'e1', category: { _id: 'cat1' } });
            calculateScore.mockReturnValue(10);
            saveScoreSheet.mockRejectedValue(new Error('save failed'));

            await expect(scoringJudgeController.createNewScoresheet(req, res, next)).rejects.toThrow('save failed');
            expect(syncScoreTable).not.toHaveBeenCalled();
        });

        test('propagates sync errors', async () => {
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: { fieldA: 10 }
            };

            getEntryById.mockResolvedValue({ _id: 'e1', category: { _id: 'cat1' } });
            calculateScore.mockReturnValue(10);
            saveScoreSheet.mockResolvedValue(undefined);
            syncScoreTable.mockRejectedValue(new Error('sync failed'));

            await expect(scoringJudgeController.createNewScoresheet(req, res, next)).rejects.toThrow('sync failed');
            expect(res.redirect).not.toHaveBeenCalled();
        });
    });
});

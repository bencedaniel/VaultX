import { logWarn } from '../../logger.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import { calculateScore } from '../../LogicServices/scoreCalculations.js';
import { syncScoreTable } from '../../LogicServices/scoreSync.js';
import {
    getEventScoreSheets,
    getScoreSheetById,
    getEventScores,
    getScoreById,
    getSubmittedScoreSheets,
    saveScoreSheet,
    updateScoreSheet
} from '../../DataServices/scoreSheetData.js';
import {
    getTimetablePartsByEvent,
    getTimetablePartById,
    getJudgeById,
    getEntryById,
    getTableMapping,
    getEventById,
    getScoreSheetTemplate
} from '../../DataServices/scoringData.js';
import scoringOfficeController from '../../controllers/scoringOfficeController.js';

jest.mock('../../logger.js');
jest.mock('../../LogicServices/scoreCalculations.js');
jest.mock('../../LogicServices/scoreSync.js');
jest.mock('../../DataServices/scoreSheetData.js');
jest.mock('../../DataServices/scoringData.js');

describe('scoringOfficeController', () => {
    let req;
    let res;
    let next;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'officeUser',
        role: {
            permissions: ['scoring-office:read', 'scoring-office:write']
        }
    };

    const mockEventId = '507f1f77bcf86cd799439099';

    beforeEach(() => {
        req = {
            params: { id: 'ss1', entryid: 'e1', tpid: 'tp1' },
            body: {},
            user: JSON.parse(JSON.stringify(mockUser)),
            session: {
                failMessage: null,
                successMessage: null,
                judgeID: null
            }
        };

        res = {
            locals: {
                selectedEvent: { _id: mockEventId }
            },
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getOfficeDashboard', () => {
        test('renders dashboard with event scoresheets', async () => {
            const scoreSheets = [{ _id: 'ss1' }, { _id: 'ss2' }];
            getEventScoreSheets.mockResolvedValue(scoreSheets);

            await scoringOfficeController.getOfficeDashboard(req, res, next);

            expect(getEventScoreSheets).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('scoringOffice/dashboard', {
                scoreSheets,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('passes and clears session messages', async () => {
            req.session.failMessage = 'fail';
            req.session.successMessage = 'ok';
            getEventScoreSheets.mockResolvedValue([]);

            await scoringOfficeController.getOfficeDashboard(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('fail');
            expect(data.successMessage).toBe('ok');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates data errors', async () => {
            getEventScoreSheets.mockRejectedValue(new Error('dashboard fail'));

            await expect(scoringOfficeController.getOfficeDashboard(req, res, next)).rejects.toThrow('dashboard fail');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('getEditScoresheetForm', () => {
        test('renders edit scoresheet form with nested data', async () => {
            const scoresheet = {
                _id: 'ss1',
                Judge: {
                    userId: { fullname: 'Judge One' },
                    table: 'A'
                },
                EventId: { _id: mockEventId },
                TemplateId: { _id: 'temp1' },
                TimetablePartId: { _id: 'tp1' },
                EntryId: { _id: 'e1' }
            };

            getScoreSheetById.mockResolvedValue(scoresheet);

            await scoringOfficeController.getEditScoresheetForm(req, res, next);

            expect(getScoreSheetById).toHaveBeenCalledWith('ss1');
            expect(res.render).toHaveBeenCalledWith('scoringJudge/editscoresheetjudge', {
                scoresheet,
                judgeName: 'Judge One',
                judgesTable: 'A',
                event: scoresheet.EventId,
                scoresheetTemp: scoresheet.TemplateId,
                timetablePart: scoresheet.TimetablePartId,
                entry: scoresheet.EntryId,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('propagates load errors', async () => {
            getScoreSheetById.mockRejectedValue(new Error('load fail'));

            await expect(scoringOfficeController.getEditScoresheetForm(req, res, next)).rejects.toThrow('load fail');
        });
    });

    describe('updateScoresheetById', () => {
        test('updates scoresheet, syncs table and redirects to provided path', async () => {
            req.params.id = 'ss1';
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: {
                    scoreA: 9,
                    scoreB: '8.5'
                }
            };

            const entry = { _id: 'e1', category: { _id: 'cat1' } };
            getEntryById.mockResolvedValue(entry);
            calculateScore.mockReturnValue(17.5);
            updateScoreSheet.mockResolvedValue(undefined);
            syncScoreTable.mockResolvedValue(undefined);

            await scoringOfficeController.updateScoresheetById(req, res, '/scoring/office/dashboard');

            expect(req.body.ScoreSheetInput).toBeUndefined();
            expect(req.body.inputDatas).toEqual([
                { id: 'scoreA', value: '9' },
                { id: 'scoreB', value: '8.5' }
            ]);
            expect(calculateScore).toHaveBeenCalledWith(req.body.inputDatas, entry.category);
            expect(req.body.totalScoreBE).toBe(17.5);
            expect(updateScoreSheet).toHaveBeenCalledWith('ss1', req.body, 'tp1', 'e1');
            expect(syncScoreTable).toHaveBeenCalledWith('tp1', 'e1', mockEventId);
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.SCORE_SHEET_SAVED);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('propagates update errors', async () => {
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: { scoreA: 9 }
            };

            getEntryById.mockResolvedValue({ _id: 'e1', category: { _id: 'cat1' } });
            calculateScore.mockReturnValue(9);
            updateScoreSheet.mockRejectedValue(new Error('update fail'));

            await expect(scoringOfficeController.updateScoresheetById(req, res, '/x')).rejects.toThrow('update fail');
            expect(syncScoreTable).not.toHaveBeenCalled();
        });
    });

    describe('getNewScoresheetSelectionForm', () => {
        test('renders selection form with timetable parts', async () => {
            const parts = [{ _id: 'tp1' }, { _id: 'tp2' }];
            getTimetablePartsByEvent.mockResolvedValue(parts);

            await scoringOfficeController.getNewScoresheetSelectionForm(req, res, next);

            expect(getTimetablePartsByEvent).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('scoringOffice/createscoresheet', {
                timetableParts: parts,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates selection form errors', async () => {
            getTimetablePartsByEvent.mockRejectedValue(new Error('parts fail'));

            await expect(scoringOfficeController.getNewScoresheetSelectionForm(req, res, next)).rejects.toThrow('parts fail');
        });
    });

    describe('handleNewScoresheetSelection', () => {
        test('stores judge id in session and redirects to form route', async () => {
            req.body = {
                Table: 'judge-1',
                entry: 'entry-1',
                TTprogram: 'tp-1'
            };

            await scoringOfficeController.handleNewScoresheetSelection(req, res, next);

            expect(req.session.judgeID).toBe('judge-1');
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/newscoresheet/entry-1/tp-1');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });
    });

    describe('getOfficeNewScoresheetForm', () => {
        const baseTimetablePart = {
            _id: 'tp1',
            TestType: 'Compulsory',
            NumberOfJudges: 4,
            JudgesList: [{ JudgeUserID: 'judge-1', Table: 'A' }]
        };

        const baseEntry = {
            _id: 'e1',
            category: {
                _id: 'cat1',
                CategoryDispName: 'Category A'
            }
        };

        beforeEach(() => {
            req.session.judgeID = 'judge-1';
            req.params = { tpid: 'tp1', entryid: 'e1' };
        });

        test('redirects when score already submitted', async () => {
            getTimetablePartById.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([{ _id: 'existing' }]);

            await scoringOfficeController.getOfficeNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.SCORE_ALREADY_SUBMITTED);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('redirects when judge is not assigned', async () => {
            getTimetablePartById.mockResolvedValue({
                ...baseTimetablePart,
                JudgesList: [{ JudgeUserID: 'other-judge', Table: 'A' }]
            });
            getSubmittedScoreSheets.mockResolvedValue([]);

            await scoringOfficeController.getOfficeNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.NOT_ASSIGNED_AS_JUDGE);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('redirects with warning when no table-role mapping', async () => {
            getTimetablePartById.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue(null);

            await scoringOfficeController.getOfficeNewScoresheetForm(req, res, next);

            expect(logWarn).toHaveBeenCalledWith(
                'NO_ROLE_MAPPING',
                expect.stringContaining('No RoleOfTable found for Table: A'),
                `User: ${mockUser.username}`
            );
            expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_ROLE_MAPPING);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('redirects when entry not found', async () => {
            getTimetablePartById.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue({ Role: 'Artistic' });
            getEntryById.mockResolvedValue(null);

            await scoringOfficeController.getOfficeNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.ENTRY_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('redirects when no score sheet template exists', async () => {
            getTimetablePartById.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue({ Role: 'Artistic' });
            getEntryById.mockResolvedValue(baseEntry);
            getScoreSheetTemplate.mockResolvedValue(null);

            await scoringOfficeController.getOfficeNewScoresheetForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.NO_SCORE_SHEET_TEMPLATE);
            expect(logWarn).toHaveBeenCalledWith(
                'NO_SCORESHEET_TEMPLATE',
                expect.stringContaining('No ScoreSheetTemp found for TestType: Compulsory'),
                `User: ${mockUser.username}`
            );
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('renders office new scoresheet form on success', async () => {
            const event = { _id: mockEventId, EventName: 'Event A' };
            const template = { _id: 'temp1' };

            getTimetablePartById.mockResolvedValue({ ...baseTimetablePart });
            getSubmittedScoreSheets.mockResolvedValue([]);
            getJudgeById.mockResolvedValue({ fullname: 'Judge One' });
            getTableMapping.mockResolvedValue({ Role: 'Artistic' });
            getEntryById.mockResolvedValue(baseEntry);
            getScoreSheetTemplate.mockResolvedValue(template);
            getEventById.mockResolvedValue(event);

            await scoringOfficeController.getOfficeNewScoresheetForm(req, res, next);

            expect(getScoreSheetTemplate).toHaveBeenCalledWith('Compulsory', 'cat1', 4, 'Artistic');
            expect(res.render).toHaveBeenCalledWith('scoringJudge/officenewscoresheetjudge', {
                judgeID: 'judge-1',
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

    describe('createOfficeNewScoresheet', () => {
        test('creates scoresheet, syncs and redirects to office dashboard', async () => {
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: {
                    scoreA: 9,
                    scoreB: '8.0'
                }
            };

            getEntryById.mockResolvedValue({ _id: 'e1', category: { _id: 'cat1' } });
            calculateScore.mockReturnValue(17);
            saveScoreSheet.mockResolvedValue(undefined);
            syncScoreTable.mockResolvedValue(undefined);

            await scoringOfficeController.createOfficeNewScoresheet(req, res, next);

            expect(req.body.inputDatas).toEqual([
                { id: 'scoreA', value: '9' },
                { id: 'scoreB', value: '8.0' }
            ]);
            expect(req.body.ScoreSheetInput).toBeUndefined();
            expect(req.body.totalScoreBE).toBe(17);
            expect(saveScoreSheet).toHaveBeenCalledWith(req.body, 'tp1', 'e1');
            expect(syncScoreTable).toHaveBeenCalledWith('tp1', 'e1', mockEventId);
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.SCORE_SHEET_SAVED);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/dashboard');
        });

        test('propagates create errors', async () => {
            req.body = {
                TimetablePartId: 'tp1',
                EntryId: 'e1',
                ScoreSheetInput: { scoreA: 9 }
            };

            getEntryById.mockResolvedValue({ _id: 'e1', category: { _id: 'cat1' } });
            calculateScore.mockReturnValue(9);
            saveScoreSheet.mockRejectedValue(new Error('save fail'));

            await expect(scoringOfficeController.createOfficeNewScoresheet(req, res, next)).rejects.toThrow('save fail');
            expect(syncScoreTable).not.toHaveBeenCalled();
        });
    });

    describe('getScoresList', () => {
        test('renders score list for selected event', async () => {
            const scores = [{ _id: 's1' }, { _id: 's2' }];
            getEventScores.mockResolvedValue(scores);

            await scoringOfficeController.getScoresList(req, res, next);

            expect(getEventScores).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('scoringOffice/scores', {
                scores,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates score list errors', async () => {
            getEventScores.mockRejectedValue(new Error('scores fail'));

            await expect(scoringOfficeController.getScoresList(req, res, next)).rejects.toThrow('scores fail');
        });
    });

    describe('recalculateScoreById', () => {
        test('redirects when score not found', async () => {
            getScoreById.mockResolvedValue(null);

            await scoringOfficeController.recalculateScoreById(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.SCORE_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoring/office/scores');
            expect(syncScoreTable).not.toHaveBeenCalled();
        });

        test('recalculates and returns success response when score exists', async () => {
            const score = { _id: 's1', timetablepart: 'tp1', entry: 'e1' };
            getScoreById.mockResolvedValue(score);
            syncScoreTable.mockResolvedValue(undefined);

            await scoringOfficeController.recalculateScoreById(req, res, next);

            expect(syncScoreTable).toHaveBeenCalledWith('tp1', 'e1', mockEventId);
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.SCORE_RECALCULATED);
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.SCORE_RECALCULATED);
        });

        test('propagates recalculate errors', async () => {
            getScoreById.mockResolvedValue({ _id: 's1', timetablepart: 'tp1', entry: 'e1' });
            syncScoreTable.mockRejectedValue(new Error('sync fail'));

            await expect(scoringOfficeController.recalculateScoreById(req, res, next)).rejects.toThrow('sync fail');
        });
    });
});

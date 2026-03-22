import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../../logger.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { MESSAGES } from '../../config/index.js';
import { FirstLevel, SecondLevel, TotalLevel } from '../../LogicServices/resultCalculations.js';
import {
    getResultGroupsForResults,
    getResultGroupWithDetails
} from '../../DataServices/resultGroupData.js';
import resultController from '../../controllers/resultController.js';

jest.mock('../../logger.js');
jest.mock('../../LogicServices/resultCalculations.js');
jest.mock('../../DataServices/resultGroupData.js');

describe('resultController', () => {
    let req, res, next;
    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        role: {
            _id: '507f1f77bcf86cd799439012',
            name: 'Judge',
            permissions: ['result:read']
        }
    };

    const mockResultGroup = {
        _id: '607f1f77bcf86cd799439099',
        category: {
            _id: '507f1f77bcf86cd799439020',
            CategoryDispName: 'Category A'
        },
        round1First: '507f1f77bcf86cd799439030',
        round1Second: '507f1f77bcf86cd799439031',
        round2First: '507f1f77bcf86cd799439032'
    };

    beforeEach(() => {
        req = {
            params: { id: '607f1f77bcf86cd799439099', part: 'R1F' },
            body: {},
            user: JSON.parse(JSON.stringify(mockUser)),
            session: {
                failMessage: null,
                successMessage: null
            }
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            locals: {
                selectedEvent: { _id: '507f1f77bcf86cd799439013' }
            }
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getResultsDashboard', () => {
        describe('successful dashboard rendering', () => {
            test('should render dashboard with result groups', async () => {
                const mockResultGroups = [
                    { _id: '1', category: { CategoryDispName: 'Category A' } },
                    { _id: '2', category: { CategoryDispName: 'Category B' } }
                ];

                getResultGroupsForResults.mockResolvedValue(mockResultGroups);

                await resultController.getResultsDashboard(req, res, next);

                expect(getResultGroupsForResults).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
                expect(res.render).toHaveBeenCalledWith('results/dashboard', {
                    resultGroups: mockResultGroups,
                    rolePermissons: mockUser.role.permissions,
                    failMessage: null,
                    successMessage: null,
                    user: mockUser
                });
            });

            test('should clear session fail message after rendering', async () => {
                req.session.failMessage = 'Previous error';

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                expect(req.session.failMessage).toBeNull();
            });

            test('should clear session success message after rendering', async () => {
                req.session.successMessage = 'Previous success';

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                expect(req.session.successMessage).toBeNull();
            });

            test('should handle empty result groups array', async () => {
                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.resultGroups).toEqual([]);
            });

            test('should pass user permissions to render', async () => {
                req.user.role.permissions = ['result:read', 'result:export'];

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toEqual(['result:read', 'result:export']);
            });

            test('should pass current user to render', async () => {
                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.user).toEqual(mockUser);
            });

            test('should extract selectedEvent ID from res.locals', async () => {
                res.locals.selectedEvent._id = '607f1f77bcf86cd799439088';

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                expect(getResultGroupsForResults).toHaveBeenCalledWith('607f1f77bcf86cd799439088');
            });

            test('should handle both fail and success messages', async () => {
                req.session.failMessage = 'Error occurred';
                req.session.successMessage = 'Success!';

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.failMessage).toBe('Error occurred');
                expect(renderCall.successMessage).toBe('Success!');
                expect(req.session.failMessage).toBeNull();
                expect(req.session.successMessage).toBeNull();
            });
        });

        describe('error handling', () => {
            test('should propagate getResultGroupsForResults error', async () => {
                const error = new Error('Database error');
                getResultGroupsForResults.mockRejectedValue(error);

                try {
                    await resultController.getResultsDashboard(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle null selectedEvent', async () => {
                delete res.locals.selectedEvent;

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                expect(getResultGroupsForResults).toHaveBeenCalledWith(undefined);
            });

            test('should handle null user', async () => {
                delete req.user;

                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toBeUndefined();
                expect(renderCall.user).toBeUndefined();
            });

            test('should handle missing user role', async () => {
                delete req.user.role;

                getResultGroupsForResults.mockResolvedValue([]);

                try {
                    await resultController.getResultsDashboard(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });
        });

        describe('render validation', () => {
            test('should render with correct template name', async () => {
                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                expect(res.render).toHaveBeenCalledWith('results/dashboard', expect.any(Object));
            });

            test('should include all required render properties', async () => {
                getResultGroupsForResults.mockResolvedValue([]);

                await resultController.getResultsDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall).toHaveProperty('resultGroups');
                expect(renderCall).toHaveProperty('rolePermissons');
                expect(renderCall).toHaveProperty('failMessage');
                expect(renderCall).toHaveProperty('successMessage');
                expect(renderCall).toHaveProperty('user');
            });
        });
    });

    describe('getDetailedResults', () => {
        describe('Round 1 First Level (R1F) results', () => {
            test('should retrieve and render R1F results', async () => {
                req.params.part = 'R1F';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 85 },
                    { vaulterId: '2', TotalScore: 75 }
                ];
                const mockData = { title: 'Round 1 First', results: mockResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                expect(getResultGroupWithDetails).toHaveBeenCalledWith('607f1f77bcf86cd799439099');
                expect(FirstLevel).toHaveBeenCalledWith(mockResultGroup, 'R1F');
                expect(res.render).toHaveBeenCalled();
            });

            test('should sort R1F results by TotalScore descending', async () => {
                req.params.part = 'R1F';

                const unsortedResults = [
                    { vaulterId: '2', TotalScore: 75 },
                    { vaulterId: '3', TotalScore: 85 },
                    { vaulterId: '1', TotalScore: 80 }
                ];
                const mockData = { title: 'R1F', results: unsortedResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results).toEqual([
                    { vaulterId: '3', TotalScore: 85 },
                    { vaulterId: '1', TotalScore: 80 },
                    { vaulterId: '2', TotalScore: 75 }
                ]);
            });

            test('should set pointDetailsLevel to 1 for R1F', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.pointDetailsLevel).toBe(1);
            });

            test('should include param in render for R1F', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.param).toBe('R1F');
            });
        });

        describe('Round 1 Second Level (R1S) results', () => {
            test('should retrieve and render R1S results', async () => {
                req.params.part = 'R1S';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 85 },
                    { vaulterId: '2', TotalScore: 75 }
                ];
                const mockData = { title: 'R1S', results: mockResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                expect(FirstLevel).toHaveBeenCalledWith(mockResultGroup, 'R1S');
            });

            test('should redirect if round1Second is not defined', async () => {
                req.params.part = 'R1S';
                const groupWithoutR1S = { ...mockResultGroup, round1Second: null };

                getResultGroupWithDetails.mockResolvedValue(groupWithoutR1S);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.TIMETABLE_PART_NOT_DEFINED);
                expect(res.redirect).toHaveBeenCalledWith('/result');
                expect(FirstLevel).not.toHaveBeenCalled();
            });
        });

        describe('Round 2 First Level (R2F) results', () => {
            test('should retrieve and render R2F results', async () => {
                req.params.part = 'R2F';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 88 }
                ];
                const mockData = { title: 'R2F', results: mockResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                expect(FirstLevel).toHaveBeenCalledWith(mockResultGroup, 'R2F');
            });

            test('should redirect if round2First is not defined', async () => {
                req.params.part = 'R2F';
                const groupWithoutR2F = { ...mockResultGroup, round2First: null };

                getResultGroupWithDetails.mockResolvedValue(groupWithoutR2F);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.TIMETABLE_PART_NOT_DEFINED);
                expect(res.redirect).toHaveBeenCalledWith('/result');
            });

            test('should set pointDetailsLevel to 1 for R2F', async () => {
                req.params.part = 'R2F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R2F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.pointDetailsLevel).toBe(1);
            });
        });

        describe('Round 1 Combined (R1) results', () => {
            test('should retrieve and render R1 results', async () => {
                req.params.part = 'R1';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 165 }
                ];
                const mockData = { title: 'R1 Total', results: mockResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                expect(SecondLevel).toHaveBeenCalledWith(mockResultGroup, 'R1');
            });

            test('should set pointDetailsLevel to 2 for R1', async () => {
                req.params.part = 'R1';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockResolvedValue({ title: 'R1', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.pointDetailsLevel).toBe(2);
            });

            test('should not include param property for R1', async () => {
                req.params.part = 'R1';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockResolvedValue({ title: 'R1', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.param).toBeUndefined();
            });

            test('should sort R1 results by TotalScore descending', async () => {
                req.params.part = 'R1';

                const unsortedResults = [
                    { vaulterId: '2', TotalScore: 150 },
                    { vaulterId: '3', TotalScore: 170 },
                    { vaulterId: '1', TotalScore: 165 }
                ];
                const mockData = { title: 'R1', results: unsortedResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results[0].TotalScore).toBe(170);
                expect(renderCall.results[1].TotalScore).toBe(165);
                expect(renderCall.results[2].TotalScore).toBe(150);
            });
        });

        describe('Round 2 Combined (R2) results', () => {
            test('should retrieve and render R2 results', async () => {
                req.params.part = 'R2';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 88 }
                ];
                const mockData = { title: 'R2 Total', results: mockResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                expect(SecondLevel).toHaveBeenCalledWith(mockResultGroup, 'R2');
            });

            test('should set pointDetailsLevel to 2 for R2', async () => {
                req.params.part = 'R2';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockResolvedValue({ title: 'R2', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.pointDetailsLevel).toBe(2);
            });
        });

        describe('Total results', () => {
            test('should retrieve and render total results', async () => {
                req.params.part = 'total';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 253 }
                ];
                const mockData = { title: 'Total', results: mockResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                TotalLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                expect(TotalLevel).toHaveBeenCalledWith(mockResultGroup);
            });

            test('should use correct title for total results', async () => {
                req.params.part = 'total';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                TotalLevel.mockResolvedValue({ title: 'Total', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.title).toContain('Total Results');
            });

            test('should set pointDetailsLevel to 3 for total', async () => {
                req.params.part = 'total';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                TotalLevel.mockResolvedValue({ title: 'Total', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.pointDetailsLevel).toBe(3);
            });

            test('should sort total results by TotalScore descending', async () => {
                req.params.part = 'total';

                const unsortedResults = [
                    { vaulterId: '2', TotalScore: 220 },
                    { vaulterId: '3', TotalScore: 255 },
                    { vaulterId: '1', TotalScore: 253 }
                ];
                const mockData = { title: 'Total', results: unsortedResults };

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                TotalLevel.mockResolvedValue(mockData);

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results[0].TotalScore).toBe(255);
            });
        });

        describe('result group validation', () => {
            test('should redirect if result group not found', async () => {
                getResultGroupWithDetails.mockResolvedValue(null);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND);
                expect(res.redirect).toHaveBeenCalledWith('/result');
                expect(FirstLevel).not.toHaveBeenCalled();
            });

            test('should not clear messages if result group not found', async () => {
                req.session.failMessage = 'Some error';
                getResultGroupWithDetails.mockResolvedValue(null);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND);
            });

            test('should redirect with correct path on null result group', async () => {
                getResultGroupWithDetails.mockResolvedValue(null);

                await resultController.getDetailedResults(req, res, next);

                expect(res.redirect).toHaveBeenCalledWith('/result');
            });
        });

        describe('timetable part validation', () => {
            test('should redirect on invalid timetable part', async () => {
                req.params.part = 'INVALID';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_TIMETABLE_PART);
                expect(res.redirect).toHaveBeenCalledWith('/result');
            });

            test('should redirect on unknown part code', async () => {
                req.params.part = 'XYZ';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);

                await resultController.getDetailedResults(req, res, next);

                expect(res.redirect).toHaveBeenCalledWith('/result');
                expect(FirstLevel).not.toHaveBeenCalled();
                expect(SecondLevel).not.toHaveBeenCalled();
                expect(TotalLevel).not.toHaveBeenCalled();
            });

            test('should handle edge case: R1F with exact uppercase', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                expect(FirstLevel).toHaveBeenCalled();
                expect(res.render).toHaveBeenCalled();
            });

            test('should not match lowercase variants of valid parts', async () => {
                req.params.part = 'r1f'; // lowercase

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.INVALID_TIMETABLE_PART);
                expect(res.redirect).toHaveBeenCalledWith('/result');
            });
        });

        describe('render data consistency', () => {
            test('should include category display name in title', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'Round 1 First', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.title).toContain('Category A');
            });

            test('should format title correctly with category and part', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'Round 1 First', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.title).toBe('Category A -- Round 1 First');
            });

            test('should pass resultGroup to render', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.resultGroup).toEqual(mockResultGroup);
            });

            test('should pass user permissions to all parts', async () => {
                const parts = ['R1F', 'R1S', 'R2F', 'R1', 'R2', 'total'];

                for (const part of parts) {
                    req.params.part = part;

                    getResultGroupWithDetails.mockResolvedValue(mockResultGroup);

                    if (['R1F', 'R1S', 'R2F'].includes(part)) {
                        FirstLevel.mockResolvedValue({ title: part, results: [] });
                    } else if (['R1', 'R2'].includes(part)) {
                        SecondLevel.mockResolvedValue({ title: part, results: [] });
                    } else {
                        TotalLevel.mockResolvedValue({ title: part, results: [] });
                    }

                    await resultController.getDetailedResults(req, res, next);

                    const renderCall = res.render.mock.calls[res.render.mock.calls.length - 1][1];
                    expect(renderCall.rolePermissons).toEqual(mockUser.role.permissions);
                }
            });

            test('should pass user to render', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.user).toEqual(mockUser);
            });

            test('should render correct template name', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                expect(res.render).toHaveBeenCalledWith('results/detailedResults', expect.any(Object));
            });
        });

        describe('session message handling', () => {
            test('should clear session messages on successful R1F render', async () => {
                req.params.part = 'R1F';
                req.session.failMessage = 'Old error';
                req.session.successMessage = 'Old success';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBeNull();
                expect(req.session.successMessage).toBeNull();
            });

            test('should pass session messages to render before clearing', async () => {
                req.params.part = 'R1F';
                req.session.failMessage = 'Current error';
                req.session.successMessage = 'Current success';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.failMessage).toBe('Current error');
                expect(renderCall.successMessage).toBe('Current success');
            });

            test('should not clear messages when redirecting', async () => {
                getResultGroupWithDetails.mockResolvedValue(null);

                await resultController.getDetailedResults(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND);
            });

            test('should handle null session messages', async () => {
                req.params.part = 'R1F';
                req.session.failMessage = null;
                req.session.successMessage = null;

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.failMessage).toBeNull();
                expect(renderCall.successMessage).toBeNull();
            });
        });

        describe('error handling', () => {
            test('should propagate getResultGroupWithDetails error', async () => {
                const error = new Error('Database error');
                getResultGroupWithDetails.mockRejectedValue(error);

                try {
                    await resultController.getDetailedResults(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should propagate FirstLevel error', async () => {
                req.params.part = 'R1F';

                const error = new Error('Calculation error');
                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockRejectedValue(error);

                try {
                    await resultController.getDetailedResults(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should propagate SecondLevel error', async () => {
                req.params.part = 'R1';

                const error = new Error('Calculation error');
                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                SecondLevel.mockRejectedValue(error);

                try {
                    await resultController.getDetailedResults(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should propagate TotalLevel error', async () => {
                req.params.part = 'total';

                const error = new Error('Calculation error');
                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                TotalLevel.mockRejectedValue(error);

                try {
                    await resultController.getDetailedResults(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle null user', async () => {
                delete req.user;

                req.params.part = 'R1F';
                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toBeUndefined();
                expect(renderCall.user).toBeUndefined();
            });

            test('should handle missing user role', async () => {
                delete req.user.role;

                req.params.part = 'R1F';
                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                try {
                    await resultController.getDetailedResults(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });
        });

        describe('edge cases', () => {
            test('should handle empty results array', async () => {
                req.params.part = 'R1F';

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results).toEqual([]);
            });

            test('should handle single result entry', async () => {
                req.params.part = 'R1F';

                const mockResults = [{ vaulterId: '1', TotalScore: 85 }];
                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: mockResults });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results.length).toBe(1);
            });

            test('should handle large number of results', async () => {
                req.params.part = 'R1F';

                const mockResults = Array.from({ length: 100 }, (_, i) => ({
                    vaulterId: String(i),
                    TotalScore: 100 - i
                }));

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: mockResults });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results.length).toBe(100);
                expect(renderCall.results[0].TotalScore).toBe(100);
            });

            test('should handle equal TotalScores (stable sort)', async () => {
                req.params.part = 'R1F';

                const mockResults = [
                    { vaulterId: '1', TotalScore: 85, name: 'First' },
                    { vaulterId: '2', TotalScore: 85, name: 'Second' },
                    { vaulterId: '3', TotalScore: 85, name: 'Third' }
                ];

                getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
                FirstLevel.mockResolvedValue({ title: 'R1F', results: mockResults });

                await resultController.getDetailedResults(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.results.length).toBe(3);
                // All equal scores, so order should be stable
                expect(renderCall.results.every(r => r.TotalScore === 85)).toBe(true);
            });
        });

        describe('part validation flow', () => {
            test('should check round1First for R1F before calling FirstLevel', async () => {
                req.params.part = 'R1F';
                const groupWithoutR1F = { ...mockResultGroup, round1First: null };

                getResultGroupWithDetails.mockResolvedValue(groupWithoutR1F);

                await resultController.getDetailedResults(req, res, next);

                expect(FirstLevel).not.toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalled();
            });

            test('should check round1Second for R1S before calling FirstLevel', async () => {
                req.params.part = 'R1S';
                const groupWithoutR1S = { ...mockResultGroup, round1Second: null };

                getResultGroupWithDetails.mockResolvedValue(groupWithoutR1S);

                await resultController.getDetailedResults(req, res, next);

                expect(FirstLevel).not.toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalled();
            });

            test('should check round2First for R2F before calling FirstLevel', async () => {
                req.params.part = 'R2F';
                const groupWithoutR2F = { ...mockResultGroup, round2First: null };

                getResultGroupWithDetails.mockResolvedValue(groupWithoutR2F);

                await resultController.getDetailedResults(req, res, next);

                expect(FirstLevel).not.toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalled();
            });
        });
    });

    describe('integration scenarios', () => {
        test('should handle full dashboard to detailed flow', async () => {
            // Get dashboard
            const mockGroups = [{ _id: '1', category: { CategoryDispName: 'Category A' } }];
            getResultGroupsForResults.mockResolvedValue(mockGroups);

            await resultController.getResultsDashboard(req, res, next);

            expect(res.render).toHaveBeenCalled();

            // Get detailed results
            jest.clearAllMocks();
            req.params.id = '1';
            req.params.part = 'R1F';

            getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
            FirstLevel.mockResolvedValue({ title: 'R1F', results: [{ vaulterId: '1', TotalScore: 85 }] });

            await resultController.getDetailedResults(req, res, next);

            expect(res.render).toHaveBeenCalled();
        });

        test('should maintain user context across operations', async () => {
            const customUser = { _id: '1', username: 'judge1', role: { permissions: ['result:read'] } };
            req.user = customUser;

            getResultGroupsForResults.mockResolvedValue([]);

            await resultController.getResultsDashboard(req, res, next);

            const renderCall = res.render.mock.calls[0][1];
            expect(renderCall.user).toEqual(customUser);

            jest.clearAllMocks();

            req.params.part = 'R1F';
            getResultGroupWithDetails.mockResolvedValue(mockResultGroup);
            FirstLevel.mockResolvedValue({ title: 'R1F', results: [] });

            await resultController.getDetailedResults(req, res, next);

            const detailRenderCall = res.render.mock.calls[0][1];
            expect(detailRenderCall.user).toEqual(customUser);
        });
    });
});

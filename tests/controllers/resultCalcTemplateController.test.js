import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../../logger.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
    getAllCalcTemplates,
    getCalcTemplateById,
    createCalcTemplate,
    updateCalcTemplate,
    deleteCalcTemplate,
    getCalcTemplateFormData
} from '../../DataServices/resultCalcTemplateData.js';
import resultCalcTemplateController from '../../controllers/resultCalcTemplateController.js';

jest.mock('../../logger.js');
jest.mock('../../DataServices/resultCalcTemplateData.js');

describe('resultCalcTemplateController', () => {
    let req, res, next;
    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        role: {
            _id: '507f1f77bcf86cd799439012',
            name: 'Admin',
            permissions: ['result:read', 'result:create', 'result:update', 'result:delete']
        }
    };

    beforeEach(() => {
        req = {
            params: { id: '507f1f77bcf86cd799439011' },
            body: {},
            user: JSON.parse(JSON.stringify(mockUser)),
            session: {
                failMessage: null,
                successMessage: null,
                formData: null
            }
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            locals: { selectedEvent: { _id: '507f1f77bcf86cd799439013' } }
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getCalcTemplatesDashboard', () => {
        describe('successful dashboard rendering', () => {
            test('should render dashboard with all calculation templates', async () => {
                const mockCalcTemplates = [
                    { _id: '1', name: 'Template 1', round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 },
                    { _id: '2', name: 'Template 2', round1FirstP: 50, round1SecondP: 25, round2FirstP: 25 }
                ];

                getAllCalcTemplates.mockResolvedValue(mockCalcTemplates);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                expect(getAllCalcTemplates).toHaveBeenCalled();
                expect(res.render).toHaveBeenCalledWith('resultCalc/dashboard', {
                    resultCalcs: mockCalcTemplates,
                    rolePermissons: mockUser.role.permissions,
                    failMessage: null,
                    successMessage: null,
                    user: mockUser
                });
            });

            test('should clear session fail message after rendering', async () => {
                req.session.failMessage = 'Some error';

                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                expect(req.session.failMessage).toBeNull();
            });

            test('should clear session success message after rendering', async () => {
                req.session.successMessage = 'Success!';

                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                expect(req.session.successMessage).toBeNull();
            });

            test('should render with empty templates array', async () => {
                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.resultCalcs).toEqual([]);
            });

            test('should pass user permissions to render', async () => {
                const customPermissions = ['result:read', 'result:delete'];
                req.user.role.permissions = customPermissions;

                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toEqual(customPermissions);
            });

            test('should pass current user to render', async () => {
                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.user).toEqual(mockUser);
            });

            test('should handle both fail and success messages present', async () => {
                req.session.failMessage = 'Failed';
                req.session.successMessage = 'Success';

                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.failMessage).toBe('Failed');
                expect(renderCall.successMessage).toBe('Success');
                expect(req.session.failMessage).toBeNull();
                expect(req.session.successMessage).toBeNull();
            });
        });

        describe('error handling', () => {
            test('should propagate getAllCalcTemplates error', async () => {
                const error = new Error('Database error');
                getAllCalcTemplates.mockRejectedValue(error);

                try {
                    await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle null user', async () => {
                delete req.user;

                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toBeUndefined();
                expect(renderCall.user).toBeUndefined();
            });

            test('should handle missing role in user', async () => {
                delete req.user.role;

                getAllCalcTemplates.mockResolvedValue([]);

                try {
                    await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });
        });

        describe('template rendering', () => {
            test('should render correct template', async () => {
                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                expect(res.render).toHaveBeenCalledWith('resultCalc/dashboard', expect.any(Object));
            });

            test('should include all required properties for render', async () => {
                getAllCalcTemplates.mockResolvedValue([]);

                await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall).toHaveProperty('resultCalcs');
                expect(renderCall).toHaveProperty('rolePermissons');
                expect(renderCall).toHaveProperty('failMessage');
                expect(renderCall).toHaveProperty('successMessage');
                expect(renderCall).toHaveProperty('user');
            });
        });
    });

    describe('getNewCalcTemplateForm', () => {
        describe('successful form rendering', () => {
            test('should render new template form with empty form data', async () => {
                const mockCategories = [
                    { _id: '1', name: 'Category 1' },
                    { _id: '2', name: 'Category 2' }
                ];

                getCalcTemplateFormData.mockResolvedValue({ categories: mockCategories });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                expect(getCalcTemplateFormData).toHaveBeenCalled();
                expect(res.render).toHaveBeenCalledWith('resultCalc/newResultCalc', {
                    formData: {},
                    categoryList: mockCategories,
                    rolePermissons: mockUser.role.permissions,
                    failMessage: null,
                    successMessage: null,
                    user: mockUser
                });
            });

            test('should render form with form data from session', async () => {
                req.session.formData = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.formData).toEqual(req.session.formData);
            });

            test('should clear session fail message after rendering', async () => {
                req.session.failMessage = 'Previous error';

                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                expect(req.session.failMessage).toBeNull();
            });

            test('should clear session success message after rendering', async () => {
                req.session.successMessage = 'Previous success';

                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                expect(req.session.successMessage).toBeNull();
            });

            test('should handle empty categories list', async () => {
                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.categoryList).toEqual([]);
            });

            test('should pass user permissions to form', async () => {
                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toEqual(mockUser.role.permissions);
            });
        });

        describe('error handling', () => {
            test('should propagate getCalcTemplateFormData error', async () => {
                const error = new Error('Form data error');
                getCalcTemplateFormData.mockRejectedValue(error);

                try {
                    await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle null formData in session', async () => {
                req.session.formData = null;

                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.formData).toEqual({});
            });

            test('should handle undefined formData in session', async () => {
                delete req.session.formData;

                getCalcTemplateFormData.mockResolvedValue({ categories: [] });

                await resultCalcTemplateController.getNewCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.formData).toEqual({});
            });
        });
    });

    describe('createNewCalcTemplate', () => {
        describe('successful template creation', () => {
            test('should create template with valid percentage sum (100)', async () => {
                req.body = {
                    name: 'New Template',
                    round1FirstP: 40,
                    round1SecondP: 30,
                    round2FirstP: 30
                };

                const mockCreatedTemplate = { _id: '607f1f77bcf86cd799439099', ...req.body };
                createCalcTemplate.mockResolvedValue(mockCreatedTemplate);

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(createCalcTemplate).toHaveBeenCalledWith(req.body);
                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_CREATE',
                    `Result calculation template created: 607f1f77bcf86cd799439099`,
                    mockUser.username,
                    HTTP_STATUS.CREATED
                );
            });

            test('should set success message and redirect after creation', async () => {
                req.body = {
                    round1FirstP: 40,
                    round1SecondP: 30,
                    round2FirstP: 30
                };

                createCalcTemplate.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_CREATED);
                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/dashboard');
            });

            test('should handle different valid percentage combinations', async () => {
                const validCombos = [
                    { round1FirstP: 50, round1SecondP: 25, round2FirstP: 25 },
                    { round1FirstP: 60, round1SecondP: 20, round2FirstP: 20 },
                    { round1FirstP: 33.33, round1SecondP: 33.33, round2FirstP: 33.34 }
                ];

                for (const combo of validCombos) {
                    req.body = combo;
                    createCalcTemplate.mockResolvedValue({ _id: '1' });

                    await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                    expect(createCalcTemplate).toHaveBeenCalledWith(combo);
                }
            });

            test('should log operation with created template ID', async () => {
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                const templateId = '707f1f77bcf86cd799439088';
                createCalcTemplate.mockResolvedValue({ _id: templateId });

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_CREATE',
                    expect.stringContaining(templateId),
                    mockUser.username,
                    HTTP_STATUS.CREATED
                );
            });
        });

        describe('percentage validation', () => {
            test('should reject template with sum < 100', async () => {
                req.body = {
                    round1FirstP: 40,
                    round1SecondP: 30,
                    round2FirstP: 20 // sum = 90
                };

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR);
                expect(req.session.formData).toEqual(req.body);
                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/new');
                expect(createCalcTemplate).not.toHaveBeenCalled();
            });

            test('should reject template with sum > 100', async () => {
                req.body = {
                    round1FirstP: 40,
                    round1SecondP: 35,
                    round2FirstP: 30 // sum = 105
                };

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR);
                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/new');
                expect(createCalcTemplate).not.toHaveBeenCalled();
            });

            test('should handle string to number conversion', async () => {
                req.body = {
                    round1FirstP: '40',
                    round1SecondP: '30',
                    round2FirstP: '30'
                };

                createCalcTemplate.mockResolvedValue({ _id: '1' });

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(createCalcTemplate).toHaveBeenCalled();
                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/dashboard');
            });

            test('should store form data in session on validation error', async () => {
                const formData = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 25 };
                req.body = formData;

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(req.session.formData).toEqual(formData);
            });

            test('should preserve all form data when validation fails', async () => {
                req.body = {
                    name: 'Template',
                    description: 'Test',
                    round1FirstP: 40,
                    round1SecondP: 30,
                    round2FirstP: 25
                };

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(req.session.formData).toEqual(req.body);
            });
        });

        describe('error handling', () => {
            test('should handle createCalcTemplate database error', async () => {
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                const error = new Error('Database error');
                createCalcTemplate.mockRejectedValue(error);

                try {
                    await resultCalcTemplateController.createNewCalcTemplate(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.redirect).not.toHaveBeenCalled();
            });

            test('should handle null user', async () => {
                delete req.user;

                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };
                createCalcTemplate.mockResolvedValue({ _id: '1' });

                try {
                    await resultCalcTemplateController.createNewCalcTemplate(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });

            test('should handle missing body parameters', async () => {
                req.body = {};

                await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

                expect(req.session.failMessage).toBe(MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR);
                expect(createCalcTemplate).not.toHaveBeenCalled();
            });
        });
    });

    describe('getEditCalcTemplateForm', () => {
        describe('successful form rendering', () => {
            test('should render edit form with template data', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                const mockTemplate = {
                    _id: '607f1f77bcf86cd799439099',
                    name: 'Existing Template',
                    round1FirstP: 40,
                    round1SecondP: 30,
                    round2FirstP: 30
                };

                getCalcTemplateById.mockResolvedValue(mockTemplate);

                await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);

                expect(getCalcTemplateById).toHaveBeenCalledWith('607f1f77bcf86cd799439099');
                expect(res.render).toHaveBeenCalledWith('resultCalc/editResultCalc', {
                    formData: mockTemplate,
                    rolePermissons: mockUser.role.permissions,
                    failMessage: null,
                    successMessage: null,
                    user: mockUser
                });
            });

            test('should clear session messages after rendering', async () => {
                req.session.failMessage = 'Error';
                req.session.successMessage = 'Success';

                getCalcTemplateById.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });

                await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);

                expect(req.session.failMessage).toBeNull();
                expect(req.session.successMessage).toBeNull();
            });

            test('should pass current user permissions', async () => {
                getCalcTemplateById.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });

                await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toEqual(mockUser.role.permissions);
            });

            test('should handle different template IDs', async () => {
                const templateId = '807f1f77bcf86cd799439088';
                req.params.id = templateId;

                getCalcTemplateById.mockResolvedValue({ _id: templateId });

                await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);

                expect(getCalcTemplateById).toHaveBeenCalledWith(templateId);
            });
        });

        describe('error handling', () => {
            test('should propagate getCalcTemplateById error', async () => {
                const error = new Error('Template not found');
                getCalcTemplateById.mockRejectedValue(error);

                try {
                    await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle null template data', async () => {
                getCalcTemplateById.mockResolvedValue(null);

                await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.formData).toBeNull();
            });
        });
    });

    describe('updateCalcTemplateById', () => {
        describe('successful template update', () => {
            test('should update template with valid percentage sum', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = {
                    name: 'Updated Template',
                    round1FirstP: 50,
                    round1SecondP: 25,
                    round2FirstP: 25
                };

                const mockUpdated = { _id: '607f1f77bcf86cd799439099', ...req.body };
                updateCalcTemplate.mockResolvedValue(mockUpdated);

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(updateCalcTemplate).toHaveBeenCalledWith('607f1f77bcf86cd799439099', req.body);
                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_UPDATE',
                    `Result calculation template updated: 607f1f77bcf86cd799439099`,
                    mockUser.username,
                    HTTP_STATUS.OK
                );
            });

            test('should set success message and redirect after update', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                updateCalcTemplate.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_EDITED);
                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/dashboard');
            });

            test('should handle update returning null', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                updateCalcTemplate.mockResolvedValue(null);

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_UPDATE',
                    `Result calculation template updated: 607f1f77bcf86cd799439099`,
                    mockUser.username,
                    HTTP_STATUS.OK
                );
            });

            test('should log with template ID from params when update returns null', async () => {
                req.params.id = '907f1f77bcf86cd799439077';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                updateCalcTemplate.mockResolvedValue(null);

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_UPDATE',
                    expect.stringContaining('907f1f77bcf86cd799439077'),
                    mockUser.username,
                    HTTP_STATUS.OK
                );
            });
        });

        describe('percentage validation in update', () => {
            test('should reject update with sum < 100', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 20 };

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(logError).toHaveBeenCalledWith(
                    'VALIDATION_ERROR',
                    'Percentage sum error',
                    expect.stringContaining(mockUser.username)
                );
                expect(req.session.failMessage).toBe(MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR);
                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/edit/607f1f77bcf86cd799439099');
                expect(updateCalcTemplate).not.toHaveBeenCalled();
            });

            test('should reject update with sum > 100', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 35, round2FirstP: 30 };

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(logError).toHaveBeenCalled();
                expect(req.session.failMessage).toBe(MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR);
                expect(updateCalcTemplate).not.toHaveBeenCalled();
            });

            test('should include username in logError for validation failure', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 25 };

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                const logErrorCall = logError.mock.calls[0];
                expect(logErrorCall[2]).toContain(mockUser.username);
            });

            test('should include sum value in logError message', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 20 };

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                const logErrorCall = logError.mock.calls[0];
                expect(logErrorCall[2]).toContain('90'); // sum
            });

            test('should handle string to number conversion in validation', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = {
                    round1FirstP: '40',
                    round1SecondP: '30',
                    round2FirstP: '30'
                };

                updateCalcTemplate.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(updateCalcTemplate).toHaveBeenCalled();
            });
        });

        describe('error handling', () => {
            test('should handle updateCalcTemplate database error', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                const error = new Error('Database error');
                updateCalcTemplate.mockRejectedValue(error);

                try {
                    await resultCalcTemplateController.updateCalcTemplateById(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.redirect).not.toHaveBeenCalled();
            });

            test('should handle null user', async () => {
                delete req.user;

                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };

                updateCalcTemplate.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });

                try {
                    await resultCalcTemplateController.updateCalcTemplateById(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });
        });

        describe('redirect URL generation', () => {
            test('should redirect to correct edit URL with template ID', async () => {
                req.params.id = '607f1f77bcf86cd799439099';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 20 };

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/edit/607f1f77bcf86cd799439099');
            });

            test('should preserve ID in redirect URL on validation error', async () => {
                req.params.id = '807f1f77bcf86cd799439088';
                req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 25 };

                await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

                expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/edit/807f1f77bcf86cd799439088');
            });
        });
    });

    describe('deleteCalcTemplateById', () => {
        describe('successful template deletion', () => {
            test('should delete template and send success response', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                deleteCalcTemplate.mockResolvedValue({ deletedCount: 1 });

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(deleteCalcTemplate).toHaveBeenCalledWith('607f1f77bcf86cd799439099');
                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_DELETE',
                    `Result calculation template deleted: 607f1f77bcf86cd799439099`,
                    mockUser.username,
                    HTTP_STATUS.OK
                );
            });

            test('should return success message in response', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                deleteCalcTemplate.mockResolvedValue({});

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
                expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_DELETED);
            });

            test('should set correct HTTP status', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                deleteCalcTemplate.mockResolvedValue({});

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            });

            test('should log operation with template ID', async () => {
                req.params.id = '707f1f77bcf86cd799439088';

                deleteCalcTemplate.mockResolvedValue({});

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_DELETE',
                    expect.stringContaining('707f1f77bcf86cd799439088'),
                    mockUser.username,
                    HTTP_STATUS.OK
                );
            });

            test('should handle different template IDs', async () => {
                const ids = ['1', '2', '3'];

                for (const id of ids) {
                    req.params.id = id;
                    deleteCalcTemplate.mockResolvedValue({});

                    await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                    expect(deleteCalcTemplate).toHaveBeenCalledWith(id);
                }
            });
        });

        describe('error handling', () => {
            test('should propagate deleteCalcTemplate error', async () => {
                const error = new Error('Database error');
                deleteCalcTemplate.mockRejectedValue(error);

                try {
                    await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.send).not.toHaveBeenCalled();
            });

            test('should handle null user in request', async () => {
                delete req.user;

                deleteCalcTemplate.mockResolvedValue({});

                try {
                    await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });

            test('should handle missing username in user object', async () => {
                delete req.user.username;

                deleteCalcTemplate.mockResolvedValue({});

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_DELETE',
                    expect.any(String),
                    undefined,
                    HTTP_STATUS.OK
                );
            });
        });

        describe('logging', () => {
            test('should log DELETE operation', async () => {
                deleteCalcTemplate.mockResolvedValue({});

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'RESULT_CALC_TEMPLATE_DELETE',
                    expect.any(String),
                    expect.any(String),
                    expect.any(Number)
                );
            });

            test('should include current user in log', async () => {
                req.user.username = 'adminuser';

                deleteCalcTemplate.mockResolvedValue({});

                await resultCalcTemplateController.deleteCalcTemplateById(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.any(String),
                    'adminuser',
                    expect.any(Number)
                );
            });
        });
    });

    describe('error handling across all operations', () => {
        test('should handle concurrent requests independently', async () => {
            const req1 = { ...req, params: { id: '1' }, user: JSON.parse(JSON.stringify(mockUser)), session: { failMessage: null, successMessage: null } };
            const req2 = { ...req, params: { id: '2' }, user: JSON.parse(JSON.stringify(mockUser)), session: { failMessage: null, successMessage: null } };
            const res1 = { render: jest.fn() };
            const res2 = { render: jest.fn() };

            getAllCalcTemplates.mockResolvedValue([]);

            await resultCalcTemplateController.getCalcTemplatesDashboard(req1, res1, next);

            getAllCalcTemplates.mockResolvedValue([]);

            await resultCalcTemplateController.getCalcTemplatesDashboard(req2, res2, next);

            expect(getAllCalcTemplates).toHaveBeenCalledTimes(2);
        });
    });

    describe('user context validation', () => {
        test('should handle user with different permissions', async () => {
            req.user.role.permissions = ['result:read'];

            getAllCalcTemplates.mockResolvedValue([]);

            await resultCalcTemplateController.getCalcTemplatesDashboard(req, res, next);

            const renderCall = res.render.mock.calls[0][1];
            expect(renderCall.rolePermissons).toEqual(['result:read']);
        });

        test('should preserve user information in operations', async () => {
            req.user.username = 'specialuser';

            req.body = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };
            createCalcTemplate.mockResolvedValue({ _id: '1' });

            await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

            expect(logOperation).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                'specialuser',
                expect.any(Number)
            );
        });
    });

    describe('integration scenarios', () => {
        test('should handle complete template lifecycle: create and update', async () => {
            // Create
            req.body = { name: 'Template', round1FirstP: 40, round1SecondP: 30, round2FirstP: 30 };
            const createdId = '607f1f77bcf86cd799439099';
            createCalcTemplate.mockResolvedValue({ _id: createdId, ...req.body });

            await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/dashboard');

            // Get for edit
            req.params.id = createdId;
            const templateData = { _id: createdId, ...req.body };
            getCalcTemplateById.mockResolvedValue(templateData);

            await resultCalcTemplateController.getEditCalcTemplateForm(req, res, next);

            expect(getCalcTemplateById).toHaveBeenCalledWith(createdId);

            // Update
            req.body = { round1FirstP: 50, round1SecondP: 25, round2FirstP: 25 };
            updateCalcTemplate.mockResolvedValue({ _id: createdId, ...req.body });

            await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/result/calcTemp/dashboard');
        });

        test('should maintain validation across create and update', async () => {
            const invalidData = { round1FirstP: 40, round1SecondP: 30, round2FirstP: 20 };

            // Create with invalid data
            req.body = invalidData;
            await resultCalcTemplateController.createNewCalcTemplate(req, res, next);

            expect(createCalcTemplate).not.toHaveBeenCalled();

            // Reset and try update with invalid data
            jest.clearAllMocks();
            req.params.id = '607f1f77bcf86cd799439099';
            req.body = invalidData;

            await resultCalcTemplateController.updateCalcTemplateById(req, res, next);

            expect(updateCalcTemplate).not.toHaveBeenCalled();
        });
    });
});

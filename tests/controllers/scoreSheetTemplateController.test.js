import { logError, logDebug } from '../../logger.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
    getAllScoreSheetTemplates,
    getScoreSheetTemplateById,
    getAllCategories,
    getCategoriesByIds,
    createScoreSheetTemplate,
    updateScoreSheetTemplate,
    deleteScoreSheetTemplate,
    parseJSONArrayField,
    validateCategoriesAgegroup,
    deleteImageFile
} from '../../DataServices/scoreSheetTemplateData.js';
import scoreSheetTemplateController from '../../controllers/scoreSheetTemplateController.js';

jest.mock('../../logger.js');
jest.mock('../../DataServices/scoreSheetTemplateData.js');

describe('scoreSheetTemplateController', () => {
    let req;
    let res;
    let next;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        role: {
            permissions: ['scoresheet:read', 'scoresheet:write']
        }
    };

    beforeEach(() => {
        req = {
            params: { id: '607f1f77bcf86cd799439055' },
            body: {},
            file: undefined,
            user: mockUser,
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
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getScoreSheetTemplatesDashboard', () => {
        test('renders dashboard with templates', async () => {
            const sheets = [{ _id: '1' }, { _id: '2' }];
            getAllScoreSheetTemplates.mockResolvedValue(sheets);

            await scoreSheetTemplateController.getScoreSheetTemplatesDashboard(req, res, next);

            expect(getAllScoreSheetTemplates).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith('ssTemp/dashboard', {
                ssTemps: sheets,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('passes and clears session messages', async () => {
            req.session.failMessage = 'fail';
            req.session.successMessage = 'ok';
            getAllScoreSheetTemplates.mockResolvedValue([]);

            await scoreSheetTemplateController.getScoreSheetTemplatesDashboard(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('fail');
            expect(data.successMessage).toBe('ok');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates list errors', async () => {
            getAllScoreSheetTemplates.mockRejectedValue(new Error('list failed'));

            await expect(scoreSheetTemplateController.getScoreSheetTemplatesDashboard(req, res, next)).rejects.toThrow('list failed');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('getCreateScoreSheetTemplateForm', () => {
        test('renders create form with categories and session formData', async () => {
            req.session.formData = { TestType: 'Compulsory' };
            getAllCategories.mockResolvedValue([{ _id: 'c1', name: 'Cat1' }]);

            await scoreSheetTemplateController.getCreateScoreSheetTemplateForm(req, res, next);

            expect(getAllCategories).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith('ssTemp/newScoreSheet', {
                categorys: [{ _id: 'c1', name: 'Cat1' }],
                formData: { TestType: 'Compulsory' },
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('clears session messages after rendering', async () => {
            req.session.failMessage = 'err';
            req.session.successMessage = 'ok';
            getAllCategories.mockResolvedValue([]);

            await scoreSheetTemplateController.getCreateScoreSheetTemplateForm(req, res, next);

            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates category load errors', async () => {
            getAllCategories.mockRejectedValue(new Error('categories failed'));

            await expect(scoreSheetTemplateController.getCreateScoreSheetTemplateForm(req, res, next)).rejects.toThrow('categories failed');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('createNewScoreSheetTemplate', () => {
        test('creates template with uploaded file and redirects', async () => {
            req.body = {
                TestType: 'Compulsory',
                typeOfScores: 'A',
                numberOfJudges: '4',
                Category: ['cat1'],
                outputFieldList: '[{"key":"Total"}]',
                inputFieldList: '[{"key":"Judge1"}]'
            };
            req.file = { filename: 'img.png' };

            parseJSONArrayField
                .mockReturnValueOnce([{ key: 'Total' }])
                .mockReturnValueOnce([{ key: 'Judge1' }]);
            createScoreSheetTemplate.mockResolvedValue({ _id: 'new-sheet-id' });

            await scoreSheetTemplateController.createNewScoreSheetTemplate(req, res);

            expect(logDebug).toHaveBeenCalled();
            expect(parseJSONArrayField).toHaveBeenNthCalledWith(1, req.body.outputFieldList, 'outputFieldList');
            expect(parseJSONArrayField).toHaveBeenNthCalledWith(2, req.body.inputFieldList, 'inputFieldList');
            expect(createScoreSheetTemplate).toHaveBeenCalledWith({
                TestType: 'Compulsory',
                typeOfScores: 'A',
                numberOfJudges: 4,
                CategoryId: ['cat1'],
                outputFieldList: [{ key: 'Total' }],
                inputFieldList: [{ key: 'Judge1' }],
                bgImage: '/static/uploads/img.png'
            });
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_CREATED);
            expect(res.redirect).toHaveBeenCalledWith('/scoresheets/dashboard');
        });

        test('creates template without uploaded file using body bgImage', async () => {
            req.body = {
                TestType: 'Free',
                typeOfScores: 'B',
                numberOfJudges: '3',
                Category: ['cat2'],
                outputFieldList: '[]',
                inputFieldList: '[]',
                bgImage: '/static/uploads/existing.png'
            };

            parseJSONArrayField
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);
            createScoreSheetTemplate.mockResolvedValue({ _id: 'sheet2' });

            await scoreSheetTemplateController.createNewScoreSheetTemplate(req, res);

            expect(createScoreSheetTemplate).toHaveBeenCalledWith(expect.objectContaining({
                bgImage: '/static/uploads/existing.png',
                numberOfJudges: 3
            }));
            expect(res.redirect).toHaveBeenCalledWith('/scoresheets/dashboard');
        });

        test('renders create form with duplicate error message on 11000', async () => {
            req.body = {
                TestType: 'Free',
                typeOfScores: 'B',
                numberOfJudges: '3',
                Category: ['cat2'],
                outputFieldList: '[]',
                inputFieldList: '[]'
            };

            parseJSONArrayField
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);
            const duplicateErr = new Error('dup');
            duplicateErr.code = 11000;
            createScoreSheetTemplate.mockRejectedValue(duplicateErr);
            getAllCategories.mockResolvedValue([{ _id: 'c1' }]);

            await scoreSheetTemplateController.createNewScoreSheetTemplate(req, res);

            expect(logError).toHaveBeenCalledWith('SHEET_CREATION_ERROR', 'dup', 'User: testuser');
            expect(res.render).toHaveBeenCalledWith('ssTemp/newScoreSheet', {
                categorys: [{ _id: 'c1' }],
                formData: req.body,
                rolePermissons: mockUser.role.permissions,
                failMessage: 'Duplicate template combination (TestType, typeOfScores, numberOfJudges, CategoryId).',
                successMessage: null,
                user: mockUser
            });
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('renders create form with generic error message on non-duplicate failure', async () => {
            req.body = {
                outputFieldList: '[]',
                inputFieldList: '[]'
            };
            parseJSONArrayField
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);

            createScoreSheetTemplate.mockRejectedValue(new Error('validation failed'));
            getAllCategories.mockResolvedValue([]);

            await scoreSheetTemplateController.createNewScoreSheetTemplate(req, res);

            const call = res.render.mock.calls[0][1];
            expect(call.failMessage).toBe('validation failed');
            expect(call.formData).toEqual(req.body);
        });
    });

    describe('getEditScoreSheetTemplateForm', () => {
        test('redirects with error when template not found', async () => {
            getScoreSheetTemplateById.mockResolvedValue(null);

            await scoreSheetTemplateController.getEditScoreSheetTemplateForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.TEMPLATE_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoresheets/dashboard');
            expect(res.render).not.toHaveBeenCalled();
        });

        test('renders edit form with template and categories', async () => {
            const sheet = { _id: req.params.id, TestType: 'Compulsory' };
            const categories = [{ _id: 'c1' }];
            getScoreSheetTemplateById.mockResolvedValue(sheet);
            getAllCategories.mockResolvedValue(categories);

            await scoreSheetTemplateController.getEditScoreSheetTemplateForm(req, res, next);

            expect(getScoreSheetTemplateById).toHaveBeenCalledWith(req.params.id);
            expect(getAllCategories).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith('ssTemp/editScoreSheet', {
                categorys: categories,
                formData: sheet,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates edit form load errors', async () => {
            getScoreSheetTemplateById.mockRejectedValue(new Error('load failed'));

            await expect(scoreSheetTemplateController.getEditScoreSheetTemplateForm(req, res, next)).rejects.toThrow('load failed');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('updateScoreSheetTemplateById', () => {
        test('updates template and redirects with success', async () => {
            req.body = {
                TestType: 'Free',
                typeOfScores: 'B',
                numberOfJudges: '5',
                Category: ['cat1'],
                outputFieldList: '[{"k":"o"}]',
                inputFieldList: '[{"k":"i"}]',
                bgImage: '/static/uploads/current.png'
            };

            const oldTemplate = { _id: req.params.id, bgImage: '/static/uploads/current.png' };
            getCategoriesByIds.mockResolvedValue([{ _id: 'cat1' }]);
            validateCategoriesAgegroup.mockReturnValue(undefined);
            getScoreSheetTemplateById.mockResolvedValue(oldTemplate);
            parseJSONArrayField
                .mockReturnValueOnce([{ k: 'o' }])
                .mockReturnValueOnce([{ k: 'i' }]);
            updateScoreSheetTemplate.mockResolvedValue({ _id: req.params.id });

            await scoreSheetTemplateController.updateScoreSheetTemplateById(req, res, next);

            expect(getCategoriesByIds).toHaveBeenCalledWith(['cat1']);
            expect(validateCategoriesAgegroup).toHaveBeenCalledWith([{ _id: 'cat1' }]);
            expect(updateScoreSheetTemplate).toHaveBeenCalledWith(req.params.id, {
                TestType: 'Free',
                typeOfScores: 'B',
                numberOfJudges: 5,
                CategoryId: ['cat1'],
                outputFieldList: [{ k: 'o' }],
                inputFieldList: [{ k: 'i' }],
                bgImage: '/static/uploads/current.png'
            });
            expect(deleteImageFile).not.toHaveBeenCalled();
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_UPDATED);
            expect(res.redirect).toHaveBeenCalledWith('/scoresheets/dashboard');
        });

        test('deletes old bg image when new file uploaded and changed', async () => {
            req.body = {
                TestType: 'Free',
                typeOfScores: 'B',
                numberOfJudges: '5',
                Category: ['cat1'],
                outputFieldList: '[]',
                inputFieldList: '[]'
            };
            req.file = { filename: 'new-bg.png' };

            const oldTemplate = { _id: req.params.id, bgImage: '/static/uploads/old-bg.png' };
            getCategoriesByIds.mockResolvedValue([{ _id: 'cat1' }]);
            validateCategoriesAgegroup.mockReturnValue(undefined);
            getScoreSheetTemplateById.mockResolvedValue(oldTemplate);
            parseJSONArrayField
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);
            updateScoreSheetTemplate.mockResolvedValue({ _id: req.params.id });
            deleteImageFile.mockResolvedValue(undefined);

            await scoreSheetTemplateController.updateScoreSheetTemplateById(req, res, next);

            expect(updateScoreSheetTemplate).toHaveBeenCalledWith(req.params.id, expect.objectContaining({
                bgImage: '/static/uploads/new-bg.png'
            }));
            expect(deleteImageFile).toHaveBeenCalledWith('/static/uploads/old-bg.png');
        });

        test('redirects with template-not-found when old template missing', async () => {
            req.body = {
                Category: ['cat1'],
                outputFieldList: '[]',
                inputFieldList: '[]'
            };
            getCategoriesByIds.mockResolvedValue([{ _id: 'cat1' }]);
            validateCategoriesAgegroup.mockReturnValue(undefined);
            getScoreSheetTemplateById.mockResolvedValue(null);

            await scoreSheetTemplateController.updateScoreSheetTemplateById(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.TEMPLATE_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/scoresheets/dashboard');
            expect(updateScoreSheetTemplate).not.toHaveBeenCalled();
        });

        test('propagates validation errors', async () => {
            req.body = { Category: ['cat1'] };
            getCategoriesByIds.mockResolvedValue([{ _id: 'cat1' }]);
            validateCategoriesAgegroup.mockImplementation(() => {
                throw new Error('agegroup mismatch');
            });

            await expect(scoreSheetTemplateController.updateScoreSheetTemplateById(req, res, next)).rejects.toThrow('agegroup mismatch');
            expect(updateScoreSheetTemplate).not.toHaveBeenCalled();
        });
    });

    describe('deleteScoreSheetTemplateById', () => {
        test('returns 404 when template to delete does not exist', async () => {
            deleteScoreSheetTemplate.mockResolvedValue(null);

            await scoreSheetTemplateController.deleteScoreSheetTemplateById(req, res, next);

            expect(deleteScoreSheetTemplate).toHaveBeenCalledWith(req.params.id);
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.ERROR.TEMPLATE_NOT_FOUND });
        });

        test('returns 200 with success json when delete succeeds', async () => {
            deleteScoreSheetTemplate.mockResolvedValue({ _id: req.params.id });

            await scoreSheetTemplateController.deleteScoreSheetTemplateById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_UPDATED });
        });

        test('propagates delete errors', async () => {
            deleteScoreSheetTemplate.mockRejectedValue(new Error('delete failed'));

            await expect(scoreSheetTemplateController.deleteScoreSheetTemplateById(req, res, next)).rejects.toThrow('delete failed');
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});

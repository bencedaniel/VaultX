import { logOperation } from '../../logger.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
    getAllGenerators,
    getGeneratorFormData,
    createGenerator,
    updateGenerator,
    updateGeneratorStatus,
    getGeneratorById,
    deleteGenerator
} from '../../DataServices/resultGeneratorData.js';
import resultGeneratorController from '../../controllers/resultGeneratorController.js';

jest.mock('../../logger.js');
jest.mock('../../DataServices/resultGeneratorData.js');

describe('resultGeneratorController', () => {
    let req;
    let res;
    let next;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        role: {
            permissions: ['result-generator:read', 'result-generator:write']
        }
    };

    beforeEach(() => {
        req = {
            params: { id: '507f1f77bcf86cd799439099' },
            body: {},
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
            send: jest.fn().mockReturnThis()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getGeneratorsDashboard', () => {
        test('renders dashboard with generators', async () => {
            const generators = [{ _id: '1', name: 'Gen A' }, { _id: '2', name: 'Gen B' }];
            getAllGenerators.mockResolvedValue(generators);

            await resultGeneratorController.getGeneratorsDashboard(req, res, next);

            expect(getAllGenerators).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith('resultGen/dashboard', {
                generators,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('passes session messages to view then clears them', async () => {
            req.session.failMessage = 'fail';
            req.session.successMessage = 'success';
            getAllGenerators.mockResolvedValue([]);

            await resultGeneratorController.getGeneratorsDashboard(req, res, next);

            const renderData = res.render.mock.calls[0][1];
            expect(renderData.failMessage).toBe('fail');
            expect(renderData.successMessage).toBe('success');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('handles missing user via optional chaining', async () => {
            req.user = undefined;
            getAllGenerators.mockResolvedValue([]);

            await resultGeneratorController.getGeneratorsDashboard(req, res, next);

            const renderData = res.render.mock.calls[0][1];
            expect(renderData.rolePermissons).toBeUndefined();
            expect(renderData.user).toBeUndefined();
        });

        test('propagates data layer errors', async () => {
            getAllGenerators.mockRejectedValue(new Error('db error'));

            await expect(resultGeneratorController.getGeneratorsDashboard(req, res, next)).rejects.toThrow('db error');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('getNewGeneratorForm', () => {
        test('renders new form with categories and templates', async () => {
            const categories = [{ _id: 'c1', name: 'Cat 1' }];
            const calcTemplates = [{ _id: 't1', name: 'Template 1' }];
            getGeneratorFormData.mockResolvedValue({ categories, calcTemplates });

            await resultGeneratorController.getNewGeneratorForm(req, res, next);

            expect(getGeneratorFormData).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith('resultGen/newResultGen', {
                formData: {},
                categories,
                resultCalcs: calcTemplates,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('uses session formData if present', async () => {
            req.session.formData = { category: 'c1', calcTemplate: 't1', active: true };
            getGeneratorFormData.mockResolvedValue({ categories: [], calcTemplates: [] });

            await resultGeneratorController.getNewGeneratorForm(req, res, next);

            const renderData = res.render.mock.calls[0][1];
            expect(renderData.formData).toEqual(req.session.formData);
        });

        test('clears session messages after render', async () => {
            req.session.failMessage = 'old fail';
            req.session.successMessage = 'old success';
            getGeneratorFormData.mockResolvedValue({ categories: [], calcTemplates: [] });

            await resultGeneratorController.getNewGeneratorForm(req, res, next);

            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates form-data retrieval errors', async () => {
            getGeneratorFormData.mockRejectedValue(new Error('form error'));

            await expect(resultGeneratorController.getNewGeneratorForm(req, res, next)).rejects.toThrow('form error');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('createNewGenerator', () => {
        test('creates generator, logs operation, sets success message and redirects', async () => {
            const created = { _id: 'g1', name: 'Generator 1' };
            req.body = { name: 'Generator 1', active: true };
            createGenerator.mockResolvedValue(created);

            await resultGeneratorController.createNewGenerator(req, res, next);

            expect(createGenerator).toHaveBeenCalledWith(req.body);
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GENERATOR_CREATE',
                'Result generator created: g1',
                mockUser.username,
                HTTP_STATUS.CREATED
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_GENERATOR_CREATED);
            expect(res.redirect).toHaveBeenCalledWith('/result/generator/dashboard');
        });

        test('uses current user username in log', async () => {
            req.user.username = 'admin';
            createGenerator.mockResolvedValue({ _id: 'g2' });

            await resultGeneratorController.createNewGenerator(req, res, next);

            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GENERATOR_CREATE',
                expect.any(String),
                'admin',
                HTTP_STATUS.CREATED
            );
        });

        test('propagates create errors and does not redirect', async () => {
            createGenerator.mockRejectedValue(new Error('create failed'));

            await expect(resultGeneratorController.createNewGenerator(req, res, next)).rejects.toThrow('create failed');
            expect(res.redirect).not.toHaveBeenCalled();
            expect(logOperation).not.toHaveBeenCalled();
        });
    });

    describe('updateGeneratorStatusById', () => {
        test('updates status, logs operation and sends success response', async () => {
            req.params.id = 'g1';
            req.body.status = 'active';
            const updated = { _id: 'g1', status: 'active' };
            updateGeneratorStatus.mockResolvedValue(updated);

            await resultGeneratorController.updateGeneratorStatusById(req, res, next);

            expect(updateGeneratorStatus).toHaveBeenCalledWith('g1', 'active');
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GENERATOR_UPDATE',
                'Result generator status updated: g1',
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GENERATOR_STATUS_UPDATED);
        });

        test('propagates status update errors', async () => {
            updateGeneratorStatus.mockRejectedValue(new Error('status update failed'));

            await expect(resultGeneratorController.updateGeneratorStatusById(req, res, next)).rejects.toThrow('status update failed');
            expect(res.send).not.toHaveBeenCalled();
        });
    });

    describe('getEditGeneratorForm', () => {
        test('renders edit form with generator and form data', async () => {
            const generator = { _id: 'g1', name: 'Gen Edit', status: 'active' };
            const categories = [{ _id: 'c1', name: 'Cat 1' }];
            const calcTemplates = [{ _id: 't1', name: 'Temp 1' }];

            getGeneratorById.mockResolvedValue(generator);
            getGeneratorFormData.mockResolvedValue({ categories, calcTemplates });

            await resultGeneratorController.getEditGeneratorForm(req, res, next);

            expect(getGeneratorById).toHaveBeenCalledWith('507f1f77bcf86cd799439099');
            expect(getGeneratorFormData).toHaveBeenCalledTimes(1);
            expect(res.render).toHaveBeenCalledWith('resultGen/editResultGen', {
                formData: generator,
                categories,
                resultCalcs: calcTemplates,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('passes session messages and clears them after render', async () => {
            req.session.failMessage = 'f';
            req.session.successMessage = 's';
            getGeneratorById.mockResolvedValue({ _id: 'g1' });
            getGeneratorFormData.mockResolvedValue({ categories: [], calcTemplates: [] });

            await resultGeneratorController.getEditGeneratorForm(req, res, next);

            const renderData = res.render.mock.calls[0][1];
            expect(renderData.failMessage).toBe('f');
            expect(renderData.successMessage).toBe('s');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates getGeneratorById errors', async () => {
            getGeneratorById.mockRejectedValue(new Error('not found'));

            await expect(resultGeneratorController.getEditGeneratorForm(req, res, next)).rejects.toThrow('not found');
            expect(res.render).not.toHaveBeenCalled();
        });

        test('propagates getGeneratorFormData errors', async () => {
            getGeneratorById.mockResolvedValue({ _id: 'g1' });
            getGeneratorFormData.mockRejectedValue(new Error('form data failed'));

            await expect(resultGeneratorController.getEditGeneratorForm(req, res, next)).rejects.toThrow('form data failed');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('updateGeneratorById', () => {
        test('updates generator, logs operation, sets success message and redirects', async () => {
            req.params.id = 'g1';
            req.body = { name: 'Updated Generator', active: false };
            const updated = { _id: 'g1', ...req.body };
            updateGenerator.mockResolvedValue(updated);

            await resultGeneratorController.updateGeneratorById(req, res, next);

            expect(updateGenerator).toHaveBeenCalledWith('g1', req.body);
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GENERATOR_UPDATE',
                'Result generator updated: g1',
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_GENERATOR_EDITED);
            expect(res.redirect).toHaveBeenCalledWith('/result/generator/dashboard');
        });

        test('propagates update errors', async () => {
            updateGenerator.mockRejectedValue(new Error('update failed'));

            await expect(resultGeneratorController.updateGeneratorById(req, res, next)).rejects.toThrow('update failed');
            expect(res.redirect).not.toHaveBeenCalled();
            expect(logOperation).not.toHaveBeenCalled();
        });
    });

    describe('deleteGeneratorById', () => {
        test('deletes generator, logs operation and sends success response', async () => {
            req.params.id = 'g1';
            const deleted = { _id: 'g1' };
            deleteGenerator.mockResolvedValue(deleted);

            await resultGeneratorController.deleteGeneratorById(req, res, next);

            expect(deleteGenerator).toHaveBeenCalledWith('g1');
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GENERATOR_DELETE',
                'Result generator deleted: g1',
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GENERATOR_DELETED);
        });

        test('propagates delete errors', async () => {
            deleteGenerator.mockRejectedValue(new Error('delete failed'));

            await expect(resultGeneratorController.deleteGeneratorById(req, res, next)).rejects.toThrow('delete failed');
            expect(res.send).not.toHaveBeenCalled();
        });
    });

    describe('integration flow', () => {
        test('supports create -> edit form -> update -> status update -> delete lifecycle', async () => {
            createGenerator.mockResolvedValue({ _id: 'lifecycle-id' });
            getGeneratorById.mockResolvedValue({ _id: 'lifecycle-id', name: 'Gen' });
            getGeneratorFormData.mockResolvedValue({ categories: [], calcTemplates: [] });
            updateGenerator.mockResolvedValue({ _id: 'lifecycle-id', name: 'Gen Updated' });
            updateGeneratorStatus.mockResolvedValue({ _id: 'lifecycle-id', status: 'inactive' });
            deleteGenerator.mockResolvedValue({ _id: 'lifecycle-id' });

            req.body = { name: 'Gen' };
            await resultGeneratorController.createNewGenerator(req, res, next);
            expect(res.redirect).toHaveBeenCalledWith('/result/generator/dashboard');

            jest.clearAllMocks();

            req.params.id = 'lifecycle-id';
            await resultGeneratorController.getEditGeneratorForm(req, res, next);
            expect(res.render).toHaveBeenCalledWith('resultGen/editResultGen', expect.any(Object));

            req.body = { name: 'Gen Updated' };
            await resultGeneratorController.updateGeneratorById(req, res, next);
            expect(res.redirect).toHaveBeenCalledWith('/result/generator/dashboard');

            req.body = { status: 'inactive' };
            await resultGeneratorController.updateGeneratorStatusById(req, res, next);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GENERATOR_STATUS_UPDATED);

            await resultGeneratorController.deleteGeneratorById(req, res, next);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GENERATOR_DELETED);
        });
    });
});

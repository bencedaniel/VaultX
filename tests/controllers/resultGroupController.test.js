import { logOperation } from '../../logger.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
    getResultGroupsByEvent,
    getResultGroupById,
    getGroupFormData,
    updateResultGroup,
    createResultGroup,
    deleteResultGroup,
    generateGroupsForActiveGenerators
} from '../../DataServices/resultGroupData.js';
import resultGroupController from '../../controllers/resultGroupController.js';

jest.mock('../../logger.js');
jest.mock('../../DataServices/resultGroupData.js');

describe('resultGroupController', () => {
    let req;
    let res;
    let next;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        role: {
            permissions: ['result-group:read', 'result-group:write']
        }
    };

    const mockEventId = '507f1f77bcf86cd799439099';

    beforeEach(() => {
        req = {
            params: { id: '607f1f77bcf86cd799439055' },
            body: {},
            user: mockUser,
            session: {
                failMessage: null,
                successMessage: null,
                formData: null
            }
        };

        res = {
            locals: { selectedEvent: { _id: mockEventId } },
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getResultGroupsDashboard', () => {
        test('renders dashboard with result groups', async () => {
            const resultGroups = [{ _id: '1' }, { _id: '2' }];
            getResultGroupsByEvent.mockResolvedValue(resultGroups);

            await resultGroupController.getResultGroupsDashboard(req, res, next);

            expect(getResultGroupsByEvent).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('resultGroup/dashboard', {
                resultGroups,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('forwards session messages then clears them', async () => {
            req.session.failMessage = 'fail';
            req.session.successMessage = 'ok';
            getResultGroupsByEvent.mockResolvedValue([]);

            await resultGroupController.getResultGroupsDashboard(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('fail');
            expect(data.successMessage).toBe('ok');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('handles missing selectedEvent with optional chaining', async () => {
            delete res.locals.selectedEvent;
            getResultGroupsByEvent.mockResolvedValue([]);

            await resultGroupController.getResultGroupsDashboard(req, res, next);

            expect(getResultGroupsByEvent).toHaveBeenCalledWith(undefined);
        });

        test('propagates data-service errors', async () => {
            getResultGroupsByEvent.mockRejectedValue(new Error('db fail'));

            await expect(resultGroupController.getResultGroupsDashboard(req, res, next)).rejects.toThrow('db fail');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('getEditResultGroupForm', () => {
        test('redirects with error when result group is not found', async () => {
            getResultGroupById.mockResolvedValue(null);

            await resultGroupController.getEditResultGroupForm(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/result/groups/dashboard');
            expect(getGroupFormData).not.toHaveBeenCalled();
            expect(res.render).not.toHaveBeenCalled();
        });

        test('renders edit form with group and form metadata', async () => {
            const resultGroupDoc = { _id: req.params.id, category: 'cat1' };
            const formData = {
                categories: [{ _id: 'c1' }],
                calcTemplates: [{ _id: 'ct1' }],
                timetableParts: [{ _id: 'tp1' }],
                timetablePartsRound1: [{ _id: 'r1' }],
                timetablePartsRound2: [{ _id: 'r2' }]
            };

            getResultGroupById.mockResolvedValue(resultGroupDoc);
            getGroupFormData.mockResolvedValue(formData);

            await resultGroupController.getEditResultGroupForm(req, res, next);

            expect(getResultGroupById).toHaveBeenCalledWith(req.params.id);
            expect(getGroupFormData).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('resultGroup/editResultGroup', {
                categories: formData.categories,
                formData: resultGroupDoc,
                resultCalcs: formData.calcTemplates,
                timetableParts: formData.timetableParts,
                timetablePartsRound1: formData.timetablePartsRound1,
                timetablePartsRound2: formData.timetablePartsRound2,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('passes existing session messages to edit view before clear', async () => {
            req.session.failMessage = 'f';
            req.session.successMessage = 's';

            getResultGroupById.mockResolvedValue({ _id: req.params.id });
            getGroupFormData.mockResolvedValue({
                categories: [],
                calcTemplates: [],
                timetableParts: [],
                timetablePartsRound1: [],
                timetablePartsRound2: []
            });

            await resultGroupController.getEditResultGroupForm(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('f');
            expect(data.successMessage).toBe('s');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates getResultGroupById errors', async () => {
            getResultGroupById.mockRejectedValue(new Error('not found error'));

            await expect(resultGroupController.getEditResultGroupForm(req, res, next)).rejects.toThrow('not found error');
        });

        test('propagates getGroupFormData errors', async () => {
            getResultGroupById.mockResolvedValue({ _id: req.params.id });
            getGroupFormData.mockRejectedValue(new Error('form data error'));

            await expect(resultGroupController.getEditResultGroupForm(req, res, next)).rejects.toThrow('form data error');
        });
    });

    describe('updateResultGroupById', () => {
        test('updates group, logs operation, sets success message and redirects', async () => {
            req.body = { category: 'cat-updated' };
            const updatedDoc = { _id: req.params.id, ...req.body };
            updateResultGroup.mockResolvedValue(updatedDoc);

            await resultGroupController.updateResultGroupById(req, res, next);

            expect(updateResultGroup).toHaveBeenCalledWith(req.params.id, req.body);
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GROUP_UPDATE',
                `Result group updated: ${req.params.id}`,
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_GROUP_EDITED);
            expect(res.redirect).toHaveBeenCalledWith('/result/groups/dashboard');
        });

        test('uses fallback id in log when updated doc is null', async () => {
            updateResultGroup.mockResolvedValue(null);

            await resultGroupController.updateResultGroupById(req, res, next);

            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GROUP_UPDATE',
                `Result group updated: ${req.params.id}`,
                mockUser.username,
                HTTP_STATUS.OK
            );
        });

        test('propagates update errors', async () => {
            updateResultGroup.mockRejectedValue(new Error('update failed'));

            await expect(resultGroupController.updateResultGroupById(req, res, next)).rejects.toThrow('update failed');
            expect(res.redirect).not.toHaveBeenCalled();
        });
    });

    describe('getNewResultGroupForm', () => {
        test('renders new form with form metadata and empty formData by default', async () => {
            const formData = {
                categories: [{ _id: 'c1' }],
                calcTemplates: [{ _id: 'ct1' }],
                timetableParts: [{ _id: 'tp1' }],
                timetablePartsRound1: [{ _id: 'r1' }],
                timetablePartsRound2: [{ _id: 'r2' }]
            };
            getGroupFormData.mockResolvedValue(formData);

            await resultGroupController.getNewResultGroupForm(req, res, next);

            expect(getGroupFormData).toHaveBeenCalledWith(mockEventId);
            expect(res.render).toHaveBeenCalledWith('resultGroup/newResultGroup', {
                categories: formData.categories,
                formData: {},
                resultCalcs: formData.calcTemplates,
                timetableParts: formData.timetableParts,
                timetablePartsRound1: formData.timetablePartsRound1,
                timetablePartsRound2: formData.timetablePartsRound2,
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            });
        });

        test('uses session formData when present', async () => {
            req.session.formData = { category: 'c2', round1: 'p1' };
            getGroupFormData.mockResolvedValue({
                categories: [],
                calcTemplates: [],
                timetableParts: [],
                timetablePartsRound1: [],
                timetablePartsRound2: []
            });

            await resultGroupController.getNewResultGroupForm(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.formData).toEqual(req.session.formData);
        });

        test('passes and clears session messages', async () => {
            req.session.failMessage = 'bad';
            req.session.successMessage = 'good';
            getGroupFormData.mockResolvedValue({
                categories: [],
                calcTemplates: [],
                timetableParts: [],
                timetablePartsRound1: [],
                timetablePartsRound2: []
            });

            await resultGroupController.getNewResultGroupForm(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('bad');
            expect(data.successMessage).toBe('good');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });

        test('propagates getGroupFormData errors', async () => {
            getGroupFormData.mockRejectedValue(new Error('new form failed'));

            await expect(resultGroupController.getNewResultGroupForm(req, res, next)).rejects.toThrow('new form failed');
            expect(res.render).not.toHaveBeenCalled();
        });
    });

    describe('createNewResultGroup', () => {
        test('creates group, logs operation, sets success and redirects', async () => {
            req.body = { category: 'cat1', calcTemplate: 'ct1' };
            const created = { _id: 'new-group-id' };
            createResultGroup.mockResolvedValue(created);

            await resultGroupController.createNewResultGroup(req, res, next);

            expect(createResultGroup).toHaveBeenCalledWith(mockEventId, req.body);
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GROUP_CREATE',
                'Result group created: new-group-id',
                mockUser.username,
                HTTP_STATUS.CREATED
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_GROUP_CREATED);
            expect(res.redirect).toHaveBeenCalledWith('/result/groups/dashboard');
        });

        test('propagates create errors', async () => {
            createResultGroup.mockRejectedValue(new Error('create error'));

            await expect(resultGroupController.createNewResultGroup(req, res, next)).rejects.toThrow('create error');
            expect(res.redirect).not.toHaveBeenCalled();
        });
    });

    describe('deleteResultGroupById', () => {
        test('deletes group, logs operation, sets session success and sends OK message', async () => {
            const deletedDoc = { _id: req.params.id };
            deleteResultGroup.mockResolvedValue(deletedDoc);

            await resultGroupController.deleteResultGroupById(req, res, next);

            expect(deleteResultGroup).toHaveBeenCalledWith(req.params.id);
            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GROUP_DELETE',
                `Result group deleted: ${req.params.id}`,
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_GROUP_DELETED);
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GROUP_DELETED);
        });

        test('uses fallback id in log when delete returns null', async () => {
            deleteResultGroup.mockResolvedValue(null);

            await resultGroupController.deleteResultGroupById(req, res, next);

            expect(logOperation).toHaveBeenCalledWith(
                'RESULT_GROUP_DELETE',
                `Result group deleted: ${req.params.id}`,
                mockUser.username,
                HTTP_STATUS.OK
            );
        });

        test('propagates delete errors', async () => {
            deleteResultGroup.mockRejectedValue(new Error('delete error'));

            await expect(resultGroupController.deleteResultGroupById(req, res, next)).rejects.toThrow('delete error');
            expect(res.send).not.toHaveBeenCalled();
        });
    });

    describe('generateResultGroups', () => {
        test('generates groups for active generators and returns success', async () => {
            generateGroupsForActiveGenerators.mockResolvedValue(undefined);

            await resultGroupController.generateResultGroups(req, res, next);

            expect(generateGroupsForActiveGenerators).toHaveBeenCalledWith(mockEventId, mockUser.username);
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED);
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED);
        });

        test('handles missing selectedEvent id with optional chaining', async () => {
            delete res.locals.selectedEvent;
            generateGroupsForActiveGenerators.mockResolvedValue(undefined);

            await resultGroupController.generateResultGroups(req, res, next);

            expect(generateGroupsForActiveGenerators).toHaveBeenCalledWith(undefined, mockUser.username);
        });

        test('propagates generation errors', async () => {
            generateGroupsForActiveGenerators.mockRejectedValue(new Error('generation failed'));

            await expect(resultGroupController.generateResultGroups(req, res, next)).rejects.toThrow('generation failed');
            expect(res.send).not.toHaveBeenCalled();
        });
    });

    describe('integration lifecycle', () => {
        test('supports dashboard -> new -> create -> edit -> update -> generate -> delete flow', async () => {
            getResultGroupsByEvent.mockResolvedValue([]);
            getGroupFormData.mockResolvedValue({
                categories: [],
                calcTemplates: [],
                timetableParts: [],
                timetablePartsRound1: [],
                timetablePartsRound2: []
            });
            createResultGroup.mockResolvedValue({ _id: 'lifecycle-id' });
            getResultGroupById.mockResolvedValue({ _id: 'lifecycle-id' });
            updateResultGroup.mockResolvedValue({ _id: 'lifecycle-id' });
            generateGroupsForActiveGenerators.mockResolvedValue(undefined);
            deleteResultGroup.mockResolvedValue({ _id: 'lifecycle-id' });

            await resultGroupController.getResultGroupsDashboard(req, res, next);
            expect(res.render).toHaveBeenCalledWith('resultGroup/dashboard', expect.any(Object));

            await resultGroupController.getNewResultGroupForm(req, res, next);
            expect(res.render).toHaveBeenCalledWith('resultGroup/newResultGroup', expect.any(Object));

            req.body = { category: 'cat', calcTemplate: 'calc' };
            await resultGroupController.createNewResultGroup(req, res, next);
            expect(res.redirect).toHaveBeenCalledWith('/result/groups/dashboard');

            req.params.id = 'lifecycle-id';
            await resultGroupController.getEditResultGroupForm(req, res, next);
            expect(res.render).toHaveBeenCalledWith('resultGroup/editResultGroup', expect.any(Object));

            req.body = { category: 'cat-updated' };
            await resultGroupController.updateResultGroupById(req, res, next);
            expect(res.redirect).toHaveBeenCalledWith('/result/groups/dashboard');

            await resultGroupController.generateResultGroups(req, res, next);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED);

            await resultGroupController.deleteResultGroupById(req, res, next);
            expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.RESULT_GROUP_DELETED);
        });
    });
});

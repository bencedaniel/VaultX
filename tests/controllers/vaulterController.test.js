import { logOperation } from '../../logger.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
    getAllVaulters,
    getVaulterById,
    getVaulterByIdLean,
    createVaulter,
    updateVaulter,
    updateVaulterArmNumber,
    addIncidentToVaulter,
    removeIncidentFromVaulter,
    getAllEntriesWithVaulters,
    getAllUsers
} from '../../DataServices/vaulterData.js';
import vaulterController from '../../controllers/vaulterController.js';

jest.mock('../../logger.js');
jest.mock('../../DataServices/vaulterData.js');

describe('vaulterController', () => {
    let req;
    let res;
    let next;

    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'adminUser',
        role: {
            permissions: ['vaulter:read', 'vaulter:write']
        }
    };

    const mockEventId = '507f1f77bcf86cd799439099';

    beforeEach(() => {
        req = {
            params: { id: 'vaulter1' },
            body: {},
            user: mockUser,
            session: {
                failMessage: null,
                successMessage: null,
                formData: null
            }
        };

        res = {
            locals: {
                selectedEvent: { _id: mockEventId }
            },
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getNewVaulterForm', () => {
        test('renders new vaulter form with country list and session data', async () => {
            req.session.formData = { Name: 'New Vaulter' };

            await vaulterController.getNewVaulterForm(req, res, next);

            expect(res.render).toHaveBeenCalledWith('vaulter/newVaulter', expect.objectContaining({
                formData: { Name: 'New Vaulter' },
                rolePermissons: mockUser.role.permissions,
                failMessage: null,
                successMessage: null,
                user: mockUser
            }));
            const renderData = res.render.mock.calls[0][1];
            expect(Array.isArray(renderData.countries)).toBe(true);
            expect(renderData.countries).toContain('Hungary');
        });

        test('passes messages and clears them', async () => {
            req.session.failMessage = 'fail';
            req.session.successMessage = 'ok';

            await vaulterController.getNewVaulterForm(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('fail');
            expect(data.successMessage).toBe('ok');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });
    });

    describe('createNewVaulter', () => {
        test('creates vaulter with event-specific ArmNr and redirects', async () => {
            req.body = { Name: 'V1', ArmNr: 12 };
            createVaulter.mockResolvedValue({ _id: 'newV' });

            await vaulterController.createNewVaulter(req, res, next);

            expect(createVaulter).toHaveBeenCalledWith({
                Name: 'V1',
                ArmNr: [{
                    eventID: mockEventId,
                    armNumber: 12
                }]
            });
            expect(logOperation).toHaveBeenCalledWith(
                'VAULTER_CREATE',
                'Vaulter created: V1',
                mockUser.username,
                HTTP_STATUS.CREATED
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.VAULTER_CREATED);
            expect(res.redirect).toHaveBeenCalledWith('/vaulter/dashboard');
        });

        test('propagates create errors', async () => {
            req.body = { Name: 'V1', ArmNr: 12 };
            createVaulter.mockRejectedValue(new Error('create fail'));

            await expect(vaulterController.createNewVaulter(req, res, next)).rejects.toThrow('create fail');
            expect(res.redirect).not.toHaveBeenCalled();
        });
    });

    describe('getVaultersDashboard', () => {
        test('filters ArmNr by selected event and renders dashboard', async () => {
            const vaulters = [
                {
                    _id: 'v1',
                    ArmNr: [
                        { eventID: mockEventId, armNumber: 10 },
                        { eventID: 'otherEvent', armNumber: 90 }
                    ]
                }
            ];
            getAllVaulters.mockResolvedValue(vaulters);

            await vaulterController.getVaultersDashboard(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.vaulters[0].ArmNr).toEqual([{ eventID: mockEventId, armNumber: 10 }]);
            expect(res.render).toHaveBeenCalledWith('vaulter/vaulterdash', expect.any(Object));
        });

        test('passes and clears session messages', async () => {
            req.session.failMessage = 'f';
            req.session.successMessage = 's';
            getAllVaulters.mockResolvedValue([]);

            await vaulterController.getVaultersDashboard(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('f');
            expect(data.successMessage).toBe('s');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });
    });

    describe('getVaulterDetails', () => {
        test('renders details with users and filtered ArmNr', async () => {
            const vaulter = {
                _id: 'v1',
                Name: 'V1',
                ArmNr: [
                    { eventID: mockEventId, armNumber: 11 },
                    { eventID: 'otherEvent', armNumber: 22 }
                ]
            };
            getVaulterById.mockResolvedValue(vaulter);
            getAllUsers.mockResolvedValue([{ _id: 'u1' }]);

            await vaulterController.getVaulterDetails(req, res, next);

            expect(getVaulterById).toHaveBeenCalledWith('vaulter1');
            const data = res.render.mock.calls[0][1];
            expect(data.formData.ArmNr).toEqual([{ eventID: mockEventId, armNumber: 11 }]);
            expect(data.users).toEqual([{ _id: 'u1' }]);
            expect(res.render).toHaveBeenCalledWith('vaulter/vaulterDetail', expect.any(Object));
        });

        test('throws when vaulter is null due to current code order', async () => {
            getVaulterById.mockResolvedValue(null);

            await expect(vaulterController.getVaulterDetails(req, res, next)).rejects.toBeTruthy();
            expect(res.redirect).not.toHaveBeenCalled();
        });

        test('propagates getAllUsers errors', async () => {
            getVaulterById.mockResolvedValue({ _id: 'v1', ArmNr: [] });
            getAllUsers.mockRejectedValue(new Error('users fail'));

            await expect(vaulterController.getVaulterDetails(req, res, next)).rejects.toThrow('users fail');
        });
    });

    describe('getEditVaulterForm', () => {
        test('renders edit form with filtered ArmNr and countries', async () => {
            getVaulterByIdLean.mockResolvedValue({
                _id: 'v1',
                Name: 'V1',
                ArmNr: [
                    { eventID: mockEventId, armNumber: 33 },
                    { eventID: 'other', armNumber: 44 }
                ]
            });

            await vaulterController.getEditVaulterForm(req, res, next);

            expect(getVaulterByIdLean).toHaveBeenCalledWith('vaulter1');
            const data = res.render.mock.calls[0][1];
            expect(data.formData.ArmNr).toEqual([{ eventID: mockEventId, armNumber: 33 }]);
            expect(data.countries).toContain('Hungary');
            expect(res.render).toHaveBeenCalledWith('vaulter/editVaulter', expect.any(Object));
        });

        test('throws when vaulter is null due to current code order', async () => {
            getVaulterByIdLean.mockResolvedValue(null);

            await expect(vaulterController.getEditVaulterForm(req, res, next)).rejects.toBeTruthy();
        });
    });

    describe('updateVaulterById', () => {
        test('updates vaulter and arm number then redirects with success', async () => {
            req.body = { Name: 'Updated', ArmNr: 55 };
            updateVaulter.mockResolvedValue({ _id: 'v1', Name: 'Updated' });
            updateVaulterArmNumber.mockResolvedValue(undefined);

            await vaulterController.updateVaulterById(req, res, next);

            expect(updateVaulter).toHaveBeenCalledWith('vaulter1', { Name: 'Updated' });
            expect(updateVaulterArmNumber).toHaveBeenCalledWith('vaulter1', mockEventId, 55);
            expect(logOperation).toHaveBeenCalledWith(
                'VAULTER_UPDATE',
                'Vaulter updated: Updated',
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.VAULTER_UPDATED);
            expect(res.redirect).toHaveBeenCalledWith('/vaulter/dashboard');
        });

        test('redirects when update returns null after arm number update', async () => {
            req.body = { Name: 'Updated', ArmNr: 55 };
            updateVaulter.mockResolvedValue(null);
            updateVaulterArmNumber.mockResolvedValue(undefined);

            await vaulterController.updateVaulterById(req, res, next);

            expect(req.session.failMessage).toBe(MESSAGES.ERROR.VAULTER_NOT_FOUND);
            expect(res.redirect).toHaveBeenCalledWith('/vaulter/dashboard');
        });

        test('propagates update errors', async () => {
            req.body = { Name: 'Updated', ArmNr: 55 };
            updateVaulter.mockRejectedValue(new Error('update fail'));

            await expect(vaulterController.updateVaulterById(req, res, next)).rejects.toThrow('update fail');
            expect(updateVaulterArmNumber).not.toHaveBeenCalled();
        });
    });

    describe('deleteVaulterIncident', () => {
        test('removes incident and returns ok json', async () => {
            const vaulter = { _id: 'v1', Name: 'V1' };
            req.body = {
                description: 'desc',
                incidentType: 'warn',
                date: '2026-03-22'
            };
            getVaulterById.mockResolvedValue(vaulter);
            removeIncidentFromVaulter.mockResolvedValue(undefined);

            await vaulterController.deleteVaulterIncident(req, res, next);

            expect(removeIncidentFromVaulter).toHaveBeenCalledWith('vaulter1', {
                description: 'desc',
                incidentType: 'warn',
                date: '2026-03-22',
                userId: mockUser._id
            });
            expect(logOperation).toHaveBeenCalledWith(
                'VAULTER_UPDATE',
                'Vaulter updated: V1',
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.SUCCESS.INCIDENT_DELETED });
        });

        test('throws when vaulter is null due to current log order', async () => {
            getVaulterById.mockResolvedValue(null);

            await expect(vaulterController.deleteVaulterIncident(req, res, next)).rejects.toBeTruthy();
            expect(removeIncidentFromVaulter).not.toHaveBeenCalled();
        });
    });

    describe('createVaulterIncident', () => {
        test('creates incident and returns success json', async () => {
            req.body = {
                description: 'desc',
                incidentType: 'info'
            };
            getVaulterById.mockResolvedValue({ _id: 'v1', Name: 'V1' });
            addIncidentToVaulter.mockResolvedValue(undefined);

            await vaulterController.createVaulterIncident(req, res, next);

            expect(addIncidentToVaulter).toHaveBeenCalledWith('vaulter1', expect.objectContaining({
                description: 'desc',
                incidentType: 'info',
                User: mockUser._id,
                eventID: mockEventId
            }));
            expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.INCIDENT_ADDED);
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.SUCCESS.INCIDENT_ADDED });
        });

        test('throws when vaulter is null due to current log order', async () => {
            getVaulterById.mockResolvedValue(null);

            await expect(vaulterController.createVaulterIncident(req, res, next)).rejects.toBeTruthy();
            expect(addIncidentToVaulter).not.toHaveBeenCalled();
        });
    });

    describe('getArmNumbersEditPage', () => {
        test('collects unique vaulters from entries and renders page', async () => {
            const shared = { _id: 'v-shared', ArmNr: [{ eventID: mockEventId, armNumber: 7 }, { eventID: 'other', armNumber: 9 }] };
            const entries = [
                { _id: 'e1', vaulter: [shared, { _id: 'v2', ArmNr: [{ eventID: mockEventId, armNumber: 8 }] }] },
                { _id: 'e2', vaulter: [shared] }
            ];
            getAllEntriesWithVaulters.mockResolvedValue(entries);

            await vaulterController.getArmNumbersEditPage(req, res, next);

            expect(getAllEntriesWithVaulters).toHaveBeenCalledTimes(1);
            const data = res.render.mock.calls[0][1];
            expect(data.vaulters.length).toBe(2);
            expect(data.vaulters.find(v => v._id === 'v-shared').ArmNr).toEqual([{ eventID: mockEventId, armNumber: 7 }]);
            expect(res.render).toHaveBeenCalledWith('vaulter/numberedit', expect.any(Object));
        });

        test('passes and clears messages', async () => {
            req.session.failMessage = 'f';
            req.session.successMessage = 's';
            getAllEntriesWithVaulters.mockResolvedValue([]);

            await vaulterController.getArmNumbersEditPage(req, res, next);

            const data = res.render.mock.calls[0][1];
            expect(data.failMessage).toBe('f');
            expect(data.successMessage).toBe('s');
            expect(req.session.failMessage).toBeNull();
            expect(req.session.successMessage).toBeNull();
        });
    });

    describe('updateArmNumber', () => {
        test('updates arm number and returns ok json', async () => {
            req.params.id = 'v1';
            req.body.armNumber = 77;
            updateVaulterArmNumber.mockResolvedValue(undefined);

            await vaulterController.updateArmNumber(req, res, next);

            expect(updateVaulterArmNumber).toHaveBeenCalledWith('v1', mockEventId, 77);
            expect(logOperation).toHaveBeenCalledWith(
                'VAULTER_UPDATE',
                'Vaulter updated: v1',
                mockUser.username,
                HTTP_STATUS.OK
            );
            expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
            expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.SUCCESS.ARM_NUMBER_UPDATED });
        });

        test('propagates arm number update errors', async () => {
            updateVaulterArmNumber.mockRejectedValue(new Error('arm update fail'));

            await expect(vaulterController.updateArmNumber(req, res, next)).rejects.toThrow('arm update fail');
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});

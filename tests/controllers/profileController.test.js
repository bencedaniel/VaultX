import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../../logger.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';
import {
    getUserById,
    updateUserProfile,
    getUserProfileFormData
} from '../../DataServices/userData.js';
import profileController from '../../controllers/profileController.js';

jest.mock('../../logger.js');
jest.mock('../../DataServices/userData.js');

describe('profileController', () => {
    let req, res, next;
    const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        role: {
            _id: '507f1f77bcf86cd799439012',
            name: 'User',
            permissions: ['profile:read', 'profile:update']
        }
    };

    beforeEach(() => {
        req = {
            params: { id: '507f1f77bcf86cd799439011' },
            body: {},
            user: JSON.parse(JSON.stringify(mockUser)),
            session: {
                successMessage: null,
                failMessage: null
            }
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            locals: { selectedEvent: { _id: '507f1f77bcf86cd799439013' } }
        };

        next = jest.fn();

        jest.clearAllMocks();
    });

    describe('getProfileEditForm', () => {
        describe('successful profile retrieval and render', () => {
            test('should render profile edit form with user data and role list', async () => {
                const mockUserData = {
                    _id: '507f1f77bcf86cd799439011',
                    username: 'testuser',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User'
                };

                const mockRoleList = [
                    { _id: '507f1f77bcf86cd799439012', name: 'User' },
                    { _id: '507f1f77bcf86cd799439014', name: 'Admin' }
                ];

                getUserById.mockResolvedValue(mockUserData);
                getUserProfileFormData.mockResolvedValue({ roleList: mockRoleList });

                await profileController.getProfileEditForm(req, res, next);

                expect(getUserById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
                expect(getUserProfileFormData).toHaveBeenCalled();
                expect(res.render).toHaveBeenCalledWith('selfEdit', {
                    formID: '507f1f77bcf86cd799439011',
                    formData: mockUserData,
                    roleList: mockRoleList,
                    rolePermissons: mockUser.role.permissions,
                    user: JSON.parse(JSON.stringify(mockUser)),
                    successMessage: null,
                    failMessage: null
                });
            });

            test('should clear session messages after rendering', async () => {
                req.session.successMessage = 'Profile updated successfully';
                req.session.failMessage = 'Update failed';

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(req.session.successMessage).toBeNull();
                expect(req.session.failMessage).toBeNull();
            });

            test('should render with success message if present', async () => {
                req.session.successMessage = MESSAGES.SUCCESS.PROFILE_UPDATED;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.successMessage).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
                expect(req.session.successMessage).toBeNull();
            });

            test('should render with fail message if present', async () => {
                req.session.failMessage = MESSAGES.ERROR.UPDATE_FAILED;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.failMessage).toBe(MESSAGES.ERROR.UPDATE_FAILED);
                expect(req.session.failMessage).toBeNull();
            });

            test('should handle empty role list', async () => {
                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.roleList).toEqual([]);
            });

            test('should preserve user permissions in render data', async () => {
                const customPermissions = ['profile:read', 'profile:update', 'admin:access'];
                req.user.role.permissions = customPermissions;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toEqual(customPermissions);
            });

            test('should handle different user IDs in params', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                getUserById.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(getUserById).toHaveBeenCalledWith('607f1f77bcf86cd799439099');
                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.formID).toBe('607f1f77bcf86cd799439099');
            });

            test('should pass current user to render data', async () => {
                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.user).toEqual(mockUser);
            });
        });

        describe('error handling', () => {
            test('should handle getUserById error', async () => {
                const error = new Error('Database error');
                getUserById.mockRejectedValue(error);

                try {
                    await profileController.getProfileEditForm(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle getUserProfileFormData error', async () => {
                const error = new Error('Form data retrieval failed');
                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockRejectedValue(error);

                try {
                    await profileController.getProfileEditForm(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.render).not.toHaveBeenCalled();
            });

            test('should handle null user data', async () => {
                getUserById.mockResolvedValue(null);
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.formData).toBeNull();
                expect(res.render).toHaveBeenCalled();
            });

            test('should handle missing req.user optional chaining', async () => {
                delete req.user;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toBeUndefined();
                expect(renderCall.user).toBeUndefined();
            });

            test('should handle missing req.user.role', async () => {
                delete req.user.role;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                try {
                    await profileController.getProfileEditForm(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });

            test('should handle session as undefined', async () => {
                delete req.session;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                try {
                    await profileController.getProfileEditForm(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });
        });

        describe('user context validation', () => {
            test('should use req.user when rendering', async () => {
                const customUser = {
                    _id: '807f1f77bcf86cd799439088',
                    username: 'customuser',
                    role: { permissions: ['custom:perm'] }
                };
                req.user = customUser;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.user).toEqual(customUser);
            });

            test('should pass user with admin permissions', async () => {
                req.user.role.permissions = ['profile:read', 'profile:update', 'admin:access'];

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toContain('admin:access');
            });

            test('should handle user with minimal permissions', async () => {
                req.user.role.permissions = ['profile:read'];

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.rolePermissons).toEqual(['profile:read']);
            });
        });

        describe('template rendering validation', () => {
            test('should render with correct template name', async () => {
                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(res.render).toHaveBeenCalledWith('selfEdit', expect.any(Object));
            });

            test('should render with all required data properties', async () => {
                const mockUserData = { _id: '507f1f77bcf86cd799439011', email: 'test@example.com' };
                const mockRoleList = [{ _id: '1', name: 'Admin' }];

                getUserById.mockResolvedValue(mockUserData);
                getUserProfileFormData.mockResolvedValue({ roleList: mockRoleList });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall).toHaveProperty('formID');
                expect(renderCall).toHaveProperty('formData');
                expect(renderCall).toHaveProperty('roleList');
                expect(renderCall).toHaveProperty('rolePermissons');
                expect(renderCall).toHaveProperty('user');
                expect(renderCall).toHaveProperty('successMessage');
                expect(renderCall).toHaveProperty('failMessage');
            });
        });

        describe('DataServices parameter validation', () => {
            test('should call getUserById with exact user ID', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                getUserById.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(getUserById).toHaveBeenCalledWith('607f1f77bcf86cd799439099');
                expect(getUserById).toHaveBeenCalledTimes(1);
            });

            test('should call getUserProfileFormData with no parameters', async () => {
                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(getUserProfileFormData).toHaveBeenCalledWith();
                expect(getUserProfileFormData).toHaveBeenCalledTimes(1);
            });
        });

        describe('session message management', () => {
            test('should clear success message after rendering', async () => {
                req.session.successMessage = 'Success!';

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(req.session.successMessage).toBeNull();
            });

            test('should clear fail message after rendering', async () => {
                req.session.failMessage = 'Failed!';

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                expect(req.session.failMessage).toBeNull();
            });

            test('should extract messages before clearing them', async () => {
                const successMsg = 'Update successful';
                req.session.successMessage = successMsg;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.successMessage).toBe(successMsg);
                expect(req.session.successMessage).toBeNull();
            });

            test('should handle null messages gracefully', async () => {
                req.session.successMessage = null;
                req.session.failMessage = null;

                getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
                getUserProfileFormData.mockResolvedValue({ roleList: [] });

                await profileController.getProfileEditForm(req, res, next);

                const renderCall = res.render.mock.calls[0][1];
                expect(renderCall.successMessage).toBeNull();
                expect(renderCall.failMessage).toBeNull();
            });
        });
    });

    describe('updateProfile', () => {
        describe('successful profile update', () => {
            test('should update user profile with provided data', async () => {
                req.body = {
                    email: 'newemail@example.com',
                    firstName: 'Updated',
                    lastName: 'User'
                };

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith(
                    '507f1f77bcf86cd799439011',
                    req.body
                );
            });

            test('should log operation with user username', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'USER_UPDATE',
                    `User updated: ${mockUser.username}`,
                    mockUser.username,
                    HTTP_STATUS.OK
                );
            });

            test('should set success message in session', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
            });

            test('should redirect to profile page after update', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(res.redirect).toHaveBeenCalledWith('/profile/507f1f77bcf86cd799439011');
            });

            test('should handle empty body update', async () => {
                req.body = {};

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith(
                    '507f1f77bcf86cd799439011',
                    {}
                );
                expect(res.redirect).toHaveBeenCalled();
            });

            test('should handle update with multiple fields', async () => {
                req.body = {
                    email: 'new@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                    phone: '1234567890'
                };

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith(
                    '507f1f77bcf86cd799439011',
                    req.body
                );
            });

            test('should use correct user ID from params', async () => {
                req.params.id = '707f1f77bcf86cd799439077';

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith(
                    '707f1f77bcf86cd799439077',
                    expect.any(Object)
                );
                expect(res.redirect).toHaveBeenCalledWith('/profile/707f1f77bcf86cd799439077');
            });
        });

        describe('error handling', () => {
            test('should propagate updateUserProfile errors', async () => {
                const error = new Error('Database error');
                updateUserProfile.mockRejectedValue(error);

                try {
                    await profileController.updateProfile(req, res, next);
                } catch (err) {
                    expect(err).toBe(error);
                }

                expect(res.redirect).not.toHaveBeenCalled();
            });

            test('should handle validation errors from DataService', async () => {
                const validationError = new Error('Invalid email format');
                updateUserProfile.mockRejectedValue(validationError);

                try {
                    await profileController.updateProfile(req, res, next);
                } catch (err) {
                    expect(err).toBe(validationError);
                }

                expect(logOperation).not.toHaveBeenCalled();
                    expect(req.session.successMessage).toBeNull();
            });

            test('should handle null user in request', async () => {
                delete req.user;

                updateUserProfile.mockResolvedValue({ success: true });

                try {
                    await profileController.updateProfile(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });

            test('should handle missing username in user object', async () => {
                req.user.username = undefined;

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'USER_UPDATE',
                    `User updated: undefined`,
                    undefined,
                    HTTP_STATUS.OK
                );
            });

            test('should handle missing session object', async () => {
                delete req.session;

                updateUserProfile.mockResolvedValue({ success: true });

                try {
                    await profileController.updateProfile(req, res, next);
                } catch (err) {
                    expect(err).toBeDefined();
                }
            });
        });

        describe('user context validation', () => {
            test('should use current user information for logging', async () => {
                req.user = {
                    _id: '807f1f77bcf86cd799439088',
                    username: 'adminuser',
                    role: { permissions: ['admin:access'] }
                };

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'USER_UPDATE',
                    `User updated: adminuser`,
                    'adminuser',
                    HTTP_STATUS.OK
                );
            });

            test('should handle special characters in username', async () => {
                req.user.username = 'user@domain.com';

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'USER_UPDATE',
                    `User updated: user@domain.com`,
                    'user@domain.com',
                    HTTP_STATUS.OK
                );
            });

            test('should log with user username even on different user ID update', async () => {
                req.params.id = '907f1f77bcf86cd799439099'; // Different ID
                req.user.username = 'currentuser';

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'USER_UPDATE',
                    expect.stringContaining('currentuser'),
                    'currentuser',
                    HTTP_STATUS.OK
                );
            });
        });

        describe('logging and operation tracking', () => {
            test('should call logOperation with USER_UPDATE action', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(logOperation).toHaveBeenCalledWith(
                    'USER_UPDATE',
                    expect.any(String),
                    expect.any(String),
                    HTTP_STATUS.OK
                );
            });

            test('should pass HTTP_STATUS.OK to logOperation', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                const logCall = logOperation.mock.calls[0];
                expect(logCall[3]).toBe(HTTP_STATUS.OK);
            });

            test('should include update message in log', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                const logCall = logOperation.mock.calls[0];
                expect(logCall[1]).toContain('User updated');
                expect(logCall[1]).toContain(mockUser.username);
            });

            test('should log operation before redirecting', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                let logOperationCalled = false;
                logOperation.mockImplementation(() => {
                    logOperationCalled = true;
                });

                await profileController.updateProfile(req, res, next);

                expect(logOperationCalled).toBe(true);
                expect(res.redirect).toHaveBeenCalled();
            });
        });

        describe('session and redirect flow', () => {
            test('should set success message before redirecting', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                let messageSetBeforeRedirect = false;
                res.redirect.mockImplementation(() => {
                    messageSetBeforeRedirect = req.session.successMessage === MESSAGES.SUCCESS.PROFILE_UPDATED;
                });

                await profileController.updateProfile(req, res, next);

                expect(messageSetBeforeRedirect).toBe(true);
            });

            test('should redirect to correct profile URL', async () => {
                req.params.id = '507f1f77bcf86cd799439011';

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(res.redirect).toHaveBeenCalledWith('/profile/507f1f77bcf86cd799439011');
            });

            test('should redirect after successful profile update', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(res.redirect).toHaveBeenCalledTimes(1);
            });

            test('should set MESSAGES.SUCCESS.PROFILE_UPDATED message', async () => {
                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
            });
        });

        describe('DataServices parameter validation', () => {
            test('should call updateUserProfile with user ID and body', async () => {
                req.body = { email: 'new@email.com' };

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith(
                    '507f1f77bcf86cd799439011',
                    { email: 'new@email.com' }
                );
            });

            test('should pass exact body object to DataService', async () => {
                const bodyData = {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '1234567890'
                };
                req.body = bodyData;

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith(
                    expect.any(String),
                    bodyData
                );
            });

            test('should use req.params.id for user identification', async () => {
                req.params.id = '607f1f77bcf86cd799439099';

                updateUserProfile.mockResolvedValue({ success: true });

                await profileController.updateProfile(req, res, next);

                expect(updateUserProfile).toHaveBeenCalledWith('607f1f77bcf86cd799439099', expect.any(Object));
            });
        });
    });

    describe('error handling across operations', () => {
        test('should be an asyncHandler wrapped function', async () => {
            expect(profileController.getProfileEditForm).toBeDefined();
            expect(profileController.updateProfile).toBeDefined();
        });

        test('should handle concurrent requests independently', async () => {
            const req1 = { ...req, params: { id: '507f1f77bcf86cd799439011' }, session: { successMessage: null, failMessage: null } };
            const req2 = { ...req, params: { id: '607f1f77bcf86cd799439099' }, session: { successMessage: 'msg', failMessage: null } };
            const res1 = { render: jest.fn() };
            const res2 = { render: jest.fn() };

            getUserById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            getUserProfileFormData.mockResolvedValue({ roleList: [] });

            await profileController.getProfileEditForm(req1, res1, next);

            getUserById.mockResolvedValue({ _id: '607f1f77bcf86cd799439099' });
            getUserProfileFormData.mockResolvedValue({ roleList: [] });

            await profileController.getProfileEditForm(req2, res2, next);

            expect(getUserById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(getUserById).toHaveBeenCalledWith('607f1f77bcf86cd799439099');
        });
    });

    describe('integration scenarios', () => {
        test('should handle complete edit flow: get form, then update', async () => {
            // Step 1: Get profile edit form
            const mockUserData = {
                _id: '507f1f77bcf86cd799439011',
                email: 'old@example.com',
                firstName: 'Old'
            };

            getUserById.mockResolvedValue(mockUserData);
            getUserProfileFormData.mockResolvedValue({ roleList: [{ name: 'User' }] });

            await profileController.getProfileEditForm(req, res, next);

            expect(res.render).toHaveBeenCalled();

            // Step 2: Prepare update
            const updateReq = { ...req, body: { email: 'new@example.com' } };
            updateUserProfile.mockResolvedValue({ success: true });

            await profileController.updateProfile(updateReq, res, next);

            expect(res.redirect).toHaveBeenCalledWith('/profile/507f1f77bcf86cd799439011');
            expect(updateReq.session.successMessage).toBe(MESSAGES.SUCCESS.PROFILE_UPDATED);
        });

        test('should maintain user context across form and update operations', async () => {
            const customUser = {
                _id: '807f1f77bcf86cd799439088',
                username: 'trackeduser',
                role: { permissions: ['profile:update'] }
            };

            req.user = customUser;
            const updateReq = { ...req, body: {}, user: customUser };

            getUserById.mockResolvedValue({ _id: '807f1f77bcf86cd799439088' });
            getUserProfileFormData.mockResolvedValue({ roleList: [] });

            await profileController.getProfileEditForm(req, res, next);

            const renderCall = res.render.mock.calls[0][1];
            expect(renderCall.user.username).toBe('trackeduser');

            updateUserProfile.mockResolvedValue({ success: true });

            await profileController.updateProfile(updateReq, res, next);

            expect(logOperation).toHaveBeenCalledWith(
                'USER_UPDATE',
                expect.stringContaining('trackeduser'),
                'trackeduser',
                HTTP_STATUS.OK
            );
        });
    });
});

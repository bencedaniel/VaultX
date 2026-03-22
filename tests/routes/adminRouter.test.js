import express from 'express';

const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockAuthRegister = jest.fn();

const mockAdminDashboardController = {
  getAdminDashboard: jest.fn()
};

const mockAdminUserController = {
  getNewUserForm: jest.fn(),
  getUsersDashboard: jest.fn(),
  getEditUserForm: jest.fn(),
  updateUserHandler: jest.fn(),
  deleteUserHandler: jest.fn()
};

const mockAdminRoleController = {
  getRolesDashboard: jest.fn(),
  getNewRoleForm: jest.fn(),
  createNewRoleHandler: jest.fn(),
  getEditRoleForm: jest.fn(),
  updateRoleHandler: jest.fn(),
  deleteRoleHandler: jest.fn()
};

const mockAdminPermissionController = {
  getPermissionsDashboard: jest.fn(),
  getNewPermissionForm: jest.fn(),
  createNewPermissionHandler: jest.fn(),
  getEditPermissionForm: jest.fn(),
  updatePermissionHandler: jest.fn(),
  deletePermissionHandler: jest.fn()
};

const mockAdminCardController = {
  getNewCardForm: jest.fn(),
  getCardsDashboard: jest.fn(),
  getEditCardForm: jest.fn(),
  createNewCardHandler: jest.fn(),
  updateCardHandler: jest.fn(),
  deleteCardHandler: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/auth.js', () => ({
  __esModule: true,
  default: {
    Register: mockAuthRegister
  }
}));

jest.mock('../../controllers/adminDashboardController.js', () => ({
  __esModule: true,
  default: mockAdminDashboardController
}));

jest.mock('../../controllers/adminUserController.js', () => ({
  __esModule: true,
  default: mockAdminUserController
}));

jest.mock('../../controllers/adminRoleController.js', () => ({
  __esModule: true,
  default: mockAdminRoleController
}));

jest.mock('../../controllers/adminPermissionController.js', () => ({
  __esModule: true,
  default: mockAdminPermissionController
}));

jest.mock('../../controllers/adminCardController.js', () => ({
  __esModule: true,
  default: mockAdminCardController
}));

let adminRouter;

describe('routes/adminRouter', () => {
  beforeAll(async () => {
    ({ default: adminRouter } = await import('../../routes/adminRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    adminRouter.stack.find(
      layer =>
        layer.route &&
        layer.route.path === path &&
        layer.route.methods[method.toLowerCase()]
    );

  const expectRouteHandlers = (path, method, handlers) => {
    const layer = getRouteLayer(path, method);
    expect(layer).toBeDefined();

    const actual = layer.route.stack.map(s => s.handle);
    expect(actual).toEqual(handlers);
  };

  test('exports an express router instance', () => {
    expect(typeof adminRouter).toBe('function');
    expect(adminRouter).toBeInstanceOf(Function);
    expect(adminRouter.stack).toBeDefined();
    expect(Array.isArray(adminRouter.stack)).toBe(true);
  });

  test('registers all expected admin routes with correct middleware order', () => {
    const specs = [
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminDashboardController.getAdminDashboard]],

      ['/newUser', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminUserController.getNewUserForm]],
      ['/newUser', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockAuthRegister]],
      ['/dashboard/users', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminUserController.getUsersDashboard]],
      ['/editUser/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminUserController.getEditUserForm]],
      ['/editUser/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminUserController.updateUserHandler]],
      ['/deleteUser/:userId', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminUserController.deleteUserHandler]],

      ['/dashboard/roles', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminRoleController.getRolesDashboard]],
      ['/newRole', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminRoleController.getNewRoleForm]],
      ['/newRole', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminRoleController.createNewRoleHandler]],
      ['/editRole/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminRoleController.getEditRoleForm]],
      ['/editRole/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminRoleController.updateRoleHandler]],
      ['/deleteRole/:roleId', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminRoleController.deleteRoleHandler]],

      ['/dashboard/permissions', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminPermissionController.getPermissionsDashboard]],
      ['/newPermission', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminPermissionController.getNewPermissionForm]],
      ['/newPermission', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminPermissionController.createNewPermissionHandler]],
      ['/editPermission/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminPermissionController.getEditPermissionForm]],
      ['/editPermission/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminPermissionController.updatePermissionHandler]],
      ['/deletePermission/:permId', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminPermissionController.deletePermissionHandler]],

      ['/newCard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminCardController.getNewCardForm]],
      ['/dashboard/cards', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminCardController.getCardsDashboard]],
      ['/editCard/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminCardController.getEditCardForm]],
      ['/newCard', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminCardController.createNewCardHandler]],
      ['/editCard/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminCardController.updateCardHandler]],
      ['/deleteCard/:cardId', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAdminCardController.deleteCardHandler]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 25 route definitions', () => {
    const routeLayers = adminRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(25);
  });
});

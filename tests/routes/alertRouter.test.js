const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);

const mockAlertController = {
  getNewAlertForm: jest.fn(),
  createNewAlertHandler: jest.fn(),
  getAlertsDashboard: jest.fn(),
  getEditAlertForm: jest.fn(),
  updateAlertHandler: jest.fn(),
  deleteAlertHandler: jest.fn(),
  checkEventAlertsHandler: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../controllers/alertController.js', () => ({
  __esModule: true,
  default: mockAlertController
}));

let alertRouter;

describe('routes/alertRouter', () => {
  beforeAll(async () => {
    ({ default: alertRouter } = await import('../../routes/alertRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    alertRouter.stack.find(
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
    expect(typeof alertRouter).toBe('function');
    expect(alertRouter).toBeInstanceOf(Function);
    expect(Array.isArray(alertRouter.stack)).toBe(true);
  });

  test('registers all expected alert routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.getNewAlertForm]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.createNewAlertHandler]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.getAlertsDashboard]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.getEditAlertForm]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.updateAlertHandler]],
      ['/delete/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.deleteAlertHandler]],
      ['/checkEvent/', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockAlertController.checkEventAlertsHandler]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 7 route definitions', () => {
    const routeLayers = alertRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(7);
  });
});

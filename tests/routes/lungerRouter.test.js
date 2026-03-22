const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockLungerController = {
  renderNew: jest.fn(),
  createNew: jest.fn(),
  dashboard: jest.fn(),
  details: jest.fn(),
  editGet: jest.fn(),
  editPost: jest.fn(),
  deleteIncident: jest.fn(),
  newIncidentPost: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/lungerController.js', () => ({
  __esModule: true,
  default: mockLungerController
}));

let lungerRouter;

describe('routes/lungerRouter', () => {
  beforeAll(async () => {
    ({ default: lungerRouter } = await import('../../routes/lungerRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    lungerRouter.stack.find(
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
    expect(typeof lungerRouter).toBe('function');
    expect(lungerRouter).toBeInstanceOf(Function);
    expect(Array.isArray(lungerRouter.stack)).toBe(true);
  });

  test('registers all expected lunger routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.renderNew]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.createNew]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.dashboard]],
      ['/details/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.details]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.editGet]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockLungerController.editPost]],
      ['/deleteIncident/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.deleteIncident]],
      ['/newIncident/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockLungerController.newIncidentPost]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 8 route definitions', () => {
    const routeLayers = lungerRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(8);
  });
});

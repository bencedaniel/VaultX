const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockEventController = {
  renderNew: jest.fn(),
  createNew: jest.fn(),
  dashboard: jest.fn(),
  editGet: jest.fn(),
  editPost: jest.fn(),
  details: jest.fn(),
  deleteResponsiblePersonHandler: jest.fn(),
  addResponsiblePersonHandler: jest.fn(),
  selectEventHandler: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/eventController.js', () => ({
  __esModule: true,
  default: mockEventController
}));

let eventRouter;

describe('routes/eventRouter', () => {
  beforeAll(async () => {
    ({ default: eventRouter } = await import('../../routes/eventRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    eventRouter.stack.find(
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
    expect(typeof eventRouter).toBe('function');
    expect(eventRouter).toBeInstanceOf(Function);
    expect(Array.isArray(eventRouter.stack)).toBe(true);
  });

  test('registers all expected event routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.renderNew]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.createNew]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.dashboard]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.editGet]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockEventController.editPost]],
      ['/details/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.details]],
      ['/deleteResponsiblePerson/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.deleteResponsiblePersonHandler]],
      ['/addResponsiblePerson/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.addResponsiblePersonHandler]],
      ['/selectEvent/:eventId', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEventController.selectEventHandler]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 9 route definitions', () => {
    const routeLayers = eventRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(9);
  });
});

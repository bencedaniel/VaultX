const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockEntryController = {
  renderNew: jest.fn(),
  createNew: jest.fn(),
  dashboard: jest.fn(),
  editGet: jest.fn(),
  editPost: jest.fn(),
  deleteIncident: jest.fn(),
  newIncidentPost: jest.fn(),
  vetCheckGet: jest.fn(),
  updateVetStatus: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/entryController.js', () => ({
  __esModule: true,
  default: mockEntryController
}));

let entryRouter;

describe('routes/entryRouter', () => {
  beforeAll(async () => {
    ({ default: entryRouter } = await import('../../routes/entryRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    entryRouter.stack.find(
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
    expect(typeof entryRouter).toBe('function');
    expect(entryRouter).toBeInstanceOf(Function);
    expect(Array.isArray(entryRouter.stack)).toBe(true);
  });

  test('registers all expected entry routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.renderNew]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.createNew]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.dashboard]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.editGet]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockEntryController.editPost]],
      ['/deleteIncident/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.deleteIncident]],
      ['/newIncident/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.newIncidentPost]],
      ['/vetCheck', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.vetCheckGet]],
      ['/updateVetStatus/:horseId', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockEntryController.updateVetStatus]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('does not register commented-out delete route', () => {
    const deleteLayer = getRouteLayer('/delete/:id', 'delete');
    expect(deleteLayer).toBeUndefined();
  });

  test('contains exactly 9 route definitions', () => {
    const routeLayers = entryRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(9);
  });
});

const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockMappingController = {
  renderNew: jest.fn(),
  createNew: jest.fn(),
  dashboard: jest.fn(),
  editGet: jest.fn(),
  editPost: jest.fn(),
  delete: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/mappingController.js', () => ({
  __esModule: true,
  default: mockMappingController
}));

let mappingRouter;

describe('routes/mappingRouter', () => {
  beforeAll(async () => {
    ({ default: mappingRouter } = await import('../../routes/mappingRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    mappingRouter.stack.find(
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
    expect(typeof mappingRouter).toBe('function');
    expect(mappingRouter).toBeInstanceOf(Function);
    expect(Array.isArray(mappingRouter.stack)).toBe(true);
  });

  test('registers all expected mapping routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockMappingController.renderNew]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockMappingController.createNew]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockMappingController.dashboard]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockMappingController.editGet]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockMappingController.editPost]],
      ['/delete/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockMappingController.delete]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 6 route definitions', () => {
    const routeLayers = mappingRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(6);
  });
});

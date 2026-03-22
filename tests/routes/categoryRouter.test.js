const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockCategoryController = {
  getNewCategoryForm: jest.fn(),
  createNewCategoryHandler: jest.fn(),
  getCategoriesDashboard: jest.fn(),
  getEditCategoryForm: jest.fn(),
  updateCategoryHandler: jest.fn(),
  deleteCategoryHandler: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/categoryController.js', () => ({
  __esModule: true,
  default: mockCategoryController
}));

let categoryRouter;

describe('routes/categoryRouter', () => {
  beforeAll(async () => {
    ({ default: categoryRouter } = await import('../../routes/categoryRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    categoryRouter.stack.find(
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
    expect(typeof categoryRouter).toBe('function');
    expect(categoryRouter).toBeInstanceOf(Function);
    expect(Array.isArray(categoryRouter.stack)).toBe(true);
  });

  test('registers all expected category routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockCategoryController.getNewCategoryForm]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockCategoryController.createNewCategoryHandler]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockCategoryController.getCategoriesDashboard]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockCategoryController.getEditCategoryForm]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockCategoryController.updateCategoryHandler]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('does not register delete route because it is commented out', () => {
    const deleteLayer = getRouteLayer('/delete/:id', 'delete');
    expect(deleteLayer).toBeUndefined();
  });

  test('contains exactly 5 route definitions', () => {
    const routeLayers = categoryRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(5);
  });
});

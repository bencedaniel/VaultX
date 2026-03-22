const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockDailyTimeTableController = {
  renderNew: jest.fn(),
  createNew: jest.fn(),
  dashboard: jest.fn(),
  details: jest.fn(),
  editGet: jest.fn(),
  editPost: jest.fn(),
  delete: jest.fn(),
  dayparts: jest.fn(),
  deleteTTelement: jest.fn(),
  editTTelementGet: jest.fn(),
  editTTelementPost: jest.fn(),
  saveTTelement: jest.fn(),
  newTTelementGetById: jest.fn(),
  newTTelementGet: jest.fn(),
  newTTelementPost: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/dailyTimetableController.js', () => ({
  __esModule: true,
  default: mockDailyTimeTableController
}));

let dailytimetableRouter;

describe('routes/DtimetableRouter', () => {
  beforeAll(async () => {
    ({ default: dailytimetableRouter } = await import('../../routes/DtimetableRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    dailytimetableRouter.stack.find(
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
    expect(typeof dailytimetableRouter).toBe('function');
    expect(dailytimetableRouter).toBeInstanceOf(Function);
    expect(Array.isArray(dailytimetableRouter.stack)).toBe(true);
  });

  test('registers all expected routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.renderNew]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockDailyTimeTableController.createNew]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.dashboard]],
      ['/details/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.details]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.editGet]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockDailyTimeTableController.editPost]],
      ['/delete/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.delete]],
      ['/dayparts/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.dayparts]],
      ['/deleteTTelement/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.deleteTTelement]],
      ['/editTTelement/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.editTTelementGet]],
      ['/editTTelement/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockDailyTimeTableController.editTTelementPost]],
      ['/saveTTelement/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.saveTTelement]],
      ['/newTTelement/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.newTTelementGetById]],
      ['/newTTelement', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockDailyTimeTableController.newTTelementGet]],
      ['/newTTelement', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockDailyTimeTableController.newTTelementPost]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 15 route definitions', () => {
    const routeLayers = dailytimetableRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(15);
  });
});

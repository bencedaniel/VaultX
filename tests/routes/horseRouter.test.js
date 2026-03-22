const mockVerifyMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRoleFactory = jest.fn(() => mockVerifyRoleMiddleware);
const mockValidateMiddleware = jest.fn((req, res, next) => next());

const mockHorseController = {
  renderNew: jest.fn(),
  createNew: jest.fn(),
  dashboard: jest.fn(),
  details: jest.fn(),
  editGet: jest.fn(),
  editPost: jest.fn(),
  deleteNote: jest.fn(),
  newNotePost: jest.fn(),
  numbersGet: jest.fn(),
  updateNums: jest.fn()
};

jest.mock('../../middleware/Verify.js', () => ({
  Verify: mockVerifyMiddleware,
  VerifyRole: mockVerifyRoleFactory
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: mockValidateMiddleware
}));

jest.mock('../../controllers/horseController.js', () => ({
  __esModule: true,
  default: mockHorseController
}));

let horseRouter;

describe('routes/horseRouter', () => {
  beforeAll(async () => {
    ({ default: horseRouter } = await import('../../routes/horseRouter.js'));
  });

  const getRouteLayer = (path, method) =>
    horseRouter.stack.find(
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
    expect(typeof horseRouter).toBe('function');
    expect(horseRouter).toBeInstanceOf(Function);
    expect(Array.isArray(horseRouter.stack)).toBe(true);
  });

  test('registers all expected horse routes with correct middleware order', () => {
    const specs = [
      ['/new', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.renderNew]],
      ['/new', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockHorseController.createNew]],
      ['/dashboard', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.dashboard]],
      ['/details/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.details]],
      ['/edit/:id', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.editGet]],
      ['/edit/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockValidateMiddleware, mockHorseController.editPost]],
      ['/deleteNote/:id', 'delete', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.deleteNote]],
      ['/newNote/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.newNotePost]],
      ['/numbers', 'get', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.numbersGet]],
      ['/updatenums/:id', 'post', [mockVerifyMiddleware, mockVerifyRoleMiddleware, mockHorseController.updateNums]]
    ];

    specs.forEach(([path, method, handlers]) => {
      expectRouteHandlers(path, method, handlers);
    });
  });

  test('contains exactly 10 route definitions', () => {
    const routeLayers = horseRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(10);
  });
});

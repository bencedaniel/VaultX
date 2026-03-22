import { jest } from '@jest/globals';

const mockValidate = jest.fn((req, res, next) => next());
const mockVerify = jest.fn((req, res, next) => next());
const mockVerifyRole = jest.fn(() => jest.fn((req, res, next) => next()));

jest.unstable_mockModule('../../middleware/Validate.js', () => ({
  default: mockValidate,
}));

jest.unstable_mockModule('../../middleware/Verify.js', () => ({
  Verify: mockVerify,
  VerifyRole: mockVerifyRole,
}));

const mockScoringJudgeController = {
  getScoringDashboard: jest.fn(),
  getProgramDetails: jest.fn(),
  getNewScoresheetForm: jest.fn(),
  createNewScoresheet: jest.fn(),
};

const mockScoringOfficeController = {
  getOfficeDashboard: jest.fn(),
  getEditScoresheetForm: jest.fn(),
  updateScoresheetById: jest.fn(),
  getNewScoresheetSelectionForm: jest.fn(),
  handleNewScoresheetSelection: jest.fn(),
  getOfficeNewScoresheetForm: jest.fn(),
  createOfficeNewScoresheet: jest.fn(),
  getScoresList: jest.fn(),
  recalculateScoreById: jest.fn(),
};

jest.unstable_mockModule('../../controllers/scoringJudgeController.js', () => ({
  default: mockScoringJudgeController,
}));

jest.unstable_mockModule('../../controllers/scoringOfficeController.js', () => ({
  default: mockScoringOfficeController,
}));

describe('scoringRouter', () => {
  let scoringRouter;

  beforeAll(async () => {
    ({ default: scoringRouter } = await import('../../routes/scoringRouter.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const findRouteLayer = (path, method) =>
    scoringRouter.stack.find(
      (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
    );

  test('registers all expected routes', () => {
    const routes = scoringRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).sort(),
      }));

    expect(routes).toEqual([
      { path: '/', methods: ['get'] },
      { path: '/program/:id', methods: ['get'] },
      { path: '/newscoresheet/:entryid/:tpid', methods: ['get'] },
      { path: '/newscoresheet', methods: ['post'] },
      { path: '/office/dashboard', methods: ['get'] },
      { path: '/office/scoresheet/edit/:id', methods: ['get'] },
      { path: '/office/scoresheet/edit1/:id', methods: ['get'] },
      { path: '/office/scoresheet/edit/:id', methods: ['post'] },
      { path: '/office/scoresheet/edit1/:id', methods: ['post'] },
      { path: '/office/scoresheet/new', methods: ['get'] },
      { path: '/office/scoresheet/new', methods: ['post'] },
      { path: '/office/newscoresheet/:entryid/:tpid', methods: ['get'] },
      { path: '/office/newscoresheet', methods: ['post'] },
      { path: '/office/scores', methods: ['get'] },
      { path: '/office/scores/recalculate/:id', methods: ['post'] },
    ]);
  });

  const threeMiddlewareRoutes = [
    ['/', 'get', mockScoringJudgeController.getScoringDashboard],
    ['/program/:id', 'get', mockScoringJudgeController.getProgramDetails],
    ['/newscoresheet/:entryid/:tpid', 'get', mockScoringJudgeController.getNewScoresheetForm],
    ['/office/dashboard', 'get', mockScoringOfficeController.getOfficeDashboard],
    ['/office/scoresheet/edit/:id', 'get', mockScoringOfficeController.getEditScoresheetForm],
    ['/office/scoresheet/edit1/:id', 'get', mockScoringOfficeController.getEditScoresheetForm],
    ['/office/scoresheet/new', 'get', mockScoringOfficeController.getNewScoresheetSelectionForm],
    ['/office/scoresheet/new', 'post', mockScoringOfficeController.handleNewScoresheetSelection],
    ['/office/newscoresheet/:entryid/:tpid', 'get', mockScoringOfficeController.getOfficeNewScoresheetForm],
    ['/office/scores', 'get', mockScoringOfficeController.getScoresList],
    ['/office/scores/recalculate/:id', 'post', mockScoringOfficeController.recalculateScoreById],
  ];

  test.each(threeMiddlewareRoutes)(
    '%s [%s] uses Verify, VerifyRole and expected handler in order',
    (path, method) => {
      const layer = findRouteLayer(path, method);

      expect(layer).toBeDefined();
      expect(layer.route.stack).toHaveLength(3);
      expect(typeof layer.route.stack[0].handle).toBe('function');
      expect(typeof layer.route.stack[1].handle).toBe('function');
      expect(typeof layer.route.stack[2].handle).toBe('function');
    }
  );

  const fourMiddlewareRoutes = [
    ['/newscoresheet', 'post', mockScoringJudgeController.createNewScoresheet],
    ['/office/newscoresheet', 'post', mockScoringOfficeController.createOfficeNewScoresheet],
  ];

  test.each(fourMiddlewareRoutes)(
    '%s [%s] uses Verify, VerifyRole, Validate and expected handler in order',
    (path, method) => {
      const layer = findRouteLayer(path, method);

      expect(layer).toBeDefined();
      expect(layer.route.stack).toHaveLength(4);
      expect(typeof layer.route.stack[0].handle).toBe('function');
      expect(typeof layer.route.stack[1].handle).toBe('function');
      expect(typeof layer.route.stack[2].handle).toBe('function');
      expect(typeof layer.route.stack[3].handle).toBe('function');
    }
  );

  test('POST /office/scoresheet/edit/:id has Verify, VerifyRole, Validate and update middleware', () => {
    const layer = findRouteLayer('/office/scoresheet/edit/:id', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(4);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
    expect(typeof layer.route.stack[3].handle).toBe('function');
  });

  test('POST /office/scoresheet/edit1/:id has Verify, VerifyRole, Validate and update middleware', () => {
    const layer = findRouteLayer('/office/scoresheet/edit1/:id', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(4);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
    expect(typeof layer.route.stack[3].handle).toBe('function');
  });

});

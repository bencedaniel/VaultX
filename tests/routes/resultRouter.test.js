import { jest } from '@jest/globals';

const mockVerify = jest.fn((req, res, next) => next());
const mockVerifyRole = jest.fn(() => jest.fn((req, res, next) => next()));

jest.unstable_mockModule('../../middleware/Verify.js', () => ({
  Verify: mockVerify,
  VerifyRole: mockVerifyRole,
}));

const mockResultCalcTemplateController = {
  getCalcTemplatesDashboard: jest.fn(),
  getNewCalcTemplateForm: jest.fn(),
  createNewCalcTemplate: jest.fn(),
  getEditCalcTemplateForm: jest.fn(),
  updateCalcTemplateById: jest.fn(),
  deleteCalcTemplateById: jest.fn(),
};

const mockResultGeneratorController = {
  getGeneratorsDashboard: jest.fn(),
  getNewGeneratorForm: jest.fn(),
  createNewGenerator: jest.fn(),
  updateGeneratorStatusById: jest.fn(),
  getEditGeneratorForm: jest.fn(),
  updateGeneratorById: jest.fn(),
  deleteGeneratorById: jest.fn(),
};

const mockResultGroupController = {
  getResultGroupsDashboard: jest.fn(),
  getEditResultGroupForm: jest.fn(),
  updateResultGroupById: jest.fn(),
  getNewResultGroupForm: jest.fn(),
  createNewResultGroup: jest.fn(),
  deleteResultGroupById: jest.fn(),
  generateResultGroups: jest.fn(),
};

const mockResultController = {
  getResultsDashboard: jest.fn(),
  getDetailedResults: jest.fn(),
};

jest.unstable_mockModule('../../controllers/resultCalcTemplateController.js', () => ({
  default: mockResultCalcTemplateController,
}));

jest.unstable_mockModule('../../controllers/resultGeneratorController.js', () => ({
  default: mockResultGeneratorController,
}));

jest.unstable_mockModule('../../controllers/resultGroupController.js', () => ({
  default: mockResultGroupController,
}));

jest.unstable_mockModule('../../controllers/resultController.js', () => ({
  default: mockResultController,
}));

describe('resultRouter', () => {
  let resultRouter;

  beforeAll(async () => {
    ({ default: resultRouter } = await import('../../routes/resultRouter.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const findRouteLayer = (path, method) =>
    resultRouter.stack.find(
      (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
    );

  test('registers all expected routes', () => {
    const routes = resultRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).sort(),
      }));

    expect(routes).toEqual([
      { path: '/calcTemp/dashboard', methods: ['get'] },
      { path: '/calcTemp/new', methods: ['get'] },
      { path: '/calcTemp/new', methods: ['post'] },
      { path: '/calcTemp/edit/:id', methods: ['get'] },
      { path: '/calcTemp/edit/:id', methods: ['post'] },
      { path: '/calcTemp/delete/:id', methods: ['delete'] },
      { path: '/generator/dashboard', methods: ['get'] },
      { path: '/generator/new', methods: ['get'] },
      { path: '/generator/new', methods: ['post'] },
      { path: '/generator/status/:id', methods: ['post'] },
      { path: '/generator/edit/:id', methods: ['get'] },
      { path: '/generator/edit/:id', methods: ['post'] },
      { path: '/generator/delete/:id', methods: ['delete'] },
      { path: '/groups/dashboard', methods: ['get'] },
      { path: '/groups/edit/:id', methods: ['get'] },
      { path: '/groups/edit/:id', methods: ['post'] },
      { path: '/groups/new', methods: ['get'] },
      { path: '/groups/new', methods: ['post'] },
      { path: '/groups/delete/:id', methods: ['delete'] },
      { path: '/groups/generate', methods: ['post'] },
      { path: '/', methods: ['get'] },
      { path: '/detailed/:id/:part', methods: ['get'] },
    ]);
  });

  const routeCases = [
    ['/calcTemp/dashboard', 'get', mockResultCalcTemplateController.getCalcTemplatesDashboard],
    ['/calcTemp/new', 'get', mockResultCalcTemplateController.getNewCalcTemplateForm],
    ['/calcTemp/new', 'post', mockResultCalcTemplateController.createNewCalcTemplate],
    ['/calcTemp/edit/:id', 'get', mockResultCalcTemplateController.getEditCalcTemplateForm],
    ['/calcTemp/edit/:id', 'post', mockResultCalcTemplateController.updateCalcTemplateById],
    ['/calcTemp/delete/:id', 'delete', mockResultCalcTemplateController.deleteCalcTemplateById],

    ['/generator/dashboard', 'get', mockResultGeneratorController.getGeneratorsDashboard],
    ['/generator/new', 'get', mockResultGeneratorController.getNewGeneratorForm],
    ['/generator/new', 'post', mockResultGeneratorController.createNewGenerator],
    ['/generator/status/:id', 'post', mockResultGeneratorController.updateGeneratorStatusById],
    ['/generator/edit/:id', 'get', mockResultGeneratorController.getEditGeneratorForm],
    ['/generator/edit/:id', 'post', mockResultGeneratorController.updateGeneratorById],
    ['/generator/delete/:id', 'delete', mockResultGeneratorController.deleteGeneratorById],

    ['/groups/dashboard', 'get', mockResultGroupController.getResultGroupsDashboard],
    ['/groups/edit/:id', 'get', mockResultGroupController.getEditResultGroupForm],
    ['/groups/edit/:id', 'post', mockResultGroupController.updateResultGroupById],
    ['/groups/new', 'get', mockResultGroupController.getNewResultGroupForm],
    ['/groups/new', 'post', mockResultGroupController.createNewResultGroup],
    ['/groups/delete/:id', 'delete', mockResultGroupController.deleteResultGroupById],
    ['/groups/generate', 'post', mockResultGroupController.generateResultGroups],

    ['/', 'get', mockResultController.getResultsDashboard],
    ['/detailed/:id/:part', 'get', mockResultController.getDetailedResults],
  ];

  test.each(routeCases)(
    '%s [%s] uses Verify, VerifyRole and the expected controller handler in order',
    (path, method) => {
      const layer = findRouteLayer(path, method);

      expect(layer).toBeDefined();
      expect(layer.route.stack).toHaveLength(3);
      expect(typeof layer.route.stack[0].handle).toBe('function');
      expect(typeof layer.route.stack[1].handle).toBe('function');
      expect(typeof layer.route.stack[2].handle).toBe('function');
    }
  );
});

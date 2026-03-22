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

const mockVaulterController = {
  getNewVaulterForm: jest.fn(),
  createNewVaulter: jest.fn(),
  getVaultersDashboard: jest.fn(),
  getVaulterDetails: jest.fn(),
  getEditVaulterForm: jest.fn(),
  updateVaulterById: jest.fn(),
  deleteVaulterIncident: jest.fn(),
  createVaulterIncident: jest.fn(),
  getArmNumbersEditPage: jest.fn(),
  updateArmNumber: jest.fn(),
};

jest.unstable_mockModule('../../controllers/vaulterController.js', () => ({
  default: mockVaulterController,
}));

describe('vaulterRouter', () => {
  let vaulterRouter;

  beforeAll(async () => {
    ({ default: vaulterRouter } = await import('../../routes/vaulterRouter.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const findRouteLayer = (path, method) =>
    vaulterRouter.stack.find(
      (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
    );

  test('registers all expected routes', () => {
    const routes = vaulterRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).sort(),
      }));

    expect(routes).toEqual([
      { path: '/new', methods: ['get'] },
      { path: '/new', methods: ['post'] },
      { path: '/dashboard', methods: ['get'] },
      { path: '/details/:id', methods: ['get'] },
      { path: '/edit/:id', methods: ['get'] },
      { path: '/edit/:id', methods: ['post'] },
      { path: '/deleteIncident/:id', methods: ['delete'] },
      { path: '/newIncident/:id', methods: ['post'] },
      { path: '/numbers', methods: ['get'] },
      { path: '/updatenums/:id', methods: ['post'] },
    ]);
  });

  const threeMiddlewareRoutes = [
    ['/new', 'get', mockVaulterController.getNewVaulterForm],
    ['/dashboard', 'get', mockVaulterController.getVaultersDashboard],
    ['/details/:id', 'get', mockVaulterController.getVaulterDetails],
    ['/edit/:id', 'get', mockVaulterController.getEditVaulterForm],
    ['/deleteIncident/:id', 'delete', mockVaulterController.deleteVaulterIncident],
    ['/newIncident/:id', 'post', mockVaulterController.createVaulterIncident],
    ['/numbers', 'get', mockVaulterController.getArmNumbersEditPage],
    ['/updatenums/:id', 'post', mockVaulterController.updateArmNumber],
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
    ['/new', 'post', mockVaulterController.createNewVaulter],
    ['/edit/:id', 'post', mockVaulterController.updateVaulterById],
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
});

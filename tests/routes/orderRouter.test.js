import { jest } from '@jest/globals';

const mockVerify = jest.fn((req, res, next) => next());
const mockVerifyRole = jest.fn(() => jest.fn((req, res, next) => next()));

jest.unstable_mockModule('../../middleware/Verify.js', () => ({
  Verify: mockVerify,
  VerifyRole: mockVerifyRole,
}));

const mockOrderController = {
  editGet: jest.fn(),
  overwrite: jest.fn(),
  createOrder: jest.fn(),
  confirmConflicts: jest.fn(),
  getNewOrder: jest.fn(),
  createSelectGet: jest.fn(),
  createSelectPost: jest.fn(),
};

jest.unstable_mockModule('../../controllers/orderController.js', () => ({
  default: mockOrderController,
}));

describe('orderRouter', () => {
  let orderRouter;

  beforeAll(async () => {
    ({ default: orderRouter } = await import('../../routes/orderRouter.js'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const findRouteLayer = (path, method) =>
    orderRouter.stack.find(
      (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
    );

  test('registers all expected routes', () => {
    const routes = orderRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).sort(),
      }));

    expect(routes).toEqual([
      { path: '/edit/:id', methods: ['get'] },
      { path: '/overwrite/:id', methods: ['post'] },
      { path: '/createOrder/:id', methods: ['get'] },
      { path: '/confirmConflicts/:id', methods: ['get'] },
      { path: '/getNewOrder/:id', methods: ['post'] },
      { path: '/createSelect/:id', methods: ['get'] },
      { path: '/createSelect/:id', methods: ['post'] },
    ]);
  });

  test('GET /edit/:id uses Verify, VerifyRole and editGet in order', () => {
    const layer = findRouteLayer('/edit/:id', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('POST /overwrite/:id uses Verify, VerifyRole and overwrite in order', () => {
    const layer = findRouteLayer('/overwrite/:id', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('GET /createOrder/:id uses Verify, VerifyRole and createOrder in order', () => {
    const layer = findRouteLayer('/createOrder/:id', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('GET /confirmConflicts/:id uses Verify, VerifyRole and confirmConflicts in order', () => {
    const layer = findRouteLayer('/confirmConflicts/:id', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('POST /getNewOrder/:id uses Verify, VerifyRole and getNewOrder in order', () => {
    const layer = findRouteLayer('/getNewOrder/:id', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('GET /createSelect/:id uses Verify, VerifyRole and createSelectGet in order', () => {
    const layer = findRouteLayer('/createSelect/:id', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('POST /createSelect/:id uses Verify, VerifyRole and createSelectPost in order', () => {
    const layer = findRouteLayer('/createSelect/:id', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });
});

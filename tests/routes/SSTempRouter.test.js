import { jest } from '@jest/globals';

const mockVerify = jest.fn((req, res, next) => next());
const mockVerifyRoleMiddleware = jest.fn((req, res, next) => next());
const mockVerifyRole = jest.fn(() => mockVerifyRoleMiddleware);

const mockUploadSingleMiddleware = jest.fn((req, res, next) => next());
const mockUploadSingle = jest.fn(() => mockUploadSingleMiddleware);

jest.unstable_mockModule('../../middleware/Verify.js', () => ({
  Verify: mockVerify,
  VerifyRole: mockVerifyRole,
}));

jest.unstable_mockModule('../../middleware/fileUpload.js', () => ({
  uploadImage: {
    single: mockUploadSingle,
  },
}));

const mockScoreSheetTemplateController = {
  getScoreSheetTemplatesDashboard: jest.fn(),
  getCreateScoreSheetTemplateForm: jest.fn(),
  createNewScoreSheetTemplate: jest.fn(),
  getEditScoreSheetTemplateForm: jest.fn(),
  updateScoreSheetTemplateById: jest.fn(),
  deleteScoreSheetTemplateById: jest.fn(),
};

jest.unstable_mockModule('../../controllers/scoreSheetTemplateController.js', () => ({
  default: mockScoreSheetTemplateController,
}));

describe('SSTempRouter', () => {
  let router;

  beforeAll(async () => {
    ({ default: router } = await import('../../routes/SSTempRouter.js'));
  });

  const findRouteLayer = (path, method) =>
    router.stack.find(
      (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
    );

  test('registers all expected routes', () => {
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods).sort(),
      }));

    expect(routes).toEqual([
      { path: '/dashboard', methods: ['get'] },
      { path: '/create', methods: ['get'] },
      { path: '/create', methods: ['post'] },
      { path: '/edit/:id', methods: ['get'] },
      { path: '/edit/:id', methods: ['post'] },
      { path: '/delete/:id', methods: ['delete'] },
    ]);
  });

  test('GET /dashboard uses Verify, VerifyRole and getScoreSheetTemplatesDashboard in order', () => {
    const layer = findRouteLayer('/dashboard', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('GET /create uses Verify, VerifyRole and getCreateScoreSheetTemplateForm in order', () => {
    const layer = findRouteLayer('/create', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('POST /create uses Verify, VerifyRole, uploadImage.single and createNewScoreSheetTemplate in order', () => {
    const layer = findRouteLayer('/create', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(4);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
    expect(typeof layer.route.stack[3].handle).toBe('function');
  });

  test('GET /edit/:id uses Verify, VerifyRole and getEditScoreSheetTemplateForm in order', () => {
    const layer = findRouteLayer('/edit/:id', 'get');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('POST /edit/:id uses Verify, VerifyRole, uploadImage.single and updateScoreSheetTemplateById in order', () => {
    const layer = findRouteLayer('/edit/:id', 'post');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(4);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
    expect(typeof layer.route.stack[3].handle).toBe('function');
  });

  test('DELETE /delete/:id uses Verify, VerifyRole and deleteScoreSheetTemplateById in order', () => {
    const layer = findRouteLayer('/delete/:id', 'delete');

    expect(layer).toBeDefined();
    expect(layer.route.stack).toHaveLength(3);
    expect(typeof layer.route.stack[0].handle).toBe('function');
    expect(typeof layer.route.stack[1].handle).toBe('function');
    expect(typeof layer.route.stack[2].handle).toBe('function');
  });

  test('file upload routes contain an extra middleware before controller handlers', () => {
    const createLayer = findRouteLayer('/create', 'post');
    const editLayer = findRouteLayer('/edit/:id', 'post');

    expect(createLayer.route.stack).toHaveLength(4);
    expect(editLayer.route.stack).toHaveLength(4);
    expect(typeof createLayer.route.stack[2].handle).toBe('function');
    expect(typeof editLayer.route.stack[2].handle).toBe('function');
  });
});

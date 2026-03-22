const mockLogger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };

jest.mock('../../logger.js', () => ({
  logger: mockLogger
}));

jest.mock('../../controllers/auth.js', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('../../middleware/Validate.js', () => ({
  __esModule: true,
  default: jest.fn((req, res, next) => next())
}));

jest.mock('express-validator', () => ({
  check: jest.fn()
}));

jest.mock('../../middleware/Verify.js', () => ({
  Verify: jest.fn((req, res, next) => next()),
  VerifyRole: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {}
}));

let JudgesRouter;
let MESSAGES;

describe('routes/judgesRouter', () => {
  beforeAll(async () => {
    ({ default: JudgesRouter } = await import('../../routes/judgesRouter.js'));
    ({ MESSAGES } = await import('../../config/index.js'));
  });

  const getRouteLayer = (path, method) =>
    JudgesRouter.stack.find(
      layer =>
        layer.route &&
        layer.route.path === path &&
        layer.route.methods[method.toLowerCase()]
    );

  test('exports an express router instance with GET and POST root routes', () => {
    expect(typeof JudgesRouter).toBe('function');
    expect(Array.isArray(JudgesRouter.stack)).toBe(true);

    const getRoot = getRouteLayer('/', 'get');
    const postRoot = getRouteLayer('/', 'post');

    expect(getRoot).toBeDefined();
    expect(postRoot).toBeDefined();

    const routeLayers = JudgesRouter.stack.filter(layer => layer.route);
    expect(routeLayers).toHaveLength(2);
  });

  test('GET / renders judge input and clears session messages', async () => {
    const layer = getRouteLayer('/', 'get');
    const handler = layer.route.stack[0].handle;

    const req = {
      session: {
        formData: { a: 1 },
        failMessage: 'error msg',
        successMessage: 'ok msg'
      },
      user: { username: 'judge1' }
    };
    const res = {
      render: jest.fn()
    };

    await handler(req, res);

    expect(res.render).toHaveBeenCalledWith('judges/judgeinput', {
      formData: { a: 1 },
      failMessage: 'error msg',
      successMessage: 'ok msg',
      user: { username: 'judge1' }
    });
    expect(req.session.failMessage).toBeNull();
    expect(req.session.successMessage).toBeNull();
  });

  test('POST / stores success message and redirects to /judges', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const layer = getRouteLayer('/', 'post');
    const handler = layer.route.stack[0].handle;

    const req = {
      body: { score: 8.5 },
      session: {}
    };
    const res = {
      redirect: jest.fn()
    };

    await handler(req, res);

    expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.JUDGE_INPUT_RECEIVED);
    expect(res.redirect).toHaveBeenCalledWith('/judges');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

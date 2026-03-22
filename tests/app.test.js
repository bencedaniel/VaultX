import fs from 'fs';
import path from 'path';

const appFilePath = path.resolve(process.cwd(), 'app.js');

describe('app.js source wiring', () => {
  let source;

  beforeAll(() => {
    source = fs.readFileSync(appFilePath, 'utf8');
  });

  test('wires routes before not-found and error middleware', () => {
    const setupRoutesPos = source.indexOf('setupRoutes(app);');
    const first404Pos = source.indexOf('app.use(StoreUserWithoutValidation);');
    const errorHandlerPos = source.lastIndexOf('app.use(errorHandler);');

    expect(setupRoutesPos).toBeGreaterThan(-1);
    expect(first404Pos).toBeGreaterThan(-1);
    expect(errorHandlerPos).toBeGreaterThan(-1);
    expect(setupRoutesPos).toBeLessThan(first404Pos);
    expect(first404Pos).toBeLessThan(errorHandlerPos);
  });

  test('contains current two-step 404 handling blocks', () => {
    const notFoundStatusHits = source.match(/HTTP_STATUS\.NOT_FOUND/g) || [];
    const errorPageRenderHits = source.match(/render\('errorpage'/g) || [];

    expect(notFoundStatusHits.length).toBeGreaterThanOrEqual(2);
    expect(errorPageRenderHits.length).toBeGreaterThanOrEqual(2);
  });

  test('global middleware catch block sets safe defaults', () => {
    expect(source).toContain('res.locals.alerts = [];');
    expect(source).toContain('res.locals.test = false;');
    expect(source).toContain('res.locals.parent = \'/dashboard\';');
    expect(source).toContain('res.locals.selectedEvent = null;');
  });

  test('validates critical env variables before startup', () => {
    expect(source).toContain('if (!MONGODB_URI || !PORT || !SECRET_ACCESS_TOKEN || !SECRET_API_KEY || !TRUST_PROXY || !DOMAIN || !TIMEOUT)');
    expect(source).toContain('process.exit(1);');
  });
});

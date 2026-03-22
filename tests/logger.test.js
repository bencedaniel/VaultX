import {
  logger,
  logDb,
  logOperation,
  logAuth,
  logValidation,
  logError,
  logWarn,
  logInfo,
  logDebug,
} from '../logger.js';

describe('logger helpers', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('logDb formats message with metadata', () => {
    const spy = jest.spyOn(logger, 'db').mockImplementation(() => {});

    logDb('CREATE', 'User', 'u1', { status: 'ok' });

    expect(spy).toHaveBeenCalledWith('[CREATE] User (u1) | {"status":"ok"}');
  });

  test('logOperation includes operation, user and http status', () => {
    const spy = jest.spyOn(logger, 'operation').mockImplementation(() => {});

    logOperation('USER_UPDATE', 'User updated', 'john', 200);

    expect(spy).toHaveBeenCalledWith('[USER_UPDATE] User updated by john | HTTP: 200');
  });

  test('logAuth writes success/failure marker', () => {
    const spy = jest.spyOn(logger, 'auth').mockImplementation(() => {});

    logAuth('LOGIN', 'john', true);
    logAuth('LOGIN', 'john', false, 'INVALID_CREDENTIALS');

    expect(spy).toHaveBeenNthCalledWith(1, '[LOGIN] ✓ john');
    expect(spy).toHaveBeenNthCalledWith(2, '[LOGIN] ✗ john | INVALID_CREDENTIALS');
  });

  test('remaining helpers call corresponding logger level', () => {
    const validationSpy = jest.spyOn(logger, 'validation').mockImplementation(() => {});
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
    const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {});

    logValidation('email', 'INVALID_FORMAT', 'john');
    logError('SOME_ERROR', 'broken', 'ctx', { a: 1 });
    logWarn('WARN', 'heads up', 'ctx');
    logInfo('hello');
    logDebug('ctx', { id: 1 });

    expect(validationSpy).toHaveBeenCalledWith('Field: email | Rule: INVALID_FORMAT | by john');
    expect(errorSpy).toHaveBeenCalledWith('[SOME_ERROR] broken | Context: ctx | {"a":1}');
    expect(warnSpy).toHaveBeenCalledWith('[WARN] heads up | ctx');
    expect(infoSpy).toHaveBeenCalledWith('hello');
    expect(debugSpy).toHaveBeenCalledWith('[DEBUG] ctx | {\n  "id": 1\n}');
  });
});

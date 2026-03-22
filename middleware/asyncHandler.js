/**
 * Async handler wrapper
 * Wraps async controller functions to catch errors automatically
 * Usage: router.get('/path', asyncHandler(controllerFunction))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
      if (typeof next === 'function') {
        next(err);
      }
      throw err;
    });
  };
}

/**
 * Express error handling needs errors passed to next()
 * This wrapper ensures that happens automatically
 */
export default asyncHandler;

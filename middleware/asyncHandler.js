/**
 * Aszinkron handler wrapper (Express middleware-hez)
 * Aszinkron controller függvényeket csomagol be úgy, hogy az elkapott hibákat automatikusan továbbadja a hibakezelőnek.
 * Használat: router.get('/útvonal', asyncHandler(controllerFunction))
 * @param {Function} fn - Aszinkron controller vagy middleware függvény (req, res, next) paraméterekkel.
 * @returns {Function} Egy új függvény, amely automatikusan kezeli az aszinkron hibákat.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    // Promise.resolve biztosítja, hogy az async/await hibák is elkapásra kerülnek
    return Promise.resolve(fn(req, res, next)).catch((err) => {
      // Ha van next, továbbadjuk a hibát az Express hibakezelőnek
      if (typeof next === 'function') {
        next(err);
      }
      // Ha nincs next, újradobjuk a hibát (pl. teszt vagy nem Express környezet)
      throw err;
    });
  };
}

/**
 * Alapértelmezett export: asyncHandler wrapper
 * Express hibakezeléshez szükséges, hogy a hibák a next()-en keresztül menjenek tovább.
 */
export default asyncHandler;

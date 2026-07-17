
import router from './routes.js';
import adminRouter from './adminRouter.js';
import horseRouter from './horseRouter.js';
import vaulterRouter from './vaulterRouter.js';
import lungerRouter from './lungerRouter.js';
import eventRouter from './eventRouter.js';
import categoryRouter from './categoryRouter.js';
import entryRouter from './entryRouter.js';
import JudgesRouter from './judgesRouter.js';
import dailytimetableRouter from './DtimetableRouter.js';
import alertRouter from './alertRouter.js';
import orderRouter from './orderRouter.js';
import SSTempRouter from './SSTempRouter.js';
import scoringRouter from './scoringRouter.js';
import mappingRouter from './mappingRouter.js';
import resultRouter from './resultRouter.js';
import helpMessageRouter from './helpMessageRouter.js';
import twoFaRouter from './twoFaRouter.js';

/**
 * Alkalmazás route-regisztráló függvény.
 *
 * Feladata az összes modul-router megfelelő URL prefix alá történő felcsatolása.
 * A csoportosítás célja az átláthatóság: fő útvonalak, admin, entitás alapú,
 * operatív, valamint pontozási/eredmény útvonalak külön blokkban szerepelnek.
 *
 * @param {import('express').Application} app - Az Express alkalmazás példány.
 * @returns {void}
 */
const setupRoutes = (app) => {
  // ============================================
  // MAIN ROUTES
  // ============================================

  // Alap (root) route-ok: pl. kezdőoldal, auth oldalak, közös belépési pontok.
  app.use('/', router);

  // ============================================
  // ADMIN ROUTES
  // ============================================

  // Admin felülethez tartozó route-ok.
  app.use('/admin', adminRouter);

  // ============================================
  // ENTITY ROUTES
  // ============================================

  // Entitás-alapú route-ok (ló, voltizsáló, lóvezető, kategória, esemény, nevezés).
  app.use('/horse', horseRouter);
  app.use('/vaulter', vaulterRouter);
  app.use('/lunger', lungerRouter);
  app.use('/category', categoryRouter);
  app.use('/admin/event', eventRouter);
  app.use('/entry', entryRouter);

  // ============================================
  // OPERATIONAL ROUTES
  // ============================================

  // Napi működést támogató route-ok (bírók, időbeosztás, riasztás, sorrend, súgó).
  app.use('/judges', JudgesRouter);
  app.use('/dailytimetable', dailytimetableRouter);
  app.use('/alerts', alertRouter);
  app.use('/order', orderRouter);
  app.use('/helpmessages', helpMessageRouter);

  // ============================================
  // SCORING & RESULTS ROUTES
  // ============================================

  // Pontlap sablonok, pontozás, mapping és eredmény route-ok.
  app.use('/scoresheets', SSTempRouter);
  app.use('/scoring', scoringRouter);
  app.use('/mapping', mappingRouter);
  app.use('/result', resultRouter);
  app.use('/2fa', twoFaRouter);
};

export default setupRoutes;

import express from 'express';

import { Verify, VerifyRole } from "../middleware/Verify.js";
import alertController from '../controllers/alertController.js';


/**
 * Riasztások (Alerts) router.
 * Minden riasztáskezelési művelet végpontja (létrehozás, szerkesztés, törlés, dashboard, eseményhez kötött ellenőrzés).
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const alertRouter = express.Router();


// ===========================
// ALERTS MANAGEMENT
// ===========================

/**
 * Új riasztás űrlap megjelenítése.
 * GET /alerts/new
 */
alertRouter.get('/new', Verify, VerifyRole(), alertController.getNewAlertForm);

/**
 * Új riasztás létrehozása.
 * POST /alerts/new
 */
alertRouter.post('/new', Verify, VerifyRole(), alertController.createNewAlertHandler);

/**
 * Riasztások dashboard megjelenítése.
 * GET /alerts/dashboard
 */
alertRouter.get('/dashboard', Verify, VerifyRole(), alertController.getAlertsDashboard);

/**
 * Riasztás szerkesztő űrlap megjelenítése.
 * GET /alerts/edit/:id
 */
alertRouter.get('/edit/:id', Verify, VerifyRole(), alertController.getEditAlertForm);

/**
 * Riasztás adatainak frissítése.
 * POST /alerts/edit/:id
 */
alertRouter.post('/edit/:id', Verify, VerifyRole(), alertController.updateAlertHandler);

/**
 * Riasztás törlése.
 * DELETE /alerts/delete/:id
 */
alertRouter.delete('/delete/:id', Verify, VerifyRole(), alertController.deleteAlertHandler);

/**
 * Eseményhez tartozó riasztások ellenőrzése.
 * GET /alerts/checkEvent/
 */
alertRouter.get('/checkEvent/', Verify, VerifyRole(), alertController.checkEventAlertsHandler);


/**
 * alertRouter exportálása.
 */
export default alertRouter;
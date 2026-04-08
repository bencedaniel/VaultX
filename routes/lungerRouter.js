import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import lungerController from '../controllers/lungerController.js';

/**
 * Lóvezetők (Lunger) router.
 * Lóvezetők létrehozása, listázása, szerkesztése, részletezése,
 * valamint incidenseik kezelése.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const lungerRouter = express.Router();

/**
 * Új lóvezető űrlap megjelenítése.
 * GET /lunger/new
 */
lungerRouter.get('/new', Verify, VerifyRole(), lungerController.renderNew);

/**
 * Új lóvezető létrehozása.
 * POST /lunger/new
 */
lungerRouter.post('/new', Verify, VerifyRole(), lungerController.createNew);

/**
 * Lóvezetők dashboard megjelenítése.
 * GET /lunger/dashboard
 */
lungerRouter.get('/dashboard', Verify, VerifyRole(), lungerController.dashboard);

/**
 * Lóvezető részleteinek megjelenítése.
 * GET /lunger/details/:id
 */
lungerRouter.get('/details/:id', Verify, VerifyRole(), lungerController.details);

/**
 * Lóvezető szerkesztő űrlap megjelenítése.
 * GET /lunger/edit/:id
 */
lungerRouter.get('/edit/:id', Verify, VerifyRole(), lungerController.editGet);

/**
 * Lóvezető adatainak frissítése.
 * POST /lunger/edit/:id
 */
lungerRouter.post('/edit/:id', Verify, VerifyRole(), Validate, lungerController.editPost);

/**
 * Lóvezetőhöz tartozó incidens törlése.
 * DELETE /lunger/deleteIncident/:id
 */
lungerRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), lungerController.deleteIncident);

/**
 * Új incidens hozzáadása lóvezetőhöz.
 * POST /lunger/newIncident/:id
 */
lungerRouter.post('/newIncident/:id', Verify, VerifyRole(), lungerController.newIncidentPost);

/**
 * lungerRouter exportálása.
 */
export default lungerRouter;

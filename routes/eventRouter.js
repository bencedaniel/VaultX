import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import eventController from '../controllers/eventController.js';

/**
 * Események (Event) router.
 * Események kezelése (létrehozás, szerkesztés, dashboard, felelős személyek, kiválasztás, részletek).
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const eventRouter = express.Router();

/**
 * Új esemény űrlap megjelenítése.
 * GET /events/new
 */
eventRouter.get('/new', Verify, VerifyRole(), eventController.renderNew);

/**
 * Új esemény létrehozása.
 * POST /events/new
 */
eventRouter.post('/new', Verify, VerifyRole(), eventController.createNew);

/**
 * Események dashboard megjelenítése.
 * GET /events/dashboard
 */
eventRouter.get('/dashboard', Verify, VerifyRole(), eventController.dashboard);

/**
 * Esemény szerkesztő űrlap megjelenítése.
 * GET /events/edit/:id
 */
eventRouter.get('/edit/:id', Verify, VerifyRole(), eventController.editGet);

/**
 * Esemény adatainak frissítése.
 * POST /events/edit/:id
 */
eventRouter.post('/edit/:id', Verify, VerifyRole(), Validate, eventController.editPost);

/**
 * Esemény részleteinek megjelenítése.
 * GET /events/details/:id
 */
eventRouter.get('/details/:id', Verify, VerifyRole(), eventController.details);

/**
 * Felelős személy törlése eseményből.
 * DELETE /events/deleteResponsiblePerson/:id
 */
eventRouter.delete('/deleteResponsiblePerson/:id', Verify, VerifyRole(), eventController.deleteResponsiblePersonHandler);

/**
 * Felelős személy hozzáadása eseményhez.
 * POST /events/addResponsiblePerson/:id
 */
eventRouter.post('/addResponsiblePerson/:id', Verify, VerifyRole(), eventController.addResponsiblePersonHandler);

/**
 * Esemény kiválasztása (selected=true).
 * POST /events/selectEvent/:eventId
 */
eventRouter.post('/selectEvent/:eventId', Verify, VerifyRole(), eventController.selectEventHandler);



/**
 * eventRouter exportálása.
 */
export default eventRouter;
import express from 'express';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

import { logError } from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import entryController from '../controllers/entryController.js';




/**
 * Nevezések (Entry) router.
 * Nevezések, incidensek, állatorvosi státuszok kezelése (létrehozás, szerkesztés, dashboard, stb.).
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const entryRouter = express.Router();


/**
 * Új nevezés űrlap megjelenítése.
 * GET /entries/new
 */
entryRouter.get('/new', Verify, VerifyRole(), entryController.renderNew);

/**
 * Új nevezés létrehozása.
 * POST /entries/new
 */
entryRouter.post('/new', Verify, VerifyRole(), entryController.createNew);

/**
 * Nevezések dashboard megjelenítése.
 * GET /entries/dashboard
 */
entryRouter.get('/dashboard', Verify, VerifyRole(), entryController.dashboard);

/**
 * Nevezés szerkesztő űrlap megjelenítése.
 * GET /entries/edit/:id
 */
entryRouter.get('/edit/:id', Verify, VerifyRole(), entryController.editGet);

/**
 * Nevezés adatainak frissítése.
 * POST /entries/edit/:id
 */
entryRouter.post('/edit/:id', Verify, VerifyRole(), Validate, entryController.editPost);

// Nevezés törlésének végpontja (jelenleg kikommentezve)
/*  entryRouter.delete('/delete/:id',Verify, VerifyRole(), async (req, res) => {
      ...existing code...
  });*/

/**
 * Nevezéshez tartozó incidens törlése.
 * DELETE /entries/deleteIncident/:id
 */
entryRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), entryController.deleteIncident);

/**
 * Új incidens hozzáadása nevezéshez.
 * POST /entries/newIncident/:id
 */
entryRouter.post('/newIncident/:id', Verify, VerifyRole(), entryController.newIncidentPost);

/**
 * Állatorvosi ellenőrzés oldal megjelenítése.
 * GET /entries/vetCheck
 */
entryRouter.get('/vetCheck', Verify, VerifyRole(), entryController.vetCheckGet);

/**
 * Ló állatorvosi státuszának frissítése.
 * POST /entries/updateVetStatus/:horseId
 */
entryRouter.post('/updateVetStatus/:horseId', Verify, VerifyRole(), entryController.updateVetStatus);






/**
 * entryRouter exportálása.
 */
export default entryRouter;
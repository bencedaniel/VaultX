import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import mappingController from '../controllers/mappingController.js';

/**
 * Táblamapping (Mapping) router.
 * Mapping rekordok létrehozása, listázása, szerkesztése és törlése.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const mappingRouter = express.Router();

/**
 * Új mapping űrlap megjelenítése.
 * GET /mapping/new
 */
mappingRouter.get('/new', Verify, VerifyRole(), mappingController.renderNew);

/**
 * Új mapping létrehozása.
 * POST /mapping/new
 */
mappingRouter.post('/new', Verify, VerifyRole(), mappingController.createNew);

/**
 * Mapping dashboard megjelenítése.
 * GET /mapping/dashboard
 */
mappingRouter.get('/dashboard', Verify, VerifyRole(), mappingController.dashboard);

/**
 * Mapping szerkesztő űrlap megjelenítése.
 * GET /mapping/edit/:id
 */
mappingRouter.get('/edit/:id', Verify, VerifyRole(), mappingController.editGet);

/**
 * Mapping adatainak frissítése.
 * POST /mapping/edit/:id
 */
mappingRouter.post('/edit/:id', Verify, VerifyRole(), Validate, mappingController.editPost);

/**
 * Mapping törlése.
 * DELETE /mapping/delete/:id
 */
mappingRouter.delete('/delete/:id', Verify, VerifyRole(), mappingController.delete);

/**
 * mappingRouter exportálása.
 */
export default mappingRouter;

import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import horseController from '../controllers/horseController.js';

/**
 * Lovak (Horse) router.
 * Lovak létrehozása, listázása, szerkesztése, részletezése,
 * valamint megjegyzéseinek és számjelöléseinek kezelése.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const HorseRouter = express.Router();

// ===========================
// HORSE MANAGEMENT
// ===========================

/**
 * Új ló űrlap megjelenítése.
 * GET /horse/new
 */
HorseRouter.get('/new', Verify, VerifyRole(), horseController.renderNew);

/**
 * Új ló létrehozása.
 * POST /horse/new
 */
HorseRouter.post('/new', Verify, VerifyRole(), Validate, horseController.createNew);

/**
 * Lovak dashboard megjelenítése.
 * GET /horse/dashboard
 */
HorseRouter.get('/dashboard', Verify, VerifyRole(), horseController.dashboard);

/**
 * Ló részleteinek megjelenítése.
 * GET /horse/details/:id
 */
HorseRouter.get('/details/:id', Verify, VerifyRole(), horseController.details);

/**
 * Ló szerkesztő űrlap megjelenítése.
 * GET /horse/edit/:id
 */
HorseRouter.get('/edit/:id', Verify, VerifyRole(), horseController.editGet);

/**
 * Ló adatainak frissítése.
 * POST /horse/edit/:id
 */
HorseRouter.post('/edit/:id', Verify, VerifyRole(), Validate, horseController.editPost);

/**
 * Lóhoz tartozó megjegyzés törlése.
 * DELETE /horse/deleteNote/:id
 */
HorseRouter.delete('/deleteNote/:id', Verify, VerifyRole(), horseController.deleteNote);

/**
 * Új megjegyzés hozzáadása lóhoz.
 * POST /horse/newNote/:id
 */
HorseRouter.post('/newNote/:id', Verify, VerifyRole(), horseController.newNotePost);

/**
 * Lószámok (pl. box/head) kezelőoldal megjelenítése.
 * GET /horse/numbers
 */
HorseRouter.get('/numbers', Verify, VerifyRole(), horseController.numbersGet);

/**
 * Ló számjelöléseinek frissítése.
 * POST /horse/updatenums/:id
 */
HorseRouter.post('/updatenums/:id', Verify, VerifyRole(), horseController.updateNums);

/**
 * HorseRouter exportálása.
 */
export default HorseRouter;

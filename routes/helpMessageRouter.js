import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import helpMessageController from '../controllers/helpmessageController.js';

/**
 * Súgóüzenetek (HelpMessage) router.
 * Súgóüzenetek létrehozása, listázása, szerkesztése és törlése.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const helpMessageRouter = express.Router();

// ===========================
// HELP MESSAGE MANAGEMENT
// ===========================

/**
 * Új súgóüzenet űrlap megjelenítése.
 * GET /helpmessages/new
 */
helpMessageRouter.get('/new', Verify, VerifyRole(), helpMessageController.renderNew);

/**
 * Új súgóüzenet létrehozása.
 * POST /helpmessages/new
 */
helpMessageRouter.post('/new', Verify, VerifyRole(), helpMessageController.createNew);

/**
 * Súgóüzenetek dashboard megjelenítése.
 * GET /helpmessages/dashboard
 */
helpMessageRouter.get('/dashboard', Verify, VerifyRole(), helpMessageController.dashboard);

/**
 * Súgóüzenet szerkesztő űrlap megjelenítése.
 * GET /helpmessages/edit/:id
 */
helpMessageRouter.get('/edit/:id', Verify, VerifyRole(), helpMessageController.editGet);

/**
 * Súgóüzenet adatainak frissítése.
 * POST /helpmessages/edit/:id
 */
helpMessageRouter.post('/edit/:id', Verify, VerifyRole(), Validate, helpMessageController.editPost);

/**
 * Súgóüzenet törlése.
 * DELETE /helpmessages/delete/:id
 */
helpMessageRouter.delete('/delete/:id', Verify, VerifyRole(), helpMessageController.delete);

/**
 * helpMessageRouter exportálása.
 */
export default helpMessageRouter;

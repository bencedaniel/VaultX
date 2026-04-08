import express from 'express';

import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import vaulterController from '../controllers/vaulterController.js';

/**
 * Voltizsálók (Vaulter) router.
 * Voltizsálók létrehozása, listázása, szerkesztése, részletezése,
 * valamint incidenseik és karszámaik kezelése.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const vaulterRouter = express.Router();

/**
 * Új voltizsáló űrlap megjelenítése.
 * GET /vaulter/new
 */
vaulterRouter.get('/new', Verify, VerifyRole(), vaulterController.getNewVaulterForm);

/**
 * Új voltizsáló létrehozása.
 * POST /vaulter/new
 */
vaulterRouter.post('/new', Verify, VerifyRole(), Validate, vaulterController.createNewVaulter);

/**
 * Voltizsálók dashboard megjelenítése.
 * GET /vaulter/dashboard
 */
vaulterRouter.get('/dashboard', Verify, VerifyRole(), vaulterController.getVaultersDashboard);

/**
 * Voltizsáló részleteinek megjelenítése.
 * GET /vaulter/details/:id
 */
vaulterRouter.get('/details/:id', Verify, VerifyRole(), vaulterController.getVaulterDetails);

/**
 * Voltizsáló szerkesztő űrlap megjelenítése.
 * GET /vaulter/edit/:id
 */
vaulterRouter.get('/edit/:id', Verify, VerifyRole(), vaulterController.getEditVaulterForm);

/**
 * Voltizsáló adatainak frissítése.
 * POST /vaulter/edit/:id
 */
vaulterRouter.post('/edit/:id', Verify, VerifyRole(), Validate, vaulterController.updateVaulterById);

/**
 * Voltizsálóhoz tartozó incidens törlése.
 * DELETE /vaulter/deleteIncident/:id
 */
vaulterRouter.delete('/deleteIncident/:id', Verify, VerifyRole(), vaulterController.deleteVaulterIncident);

/**
 * Új incidens hozzáadása voltizsálóhoz.
 * POST /vaulter/newIncident/:id
 */
vaulterRouter.post('/newIncident/:id', Verify, VerifyRole(), vaulterController.createVaulterIncident);

/**
 * Karszám-szerkesztő oldal megjelenítése.
 * GET /vaulter/numbers
 */
vaulterRouter.get('/numbers', Verify, VerifyRole(), vaulterController.getArmNumbersEditPage);

/**
 * Voltizsáló karszám frissítése.
 * POST /vaulter/updatenums/:id
 */
vaulterRouter.post('/updatenums/:id', Verify, VerifyRole(), vaulterController.updateArmNumber);


/**
 * vaulterRouter exportálása.
 */
export default vaulterRouter;
import express from 'express';
import auth from '../controllers/auth.js';
import Validate from "../middleware/Validate.js";
import adminUserController from '../controllers/adminUserController.js';
import adminRoleController from '../controllers/adminRoleController.js';
import adminPermissionController from '../controllers/adminPermissionController.js';
import adminCardController from '../controllers/adminCardController.js';
import adminDashboardController from '../controllers/adminDashboardController.js';
import envModifierController from '../controllers/envModifierController.js';
import ipTablesController from '../controllers/ipTablesController.js';
import logController from '../controllers/logController.js';
import twofaController from '../controllers/twofaController.js';
import { CheckLoggedIn, UserIDValidator, Verify, VerifyRole, StoreUserWithoutValidation, VerifyNoerror, VerifyWithoutTwoFA } from "../middleware/Verify.js";

/**
 * twoFaRouter.
 * Minden twoFaRouter végpontjai.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const twoFaRouter = express.Router();

twoFaRouter.get('/generate', VerifyWithoutTwoFA, twofaController.generate2FACode);


twoFaRouter.post('/check', VerifyWithoutTwoFA, twofaController.check2FACode);

twoFaRouter.delete('/disable', Verify, twofaController.disable2FAForUser);


twoFaRouter.get('/verify',StoreUserWithoutValidation, twofaController.getverify2FACode);

twoFaRouter.post('/verify',StoreUserWithoutValidation, twofaController.verify2FACode);
/**
 * twoFaRouter exportálása.
 */
export default twoFaRouter;

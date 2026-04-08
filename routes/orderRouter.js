
import express from 'express';

import { logger } from '../logger.js';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import OrderController from '../controllers/orderController.js';

const orderRouter = express.Router();

/**
 * @route GET /edit/:id
 * @desc Egy adott rendelés szerkesztő oldalának lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.get('/edit/:id', Verify, VerifyRole(), OrderController.editGet); // Szerkesztő oldal lekérése

/**
 * @route POST /overwrite/:id
 * @desc Egy adott rendelés felülírása új adatokkal.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.post('/overwrite/:id', Verify, VerifyRole(), OrderController.overwrite); // Rendelés felülírása

/**
 * @route GET /createOrder/:id
 * @desc Új rendelés létrehozása egy adott azonosítóval.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.get('/createOrder/:id', Verify, VerifyRole(), OrderController.createOrder); // Új rendelés létrehozása

/**
 * @route GET /confirmConflicts/:id
 * @desc Rendelési ütközések megerősítése egy adott rendelésnél.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.get('/confirmConflicts/:id', Verify, VerifyRole(), OrderController.confirmConflicts); // Ütközések megerősítése

/**
 * @route POST /getNewOrder/:id
 * @desc Új rendelés generálása egy adott azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.post('/getNewOrder/:id', Verify, VerifyRole(), OrderController.getNewOrder); // Új rendelés generálása

/**
 * @route GET /createSelect/:id
 * @desc Rendelés kiválasztó oldal lekérése egy adott azonosítóval.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.get('/createSelect/:id', Verify, VerifyRole(), OrderController.createSelectGet); // Kiválasztó oldal lekérése

/**
 * @route POST /createSelect/:id
 * @desc Rendelés kiválasztásának elküldése (POST) egy adott azonosítóval.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók érhetik el.
 * @middleware Verify, VerifyRole
 */
orderRouter.post('/createSelect/:id', Verify, VerifyRole(), OrderController.createSelectPost); // Kiválasztás elküldése

/**
 * Az orderRouter exportálása, amely tartalmazza az összes rendeléshez kapcsolódó végpontot.
 */
export default orderRouter;
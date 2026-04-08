import express from 'express';
import { MESSAGES } from '../config/index.js';
import {logger} from '../logger.js';
import auth from '../controllers/auth.js';
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Permissions from '../models/Permissions.js';

/**
 * Bírói input (Judges) router.
 * Egyszerű felület a bírói adatok fogadására és visszajelzésére.
 */
const JudgesRouter = express.Router();

/**
 * Bírói input oldal megjelenítése.
 * GET /judges
 */
JudgesRouter.get('/', async (req, res) => {
    // Űrlap renderelése session üzenetekkel és aktuális felhasználóval.
    res.render('judges/judgeinput', {
        formData: req.session.formData,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Üzenetek törlése, hogy ne jelenjenek meg újratöltéskor ismét.
    req.session.failMessage = null;
    req.session.successMessage = null;


});

/**
 * Bírói input fogadása.
 * POST /judges
 */
JudgesRouter.post('/', async (req, res) => {
    // Beérkező payload naplózása fejlesztői célból.
    console.log("Received judge input:", JSON.stringify(req.body, null, 2));
    // Sikeres feldolgozás visszajelzése sessionön keresztül.
    req.session.successMessage = MESSAGES.SUCCESS.JUDGE_INPUT_RECEIVED;
    res.redirect('/judges');
});

/**
 * JudgesRouter exportálása.
 */
export default JudgesRouter;
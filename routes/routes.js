import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import auth from '../controllers/auth.js';
import dashboardController from '../controllers/dashboardController.js';
import profileController from '../controllers/profileController.js';
import loginController from '../controllers/loginController.js';
import creatorsController from '../controllers/creatorsController.js';
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { CheckLoggedIn, UserIDValidator, Verify, VerifyRole, StoreUserWithoutValidation, VerifyNoerror } from "../middleware/Verify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


/**
 * @route GET /robots.txt
 * @desc A robots.txt fájl kiszolgálása a gyökérből (pl. keresőrobotok szabályozása).
 * @access Publikus
 */
router.get("/robots.txt", (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '../static/robots.txt'));
});

/**
 * @route GET /
 * @desc Főoldal, automatikusan átirányít a dashboardra.
 * @access Publikus
 */
router.get("/", async (req, res) => {
    res.redirect("/dashboard");
});

/**
 * @route GET /dashboard
 * @desc Dashboard oldal lekérése. Ha nincs hiba, akkor VerifyNoerror, majd Verify middleware fut le.
 * @access Csak hitelesített felhasználók
 */
router.dashboard = router.get("/dashboard", VerifyNoerror, Verify, dashboardController.getDashboard);


/**
 * @route POST /login
 * @desc Bejelentkezési adatok beküldése. Ellenőrzi, hogy a felhasználónév és jelszó mezők nem üresek, majd validálja az adatokat.
 * @access Publikus
 * @middleware express-validator, Validate
 */
router.post(
    "/login",
    check("username")
        .not()
        .isEmpty(),
    check("password").not().isEmpty(),
    Validate, 
    auth.Login
);

/**
 * @route GET /login
 * @desc Bejelentkező oldal lekérése. Ha már be van jelentkezve, átirányít.
 * @access Publikus
 * @middleware CheckLoggedIn
 */
router.get("/login", CheckLoggedIn, loginController.getLoginPage);





/**
 * @route GET /profile/:id
 * @desc Profil szerkesztő oldal lekérése azonosító alapján. Csak hitelesített felhasználók férhetnek hozzá.
 * @access Csak hitelesített felhasználók
 * @middleware Verify, UserIDValidator
 */
router.get("/profile/:id", StoreUserWithoutValidation, UserIDValidator, profileController.getProfileEditForm);


/**
 * @route POST /profile/:id
 * @desc Profil frissítése azonosító alapján. Csak hitelesített felhasználók férhetnek hozzá.
 * @access Csak hitelesített felhasználók
 * @middleware Verify, UserIDValidator
 */
router.post("/profile/:id", Verify, UserIDValidator, profileController.updateProfile);

/**
 * @route GET /creators
 * @desc Készítők oldalának lekérése. Nem szükséges validáció.
 * @access Publikus
 * @middleware StoreUserWithoutValidation
 */
router.get('/creators', StoreUserWithoutValidation, creatorsController.getCreatorsPage);

/**
 * @route GET /logout
 * @desc Kijelentkeztetés. Csak hitelesített felhasználók férhetnek hozzá.
 * @access Csak hitelesített felhasználók
 * @middleware Verify
 */
router.get('/logout', Verify, auth.Logout);




/**
 * A fő router exportálása, amely tartalmazza az összes alapvető végpontot (dashboard, login, profil, creators, logout, robots.txt).
 */
export default router;
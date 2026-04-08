import express from 'express';

import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import scoringJudgeController from '../controllers/scoringJudgeController.js';
import scoringOfficeController from '../controllers/scoringOfficeController.js';




const scoringRouter = express.Router();

// ==================== Bírói felület (Judge) ====================

/**
 * @route GET /
 * @desc Pontozó bírói dashboard lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/', Verify, VerifyRole(), scoringJudgeController.getScoringDashboard); // Bírói dashboard

/**
 * @route GET /program/:id
 * @desc Adott program részleteinek lekérése bírói nézetben.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/program/:id', Verify, VerifyRole(), scoringJudgeController.getProgramDetails); // Program részletek

/**
 * @route GET /newscoresheet/:entryid/:tpid
 * @desc Új pontozólap űrlap lekérése adott nevezéshez és sablonhoz.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/newscoresheet/:entryid/:tpid', Verify, VerifyRole(), scoringJudgeController.getNewScoresheetForm); // Új pontozólap űrlap

/**
 * @route POST /newscoresheet
 * @desc Új pontozólap létrehozása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 * @middleware Validate
 */
scoringRouter.post('/newscoresheet', Verify, VerifyRole(), Validate, scoringJudgeController.createNewScoresheet); // Pontozólap létrehozása


// ==================== Irodai felület (Office) ====================

/**
 * @route GET /office/dashboard
 * @desc Irodai dashboard lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/office/dashboard', Verify, VerifyRole(), scoringOfficeController.getOfficeDashboard); // Irodai dashboard

/**
 * @route GET /office/scoresheet/edit/:id
 * @desc Pontozólap szerkesztő űrlap lekérése azonosító alapján (alapértelmezett visszairányítás a dashboardra).
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/office/scoresheet/edit/:id', Verify, VerifyRole(), scoringOfficeController.getEditScoresheetForm); // Szerkesztő űrlap (dashboard redirect)

/**
 * @route GET /office/scoresheet/edit1/:id
 * @desc Pontozólap szerkesztő űrlap lekérése azonosító alapján (visszairányítás a pontlistára).
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/office/scoresheet/edit1/:id', Verify, VerifyRole(), scoringOfficeController.getEditScoresheetForm); // Szerkesztő űrlap (scores redirect)

/**
 * @route POST /office/scoresheet/edit/:id
 * @desc Pontozólap frissítése azonosító alapján, majd visszairányítás a dashboardra.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 * @middleware Validate
 */
scoringRouter.post('/office/scoresheet/edit/:id', Verify, VerifyRole(), Validate, (req, res) => scoringOfficeController.updateScoresheetById(req, res, '/scoring/office/dashboard')); // Frissítés + dashboard redirect

/**
 * @route POST /office/scoresheet/edit1/:id
 * @desc Pontozólap frissítése azonosító alapján, majd visszairányítás a pontlistára.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 * @middleware Validate
 */
scoringRouter.post('/office/scoresheet/edit1/:id', Verify, VerifyRole(), Validate, (req, res) => scoringOfficeController.updateScoresheetById(req, res, '/scoring/office/scores')); // Frissítés + scores redirect

/**
 * @route GET /office/scoresheet/new
 * @desc Új pontozólap kiválasztó űrlap lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/office/scoresheet/new', Verify, VerifyRole(), scoringOfficeController.getNewScoresheetSelectionForm); // Új pontozólap kiválasztó

/**
 * @route POST /office/scoresheet/new
 * @desc Új pontozólap kiválasztásának feldolgozása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.post('/office/scoresheet/new', Verify, VerifyRole(), scoringOfficeController.handleNewScoresheetSelection); // Kiválasztás feldolgozása

/**
 * @route GET /office/newscoresheet/:entryid/:tpid
 * @desc Új irodai pontozólap űrlap lekérése adott nevezéshez és sablonhoz.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/office/newscoresheet/:entryid/:tpid', Verify, VerifyRole(), scoringOfficeController.getOfficeNewScoresheetForm); // Új irodai pontozólap űrlap

/**
 * @route POST /office/newscoresheet
 * @desc Új irodai pontozólap létrehozása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 * @middleware Validate
 */
scoringRouter.post('/office/newscoresheet', Verify, VerifyRole(), Validate, scoringOfficeController.createOfficeNewScoresheet); // Irodai pontozólap létrehozása

/**
 * @route GET /office/scores
 * @desc Pontozólapok listájának lekérése irodai nézetben.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.get('/office/scores', Verify, VerifyRole(), scoringOfficeController.getScoresList); // Pontozólap lista

/**
 * @route POST /office/scores/recalculate/:id
 * @desc Pont újraszámítása azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
scoringRouter.post('/office/scores/recalculate/:id', Verify, VerifyRole(), scoringOfficeController.recalculateScoreById); // Újraszámítás

/**
 * A scoringRouter exportálása, amely tartalmazza az összes pontozással kapcsolatos végpontot.
 */
export default scoringRouter;

































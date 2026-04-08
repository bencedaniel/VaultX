import express from 'express';
import { Verify, VerifyRole } from '../middleware/Verify.js';
import { uploadImage } from '../middleware/fileUpload.js';
import scoreSheetTemplateController from '../controllers/scoreSheetTemplateController.js';

const ScoreSheetTempRouter = express.Router();


/**
 * @route GET /dashboard
 * @desc Pontozólap sablonok dashboardjának lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
ScoreSheetTempRouter.get('/dashboard', Verify, VerifyRole(), scoreSheetTemplateController.getScoreSheetTemplatesDashboard); // Dashboard


/**
 * @route GET /create
 * @desc Új pontozólap sablon létrehozó űrlap lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
ScoreSheetTempRouter.get('/create', Verify, VerifyRole(), scoreSheetTemplateController.getCreateScoreSheetTemplateForm); // Új sablon űrlap


/**
 * @route POST /create
 * @desc Új pontozólap sablon létrehozása, háttérkép feltöltéssel.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 * @middleware uploadImage.single('bgImageFile')
 */
ScoreSheetTempRouter.post('/create', Verify, VerifyRole(), uploadImage.single('bgImageFile'), scoreSheetTemplateController.createNewScoreSheetTemplate); // Új sablon létrehozása


/**
 * @route GET /edit/:id
 * @desc Pontozólap sablon szerkesztő űrlap lekérése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
ScoreSheetTempRouter.get('/edit/:id', Verify, VerifyRole(), scoreSheetTemplateController.getEditScoreSheetTemplateForm); // Szerkesztő űrlap


/**
 * @route POST /edit/:id
 * @desc Pontozólap sablon frissítése azonosító alapján, háttérkép feltöltéssel.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 * @middleware uploadImage.single('bgImageFile')
 */
ScoreSheetTempRouter.post('/edit/:id', Verify, VerifyRole(), uploadImage.single('bgImageFile'), scoreSheetTemplateController.updateScoreSheetTemplateById); // Szerkesztés


/**
 * @route DELETE /delete/:id
 * @desc Pontozólap sablon törlése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
ScoreSheetTempRouter.delete('/delete/:id', Verify, VerifyRole(), scoreSheetTemplateController.deleteScoreSheetTemplateById); // Törlés


/**
 * A ScoreSheetTempRouter exportálása, amely tartalmazza az összes pontozólap sablonhoz kapcsolódó végpontot.
 */
export default ScoreSheetTempRouter;
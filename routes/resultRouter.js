
import express from 'express';

import { Verify, VerifyRole } from "../middleware/Verify.js";
import resultCalcTemplateController from '../controllers/resultCalcTemplateController.js';
import resultGeneratorController from '../controllers/resultGeneratorController.js';
import resultGroupController from '../controllers/resultGroupController.js';
import resultController from '../controllers/resultController.js';

const resultRouter = express.Router();

// ==================== Kalkulációs sablonok (CalcTemplate) ====================

/**
 * @route GET /calcTemp/dashboard
 * @desc Kalkulációs sablonok dashboardjának lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/calcTemp/dashboard", Verify, VerifyRole(), resultCalcTemplateController.getCalcTemplatesDashboard); // Dashboard lekérése

/**
 * @route GET /calcTemp/new
 * @desc Új kalkulációs sablon létrehozó űrlap lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/calcTemp/new", Verify, VerifyRole(), resultCalcTemplateController.getNewCalcTemplateForm); // Új sablon űrlap

/**
 * @route POST /calcTemp/new
 * @desc Új kalkulációs sablon létrehozása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/calcTemp/new", Verify, VerifyRole(), resultCalcTemplateController.createNewCalcTemplate); // Új sablon létrehozása

/**
 * @route GET /calcTemp/edit/:id
 * @desc Kalkulációs sablon szerkesztő űrlap lekérése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/calcTemp/edit/:id", Verify, VerifyRole(), resultCalcTemplateController.getEditCalcTemplateForm); // Szerkesztő űrlap

/**
 * @route POST /calcTemp/edit/:id
 * @desc Kalkulációs sablon frissítése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/calcTemp/edit/:id", Verify, VerifyRole(), resultCalcTemplateController.updateCalcTemplateById); // Sablon frissítése

/**
 * @route DELETE /calcTemp/delete/:id
 * @desc Kalkulációs sablon törlése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.delete("/calcTemp/delete/:id", Verify, VerifyRole(), resultCalcTemplateController.deleteCalcTemplateById); // Sablon törlése


// ==================== Eredménygenerátor (Result Generator) ====================

/**
 * @route GET /generator/dashboard
 * @desc Eredménygenerátorok dashboardjának lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/generator/dashboard", Verify, VerifyRole(), resultGeneratorController.getGeneratorsDashboard); // Generator dashboard

/**
 * @route GET /generator/new
 * @desc Új eredménygenerátor létrehozó űrlap lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/generator/new", Verify, VerifyRole(), resultGeneratorController.getNewGeneratorForm); // Új generator űrlap

/**
 * @route POST /generator/new
 * @desc Új eredménygenerátor létrehozása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/generator/new", Verify, VerifyRole(), resultGeneratorController.createNewGenerator); // Új generator létrehozása

/**
 * @route POST /generator/status/:id
 * @desc Eredménygenerátor státuszának frissítése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/generator/status/:id", Verify, VerifyRole(), resultGeneratorController.updateGeneratorStatusById); // Generator státusz frissítése

/**
 * @route GET /generator/edit/:id
 * @desc Eredménygenerátor szerkesztő űrlap lekérése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/generator/edit/:id", Verify, VerifyRole(), resultGeneratorController.getEditGeneratorForm); // Generator szerkesztő űrlap

/**
 * @route POST /generator/edit/:id
 * @desc Eredménygenerátor frissítése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/generator/edit/:id", Verify, VerifyRole(), resultGeneratorController.updateGeneratorById); // Generator frissítése

/**
 * @route DELETE /generator/delete/:id
 * @desc Eredménygenerátor törlése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.delete("/generator/delete/:id", Verify, VerifyRole(), resultGeneratorController.deleteGeneratorById); // Generator törlése


// ==================== Eredménycsoportok (Result Groups) ====================

/**
 * @route GET /groups/dashboard
 * @desc Eredménycsoportok dashboardjának lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/groups/dashboard", Verify, VerifyRole(), resultGroupController.getResultGroupsDashboard); // Csoport dashboard

/**
 * @route GET /groups/edit/:id
 * @desc Eredménycsoport szerkesztő űrlap lekérése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/groups/edit/:id", Verify, VerifyRole(), resultGroupController.getEditResultGroupForm); // Csoport szerkesztő űrlap

/**
 * @route POST /groups/edit/:id
 * @desc Eredménycsoport frissítése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/groups/edit/:id", Verify, VerifyRole(), resultGroupController.updateResultGroupById); // Csoport frissítése

/**
 * @route GET /groups/new
 * @desc Új eredménycsoport létrehozó űrlap lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/groups/new", Verify, VerifyRole(), resultGroupController.getNewResultGroupForm); // Új csoport űrlap

/**
 * @route POST /groups/new
 * @desc Új eredménycsoport létrehozása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/groups/new", Verify, VerifyRole(), resultGroupController.createNewResultGroup); // Új csoport létrehozása

/**
 * @route DELETE /groups/delete/:id
 * @desc Eredménycsoport törlése azonosító alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.delete("/groups/delete/:id", Verify, VerifyRole(), resultGroupController.deleteResultGroupById); // Csoport törlése

/**
 * @route POST /groups/generate
 * @desc Eredménycsoportok generálása.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.post("/groups/generate", Verify, VerifyRole(), resultGroupController.generateResultGroups); // Csoportok generálása


// ==================== Eredmények lekérdezése ====================

/**
 * @route GET /
 * @desc Eredmények dashboardjának lekérése.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/", Verify, VerifyRole(), resultController.getResultsDashboard); // Eredmények dashboard

/**
 * @route GET /detailed/:id/:part
 * @desc Részletes eredmények lekérése azonosító és rész alapján.
 * @access Csak hitelesített és megfelelő jogosultságú felhasználók.
 */
resultRouter.get("/detailed/:id/:part", Verify, VerifyRole(), resultController.getDetailedResults); // Részletes eredmények

/**
 * A resultRouter exportálása, amely tartalmazza az összes eredménykezeléssel kapcsolatos végpontot.
 */
export default resultRouter;

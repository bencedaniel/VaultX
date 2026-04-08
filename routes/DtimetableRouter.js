import express from 'express';

import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import DailyTimeTableController from '../controllers/dailyTimetableController.js';


/**
 * Napi időbeosztás (DailyTimetable) router.
 * Napi időbeosztások és azok elemeinek kezelése (létrehozás, szerkesztés, törlés, dashboard, stb.).
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const dailytimetableRouter = express.Router();

dailytimetableRouter.post('/new', Verify, VerifyRole(), Validate, DailyTimeTableController.createNew);
dailytimetableRouter.get('/dashboard', Verify, VerifyRole(), DailyTimeTableController.dashboard);

dailytimetableRouter.get('/edit/:id', Verify, VerifyRole(), DailyTimeTableController.editGet);
dailytimetableRouter.post('/edit/:id', Verify, VerifyRole(), Validate, DailyTimeTableController.editPost);
dailytimetableRouter.delete('/delete/:id', Verify, VerifyRole(), DailyTimeTableController.delete);
dailytimetableRouter.get('/dayparts/:id', Verify, VerifyRole(), DailyTimeTableController.dayparts);
dailytimetableRouter.delete('/deleteTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.deleteTTelement);
dailytimetableRouter.get('/editTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.editTTelementGet);
dailytimetableRouter.post('/editTTelement/:id', Verify, VerifyRole(), Validate, DailyTimeTableController.editTTelementPost);
dailytimetableRouter.post('/saveTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.saveTTelement);
dailytimetableRouter.get('/newTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.newTTelementGetById);
dailytimetableRouter.get('/newTTelement', Verify, VerifyRole(), DailyTimeTableController.newTTelementGet);
dailytimetableRouter.post('/newTTelement', Verify, VerifyRole(), Validate, DailyTimeTableController.newTTelementPost);

/**
 * Új napi időbeosztás űrlap megjelenítése.
 * GET /dailytimetable/new
 */
dailytimetableRouter.get('/new', Verify, VerifyRole(), DailyTimeTableController.renderNew);

/**
 * Új napi időbeosztás létrehozása.
 * POST /dailytimetable/new
 */
dailytimetableRouter.post('/new', Verify, VerifyRole(), Validate, DailyTimeTableController.createNew);

/**
 * Napi időbeosztások dashboard megjelenítése.
 * GET /dailytimetable/dashboard
 */
dailytimetableRouter.get('/dashboard', Verify, VerifyRole(), DailyTimeTableController.dashboard);

/**
 * Napi időbeosztás szerkesztő űrlap megjelenítése.
 * GET /dailytimetable/edit/:id
 */
dailytimetableRouter.get('/edit/:id', Verify, VerifyRole(), DailyTimeTableController.editGet);

/**
 * Napi időbeosztás adatainak frissítése.
 * POST /dailytimetable/edit/:id
 */
dailytimetableRouter.post('/edit/:id', Verify, VerifyRole(), Validate, DailyTimeTableController.editPost);

/**
 * Napi időbeosztás törlése.
 * DELETE /dailytimetable/delete/:id
 */
dailytimetableRouter.delete('/delete/:id', Verify, VerifyRole(), DailyTimeTableController.delete);

/**
 * Napi időbeosztás elemeinek lekérdezése.
 * GET /dailytimetable/dayparts/:id
 */
dailytimetableRouter.get('/dayparts/:id', Verify, VerifyRole(), DailyTimeTableController.dayparts);

/**
 * Napi időbeosztás elem törlése.
 * DELETE /dailytimetable/deleteTTelement/:id
 */
dailytimetableRouter.delete('/deleteTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.deleteTTelement);

/**
 * Napi időbeosztás elem szerkesztő űrlap megjelenítése.
 * GET /dailytimetable/editTTelement/:id
 */
dailytimetableRouter.get('/editTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.editTTelementGet);

/**
 * Napi időbeosztás elem adatainak frissítése.
 * POST /dailytimetable/editTTelement/:id
 */
dailytimetableRouter.post('/editTTelement/:id', Verify, VerifyRole(), Validate, DailyTimeTableController.editTTelementPost);

/**
 * Napi időbeosztás elem mentése.
 * POST /dailytimetable/saveTTelement/:id
 */
dailytimetableRouter.post('/saveTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.saveTTelement);

/**
 * Új napi időbeosztás elem űrlap megjelenítése (adott napi időbeosztáshoz).
 * GET /dailytimetable/newTTelement/:id
 */
dailytimetableRouter.get('/newTTelement/:id', Verify, VerifyRole(), DailyTimeTableController.newTTelementGetById);

/**
 * Új napi időbeosztás elem űrlap megjelenítése (általános).
 * GET /dailytimetable/newTTelement
 */
dailytimetableRouter.get('/newTTelement', Verify, VerifyRole(), DailyTimeTableController.newTTelementGet);

/**
 * Új napi időbeosztás elem létrehozása.
 * POST /dailytimetable/newTTelement
 */
dailytimetableRouter.post('/newTTelement', Verify, VerifyRole(), Validate, DailyTimeTableController.newTTelementPost);

/**
 * dailytimetableRouter exportálása.
 */
export default dailytimetableRouter;


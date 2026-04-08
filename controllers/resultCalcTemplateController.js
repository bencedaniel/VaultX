// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Eredményszámítási sablonokkal kapcsolatos adatkezelő függvények importálása
import {
    getAllCalcTemplates,      // Összes számítási sablon lekérdezése
    getCalcTemplateById,      // Egy adott sablon lekérdezése ID alapján
    createCalcTemplate,       // Új sablon létrehozása
    updateCalcTemplate,       // Sablon adatainak frissítése
    deleteCalcTemplate,       // Sablon törlése
    getCalcTemplateFormData   // Sablon űrlaphoz szükséges adatok lekérdezése
} from '../DataServices/resultCalcTemplateData.js';

/**
 * @route GET /result/calcTemp/dashboard
 * @desc Számítási sablonok dashboard oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getCalcTemplatesDashboard = asyncHandler(async (req, res) => {
    res.render("resultCalc/dashboard", {
        resultCalcs: await getAllCalcTemplates(),           // Számítási sablonok listája
        rolePermissons: req.user?.role?.permissions,        // Felhasználó jogosultságai
        failMessage: req.session.failMessage,               // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,         // Sikeres művelet üzenete
        user: req.user                                      // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /result/calcTemp/new
 * @desc Új számítási sablon űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getNewCalcTemplateForm = asyncHandler(async (req, res) => {
    const { categories } = await getCalcTemplateFormData(); // Kategóriák lekérdezése az űrlaphoz
    res.render("resultCalc/newResultCalc", {
        formData: req.session.formData || {},               // Előzőleg megadott űrlapadatok (ha volt hiba)
        categoryList: categories,                           // Kategóriák listája
        rolePermissons: req.user?.role?.permissions,        // Felhasználó jogosultságai
        failMessage: req.session.failMessage,               // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,         // Sikeres művelet üzenete
        user: req.user                                      // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/calcTemp/new
 * @desc Új számítási sablon létrehozása
 * @param {Object} req - Express kérés objektum (session, user, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const createNewCalcTemplate = asyncHandler(async (req, res) => {
    // Ellenőrizzük, hogy a százalékos értékek összege pontosan 100-e
    if (Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP) !== 100) {
        req.session.failMessage = MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR;
        req.session.formData = req.body; // Hibás adatokat visszatöltjük az űrlapba
        return res.redirect("/result/calcTemp/new");
    }
    const calcTemp = await createCalcTemplate(req.body); // Új sablon létrehozása
    logOperation('RESULT_CALC_TEMPLATE_CREATE', `Result calculation template created: ${calcTemp._id}`, req.user.username, HTTP_STATUS.CREATED); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_CREATED; // Sikeres létrehozás üzenet
    res.redirect("/result/calcTemp/dashboard"); // Átirányítás a dashboardra
});

/**
 * @route GET /result/calcTemp/edit/:id
 * @desc Számítási sablon szerkesztő űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, params)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getEditCalcTemplateForm = asyncHandler(async (req, res) => {
    const calcTemp = await getCalcTemplateById(req.params.id); // Sablon lekérdezése ID alapján
    res.render("resultCalc/editResultCalc", {
        formData: calcTemp,                                   // Szerkesztendő sablon adatai
        rolePermissons: req.user?.role?.permissions,          // Felhasználó jogosultságai
        failMessage: req.session.failMessage,                 // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,           // Sikeres művelet üzenete
        user: req.user                                        // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/calcTemp/edit/:id
 * @desc Számítási sablon frissítése
 * @param {Object} req - Express kérés objektum (session, user, params, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const updateCalcTemplateById = asyncHandler(async (req, res) => {
    // Ellenőrizzük, hogy a százalékos értékek összege pontosan 100-e
    if (Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP) !== 100) {
        const sum = Number(req.body.round2FirstP) + Number(req.body.round1FirstP) + Number(req.body.round1SecondP);
        logError('VALIDATION_ERROR', 'Percentage sum error', `User: ${req.user.username}, sum: ${sum}`); // Hibás összeg naplózása
        req.session.failMessage = MESSAGES.VALIDATION.PERCENTAGE_SUM_ERROR;
        return res.redirect("/result/calcTemp/edit/" + req.params.id);
    }
    const updated = await updateCalcTemplate(req.params.id, req.body); // Sablon frissítése
    logOperation('RESULT_CALC_TEMPLATE_UPDATE', `Result calculation template updated: ${updated?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_EDITED; // Sikeres frissítés üzenet
    res.redirect("/result/calcTemp/dashboard"); // Átirányítás a dashboardra
});

/**
 * @route DELETE /result/calcTemp/delete/:id
 * @desc Számítási sablon törlése
 * @param {Object} req - Express kérés objektum (user, params)
 * @param {Object} res - Express válasz objektum (status, send)
 */
const deleteCalcTemplateById = asyncHandler(async (req, res) => {
    await deleteCalcTemplate(req.params.id); // Sablon törlése ID alapján
    logOperation('RESULT_CALC_TEMPLATE_DELETE', `Result calculation template deleted: ${req.params.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_CALC_TEMPLATE_DELETED); // Sikeres törlés üzenet
});

// A vezérlő által exportált handler függvények
export default {
    getCalcTemplatesDashboard, // Számítási sablonok dashboard oldal
    getNewCalcTemplateForm,    // Új számítási sablon űrlap
    createNewCalcTemplate,     // Új számítási sablon létrehozása
    getEditCalcTemplateForm,   // Számítási sablon szerkesztő űrlap
    updateCalcTemplateById,    // Számítási sablon frissítése
    deleteCalcTemplateById     // Számítási sablon törlése
};

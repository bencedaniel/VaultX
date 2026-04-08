// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Eredménygenerátorokkal kapcsolatos adatkezelő függvények importálása
import {
    getAllGenerators,         // Összes eredménygenerátor lekérdezése
    getGeneratorFormData,     // Eredménygenerátor űrlaphoz szükséges adatok lekérdezése
    createGenerator,          // Új eredménygenerátor létrehozása
    updateGenerator,          // Eredménygenerátor adatainak frissítése
    updateGeneratorStatus,    // Eredménygenerátor státuszának frissítése
    getGeneratorById,         // Eredménygenerátor lekérdezése ID alapján
    deleteGenerator           // Eredménygenerátor törlése
} from '../DataServices/resultGeneratorData.js';

/**
 * @route GET /result/generator/dashboard
 * @desc Eredménygenerátorok dashboard oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getGeneratorsDashboard = asyncHandler(async (req, res) => {
    const generators = await getAllGenerators(); // Eredménygenerátorok lekérdezése
    res.render("resultGen/dashboard", {
        generators: generators,                       // Eredménygenerátorok listája
        rolePermissons: req.user?.role?.permissions,  // Felhasználó jogosultságai
        failMessage: req.session.failMessage,         // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,   // Sikeres művelet üzenete
        user: req.user                                // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /result/generator/new
 * @desc Új eredménygenerátor űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getNewGeneratorForm = asyncHandler(async (req, res) => {
    const { categories, calcTemplates } = await getGeneratorFormData(); // Kategóriák és sablonok lekérdezése az űrlaphoz
    res.render("resultGen/newResultGen", {
        formData: req.session.formData || {},               // Előzőleg megadott űrlapadatok (ha volt hiba)
        categories: categories,                             // Kategóriák listája
        resultCalcs: calcTemplates,                         // Számítási sablonok listája
        rolePermissons: req.user?.role?.permissions,        // Felhasználó jogosultságai
        failMessage: req.session.failMessage,               // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,         // Sikeres művelet üzenete
        user: req.user                                      // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/generator/new
 * @desc Új eredménygenerátor létrehozása
 * @param {Object} req - Express kérés objektum (session, user, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const createNewGenerator = asyncHandler(async (req, res) => {
    const newGenerator = await createGenerator(req.body); // Új eredménygenerátor létrehozása az űrlap adataiból
    logOperation('RESULT_GENERATOR_CREATE', `Result generator created: ${newGenerator._id}`, req.user.username, HTTP_STATUS.CREATED); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GENERATOR_CREATED; // Sikeres létrehozás üzenet
    res.redirect("/result/generator/dashboard"); // Átirányítás a dashboardra
});

/**
 * @route POST /result/generator/status/:id
 * @desc Eredménygenerátor státuszának frissítése
 * @param {Object} req - Express kérés objektum (user, params, body)
 * @param {Object} res - Express válasz objektum (status, send)
 */
const updateGeneratorStatusById = asyncHandler(async (req, res) => {
    const generator = await updateGeneratorStatus(req.params.id, req.body.status); // Státusz frissítése
    logOperation('RESULT_GENERATOR_UPDATE', `Result generator status updated: ${generator._id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_GENERATOR_STATUS_UPDATED); // Sikeres frissítés üzenet
});

/**
 * @route GET /result/generator/edit/:id
 * @desc Eredménygenerátor szerkesztő űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, params)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getEditGeneratorForm = asyncHandler(async (req, res) => {
    const generator = await getGeneratorById(req.params.id); // Generátor lekérdezése ID alapján
    const { categories, calcTemplates } = await getGeneratorFormData(); // Kategóriák és sablonok lekérdezése
    res.render("resultGen/editResultGen", {
        formData: generator,                                 // Szerkesztendő generátor adatai
        categories: categories,                              // Kategóriák listája
        resultCalcs: calcTemplates,                          // Számítási sablonok listája
        rolePermissons: req.user?.role?.permissions,         // Felhasználó jogosultságai
        failMessage: req.session.failMessage,                // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,          // Sikeres művelet üzenete
        user: req.user                                       // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/generator/edit/:id
 * @desc Eredménygenerátor frissítése
 * @param {Object} req - Express kérés objektum (user, params, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const updateGeneratorById = asyncHandler(async (req, res) => {
    const generator = await updateGenerator(req.params.id, req.body); // Generátor frissítése az űrlap adataival
    logOperation('RESULT_GENERATOR_UPDATE', `Result generator updated: ${generator._id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GENERATOR_EDITED; // Sikeres frissítés üzenet
    res.redirect("/result/generator/dashboard"); // Átirányítás a dashboardra
});

/**
 * @route DELETE /result/generator/delete/:id
 * @desc Eredménygenerátor törlése
 * @param {Object} req - Express kérés objektum (user, params)
 * @param {Object} res - Express válasz objektum (status, send)
 */
const deleteGeneratorById = asyncHandler(async (req, res) => {
    const generator = await deleteGenerator(req.params.id); // Generátor törlése ID alapján
    logOperation('RESULT_GENERATOR_DELETE', `Result generator deleted: ${generator._id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_GENERATOR_DELETED); // Sikeres törlés üzenet
});

// A vezérlő által exportált handler függvények
export default {
    getGeneratorsDashboard,      // Eredménygenerátorok dashboard oldal
    getNewGeneratorForm,         // Új eredménygenerátor űrlap
    createNewGenerator,          // Új eredménygenerátor létrehozása
    updateGeneratorStatusById,   // Eredménygenerátor státuszának frissítése
    getEditGeneratorForm,        // Eredménygenerátor szerkesztő űrlap
    updateGeneratorById,         // Eredménygenerátor frissítése
    deleteGeneratorById          // Eredménygenerátor törlése
};

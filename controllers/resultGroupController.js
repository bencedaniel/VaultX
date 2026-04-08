// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Eredménycsoportokkal kapcsolatos adatkezelő függvények importálása
import {
    getResultGroupsByEvent,              // Eseményhez tartozó eredménycsoportok lekérdezése
    getResultGroupById,                  // Egy adott eredménycsoport lekérdezése ID alapján
    getGroupFormData,                    // Eredménycsoport űrlaphoz szükséges adatok lekérdezése
    updateResultGroup,                   // Eredménycsoport adatainak frissítése
    createResultGroup,                   // Új eredménycsoport létrehozása
    deleteResultGroup,                   // Eredménycsoport törlése
    generateGroupsForActiveGenerators    // Aktív generátorokhoz tartozó csoportok generálása
} from '../DataServices/resultGroupData.js';

/**
 * @route GET /result/groups/dashboard
 * @desc Eredménycsoportok dashboard oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, event)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getResultGroupsDashboard = asyncHandler(async (req, res) => {
    const resultGroups = await getResultGroupsByEvent(res.locals.selectedEvent?._id); // Eseményhez tartozó eredménycsoportok lekérdezése
    res.render("resultGroup/dashboard", {
        resultGroups: resultGroups,                       // Eredménycsoportok listája
        rolePermissons: req.user?.role?.permissions,      // Felhasználó jogosultságai
        failMessage: req.session.failMessage,             // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,       // Sikeres művelet üzenete
        user: req.user                                    // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /result/groups/edit/:id
 * @desc Eredménycsoport szerkesztő űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, params)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getEditResultGroupForm = asyncHandler(async (req, res) => {
    const resultGroups = await getResultGroupById(req.params.id); // Eredménycsoport lekérdezése ID alapján
    if (!resultGroups) {
        req.session.failMessage = MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND;
        return res.redirect('/result/groups/dashboard');
    }
    // Szükséges adatok lekérdezése az űrlaphoz
    const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
  
    res.render("resultGroup/editResultGroup", {
        categories: categories,                               // Kategóriák listája
        formData: resultGroups,                               // Szerkesztendő eredménycsoport adatai
        resultCalcs: calcTemplates,                           // Számítási sablonok listája
        timetableParts: timetableParts,                       // Időbeosztás-részek
        timetablePartsRound1: timetablePartsRound1,           // 1. forduló időbeosztásai
        timetablePartsRound2: timetablePartsRound2,           // 2. forduló időbeosztásai
        rolePermissons: req.user?.role?.permissions,          // Felhasználó jogosultságai
        failMessage: req.session.failMessage,                 // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,           // Sikeres művelet üzenete
        user: req.user                                        // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/groups/edit/:id
 * @desc Eredménycsoport frissítése
 * @param {Object} req - Express kérés objektum (session, user, params, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const updateResultGroupById = asyncHandler(async (req, res) => {
    const resultGroupDoc = await updateResultGroup(req.params.id, req.body); // Eredménycsoport frissítése az űrlap adataival
    logOperation('RESULT_GROUP_UPDATE', `Result group updated: ${resultGroupDoc?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUP_EDITED; // Sikeres frissítés üzenet
    res.redirect("/result/groups/dashboard"); // Átirányítás a dashboardra
});

/**
 * @route GET /result/groups/new
 * @desc Új eredménycsoport űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getNewResultGroupForm = asyncHandler(async (req, res) => {
    // Szükséges adatok lekérdezése az űrlaphoz
    const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
    res.render("resultGroup/newResultGroup", {
        categories: categories,                               // Kategóriák listája
        formData: req.session.formData || {},                 // Előzőleg megadott űrlapadatok (ha volt hiba)
        resultCalcs: calcTemplates,                           // Számítási sablonok listája
        timetableParts: timetableParts,                       // Időbeosztás-részek
        timetablePartsRound1: timetablePartsRound1,           // 1. forduló időbeosztásai
        timetablePartsRound2: timetablePartsRound2,           // 2. forduló időbeosztásai
        rolePermissons: req.user?.role?.permissions,          // Felhasználó jogosultságai
        failMessage: req.session.failMessage,                 // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,           // Sikeres művelet üzenete
        user: req.user                                        // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /result/groups/new
 * @desc Új eredménycsoport létrehozása
 * @param {Object} req - Express kérés objektum (session, user, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const createNewResultGroup = asyncHandler(async (req, res) => {
    const newResultGroup = await createResultGroup(res.locals.selectedEvent?._id, req.body); // Új eredménycsoport létrehozása
    logOperation('RESULT_GROUP_CREATE', `Result group created: ${newResultGroup._id}`, req.user.username, HTTP_STATUS.CREATED); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUP_CREATED; // Sikeres létrehozás üzenet
    res.redirect("/result/groups/dashboard"); // Átirányítás a dashboardra
});

/**
 * @route DELETE /result/groups/delete/:id
 * @desc Eredménycsoport törlése
 * @param {Object} req - Express kérés objektum (user, params)
 * @param {Object} res - Express válasz objektum (status, send)
 */
const deleteResultGroupById = asyncHandler(async (req, res) => {
    const resultGroupDoc = await deleteResultGroup(req.params.id); // Eredménycsoport törlése ID alapján
    logOperation('RESULT_GROUP_DELETE', `Result group deleted: ${resultGroupDoc?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUP_DELETED; // Sikeres törlés üzenet
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_GROUP_DELETED); // Válasz visszaadása
});

/**
 * @route POST /result/groups/generate
 * @desc Aktív generátorokhoz tartozó eredménycsoportok generálása
 * @param {Object} req - Express kérés objektum (user, event)
 * @param {Object} res - Express válasz objektum (status, send)
 */
const generateResultGroups = asyncHandler(async (req, res) => {
    await generateGroupsForActiveGenerators(res.locals.selectedEvent?._id, req.user.username); // Csoportok generálása
    req.session.successMessage = MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED; // Sikeres generálás üzenet
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.RESULT_GROUPS_GENERATED); // Válasz visszaadása
});

// A vezérlő által exportált handler függvények
export default {
    getResultGroupsDashboard,    // Eredménycsoportok dashboard oldal
    getEditResultGroupForm,      // Eredménycsoport szerkesztő űrlap
    updateResultGroupById,       // Eredménycsoport frissítése
    getNewResultGroupForm,       // Új eredménycsoport űrlap
    createNewResultGroup,        // Új eredménycsoport létrehozása
    deleteResultGroupById,       // Eredménycsoport törlése
    generateResultGroups         // Eredménycsoportok generálása aktív generátorokhoz
};

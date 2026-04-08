// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Pontozólap sablonokkal kapcsolatos adatkezelő függvények importálása
import { 
    getAllScoreSheetTemplates,     // Összes pontozólap sablon lekérdezése
    getScoreSheetTemplateById,     // Egy adott sablon lekérdezése ID alapján
    getAllCategories,              // Összes kategória lekérdezése
    getCategoriesByIds,            // Kategóriák lekérdezése ID-k alapján
    createScoreSheetTemplate,      // Új pontozólap sablon létrehozása
    updateScoreSheetTemplate,      // Pontozólap sablon adatainak frissítése
    deleteScoreSheetTemplate,      // Pontozólap sablon törlése
    parseJSONArrayField,           // JSON tömb mező feldolgozása
    validateCategoriesAgegroup,    // Kategóriák korcsoportjának validálása
    deleteImageFile                // Kép fájl törlése
} from '../DataServices/scoreSheetTemplateData.js';

/**
 * @route GET /scoresheets/dashboard
 * @desc Pontozólap sablonok dashboard oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getScoreSheetTemplatesDashboard = asyncHandler(async function (req, res) {
    const sheets = await getAllScoreSheetTemplates(); // Sablonok lekérdezése

    res.render('ssTemp/dashboard', {
        ssTemps: sheets,                                 // Sablonok listája
        rolePermissons: req.user?.role?.permissions,     // Felhasználó jogosultságai
        failMessage: req.session.failMessage,            // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,      // Sikeres művelet üzenete
        user: req.user                                   // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /scoresheets/create
 * @desc Új pontozólap sablon űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getCreateScoreSheetTemplateForm = asyncHandler(async function (req, res) {
    const categorys = await getAllCategories(); // Kategóriák lekérdezése

    res.render('ssTemp/newScoreSheet', {
        categorys: categorys,                           // Kategóriák listája
        formData: req.session.formData,                 // Előzőleg megadott űrlapadatok (ha volt hiba)
        rolePermissons: req.user?.role?.permissions,    // Felhasználó jogosultságai
        failMessage: req.session.failMessage,           // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,     // Sikeres művelet üzenete
        user: req.user                                  // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /scoresheets/create
 * @desc Új pontozólap sablon létrehozása
 * @param {Object} req - Express kérés objektum (session, user, body, file)
 * @param {Object} res - Express válasz objektum (redirect, render, session üzenetek)
 */
const createNewScoreSheetTemplate = async function (req, res) {
    const forerr = req.body; // Hibakezeléshez szükséges adatok
    logDebug('POST /create body', JSON.stringify(req.body)); // Bemenet naplózása
    try {
        // JSON tömb mezők feldolgozása
        const outputFieldList = parseJSONArrayField(req.body.outputFieldList, 'outputFieldList');
        const inputFieldList = parseJSONArrayField(req.body.inputFieldList, 'inputFieldList');
        // Háttérkép elérési útjának meghatározása
        const bgImage = req.file
            ? `/static/uploads/${req.file.filename}`
            : (req.body.bgImage || '');

        // Payload összeállítása az adatbázis művelethez
        const payload = {
            TestType: req.body.TestType,
            typeOfScores: req.body.typeOfScores,
            numberOfJudges: Number(req.body.numberOfJudges),
            CategoryId: req.body.Category,
            outputFieldList,
            inputFieldList,
            bgImage: bgImage
        };

        const sheet = await createScoreSheetTemplate(payload); // Sablon létrehozása
        req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_CREATED; // Sikeres létrehozás üzenet
        return res.redirect('/scoresheets/dashboard'); // Átirányítás a dashboardra
    } catch (err) {
        logError('SHEET_CREATION_ERROR', err?.message || String(err), `User: ${req.user.username}`); // Hiba naplózása
        const errorMessage = err?.code === 11000
            ? 'Duplicate template combination (TestType, typeOfScores, numberOfJudges, CategoryId).'
            : (err?.message || 'Server error');

        // Hiba esetén az űrlap újratöltése a hibával és a korábbi adatokkal
        return res.render('ssTemp/newScoreSheet', {
            categorys: await getAllCategories(),
            formData: forerr,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: null,
            user: req.user
        });
    }
};

/**
 * @route GET /scoresheets/edit/:id
 * @desc Pontozólap sablon szerkesztő űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, params)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getEditScoreSheetTemplateForm = asyncHandler(async function (req, res) {
    const sheet = await getScoreSheetTemplateById(req.params.id); // Sablon lekérdezése ID alapján
    if (!sheet) {
        req.session.failMessage = MESSAGES.ERROR.TEMPLATE_NOT_FOUND;
        return res.redirect('/scoresheets/dashboard');
    }

    const categorys = await getAllCategories(); // Kategóriák lekérdezése
    res.render('ssTemp/editScoreSheet', {
        categorys: categorys,                           // Kategóriák listája
        formData: sheet,                                // Szerkesztendő sablon adatai
        rolePermissons: req.user?.role?.permissions,    // Felhasználó jogosultságai
        failMessage: req.session.failMessage,           // Sikertelen művelet üzenete
        successMessage: req.session.successMessage,     // Sikeres művelet üzenete
        user: req.user                                  // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /scoresheets/edit/:id
 * @desc Pontozólap sablon frissítése
 * @param {Object} req - Express kérés objektum (session, user, params, body, file)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const updateScoreSheetTemplateById = asyncHandler(async function (req, res) {
        // Kategóriák lekérdezése és validálása
        const categories = await getCategoriesByIds(req.body.Category);
        validateCategoriesAgegroup(categories);

        const old = await getScoreSheetTemplateById(req.params.id); // Régi sablon lekérdezése
        if (!old) {
            req.session.failMessage = MESSAGES.ERROR.TEMPLATE_NOT_FOUND;
            return res.redirect('/scoresheets/dashboard');
        }

        // JSON tömb mezők feldolgozása
        const outputFieldList = parseJSONArrayField(req.body.outputFieldList, 'outputFieldList');
        const inputFieldList = parseJSONArrayField(req.body.inputFieldList, 'inputFieldList');

        // Új háttérkép elérési útjának meghatározása
        const newBgImage = req.file
            ? `/static/uploads/${req.file.filename}`
            : (req.body.bgImage || old.bgImage || '');

        // Sablon frissítése az adatbázisban
        const sheet = await updateScoreSheetTemplate(req.params.id, {
            TestType: req.body.TestType,
            typeOfScores: req.body.typeOfScores,
            numberOfJudges: Number(req.body.numberOfJudges),
            CategoryId: req.body.Category,
            outputFieldList,
            inputFieldList,
            bgImage: newBgImage
        });

        // Ha új fájl jött és változott az URL, töröljük a régit
        if (req.file && old.bgImage && old.bgImage !== newBgImage) {
            await deleteImageFile(old.bgImage);
        }

        req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_UPDATED; // Sikeres frissítés üzenet
        return res.redirect('/scoresheets/dashboard'); // Átirányítás a dashboardra
    
} );

/**
 * @route DELETE /scoresheets/delete/:id
 * @desc Pontozólap sablon törlése
 * @param {Object} req - Express kérés objektum (user, params)
 * @param {Object} res - Express válasz objektum (status, json)
 */
const deleteScoreSheetTemplateById = asyncHandler(async function (req, res) {
    const sheet = await deleteScoreSheetTemplate(req.params.id); // Sablon törlése ID alapján
    if (!sheet) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.TEMPLATE_NOT_FOUND });
    return res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_UPDATED }); // Sikeres törlés üzenet
});

// A vezérlő által exportált handler függvények
export default {
    getScoreSheetTemplatesDashboard,    // Pontozólap sablonok dashboard oldal
    getCreateScoreSheetTemplateForm,    // Új pontozólap sablon űrlap
    createNewScoreSheetTemplate,        // Új pontozólap sablon létrehozása
    getEditScoreSheetTemplateForm,      // Pontozólap sablon szerkesztő űrlap
    updateScoreSheetTemplateById,       // Pontozólap sablon frissítése
    deleteScoreSheetTemplateById        // Pontozólap sablon törlése
};

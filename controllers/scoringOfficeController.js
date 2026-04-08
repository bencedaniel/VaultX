// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';
// HTTP státusz és üzenet konstansok importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
// Pontszám számítási logika importálása
import { calculateScore } from '../LogicServices/scoreCalculations.js';
// Ponttábla szinkronizálási logika importálása
import { syncScoreTable } from '../LogicServices/scoreSync.js';
// Score sheet adatelérési függvények importálása
import { 
    getEventScoreSheets, 
    getScoreSheetById, 
    getEventScores, 
    getScoreById, 
    getSubmittedScoreSheets, 
    saveScoreSheet, 
    updateScoreSheet 
} from '../DataServices/scoreSheetData.js';
// Pontozáshoz szükséges adatelérési függvények importálása
import { 
    getTimetablePartsByEvent, 
    getTimetablePartById, 
    getJudgeById, 
    getEntryById, 
    getTableMapping, 
    getEventById, 
    getScoreSheetTemplate 
} from '../DataServices/scoringData.js';

/**
 * @route GET /scoring/office/dashboard
 * @desc Iroda dashboard: összes score sheet megjelenítése az aktuális eseményhez
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, redirect)
 */
const getOfficeDashboard = asyncHandler(async function (req, res) {
    // Aktuális eseményhez tartozó összes score sheet lekérése
    const scoreSheets = await getEventScoreSheets(res.locals.selectedEvent._id);

    // Iroda dashboard oldal renderelése
    res.render('scoringOffice/dashboard', {
        scoreSheets: scoreSheets,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Üzenetek törlése a sessionből
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /scoring/office/scoresheet/edit/:id
 * @desc Szerkesztő űrlap megjelenítése egy adott score sheet-hez
 * @param {Object} req - Express kérés objektum (params, session)
 * @param {Object} res - Express válasz objektum (render, redirect)
 */
const getEditScoresheetForm = asyncHandler(async function (req, res) {
    // Szerkesztendő score sheet lekérése azonosító alapján
    const scoresheet = await getScoreSheetById(req.params.id);
    // Ha nincs ilyen score sheet, hibaüzenet és visszairányítás
    if (!scoresheet) {
        req.session.failMessage = MESSAGES.ERROR.SCORE_SHEET_NOT_FOUND || MESSAGES.ERROR.SCORE_NOT_FOUND;
        return res.redirect('/scoring/office/dashboard');
    }

    // Szerkesztő űrlap renderelése bírói nézettel
    res.render('scoringJudge/editscoresheetjudge', {
        scoresheet: scoresheet,
        judgeName: scoresheet.Judge.userId.fullname,
        judgesTable: scoresheet.Judge.table,
        event: scoresheet.EventId,
        scoresheetTemp: scoresheet.TemplateId,
        timetablePart: scoresheet.TimetablePartId,
        entry: scoresheet.EntryId,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
});

/**
 * @route POST /scoring/office/scoresheet/edit/:id
 * @desc Score sheet frissítése szerkesztés után
 * @param {Object} req - Express kérés objektum (body, params, session)
 * @param {Object} res - Express válasz objektum (redirect)
 * @param {string} redirect - Hova irányítson sikeres mentés után
 */
const updateScoresheetById = asyncHandler(async function (req, res, redirect) {
    // A dinamikus pontbeviteli mezők tömbösítése egységes belső formátumra
    const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
        id: key,
        value: String(value)
    }));
    req.body.inputDatas = inputDatasArray;
    delete req.body.ScoreSheetInput;

    // Nevezés betöltése és összpontszám számítása a kategória szabályai szerint
    const entry = await getEntryById(req.body.EntryId);
    req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

    // Score sheet frissítése és az összesítő ponttábla szinkronizálása
    await updateScoreSheet(req.params.id, req.body, req.body.TimetablePartId, req.body.EntryId);
    await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

    // Sikeres mentés után visszairányítás
    req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_SAVED;
    return res.redirect(redirect);
});



/**
 * @route GET /scoring/office/scoresheet/new
 * @desc Új score sheet kiválasztó oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render)
 */
const getNewScoresheetSelectionForm = asyncHandler(async function (req, res) {
    // Aktuális eseményhez tartozó menetrendi részek lekérése
    const timetableParts = await getTimetablePartsByEvent(res.locals.selectedEvent._id);

    // Új score sheet kiválasztó oldal renderelése
    res.render('scoringOffice/createscoresheet', {
        timetableParts: timetableParts,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Üzenetek törlése a sessionből
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /scoring/office/scoresheet/new
 * @desc Új score sheet kiválasztásának kezelése
 * @param {Object} req - Express kérés objektum (body, session)
 * @param {Object} res - Express válasz objektum (redirect)
 */
const handleNewScoresheetSelection = asyncHandler(async function (req, res) {
    // Kiválasztott bíró azonosítójának eltárolása sessionben
    req.session.judgeID = req.body.Table;
    // Átirányítás az új score sheet létrehozó oldalra
    res.redirect('/scoring/office/newscoresheet/' + req.body.entry + '/' + req.body.TTprogram);

    // Üzenetek törlése a sessionből
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /scoring/office/newscoresheet/:entryid/:tpid
 * @desc Új score sheet űrlap megjelenítése irodai nézetben
 * @param {Object} req - Express kérés objektum (params, session)
 * @param {Object} res - Express válasz objektum (render, redirect)
 */
const getOfficeNewScoresheetForm = asyncHandler(async function (req, res) {
    const judgeID = req.session.judgeID;
    
    const timetablePart = await getTimetablePartById(req.params.tpid);
    if (!timetablePart) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring/office/dashboard');
    }
    
    // Filter judges list to only current judge
    timetablePart.JudgesList = timetablePart.JudgesList.filter(j => j.JudgeUserID.toString() === judgeID.toString());
    
    // Check if judge already submitted for this entry
    const scoreSheetsSubmitted = await getSubmittedScoreSheets(
        req.params.tpid,
        req.params.entryid,
        res.locals.selectedEvent._id,
        judgeID
    );
    
    if (scoreSheetsSubmitted.length > 0) {
        req.session.failMessage = MESSAGES.ERROR.SCORE_ALREADY_SUBMITTED;
        return res.redirect('/scoring/office/dashboard');
    }
    
    // Check if judge is authorized for this timetable part
    if (timetablePart.JudgesList.length === 0) {
        req.session.failMessage = MESSAGES.ERROR.NOT_ASSIGNED_AS_JUDGE;
        return res.redirect('/scoring/office/dashboard');
    }
    
    // Bíró adatok lekérése
    const judgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
    const judgeName = judgeUser.fullname;
    const tableByJudge = timetablePart.JudgesList[0].Table;

    // Asztalhoz tartozó szerep lekérése
    const roleOfTable = await getTableMapping(tableByJudge, timetablePart.TestType);
    if (!roleOfTable) {
        logWarn('NO_ROLE_MAPPING', `No RoleOfTable found for Table: ${tableByJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}`, `User: ${req.user.username}`);
        req.session.failMessage = MESSAGES.ERROR.NO_ROLE_MAPPING;
        return res.redirect('/scoring/office/dashboard');
    }

    // Nevezés részleteinek lekérése
    const entry = await getEntryById(req.params.entryid);
    if (!entry) {
        req.session.failMessage = MESSAGES.ERROR.ENTRY_NOT_FOUND;
        return res.redirect('/scoring/office/dashboard');
    }

    // Score sheet sablon lekérése teszttípus/kategória/bírószám/szerep alapján
    const scoresheetTemp = await getScoreSheetTemplate(
        timetablePart.TestType,
        entry.category._id,
        timetablePart.NumberOfJudges,
        roleOfTable.Role
    );

    if (!scoresheetTemp) {
        req.session.failMessage = MESSAGES.ERROR.NO_SCORE_SHEET_TEMPLATE;
        logWarn('NO_SCORESHEET_TEMPLATE', `No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${roleOfTable.Role}`, `User: ${req.user.username}`);
        return res.redirect('/scoring/office/dashboard');
    }

    // Esemény adatok lekérése a nézethez
    const event = await getEventById(res.locals.selectedEvent._id);

    // Új score sheet űrlap renderelése
    res.render('scoringJudge/officenewscoresheetjudge', {
        judgeID: judgeID,
        judgeName: judgeName,
        judgesTable: tableByJudge,
        event: event,
        scoresheetTemp: scoresheetTemp,
        formData: { parent: req.params.tpid },
        timetablePart: timetablePart,
        entry: entry,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Üzenetek törlése a sessionből
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /scoring/office/newscoresheet
 * @desc Új score sheet létrehozása irodai nézetből
 * @param {Object} req - Express kérés objektum (body, session)
 * @param {Object} res - Express válasz objektum (redirect)
 */
const createOfficeNewScoresheet = asyncHandler(async function (req, res) {
    // A dinamikus pontbeviteli mezők tömbösítése egységes belső formátumra
    const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
        id: key,
        value: String(value)
    }));
    req.body.inputDatas = inputDatasArray;
    delete req.body.ScoreSheetInput;

    // Nevezés betöltése és összpontszám számítása a kategória szabályai szerint
    const entry = await getEntryById(req.body.EntryId);
    req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

    // Score sheet mentése és az összesítő ponttábla szinkronizálása
    await saveScoreSheet(req.body, req.body.TimetablePartId, req.body.EntryId);
    await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

    // Sikeres mentés után visszairányítás
    req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_SAVED;
    return res.redirect('/scoring/office/dashboard');

});

/**
 * @route GET /scoring/office/scores
 * @desc Az aktuális eseményhez tartozó összes pont megjelenítése
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render)
 */
const getScoresList = asyncHandler(async function (req, res) {
    // Aktuális eseményhez tartozó összes pont lekérése
    const scores = await getEventScores(res.locals.selectedEvent._id);
    // Pontok listázó oldal renderelése
    res.render('scoringOffice/scores', {
        scores: scores,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Üzenetek törlése a sessionből
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /scoring/office/scores/recalculate/:id
 * @desc Pont újraszámítása azonosító alapján
 * @param {Object} req - Express kérés objektum (params, session)
 * @param {Object} res - Express válasz objektum (status, send, redirect)
 */
const recalculateScoreById = asyncHandler(async function (req, res) {
    // Pont azonosító alapján lekérése
    const score = await getScoreById(req.params.id);
    // Ha nincs ilyen pont, hibaüzenet és visszairányítás
    if (!score) {
        req.session.failMessage = MESSAGES.ERROR.SCORE_NOT_FOUND;
        return res.redirect('/scoring/office/scores');
    }
    // Pont újraszámítása és szinkronizálása
    req.session.successMessage = MESSAGES.SUCCESS.SCORE_RECALCULATED;
    await syncScoreTable(score.timetablepart, score.entry, res.locals.selectedEvent._id);

    // Sikeres újraszámítás után státusz és üzenet visszaadása
    return res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.SCORE_RECALCULATED);
});

export default {
    getOfficeDashboard,
    getEditScoresheetForm,
    updateScoresheetById,
    getNewScoresheetSelectionForm,
    handleNewScoresheetSelection,
    getOfficeNewScoresheetForm,
    createOfficeNewScoresheet,
    getScoresList,
    recalculateScoreById
};

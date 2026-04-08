// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// Üzenetek konstansainak importálása
import { MESSAGES } from '../config/index.js';

// Pontszám számítási logika importálása
import { calculateScore } from '../LogicServices/scoreCalculations.js';

// Ponttábla szinkronizálási logika importálása
import { syncScoreTable } from '../LogicServices/scoreSync.js';

// Score sheet adatelérési függvények importálása
import { getSubmittedScoreSheets, saveScoreSheet } from '../DataServices/scoreSheetData.js';

// Bírói pontozáshoz szükséges adatelérési függvények importálása
import { 
    getTodaysTimetable, 
    getTimetablePartsByDaily, 
    getTimetablePartById, 
    getJudgeById, 
    getEntriesByEvent, 
    getEntryById, 
    getTableMapping, 
    getEventById, 
    getScoreSheetTemplate, 
    getTimetablePartByIdWithDaily
} from '../DataServices/scoringData.js';

/**
 * @route GET /scoring
 * @desc Show judge scoring dashboard with today's timetable parts
 * @param {Object} req - Express kérés objektum (session, user)
 * @param {Object} res - Express válasz objektum (render, redirect)
 */
const getScoringDashboard = asyncHandler(async function (req, res) {
    // Mai naphoz tartozó napi menetrend lekérése
    const day = await getTodaysTimetable();

    // Ha nincs mai menetrend, hibaüzenet és visszairányítás dashboardra
    if (!day) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND_FOR_THIS_DAY;
        return res.redirect('/dashboard');
    }

    // A mai naphoz tartozó programrészek (timetable part-ok) lekérése
    const timetableParts = await getTimetablePartsByDaily(day._id);

    // Bírói pontozó dashboard renderelése
    res.render('scoringJudge/dashboard', {
        timetableParts: timetableParts,
        day: day,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /scoring/program/:id
 * @desc Show program details for a specific timetable part for judge
 * @param {Object} req - Express kérés objektum (params, user, session)
 * @param {Object} res - Express válasz objektum (render, redirect)
 */
const getProgramDetails = asyncHandler(async function (req, res) {
    // Kiválasztott menetrendi rész lekérése
    const timetablePart = await getTimetablePartById(req.params.id);

    // Rajzolás hiányában a program nem pontozható
    if (timetablePart.drawingDone === false) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring');
    }

    // Konfliktusellenőrzés hiányában a program nem pontozható
    if (timetablePart.conflictsChecked === false) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring');
    }

    // Nem létező menetrendi rész esetén visszairányítás
    if (!timetablePart) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring');
    }

    let JudgeName = '';
    let tablebyJudge = '';

    // Csak az aktuális bíró hozzárendeléseinek megtartása
    timetablePart.JudgesList = timetablePart.JudgesList.filter(
        j => j.JudgeUserID.toString() === req.user._id.toString()
    );

    // Jogosultság ellenőrzés: ha a bíró nincs hozzárendelve ehhez a programhoz
    if (timetablePart.JudgesList.length === 0) {
        JudgeName = 'Not authorized judge';
    } else {
        // Bíró adatainak és asztalának betöltése
        const JudgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
        JudgeName = JudgeUser.fullname;
        tablebyJudge = timetablePart.JudgesList[0].Table;
    }

    // Korábban beküldött bírói score sheet-ek lekérése
    const ScoreSheetsSubmitted = await getSubmittedScoreSheets(
        req.params.id,
        null,
        res.locals.selectedEvent._id,
        req.user._id
    );

    // Aktuális esemény nevezéseinek lekérése
    const entries = await getEntriesByEvent(res.locals.selectedEvent._id);

    // Program részletező oldal renderelése
    res.render('scoringJudge/perprogram', {
        ScoreSheetsSubmitted: ScoreSheetsSubmitted,
        tablebyJudge: tablebyJudge,
        judgeName: JudgeName,
        timetablePart: timetablePart,
        entries: entries,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /scoring/newscoresheet/:entryid/:tpid
 * @desc Show new scoresheet form for judge
 * @param {Object} req - Express kérés objektum (params, user, session)
 * @param {Object} res - Express válasz objektum (render, redirect)
 */
const getNewScoresheetForm = asyncHandler(async function (req, res) {
    // Aktuális bíró azonosítója
    const judgeID = req.user._id;
    
    // Menetrendi rész lekérése a napi menetrend kapcsolattal együtt
    const timetablePart = await getTimetablePartByIdWithDaily(req.params.tpid);
    
    // Csak az aktuális bíró hozzárendeléseinek megtartása
    timetablePart.JudgesList = timetablePart.JudgesList.filter(j => j.JudgeUserID.toString() === judgeID.toString());
    
    // Ellenőrzés: a bíró adott nevezésre már küldött-e be pontlapot
    const scoreSheetsSubmitted = await getSubmittedScoreSheets(
        req.params.tpid,
        req.params.entryid,
        res.locals.selectedEvent._id,
        judgeID
    );
    
    // Dupla beküldés tiltása
    if (scoreSheetsSubmitted.length > 0) {
        req.session.failMessage = MESSAGES.ERROR.SCORE_ALREADY_SUBMITTED;
        return res.redirect('/scoring/program/' + req.params.tpid);
    }
    
    // Jogosultság ellenőrzés: a bíró hozzá van-e rendelve a menetrendi részhez
    if (timetablePart.JudgesList.length === 0) {
        req.session.failMessage = MESSAGES.ERROR.NOT_ASSIGNED_AS_JUDGE;
        return res.redirect('/scoring');
    }
    
    // Bíró nevének és asztalszámának meghatározása
    const judgeUser = await getJudgeById(timetablePart.JudgesList[0].JudgeUserID);
    const judgeName = judgeUser.fullname;
    const tableByJudge = timetablePart.JudgesList[0].Table;
    
    // Asztal-hozzárendelés alapján pontozói szerep meghatározása
    const roleOfTable = await getTableMapping(tableByJudge, timetablePart.TestType);

    // Ha nincs mapping, nem határozható meg a pontlap típus
    if (!roleOfTable) {
        logWarn('NO_ROLE_MAPPING', `No RoleOfTable found for Table: ${tableByJudge}, TestType: ${timetablePart.TestType.toLocaleLowerCase()}`, `User: ${req.user.username}`);
        req.session.failMessage = MESSAGES.ERROR.NO_ROLE_MAPPING;
        return res.redirect('/scoring');
    }
    
    // Nevezés részleteinek lekérése
    const entry = await getEntryById(req.params.entryid);
    if (!entry) {
        req.session.failMessage = MESSAGES.ERROR.ENTRY_NOT_FOUND;
        return res.redirect('/scoring');
    }
    
    // Védőellenőrzés: menetrendi rész hiány esetén visszairányítás
    if (!timetablePart) {
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_FOUND;
        return res.redirect('/scoring');
    }
    
    // A megfelelő score sheet sablon lekérése teszttípus/kategória/bírószám/szerep alapján
    const scoresheetTemp = await getScoreSheetTemplate(
        timetablePart.TestType,
        entry.category._id,
        timetablePart.NumberOfJudges,
        roleOfTable.Role
    );
    
    // Ha nincs sablon, pontlap nem hozható létre
    if (!scoresheetTemp) {
        req.session.failMessage = MESSAGES.ERROR.NO_SCORE_SHEET_TEMPLATE;
        logWarn('NO_SCORESHEET_TEMPLATE', `No ScoreSheetTemp found for TestType: ${timetablePart.TestType}, CategoryId: ${entry.category.CategoryDispName}, numberOfJudges: ${timetablePart.NumberOfJudges}, typeOfScores: ${roleOfTable.Role}`, `User: ${req.user.username}`);
        return res.redirect('/scoring/program/' + req.params.tpid);
    }
    
    // Esemény adatok lekérése a nézethez
    const event = await getEventById(res.locals.selectedEvent._id);
    
    // Új bírói score sheet űrlap renderelése
    res.render('scoringJudge/newscoresheetjudge', {
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
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route POST /scoring/newscoresheet
 * @desc Create new scoresheet for judge
 * @param {Object} req - Express kérés objektum (body, session)
 * @param {Object} res - Express válasz objektum (redirect)
 */
const createNewScoresheet = asyncHandler(async function (req, res) {
        // A dinamikus pontbeviteli mezők tömbösítése egységes belső formátumra
        const inputDatasArray = Object.entries(req.body.ScoreSheetInput).map(([key, value]) => ({
            id: key,
            value: String(value)
        }));

        // A normalizált bemenet áthelyezése és a nyers mező törlése
        req.body.inputDatas = inputDatasArray;
        delete req.body.ScoreSheetInput;

        // Nevezés betöltése és összpontszám számítása a kategória szabályai szerint
        const entry = await getEntryById(req.body.EntryId);
        req.body.totalScoreBE = calculateScore(inputDatasArray, entry.category);

        // Score sheet mentése és az összesítő ponttábla szinkronizálása
        await saveScoreSheet(req.body, req.body.TimetablePartId, req.body.EntryId);
        await syncScoreTable(req.body.TimetablePartId, req.body.EntryId, res.locals.selectedEvent._id);

        // Sikeres mentés után visszairányítás az adott program oldalára
        req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_SAVED;
        return res.redirect('/scoring/program/' + req.body.TimetablePartId);

});

// A vezérlő által exportált handler függvények
export default {
    getScoringDashboard,
    getProgramDetails,
    getNewScoresheetForm,
    createNewScoresheet
};

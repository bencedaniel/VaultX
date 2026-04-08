// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// Üzenetek konstansainak importálása
import { MESSAGES } from '../config/index.js';

// Eredményszámítási logika importálása (különböző szintek)
import { FirstLevel, SecondLevel, TotalLevel } from '../LogicServices/resultCalculations.js';

// Eredménycsoportokkal kapcsolatos adatkezelő függvények importálása
import {
    getResultGroupsForResults,    // Eredménycsoportok lekérdezése dashboardhoz
    getResultGroupWithDetails     // Eredménycsoport részletes lekérdezése
} from '../DataServices/resultGroupData.js';

/**
 * @route GET /result/
 * @desc Eredmények dashboard oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, event)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getResultsDashboard = asyncHandler(async (req, res) => {
    const resultGroups = await getResultGroupsForResults(res.locals.selectedEvent?._id); // Eredménycsoportok lekérdezése az aktuális eseményhez
    res.render("results/dashboard", {
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
 * @route GET /result/detailed/:id/:part
 * @desc Részletes eredmények megjelenítése egy adott eredménycsoporthoz és részhez
 * @param {Object} req - Express kérés objektum (session, user, params)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getDetailedResults = asyncHandler(async (req, res) => {
    const resultGroupDoc = await getResultGroupWithDetails(req.params.id); // Eredménycsoport részletes lekérdezése

    // Ha nem található a csoport, hibaüzenet és visszairányítás
    if (!resultGroupDoc) {
        req.session.failMessage = MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND;
        return res.redirect("/result");
    }
    // Ha a kért rész nincs definiálva, hibaüzenet és visszairányítás
    if((req.params.part === 'R1F' && !resultGroupDoc.round1First) ||
       (req.params.part === 'R1S' && !resultGroupDoc.round1Second) ||
       (req.params.part === 'R2F' && !resultGroupDoc.round2First)){
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_DEFINED;
        return res.redirect("/result");
    }
    // Első szintű részletes eredmények (pl. fordulók)
    if(['R1F', 'R1S', 'R2F'].includes(req.params.part)){
        const data =  await FirstLevel(resultGroupDoc,req.params.part); // Eredmények számítása első szinten

        res.render("results/detailedResults", {
            title: resultGroupDoc.category.CategoryDispName + " -- " + data.title, // Oldal címe
            resultGroup: resultGroupDoc,                                           // Eredménycsoport adatai
            pointDetailsLevel: 1,                                                  // Részletezettségi szint
            param: req.params.part,                                                // Kért rész paramétere
            results: data.results.sort((a, b) => b.TotalScore - a.TotalScore),     // Eredmények pontszám szerint rendezve
            rolePermissons: req.user?.role?.permissions,                           // Felhasználó jogosultságai
            failMessage: req.session.failMessage,                                  // Sikertelen művelet üzenete
            successMessage: req.session.successMessage,                            // Sikeres művelet üzenete
            user: req.user                                                         // Bejelentkezett felhasználó adatai
        });
    }
    // Második szintű részletes eredmények (pl. összesített fordulók)
    else if(['R1', 'R2'].includes(req.params.part)){
        const data = await SecondLevel(resultGroupDoc,req.params.part); // Eredmények számítása második szinten

        res.render("results/detailedResults", {
            title: resultGroupDoc.category.CategoryDispName + " -- " + data.title, // Oldal címe
            resultGroup: resultGroupDoc,                                           // Eredménycsoport adatai
            pointDetailsLevel: 2,                                                  // Részletezettségi szint
            results: data.results.sort((a, b) => b.TotalScore - a.TotalScore),     // Eredmények pontszám szerint rendezve
            rolePermissons: req.user?.role?.permissions,                           // Felhasználó jogosultságai
            failMessage: req.session.failMessage,                                  // Sikertelen művelet üzenete
            successMessage: req.session.successMessage,                            // Sikeres művelet üzenete
            user: req.user                                                         // Bejelentkezett felhasználó adatai
        });

    }
    // Harmadik szintű (összesített) eredmények
    else if(req.params.part === 'total'){
        const data = await TotalLevel(resultGroupDoc); // Összesített eredmények számítása
        
        res.render("results/detailedResults", {
            title: resultGroupDoc.category.CategoryDispName + " -- Total Results", // Oldal címe
            resultGroup: resultGroupDoc,                                           // Eredménycsoport adatai
            pointDetailsLevel: 3,                                                  // Részletezettségi szint
            results: data.results.sort((a, b) => b.TotalScore - a.TotalScore),     // Eredmények pontszám szerint rendezve
            rolePermissons: req.user?.role?.permissions,                           // Felhasználó jogosultságai
            failMessage: req.session.failMessage,                                  // Sikertelen művelet üzenete
            successMessage: req.session.successMessage,                            // Sikeres művelet üzenete
            user: req.user                                                         // Bejelentkezett felhasználó adatai
        });
    }
    // Hibás paraméter esetén hibaüzenet és visszairányítás
     else {
        req.session.failMessage = MESSAGES.ERROR.INVALID_TIMETABLE_PART;
        return res.redirect("/result");
    }
    req.session.failMessage = null;
    req.session.successMessage = null;
});

// A vezérlő által exportált handler függvények
export default {
    getResultsDashboard, // Eredmények dashboard oldal
    getDetailedResults   // Részletes eredmények megjelenítése
};

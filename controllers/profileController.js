// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Felhasználói adatokkal kapcsolatos adatkezelő függvények importálása
import {
    getUserById,             // Felhasználó lekérdezése ID alapján
    updateUserProfile,       // Felhasználói profil frissítése
    getUserProfileFormData   // Profil szerkesztő űrlaphoz szükséges adatok lekérdezése
} from '../DataServices/userData.js';

/**
 * @route GET /profile/:id
 * @desc Felhasználói profil szerkesztő űrlap megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, params)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getProfileEditForm = asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id); // Felhasználó lekérdezése ID alapján
    const { roleList } = await getUserProfileFormData(); // Elérhető szerepkörök lekérdezése
    res.render("selfEdit", {
        formID: req.params.id,                              // Szerkesztett felhasználó azonosítója
        formData: user,                                     // Felhasználó adatai
        roleList,                                           // Szerepkörök listája
        rolePermissons: req.user?.role?.permissions,        // Bejelentkezett felhasználó jogosultságai
        user: req.user,                                     // Bejelentkezett felhasználó adatai
        successMessage: req.session.successMessage,         // Sikeres művelet üzenete
        failMessage: req.session.failMessage                // Sikertelen művelet üzenete
    });
    // Üzenetek törlése a session-ből, hogy ne jelenjenek meg újratöltéskor
    req.session.successMessage = null;
    req.session.failMessage = null;
});

/**
 * @route POST /profile/:id
 * @desc Felhasználói profil frissítése
 * @param {Object} req - Express kérés objektum (session, user, params, body)
 * @param {Object} res - Express válasz objektum (redirect, session üzenetek)
 */
const updateProfile = asyncHandler(async (req, res) => {
    await updateUserProfile(req.params.id, req.body); // Profil frissítése az űrlap adataival
    logOperation('USER_UPDATE', `User updated: ${req.user.username}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
    req.session.successMessage = MESSAGES.SUCCESS.PROFILE_UPDATED; // Sikeres frissítés üzenet
    res.redirect(`/profile/${req.params.id}`); // Visszairányítás a profil oldalra
});

// A vezérlő által exportált handler függvények
export default {
    getProfileEditForm, // Felhasználói profil szerkesztő űrlap
    updateProfile       // Felhasználói profil frissítése
};

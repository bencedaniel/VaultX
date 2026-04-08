// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// Dashboard kártyák lekérő függvény importálása
import { getDashCardsByType } from '../DataServices/dashboardData.js';

/**
 * Felhasználói dashboard oldal megjelenítése.
 * @route GET /dashboard
 * @desc Show user dashboard
 *
 * - Lekéri a felhasználói típusú dashboard kártyákat.
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getDashboard = asyncHandler(async (req, res) => {
    // Felhasználói típusú dashboard kártyák lekérése
    const cardsFromDB = await getDashCardsByType('user');
    // Nézet renderelése, session üzenetek, űrlapadatok, jogosultságok és felhasználó átadása
    res.render("dashboard", {
        userrole: req.user.role,
        cardsFromDB,
        successMessage: req.session.successMessage,
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.successMessage = null;
    req.session.failMessage = null;
});

// A vezérlő által exportált handler függvények
export default {
    getDashboard // Felhasználói dashboard oldal megjelenítése
};

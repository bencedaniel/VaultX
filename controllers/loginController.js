// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * @route GET /login
 * @desc Bejelentkezési oldal megjelenítése
 * @param {Object} req - Express kérés objektum (session, user, stb.)
 * @param {Object} res - Express válasz objektum (render, session törlés)
 */
const getLoginPage = asyncHandler(async (req, res) => {
    // Sikertelen bejelentkezés üzenet lekérése a session-ből
    const failMessage = req.session.failMessage;
    // Bejelentkezési oldal renderelése, jogosultságokkal és üzenetekkel
    res.render("login", { 
        failMessage, 
        rolePermissons: req.user?.role?.permissions, 
        successMessage: req.session.successMessage,
        noindex: true // Keresőmotor indexelés tiltása
    });
    // Üzenetek törlése a session-ből, hogy ne jelenjenek meg újratöltéskor
    req.session.failMessage = null;
    req.session.successMessage = null;
});


// A vezérlő által exportált handler függvények
export default {
    getLoginPage // Bejelentkezési oldal megjelenítése
};

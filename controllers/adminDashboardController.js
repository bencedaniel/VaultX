// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// Admin dashboardhoz szükséges adatok lekérő függvény importálása
import { getAdminDashboardData, getOfficeDashboardData } from '../DataServices/adminDashboardData.js';

/**
 * Admin dashboard oldal megjelenítése statisztikákkal.
 * @route GET /admin/dashboard
 * @desc Show admin dashboard with statistics
 *
 * - Lekéri az összes kártyát, felhasználó-, jogosultság- és szerepkörszámot.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
    // Dashboardhoz szükséges adatok lekérése
    const { cards, userCount, permissionCount, roleCount } = await getAdminDashboardData();
    // Felhasználó aktuális szerepkörének jogosultságai
    const rolePermissons = req.user?.role?.permissions;
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render("admin/admindash", {
        cardsFromDB: cards,
        userCount,
        permissionCount,
        roleCount,
        rolePermissons: rolePermissons,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

const getOfficeDashboard = asyncHandler(async (req, res) => {
    // Dashboardhoz szükséges adatok lekérése
    const { cards, userCount, permissionCount, roleCount } = await getOfficeDashboardData();
    // Felhasználó aktuális szerepkörének jogosultságai
    const rolePermissons = req.user?.role?.permissions;
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render("admin/officedash", {
        cardsFromDB: cards,
        userCount,
        permissionCount,
        roleCount,
        rolePermissons: rolePermissons,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

// A vezérlő által exportált handler függvények
export default {
    getAdminDashboard, // Admin dashboard oldal megjelenítése
    getOfficeDashboard // Office dashboard oldal megjelenítése
};

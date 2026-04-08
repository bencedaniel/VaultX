// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Készítők oldal megjelenítése.
 * @route GET /creators
 * @desc Show creators page
 *
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 */
const getCreatorsPage = asyncHandler(async (req, res) => {
    // Nézet renderelése, session üzenetek, űrlapadatok, jogosultságok és felhasználó átadása
    res.render('creators', {
        successMessage: req.session?.successMessage, 
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session?.failMessage,
        formData: req.session?.formData,
        user: req?.user
    });
});

// A vezérlő által exportált handler függvények
export default {
    getCreatorsPage // Készítők oldal megjelenítése
};

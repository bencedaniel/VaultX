// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Felhasználókkal kapcsolatos adatkezelő függvények importálása
import {
    getAllUsersWithRoles,   // Összes felhasználó lekérdezése szerepkörrel
    getUserById,            // Egy adott felhasználó lekérdezése ID alapján
    getUserFormData,        // Felhasználó űrlaphoz szükséges adatok lekérdezése
    updateUser,             // Felhasználó adatainak frissítése
    inactivateUser,         // Felhasználó inaktiválása (törlés helyett)
    resetBan                // Felhasználó kitiltásának visszaállítása
} from '../DataServices/adminUserData.js';

// Felhasználó modell importálása (ha szükséges)
import User from "../models/User.js";


/**
 * Új felhasználó létrehozásához szükséges űrlap megjelenítése.
 * @route GET /admin/newUser
 * @desc Show new user form
 *
 * - Lekéri a szerepkörlistát.
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket és űrlapadatokat törli a válasz után.
 */
const getNewUserForm = asyncHandler(async (req, res) => {
    // Szerepkörlista lekérése az űrlaphoz
    const { roles } = await getUserFormData();
    // Felhasználó aktuális szerepkörének jogosultságai
    const userrole = req.user?.role?.permissions;
    // Nézet renderelése, session üzenetek, űrlapadatok, szerepkörlista és felhasználó átadása
    res.render("admin/newUser", {
        rolePermissons: userrole,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        roleList: roles,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek és űrlapadatok törlése a válasz után
    req.session.successMessage = null;
    req.session.formData = null;
    req.session.failMessage = null;
});

/**
 * Új felhasználó létrehozása POST kérésre.
 * @route POST /admin/newUser
 * @desc Create new user (handled by Validate middleware and Register controller from auth)
 * @note This is called from auth.js Register function via middleware chain
 */
const createNewUser = asyncHandler(async (req, res) => {
    // Megjegyzés: A felhasználó létrehozását az auth.js Register() végzi
    // Ez az export csak a route definíció miatt szükséges
});

/**
 * Felhasználók dashboard oldal megjelenítése.
 * @route GET /admin/dashboard/users
 * @desc Show users dashboard
 *
 * - Lekéri az összes felhasználót szerepkörrel együtt.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getUsersDashboard = asyncHandler(async (req, res) => {
    // Összes felhasználó lekérése szerepkörrel együtt
    const users = await getAllUsersWithRoles();
    // Felhasználó aktuális szerepkörének jogosultságai
    const rolePermissons = req.user?.role?.permissions;

    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render("admin/userdash", {
        rolePermissons: rolePermissons,
        users: users,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Felhasználó szerkesztő űrlap megjelenítése.
 * @route GET /admin/editUser/:id
 * @desc Show edit user form
 *
 * - Lekéri a szerkesztendő felhasználó adatait és a szerepkörlistát.
 * - Átadja a session üzeneteket, jogosultságokat, űrlapadatokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getEditUserForm = asyncHandler(async (req, res) => {
    // Szerkesztendő felhasználó adatainak lekérése
    const user = await getUserById(req.params.id);
    // Szerepkörlista lekérése az űrlaphoz
    const { roles } = await getUserFormData();
    // Nézet renderelése, session üzenetek, jogosultságok, űrlapadatok és felhasználó átadása
    res.render('admin/editUser', {
        failMessage: req.session.failMessage, 
        formData: user,
        userrole: req.user?.role,
        roleList: roles,
        rolePermissons: req.user?.role?.permissions,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Felhasználó adatainak frissítése POST kérésre.
 * @route POST /admin/editUser/:id
 * @desc Update user
 *
 * - Frissíti a felhasználó adatait az ID és a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a felhasználó dashboardra.
 */
const updateUserHandler = asyncHandler(async (req, res) => {
    // Felhasználó adatainak frissítése ID és új adatok alapján
    await updateUser(req.params.id, req.body);
    // Művelet naplózása
    logOperation('USER_UPDATE', `User updated: ${req.body.username}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.USER_MODIFIED;
    res.redirect('/admin/dashboard/users');
});

/**
 * Felhasználó inaktiválása (törlés helyett) DELETE kérésre.
 * @route DELETE /admin/deleteUser/:userId
 * @desc Inactivate user
 *
 * - Inaktiválja a megadott ID-jú felhasználót.
 * - Naplózza a műveletet.
 * - Sikeres inaktiválás üzenetet küld vissza.
 */
const deleteUserHandler = asyncHandler(async (req, res) => {
    // Inaktiválandó felhasználó azonosítója
    const userId = req.params.userId;
    // Felhasználó inaktiválása
    await inactivateUser(userId);
    // Művelet naplózása
    logOperation('USER_DELETE', `User deleted: ${userId}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres inaktiválás üzenet és státuszkód visszaadása
    req.session.successMessage = MESSAGES.SUCCESS.USER_INACTIVATED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.USER_DELETE_RESPONSE);
});
/**
 * Felhasználó kitiltásának visszaállítása POST kérésre.
 * @route POST /admin/resetBan/:userId
 * @desc Reset user ban status
 *
 * - Visszaállítja a megadott ID-jú felhasználó kitiltását.
 * - Naplózza a műveletet.
 * - Sikeres visszaállítás üzenetet küld vissza.
 */
const resetBanStatus = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    // Felhasználó inaktiválása
    await resetBan(userId);
    // Művelet naplózása
    logOperation('USER_RESET_BAN', `User ban reset: ${userId}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres inaktiválás üzenet és státuszkód visszaadása
    req.session.successMessage = MESSAGES.SUCCESS.USER_BAN_RESET;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.USER_BAN_RESET_RESPONSE);
});






// A vezérlő által exportált handler függvények
export default {
    getNewUserForm,         // Új felhasználó űrlap megjelenítése
    createNewUser,          // Új felhasználó létrehozása (csak route definíció)
    getUsersDashboard,      // Felhasználók dashboard oldal megjelenítése
    getEditUserForm,        // Felhasználó szerkesztő űrlap megjelenítése
    updateUserHandler,      // Felhasználó adatainak frissítése
    deleteUserHandler,      // Felhasználó inaktiválása
    resetBanStatus          // Felhasználó kitiltásának visszaállítása
};

// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Jogosultságokkal kapcsolatos adatkezelő függvények importálása
import {
    getAllPermissions,                // Összes jogosultság lekérdezése
    getPermissionById,                // Egy adott jogosultság lekérdezése ID alapján
    getAllPermissionsWithUsageCounts, // Jogosultságok és használati számok lekérdezése
    createPermission,                 // Új jogosultság létrehozása
    updatePermission,                 // Jogosultság módosítása
    deletePermission                  // Jogosultság törlése
} from '../DataServices/adminPermissionData.js';

/**
 * Jogosultságok dashboard oldal megjelenítése használati számokkal.
 * @route GET /admin/dashboard/permissions
 * @desc Show permissions dashboard with usage counts
 *
 * - Lekéri az összes jogosultságot és azok használati számát.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getPermissionsDashboard = asyncHandler(async (req, res) => {
    // Jogosultságok és használati számok lekérése
    const { permissions, RolePermNumList } = await getAllPermissionsWithUsageCounts();
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render("admin/permdash", {
        rolepermNumList: RolePermNumList,
        rolePermissons: req.user.role.permissions,
        permissions: permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Új jogosultság létrehozásához szükséges űrlap megjelenítése.
 * @route GET /admin/newPermission
 * @desc Show new permission form
 *
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket és űrlapadatokat törli a válasz után.
 */
const getNewPermissionForm = asyncHandler(async (req, res) => {
    // Nézet renderelése, session üzenetek, űrlapadatok, jogosultságok és felhasználó átadása
    res.render("admin/newPerm", {
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek és űrlapadatok törlése a válasz után
    req.session.successMessage = null;
    req.session.formData = null;
    req.session.failMessage = null;
});

/**
 * Új jogosultság létrehozása POST kérésre.
 * @route POST /admin/newPermission
 * @desc Create new permission
 *
 * - Létrehozza az új jogosultságot a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a jogosultság dashboardra.
 */
const createNewPermissionHandler = asyncHandler(async (req, res) => {
    // Új jogosultság létrehozása a kérésben kapott adatok alapján
    const newPermission = await createPermission(req.body);
    // Művelet naplózása
    logOperation('PERMISSION_CREATE', `Permission created: ${newPermission.name}`, req.user.username, HTTP_STATUS.CREATED);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.PERMISSION_CREATED;
    res.redirect('/admin/dashboard/permissions');
});

/**
 * Jogosultság szerkesztő űrlap megjelenítése.
 * @route GET /admin/editPermission/:id
 * @desc Show edit permission form
 *
 * - Lekéri a szerkesztendő jogosultság adatait.
 * - Ha nincs ilyen jogosultság, hibát jelez és visszairányít.
 * - Átadja a session üzeneteket, jogosultságokat, űrlapadatokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getEditPermissionForm = asyncHandler(async (req, res) => {
    // Szerkesztendő jogosultság adatainak lekérése
    const permission = await getPermissionById(req.params.id);
    // Ha nincs ilyen jogosultság, hibát jelez és visszairányít
    if (!permission) {
        req.session.failMessage = MESSAGES.ERROR.PERMISSION_NOT_FOUND;
        return res.redirect('/admin/dashboard/permissions');
    }
    // Nézet renderelése, session üzenetek, jogosultságok, űrlapadatok és felhasználó átadása
    res.render('admin/editPerm', {
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: permission,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Jogosultság adatainak frissítése POST kérésre.
 * @route POST /admin/editPermission/:id
 * @desc Update permission
 *
 * - Frissíti a jogosultság adatait az ID és a kapott adatok alapján.
 * - Ha nincs ilyen jogosultság, hibát jelez és visszairányít.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a jogosultság dashboardra.
 */
const updatePermissionHandler = asyncHandler(async (req, res) => {
    // Jogosultság adatainak frissítése ID és új adatok alapján
    const updatedPermission = await updatePermission(req.params.id, req.body);
    // Ha nincs ilyen jogosultság, hibát jelez és visszairányít
    if (!updatedPermission) {
        req.session.failMessage = MESSAGES.ERROR.PERMISSION_NOT_FOUND;
        return res.redirect('/admin/dashboard/permissions');
    }
    // Művelet naplózása
    logOperation('PERMISSION_UPDATE', `Permission updated: ${updatedPermission.name}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.PERMISSION_UPDATED;
    res.redirect('/admin/dashboard/permissions');
});
/**
 * Jogosultság törlése DELETE kérésre.
 * @route DELETE /admin/deletePermission/:permId
 * @desc Delete permission
 *
 * - Törli a megadott ID-jú jogosultságot.
 * - Naplózza a műveletet.
 * - Sikeres törlés üzenetet küld vissza.
 */
const deletePermissionHandler = asyncHandler(async (req, res) => {
    // Törlendő jogosultság azonosítója
    const permId = req.params.permId;
    // Jogosultság törlése
    const permission = await deletePermission(permId);
    // Művelet naplózása
    logOperation('PERMISSION_DELETE', `Permission deleted: ${permission.name}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres törlés üzenet és státuszkód visszaadása
    req.session.successMessage = MESSAGES.SUCCESS.PERMISSION_DELETED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.PERMISSION_DELETE_RESPONSE);
});

// A vezérlő által exportált handler függvények
export default {
    getPermissionsDashboard,      // Jogosultságok dashboard oldal megjelenítése
    getNewPermissionForm,         // Új jogosultság űrlap megjelenítése
    createNewPermissionHandler,   // Új jogosultság létrehozása
    getEditPermissionForm,        // Jogosultság szerkesztő űrlap megjelenítése
    updatePermissionHandler,      // Jogosultság adatainak frissítése
    deletePermissionHandler       // Jogosultság törlése
};

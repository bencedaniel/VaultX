// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Szerepkörökkel kapcsolatos adatkezelő függvények importálása
import {
    getAllRoles,               // Összes szerepkör lekérdezése
    getRoleById,               // Egy adott szerepkör lekérdezése ID alapján
    getAllRolesWithUserCounts, // Szerepkörök és felhasználószámok lekérdezése
    getRoleFormData,           // Szerepkör űrlaphoz szükséges adatok lekérdezése
    createRole,                // Új szerepkör létrehozása
    updateRole,                // Szerepkör módosítása
    deleteRole                 // Szerepkör törlése
} from '../DataServices/adminRoleData.js';

/**
 * Szerepkörök dashboard oldal megjelenítése felhasználószámokkal.
 * @route GET /admin/dashboard/roles
 * @desc Show roles dashboard with user counts
 *
 * - Lekéri az összes szerepkört és azokhoz tartozó felhasználószámokat.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getRolesDashboard = asyncHandler(async (req, res) => {
    // Szerepkörök és felhasználószámok lekérése
    const { roles, RoleNumList } = await getAllRolesWithUserCounts();
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render("admin/roledash", {
        rolenumlist: RoleNumList,
        rolePermissons: req.user.role.permissions,
        roles: roles,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Új szerepkör létrehozásához szükséges űrlap megjelenítése.
 * @route GET /admin/newRole
 * @desc Show new role form
 *
 * - Lekéri a jogosultságlistát.
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket és űrlapadatokat törli a válasz után.
 */
const getNewRoleForm = asyncHandler(async (req, res) => {
    // Jogosultságlista lekérése az űrlaphoz
    const { permissions } = await getRoleFormData();
    // Nézet renderelése, session üzenetek, űrlapadatok, jogosultságok és felhasználó átadása
    res.render("admin/newRole", {
        permissions: permissions,
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        formData: req.session.formData,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek és űrlapadatok törlése a válasz után
    req.session.formData = null;
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Új szerepkör létrehozása POST kérésre.
 * @route POST /admin/newRole
 * @desc Create new role
 *
 * - Létrehozza az új szerepkört a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a szerepkör dashboardra.
 */
const createNewRoleHandler = asyncHandler(async (req, res) => {
    // Új szerepkör létrehozása a kérésben kapott adatok alapján
    const newRole = await createRole(req.body);
    // Művelet naplózása
    logOperation('ROLE_CREATE', `Role created: ${newRole.roleName}`, req.user.username, HTTP_STATUS.CREATED);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.ROLE_CREATED;
    res.redirect('/admin/dashboard/roles');
});

/**
 * Szerepkör szerkesztő űrlap megjelenítése.
 * @route GET /admin/editRole/:id
 * @desc Show edit role form
 *
 * - Lekéri a szerkesztendő szerepkör adatait.
 * - Ha nincs ilyen szerepkör, hibát jelez és visszairányít.
 * - Lekéri a jogosultságlistát.
 * - Átadja a session üzeneteket, jogosultságokat, űrlapadatokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getEditRoleForm = asyncHandler(async (req, res) => {
    // Szerkesztendő szerepkör adatainak lekérése
    const role = await getRoleById(req.params.id);
    // Ha nincs ilyen szerepkör, hibát jelez és visszairányít
    if (!role) {
        req.session.failMessage = MESSAGES.ERROR.ROLE_NOT_FOUND;
        return res.redirect('/admin/dashboard/roles');
    }
    // Jogosultságlista lekérése az űrlaphoz
    const { permissions } = await getRoleFormData();
    // Nézet renderelése, session üzenetek, jogosultságok, űrlapadatok és felhasználó átadása
    res.render('admin/editRole', {
        permissions: permissions,
        rolePermissons: req.user.role.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        formData: role,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.successMessage = null;
    req.session.failMessage = null;
});

/**
 * Szerepkör adatainak frissítése POST kérésre.
 * @route POST /admin/editRole/:id
 * @desc Update role
 *
 * - Frissíti a szerepkör adatait az ID és a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Ha nincs ilyen szerepkör, hibát jelez és visszairányít.
 * - Sikeres üzenetet állít be, majd átirányít a szerepkör dashboardra.
 */
const updateRoleHandler = asyncHandler(async (req, res) => {
    // Szerepkör adatainak frissítése ID és új adatok alapján
    const updatedRole = await updateRole(req.params.id, req.body);
    // Művelet naplózása
    logOperation('ROLE_UPDATE', `Role updated: ${req.body.roleName}`, req.user.username, HTTP_STATUS.OK);
    // Ha nincs ilyen szerepkör, hibát jelez és visszairányít
    if (!updatedRole) {
        req.session.failMessage = MESSAGES.ERROR.ROLE_NOT_FOUND;
        return res.redirect('/admin/dashboard/roles');
    }
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.ROLE_UPDATED;
    res.redirect('/admin/dashboard/roles');
});

/**
 * Szerepkör törlése DELETE kérésre.
 * @route DELETE /admin/deleteRole/:roleId
 * @desc Delete role
 *
 * - Törli a megadott ID-jú szerepkört.
 * - Naplózza a műveletet.
 * - Sikeres törlés üzenetet küld vissza.
 */
const deleteRoleHandler = asyncHandler(async (req, res) => {
    // Törlendő szerepkör azonosítója
    const roleId = req.params.roleId;
    // Szerepkör törlése
    const role = await deleteRole(roleId);
    // Művelet naplózása
    logOperation('ROLE_DELETE', `Role deleted: ${role.roleName}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres törlés üzenet és státuszkód visszaadása
    req.session.successMessage = MESSAGES.SUCCESS.ROLE_DELETED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.ROLE_DELETE_RESPONSE);
});

// A vezérlő által exportált handler függvények
export default {
    getRolesDashboard,      // Szerepkörök dashboard oldal megjelenítése
    getNewRoleForm,         // Új szerepkör űrlap megjelenítése
    createNewRoleHandler,   // Új szerepkör létrehozása
    getEditRoleForm,        // Szerepkör szerkesztő űrlap megjelenítése
    updateRoleHandler,      // Szerepkör adatainak frissítése
    deleteRoleHandler       // Szerepkör törlése
};

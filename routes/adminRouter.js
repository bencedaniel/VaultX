import express from 'express';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import auth from '../controllers/auth.js';
import Validate from "../middleware/Validate.js";
import adminUserController from '../controllers/adminUserController.js';
import adminRoleController from '../controllers/adminRoleController.js';
import adminPermissionController from '../controllers/adminPermissionController.js';
import adminCardController from '../controllers/adminCardController.js';
import adminDashboardController from '../controllers/adminDashboardController.js';
import envModifierController from '../controllers/envModifierController.js';
import ipTablesController from '../controllers/ipTablesController.js';
import logController from '../controllers/logController.js';


/**
 * Adminisztrációs router.
 * Minden adminisztrációs művelet (felhasználók, szerepkörök, jogosultságok, kártyák, dashboard) végpontjai.
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const adminRouter = express.Router();


// ===========================
// ADMIN DASHBOARD
// ===========================

/**
 * Admin dashboard megjelenítése.
 * GET /admin/dashboard
 */


adminRouter.get("/dashboard", Verify, VerifyRole(), adminDashboardController.getAdminDashboard);


adminRouter.get("/officedash", Verify, VerifyRole(), adminDashboardController.getOfficeDashboard);



// ===========================
// USER MANAGEMENT
// ===========================

/**
 * Új felhasználó űrlap megjelenítése.
 * GET /admin/newUser
 */


adminRouter.get("/newUser", Verify, VerifyRole(), adminUserController.getNewUserForm);

/**
 * Új felhasználó létrehozása.
 * POST /admin/newUser
 */
adminRouter.post("/newUser", Verify, VerifyRole(), Validate, auth.Register);

/**
 * Felhasználók dashboard megjelenítése.
 * GET /admin/dashboard/users
 */
adminRouter.get("/dashboard/users", Verify, VerifyRole(), adminUserController.getUsersDashboard);

/**
 * Felhasználó szerkesztő űrlap megjelenítése.
 * GET /admin/editUser/:id
 */
adminRouter.get('/editUser/:id', Verify, VerifyRole(), adminUserController.getEditUserForm);

/**
 * Felhasználó adatainak frissítése.
 * POST /admin/editUser/:id
 */
adminRouter.post('/editUser/:id', Verify, VerifyRole(), adminUserController.updateUserHandler);

/**
 * Felhasználó törlése.
 * DELETE /admin/deleteUser/:userId
 */
adminRouter.delete('/deleteUser/:userId', Verify, VerifyRole(), adminUserController.deleteUserHandler);


// ===========================
// ROLE MANAGEMENT
// ===========================

/**
 * Szerepkörök dashboard megjelenítése.
 * GET /admin/dashboard/roles
 */


adminRouter.get("/dashboard/roles", Verify, VerifyRole(), adminRoleController.getRolesDashboard);

/**
 * Új szerepkör űrlap megjelenítése.
 * GET /admin/newRole
 */
adminRouter.get("/newRole", Verify, VerifyRole(), adminRoleController.getNewRoleForm);

/**
 * Új szerepkör létrehozása.
 * POST /admin/newRole
 */
adminRouter.post("/newRole", Verify, VerifyRole(), adminRoleController.createNewRoleHandler);

/**
 * Szerepkör szerkesztő űrlap megjelenítése.
 * GET /admin/editRole/:id
 */
adminRouter.get('/editRole/:id', Verify, VerifyRole(), adminRoleController.getEditRoleForm);

/**
 * Szerepkör adatainak frissítése.
 * POST /admin/editRole/:id
 */
adminRouter.post('/editRole/:id', Verify, VerifyRole(), adminRoleController.updateRoleHandler);

/**
 * Szerepkör törlése.
 * DELETE /admin/deleteRole/:roleId
 */
adminRouter.delete('/deleteRole/:roleId', Verify, VerifyRole(), adminRoleController.deleteRoleHandler);


// ===========================
// PERMISSION MANAGEMENT
// ===========================

/**
 * Jogosultságok dashboard megjelenítése.
 * GET /admin/dashboard/permissions
 */


adminRouter.get("/dashboard/permissions", Verify, VerifyRole(), adminPermissionController.getPermissionsDashboard);

/**
 * Új jogosultság űrlap megjelenítése.
 * GET /admin/newPermission
 */
adminRouter.get("/newPermission", Verify, VerifyRole(), adminPermissionController.getNewPermissionForm);

/**
 * Új jogosultság létrehozása.
 * POST /admin/newPermission
 */
adminRouter.post("/newPermission", Verify, VerifyRole(), adminPermissionController.createNewPermissionHandler);

/**
 * Jogosultság szerkesztő űrlap megjelenítése.
 * GET /admin/editPermission/:id
 */
adminRouter.get('/editPermission/:id', Verify, VerifyRole(), adminPermissionController.getEditPermissionForm);

/**
 * Jogosultság adatainak frissítése.
 * POST /admin/editPermission/:id
 */
adminRouter.post('/editPermission/:id', Verify, VerifyRole(), adminPermissionController.updatePermissionHandler);

/**
 * Jogosultság törlése.
 * DELETE /admin/deletePermission/:permId
 */
adminRouter.delete('/deletePermission/:permId', Verify, VerifyRole(), adminPermissionController.deletePermissionHandler);


// ===========================
// CARD DASHBOARD MANAGEMENT
// ===========================

/**
 * Új kártya űrlap megjelenítése.
 * GET /admin/newCard
 */
adminRouter.get("/newCard", Verify, VerifyRole(), adminCardController.getNewCardForm);

/**
 * Kártyák dashboard megjelenítése.
 * GET /admin/dashboard/cards
 */
adminRouter.get("/dashboard/cards", Verify, VerifyRole(), adminCardController.getCardsDashboard);

/**
 * Kártya szerkesztő űrlap megjelenítése.
 * GET /admin/editCard/:id
 */
adminRouter.get('/editCard/:id', Verify, VerifyRole(), adminCardController.getEditCardForm);

/**
 * Új kártya létrehozása.
 * POST /admin/newCard
 */
adminRouter.post('/newCard', Verify, VerifyRole(), adminCardController.createNewCardHandler);

/**
 * Kártya adatainak frissítése.
 * POST /admin/editCard/:id
 */
adminRouter.post('/editCard/:id', Verify, VerifyRole(), adminCardController.updateCardHandler);

/**
 * Kártya törlése.
 * DELETE /admin/deleteCard/:cardId
 */
adminRouter.delete('/deleteCard/:cardId', Verify, VerifyRole(), adminCardController.deleteCardHandler);

/**
 * Környezetváltozók módosítási felületének megjelenítése.
 * GET /admin/envModifier
 */
adminRouter.get("/envModifier", Verify, VerifyRole(), envModifierController.getenvironmentVariableModifiers);
/**
 * Környezetváltozók módosítása.
 * POST /admin/envModifier
 */
adminRouter.post("/envModifier", Verify, VerifyRole(), envModifierController.modifyEnvironmentVariables);

/**
 * IP rekordok dashboard megjelenítése.
 * GET /admin/IpTables
 */

adminRouter.get("/IpTables", Verify, VerifyRole(), ipTablesController.getIpTrackerDashboard);
/**
 * IP rekord törlése.
 * DELETE /admin/IpTables/delete/:id
 */
adminRouter.delete("/IpTables/delete/:id", Verify, VerifyRole(), ipTablesController.deleteIpRecordHandler);
/**
 * Naplózási felület megjelenítése.
 * GET /admin/logViewer
 */
adminRouter.get("/logViewer", Verify, VerifyRole(), logController.getLogs);
/**
 * Felhasználó kitiltásának visszaállítása.
 * GET /admin/resetBan/:userId
 */

adminRouter.post("/resetBan/:userId", Verify, VerifyRole(), adminUserController.resetBanStatus);

/**
 * adminRouter exportálása.
 */
export default adminRouter;

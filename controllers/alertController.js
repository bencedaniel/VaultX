// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Riasztásokkal kapcsolatos adatkezelő függvények importálása
import {
    getAllAlerts,      // Összes riasztás lekérdezése
    getAlertById,      // Egy adott riasztás lekérdezése ID alapján
    createAlert,       // Új riasztás létrehozása
    updateAlert,       // Riasztás módosítása
    deleteAlert,       // Riasztás törlése
    getAlertFormData   // Riasztás űrlaphoz szükséges adatok lekérdezése
} from '../DataServices/alertData.js';

/**
 * Új riasztás létrehozásához szükséges űrlap megjelenítése.
 * @route GET /alerts/new
 * @desc Show new alert form
 *
 * - Lekéri a jogosultságlistát.
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getNewAlertForm = asyncHandler(async function (req, res) {
    // Jogosultságlista lekérése az űrlaphoz
    const { permissionList } = await getAlertFormData();
    // Nézet renderelése, session üzenetek, űrlapadatok, jogosultságok és felhasználó átadása
    res.render('alert/newAlert', {
        permissionList,
        formData: req.session.formData,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Új riasztás létrehozása POST kérésre.
 * @route POST /alerts/new
 * @desc Create new alert
 *
 * - Létrehozza az új riasztást a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a riasztás dashboardra.
 */
const createNewAlertHandler = asyncHandler(async function (req, res) {
    // Új riasztás létrehozása a kérésben kapott adatok alapján
    const newAlert = await createAlert(req.body);
    // Művelet naplózása
    logOperation('ALERT_CREATE', `Alert created: ${newAlert._id}`, req.user.username, HTTP_STATUS.CREATED);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.ALERT_CREATED;
    res.redirect('/alerts/dashboard');
});

/**
 * Riasztások dashboard oldal megjelenítése.
 * @route GET /alerts/dashboard
 * @desc Show alerts dashboard
 *
 * - Lekéri az összes riasztást.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getAlertsDashboard = asyncHandler(async function (req, res) {
    // Összes riasztás lekérése
    const alerts = await getAllAlerts();
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render('alert/alertdash', {
        alerts,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Riasztás szerkesztő űrlap megjelenítése.
 * @route GET /alerts/edit/:id
 * @desc Show edit alert form
 *
 * - Lekéri a szerkesztendő riasztás adatait és a jogosultságlistát.
 * - Átadja a session üzeneteket, jogosultságokat, űrlapadatokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getEditAlertForm = asyncHandler(async function (req, res) {
    // Szerkesztendő riasztás adatainak lekérése
    const alert = await getAlertById(req.params.id);
    // Jogosultságlista lekérése az űrlaphoz
    const { permissionList } = await getAlertFormData();
    // Nézet renderelése, session üzenetek, jogosultságok, űrlapadatok és felhasználó átadása
    res.render('alert/editAlert', {
        permissionList,
        formData: alert,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Riasztás adatainak frissítése POST kérésre.
 * @route POST /alerts/edit/:id
 * @desc Update alert
 *
 * - Frissíti a riasztás adatait az ID és a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a riasztás dashboardra.
 */
const updateAlertHandler = asyncHandler(async function (req, res) {
    // Riasztás adatainak frissítése ID és új adatok alapján
    const alert = await updateAlert(req.params.id, req.body);
    // Művelet naplózása
    logOperation('ALERT_UPDATE', `Alert updated: ${alert?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.ALERT_UPDATED;
    res.redirect('/alerts/dashboard');
});

/**
 * Riasztás törlése DELETE kérésre.
 * @route DELETE /alerts/delete/:id
 * @desc Delete alert
 *
 * - Törli a megadott ID-jú riasztást.
 * - Naplózza a műveletet.
 * - Sikeres törlés üzenetet küld vissza.
 */
const deleteAlertHandler = asyncHandler(async function (req, res) {
    // Törlendő riasztás adatainak lekérése és törlése
    const alert = await deleteAlert(req.params.id);
    // Művelet naplózása
    logOperation('ALERT_DELETE', `Alert deleted: ${alert?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres törlés üzenet és státuszkód visszaadása
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.ALERT_DELETED });
});

/**
 * Eseményhez tartozó riasztások ellenőrzése és létrehozása (rendszer által generált).
 * @route GET /alerts/checkEvent
 * @desc Check and create alerts for event (system-generated)
 *
 * - Ellenőrzi, hogy van-e kiválasztott esemény.
 * - Ha nincs, hibát jelez.
 * - Létrehoz egy új, előre definiált riasztást.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a riasztás dashboardra.
 */
const checkEventAlertsHandler = asyncHandler(async function (req, res) {
    // Kiválasztott esemény azonosítója
    const eventID = res.locals.selectedEvent?._id;
    // Ha nincs esemény kiválasztva, hibát jelez
    if (!eventID) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: MESSAGES.ERROR.NO_EVENT_SELECTED });
    }
    // Új, előre definiált riasztás adatai
    const newAlertData = {
        description: 'Incomplete',
        title: 'Needed to define why needed this alert (Nincsenek jelenleg definialva milyen részeket ellenőrizzen a rendszer itt)',
        permission: 'admin_dashboard',
        active: true,
        reappear: 100,
        style: 'info'
    };
    // Riasztás létrehozása
    const alert = await createAlert(newAlertData);
    // Művelet naplózása
    logOperation('ALERT_CREATE', `Alert created: ${alert._id}`, 'system', HTTP_STATUS.CREATED);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.ALERTS_CREATED;
    res.redirect('/alerts/dashboard');
});

// A vezérlő által exportált handler függvények
export default {
    getNewAlertForm,           // Új riasztás űrlap megjelenítése
    createNewAlertHandler,     // Új riasztás létrehozása
    getAlertsDashboard,        // Riasztások dashboard oldal megjelenítése
    getEditAlertForm,          // Riasztás szerkesztő űrlap megjelenítése
    updateAlertHandler,        // Riasztás adatainak frissítése
    deleteAlertHandler,        // Riasztás törlése
    checkEventAlertsHandler    // Eseményhez tartozó riasztások ellenőrzése/létrehozása
};

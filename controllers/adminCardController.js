// Logger és naplózó függvények importálása
import { logger, logOperation } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Kártyákkal kapcsolatos adatkezelő függvények importálása
import {
    getAllCards,         // Összes kártya lekérdezése
    getCardById,         // Egy adott kártya lekérdezése ID alapján
    getCardFormData,     // Kártya űrlaphoz szükséges adatok lekérdezése
    createCard,          // Új kártya létrehozása
    updateCard,          // Kártya módosítása
    deleteCard           // Kártya törlése
} from '../DataServices/adminCardData.js';

/**
 * Új kártya létrehozásához szükséges űrlap megjelenítése.
 * @route GET /admin/newCard
 * @desc Show new card form
 *
 * - Lekéri a jogosultságlistát és a felhasználó szerepkörének jogosultságait.
 * - Átadja a session üzeneteket és a felhasználót a nézetnek.
 * - A session üzeneteket és űrlapadatokat törli a válasz után.
 */
const getNewCardForm = asyncHandler(async (req, res) => {
    // Jogosultságlista lekérése az űrlaphoz
    const { permissionList } = await getCardFormData();
    // Felhasználó aktuális szerepkörének jogosultságai
    const userrole = req.user?.role?.permissions;
    // Nézet renderelése, session üzenetek és űrlapadatok átadása
    res.render("admin/newCard", {
        permissionList: permissionList,
        rolePermissons: userrole,
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
 * Kártyák áttekintő (dashboard) oldal megjelenítése.
 * @route GET /admin/dashboard/cards
 * @desc Show cards dashboard
 *
 * - Lekéri az összes kártyát.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getCardsDashboard = asyncHandler(async (req, res) => {
    // Összes kártya lekérése
    const cards = await getAllCards();
    // Felhasználó aktuális szerepkörének jogosultságai
    const rolePermissons = req.user?.role?.permissions;
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render("admin/carddash", {
        rolePermissons: rolePermissons,
        cards: cards,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Kártya szerkesztő űrlap megjelenítése.
 * @route GET /admin/editCard/:id
 * @desc Show edit card form
 *
 * - Lekéri a jogosultságlistát és a szerkesztendő kártya adatait.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getEditCardForm = asyncHandler(async (req, res) => {
    // Jogosultságlista lekérése az űrlaphoz
    const { permissionList } = await getCardFormData();
    // Szerkesztendő kártya adatainak lekérése
    const card = await getCardById(req.params.id);
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render('admin/editCard', {
        permissionList: permissionList,
        formData: card,
        failMessage: req.session.failMessage,
        rolePermissons: req.user?.role?.permissions,
        successMessage: req.session.successMessage,
        user: req.user
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * Új kártya létrehozása POST kérésre.
 * @route POST /admin/newCard
 * @desc Create new card
 *
 * - Létrehozza az új kártyát a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a kártya dashboardra.
 */
const createNewCardHandler = asyncHandler(async (req, res) => {
    // Új kártya létrehozása a kérésben kapott adatok alapján
    const newCard = await createCard(req.body);
    // Művelet naplózása
    logOperation('CARD_CREATE', `Card created: ${newCard.title}`, req.user.username, HTTP_STATUS.CREATED);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.CARD_ADDED;
    res.redirect('/admin/dashboard/cards');
});

/**
 * Kártya adatainak frissítése POST kérésre.
 * @route POST /admin/editCard/:id
 * @desc Update card
 *
 * - Frissíti a kártya adatait az ID és a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a kártya dashboardra.
 */
const updateCardHandler = asyncHandler(async (req, res) => {
    // Kártya adatainak frissítése ID és új adatok alapján
    await updateCard(req.params.id, req.body);
    // Művelet naplózása
    logOperation('CARD_UPDATE', `Card updated: ${req.body.title}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.CARD_MODIFIED;
    res.redirect('/admin/dashboard/cards');
});

/**
 * Kártya törlése DELETE kérésre.
 * @route DELETE /admin/deleteCard/:cardId
 * @desc Delete card
 *
 * - Törli a megadott ID-jú kártyát.
 * - Naplózza a műveletet.
 * - Sikeres törlés üzenetet küld vissza.
 */
const deleteCardHandler = asyncHandler(async (req, res) => {
    // Törlendő kártya azonosítója
    const cardId = req.params.cardId;
    // Kártya törlése
    await deleteCard(cardId);
    // Művelet naplózása
    logOperation('CARD_DELETE', `Card deleted: ${cardId}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres törlés üzenet és státuszkód visszaadása
    req.session.successMessage = MESSAGES.SUCCESS.CARD_DELETED;
    res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.CARD_DELETE_RESPONSE);
});

// A vezérlő által exportált handler függvények
export default {
    getNewCardForm,         // Új kártya űrlap megjelenítése
    getCardsDashboard,      // Kártyák dashboard megjelenítése
    getEditCardForm,        // Kártya szerkesztő űrlap megjelenítése
    createNewCardHandler,   // Új kártya létrehozása
    updateCardHandler,      // Kártya adatainak frissítése
    deleteCardHandler       // Kártya törlése
};

// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Kategóriákkal kapcsolatos adatkezelő függvények importálása
import {
    getAllCategories,   // Összes kategória lekérdezése
    getCategoryById,    // Egy adott kategória lekérdezése ID alapján
    createCategory,     // Új kategória létrehozása
    updateCategory,     // Kategória módosítása
    deleteCategory      // Kategória törlése
} from '../DataServices/categoryData.js';

/**
 * Új kategória létrehozásához szükséges űrlap megjelenítése.
 * @route GET /category/new
 * @desc Show new category form
 *
 * - Átadja a session üzeneteket, űrlapadatokat, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getNewCategoryForm = asyncHandler(async (req, res) => {
    // Nézet renderelése, session üzenetek, űrlapadatok, jogosultságok és felhasználó átadása
    res.render('category/newCategory', {
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
 * Új kategória létrehozása POST kérésre.
 * @route POST /category/new
 * @desc Create new category
 *
 * - Létrehozza az új kategóriát a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a kategória dashboardra.
 */
const createNewCategoryHandler = asyncHandler(async (req, res) => {
    // Új kategória létrehozása a kérésben kapott adatok alapján
    const newCategory = await createCategory(req.body);
    // Művelet naplózása
    logOperation('CATEGORY_CREATE', `Category created: ${newCategory.name}`, req.user.username, HTTP_STATUS.CREATED);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.CATEGORY_CREATED;
    res.redirect('/category/dashboard');
});

/**
 * Kategóriák dashboard oldal megjelenítése.
 * @route GET /category/dashboard
 * @desc Show categories dashboard
 *
 * - Lekéri az összes kategóriát.
 * - Átadja a session üzeneteket, jogosultságokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getCategoriesDashboard = asyncHandler(async (req, res) => {
    // Összes kategória lekérése
    const categorys = await getAllCategories();
    // Nézet renderelése, session üzenetek, jogosultságok és felhasználó átadása
    res.render('category/categorydash', {
        categorys,
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
 * Kategória szerkesztő űrlap megjelenítése.
 * @route GET /category/edit/:id
 * @desc Show edit category form
 *
 * - Lekéri a szerkesztendő kategória adatait.
 * - Átadja a session üzeneteket, jogosultságokat, űrlapadatokat és a felhasználót a nézetnek.
 * - A session üzeneteket törli a válasz után.
 */
const getEditCategoryForm = asyncHandler(async (req, res) => {
    // Szerkesztendő kategória adatainak lekérése
    const category = await getCategoryById(req.params.id);
    // Nézet renderelése, session üzenetek, jogosultságok, űrlapadatok és felhasználó átadása
    res.render('category/editCategory', {
        formData: category,
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
 * Kategória adatainak frissítése POST kérésre.
 * @route POST /category/edit/:id
 * @desc Update category
 *
 * - Frissíti a kategória adatait az ID és a kapott adatok alapján.
 * - Naplózza a műveletet.
 * - Sikeres üzenetet állít be, majd átirányít a kategória dashboardra.
 */
const updateCategoryHandler = asyncHandler(async (req, res) => {
    // Kategória adatainak frissítése ID és új adatok alapján
    const updated = await updateCategory(req.params.id, req.body);
    // Művelet naplózása
    logOperation('CATEGORY_UPDATE', `Category updated: ${updated?.CategoryDispName || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres üzenet beállítása és átirányítás
    req.session.successMessage = MESSAGES.SUCCESS.CATEGORY_UPDATED;
    res.redirect('/category/dashboard');
});

/**
 * Kategória törlése DELETE kérésre.
 * @route DELETE /category/delete/:id
 * @desc Delete category
 * @note Ha nincs ilyen kategória, hibát jelez.
 *
 * - Törli a megadott ID-jú kategóriát.
 * - Naplózza a műveletet.
 * - Sikeres törlés üzenetet küld vissza.
 */
const deleteCategoryHandler = asyncHandler(async (req, res) => {
    // Törlendő kategória adatainak lekérése és törlése
    const category = await deleteCategory(req.params.id);
    // Ha nincs ilyen kategória, hibát jelez
    if (!category) {
        req.session.failMessage = MESSAGES.ERROR.CATEGORY_NOT_FOUND;
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.CATEGORY_NOT_FOUND });
    }
    // Művelet naplózása
    logOperation('CATEGORY_DELETE', `Category deleted: ${category.name}`, req.user.username, HTTP_STATUS.OK);
    // Sikeres törlés üzenet és státuszkód visszaadása
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.CATEGORY_DELETED });
});

// A vezérlő által exportált handler függvények
export default {
    getNewCategoryForm,         // Új kategória űrlap megjelenítése
    createNewCategoryHandler,   // Új kategória létrehozása
    getCategoriesDashboard,     // Kategóriák dashboard oldal megjelenítése
    getEditCategoryForm,        // Kategória szerkesztő űrlap megjelenítése
    updateCategoryHandler,      // Kategória adatainak frissítése
    deleteCategoryHandler       // Kategória törlése
};

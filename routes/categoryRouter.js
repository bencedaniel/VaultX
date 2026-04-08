import express from 'express';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import Validate from "../middleware/Validate.js";
import categoryController from '../controllers/categoryController.js';


/**
 * Kategóriák (Category) router.
 * Kategóriák kezelésének végpontjai (létrehozás, szerkesztés, dashboard, stb.).
 *
 * Minden végpont csak hitelesített, megfelelő jogosultságú felhasználó számára érhető el.
 */
const categoryRouter = express.Router();


// ===========================
// CATEGORY MANAGEMENT
// ===========================

/**
 * Új kategória űrlap megjelenítése.
 * GET /categories/new
 */
categoryRouter.get('/new', Verify, VerifyRole(), categoryController.getNewCategoryForm);

/**
 * Új kategória létrehozása.
 * POST /categories/new
 */
categoryRouter.post('/new', Verify, VerifyRole(), categoryController.createNewCategoryHandler);

/**
 * Kategóriák dashboard megjelenítése.
 * GET /categories/dashboard
 */
categoryRouter.get('/dashboard', Verify, VerifyRole(), categoryController.getCategoriesDashboard);

/**
 * Kategória szerkesztő űrlap megjelenítése.
 * GET /categories/edit/:id
 */
categoryRouter.get('/edit/:id', Verify, VerifyRole(), categoryController.getEditCategoryForm);

/**
 * Kategória adatainak frissítése.
 * POST /categories/edit/:id
 */
categoryRouter.post('/edit/:id', Verify, VerifyRole(), Validate, categoryController.updateCategoryHandler);


// Kategória törlésének végpontja (jelenleg kikommentezve)
// categoryRouter.delete('/delete/:id', Verify, VerifyRole(), categoryController.deleteCategoryHandler);


/**
 * categoryRouter exportálása.
 */
export default categoryRouter;
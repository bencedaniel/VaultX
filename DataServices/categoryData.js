// Kategória modell importálása
import Category from '../models/Category.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes kategória lekérése név szerint rendezve
 * @returns {Promise<Array>} - Kategóriák listája név szerint rendezve
 */
export const getAllCategories = async () => {
    return await Category.find().sort({ name: 1 });
};

/**
 * Az összes kategória lekérése csillag szerint rendezve
 * @returns {Promise<Array>} - Kategóriák listája csillag szerint rendezve
 */
export const getAllCategoriesByStar = async () => {
    return await Category.find().sort({ Star: 1 });
};

/**
 * Kategória lekérése azonosító alapján
 * @param {string} id - A keresett kategória azonosítója
 * @returns {Promise<Object>} - A megtalált kategória
 * @throws {Error} - Ha a kategória nem található
 */
export const getCategoryById = async (id) => {
    const category = await Category.findById(id);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
};

/**
 * Új kategória létrehozása
 * @param {Object} data - Az új kategória adatai
 * @returns {Promise<Object>} - A létrehozott kategória
 */
export const createCategory = async (data) => {
    const newCategory = new Category(data);
    await newCategory.save();
    logDb('CREATE', 'Category', `${newCategory.CategoryDispName}`);
    return newCategory;
};

/**
 * Kategória frissítése azonosító alapján (törlés és újra létrehozás)
 * @param {string} id - A frissítendő kategória azonosítója
 * @param {Object} data - Az új adatok
 * @returns {Promise<Object>} - A frissített kategória
 * @throws {Error} - Ha a kategória nem található
 */
export const updateCategory = async (id, data) => {
    const oldCategory = await Category.findById(id);
    if (!oldCategory) {
        throw new Error('Category not found');
    }
    // Régi kategória törlése
    await Category.findByIdAndDelete(id);
    // Új kategória létrehozása az új adatokkal
    const updateData = { ...data, _id: id };
    const updated = new Category(updateData);
    await updated.save();
    logDb('UPDATE', 'Category', `${updated.CategoryDispName}`);
    return updated;
};

/**
 * Kategória törlése azonosító alapján
 * @param {string} id - A törlendő kategória azonosítója
 * @returns {Promise<Object>} - A törölt kategória
 * @throws {Error} - Ha a kategória nem található
 */
export const deleteCategory = async (id) => {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
        throw new Error('Category not found');
    }
    logDb('DELETE', 'Category', `${category.CategoryDispName}`);
    return category;
};

/**
 * Kategória létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése
 * @returns {Promise<Object>} - Az űrlaphoz szükséges adatok (jelenleg üres)
 */
export const getCategoryFormData = async () => {
    return {};
};

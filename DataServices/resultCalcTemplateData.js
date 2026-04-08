import calcTemplate from '../models/calcTemplate.js';
import resultGenerator from '../models/resultGenerator.js';
import resultGroup from '../models/resultGroup.js';
import Category from '../models/Category.js';
import { logDb } from '../logger.js';

/**
 * Eredményszámítási sablonok (calcTemplate) adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Összes eredményszámítási sablon lekérdezése.
 * @returns {Promise<Array>} Az összes sablon tömbje.
 */
export const getAllCalcTemplates = async () => {
    // Sablonok lekérdezése
    return await calcTemplate.find();
};

/**
 * Eredményszámítási sablon lekérdezése azonosító alapján.
 * @param {string} id - A sablon egyedi azonosítója.
 * @returns {Promise<Object>} A sablon dokumentum.
 */
export const getCalcTemplateById = async (id) => {
    // Sablon keresése azonosító alapján
    return await calcTemplate.findById(id);
};

/**
 * Új eredményszámítási sablon létrehozása.
 * @param {Object} data - Az új sablon adatai.
 * @returns {Promise<Object>} A létrehozott sablon dokumentum.
 */
export const createCalcTemplate = async (data) => {
    // Új sablon példány létrehozása
    const calcTemp = new calcTemplate(data);
    await calcTemp.save();
    // Naplózás az adatbázisban
    logDb('CREATE', 'CalcTemplate', `${calcTemp._id}`);
    return calcTemp;
};

/**
 * Eredményszámítási sablon frissítése azonosító alapján.
 * @param {string} id - A sablon egyedi azonosítója.
 * @param {Object} data - A frissített sablon adatai.
 * @returns {Promise<Object>} A frissített sablon dokumentum.
 */
export const updateCalcTemplate = async (id, data) => {
    // Sablon frissítése azonosító alapján
    const calcTemp = await calcTemplate.findByIdAndUpdate(id, data, { new: true });
    logDb('UPDATE', 'CalcTemplate', `${id}`);
    return calcTemp;
};

/**
 * Eredményszámítási sablon törlése azonosító alapján.
 * Törlés előtt ellenőrzi, hogy használatban van-e.
 * @param {string} id - A sablon egyedi azonosítója.
 * @throws {Error} Ha a sablon használatban van.
 */
export const deleteCalcTemplate = async (id) => {
    // Ellenőrizzük, hogy a sablon használatban van-e eredménycsoport vagy generátor által
    const inUseByGroup = await resultGroup.findOne({ calcTemplate: id });
    const inUseByGenerator = await resultGenerator.findOne({ calcSchemaTemplate: id });
    
    if (inUseByGroup || inUseByGenerator) {
        throw new Error("Cannot delete calculation template as it is in use by a result group or generator.");
    }
    
    await calcTemplate.findByIdAndDelete(id);
    logDb('DELETE', 'CalcTemplate', `${id}`);
};

/**
 * Űrlap-adatok lekérdezése eredményszámítási sablonhoz (kategóriák).
 * @returns {Promise<Object>} Objektum, amely tartalmazza a kategóriák tömbjét.
 */
export const getCalcTemplateFormData = async () => {
    // Kategóriák lekérdezése
    const categories = await Category.find();
    return { categories };
};

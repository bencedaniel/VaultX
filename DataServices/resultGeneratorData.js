import resultGenerator from '../models/resultGenerator.js';
import Category from '../models/Category.js';
import calcTemplate from '../models/calcTemplate.js';
import { logDb } from '../logger.js';

/**
 * Eredménygenerátor (resultGenerator) adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Összes eredménygenerátor lekérdezése, feltöltött kategória és számítási sablon adatokkal.
 * @returns {Promise<Array>} Az összes eredménygenerátor tömbje.
 */
export async function getAllGenerators() {
    // Generátorok lekérdezése, kapcsolt mezők feltöltése
    return await resultGenerator.find().populate('category').populate('calcSchemaTemplate');
}

/**
 * Egy eredménygenerátor lekérdezése azonosító alapján.
 * @param {string} id - Generátor azonosító.
 * @returns {Promise<Object>} A generátor dokumentum.
 */
export async function getGeneratorById(id) {
    // Generátor keresése azonosító alapján, kapcsolt mezők feltöltése
    return await resultGenerator.findById(id).populate('category').populate('calcSchemaTemplate');
}

/**
 * Űrlap-adatok lekérdezése generátor létrehozásához/szerkesztéséhez.
 * @returns {Promise<Object>} Objektum, amely tartalmazza a kategóriák és sablonok tömbjét.
 */
export async function getGeneratorFormData() {
    // Kategóriák és sablonok lekérdezése
    const categories = await Category.find();
    const calcTemplates = await calcTemplate.find();
    return { categories, calcTemplates };
}

/**
 * Új eredménygenerátor létrehozása, ellenőrzéssel, hogy csak egy generátor lehet kategóriánként.
 * @param {Object} data - Generátor adatai (category, calcSchemaTemplate, active).
 * @returns {Promise<Object>} A létrehozott generátor dokumentum.
 * @throws {Error} Ha már létezik generátor az adott kategóriához.
 */
export async function createGenerator(data) {
    // Ellenőrizzük, hogy van-e már generátor az adott kategóriához
    const existingGenerator = await resultGenerator.findOne({ category: data.category });
    if (existingGenerator) {
        throw new Error("A result generator for the selected category already exists.");
    }

    // Új generátor példány létrehozása
    const newGenerator = new resultGenerator(data);
    await newGenerator.save();
    logDb('CREATE', 'ResultGenerator', `${newGenerator._id}`);
    return newGenerator;
}

/**
 * Létező eredménygenerátor frissítése, kategória egyediség ellenőrzésével (kivéve saját magát).
 * @param {string} id - Generátor azonosító.
 * @param {Object} data - Frissített generátor adatok.
 * @returns {Promise<Object>} A frissített generátor dokumentum.
 * @throws {Error} Ha már létezik másik generátor ugyanazzal a kategóriával.
 */
export async function updateGenerator(id, data) {
    // Ellenőrizzük, hogy másik generátor nem használja-e ezt a kategóriát
    const existingGenerator = await resultGenerator.findOne({ category: data.category, _id: { $ne: id } });
    if (existingGenerator) {
        throw new Error("A result generator for the selected category already exists.");
    }
    // Generátor frissítése azonosító alapján
    const updated = await resultGenerator.findByIdAndUpdate(id, data, { new: true });
    logDb('UPDATE', 'ResultGenerator', `${id}`);
    return updated;
}

/**
 * Eredménygenerátor aktív státuszának frissítése.
 * @param {string} id - Generátor azonosító.
 * @param {boolean} status - Aktív státusz.
 * @returns {Promise<Object>} A frissített generátor dokumentum.
 * @throws {Error} Ha a generátor nem található.
 */
export async function updateGeneratorStatus(id, status) {
    // Generátor keresése azonosító alapján
    const generator = await resultGenerator.findById(id);
    if (!generator) {
        throw new Error("Result generator not found.");
    }
    generator.active = status;
    await generator.save();
    logDb('UPDATE', 'ResultGenerator', `${id}`);
    return generator;
}

/**
 * Eredménygenerátor törlése azonosító alapján.
 * @param {string} id - Generátor azonosító.
 * @returns {Promise<void>}
 */
export async function deleteGenerator(id) {
    // Generátor törlése az adatbázisból
    await resultGenerator.findByIdAndDelete(id);
    logDb('DELETE', 'ResultGenerator', `${id}`);
}

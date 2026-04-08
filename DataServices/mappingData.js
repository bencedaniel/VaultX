import TableMapping from '../models/TableMapping.js';
import Permissions from '../models/Permissions.js';
import { logDb } from '../logger.js';

/**
 * Táblázat-hozzárendelések (TableMapping) adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Összes táblázat-hozzárendelés lekérdezése név szerint rendezve.
 * @returns {Promise<Array>} A táblázat-hozzárendelések tömbje.
 */
export async function getAllMappings() {
    // Táblázat-hozzárendelések lekérdezése és név szerint rendezése
    const mappings = await TableMapping.find().sort({ name: 1 });
    return mappings;
}

/**
 * Egy táblázat-hozzárendelés lekérdezése azonosító alapján.
 * @param {string} id - A hozzárendelés egyedi azonosítója.
 * @returns {Promise<Object>} A hozzárendelés dokumentum.
 * @throws {Error} Ha a hozzárendelés nem található.
 */
export async function getMappingById(id) {
    // Hozzárendelés keresése azonosító alapján
    const mapping = await TableMapping.findById(id);
    if (!mapping) {
        // Hibát dobunk, ha nincs ilyen hozzárendelés
        throw new Error("Mapping not found");
    }
    return mapping;
}

/**
 * Új táblázat-hozzárendelés létrehozása.
 * @param {Object} data - Az új hozzárendelés adatai.
 * @returns {Promise<Object>} A létrehozott hozzárendelés dokumentum.
 */
export async function createMapping(data) {
    // Új hozzárendelés példány létrehozása
    const newMapping = new TableMapping(data);
    await newMapping.save();
    // Naplózás az adatbázisban
    logDb('CREATE', 'TableMapping', `${newMapping._id}`);
    return newMapping;
}

/**
 * Táblázat-hozzárendelés adatainak frissítése azonosító alapján.
 * @param {string} id - A hozzárendelés egyedi azonosítója.
 * @param {Object} data - A frissített hozzárendelés adatai.
 * @returns {Promise<Object>} A frissített hozzárendelés dokumentum.
 * @throws {Error} Ha a hozzárendelés nem található.
 */
export async function updateMapping(id, data) {
    // Hozzárendelés frissítése azonosító alapján
    const mapping = await TableMapping.findByIdAndUpdate(id, data, { runValidators: true });
    if (!mapping) {
        throw new Error("Mapping not found");
    }
    // Naplózás az adatbázisban
    logDb('UPDATE', 'TableMapping', `${id}`);
    return mapping;
}

/**
 * Táblázat-hozzárendelés törlése azonosító alapján.
 * @param {string} id - A hozzárendelés egyedi azonosítója.
 * @returns {Promise<Object>} A törölt hozzárendelés dokumentum.
 * @throws {Error} Ha a hozzárendelés nem található.
 */
export async function deleteMapping(id) {
    // Hozzárendelés törlése azonosító alapján
    const mapping = await TableMapping.findByIdAndDelete(id);
    if (!mapping) {
        throw new Error("Mapping not found");
    }
    // Naplózás az adatbázisban
    logDb('DELETE', 'TableMapping', `${id}`);
    return mapping;
}

/**
 * Összes jogosultság lekérdezése (pl. űrlapokhoz).
 * @returns {Promise<Array>} A jogosultságok tömbje.
 */
export async function getAllPermissions() {
    // Jogosultságok lekérdezése
    const permissions = await Permissions.find();
    return permissions;
}

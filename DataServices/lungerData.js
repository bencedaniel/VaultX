import Lunger from '../models/Lunger.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';
import { logDb } from '../logger.js';

/**
 * Lóvezetők (Lunger) adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Összes lóvezető lekérdezése név szerint rendezve.
 * @returns {Promise<Array>} A lóvezetők tömbje.
 */
export async function getAllLungers() {
    // Lóvezetők lekérdezése és név szerint rendezése
    const lungers = await Lunger.find().sort({ name: 1 });
    return lungers;
}

/**
 * Egy lóvezető lekérdezése azonosító alapján.
 * @param {string} id - A lóvezető egyedi azonosítója.
 * @returns {Promise<Object>} A lóvezető dokumentum.
 * @throws {Error} Ha a lóvezető nem található.
 */
export async function getLungerById(id) {
    // Lóvezető keresése azonosító alapján
    const lunger = await Lunger.findById(id);
    if (!lunger) {
        // Hibát dobunk, ha nincs ilyen lóvezető
        throw new Error("Lunger not found");
    }
    return lunger;
}

/**
 * Egy lóvezető lekérdezése azonosító alapján, az incidensek eseményadatainak feltöltésével.
 * @param {string} id - A lóvezető egyedi azonosítója.
 * @returns {Promise<Object>} A lóvezető dokumentum, feltöltött incidens eseményekkel.
 * @throws {Error} Ha a lóvezető nem található.
 */
export async function getLungerByIdWithPopulation(id) {
    // Lóvezető keresése és incidens események feltöltése
    const lunger = await Lunger.findById(id).populate('LungerIncident.eventID', 'EventName');
    if (!lunger) {
        throw new Error("Lunger not found");
    }
    return lunger;
}

/**
 * Új lóvezető létrehozása.
 * @param {Object} data - Az új lóvezető adatai.
 * @returns {Promise<Object>} A létrehozott lóvezető dokumentum.
 */
export async function createLunger(data) {
    // Új lóvezető példány létrehozása
    const newLunger = new Lunger(data);
    await newLunger.save();
    // Naplózás az adatbázisban
    logDb('CREATE', 'Lunger', `${newLunger._id}`);
    return newLunger;
}

/**
 * Lóvezető adatainak frissítése azonosító alapján.
 * @param {string} id - A lóvezető egyedi azonosítója.
 * @param {Object} data - A frissített lóvezető adatai.
 * @returns {Promise<Object>} A frissített lóvezető dokumentum.
 * @throws {Error} Ha a lóvezető nem található.
 */
export async function updateLunger(id, data) {
    // Lóvezető frissítése azonosító alapján
    const lunger = await Lunger.findByIdAndUpdate(id, data, { runValidators: true });
    if (!lunger) {
        throw new Error("Lunger not found");
    }
    // Naplózás az adatbázisban
    logDb('UPDATE', 'Lunger', `${id}`);
    return lunger;
}

/**
 * Incidens törlése egy lóvezetőtől.
 * @param {string} id - A lóvezető egyedi azonosítója.
 * @param {Object} incidentData - Az incidens adatai (leírás és típus).
 * @returns {Promise<Object>} A frissített lóvezető dokumentum.
 * @throws {Error} Ha a lóvezető nem található.
 */
export async function deleteLungerIncident(id, incidentData) {
    // Lóvezető keresése azonosító alapján
    const lunger = await Lunger.findById(id);
    if (!lunger) {
        throw new Error("Lunger not found");
    }

    // Incidens eltávolítása a lóvezető incidens listájából
    lunger.LungerIncident = lunger.LungerIncident.filter(incident =>
        !(
            incident.description === incidentData.description &&
            incident.incidentType === incidentData.type
        )
    );

    // Naplózás és adatbázis frissítése
    logDb('UPDATE', 'Lunger', `${id}`);
    await Lunger.findByIdAndUpdate(id, lunger, { runValidators: true });
    return lunger;
}

/**
 * Incidens hozzáadása egy lóvezetőhöz.
 * @param {string} id - A lóvezető egyedi azonosítója.
 * @param {Object} incidentData - Az incidens adatai (leírás, típus, felhasználó, esemény).
 * @returns {Promise<Object>} A frissített lóvezető dokumentum.
 * @throws {Error} Ha a lóvezető nem található.
 */
export async function addLungerIncident(id, incidentData) {
    // Lóvezető keresése azonosító alapján
    const lunger = await Lunger.findById(id);
    if (!lunger) {
        throw new Error("Lunger not found");
    }

    // Új incidens objektum létrehozása
    const newIncident = {
        description: incidentData.description,
        incidentType: incidentData.incidentType,
        date: Date.now(), // Aktuális dátum
        User: incidentData.userId,
        eventID: incidentData.eventId
    };

    // Incidens hozzáadása a lóvezetőhöz
    lunger.LungerIncident.push(newIncident);
    logDb('UPDATE', 'Lunger', `${id}`);
    await Lunger.findByIdAndUpdate(id, lunger, { runValidators: true });
    return lunger;
}

/**
 * Összes felhasználó lekérdezése (pl. űrlapokhoz).
 * @returns {Promise<Array>} A felhasználók tömbje.
 */
export async function getAllUsers() {
    // Felhasználók lekérdezése
    const users = await User.find();
    return users;
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

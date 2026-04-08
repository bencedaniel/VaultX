// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';
// Súgóüzenet modell importálása
import Helpmessage from '../models/HelpMessage.js';
// Naplózó függvények importálása
import { logDb, logDebug } from '../logger.js';
// Üzenet konstansok importálása
import { MESSAGES } from '../config/index.js';
/**
 * Az összes súgóüzenet lekérése leírás szerint rendezve
 * @returns {Promise<Array>} - Súgóüzenetek listája
 */
export async function getAllHelpMessages() {
    const helpMessages = await Helpmessage.find().sort({ description: 1 });
    return helpMessages;
}

/**
 * Súgóüzenet lekérése azonosító alapján
 * @param {string} id - Súgóüzenet azonosítója
 * @returns {Promise<Object>} - Súgóüzenet dokumentum
 * @throws {Error} - Ha a súgóüzenet nem található
 */
export async function getHelpMessageById(id) {
    const helpMessage = await Helpmessage.findById(id);
    if (!helpMessage) {
        throw new Error("Help message not found");
    }
    return helpMessage;
}

/**
 * Új súgóüzenet létrehozása
 * @param {Object} data - Az új súgóüzenet adatai
 * @returns {Promise<Object>} - A létrehozott súgóüzenet dokumentum
 */
export async function createHelpMessage(data) {
    const newHelpMessage = new Helpmessage(data);
    await newHelpMessage.save();
    logDb('CREATE', 'Helpmessage', `${newHelpMessage._id}`);
    return newHelpMessage;
}

/**
 * Súgóüzenet frissítése azonosító alapján
 * @param {string} id - Súgóüzenet azonosítója
 * @param {Object} data - Frissített adatok
 * @returns {Promise<Object>} - A frissített súgóüzenet dokumentum
 * @throws {Error} - Ha a súgóüzenet nem található
 */
export async function updateHelpMessage(id, data) {
    const helpMessage = await Helpmessage.findByIdAndUpdate(id, data, { runValidators: true });
    if (!helpMessage) {
        throw new Error("Help message not found");
    }
    logDb('UPDATE', 'Helpmessage', `${id}`);
    return helpMessage;
}

/**
 * Súgóüzenet törlése azonosító alapján
 * @param {string} id - Súgóüzenet azonosítója
 * @returns {Promise<Object>} - A törölt súgóüzenet dokumentum
 * @throws {Error} - Ha a súgóüzenet nem található
 */
export async function deleteHelpMessage(id) {
    const helpMessage = await Helpmessage.findByIdAndDelete(id);
    if (!helpMessage) {
        throw new Error("Help message not found");
    }
    logDb('DELETE', 'Helpmessage', `${id}`);
    return helpMessage;
}

/**
 * Súgóüzenet lekérése URI alapján
 * Ha az URI végén 24 karakteres azonosító van, azt ':id'-re cseréli
 * @param {string} uri - Súgóüzenet URI
 * @returns {Promise<Object>} - Súgóüzenet dokumentum vagy alapértelmezett üzenet, ha nincs találat
 */
export async function getHelpMessagebyUri(uri) {
    let uriParts = uri.split('/');
    if (uriParts.length > 0 && uriParts[uriParts.length - 1].length === 24) {
        uriParts[uriParts.length - 1] = ':id';
    }
    const patternUri = uriParts.join('/');
    const helpMessage = await Helpmessage.findOne({ url: patternUri, active: true });
    if (!helpMessage) {
        return {
            style: 'primary',
            HelpMessage: MESSAGES.HELP.NO_HELP_AVAILABLE,
            url: uri
        };
    }
    return helpMessage;
}

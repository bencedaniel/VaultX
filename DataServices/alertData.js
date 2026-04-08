// Riasztás (Alert) modell importálása
import Alert from '../models/Alert.js';
// Jogosultság (Permissions) modell importálása
import Permissions from '../models/Permissions.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes riasztás lekérése, név szerint rendezve, jogosultság adatokkal kiegészítve
 * @returns {Promise<Array>} - Riasztások listája jogosultságokkal
 */
export const getAllAlerts = async () => {
    // Alert-ek lekérése, név szerint rendezve, permission mező feltöltése
    return await Alert.find().sort({ name: 1 }).populate('permission');
};

/**
 * Riasztás lekérése azonosító alapján
 * @param {string} id - A keresett riasztás azonosítója
 * @returns {Promise<Object>} - A megtalált riasztás
 * @throws {Error} - Ha a riasztás nem található
 */
export const getAlertById = async (id) => {
    const alert = await Alert.findById(id);
    if (!alert) {
        throw new Error('Alert not found');
    }
    return alert;
};

/**
 * Új riasztás létrehozása
 * @param {Object} data - Az új riasztás adatai
 * @returns {Promise<Object>} - A létrehozott riasztás
 */
export const createAlert = async (data) => {
    const newAlert = new Alert(data);
    await newAlert.save();
    logDb('CREATE', 'Alert', `${newAlert.title}`);
    return newAlert;
};

/**
 * Riasztás frissítése azonosító alapján
 * @param {string} id - A frissítendő riasztás azonosítója
 * @param {Object} data - Új adatok
 * @returns {Promise<Object>} - A frissített riasztás
 * @throws {Error} - Ha a riasztás nem található
 */
export const updateAlert = async (id, data) => {
    const alert = await Alert.findByIdAndUpdate(id, data, { runValidators: true });
    if (!alert) {
        throw new Error('Alert not found');
    }
    logDb('UPDATE', 'Alert', `${alert.title}`);
    return alert;
};

/**
 * Riasztás törlése azonosító alapján
 * @param {string} id - A törlendő riasztás azonosítója
 * @returns {Promise<Object>} - A törölt riasztás
 * @throws {Error} - Ha a riasztás nem található
 */
export const deleteAlert = async (id) => {
    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
        throw new Error('Alert not found');
    }
    logDb('DELETE', 'Alert', `${alert.title}`);
    return alert;
};

/**
 * Riasztás létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése (jogosultság lista)
 * @returns {Promise<Object>} - Jogosultságok listája az űrlaphoz
 */
export const getAlertFormData = async () => {
    const permissionList = await Permissions.find();
    return { permissionList };
};

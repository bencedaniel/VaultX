// Dashboard kártya modell importálása
import DashCards from '../models/DashCards.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Minden dashboard kártya lekérése típus szerint, prioritás szerint rendezve
 * @param {string} dashtype - A lekérendő dashboard kártyák típusa
 * @returns {Promise<Array>} - Dashboard kártyák listája
 */
export const getDashCardsByType = async (dashtype) => {
    return await DashCards.find({ dashtype }).sort({ priority: 1 });
};

/**
 * Dashboard kártya lekérése azonosító alapján
 * @param {string} id - A keresett dashboard kártya azonosítója
 * @returns {Promise<Object>} - A megtalált dashboard kártya
 * @throws {Error} - Ha a kártya nem található
 */
export const getDashCardById = async (id) => {
    const card = await DashCards.findById(id);
    if (!card) {
        throw new Error('Dashboard card not found');
    }
    return card;
};

/**
 * Új dashboard kártya létrehozása
 * @param {Object} data - Az új dashboard kártya adatai
 * @returns {Promise<Object>} - A létrehozott dashboard kártya
 */
export const createDashCard = async (data) => {
    const newCard = new DashCards(data);
    await newCard.save();
    logDb('CREATE', 'DashCard', `${newCard._id}`);
    return newCard;
};

/**
 * Dashboard kártya frissítése azonosító alapján
 * @param {string} id - A frissítendő dashboard kártya azonosítója
 * @param {Object} data - Az új adatok
 * @returns {Promise<Object>} - A frissített dashboard kártya
 * @throws {Error} - Ha a kártya nem található
 */
export const updateDashCard = async (id, data) => {
    const card = await DashCards.findByIdAndUpdate(id, data, { runValidators: true });
    if (!card) {
        throw new Error('Dashboard card not found');
    }
    logDb('UPDATE', 'DashCard', `${id}`);
    return card;
};

/**
 * Dashboard kártya törlése azonosító alapján
 * @param {string} id - A törlendő dashboard kártya azonosítója
 * @returns {Promise<Object>} - A törölt dashboard kártya
 * @throws {Error} - Ha a kártya nem található
 */
export const deleteDashCard = async (id) => {
    const card = await DashCards.findByIdAndDelete(id);
    if (!card) {
        throw new Error('Dashboard card not found');
    }
    logDb('DELETE', 'DashCard', `${id}`);
    return card;
};

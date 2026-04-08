// Logger és naplózó függvények importálása
import { logDb, logger } from '../logger.js';
// Dashboard kártya modell importálása
import DashCards from '../models/DashCards.js';
// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';

/**
 * Az összes dashboard kártya lekérése
 * @returns {Promise<Array>} - Minden DashCards rekord
 */
export async function getAllCards() {
    return await DashCards.find();
}

/**
 * Dashboard kártya lekérése azonosító alapján
 * @param {string} cardId - A kártya egyedi azonosítója
 * @returns {Promise<Object|null>} - A megtalált DashCards rekord vagy null
 */
export async function getCardById(cardId) {
    return await DashCards.findById(cardId);
}

/**
 * Kártya létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése
 * @returns {Promise<Object>} - Jogosultság lista az űrlaphoz
 */
export async function getCardFormData() {
    const permissionList = await Permissions.find();
    return { permissionList };
}

/**
 * Új dashboard kártya létrehozása
 * @param {Object} cardData - Az új kártya adatai
 * @returns {Promise<Object>} - A létrehozott DashCards rekord
 */
export async function createCard(cardData) {
    const newCard = new DashCards(cardData);
    await newCard.save();
    logDb('CREATE', 'DashCard', `${newCard._id}`);
    return newCard;
}

/**
 * Dashboard kártya frissítése
 * @param {string} cardId - A frissítendő kártya azonosítója
 * @param {Object} cardData - Új adatok
 * @returns {Promise<Object|null>} - A frissített DashCards rekord vagy null
 */
export async function updateCard(cardId, cardData) {
    // Frissítés naplózása
    logger.debug(`Updating card ${cardId} with data: ${JSON.stringify(cardData)}`);
    const card = await DashCards.findByIdAndUpdate(cardId, cardData, { runValidators: true });
    logDb('UPDATE', 'DashCard', `${cardId}`);
    return card;
}

/**
 * Dashboard kártya törlése
 * @param {string} cardId - A törlendő kártya azonosítója
 * @returns {Promise<Object|null>} - A törölt DashCards rekord vagy null
 */
export async function deleteCard(cardId) {
    const card = await DashCards.findByIdAndDelete(cardId);
    logDb('DELETE', 'DashCard', `${cardId}`);
    return card;
}

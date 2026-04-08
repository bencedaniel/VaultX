import Score from '../models/Score.js';
import { logDb } from '../logger.js';

/**
 * Pontszám (Score) adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Pontszámok lekérdezése programrész, nevezés és esemény alapján.
 * @param {string} timetablePartId - Programrész azonosító.
 * @param {string} entryId - Nevezés azonosító.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Pontszám dokumentumok tömbje.
 */
export async function getScoresByTimetableAndEntry(timetablePartId, entryId, eventId) {
    // Pontszámok lekérdezése a megadott feltételek alapján
    return await Score.find({
        timetablepart: timetablePartId,
        entry: entryId,
        event: eventId
    }).exec();
}

/**
 * Új pontszám létrehozása.
 * @param {Object} scoreData - Az új pontszám adatai.
 * @returns {Promise<Object>} A létrehozott pontszám dokumentum.
 */
export async function createScore(scoreData) {
    // Új pontszám példány létrehozása
    const newScore = new Score(scoreData);
    await newScore.save();
    // Naplózás az adatbázisban
    logDb('CREATE', 'Score', `${newScore._id}`);
    return newScore;
}

/**
 * Létező pontszám frissítése.
 * @param {string} scoreId - Pontszám azonosító.
 * @param {Object} scoreData - Frissített pontszám adatok.
 * @returns {Promise<Object>} A frissített pontszám dokumentum.
 */
export async function updateScore(scoreId, scoreData) {
    // Pontszám frissítése azonosító alapján
    const score = await Score.findByIdAndUpdate(scoreId, scoreData, { runValidators: true });
    logDb('UPDATE', 'Score', `${scoreId}`);
    await score.save();
    return score;
}

/**
 * Pontszám törlése azonosító alapján.
 * @param {string} scoreId - Pontszám azonosító.
 * @returns {Promise<void>}
 */
export async function deleteScore(scoreId) {
    // Pontszám törlése az adatbázisból
    await Score.findByIdAndDelete(scoreId);
    logDb('DELETE', 'Score', `${scoreId}`);
}

/**
 * Több pontszám törlése azonosítók alapján.
 * @param {Array} scoreIds - Pontszám azonosítók tömbje.
 * @returns {Promise<void>}
 */
export async function deleteMultipleScores(scoreIds) {
    // Több pontszám törlése egyszerre
    await Score.deleteMany({ _id: { $in: scoreIds } });
    logDb('DELETE', 'Score', `${scoreIds.join(',')}`);
}

import Event from '../models/Event.js';
import Entries from '../models/Entries.js';
import Score from '../models/Score.js';

/**
 * Eredményszámítási adatszolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Kiválasztott esemény lekérdezése.
 * @returns {Promise<Object>} Az aktuálisan kiválasztott esemény dokumentum.
 */
export async function getSelectedEvent() {
    // Az aktuálisan kiválasztott esemény lekérdezése
    return await Event.findOne({ selected: true });
}

/**
 * Nevezések lekérdezése esemény és kategória alapján.
 * @param {string} eventId - Esemény azonosító.
 * @param {string} categoryId - Kategória azonosító.
 * @returns {Promise<Array>} Nevezések tömbje.
 */
export async function getEntriesByEventAndCategory(eventId, categoryId) {
    // Nevezések lekérdezése esemény és kategória szerint
    return await Entries.find({ event: eventId, category: categoryId });
}

/**
 * Pontszámok lekérdezése egy programrészhez.
 * @param {Array} entryIds - Nevezés azonosítók tömbje.
 * @param {string} timetablePartID - Programrész azonosító.
 * @returns {Promise<Array>} Pontszám dokumentumok tömbje, feltöltött nevezés és scoresheet adatokkal.
 */
export async function getScoresForTimetablePart(entryIds, timetablePartID) {
    // Pontszámok lekérdezése adott nevezésekhez és programrészhez
    return await Score.find({
        entry: { $in: entryIds },
        timetablepart: timetablePartID
    }).populate({
        path: 'entry',
        populate: [
            { path: 'horse' },
            { path: 'vaulter' },
            { path: 'lunger' }
        ]
    }).populate({
        path: 'scoresheets.scoreId',
        select: 'totalScoreBE'
    });
}

/**
 * Egy nevezés lekérdezése minden kapcsolt mezővel feltöltve.
 * @param {string} entryId - Nevezés azonosító.
 * @returns {Promise<Object>} Feltöltött nevezés dokumentum.
 */
export async function getEntryWithPopulation(entryId) {
    // Nevezés lekérdezése és kapcsolt mezők feltöltése (ló, versenyző, lóvezető)
    return await Entries.findById(entryId)
        .populate('horse')
        .populate('vaulter')
        .populate('lunger');
}

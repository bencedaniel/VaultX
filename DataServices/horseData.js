// Ló modell importálása
import Horse from '../models/Horse.js';
// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';
// Nevezés modell importálása
import Entries from '../models/Entries.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes ló lekérése név szerint rendezve
 * @returns {Promise<Array>} - Lovak listája név szerint rendezve
 */
export async function getAllHorses() {
    return await Horse.find().sort({ name: 1 });
}

/**
 * Ló lekérése azonosító alapján
 * @param {string} id - A ló azonosítója
 * @returns {Promise<Object>} - A megtalált ló
 * @throws {Error} - Ha a ló nem található
 */
export async function getHorseById(id) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    return horse;
}

/**
 * Ló lekérése azonosító alapján, minden kapcsolódó adattal (részletes nézethez)
 * @param {string} id - A ló azonosítója
 * @returns {Promise<Object>} - A megtalált ló populált mezőkkel
 * @throws {Error} - Ha a ló nem található
 */
export async function getHorseByIdWithPopulation(id) {
    const horse = await Horse.findById(id)
        .populate('Notes.user', '-password -__v')
        .populate('VetCheckStatus.eventID', 'EventName')
        .populate('VetCheckStatus.user', '-password -__v')
        .populate('Notes.eventID', 'EventName');
    if (!horse) {
        throw new Error('Horse not found');
    }
    return horse;
}

/**
 * Új ló létrehozása, HeadNr és BoxNr beállításával adott eseményhez
 * @param {Object} data - Az új ló adatai
 * @param {string|number} headNr - Fejszám
 * @param {string|number} boxNr - Bokszszám
 * @param {string} eventId - Esemény azonosítója
 * @returns {Promise<Object>} - A létrehozott ló
 */
export async function createHorse(data, headNr, boxNr, eventId) {
    const newHorse = new Horse(data);
    newHorse.HeadNr.push({
        headNumber: headNr,
        eventID: eventId
    });
    newHorse.BoxNr.push({
        boxNumber: boxNr,
        eventID: eventId
    });
    await newHorse.save();
    logDb('CREATE', 'Horse', `${newHorse._id}`);
    return newHorse;
}

/**
 * Ló frissítése és HeadNr/BoxNr kezelése adott eseményhez
 * @param {string} id - A frissítendő ló azonosítója
 * @param {Object} data - Új adatok
 * @param {string|number} headNr - Új fejszám
 * @param {string|number} boxNr - Új bokszszám
 * @param {string} eventId - Esemény azonosítója
 * @returns {Promise<Object>} - A frissített ló
 * @throws {Error} - Ha a ló nem található
 */
export async function updateHorse(id, data, headNr, boxNr, eventId) {
    const horse = await Horse.findByIdAndUpdate(id, data, { runValidators: true });
    if (!horse) {
        throw new Error('Horse not found');
    }
    const horseToUpdate = await Horse.findById(id);
    // BoxNr frissítése az eseményhez
    let editedCount = 0;
    horseToUpdate.BoxNr.forEach(b => {
        if (String(b.eventID) === String(eventId)) {
            b.boxNumber = boxNr;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horseToUpdate.BoxNr.push({
            boxNumber: boxNr,
            eventID: eventId
        });
    }
    // HeadNr frissítése az eseményhez
    editedCount = 0;
    horseToUpdate.HeadNr.forEach(h => {
        if (String(h.eventID) === String(eventId)) {
            h.headNumber = headNr;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horseToUpdate.HeadNr.push({
            headNumber: headNr,
            eventID: eventId
        });
    }
    logDb('UPDATE', 'Horse', `${id}`);
    await horseToUpdate.save();
    return horse;
}

/**
 * Megjegyzés törlése lóról
 * @param {string} id - A ló azonosítója
 * @param {string} noteText - A törlendő megjegyzés szövege
 * @returns {Promise<Object>} - A frissített ló
 * @throws {Error} - Ha a ló nem található
 */
export async function deleteHorseNote(id, noteText) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    horse.Notes = horse.Notes.filter(note => note.note !== noteText);
    logDb('UPDATE', 'Horse', `${id}`);
    await Horse.findByIdAndUpdate(id, horse, { runValidators: true });
    return horse;
}

/**
 * Megjegyzés hozzáadása lóhoz
 * @param {string} id - A ló azonosítója
 * @param {Object} noteData - A megjegyzés adatai
 * @returns {Promise<Object>} - A frissített ló
 * @throws {Error} - Ha a ló nem található
 */
export async function addHorseNote(id, noteData) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    const newNote = {
        note: noteData.note,
        timestamp: Date.now(),
        user: noteData.user,
        eventID: noteData.eventID
    };
    logDb('UPDATE', 'Horse', `${id}`);
    horse.Notes.push(newNote);
    await Horse.findByIdAndUpdate(id, horse, { runValidators: true });
    logDb('UPDATE', 'Horse', `${id}`);
    return horse;
}

/**
 * Ló számainak (HeadNr, BoxNr) frissítése adott eseményhez
 * @param {string} id - A ló azonosítója
 * @param {string|number} headNumber - Új fejszám
 * @param {string|number} boxNumber - Új bokszszám
 * @param {string} eventId - Esemény azonosítója
 * @returns {Promise<Object>} - A frissített ló
 * @throws {Error} - Ha a ló nem található
 */
export async function updateHorseNumbers(id, headNumber, boxNumber, eventId) {
    const horse = await Horse.findById(id);
    if (!horse) {
        throw new Error('Horse not found');
    }
    // HeadNr frissítése
    let editedCount = 0;
    horse.HeadNr.forEach(h => {
        if (String(h.eventID) === String(eventId)) {
            h.headNumber = headNumber;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horse.HeadNr.push({
            headNumber: headNumber,
            eventID: eventId
        });
    }
    // BoxNr frissítése
    editedCount = 0;
    horse.BoxNr.forEach(b => {
        if (String(b.eventID) === String(eventId)) {
            b.boxNumber = boxNumber;
            editedCount++;
        }
    });
    if (editedCount === 0) {
        horse.BoxNr.push({
            boxNumber: boxNumber,
            eventID: eventId
        });
    }
    await Horse.findByIdAndUpdate(id, horse, { runValidators: true });
    logDb('UPDATE', 'Horse', `${id}`);
    return horse;
}

/**
 * Lovak lekérése adott eseményhez a nevezésekből
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Array>} - Lovak listája
 * @throws {Error} - Ha nincs nevezés az eseményhez
 */
export async function getHorsesForEvent(eventId) {
    const horsesontheEvent = await Entries.find({ event: eventId }).populate('horse').select('horse');
    if (horsesontheEvent.length === 0) {
        throw new Error('No entries found for the selected event');
    }
    const uniqueHorses = Array.from(new Set(horsesontheEvent.map(entry => entry.horse._id.toString())));
    const horses = await Horse.find({ _id: { $in: uniqueHorses } }).sort({ name: 1 });
    return horses;
}

/**
 * Az összes jogosultság lekérése űrlaphoz
 * @returns {Promise<Array>} - Jogosultságok listája
 */
export async function getAllPermissions() {
    return await Permissions.find();
}

// Nevezés modell importálása
import Entries from '../models/Entries.js';
// Lovas modell importálása
import Vaulter from '../models/Vaulter.js';
// Hajtó modell importálása
import Lunger from '../models/Lunger.js';
// Ló modell importálása
import Horse from '../models/Horse.js';
// Kategória modell importálása
import Category from '../models/Category.js';
// Esemény modell importálása
import Event from '../models/Event.js';
// Időbeosztás elem modell importálása
import TimetablePart from '../models/Timetablepart.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes lovas lekérése
 * @returns {Promise<Array>} - Lovasok listája
 */
export async function getAllVaulters() {
    return await Vaulter.find();
}

/**
 * Az összes hajtó lekérése
 * @returns {Promise<Array>} - Hajtók listája
 */
export async function getAllLungers() {
    return await Lunger.find();
}

/**
 * Az összes ló lekérése
 * @returns {Promise<Array>} - Lovak listája
 */
export async function getAllHorses() {
    return await Horse.find();
}

/**
 * Az összes kategória lekérése csillag szerint rendezve
 * @returns {Promise<Array>} - Kategóriák listája csillag szerint rendezve
 */
export async function getAllCategories() {
    return await Category.find().sort({ Star: 1 });
}

/**
 * Az összes esemény lekérése
 * @returns {Promise<Array>} - Események listája
 */
export async function getAllEvents() {
    return await Event.find();
}

/**
 * Új nevezés létrehozása
 * @param {Object} data - Az új nevezés adatai
 * @returns {Promise<Object>} - A létrehozott nevezés
 */
export async function createEntry(data) {
    const newEntry = new Entries(data);
    await newEntry.save();
    logDb('CREATE', 'Entry', `${newEntry._id}`);
    return newEntry;
}

/**
 * Nevezések lekérése esemény szerint, minden kapcsolódó adattal
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Array>} - Nevezések listája populált mezőkkel
 */
export async function getEntriesByEvent(eventId) {
    return await Entries.find({ event: eventId })
        .populate('vaulter')
        .populate('horse')
        .populate('lunger')
        .populate('category')
        .sort({ name: 1 });
}

/**
 * Nevezés lekérése azonosító alapján, minden kapcsolódó adattal
 * @param {string} id - A nevezés azonosítója
 * @returns {Promise<Object>} - A megtalált nevezés populált mezőkkel
 * @throws {Error} - Ha a nevezés nem található
 */
export async function getEntryByIdWithPopulation(id) {
    const entry = await Entries.findById(id)
        .populate('vaulter')
        .populate('horse')
        .populate('lunger')
        .populate('category')
        .populate('event');
    if (!entry) {
        throw new Error('Entry not found');
    }
    return entry;
}

/**
 * Nevezés frissítése törlés-újra létrehozás mintával, időbeosztás elemek tisztításával
 * Ha a státusz nem 'confirmed', eltávolítja a nevezést az időbeosztásból
 * @param {string} id - A frissítendő nevezés azonosítója
 * @param {Object} updateData - Az új adatok
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Object>} - A régi és új nevezés objektuma
 * @throws {Error} - Ha a nevezés nem található
 */
export async function updateEntry(id, updateData, eventId) {
    // Régi nevezés törlése
    const entry = await Entries.findByIdAndDelete(id);
    if (!entry) {
        throw new Error('Entry not found');
    }
    logDb('DELETE', 'Entry', `${id}`);
    // Új nevezés létrehozása az új adatokkal
    const updated = new Entries(updateData);
    await updated.save();
    logDb('CREATE', 'Entry', `${updated._id}`);
    // Ha a státusz nem 'confirmed', eltávolítjuk az időbeosztásból
    if (updated.status !== 'confirmed') {
        const timetableParts = await TimetablePart.find({
            event: eventId,
            Category: updated.category
        });
        for (const tp of timetableParts) {
            const originalLength = tp.StartingOrder.length;
            tp.StartingOrder = tp.StartingOrder.filter(
                item => item.Entry.toString() !== updated._id.toString()
            );
            // Csak akkor mentjük, ha történt változás
            if (tp.StartingOrder.length !== originalLength) {
                await tp.save();
                logDb('UPDATE', 'TimetablePart', `${tp._id}`);
            }
        }
    }
    return { oldEntry: entry, newEntry: updated };
}

/**
 * Esemény törlése egy nevezésből
 * @param {string} id - A nevezés azonosítója
 * @param {Object} incidentData - A törlendő esemény adatai
 * @returns {Promise<Object>} - A frissített nevezés
 * @throws {Error} - Ha a nevezés nem található
 */
export async function deleteEntryIncident(id, incidentData) {
    const entry = await Entries.findById(id);
    if (!entry) {
        throw new Error('Entry not found');
    }
    entry.EntryIncident = entry.EntryIncident.filter(incident =>
        !(
            incident.description === incidentData.description &&
            incident.incidentType === incidentData.type
        )
    );
    await Entries.findByIdAndUpdate(id, entry, { runValidators: true });
    logDb('UPDATE', 'Entry', `${id}`);
    return entry;
}

/**
 * Esemény hozzáadása egy nevezéshez
 * @param {string} id - A nevezés azonosítója
 * @param {Object} incidentData - Az esemény adatai
 * @returns {Promise<Object>} - A frissített nevezés
 * @throws {Error} - Ha a nevezés nem található
 */
export async function addEntryIncident(id, incidentData) {
    const entry = await Entries.findById(id);
    if (!entry) {
        throw new Error('Entry not found');
    }
    const newIncident = {
        description: incidentData.description,
        incidentType: incidentData.incidentType,
        date: Date.now(),
        User: incidentData.userId
    };
    entry.EntryIncident.push(newIncident);
    await Entries.findByIdAndUpdate(id, entry, { runValidators: true });
    logDb('UPDATE', 'Entry', `${id}`);
    return entry;
}

/**
 * Lovak lekérése esemény alapján a nevezésekből
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Array>} - Lovak listája
 * @throws {Error} - Ha nincs nevezés az eseményhez
 */
export async function getHorsesForEvent(eventId) {
    const horsesontheEvent = await Entries.find({ event: eventId })
        .populate('horse')
        .select('horse');
    if (horsesontheEvent.length === 0) {
        throw new Error('No entries found for the selected event');
    }
    const uniqueHorses = Array.from(new Set(horsesontheEvent.map(entry => entry.horse._id.toString())));
    const horses = await Horse.find({ _id: { $in: uniqueHorses } }).sort({ name: 1 });
    return horses;
}

/**
 * Ló állatorvosi státuszának frissítése
 * @param {string} horseId - A ló azonosítója
 * @param {Object} statusData - Az állatorvosi státusz adatai
 * @returns {Promise<Object>} - A frissített ló
 * @throws {Error} - Ha a ló nem található
 */
export async function updateHorseVetStatus(horseId, statusData) {
    const horse = await Horse.findById(horseId);
    if (!horse) {
        throw new Error('Horse not found');
    }
    horse.VetCheckStatus.push({
        status: statusData.status,
        date: Date.now(),
        user: statusData.userId,
        eventID: statusData.eventId
    });
    await Horse.findByIdAndUpdate(horseId, horse, { runValidators: true });
    logDb('UPDATE', 'Horse', `${horseId}`);
    return horse;
}

/**
 * Kiválasztott esemény lekérése
 * @returns {Promise<Object>} - A kiválasztott esemény
 * @throws {Error} - Ha nincs kiválasztott esemény
 */
export async function getSelectedEvent() {
    const selectedEvent = await Event.findOne({ selected: true });
    if (!selectedEvent) {
        throw new Error('No event selected');
    }
    return selectedEvent;
}

// Esemény modell importálása
import Event from '../models/Event.js';
// Jogosultság modell importálása
import Permissions from '../models/Permissions.js';
// Felhasználó modell importálása
import User from '../models/User.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az összes esemény lekérése név szerint rendezve
 * @returns {Promise<Array>} - Események listája név szerint rendezve
 */
export async function getAllEvents() {
    return await Event.find().sort({ name: 1 });
}

/**
 * Esemény lekérése azonosító alapján
 * @param {string} id - Az esemény azonosítója
 * @returns {Promise<Object>} - A megtalált esemény
 * @throws {Error} - Ha az esemény nem található
 */
export async function getEventById(id) {
    const event = await Event.findById(id);
    if (!event) {
        throw new Error('Event not found');
    }
    return event;
}

/**
 * Új esemény létrehozása
 * @param {Object} data - Az új esemény adatai
 * @returns {Promise<Object>} - A létrehozott esemény
 */
export async function createEvent(data) {
    const newEvent = new Event(data);
    await newEvent.save();
    logDb('CREATE', 'Event', `${newEvent._id}`);
    return newEvent;
}

/**
 * Esemény frissítése azonosító alapján
 * @param {string} id - A frissítendő esemény azonosítója
 * @param {Object} data - Az új adatok
 * @returns {Promise<Object>} - A frissített esemény
 * @throws {Error} - Ha az esemény nem található
 */
export async function updateEvent(id, data) {
    const event = await Event.findByIdAndUpdate(id, data, { runValidators: true });
    if (!event) {
        throw new Error('Event not found');
    }
    logDb('UPDATE', 'Event', `${id}`);
    return event;
}

/**
 * Felelős személy törlése az esemény AssignedOfficials mezőjéből
 * @param {string} id - Az esemény azonosítója
 * @param {Object} personData - A törlendő személy adatai
 * @returns {Promise<Object>} - A frissített esemény
 * @throws {Error} - Ha az esemény nem található
 */
export async function deleteResponsiblePerson(id, personData) {
    const event = await Event.findById(id);
    if (!event) {
        throw new Error('Event not found');
    }
    event.AssignedOfficials = event.AssignedOfficials.filter(official =>
        !(
            official.name === personData.name &&
            official.role === personData.role &&
            official.contact === personData.contact
        )
    );
    logDb('UPDATE', 'Event', `${id}`);
    await Event.findByIdAndUpdate(id, event, { runValidators: true });
    return event;
}

/**
 * Felelős személy hozzáadása az esemény AssignedOfficials mezőjéhez
 * @param {string} id - Az esemény azonosítója
 * @param {Object} personData - A hozzáadandó személy adatai
 * @returns {Promise<Object>} - A frissített esemény
 * @throws {Error} - Ha az esemény nem található
 */
export async function addResponsiblePerson(id, personData) {
    const event = await Event.findById(id);
    if (!event) {
        throw new Error('Event not found');
    }
    const newResponsiblePerson = {
        name: personData.name,
        role: personData.role,
        contact: personData.contact,
        userID: personData.userID
    };
    event.AssignedOfficials.push(newResponsiblePerson);
    logDb('UPDATE', 'Event', `${id}`);
    await Event.findByIdAndUpdate(id, event, { runValidators: true });
    return event;
}

/**
 * Esemény kiválasztása (statikus metódussal)
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Object>} - A kiválasztott esemény
 * @throws {Error} - Ha az esemény nem található
 */
export async function selectEvent(eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }
    await Event.setSelected(eventId);
    return event;
}

/**
 * Az összes jogosultság lekérése űrlaphoz
 * @returns {Promise<Array>} - Jogosultságok listája
 */
export async function getAllPermissions() {
    return await Permissions.find();
}

/**
 * Az összes felhasználó lekérése (csak _id és username mezőkkel)
 * @returns {Promise<Array>} - Felhasználók listája
 */
export async function getAllUsers() {
    return await User.find().select('_id username');
}

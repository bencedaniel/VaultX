import Vaulter from '../models/Vaulter.js';
import Entries from '../models/Entries.js';
import { logDb } from '../logger.js';

/**
 * Összes versenyző (vaulter) lekérdezése név szerint rendezve.
 * @returns {Promise<Array>} Versenyzők tömbje.
 */
export async function getAllVaulters() {
  return await Vaulter.find().sort({ name: 1 }).exec();
}

/**
 * Versenyző lekérdezése azonosító alapján, incidens kapcsolatokkal.
 * @param {string} id - Versenyző azonosító.
 * @returns {Promise<Object>} Feltöltött versenyző dokumentum.
 */
export async function getVaulterById(id) {
  return await Vaulter.findById(id).populate('VaulterIncident.eventID', 'EventName').exec();
}

/**
 * Versenyző lekérdezése azonosító alapján (lean verzió szerkesztéshez).
 * @param {string} id - Versenyző azonosító.
 * @returns {Promise<Object>} Lean versenyző dokumentum.
 */
export async function getVaulterByIdLean(id) {
  return await Vaulter.findById(id).lean().exec();
}

/**
 * Új versenyző létrehozása.
 * @param {Object} vaulterData - Versenyző adatai.
 * @returns {Promise<Object>} A létrehozott versenyző dokumentum.
 */
export async function createVaulter(vaulterData) {
  const newVaulter = new Vaulter(vaulterData);
  await newVaulter.save();
  logDb('CREATE', 'Vaulter', `${newVaulter.Name}`);
  return newVaulter;
}

/**
 * Versenyző adatainak frissítése azonosító alapján.
 * @param {string} id - Versenyző azonosító.
 * @param {Object} vaulterData - Frissített adatok.
 * @returns {Promise<Object>} A frissített versenyző dokumentum.
 */
export async function updateVaulter(id, vaulterData) {
  const vaulter = await Vaulter.findByIdAndUpdate(id, vaulterData, { runValidators: true }).exec();
  logDb('UPDATE', 'Vaulter', `${vaulter.Name}`);
  return vaulter;
}

/**
 * Versenyző rajtszámának frissítése adott eseményhez.
 * @param {string} id - Versenyző azonosító.
 * @param {string} eventId - Esemény azonosító.
 * @param {string|number} armNumber - Új rajtszám.
 * @returns {Promise<Object>} A frissített versenyző dokumentum.
 * @throws {Error} Ha a versenyző nem található.
 */
export async function updateVaulterArmNumber(id, eventId, armNumber) {
  const vaulter = await Vaulter.findById(id).exec();
  if (!vaulter) {
    throw new Error('Vaulter not found');
  }

  let editedCount = 0;
  vaulter.ArmNr.forEach(element => {
    if (String(element.eventID) === String(eventId)) {
      element.armNumber = armNumber;
      editedCount++;
    }
  });

  if (editedCount === 0) {
    vaulter.ArmNr.push({
      eventID: eventId,
      armNumber: armNumber
    });
  }

  await vaulter.save();
  logDb('UPDATE', 'Vaulter', `${vaulter.Name}`);
  return vaulter;
}

/**
 * Incidens hozzáadása egy versenyzőhöz.
 * @param {string} id - Versenyző azonosító.
 * @param {Object} incidentData - Incidens adatai.
 * @returns {Promise<Object>} A frissített versenyző dokumentum.
 * @throws {Error} Ha a versenyző nem található.
 */
export async function addIncidentToVaulter(id, incidentData) {
  const vaulter = await Vaulter.findById(id).exec();
  if (!vaulter) {
    throw new Error('Vaulter not found');
  }

  vaulter.VaulterIncident.push(incidentData);
  await Vaulter.findByIdAndUpdate(id, vaulter, { runValidators: true }).exec();
  logDb('UPDATE', 'Vaulter', `${vaulter.Name}`);
  return vaulter;
}

/**
 * Incidens eltávolítása egy versenyzőtől, megadott kritériumok alapján.
 * @param {string} id - Versenyző azonosító.
 * @param {Object} incidentCriteria - Kritériumok (leírás, típus, userId, dátum).
 * @returns {Promise<Object>} A frissített versenyző dokumentum.
 * @throws {Error} Ha a versenyző nem található.
 */
export async function removeIncidentFromVaulter(id, incidentCriteria) {
  const vaulter = await Vaulter.findById(id).exec();
  if (!vaulter) {
    throw new Error('Vaulter not found');
  }

  // Segédfüggvény: sokféle dátumformátumot ms-re konvertál
  const parseDateToMs = (input) => {
    if (!input && input !== 0) return null;
    if (typeof input === 'number') return input;
    const d1 = new Date(input);
    if (!Number.isNaN(d1.getTime())) return d1.getTime();

    // próbáljuk kinyerni az összetevőket pl. "2025. 11. 05. 12:44:01" vagy "2025-11-05 12:44:01"
    const m = String(input).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2}):(\d{2})/);
    if (m) {
      const [ , y, mo, da, hh, mm, ss ] = m;
      const d2 = new Date(Number(y), Number(mo)-1, Number(da), Number(hh), Number(mm), Number(ss));
      if (!Number.isNaN(d2.getTime())) return d2.getTime();
    }

    // rövidebb minta, másodperc nélkül
    const m2 = String(input).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2})/);
    if (m2) {
      const [ , y, mo, da, hh, mm ] = m2;
      const d3 = new Date(Number(y), Number(mo)-1, Number(da), Number(hh), Number(mm));
      if (!Number.isNaN(d3.getTime())) return d3.getTime();
    }

    return null;
  };

  const reqDateMs = parseDateToMs(incidentCriteria.date);
  const DATE_TOLERANCE_MS = 20 * 1000; // 20s tolerancia

  vaulter.VaulterIncident = vaulter.VaulterIncident.filter(incident => {
    const incDesc = String(incident.description || '');
    const incType = String(incident.incidentType || '');
    const incUser = String(incident.user || incident.User || '');
    const incDateMs = parseDateToMs(incident.date);

    const descMatch = incDesc === String(incidentCriteria.description || '');
    const typeMatch = incType === String(incidentCriteria.incidentType || incidentCriteria.type || '');
    const userMatch = incUser === String(incidentCriteria.userId);

    let dateMatch = false;
    if (reqDateMs === null) {
      dateMatch = true;
    } else if (incDateMs === null) {
      dateMatch = true;
    } else {
      dateMatch = Math.abs(incDateMs - reqDateMs) <= DATE_TOLERANCE_MS;
    }

    const matchesAll = descMatch && typeMatch && userMatch && dateMatch;
    return !matchesAll;
  });

  await Vaulter.findByIdAndUpdate(id, vaulter, { runValidators: true }).exec();
  logDb('UPDATE', 'Vaulter', `${vaulter.Name}`);
  return vaulter;
}

/**
 * Összes nevezés lekérdezése, versenyzővel feltöltve.
 * @returns {Promise<Array>} Nevezések tömbje, feltöltött versenyzőkkel.
 */
export async function getAllEntriesWithVaulters() {
  return await Entries.find().populate('vaulter').exec();
}

/**
 * Összes jogosultság lekérdezése.
 * @returns {Promise<Array>} Jogosultságok tömbje.
 */
export async function getAllPermissions() {
  const Permissions = (await import('../models/Permissions.js')).default;
  return await Permissions.find();
}

/**
 * Összes felhasználó lekérdezése.
 * @returns {Promise<Array>} Felhasználók tömbje.
 */
export async function getAllUsers() {
  const User = (await import('../models/User.js')).default;
  return await User.find();
}

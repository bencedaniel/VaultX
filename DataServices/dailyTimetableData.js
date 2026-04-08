// Napi időbeosztás modell importálása
import DailyTimeTable from '../models/DailyTimeTable.js';
// Időbeosztás elem modell importálása
import TimetablePart from '../models/Timetablepart.js';
// Esemény modell importálása
import Event from '../models/Event.js';
// Felhasználó modell importálása
import User from '../models/User.js';
// Pontozólap modell importálása
import ScoreSheet from '../models/ScoreSheet.js';
// Kategória lekérő függvény importálása
import { getAllCategoriesByStar } from './categoryData.js';
// Naplózó függvény importálása
import { logDb } from '../logger.js';

/**
 * Az adott eseményhez tartozó összes napi időbeosztás lekérése
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Array>} - Napi időbeosztások listája
 */
export const getAllDailyTimeTables = async (eventId) => {
    return await DailyTimeTable.find({ event: eventId }).sort({ Date: 1 });
};

/**
 * Napi időbeosztás lekérése azonosító alapján
 * @param {string} id - A keresett napi időbeosztás azonosítója
 * @returns {Promise<Object>} - A megtalált napi időbeosztás
 */
export const getDailyTimeTableById = async (id) => {
    return await DailyTimeTable.findById(id);
};

/**
 * Új napi időbeosztás létrehozása
 * @param {Object} data - Az új napi időbeosztás adatai
 * @returns {Promise<Object>} - A létrehozott napi időbeosztás
 */
export const createDailyTimeTable = async (data) => {
    const newDailyTimeTable = new DailyTimeTable(data);
    await newDailyTimeTable.save();
    logDb('CREATE', 'DailyTimeTable', `${newDailyTimeTable.Date}`);
    return newDailyTimeTable;
};

/**
 * Napi időbeosztás frissítése azonosító alapján
 * Csak akkor engedélyezett, ha nincs leadott pontozólap
 * @param {string} id - A frissítendő napi időbeosztás azonosítója
 * @param {Object} data - Az új adatok
 * @returns {Promise<Object>} - A frissített napi időbeosztás
 * @throws {Error} - Ha van leadott pontozólap
 */
export const updateDailyTimeTable = async (id, data) => {
    const timetableParts = await TimetablePart.find({ dailytimetable: id }).select('_id');
    const timetablePartIds = timetableParts.map(tp => tp._id);
    const scoreSheets = await ScoreSheet.find({ TimetablePartId: { $in: timetablePartIds } });
    
    if (scoreSheets.length > 0) {
        throw new Error('Cannot edit DailyTimeTable with submitted score sheets');
    }

    const dailytimetable = await DailyTimeTable.findByIdAndUpdate(id, data, { runValidators: true });
    logDb('UPDATE', 'DailyTimeTable', `${dailytimetable.Date}`);
    return dailytimetable;
};

/**
 * Napi időbeosztás törlése azonosító alapján
 * Törli a hozzá tartozó időbeosztás elemeket is
 * @param {string} id - A törlendő napi időbeosztás azonosítója
 * @returns {Promise<Object>} - A törölt napi időbeosztás
 */
export const deleteDailyTimeTable = async (id) => {
    await TimetablePart.deleteMany({ dailytimetable: id });
    const dailytimetable = await DailyTimeTable.findByIdAndDelete(id);
    logDb('DELETE', 'DailyTimeTable', `${dailytimetable.Date}`);
    return dailytimetable;
};

/**
 * Napi időbeosztás létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése
 * @returns {Promise<Object>} - Az űrlaphoz szükséges adatok (jelenleg üres)
 */
export const getDailyTimeTableFormData = async () => {
    return {};
};

/**
 * Adott napi időbeosztáshoz tartozó összes időbeosztás elem lekérése
 * @param {string} dailyTimeTableId - A napi időbeosztás azonosítója
 * @returns {Promise<Array>} - Időbeosztás elemek listája
 */
export const getTimetablePartsByDailyTimeTable = async (dailyTimeTableId) => {
    return await TimetablePart.find({ dailytimetable: dailyTimeTableId })
        .sort({ StartTimePlanned: 1 })
        .populate('Category')
        .exec();
};

/**
 * Az összes időbeosztás elem lekérése
 * @returns {Promise<Array>} - Időbeosztás elemek listája
 */
export const getAllTimetableParts = async () => {
    return await TimetablePart.find();
};

/**
 * Időbeosztás elem lekérése azonosító alapján, napi időbeosztással együtt
 * @param {string} id - Az időbeosztás elem azonosítója
 * @returns {Promise<Object>} - Az időbeosztás elem (napi időbeosztással)
 */
export const getTimetablePartById = async (id) => {
    return await TimetablePart.findById(id).populate('dailytimetable');
};

/**
 * Új időbeosztás elem létrehozása
 * @param {Object} data - Az új időbeosztás elem adatai
 * @returns {Promise<Object>} - A létrehozott időbeosztás elem
 */
export const createTimetablePart = async (data) => {
    const newTimetablePart = new TimetablePart(data);
    await newTimetablePart.save();
    logDb('CREATE', 'TimetablePart', `${newTimetablePart._id}`);
    return newTimetablePart;
};

/**
 * Időbeosztás elem frissítése azonosító alapján
 * Csak akkor engedélyezett, ha nincs leadott pontozólap
 * @param {string} id - A frissítendő időbeosztás elem azonosítója
 * @param {Object} data - Az új adatok
 * @returns {Promise<Object>} - A frissített időbeosztás elem
 * @throws {Error} - Ha van leadott pontozólap
 */
export const updateTimetablePart = async (id, data) => {
    const scoreSheets = await ScoreSheet.find({ TimetablePartId: id });
    if (scoreSheets.length > 0) {
        throw new Error('Cannot edit TimetablePart with submitted score sheets');
    }

    const timetablepart = await TimetablePart.findByIdAndUpdate(
        id,
        data,
        { runValidators: true, new: true }
    );
    logDb('UPDATE', 'TimetablePart', `${id}`);
    return timetablepart;
};

/**
 * Időbeosztás elem törlése azonosító alapján
 * @param {string} id - A törlendő időbeosztás elem azonosítója
 * @returns {Promise<void>} - Ha sikeres, nincs visszatérési érték
 */
export const deleteTimetablePart = async (id) => {
    await TimetablePart.findByIdAndDelete(id);
    logDb('DELETE', 'TimetablePart', `${id}`);
};

/**
 * Időbeosztás elem kezdési idejének mentése
 * @param {string} id - Az időbeosztás elem azonosítója
 * @returns {Promise<Object>} - A frissített időbeosztás elem
 * @throws {Error} - Ha az elem nem található
 */
export const saveTimetablePartStartTime = async (id) => {
    const timetablepart = await TimetablePart.findById(id);
    if (!timetablepart) {
        throw new Error('Timetable element not found');
    }

    timetablepart.StartTimeReal = new Date();
    await timetablepart.save();
    logDb('UPDATE', 'TimetablePart', `${id}`);
    return timetablepart;
};

/**
 * Időbeosztás elem létrehozás/szerkesztés űrlaphoz szükséges adatok lekérése
 * @param {string} eventId - Az esemény azonosítója
 * @returns {Promise<Object>} - Bírók, napok és kategóriák listája
 * @throws {Error} - Ha nincs onsite official
 */
export const getTimetablePartFormData = async (eventId) => {
    const OnsiteOfficials = await Event.findOne({ selected: true }).select('AssignedOfficials');
    
    if (!OnsiteOfficials?.AssignedOfficials) {
        throw new Error('No onsite officials found');
    }

    const userPromises = OnsiteOfficials.AssignedOfficials
        .filter(official => official.userID)
        .map(official => User.findById(official.userID).populate('role').select('-password'));
    
    const users = (await Promise.all(userPromises)).filter(Boolean);
    const judges = users.filter(u => u.role?.roleName.includes('Judge'));
    const days = await DailyTimeTable.find({ event: eventId }).sort({ Date: 1 });
    const categorys = await getAllCategoriesByStar();

    return {
        judges,
        days,
        categorys
    };
};

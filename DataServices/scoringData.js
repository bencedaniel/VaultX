import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';
import User from '../models/User.js';
import Entries from '../models/Entries.js';
import TableMapping from '../models/TableMapping.js';
import Event from '../models/Event.js';
import ScoreSheetTemp from '../models/ScoreSheetTemp.js';

/**
 * A mai napi program lekérdezése.
 * @returns {Promise<Object>} A mai napi program dokumentum.
 */
export async function getTodaysTimetable() {
  // Mai nap kezdete és vége UTC szerint
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  // Napi program lekérdezése
  return await DailyTimeTable.findOne({ Date: { $gte: start, $lt: end } });
}

/**
 * Egy napi programhoz tartozó programrészek lekérdezése kategóriákkal.
 * @param {string} dailyId - Napi program azonosító.
 * @returns {Promise<Array>} Programrészek tömbje, feltöltött kategóriákkal.
 */
export async function getTimetablePartsByDaily(dailyId) {
  return await TimetablePart.find({ dailytimetable: dailyId }).populate('Category').exec();
}

/**
 * Egy programrész lekérdezése minden kapcsolt mezővel.
 * @param {string} id - Programrész azonosító.
 * @returns {Promise<Object>} Feltöltött programrész dokumentum.
 */
export async function getTimetablePartById(id) {
  return await TimetablePart.findById(id)
    .populate('Category')
    .populate({
      path: 'StartingOrder.Entry',
      populate: [
        { path: 'vaulter' },
        { path: 'category' },
        { path: 'lunger' },
        { path: 'horse' }
      ]
    })
    .exec();
}

/**
 * Egy programrész lekérdezése minden kapcsolt mezővel, beleértve a napi programot is.
 * @param {string} id - Programrész azonosító.
 * @returns {Promise<Object>} Feltöltött programrész dokumentum.
 */
export async function getTimetablePartByIdWithDay(id) {
  return await TimetablePart.findById(id)
    .populate('Category')
    .populate({
      path: 'StartingOrder.Entry',
      populate: [
        { path: 'vaulter' },
        { path: 'category' },
        { path: 'lunger' },
        { path: 'horse' },
        { path: 'dailytimetable' }
      ]
    })
    .exec();
}

/**
 * Egy programrész lekérdezése, napi programmal feltöltve.
 * @param {string} id - Programrész azonosító.
 * @returns {Promise<Object>} Feltöltött programrész dokumentum.
 */
export async function getTimetablePartByIdWithDaily(id) {
  return await TimetablePart.findById(id).populate('dailytimetable').exec();
}

/**
 * Programrészek lekérdezése eseményekhez, adott dátumtartományban.
 * @param {Array} eventIds - Esemény azonosítók tömbje.
 * @returns {Promise<Array>} Programrészek tömbje, feltöltött kapcsolatokkal.
 */
export async function getTimetablePartsByEvents(eventIds) {
  const dailytables = await DailyTimeTable.find({ event: { $in: eventIds } }).exec();
  return await TimetablePart.find({ dailytimetable: { $in: dailytables.map(dt => dt._id) } })
    .populate('dailytimetable')
    .populate({
      path: 'StartingOrder',
      populate: [
        {
          path: 'Entry',
          populate: [{ path: 'vaulter' }]
        }
      ]
    })
    .exec();
}

/**
 * Bíró adatainak lekérdezése azonosító alapján.
 * @param {string} judgeId - Bíró azonosító.
 * @returns {Promise<Object>} Bíró dokumentum.
 */
export async function getJudgeById(judgeId) {
  return await User.findById(judgeId).exec();
}

/**
 * Egy eseményhez tartozó nevezések lekérdezése.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Nevezések tömbje, feltöltött kapcsolatokkal.
 */
export async function getEntriesByEvent(eventId) {
  return await Entries.find({ event: eventId })
    .populate('vaulter')
    .populate('category')
    .populate('lunger')
    .populate('horse')
    .exec();
}

/**
 * Egy nevezés lekérdezése azonosító alapján.
 * @param {string} entryId - Nevezés azonosító.
 * @returns {Promise<Object>} Feltöltött nevezés dokumentum.
 */
export async function getEntryById(entryId) {
  return await Entries.findById(entryId)
    .populate('vaulter')
    .populate('category')
    .populate('lunger')
    .populate('horse')
    .exec();
}

/**
 * Táblázat-hozzárendelés lekérdezése asztal és teszttípus alapján.
 * @param {string} table - Asztal azonosító.
 * @param {string} testType - Teszttípus.
 * @returns {Promise<Object>} Táblázat-hozzárendelés dokumentum.
 */
export async function getTableMapping(table, testType) {
  return await TableMapping.findOne({
    Table: table,
    TestType: testType.toLocaleLowerCase()
  }).exec();
}

/**
 * Esemény lekérdezése azonosító alapján.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Object>} Esemény dokumentum.
 */
export async function getEventById(eventId) {
  return await Event.findById(eventId).exec();
}
/**
 * Pontozólap sablon lekérdezése teszttípus, kategória, bírók száma és szerepkör alapján.
 * @param {string} testType - Teszttípus.
 * @param {string} categoryId - Kategória azonosító.
 * @param {number} numberOfJudges - Bírók száma.
 * @param {string} role - Szerepkör.
 * @returns {Promise<Object>} Pontozólap sablon dokumentum.
 */
export async function getScoreSheetTemplate(testType, categoryId, numberOfJudges, role) {
  return await ScoreSheetTemp.findOne({
    TestType: { $regex: new RegExp(`^${testType}$`, 'i') },
    CategoryId: categoryId,
    numberOfJudges: numberOfJudges,
    typeOfScores: role
  }).exec();
}

/**
 * Egy eseményhez tartozó összes programrész lekérdezése.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Programrészek tömbje, feltöltött kapcsolatokkal.
 */
export async function getTimetablePartsByEvent(eventId) {
  const dailytables = await DailyTimeTable.find({ event: eventId }).exec();
  return await TimetablePart.find({ dailytimetable: { $in: dailytables.map(dt => dt._id) } })
    .populate('dailytimetable')
    .populate({
      path: 'StartingOrder',
      populate: [
        { 
          path: 'Entry',
          populate: [
            { path: 'vaulter' }
          ]
        }
      ]
    })
    .exec();
}
import ScoreSheet from '../models/ScoreSheet.js';
import Score from '../models/Score.js';
import TimetablePart from '../models/Timetablepart.js';
import { logger } from '../logger.js';
import { logDb } from '../logger.js';

/**
 * Pontozólap (ScoreSheet) adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Beküldött pontozólapok lekérdezése egy bíróhoz egy programrészben.
 * @param {string} timetablePartId - Programrész azonosító.
 * @param {string} entryId - Nevezés azonosító (opcionális).
 * @param {string} eventId - Esemény azonosító.
 * @param {string} judgeId - Bíró azonosító (opcionális).
 * @returns {Promise<Array>} Pontozólapok tömbje.
 */
export async function getSubmittedScoreSheets(timetablePartId, entryId, eventId, judgeId) {
  // Lekérdezési feltételek összeállítása
  const query = {
    TimetablePartId: timetablePartId,
    EventId: eventId
  };

  if (entryId !== undefined && entryId !== null) {
    query.EntryId = entryId;
  }

  if (judgeId !== undefined && judgeId !== null) {
    query['Judge.userId'] = judgeId;
  }

  // Pontozólapok lekérdezése
  return await ScoreSheet.find(query).exec();
}

/**
 * Egy esemény összes pontozólapjának lekérdezése, szűkítve a táblázat oszlopaira, lean-nel optimalizálva.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Pontozólapok tömbje (tiszta JS objektumokként).
 */
export async function getEventScoreSheets(eventId) {
  return await ScoreSheet.find({ EventId: eventId })
    .select('EntryId TimetablePartId Judge totalScoreBE') 
    .populate({
      path: 'EntryId',
      select: 'vaulter category teamName', 
      populate: [
        { path: 'vaulter', select: 'Name' },
        { path: 'category', select: 'CategoryDispName' }
      ]
    })
    .populate({
      path: 'TimetablePartId',
      select: 'Name'
    })
    .populate({
      path: 'Judge.userId',
      model: 'users',
      select: 'fullname'
    })
    .lean() 
    .exec();
}


/**
 * Egy adott pontozólap lekérdezése azonosító alapján, minden kapcsolattal feltöltve.
 * @param {string} scoresheetId - Pontozólap azonosító.
 * @returns {Promise<Object>} Feltöltött pontozólap dokumentum.
 */
export async function getScoreSheetById(scoresheetId) {
  // Pontozólap lekérdezése és kapcsolt mezők feltöltése
  return await ScoreSheet.findById(scoresheetId)
    .populate('EventId')
    .populate('TemplateId')
    .populate({
      path: 'TimetablePartId',
      populate: [
        { path: 'dailytimetable' }
      ]
    })
    .populate({
      path: 'Judge.userId',
      model: 'users'
    })
    .populate({
      path: 'EntryId',
      populate: [
        { path: 'vaulter' },
        { path: 'lunger' },
        { path: 'horse' },
        { path: 'category' }
      ]
    })
    .exec();
}

/**
 * Új pontozólap mentése és a programrész rajtsorrendjének frissítése.
 * @param {Object} scoreSheetData - Pontozólap adatai.
 * @param {string} timetablePartId - Programrész azonosító.
 * @param {string} entryId - Nevezés azonosító.
 * @returns {Promise<Object>} A létrehozott pontozólap dokumentum.
 */
export async function saveScoreSheet(scoreSheetData, timetablePartId, entryId) {
  // Új pontozólap példány létrehozása
  const newScoreSheet = new ScoreSheet(scoreSheetData);
  await newScoreSheet.save();
  logDb('CREATE', 'ScoreSheet', `${newScoreSheet._id}`);

  // Programrész rajtsorrendjének frissítése
  const timetablePart = await TimetablePart.findById(timetablePartId);
  timetablePart.StartingOrder.forEach(participant => {
    if (participant.Entry.toString() === entryId.toString()) {
      participant.submittedtables.push({
        JudgeID: scoreSheetData.Judge.userId,
        Table: scoreSheetData.Judge.table
      });
    }
  });
  await timetablePart.save();
  logDb('UPDATE', 'TimetablePart', `${timetablePartId}`);

  return newScoreSheet;
}

/**
 * Pontozólap frissítése és a programrész rajtsorrendjének frissítése.
 * @param {string} scoresheetId - Pontozólap azonosító.
 * @param {Object} scoreSheetData - Frissített pontozólap adatok.
 * @param {string} timetablePartId - Programrész azonosító.
 * @param {string} entryId - Nevezés azonosító.
 * @returns {Promise<Object>} A frissített pontozólap dokumentum.
 * @throws {Error} Ha a pontozólap nem található.
 */
export async function updateScoreSheet(scoresheetId, scoreSheetData, timetablePartId, entryId) {
  // Pontozólap keresése azonosító alapján
  const scoreSheet = await ScoreSheet.findById(scoresheetId);
  if (!scoreSheet) {
    throw new Error(`ScoreSheet not found: ${scoresheetId}`);
  }

  // Pontozólap frissítése
  scoreSheet.set(scoreSheetData);
  await scoreSheet.save();
  logDb('UPDATE', 'ScoreSheet', `${scoresheetId}`);

  // Programrész rajtsorrendjének frissítése
  const timetablePart = await TimetablePart.findById(timetablePartId);
  timetablePart.StartingOrder.forEach(participant => {
    if (participant.Entry.toString() === entryId.toString()) {
      if (
        !participant.submittedtables.some(
          st =>
            st.JudgeID.toString() === scoreSheetData.Judge.userId.toString() &&
            st.Table === scoreSheetData.Judge.table
        )
      ) {
        participant.submittedtables.push({
          JudgeID: scoreSheetData.Judge.userId,
          Table: scoreSheetData.Judge.table
        });
      }
    }
  });
  await timetablePart.save();
  logDb('UPDATE', 'TimetablePart', `${timetablePartId}`);

  return scoreSheet;
}

/**
 * Egy esemény összes pontszámának lekérdezése, teljes kapcsolatokkal.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Pontszám dokumentumok tömbje, feltöltött kapcsolatokkal.
 */
export async function getEventScores(eventId) {
  // Pontszámok lekérdezése és kapcsolt mezők feltöltése
  return await Score.find({ event: eventId })
    .populate('timetablepart')
    .populate({
      path: 'entry',
      populate: [{ path: 'vaulter' }, { path: 'category' }]
    })
    .exec();
}

/**
 * Pontszám lekérdezése azonosító alapján.
 * @param {string} scoreId - Pontszám azonosító.
 * @returns {Promise<Object>} A pontszám dokumentum.
 */
export async function getScoreById(scoreId) {
  // Pontszám lekérdezése azonosító alapján
  return await Score.findById(scoreId).exec();
}

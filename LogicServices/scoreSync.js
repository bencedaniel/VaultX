import { logDebug, logDb } from '../logger.js';
import { getScoresByTimetableAndEntry, createScore, updateScore, deleteMultipleScores } from '../DataServices/resultData.js';
import { getSubmittedScoreSheets } from '../DataServices/scoreSheetData.js';
import { getTimetablePartById } from '../DataServices/dailyTimetableData.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * Eredménytábla szinkronizálása: a pontszámok és bírói lapok alapján létrehozza vagy frissíti a Score rekordot.
 * Ha nincs még Score, de minden bírói lap beérkezett, létrehoz egyet.
 * Ha már van egy Score, frissíti azt.
 * Ha több Score van, hibát dob.
 * @param {string} timetablePartId - Az időbeosztás rész azonosítója.
 * @param {string} EntryID - A nevezés azonosítója.
 * @param {string} EventId - Az esemény azonosítója.
 * @returns {Promise<Object|null>} Az új vagy frissített Score dokumentum, vagy null, ha nincs elég adat.
 * @throws {ValidationError} Ha több Score rekord található ugyanarra a kombinációra.
 */
export async function syncScoreTable(timetablePartId, EntryID, EventId) {
  // Meglévő pontszámok lekérdezése
  const scores = await getScoresByTimetableAndEntry(timetablePartId, EntryID, EventId);
  // Időbeosztás rész lekérdezése
  const timetablePart = await getTimetablePartById(timetablePartId);
  // Beérkezett bírói lapok lekérdezése
  const scoreSheets = await getSubmittedScoreSheets(timetablePartId, EntryID, EventId);
  logDebug('Score sync', `${scores.length} scores found for timetablePartId: ${timetablePartId}, EntryId: ${EntryID}, EventId: ${EventId}`);
  // Score rekordhoz szükséges adatok összeállítása
  const scoreData = {
    timetablepart: timetablePartId,
    entry: EntryID,
    event: EventId,
    scoresheets: scoreSheets.map(ss => ({ scoreId: ss._id, table: ss.Judge.table })),
    TotalScore: scoreSheets.length > 0 ? scoreSheets.reduce((acc, curr) => acc + curr.totalScoreBE, 0) / scoreSheets.length : 0
  };
  // Ha még nincs Score, de minden bírói lap beérkezett, létrehozunk egyet
  if (scores.length === 0 && scoreSheets.length === timetablePart.NumberOfJudges) {
    const newScore = await createScore(scoreData);
    logDb('CREATE', 'Score', `timetablePart:${timetablePartId}, Entry:${EntryID}`);
    return newScore;
  }
  // Ha pontosan egy Score van, frissítjük
  else if (scores.length === 1) {
    const updatedScore = await updateScore(scores[0]._id, scoreData);
    logDb('UPDATE', 'Score', `${scores[0]._id}`);
    return updatedScore;
  }
  // Ha nincs Score és nincs elég bírói lap, nem csinálunk semmit
  else if (scores.length === 0) {
    return null;
  }
  // Ha több Score van, az inkonzisztencia, hibát dobunk
  else {
    throw new ValidationError(`Data inconsistency: \n      Multiple scores found for timetablePartId: ${timetablePartId}, EntryId: ${EntryID}, EventId: ${EventId}`);
  }
}
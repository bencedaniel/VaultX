import ScoreSheetTemp from '../models/ScoreSheetTemp.js';
import Category from '../models/Category.js';
import fs from 'fs/promises';
import path from 'path';
import { logger, logDb, logValidation, logWarn, logInfo } from '../logger.js';

const uploadsDir = path.join(process.cwd(), 'static', 'uploads');

/**
 * Statikus URL-t abszolút fájl elérési úttá alakít.
 * @param {string} urlPath - Statikus URL vagy útvonal.
 * @returns {string|null} Abszolút fájl elérési út vagy null.
 */
function toAbsoluteFromStaticUrl(urlPath) {
  if (!urlPath) return null;
  let p = urlPath;
  if (/^https?:\/\//i.test(urlPath)) {
    try { p = new URL(urlPath).pathname; } catch { return null; }
  }
  if (!p.startsWith('/static/uploads/')) return null;
  return path.resolve(process.cwd(), p.replace(/^\//, ''));
}

/**
 * Ellenőrzi, hogy az elérési út az uploads könyvtárban van-e.
 * @param {string} absPath - Abszolút elérési út.
 * @returns {boolean} Igaz, ha az uploads könyvtárban van.
 */
function isInsideUploads(absPath) {
  if (!absPath) return false;
  const rel = path.relative(uploadsDir, absPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Kép fájl törlése a lemezről.
 * @param {string} staticUrl - Statikus URL a törlendő képfájlhoz.
 * @returns {Promise<void>}
 */
export async function deleteImageFile(staticUrl) {
  const abs = toAbsoluteFromStaticUrl(staticUrl);
  if (!abs) { logWarn('DELETE_IMAGE', `Skip delete (not static uploads): ${staticUrl}`); return; }
  if (!isInsideUploads(abs)) { logWarn('DELETE_IMAGE', `Skip delete (outside uploads): ${abs}`); return; }
  try {
    await fs.unlink(abs);
    logInfo(`Deleted file: ${abs}`);
  } catch (e) {
    logWarn('DELETE_IMAGE_FAILED', `Delete failed or file missing: ${abs}`, e.message);
  }
}

/**
 * JSON tömb mező feldolgozása űrlapból.
 * @param {any} value - Az űrlap mező értéke.
 * @param {string} fieldName - Mező neve (hibához).
 * @returns {Array} Feldolgozott tömb.
 * @throws {Error} Ha a mező nem tömb vagy nem értelmezhető.
 */
export function parseJSONArrayField(value, fieldName) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(`${fieldName} must be an array`);
    return parsed.map(field => ({
      ...field,
      position: {
        ...field.position,
        w: field.width
      }
    }));
  } catch (e) {
    logValidation('JSON_PARSE_ERROR', `Field: ${fieldName}`, { error: e.message });
    throw new Error(`${fieldName} parse error: ${e.message}`);
  }
}

/**
 * Összes pontozólap sablon lekérdezése kategóriákkal.
 * @returns {Promise<Array>} Pontozólap sablonok tömbje, feltöltött kategóriákkal.
 */
export async function getAllScoreSheetTemplates() {
  return await ScoreSheetTemp.find().populate('CategoryId').exec();
}

/**
 * Pontozólap sablon lekérdezése azonosító alapján.
 * @param {string} id - Sablon azonosító.
 * @returns {Promise<Object>} Feltöltött sablon dokumentum.
 */
export async function getScoreSheetTemplateById(id) {
  return await ScoreSheetTemp.findById(id).populate('CategoryId').exec();
}

/**
 * Összes kategória lekérdezése csillag szerint rendezve.
 * @returns {Promise<Array>} Kategóriák tömbje.
 */
export async function getAllCategories() {
  return await Category.find().sort({ Star: 1 }).exec();
}

/**
 * Kategóriák lekérdezése azonosítók alapján.
 * @param {Array} ids - Kategória azonosítók tömbje.
 * @returns {Promise<Array>} Kategóriák tömbje.
 */
export async function getCategoriesByIds(ids) {
  return await Category.find({ _id: { $in: ids } }).exec();
}

/**
 * Új pontozólap sablon létrehozása.
 * @param {Object} templateData - Sablon adatai.
 * @returns {Promise<Object>} A létrehozott sablon dokumentum.
 */
export async function createScoreSheetTemplate(templateData) {
  const sheet = new ScoreSheetTemp(templateData);
  await sheet.save();
  logDb('CREATE', 'ScoreSheetTemplate', `${sheet._id}`);
  return sheet;
}

/**
 * Pontozólap sablon frissítése.
 * @param {string} id - Sablon azonosító.
 * @param {Object} templateData - Frissített sablon adatok.
 * @returns {Promise<Object>} A frissített sablon dokumentum.
 */
export async function updateScoreSheetTemplate(id, templateData) {
  const sheet = await ScoreSheetTemp.findByIdAndUpdate(id, templateData, {
    runValidators: true,
    new: true
  }).exec();
  logDb('UPDATE', 'ScoreSheetTemplate', `${id}`);
  return sheet;
}

/**
 * Pontozólap sablon törlése.
 * @param {string} id - Sablon azonosító.
 * @returns {Promise<Object>} A törölt sablon dokumentum.
 */
export async function deleteScoreSheetTemplate(id) {
  const sheet = await ScoreSheetTemp.findByIdAndDelete(id).exec();
  if (sheet && sheet.bgImage) {
    await deleteImageFile(sheet.bgImage);
  }
  logDb('DELETE', 'ScoreSheetTemplate', `${id}`);
  return sheet;
}

/**
 * Ellenőrzi, hogy a kategóriák azonos korcsoport típusúak-e.
 * @param {Array} categories - Kategóriák tömbje.
 * @returns {boolean} Igaz, ha minden kategória azonos típusú.
 * @throws {Error} Ha eltérő típusú kategóriák vannak.
 */
export function validateCategoriesAgegroup(categories) {
  if (categories.length === 0) {
    throw new Error('Selected category does not exist');
  }

  const firstType = categories[0].Type;
  const hasMixedAgegroup = categories.some(c => c.Type !== firstType);

  if (hasMixedAgegroup) {
    const missmatched = categories.filter(c => c.Type !== firstType).map(c => c.CategoryDispName).join(', ');
    throw new Error(`Selected categories must be of the same Agegroup type. Mismatched: ${missmatched}`);
  }

  return true;
}

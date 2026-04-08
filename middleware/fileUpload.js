import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../logger.js';
import { FILE_UPLOAD } from '../config/index.js';

/**
 * Feltöltési könyvtár elérési útjának beállítása.
 * Ha nem létezik, létrehozza a könyvtárat rekurzívan.
 */
const uploadDir = path.join(process.cwd(), 'static', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

/**
 * Multer storage konfiguráció: fájlok elmentése egyedi névvel a feltöltési könyvtárba.
 * Fájlnév: eredeti név szóközök helyett aláhúzás, majd időbélyeg és random szám.
 * Feltöltés naplózása (ha a logger elérhető).
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const generated = `${base}-${unique}${ext}`;
    cb(null, generated);
    // Feltöltés naplózása (opcionális)
    try { logger?.db?.(`Upload: ${file.originalname} -> ${generated}`); } catch {}
  }
});

/**
 * Fájlszűrő: csak engedélyezett MIME-típusú képeket enged feltölteni.
 * @param {Request} _req - Express kérés objektum.
 * @param {Object} file - Feltöltött fájl objektum.
 * @param {Function} cb - Callback, amely hibát vagy true/false-t vár.
 */
function fileFilter(_req, file, cb) {
  const ok = FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  cb(ok ? null : new Error('Only image files allowed'), ok);
}

/**
 * Kép feltöltés middleware (multer):
 * - csak engedélyezett képtípusokat fogad el
 * - maximális fájlméretet korlátoz
 * - egyedi fájlnevet generál
 * Használat: router.post('/upload', uploadImage.single('file'), ...)
 */
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_UPLOAD.MAX_FILE_SIZE }
});
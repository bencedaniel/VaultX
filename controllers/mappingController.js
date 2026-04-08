// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Táblatérképezéssel kapcsolatos adatkezelő függvények importálása
import {
  getAllMappings,      // Összes mapping lekérdezése
  getMappingById,      // Egy adott mapping lekérdezése ID alapján
  createMapping,       // Új mapping létrehozása
  updateMapping,       // Mapping adatainak frissítése
  deleteMapping,       // Mapping törlése
  getAllPermissions    // Jogosultságok lekérdezése
} from '../DataServices/mappingData.js';


// Új mapping (táblatérkép) űrlap megjelenítése
const renderNew = (req, res) => {
  res.render('mapping/newTablemapping', {
    formData: req.session.formData,                       // Előzőleg megadott űrlapadatok (ha volt hiba)
    rolePermissons: req.user?.role?.permissions,          // Felhasználó jogosultságai
    failMessage: req.session.failMessage,                 // Sikertelen művelet üzenete
    successMessage: req.session.successMessage,           // Sikeres művelet üzenete
    user: req.user                                        // Bejelentkezett felhasználó adatai
  });
  // Üzenetek törlése a session-ből, hogy ne jelenjenek meg újratöltéskor
  req.session.failMessage = null;
  req.session.successMessage = null;
};

// Új mapping (táblatérkép) létrehozása POST kérésre
const createNew = asyncHandler(async (req, res) => {
  const newMapping = await createMapping(req.body); // Új mapping létrehozása az űrlap adataiból
  logOperation('MAPPING_CREATE', `Mapping created: ${newMapping._id}`, req.user.username, HTTP_STATUS.CREATED); // Művelet naplózása
  req.session.successMessage = MESSAGES.SUCCESS.MAPPING_CREATED; // Sikeres létrehozás üzenet
  res.redirect('/mapping/dashboard'); // Átirányítás a dashboardra
});

// Mappingek (táblatérképek) dashboard oldal megjelenítése
const dashboard = asyncHandler(async (req, res) => {
  const mappings = await getAllMappings(); // Összes mapping lekérdezése
  res.render('mapping/tablemappingdash', {
    mappings,                                            // Mappingek listája
    rolePermissons: req.user?.role?.permissions,         // Felhasználó jogosultságai
    failMessage: req.session.failMessage,                // Sikertelen művelet üzenete
    successMessage: req.session.successMessage,          // Sikeres művelet üzenete
    user: req.user                                       // Bejelentkezett felhasználó adatai
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Mapping (táblatérkép) szerkesztő űrlap megjelenítése
const editGet = asyncHandler(async (req, res) => {
  const mapping = await getMappingById(req.params.id); // Mapping lekérdezése ID alapján
  res.render('mapping/editTablemapping', {
    formData: mapping,                                 // Szerkesztendő mapping adatai
    rolePermissons: req.user?.role?.permissions,       // Felhasználó jogosultságai
    failMessage: req.session.failMessage,              // Sikertelen művelet üzenete
    successMessage: req.session.successMessage,        // Sikeres művelet üzenete
    user: req.user                                     // Bejelentkezett felhasználó adatai
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Mapping (táblatérkép) adatainak frissítése POST kérésre
const editPost = asyncHandler(async (req, res) => {
  const mapping = await updateMapping(req.params.id, req.body); // Mapping frissítése az űrlap adataiból
  logOperation('MAPPING_UPDATE', `Mapping updated: ${mapping?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
  req.session.successMessage = MESSAGES.SUCCESS.MAPPING_UPDATED; // Sikeres frissítés üzenet
  res.redirect('/mapping/dashboard'); // Átirányítás a dashboardra
});

// Mapping (táblatérkép) törlése DELETE kérésre
const delete_ = asyncHandler(async (req, res) => {
  const mapping = await deleteMapping(req.params.id); // Mapping törlése ID alapján
  logOperation('MAPPING_DELETE', `Mapping deleted: ${mapping?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
  req.session.successMessage = MESSAGES.SUCCESS.MAPPING_DELETED; // Sikeres törlés üzenet
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.MAPPING_DELETED }); // Válasz visszaadása JSON-ben
});

// A vezérlő által exportált handler függvények
export default {
  renderNew,      // Új mapping űrlap megjelenítése
  createNew,      // Új mapping létrehozása
  dashboard,      // Mappingek dashboard oldal megjelenítése
  editGet,        // Mapping szerkesztő űrlap megjelenítése
  editPost,       // Mapping adatainak frissítése
  delete: delete_ // Mapping törlése
};

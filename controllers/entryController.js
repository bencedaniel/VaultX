// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Nevezésekkel, lovakkal, kategóriákkal stb. kapcsolatos adatkezelő függvények importálása
import {
  getAllVaulters,            // Összes versenyző lekérdezése
  getAllLungers,             // Összes futószáras lekérdezése
  getAllHorses,              // Összes ló lekérdezése
  getAllCategories,          // Összes kategória lekérdezése
  getAllEvents,              // Összes esemény lekérdezése
  createEntry,               // Új nevezés létrehozása
  getEntriesByEvent,         // Nevezések lekérdezése esemény szerint
  getEntryByIdWithPopulation,// Egy nevezés lekérdezése (populált adatokkal)
  updateEntry,               // Nevezés módosítása
  deleteEntryIncident,       // Nevezéshez tartozó incidens törlése
  addEntryIncident,          // Nevezéshez tartozó incidens hozzáadása
  getHorsesForEvent,         // Lovak lekérdezése eseményhez
  updateHorseVetStatus,      // Ló állatorvosi státuszának frissítése
  getSelectedEvent           // Kiválasztott esemény lekérdezése
} from '../DataServices/entryData.js';

// Console log import (ha szükséges)
import { log } from 'console';

// Nevezések, incidensek, lovak, kategóriák stb. vezérlője
class EntryController {
  // Új nevezés űrlap megjelenítése
  renderNew = asyncHandler(async (req, res) => {
    const categorys = await getAllCategories();

    res.render('entry/newEntry', {
      vaulters: await getAllVaulters(),
      lungers: await getAllLungers(),
      horses: await getAllHorses(),
      categorys: categorys,
      events: await getAllEvents(),
      formData: req.session.formData,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Új nevezés létrehozása POST kérésre
  createNew = asyncHandler(async (req, res) => {
    const newEntry = await createEntry(req.body);
    logOperation('ENTRY_CREATE', `Entry created: ${newEntry?.name || req.body?.name || 'unknown'}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.ENTRY_CREATED;
    res.redirect('/entry/dashboard');
  })

  // Nevezések dashboard oldal megjelenítése
  dashboard = asyncHandler(async (req, res) => {
    const selectedEvent = await getSelectedEvent();
    const entrys = await getEntriesByEvent(selectedEvent._id);

    res.render('entry/entrydash', {
      entrys,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Nevezés szerkesztő űrlap megjelenítése
  editGet = asyncHandler(async (req, res) => {
    const entry = await getEntryByIdWithPopulation(req.params.id);
    const categorys = await getAllCategories();
    res.render('entry/editEntry', {
      vaulters: await getAllVaulters(),
      lungers: await getAllLungers(),
      horses: await getAllHorses(),
      categorys: categorys,
      events: await getAllEvents(),
      formData: entry,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Nevezés adatainak frissítése POST kérésre
  editPost = asyncHandler(async (req, res) => {
    logDebug('Entry request body', req.body);
    const updateData = { ...req.body, _id: req.params.id };
    const { oldEntry, newEntry } = await updateEntry(req.params.id, updateData, res.locals.selectedEvent._id);

    logOperation('ENTRY_UPDATE', `Entry updated: ${oldEntry?.EntryDispName || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.ENTRY_UPDATED;
    res.redirect('/entry/dashboard');
  })

  // Nevezéshez tartozó incidens törlése
  deleteIncident = asyncHandler(async (req, res) => {
    const entry = await deleteEntryIncident(req.params.id, req.body);
    logOperation('ENTRY_UPDATE', `Entry updated: ${entry?.name || req.params.id}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: 'Incident deleted successfully' });
  })

  // Új incidens hozzáadása nevezéshez
  newIncidentPost = asyncHandler(async (req, res) => {
    const incidentData = {
      description: req.body.description,
      incidentType: req.body.incidentType,
      userId: req.user._id
    };
    const entry = await addEntryIncident(req.params.id, incidentData);
    logOperation('ENTRY_UPDATE', `Entry incident created: ${entry?.Name || req.params.id}`, req.user.username, HTTP_STATUS.CREATED);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.INCIDENT_ADDED });
  })

  // Lovak állatorvosi státuszának megjelenítése adott eseményhez
  vetCheckGet = asyncHandler(async (req, res) => {
    const horses = await getHorsesForEvent(res.locals.selectedEvent._id);
    horses.forEach(horse => {
      horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
      horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
      horse.VetCheckStatus = horse.VetCheckStatus.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));


    });
    res.render('entry/vetcheckdash', {
      horses,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Ló állatorvosi státuszának frissítése
  updateVetStatus = asyncHandler(async (req, res) => {
    const statusData = {
      status: req.body.status,
      userId: req.user._id,
      eventId: res.locals.selectedEvent._id
    };
    const horse = await updateHorseVetStatus(req.params.horseId, statusData);
    logOperation('HORSE_UPDATE', `Horse updated: ${horse?.Horsename || req.params.horseId}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.VET_STATUS_UPDATED });
  })
}

export default new EntryController();

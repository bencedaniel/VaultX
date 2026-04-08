// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Eseményekkel kapcsolatos adatkezelő függvények importálása
import {
  getAllEvents,             // Összes esemény lekérdezése
  getEventById,             // Egy adott esemény lekérdezése ID alapján
  createEvent,              // Új esemény létrehozása
  updateEvent,              // Esemény módosítása
  deleteResponsiblePerson,  // Felelős személy törlése eseményből
  addResponsiblePerson,     // Felelős személy hozzáadása eseményhez
  selectEvent,              // Esemény kiválasztása
  getAllPermissions,        // Összes jogosultság lekérdezése
  getAllUsers               // Összes felhasználó lekérdezése
} from '../DataServices/eventData.js';

// Új esemény űrlap megjelenítése
const renderNew = (req, res) => {
  res.render('event/newEvent', {
    formData: req.session.formData,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
};

// Új esemény létrehozása POST kérésre
const createNew = asyncHandler(async (req, res) => {
  const newEvent = await createEvent(req.body);
  logOperation('EVENT_CREATE', `Event created: ${newEvent.name}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.EVENT_CREATED;
  res.redirect('/admin/event/dashboard');
});

// Események dashboard oldal megjelenítése
const dashboard = asyncHandler(async (req, res) => {
  const events = await getAllEvents();
  logDebug('Session', req.session.successMessage);
  res.render('event/eventdash', {
    events,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Esemény szerkesztő űrlap megjelenítése
const editGet = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);
  res.render('event/editEvent', {
    formData: event,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Esemény adatainak frissítése POST kérésre
const editPost = asyncHandler(async (req, res) => {
  const event = await updateEvent(req.params.id, req.body);
  logOperation('EVENT_UPDATE', `Event updated: ${event?.name || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.EVENT_UPDATED;
  res.redirect('/admin/event/dashboard');
});

// Esemény részletei oldal megjelenítése
const details = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);
  const users = await getAllUsers();
  res.render('event/EventDetail', {
    users: users,
    formData: event,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Felelős személy törlése eseményből
const deleteResponsiblePersonHandler = asyncHandler(async (req, res) => {
  const event = await deleteResponsiblePerson(req.params.id, req.body);
  logOperation('EVENT_UPDATE', `Event updated: ${event?.EventName || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: req.body.name + ' ' + MESSAGES.SUCCESS.RESPONSIBLE_PERSON_DELETED + req.user.username });
});

// Felelős személy hozzáadása eseményhez
const addResponsiblePersonHandler = asyncHandler(async (req, res) => {
  const event = await addResponsiblePerson(req.params.id, req.body);
  logOperation('EVENT_UPDATE', `Event updated: ${event?.EventName || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.RESPONSIBLE_PERSON_ADDED });
});

// Esemény kiválasztása (session-beállítás és naplózás)
const selectEventHandler = asyncHandler(async (req, res) => {
  const event = await selectEvent(req.params.eventId);
  logOperation('EVENT_UPDATE', `Event updated: ${event?.EventName || req.params.eventId}`, req.user.username, HTTP_STATUS.OK);
  req.session.selectedEvent = event?._id;
  req.session.successMessage = MESSAGES.SUCCESS.EVENT_SELECTED + ' ' + (event?.EventName || '');
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.EVENT_SELECTED + ' ' + (event?.EventName || '') });
});

// A vezérlő által exportált handler függvények
export default {
  renderNew,                        // Új esemény űrlap megjelenítése
  createNew,                        // Új esemény létrehozása
  dashboard,                        // Események dashboard oldal megjelenítése
  editGet,                          // Esemény szerkesztő űrlap megjelenítése
  editPost,                         // Esemény adatainak frissítése
  details,                          // Esemény részletei oldal megjelenítése
  deleteResponsiblePersonHandler,   // Felelős személy törlése
  addResponsiblePersonHandler,      // Felelős személy hozzáadása
  selectEventHandler                // Esemény kiválasztása
};

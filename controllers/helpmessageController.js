// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Súgóüzenetekkel kapcsolatos adatkezelő függvények importálása
import {
  getAllHelpMessages,    // Összes súgóüzenet lekérdezése
  getHelpMessageById,    // Egy adott súgóüzenet lekérdezése ID alapján
  createHelpMessage,     // Új súgóüzenet létrehozása
  updateHelpMessage,     // Súgóüzenet módosítása
  deleteHelpMessage      // Súgóüzenet törlése
} from '../DataServices/helpMessageData.js';


// Új súgóüzenet űrlap megjelenítése
const renderNew = (req, res) => {
  res.render('helpmessages/newHelpMessage', {
    formData: req.session.formData,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
};

// Új súgóüzenet létrehozása POST kérésre
const createNew = asyncHandler(async (req, res) => {
  const newHelpMessage = await createHelpMessage(req.body);
  logOperation('HELP_MESSAGE_CREATE', `Help message created: ${newHelpMessage._id}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.HELP_MESSAGE_CREATED;
  res.redirect('/helpmessages/dashboard');
});

// Súgóüzenetek dashboard oldal megjelenítése
const dashboard = asyncHandler(async (req, res) => {
  const helpMessages = await getAllHelpMessages();
  res.render('helpmessages/helpMessageDashboard', {
    helpMessages,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Súgóüzenet szerkesztő űrlap megjelenítése
const editGet = asyncHandler(async (req, res) => {
  const helpMessage = await getHelpMessageById(req.params.id);
  res.render('helpmessages/editHelpMessage', {
    formData: helpMessage,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Súgóüzenet adatainak frissítése POST kérésre
const editPost = asyncHandler(async (req, res) => {
  const helpMessage = await updateHelpMessage(req.params.id, req.body);
  logOperation('HELP_MESSAGE_UPDATE', `Help message updated: ${helpMessage?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.HELP_MESSAGE_UPDATED;
  res.redirect('/helpmessages/dashboard');
});

// Súgóüzenet törlése DELETE kérésre
const delete_ = asyncHandler(async (req, res) => {
  const helpMessage = await deleteHelpMessage(req.params.id);
  logOperation('HELP_MESSAGE_DELETE', `Help message deleted: ${helpMessage?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.HELP_MESSAGE_DELETED;
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.HELP_MESSAGE_DELETED });
});

// A vezérlő által exportált handler függvények
export default {
  renderNew,      // Új súgóüzenet űrlap megjelenítése
  createNew,      // Új súgóüzenet létrehozása
  dashboard,      // Súgóüzenetek dashboard oldal megjelenítése
  editGet,        // Súgóüzenet szerkesztő űrlap megjelenítése
  editPost,       // Súgóüzenet adatainak frissítése
  delete: delete_ // Súgóüzenet törlése
};

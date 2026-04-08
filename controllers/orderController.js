// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Rendelési (sorsolási) logikához szükséges adatkezelő függvények importálása
import {
  getTimetablePartById,                // Időbeosztás-részlet lekérdezése ID alapján
  getEntriesForCategories,              // Kategóriákhoz tartozó nevezések lekérdezése
  validateAndFilterStartingOrder,       // Sorsolási sorrend validálása és szűrése
  updateStartingOrder,                  // Sorsolási sorrend frissítése
  generateNewOrderNumber,               // Új sorsolási szám generálása
  updateEntryOrderNumber,               // Nevezés sorsolási számának frissítése
  checkAndGenerateConflictingOrders,    // Ütköző sorrendek ellenőrzése és generálása
  generateCompleteStartingOrder,        // Teljes sorsolási sorrend generálása
  updateTimetablePartStatus,            // Időbeosztás-részlet státuszának frissítése
  parseCategoriesArray                  // Kategória tömb feldolgozása
} from '../DataServices/orderData.js';


// Sorsolási sorrend szerkesztő oldal megjelenítése
const editGet = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id); // Időbeosztás-részlet lekérdezése
  const eventID = res.locals.selectedEvent?._id;                   // Aktuális esemény azonosítója

  // Ha nincs sorsolási sorrend vagy a sorsolás nem történt meg, visszairányítunk
  if (timetablePart.StartingOrder.length === 0 || timetablePart.drawingDone === false) {
    req.session.failMessage = MESSAGES.ERROR.NO_STARTING_ORDER;
    return res.redirect('/order/createSelect/' + req.params.id);
  }

  // Kategóriák feldolgozása és nevezések lekérdezése
  const categories = parseCategoriesArray(timetablePart.Category);
  const entries = await getEntriesForCategories(eventID, categories);

  // Csak a létező nevezések maradnak a sorrendben
  const validEntryIds = entries.map(e => e._id);
  await validateAndFilterStartingOrder(timetablePart, validEntryIds);
  // Hibák naplózása konzolra (fejlesztői célból)
  console.log('Valid starting order:', req.session.failMessage);
  res.render('order/editorder', {
    entries: entries,                                 // Nevezések listája
    formData: timetablePart,                          // Időbeosztás-részlet adatai
    rolePermissons: req.user?.role?.permissions,      // Felhasználó jogosultságai
    failMessage: req.session.failMessage,             // Sikertelen művelet üzenete
    successMessage: req.session.successMessage,       // Sikeres művelet üzenete
    user: req.user                                    // Bejelentkezett felhasználó adatai
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Sorsolási sorrend felülírása (egy nevezés új sorszámot kap)
const overwrite = asyncHandler(async (req, res) => {
  // Bemeneti adatok validálása
  if (!req.body.id || !req.body.newOrder || isNaN(req.body.newOrder) || req.body.newOrder < 1) {
    req.session.failMessage = MESSAGES.ERROR.INVALID_ORDER_DATA;
    logValidation('ORDER_UPDATE', `Invalid order data: ${JSON.stringify(req.body)}`, req.user.username, HTTP_STATUS.BAD_REQUEST);
    req.session.failMessage = MESSAGES.ERROR.INVALID_ORDER_DATA;
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: MESSAGES.ERROR.INVALID_ORDER_DATA });
  }
  // Sorrend frissítése az adott nevezéshez
  const timetablePart = await updateStartingOrder(req.params.id, {
    entryId: req.body.id,
    newOrder: req.body.newOrder
  });

  logOperation('ORDER_UPDATE', `Order updated: TimetablePart ${timetablePart._id}, Entry ${req.body.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
  req.session.successMessage = MESSAGES.SUCCESS.STARTING_ORDER_UPDATED; // Sikeres frissítés üzenet
  return res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.STARTING_ORDER_UPDATED });
});

// Sorsolási sorrend generálása vagy ütközések ellenőrzése
const createOrder = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id); // Időbeosztás-részlet lekérdezése
  const eventID = res.locals.selectedEvent?._id;                   // Aktuális esemény azonosítója

  // Kategóriák feldolgozása és nevezések lekérdezése
  const categories = parseCategoriesArray(timetablePart.Category);
  const entries = await getEntriesForCategories(eventID, categories);

  // Ha még nem történt ütközésellenőrzés, először azt végezzük el
  if (!timetablePart.conflictsChecked) {
    const { timetablePart: updatedPart, conflictedEntries } = await checkAndGenerateConflictingOrders(timetablePart, entries);

    res.render('order/checkconflicts', {
      PreGeneratedOrder: updatedPart.StartingOrder,           // Előre generált sorrend
      entries: conflictedEntries,                             // Ütköző nevezések
      formData: updatedPart,                                  // Frissített időbeosztás-részlet
      rolePermissons: req.user?.role?.permissions,            // Felhasználó jogosultságai
      failMessage: req.session.failMessage,                   // Sikertelen művelet üzenete
      successMessage: req.session.successMessage,             // Sikeres művelet üzenete
      user: req.user                                         // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;

  } else {
    // Ha már ellenőriztük az ütközéseket, végleges sorrendet generálunk
    const updatedPart = await generateCompleteStartingOrder(timetablePart, entries);

    res.render('order/vieworder', {
      entries: entries,                                       // Nevezések listája
      formData: updatedPart,                                  // Frissített időbeosztás-részlet
      rolePermissons: req.user?.role?.permissions,            // Felhasználó jogosultságai
      failMessage: req.session.failMessage,                   // Sikertelen művelet üzenete
      successMessage: req.session.successMessage,             // Sikeres művelet üzenete
      user: req.user                                         // Bejelentkezett felhasználó adatai
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  }
});

// Ütközések megerősítése (ha a felhasználó elfogadja az ütköző sorrendet)
const confirmConflicts = asyncHandler(async (req, res) => {
  await updateTimetablePartStatus(req.params.id, { conflictsChecked: true }); // Státusz frissítése

  req.session.successMessage = MESSAGES.SUCCESS.CONFLICTS_CONFIRMED; // Sikeres megerősítés üzenet
  return res.redirect('/order/createOrder/' + req.params.id); // Visszairányítás a sorrend generálásához
});

// Új sorsolási szám generálása egy nevezéshez
const getNewOrder = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id); // Időbeosztás-részlet lekérdezése
  const eventID = res.locals.selectedEvent?._id;                   // Aktuális esemény azonosítója

  // Kategóriák feldolgozása és nevezések lekérdezése
  const categories = parseCategoriesArray(timetablePart.Category);
  const entries = await getEntriesForCategories(eventID, categories);

  // Véletlenszerű új sorsolási szám generálása
  const randomnumber = await generateNewOrderNumber(timetablePart, entries.length, req.body.oldNumber);

  // Nevezés sorsolási számának frissítése
  await updateEntryOrderNumber(req.params.id, req.body.id, randomnumber);

  logOperation('ORDER_UPDATE', `Order updated: TimetablePart ${req.params.id}, Entry ${req.body.id}`, req.user.username, HTTP_STATUS.OK); // Művelet naplózása
  return res.status(HTTP_STATUS.OK).json({ newOrder: randomnumber }); // Új sorsolási szám visszaadása
});

// Sorrendkészítési mód kiválasztó oldal megjelenítése
const createSelectGet = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id); // Időbeosztás-részlet lekérdezése

  res.render('order/createselect', {
    formData: timetablePart,                          // Időbeosztás-részlet adatai
    rolePermissons: req.user?.role?.permissions,      // Felhasználó jogosultságai
    failMessage: req.session.failMessage,             // Sikertelen művelet üzenete
    successMessage: req.session.successMessage,       // Sikeres művelet üzenete
    user: req.user                                    // Bejelentkezett felhasználó adatai
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Sorrendkészítési mód kiválasztása POST kérésre
const createSelectPost = asyncHandler(async (req, res) => {
  // Bemeneti adatok validálása: csak a támogatott módszerek engedélyezettek
  if (!req.body.creationMethod || (req.body.creationMethod !== 'Drawing' && req.body.creationMethod !== 'Copy')) {
    req.session.failMessage = MESSAGES.ERROR.INVALID_CREATION_METHOD;
    return res.redirect('/order/createSelect/' + req.params.id);
  }

  // Sorsolásos módszer választása esetén a sorrendet töröljük, majd átirányítunk a generálásra
  if (req.body.creationMethod === 'Drawing') {
    await updateTimetablePartStatus(req.params.id, { StartingOrder: [] });
    return res.redirect('/order/createOrder/' + req.params.id);

  // Másolásos módszer még nincs implementálva
  } else if (req.body.creationMethod === 'Copy') {
    req.session.failMessage = MESSAGES.ERROR.COPY_METHOD_NOT_IMPLEMENTED;
    return res.redirect('/order/createSelect/' + req.params.id);
  }
});

// A vezérlő által exportált handler függvények
export default {
  editGet,           // Sorsolási sorrend szerkesztő oldal
  overwrite,         // Sorsolási sorrend felülírása
  createOrder,       // Sorsolási sorrend generálása vagy ütközésellenőrzés
  confirmConflicts,  // Ütközések megerősítése
  getNewOrder,       // Új sorsolási szám generálása
  createSelectGet,   // Sorrendkészítési mód kiválasztó oldal
  createSelectPost   // Sorrendkészítési mód kiválasztása
};

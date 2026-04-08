// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Ló adatokkal kapcsolatos adatkezelő függvények importálása
import {
  getAllHorses,                // Összes ló lekérdezése
  getHorseById,                // Egy adott ló lekérdezése ID alapján
  getHorseByIdWithPopulation,  // Ló lekérdezése populált adatokkal
  createHorse,                 // Új ló létrehozása
  updateHorse,                 // Ló adatainak frissítése
  deleteHorseNote,             // Lóhoz tartozó megjegyzés törlése
  addHorseNote,                // Lóhoz tartozó megjegyzés hozzáadása
  updateHorseNumbers,          // Ló fej- és boxszámának frissítése
  getHorsesForEvent,           // Eseményhez tartozó lovak lekérdezése
  getAllPermissions            // Jogosultságok lekérdezése
} from '../DataServices/horseData.js';

// Országok listája, amely a ló űrlapoknál használható
const countries = [
  // ...országok felsorolása változatlanul...
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua & Deps", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Rep", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Congo {Democratic Rep}", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland {Republic}", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar, {Burma}", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russian Federation", "Rwanda", "St Kitts & Nevis", "St Lucia", "Saint Vincent & the Grenadines", "Samoa", "San Marino", "Sao Tome & Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad & Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];


// Új ló űrlap megjelenítése
const renderNew = (req, res) => {
  res.render('horse/newHorse', {
    countries: countries,
    formData: req.session.formData,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
};

// Új ló létrehozása POST kérésre
const createNew = asyncHandler(async (req, res) => {
  const forerr = req.body; // Hibakezeléshez szükséges adatok
  forerr.box = req.body.BoxNr;
  forerr.head = req.body.HeadNr;
  const headNr = req.body.HeadNr;
  const boxNr = req.body.BoxNr;
  delete req.body.HeadNr;
  delete req.body.BoxNr;
  const newHorse = await createHorse(req.body, headNr, boxNr, res.locals.selectedEvent._id);
  logOperation('HORSE_CREATE', `Horse created: ${newHorse.Horsename}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.HORSE_CREATED;
  res.redirect('/horse/dashboard');
});

// Lovak dashboard oldal megjelenítése
const dashboard = asyncHandler(async (req, res) => {
  const horses = await getAllHorses();
  // Csak az aktuális eseményhez tartozó fej- és boxszámokat jelenítjük meg
  horses.forEach(horse => {
    horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
    horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
  });
  res.render('horse/horsedash', {
    horses,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Ló részletes adatlapjának megjelenítése
const details = asyncHandler(async (req, res) => {
  const horse = await getHorseByIdWithPopulation(req.params.id);
  // Csak az aktuális eseményhez tartozó fej- és boxszámokat jelenítjük meg
  horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
  horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));

  res.render('horse/horseDetail', {
    formData: horse,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Ló szerkesztő űrlap megjelenítése
const editGet = asyncHandler(async (req, res) => {
  const horse = await getHorseById(req.params.id);
  // Csak az aktuális eseményhez tartozó fej- és boxszámokat jelenítjük meg
  horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
  horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
  res.render('horse/editHorse', {
    countries: countries,
    formData: horse,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Ló adatainak frissítése POST kérésre
const editPost = asyncHandler(async (req, res) => {
  const forerr = req.body; // Hibakezeléshez szükséges adatok
  forerr.box = req.body.BoxNr;
  forerr.head = req.body.HeadNr;

  const boxNr = req.body.BoxNr;
  const headNr = req.body.HeadNr;
  delete req.body.BoxNr;
  delete req.body.HeadNr;

  const horse = await updateHorse(req.params.id, req.body, headNr, boxNr, res.locals.selectedEvent._id);
  logOperation('HORSE_UPDATE', `Horse updated: ${horse.Horsename}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.HORSE_UPDATED;
  res.redirect('/horse/dashboard');
});

// Lóhoz tartozó megjegyzés törlése
const deleteNote = asyncHandler(async (req, res) => {
  const horse = await deleteHorseNote(req.params.id, req.body.note);
  logOperation('HORSE_UPDATE', `Horse updated: ${horse.name}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.NOTE_DELETED });
});

// Új megjegyzés hozzáadása lóhoz POST kérésre
const newNotePost = asyncHandler(async (req, res) => {
  const noteData = {
    note: req.body.note,                 // Megjegyzés szövege
    user: req.user._id,                  // Felhasználó azonosítója
    eventID: res.locals.selectedEvent._id // Esemény azonosítója
  };
  const horse = await addHorseNote(req.params.id, noteData);
  logOperation('HORSE_UPDATE', `Horse note created: ${horse.HorseName}`, req.user.username, HTTP_STATUS.CREATED);

  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.NOTE_ADDED });
});

// Lovak fej- és boxszám szerkesztő oldal megjelenítése
const numbersGet = asyncHandler(async (req, res) => {
  const horses = await getHorsesForEvent(res.locals.selectedEvent._id);

  // Csak az aktuális eseményhez tartozó fej- és boxszámokat jelenítjük meg
  horses.forEach(horse => {
    horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
    horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
  });
  res.render('horse/numberedit', {
    horses,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

// Ló fej- és boxszámának frissítése POST kérésre
const updateNums = asyncHandler(async (req, res) => {
  const horse = await updateHorseNumbers(req.params.id, req.body.headNumber, req.body.boxNumber, res.locals.selectedEvent._id);
  logOperation('HORSE_UPDATE', `Horse updated: ${horse.HorseName}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.NUMBERS_UPDATED });
});

// A vezérlő által exportált handler függvények
export default {
  renderNew,      // Új ló űrlap megjelenítése
  createNew,      // Új ló létrehozása
  dashboard,      // Lovak dashboard oldal megjelenítése
  details,        // Ló részletes adatlapjának megjelenítése
  editGet,        // Ló szerkesztő űrlap megjelenítése
  editPost,       // Ló adatainak frissítése
  deleteNote,     // Lóhoz tartozó megjegyzés törlése
  newNotePost,    // Új megjegyzés hozzáadása lóhoz
  numbersGet,     // Lovak fej- és boxszám szerkesztő oldal
  updateNums      // Ló fej- és boxszámának frissítése
};

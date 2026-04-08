// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

// Validációs és jogosultság middleware-ek importálása
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";

// Napi időtáblákkal és versenyelemekkel kapcsolatos adatkezelő függvények importálása
import {
    getAllDailyTimeTables,           // Összes napi időtábla lekérdezése
    getDailyTimeTableById,           // Egy adott napi időtábla lekérdezése ID alapján
    createDailyTimeTable,            // Új napi időtábla létrehozása
    updateDailyTimeTable,            // Napi időtábla módosítása
    deleteDailyTimeTable,            // Napi időtábla törlése
    getAllTimetableParts,            // Összes versenyelem lekérdezése
    getTimetablePartsByDailyTimeTable, // Versenyelemek lekérdezése napi időtábla szerint
    getTimetablePartById,            // Egy adott versenyelem lekérdezése ID alapján
    createTimetablePart,             // Új versenyelem létrehozása
    updateTimetablePart,             // Versenyelem módosítása
    deleteTimetablePart,             // Versenyelem törlése
    saveTimetablePartStartTime,      // Versenyelem kezdési idejének mentése
    getTimetablePartFormData         // Versenyelem űrlaphoz szükséges adatok lekérdezése
} from '../DataServices/dailyTimetableData.js';

// Ideiglenes modellek importálása a régi template kompatibilitás miatt
import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';

// Napi időtáblák és versenyelemek vezérlője
class DailyTimeTableController {
  // Új napi időtábla űrlap megjelenítése
  renderNew = (req, res) => {
    res.render('dailytimetable/newdailytimetable', {
      formData: req.session.formData,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  }

  // Új napi időtábla létrehozása POST kérésre
  createNew = asyncHandler(async (req, res) => {
      const newDailyTimeTable = await createDailyTimeTable(req.body);
      logOperation('DAILY_TIMETABLE_CREATE', `Daily TimeTable created: ${newDailyTimeTable.DayName}`, req.user.username, HTTP_STATUS.CREATED);
      req.session.successMessage = MESSAGES.SUCCESS.DAILY_TIMETABLE_CREATED;
      res.redirect('/dailytimetable/dashboard');

    
  })

  // Napi időtáblák dashboard oldal megjelenítése
  dashboard = asyncHandler(async (req, res) => {
    const timetableparts = await getAllTimetableParts();
    const eventID = res.locals.selectedEvent?._id;
    const dailytimetables = await getAllDailyTimeTables(eventID);
    res.render('dailytimetable/dailytimetabledash', {
      timetableparts,
      dailytimetables,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })



  // Napi időtábla szerkesztő űrlap megjelenítése
  editGet = asyncHandler(async (req, res) => {
    const dailytimetable = await getDailyTimeTableById(req.params.id);
    if (!dailytimetable) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
      return res.redirect('/dailytimetable/dashboard');
    }

    res.render('dailytimetable/editdailytimetable', {
      formData: dailytimetable,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Napi időtábla adatainak frissítése POST kérésre
  editPost = asyncHandler(async (req, res) => {
      const dailytimetable = await updateDailyTimeTable(req.params.id, req.body);
      if (!dailytimetable) {
        req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
        return res.redirect('/dailytimetable/dashboard');
      }
      logOperation('DAILY_TIMETABLE_UPDATE', `Daily TimeTable updated: ${dailytimetable.DayName}`, req.user.username, HTTP_STATUS.OK);
      req.session.successMessage = MESSAGES.SUCCESS.DAILY_TIMETABLE_UPDATED;
      res.redirect('/dailytimetable/dashboard');
   
    
  })

  // Napi időtábla törlése DELETE kérésre
  delete = asyncHandler(async (req, res) => {
    const dailytimetable = await deleteDailyTimeTable(req.params.id);
    if (!dailytimetable) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND });
    }
    logOperation('DAILY_TIMETABLE_DELETE', `Daily TimeTable deleted: ${dailytimetable.DayName}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.DAILY_TIMETABLE_DELETED });
  })

  // Egy adott napi időtáblához tartozó versenyelemek megjelenítése
  dayparts = asyncHandler(async (req, res) => {
    const dailytimetables = await getTimetablePartsByDailyTimeTable(req.params.id);
    const dailytable = await getDailyTimeTableById(req.params.id);
    if (!dailytimetables) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
      return res.redirect('/dailytimetable/dashboard');
    }
    res.render('dailytimetable/attacheddash', {
      dailytable: dailytable,
      formData: dailytimetables,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Versenyelem törlése DELETE kérésre
  deleteTTelement = asyncHandler(async (req, res) => {
    const timetablepart = await deleteTimetablePart(req.params.id);
    if (!timetablepart) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.TIMETABLE_ELEMENT_NOT_FOUND });
    }
    logOperation('TIMETABLE_PART_DELETE', `Timetable Part deleted: ${timetablepart.DayName}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.TIMETABLE_ELEMENT_DELETED });
  })

  // Versenyelem szerkesztő űrlap megjelenítése
  editTTelementGet = asyncHandler(async (req, res) => {
    const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
    const timetablepart = await getTimetablePartById(req.params.id);

    if (!timetablepart) {
      req.session.failMessage = MESSAGES.ERROR.TIMETABLE_ELEMENT_NOT_FOUND;
      return res.redirect('/dailytimetable/dashboard');
    }

    res.render('dailytimetable/editttelement', {
      judges,
      days,
      categorys,
      formData: timetablepart,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Versenyelem adatainak frissítése POST kérésre
  editTTelementPost = asyncHandler(async (req, res) => {
      const timetablepart = await updateTimetablePart(req.params.id, req.body);
      logOperation('TIMETABLE_PART_UPDATE', `Timetable Part updated: ${timetablepart.Name}`, req.user.username, HTTP_STATUS.OK);

      const dayId = req.body.dailytimetable || timetablepart.dailytimetable?.toString();
      if (!dayId) {
        req.session.failMessage = MESSAGES.ERROR.PARENT_DAY_MISSING;
        return res.redirect('/dailytimetable/dashboard');
      }

      req.session.successMessage = MESSAGES.SUCCESS.TIMETABLE_ELEMENT_UPDATED;
      return res.redirect('/dailytimetable/dayparts/' + dayId);

  })

  // Versenyelem kezdési idejének mentése
  saveTTelement = asyncHandler(async (req, res) => {
    const timetablepart = await saveTimetablePartStartTime(req.params.id);
    logOperation('TIMETABLE_PART_UPDATE', `Timetable Part updated: ${timetablepart.Name}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.TIMETABLE_ELEMENT_UPDATED });
  })

  // Új versenyelem űrlap megjelenítése adott napi időtáblához
  newTTelementGetById = asyncHandler(async (req, res) => {
    const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);
    const dailytable = await getDailyTimeTableById(req.params.id);

    if (!dailytable) {
      req.session.failMessage = MESSAGES.ERROR.DAILY_TIMETABLE_NOT_FOUND;
      return res.redirect('/dailytimetable/dashboard');
    }

    res.render('dailytimetable/newttelement', {
      judges,
      days,
      categorys,
      dailytable,
      formData: { dailytimetable: dailytable._id },
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    }); 
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Új versenyelem űrlap megjelenítése (általános)
  newTTelementGet = asyncHandler(async (req, res) => {
    if (!res.locals.selectedEvent?._id) {
      throw new Error('Event required');
    }
    const { judges, days, categorys } = await getTimetablePartFormData(res.locals.selectedEvent._id);

    res.render('dailytimetable/newttelement', {
      judges,
      days,
      categorys,
      formData: null,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    }); 
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  // Új versenyelem létrehozása POST kérésre
  newTTelementPost = asyncHandler(async (req, res) => {
      const newTimetablePart = await createTimetablePart(req.body);
      logOperation('TIMETABLE_PART_CREATE', `Timetable Part created: ${newTimetablePart.Name}`, req.user.username, HTTP_STATUS.CREATED);
      req.session.successMessage = MESSAGES.SUCCESS.TIMETABLE_ELEMENT_CREATED;
      res.redirect('/dailytimetable/dayparts/' + newTimetablePart.dailytimetable);

  })
}

export default new DailyTimeTableController();

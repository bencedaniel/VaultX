import resultGroup from '../models/resultGroup.js';
import resultGenerator from '../models/resultGenerator.js';
import Category from '../models/Category.js';
import calcTemplate from '../models/calcTemplate.js';
import DailyTimeTable from '../models/DailyTimeTable.js';
import TimetablePart from '../models/Timetablepart.js';
import { logDb, logDebug } from '../logger.js';

/**
 * Segédfüggvény: az azonosítót normalizálja (üres vagy null esetén null, egyébként string).
 * @param {any} value - Az azonosító értéke.
 * @returns {string|null} Normalizált azonosító vagy null.
 */
const normalizeID = (value) => {
    if (value === '' || value === null || value === undefined) {
        return null;
    }
    return String(value);
};

/**
 * Összes eredménycsoport lekérdezése egy adott eseményhez, teljes feltöltéssel.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Eredménycsoportok tömbje, feltöltött mezőkkel.
 */
export const getResultGroupsByEvent = async (eventId) => {
    // Eredménycsoportok lekérdezése és kapcsolt mezők feltöltése
    const groups = await resultGroup.find({ event: eventId })
        .populate('event')
        .populate('category')
        .populate('calcTemplate')
        .populate({
            path: 'round1First',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round1Second',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round2First',
            populate: { path: 'dailytimetable' }
        });
    // Csillag szerint rendezés
    groups.sort((a, b) => b.category.Star - a.category.Star);
    return groups;
};

/**
 * Eredménycsoportok lekérdezése eredménymegjelenítéshez (egyszerűbb feltöltéssel).
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Array>} Eredménycsoportok tömbje.
 */
export const getResultGroupsForResults = async (eventId) => {
    // Eredménycsoportok lekérdezése, egyszerűbb feltöltéssel
    const groups = await resultGroup.find({ event: eventId })
        .populate('category')
        .populate('calcTemplate')
        .populate({
            path: 'round1First',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round1Second',
            populate: { path: 'dailytimetable' }
        })
        .populate({
            path: 'round2First',
            populate: { path: 'dailytimetable' }
        });
    groups.sort((a, b) => b.category.Star - a.category.Star);
    return groups;
};

/**
 * Egy eredménycsoport lekérdezése azonosító alapján.
 * @param {string} id - Eredménycsoport azonosító.
 * @returns {Promise<Object>} Az eredménycsoport dokumentum.
 */
export const getResultGroupById = async (id) => {
    // Eredménycsoport keresése azonosító alapján
    return await resultGroup.findById(id);
};

/**
 * Egy eredménycsoport lekérdezése részletes adatokkal, részletes eredménymegjelenítéshez.
 * @param {string} id - Eredménycsoport azonosító.
 * @returns {Promise<Object>} Feltöltött eredménycsoport dokumentum.
 */
export const getResultGroupWithDetails = async (id) => {
    // Eredménycsoport keresése és kapcsolt mezők feltöltése
    return await resultGroup.findById(id)
        .populate('category')
        .populate('calcTemplate')
        .populate('round1First')
        .populate('round1Second')
        .populate('round2First');
};

/**
 * Űrlap-adatok lekérdezése eredménycsoport létrehozásához/szerkesztéséhez.
 * @param {string} eventId - Esemény azonosító.
 * @returns {Promise<Object>} Objektum: kategóriák, sablonok, programrészek tömbjei.
 */
export const getGroupFormData = async (eventId) => {
    // Kategóriák, sablonok, napi programok és programrészek lekérdezése
    const categories = await Category.find();
    const calcTemplates = await calcTemplate.find();
    const dailyTimetables = await DailyTimeTable.find({ event: eventId }).select('_id');
    
    const timetableParts = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) } 
    }).populate('dailytimetable');
    
    const timetablePartsRound1 = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) }, 
        Round: '1' 
    }).populate('dailytimetable');
    
    const timetablePartsRound2 = await TimetablePart.find({ 
        dailytimetable: { $in: dailyTimetables.map(dt => dt._id) }, 
        Round: '2 - Final' 
    }).populate('dailytimetable');

    return {
        categories,
        calcTemplates,
        timetableParts,
        timetablePartsRound1,
        timetablePartsRound2
    };
};

/**
 * Eredménycsoport frissítése.
 * Ellenőrzi, hogy ugyanaz a programrész nem szerepelhet több fordulóban.
 * @param {string} id - Eredménycsoport azonosító.
 * @param {Object} data - Frissített adatok.
 * @returns {Promise<Object>} A frissített eredménycsoport dokumentum.
 * @throws {Error} Ha ugyanaz a programrész több fordulóban is szerepel.
 */
export const updateResultGroup = async (id, data) => {
    const round1First = normalizeID(data.round1First);
    const round1Second = normalizeID(data.round1Second);
    const round2First = normalizeID(data.round2First);

    // Ellenőrzés: ugyanaz a programrész nem szerepelhet több fordulóban
    if ((round1First && round1Second && round1First === round1Second) || 
        (round1First && round2First && round1First === round2First) || 
        (round1Second && round2First && round1Second === round2First)) {
        throw new Error("The same timetable part cannot be selected for multiple rounds.");
    }

    data.round1First = round1First;
    data.round1Second = round1Second;
    data.round2First = round2First;

    const updated = await resultGroup.findByIdAndUpdate(id, data, { new: true });
    logDb('UPDATE', 'ResultGroup', `${id}`);
    return updated;
};

/**
 * Új eredménycsoport létrehozása.
 * Ellenőrzi, hogy ugyanaz a programrész nem szerepelhet több fordulóban.
 * @param {string} eventId - Esemény azonosító.
 * @param {Object} data - Új eredménycsoport adatai.
 * @returns {Promise<Object>} A létrehozott eredménycsoport dokumentum.
 * @throws {Error} Ha ugyanaz a programrész több fordulóban is szerepel.
 */
export const createResultGroup = async (eventId, data) => {
    const round1First = normalizeID(data.round1First);
    const round1Second = normalizeID(data.round1Second);
    const round2First = normalizeID(data.round2First);

    // Ellenőrzés: ugyanaz a programrész nem szerepelhet több fordulóban
    if ((round1First && round1Second && round1First === round1Second) || 
        (round1First && round2First && round1First === round2First) || 
        (round1Second && round2First && round1Second === round2First)) {
        throw new Error("The same timetable part cannot be selected for multiple rounds.");
    }

    data.round1First = round1First;
    data.round1Second = round1Second;
    data.round2First = round2First;

    data.event = eventId;

    // Új eredménycsoport példány létrehozása
    const newGroup = new resultGroup(data);
    await newGroup.save();
    logDb('CREATE', 'ResultGroup', `${newGroup._id}`);
    return newGroup;
};

/**
 * Eredménycsoport törlése azonosító alapján.
 * @param {string} id - Eredménycsoport azonosító.
 * @returns {Promise<void>}
 */
export const deleteResultGroup = async (id) => {
    // Eredménycsoport törlése az adatbázisból
    await resultGroup.findByIdAndDelete(id);
    logDb('DELETE', 'ResultGroup', `${id}`);
};

/**
 * Eredménycsoportok generálása az aktív generátorok alapján.
 * @param {string} eventId - Esemény azonosító.
 * @param {string} username - Felhasználónév (jelenleg nem használt).
 * @returns {Promise<void>}
 */
export const generateGroupsForActiveGenerators = async (eventId, username) => {
    // Aktív generátorok lekérdezése
    const activeGenerators = await resultGenerator.find({ active: true });
    
    for (const generator of activeGenerators) {
        // Ellenőrizzük, hogy már létezik-e csoport az adott eseményhez és kategóriához
        const groupExists = await resultGroup.findOne({ 
            event: eventId, 
            category: generator.category 
        });
        
        if (groupExists) {
            continue; // Ha már létezik, kihagyjuk
        }
        
        // Új eredménycsoport példány létrehozása
        const newResultGroup = new resultGroup({
            event: eventId,
            category: generator.category,
            calcTemplate: generator.calcSchemaTemplate,
        });
        
        await newResultGroup.save();
        logDb('CREATE', 'ResultGroup', `${newResultGroup._id}`);
    }
};

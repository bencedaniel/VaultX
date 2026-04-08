import TimetablePart from '../models/Timetablepart.js';
import Entries from '../models/Entries.js';
import { logDb } from '../logger.js';

/**
 * Versenyprogram-rész (TimetablePart) és rajtsorrend adatkezelő szolgáltatások.
 * Minden függvény részletes magyar nyelvű dokumentációval és inline kommentekkel ellátva.
 */

/**
 * Versenyprogram-rész lekérdezése azonosító alapján, napi program feltöltésével.
 * @param {string} id - A programrész egyedi azonosítója.
 * @returns {Promise<Object>} A programrész dokumentum.
 * @throws {Error} Ha a programrész nem található.
 */
export async function getTimetablePartById(id) {
    // Programrész keresése és napi program feltöltése
    const timetablePart = await TimetablePart.findById(id).populate('dailytimetable').exec();
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }
    return timetablePart;
}

/**
 * Adott kategóriákhoz tartozó nevezések lekérdezése szűréssel.
 * @param {string} eventId - Esemény azonosító.
 * @param {Array} categories - Kategória azonosítók tömbje.
 * @param {string} status - Nevezés státusza (alapértelmezett: 'confirmed').
 * @returns {Promise<Array>} Nevezések tömbje, feltöltött vaulter, ló, lóvezető adatokkal.
 */
export async function getEntriesForCategories(eventId, categories, status = 'confirmed') {
    // Nevezések lekérdezése esemény, státusz és kategória alapján
    const entries = await Entries.find({ 
        event: eventId, 
        status: status, 
        category: { $in: categories } 
    })
        .populate('vaulter horse lunger')
        .exec();
    return entries;
}

/**
 * Rajtsorrend validálása és szűrése, hogy csak érvényes nevezések maradjanak.
 * @param {Object} timetablePart - Programrész, amely tartalmazza a rajtsorrendet.
 * @param {Array} validEntryIds - Érvényes nevezés azonosítók tömbje.
 * @returns {Promise<Object>} Frissített programrész.
 */
export async function validateAndFilterStartingOrder(timetablePart, validEntryIds) {
    // Érvényes nevezések azonosítóinak halmaza
    const validSet = new Set(validEntryIds.map(e => e.toString()));
    // Csak az érvényes nevezések maradnak a rajtsorrendben
    timetablePart.StartingOrder = timetablePart.StartingOrder.filter(so => 
        validSet.has(so.Entry.toString())
    );
    await timetablePart.save();
    logDb('UPDATE', 'TimetablePart', `${timetablePart._id}`);
    return timetablePart;
}

/**
 * Rajtsorrend frissítése egy programrészhez.
 * @param {string} id - Programrész azonosító.
 * @param {Object} orderData - Objektum: { entryId, newOrder }.
 * @returns {Promise<Object>} Frissített programrész.
 */
export async function updateStartingOrder(id, orderData) {
    // Programrész keresése azonosító alapján
    const timetablePart = await TimetablePart.findById(id);
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }

    let changed = false;
    let oldOrder = "";

    // Az adott nevezés eltávolítása a jelenlegi pozícióból
    timetablePart.StartingOrder = timetablePart.StartingOrder.filter(
        so => String(so.Entry) !== String(orderData.entryId)
    );

    // Megnézzük, hogy a kívánt rajtszám már foglalt-e
    for (let i = 0; i < timetablePart.StartingOrder.length; i++) {
        if (timetablePart.StartingOrder[i].Order == orderData.newOrder) {
            oldOrder = timetablePart.StartingOrder[i].Entry;
            timetablePart.StartingOrder[i].Entry = orderData.entryId;
            changed = true;
            break;
        }
    }

    // Ha volt csere, a régi nevezést eltávolítjuk
    timetablePart.StartingOrder = timetablePart.StartingOrder.filter(
        so => String(so.Entry) !== String(oldOrder)
    );

    // Ha nem volt csere, új pozícióba tesszük a nevezést
    if (!changed) {
        timetablePart.StartingOrder.push({ 
            Entry: orderData.entryId, 
            Order: orderData.newOrder 
        });
    }

    logDb('UPDATE', 'TimetablePart', `${id}`);
    await timetablePart.save();
    return timetablePart;
}

/**
 * Új, egyedi rajtszám generálása egy nevezéshez.
 * @param {Object} timetablePart - Programrész, amely tartalmazza a rajtsorrendet.
 * @param {number} entriesCount - Nevezések száma.
 * @param {number} currentOrderNr - Jelenlegi rajtszám, amit ki kell hagyni.
 * @returns {Promise<number>} Új, egyedi rajtszám.
 * @throws {Error} Ha 50 próbálkozás után sem sikerül.
 */
export async function generateNewOrderNumber(timetablePart, entriesCount, currentOrderNr) {
    // Már használt rajtszámok halmaza
    const usedNumbers = new Set(timetablePart.StartingOrder.map(so => so.Order));

    let attempts = 50;
    let randomnumber;

    // Véletlenszerű, még nem használt rajtszám generálása
    do {
        randomnumber = Math.floor(Math.random() * entriesCount) + 1;
        if (attempts-- < 0) {
            throw new Error("Could not generate a new order number, please try again.");
        }
    } while (usedNumbers.has(randomnumber) || String(randomnumber) === String(currentOrderNr));

    return randomnumber;
}

/**
 * Egy adott nevezés rajtszámának frissítése a rajtsorrendben.
 * @param {string} id - Programrész azonosító.
 * @param {string} entryId - Nevezés azonosító.
 * @param {number} newOrder - Új rajtszám.
 * @returns {Promise<Object>} Frissített programrész.
 */
export async function updateEntryOrderNumber(id, entryId, newOrder) {
    // Programrész keresése azonosító alapján
    const timetablePart = await TimetablePart.findById(id);
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }

    // Megkeressük a nevezést és frissítjük a rajtszámát
    for (let i = 0; i < timetablePart.StartingOrder.length; i++) {
        if (timetablePart.StartingOrder[i].Entry == entryId) {
            timetablePart.StartingOrder[i].Order = newOrder;
            break;
        }
    }

    logDb('UPDATE', 'TimetablePart', `${id}`);
    await timetablePart.save();
    return timetablePart;
}

/**
 * Ütközések (azonos ló vagy lóvezető) ellenőrzése és rajtsorrend generálása ütköző nevezésekhez.
 * @param {Object} timetablePart - Programrész.
 * @param {Array} entries - Az adott kategória összes nevezése.
 * @returns {Promise<Object>} Objektum: { timetablePart, conflictedEntries }.
 */
export async function checkAndGenerateConflictingOrders(timetablePart, entries) {
    // Ütköző nevezések listája
    const conflictedEntries = [];
    // Már kiosztott rajtszámok halmaza
    const usedNumbers = new Set(
        timetablePart.StartingOrder.map(so => so.Order)
    );

    for (let i = 0; i < entries.length; i++) {
        let hasConflict = false;

        // Ellenőrizzük, hogy van-e ütközés más nevezéssel (azonos ló vagy lóvezető)
        for (let j = 0; j < entries.length; j++) {
            if (i !== j) {
                if (String(entries[i].horse) === String(entries[j].horse) || 
                    String(entries[i].lunger) === String(entries[j].lunger)) {
                    hasConflict = true;
                    break;
                }
            }
        }

        if (hasConflict) {
            conflictedEntries.push(entries[i]);

            // Ha még nincs rajtszám kiosztva, generálunk egyet
            const isGenerated = timetablePart.StartingOrder.some(
                so => String(so.Entry) === String(entries[i]._id)
            );

            if (!isGenerated) {
                let randomnumber;
                do {
                    randomnumber = Math.floor(Math.random() * entries.length) + 1;
                } while (usedNumbers.has(randomnumber));

                usedNumbers.add(randomnumber);
                timetablePart.StartingOrder.push({ 
                    Entry: entries[i]._id, 
                    Order: randomnumber 
                });
            }
        }
    }

    logDb('UPDATE', 'TimetablePart', `${timetablePart._id}`);
    await timetablePart.save();
    return { timetablePart, conflictedEntries };
}

/**
 * Teljes rajtsorrend generálása minden nevezéshez.
 * @param {Object} timetablePart - Programrész.
 * @param {Array} entries - Az adott kategória összes nevezése.
 * @returns {Promise<Object>} Frissített programrész, teljes rajtsorrenddel.
 */
export async function generateCompleteStartingOrder(timetablePart, entries) {
    // Már hozzárendelt nevezés azonosítók halmaza
    const usedEntryIds = new Set(
        timetablePart.StartingOrder.map(so => String(so.Entry))
    );
    // Már kiosztott rajtszámok halmaza
    const usedNumbers = new Set(
        timetablePart.StartingOrder.map(so => so.Order)
    );

    // Hiányzó nevezések hozzáadása véletlenszerű rajtszámmal
    for (let i = 0; i < entries.length; i++) {
        if (!usedEntryIds.has(String(entries[i]._id))) {
            let randomnumber;
            do {
                randomnumber = Math.floor(Math.random() * entries.length) + 1;
            } while (usedNumbers.has(randomnumber));

            usedNumbers.add(randomnumber);
            timetablePart.StartingOrder.push({ 
                Entry: entries[i]._id, 
                Order: randomnumber 
            });
        }
    }

    logDb('UPDATE', 'TimetablePart', `${timetablePart._id}`);
    timetablePart.drawingDone = true;
    await timetablePart.save();
    return timetablePart;
}

/**
 * Programrész státusz mezőinek frissítése.
 * @param {string} id - Programrész azonosító.
 * @param {Object} data - Frissítendő mezők (pl. conflictsChecked, drawingDone, creationMethod).
 * @returns {Promise<Object>} Frissített programrész.
 */
export async function updateTimetablePartStatus(id, data) {
    // Programrész keresése azonosító alapján
    const timetablePart = await TimetablePart.findById(id);
    if (!timetablePart) {
        throw new Error("Timetable part not found.");
    }

    logDb('UPDATE', 'TimetablePart', `${id}`);
    // Megadott mezők frissítése
    Object.assign(timetablePart, data);
    await timetablePart.save();
    return timetablePart;
}

/**
 * Segédfüggvény kategóriák tömbbé alakításához programrészből.
 * Mindig tömböt ad vissza.
 * @param {Object|Array} category - Programrész kategória mezője.
 * @returns {Array} Kategóriák tömbje.
 */
export function parseCategoriesArray(category) {
    // Ha már tömb, visszaadjuk
    if (Array.isArray(category)) {
        return category;
    }
    // Ha nem tömb, de van értéke, tömbbé alakítjuk
    return category ? [category] : [];
}

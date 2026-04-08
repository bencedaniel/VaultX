import mongoose from "mongoose";


/**
 * Esemény (Event) mongoose séma.
 * Egy verseny esemény minden fő adatát tartalmazza: név, helyszín, igazgató, időbeosztás, hivatalos személyek, stb.
 *
 * @property {String} EventName - Esemény neve (egyedi, kötelező).
 * @property {String} EventLocation - Esemény helyszíne (kötelező).
 * @property {String} EventDirectorName - Esemény igazgatójának neve (kötelező).
 * @property {String} EventDirectorContact - Igazgató elérhetősége (kötelező).
 * @property {ObjectId} map - Helyszíntérkép azonosító (maps kollekció).
 * @property {ObjectId} StablingMap - Istállótérkép azonosító (maps kollekció).
 * @property {ObjectId[]} DailyTimeTables - Napi időbeosztások azonosítói (daily_timetables kollekció).
 * @property {Array} AssignedOfficials - Hivatalos személyek tömbje (név, szerep, kontakt, userID).
 * @property {Boolean} selected - Kiválasztott esemény-e.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const EventSchema = new mongoose.Schema({
    /**
     * Esemény neve.
     */
    EventName: {
        type: String,
        required: [true, 'Event name required!'],
        unique: true,
    },
    /**
     * Esemény helyszíne.
     */
    EventLocation: {
        type: String,
        required: [true, 'Event location required!'],
    },
    /**
     * Esemény igazgatójának neve.
     */
    EventDirectorName: {
        type: String,
        required: [true, 'Event director name required!'],
    },
    /**
     * Igazgató elérhetősége.
     */
    EventDirectorContact: {
        type: String,
        required: [true, 'Event director contact required!'],
    },
    /**
     * Helyszíntérkép azonosító.
     */
    map: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'maps',
    },
    /**
     * Istállótérkép azonosító.
     */
    StablingMap: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'maps',
    },  
    /**
     * Napi időbeosztások azonosítói.
     */
    DailyTimeTables: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'daily_timetables',
        default: [],
    },
    /**
     * Hivatalos személyek tömbje (név, szerep, kontakt, userID).
     */
    AssignedOfficials: {
        type: [{
            name : { type: String, required: true },
            role : { type: String, required: true },
            contact : { type: String, required: true },
            userID : { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: false }
        }]
    },
    /**
     * Kiválasztott esemény-e.
     */
    selected: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });


/**
 * Statikus metódus: kiválaszt egy eseményt (selected=true), a többit selected=false-ra állítja.
 * @param {ObjectId} eventId - Az esemény azonosítója, amelyet kiválasztunk.
 * @returns {Promise<void>}
 */
EventSchema.statics.setSelected = async function(eventId) {
    // Minden esemény selected: false, kivéve a megadottat
    await this.updateMany(
        { _id: { $ne: eventId } },
        { $set: { selected: false } }
    );
    // A megadott esemény selected: true
    await this.findByIdAndUpdate(eventId, { selected: true });
};

/**
 * Event mongoose modell exportálása.
 */
export default mongoose.model('events', EventSchema);

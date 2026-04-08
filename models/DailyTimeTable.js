import mongoose from 'mongoose';



/**
 * Napi időbeosztás (DailyTimeTable) mongoose séma.
 * Egy esemény adott napjának metaadatait tartalmazza.
 *
 * @property {ObjectId} event - Az esemény azonosítója (hivatkozás az events kollekcióra).
 * @property {String} DayName - A nap neve (pl. "Péntek").
 * @property {String} DisplayName - Megjelenítendő név (pl. "1. nap").
 * @property {Date} Date - A nap dátuma (egyedi, kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const DailyTimeTableSchema = new mongoose.Schema({
    /**
     * Az esemény azonosítója (ObjectId, events kollekció).
     */
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: [true, 'Event required!'],
    },
    /**
     * A nap neve (pl. "Péntek").
     */
    DayName: {
        type: String,
        required: [true, 'Day name required!'],
    },
    /**
     * Megjelenítendő név (pl. "1. nap").
     */
    DisplayName: {
        type: String,
        required: [true, 'Display name required!'],
    },
    /**
     * A nap dátuma (egyedi).
     */
    Date: {
        type: Date,
        required: [true, 'Date required!'],
        unique: [true, 'A Day for this date already exists!'],
    }
}, { timestamps: true });   



/**
 * DailyTimeTable mongoose modell exportálása.
 */
export default mongoose.model('daily_timetables', DailyTimeTableSchema);
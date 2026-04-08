import mongoose from 'mongoose';



/**
 * Nevezés (Entries) mongoose séma.
 * Egy verseny nevezésének minden fő adatát tartalmazza: esemény, versenyzők, ló, hosszabbító, kategória, státusz, csapatnév.
 *
 * @property {ObjectId} event - Az esemény azonosítója (events kollekció).
 * @property {ObjectId[]} vaulter - Versenyző(k) azonosítói (vaulters kollekció, max. 6).
 * @property {ObjectId} horse - Ló azonosítója (horses kollekció).
 * @property {ObjectId} lunger - Hosszabbító azonosítója (lungers kollekció).
 * @property {ObjectId} category - Kategória azonosítója (categorys kollekció).
 * @property {Date} entryDate - Nevezés dátuma (alapértelmezett: most).
 * @property {String} status - Nevezés státusza ('registered', 'withdrawn', 'confirmed', 'cancelled').
 * @property {String} teamName - Csapatnév (max. 100 karakter).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const EntriesSchema = new mongoose.Schema({
    /**
     * Az esemény azonosítója.
     */
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: [true, 'Event required!'],
    },
    /**
     * Versenyző(k) azonosítói (max. 6 fő).
     */
    vaulter: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vaulters',
        required: [true, 'Vaulter required!'],
        maxlength: [6, 'A maximum of 6 vaulters can be assigned to an entry.']
    }],
    /**
     * Ló azonosítója.
     */
    horse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'horses',
        required: [true, 'Horse required!'],
    },
    /**
     * Hosszabbító azonosítója.
     */
    lunger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lungers',
        required: [true, 'Lunger required!'],
    },
    /**
     * Kategória azonosítója.
     */
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorys',
        required: [true, 'Category required!'], 
    },
    /**
     * Nevezés dátuma.
     */
    entryDate: {
        type: Date,
        default: Date.now,
    },
    /**
     * Nevezés státusza.
     */
    status: {
        type: String,
        enum: ['registered', 'withdrawn', 'confirmed', 'cancelled'],
        default: 'registered',
    },
    /**
     * Csapatnév (max. 100 karakter).
     */
    teamName: {
        type: String,
        default: '',
        maxlength: [100, 'Team name cannot exceed 100 characters.']
    },
}, { timestamps: true });



/**
 * Entries mongoose modell exportálása.
 */
export default mongoose.model('entries', EntriesSchema);
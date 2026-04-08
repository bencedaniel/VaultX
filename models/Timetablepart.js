import mongoose from 'mongoose';


/**
 * Időbeosztás-rész (Timetablepart) mongoose séma.
 * Egy adott napi időbeosztás egy részének (pl. versenyszám, blokk) adatait tárolja.
 *
 * @property {String} Name - Időbeosztás-rész neve (kötelező).
 * @property {ObjectId} dailytimetable - Napi időbeosztás azonosító (daily_timetables kollekció, kötelező).
 * @property {String} StartTimePlanned - Tervezett kezdési idő ("HH:MM" formátum, kötelező).
 * @property {Date} StartTimeReal - Valós kezdési idő.
 * @property {ObjectId[]} Category - Kategória(ák) azonosítói (categorys kollekció, kötelező).
 * @property {String} TestType - Teszttípus ('Compulsory', 'Free Test', 'Technical Test', kötelező).
 * @property {String} Round - Kör ('1', '2 - Final', kötelező).
 * @property {Array} StartingOrder - Indulási sorrend tömbje (Entry, Order, submittedtables).
 * @property {Boolean} drawingDone - Sorsolás megtörtént-e (kötelező).
 * @property {Boolean} conflictsChecked - Ütközések ellenőrizve (kötelező).
 * @property {Number} NumberOfJudges - Bírók száma (1,2,4,6,8, kötelező).
 * @property {ObjectId[]} Judges - Bírók azonosítói (entries kollekció).
 * @property {Array} JudgesList - Bírók listája (JudgeUserID, Table párok, egyedi).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const TimetablePartSchema = new mongoose.Schema({

        /**
         * Időbeosztás-rész neve.
         */
        Name: {
            type: String,
            required: [true, 'Timetable part name required!'],
        },
        /**
         * Napi időbeosztás azonosító.
         */
        dailytimetable: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'daily_timetables',
            required: [true, 'Daily timetable required!'],
        },
        /**
         * Tervezett kezdési idő ("HH:MM" formátum).
         */
        StartTimePlanned: {
            type: String,  // "HH:MM" formátum
            required: [true, 'Start time required!'],
            validate: {
                validator: function(v) {
                    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
                },
                message: 'Invalid time format (HH:MM required)'
            }
        },
        /**
         * Valós kezdési idő.
         */
        StartTimeReal: {
            type: Date, 
            default: null,
        },
        /**
         * Kategória(ák) azonosítói.
         */
        Category: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'categorys',
            required: [true, 'Category required!'],
        },
        /**
         * Teszttípus.
         */
        TestType: {
            type: String,
            enum: ['Compulsory', 'Free Test', 'Technical Test'],
            required: [true, 'Test type required!'],
        },
        /**
         * Kör.
         */
        Round: {
            type: String,
            enum: ['1', '2 - Final', ],
            required: [true, 'Round required!'],
        },
        /**
         * Indulási sorrend tömbje.
         * Minden elem: Entry (nevezés azonosító), Order (sorrend), submittedtables (bírói asztalok).
         */
        StartingOrder: {
            type: [{
              Entry: { type: mongoose.Schema.Types.ObjectId, ref: 'entries', required: [true, 'Entry is required'] },
              Order: { type: Number, required: [true, 'Order is required'] },
              submittedtables: [{JudgeID: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }, Table: String}],
            }],
            default: [],
        },
        /**
         * Sorsolás megtörtént-e.
         */
        drawingDone: {
            type: Boolean,
            default: false,
            required: [true, 'Drawing done status required!'],
        },
        /**
         * Ütközések ellenőrizve.
         */
        conflictsChecked: {
            type: Boolean,
            default: false,
            required: [true, 'Conflicts checked status required!'],
        },
        /**
         * Bírók száma.
         */
        NumberOfJudges: {
            type: Number,
            enum: [1,2,4,6,8],
            required: [true, 'Number of judges required!'],
        },
        /**
         * Bírók azonosítói.
         */
        Judges: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'entries',
            default: [],
        },
        /**
         * Bírók listája (JudgeUserID, Table párok, egyedi).
         */
        JudgesList: {
            type: [{JudgeUserID:mongoose.Schema.Types.ObjectId, Table: String}],
            default: [],
            unique: true
        }
    },{ timestamps: true });
/**
 * Timetablepart mongoose modell exportálása.
 */
export default mongoose.model('timetableparts', TimetablePartSchema);

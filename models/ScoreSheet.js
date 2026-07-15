import mongoose from "mongoose";


/**
 * Egy számot adott tizedesjegyre kerekít.
 * @param {number|string} value - A kerekítendő érték.
 * @param {number} decimals - Hány tizedesjegyre kerekítsen (alapértelmezetten 3).
 * @returns {number} - A kerekített szám.
 */
function roundToDecimals(value, decimals = 3) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return NaN;
    const multiplier = Math.pow(10, decimals);
    return Number((Math.round((numericValue * multiplier) + Number.EPSILON) / multiplier).toFixed(decimals));
}


/**
 * Pontlap (ScoreSheet) mongoose séma.
 * Egy versenyző adott eseményen, adott bíró által adott részletes pontjait tárolja.
 *
 * @property {ObjectId} EventId - Esemény azonosító (events kollekció, kötelező).
 * @property {ObjectId} EntryId - Nevezés azonosító (entries kollekció, kötelező).
 * @property {ObjectId} TemplateId - Pontlap sablon azonosító (scoresheets_temp kollekció, kötelező).
 * @property {ObjectId} TimetablePartId - Időbeosztás rész azonosító (timetableparts kollekció, kötelező).
 * @property {Object} Judge - Bíró adatai (userId, table).
 * @property {Array} inputDatas - Bemeneti adatok tömbje (id, value párok).
 * @property {Number} totalScoreFE - Frontend által számolt összpontszám.
 * @property {Number} totalScoreBE - Backend által számolt összpontszám.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const ScoreSheetSchema = new mongoose.Schema(
    {
        /**
         * Esemény azonosító (kötelező).
         */
        EventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "events",
            required: [true, "Event ID required!"],
            index: true // indexelés a gyorsabb keresés érdekében
        },
        /**
         * Nevezés azonosító (kötelező).
         */
        EntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "entries",
            required: [true, "Entry ID required!"],
        },
        /**
         * Pontlap sablon azonosító (kötelező).
         */
        TemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "scoresheets_temp",
            required: [true, "Template ID required!"],
        },
        /**
         * Időbeosztás rész azonosító (kötelező).
         */
        TimetablePartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "timetableparts",
            required: [true, "Timetable Part ID required!"],
        },
        /**
         * Bíró adatai (userId, table).
         */
        Judge: {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: [true, "Judge info required!"],
                refPath: "users" // dinamikus collection
            },
            table: {
                type: String,
                required: true
            }
        },
        /**
         * Bemeneti adatok tömbje (id, value párok).
         */
        inputDatas: {
            type: [{id:String, value: String}],
            default: [],
            required: [true, "Input data required!"],
        },
        /**
         * Frontend által számolt összpontszám.
         */
        totalScoreFE: {
            type: Number,
            required: [true, "Total score required!"],
        },
        /**
         * Backend által számolt összpontszám.
         */
        totalScoreBE: {
            type: Number,
            required: [true, "Total score required!"],
        }
  }, { timestamps: true }
);


// Egyedi index: egy versenyző, sablon, időbeosztás és bíró-tábla kombináció csak egyszer szerepelhet.
ScoreSheetSchema.index(
    { EventId: 1, EntryId: 1, TemplateId: 1 , TimetablePartId: 1, 'Judge.table': 1 },
    { unique: true }
);

/**
 * Mentés előtti middleware: összpontszámok kerekítése és egyezőségük ellenőrzése.
 * Ha a front-end és back-end összpontszám eltér, vagy nem szám, hibát dob.
 */
ScoreSheetSchema.pre('save', function(next) {
    const normalizedFE = roundToDecimals(this.totalScoreFE, 3);
    const normalizedBE = roundToDecimals(this.totalScoreBE, 3);

    if (!Number.isFinite(normalizedFE) || !Number.isFinite(normalizedBE)) {
        throw new Error('Invalid total score value' + ` (FE: ${this.totalScoreFE}, BE: ${this.totalScoreBE})`);
    }

    this.totalScoreFE = normalizedFE;
    this.totalScoreBE = normalizedBE;

    if(normalizedBE !== normalizedFE){
        throw new Error('Total score mismatch between front-end and back-end values' + ` (FE: ${normalizedFE}, BE: ${normalizedBE})`);
    }

    next();
});
/**
 * ScoreSheet mongoose modell exportálása.
 */
export default mongoose.model("scoresheets", ScoreSheetSchema);
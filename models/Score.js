import mongoose from 'mongoose';


/**
 * Pontszám (Score) mongoose séma.
 * Egy versenyző adott eseményen, időbeosztásban elért pontszámait és azok részleteit tárolja.
 *
 * @property {ObjectId} event - Esemény azonosító (events kollekció, kötelező).
 * @property {ObjectId} entry - Nevezés azonosító (entries kollekció, kötelező).
 * @property {ObjectId} timetablepart - Időbeosztás rész azonosító (timetableparts kollekció, kötelező).
 * @property {Array} scoresheets - Részletes pontlapok tömbje (scoreId, table mezőkkel, kötelező).
 * @property {Number} TotalScore - Összpontszám (kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const ScoreSchema = new mongoose.Schema({
    /**
     * Esemény azonosító (kötelező).
     */
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: [true, 'Event required!'],
    },
    /**
     * Nevezés azonosító (kötelező).
     */
    entry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'entries',
        required: [true, 'Entry required!'],
    },
    /**
     * Időbeosztás rész azonosító (kötelező).
     */
    timetablepart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'timetableparts',
        required: [true, 'Timetable part required!'],
    },
    /**
     * Részletes pontlapok tömbje.
     * Minden elem: scoreId (pontlap azonosító), table (tábla neve).
     */
    scoresheets: [{
        scoreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'scoresheets',
            required: [true, 'Score required!'],
        },
        table: {
            type: String,
            required: [true, 'Table required!'],
        }
    }],
    /**
     * Összpontszám (kötelező).
     */
    TotalScore: {
        type: Number,
        required: [true, 'Score required!'],
    },
},{ timestamps: true });

/**
 * Score mongoose modell exportálása.
 */
export default mongoose.model('scores', ScoreSchema);

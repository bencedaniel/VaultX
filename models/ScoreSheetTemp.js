import mongoose from "mongoose";


/**
 * Pontlap sablon (ScoreSheetTemp) mongoose séma.
 * Egy adott teszttípushoz, kategóriához, bírói számhoz tartozó pontlap sablon mezőit, beállításait tárolja.
 *
 * @property {String[]} TestType - Teszttípus(ok) (pl. compulsory, free test, technical test, kötelező).
 * @property {ObjectId[]} CategoryId - Kategória(ák) azonosítói (categorys kollekció, kötelező).
 * @property {Number} numberOfJudges - Bírók száma (alapértelmezetten 4, kötelező).
 * @property {String} typeOfScores - Pontozás típusa (horse, artistic, technical, compulsory, kötelező).
 * @property {Array} outputFieldList - Kimeneti mezők listája (név, contentid, pozíció).
 * @property {Array} inputFieldList - Bemeneti mezők listája (név, id, előre definiált érték, pozíció).
 * @property {String} bgImage - Háttérkép elérési útja (kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const ScoreSheetSchemaTemp = new mongoose.Schema(
    {
        /**
         * Teszttípus(ok) (pl. compulsory, free test, technical test).
         */
        TestType: [{
            type: String,
            enum: ['compulsory', 'free test','technical test'],
            required: [true, "Test type required!"],
        }],

        /**
         * Kategória(ák) azonosítói.
         */
        CategoryId: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "categorys",
            required: [true, "Category ID required!"],
        },
        /**
         * Bírók száma.
         */
        numberOfJudges: {
            type: Number,
            required: [true, "Number of judges required!"],
            default: 4,
        },  
        /**
         * Pontozás típusa.
         */
        typeOfScores: {
            type: String,
            enum: ['horse', 'artistic','technical','compulsory'],
            required: [true, "Type of scores required!"],
        },

        /**
         * Kimeneti mezők listája (név, contentid, pozíció).
         */
        outputFieldList: {
            type: [{
                name: { type: String, required: true },
                contentid: { type: String, required: true },
                position: {
                    x: { type: Number, default: 0 },
                    y: { type: Number, default: 0 },
                    w: { type: Number, default: 100 }
                }
            }],
            default: []
        },
        /**
         * Bemeneti mezők listája (név, id, előre definiált érték, pozíció).
         */
        inputFieldList: {
            type: [{
                name: { type: String, required: true },
                id: { type: String, required: true },
                preDefValue: { type: String, default: '' },
                position: {
                    x: { type: Number, default: 0 },
                    y: { type: Number, default: 0 },
                    w: { type: Number, default: 100 }
                }
            }],
            default: []
        },
        /**
         * Háttérkép elérési útja.
         */
        bgImage: {
            type: String,
            required: [true, "Background image required!"],
        }
    }, { timestamps: true }
);


// (Jelenleg nincs egyedi statikus metódus vagy getter definiálva)



/**
 * ScoreSheetTemp mongoose modell exportálása.
 */
export default mongoose.model('scoresheets_temp', ScoreSheetSchemaTemp);
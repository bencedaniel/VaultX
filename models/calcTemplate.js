import mongoose from 'mongoose';


/**
 * Számítási sablon (calculation template) mongoose séma.
 * Egy verseny eredményszámítási százalékokat tartalmazó séma.
 *
 * @property {Number} round1FirstP - 1. kör 1. rész százaléka (kötelező).
 * @property {Number} round1SecondP - 1. kör 2. rész százaléka (kötelező).
 * @property {Number} round2FirstP - 2. kör százaléka (kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const calcSchema = new mongoose.Schema({
        /**
         * 1. kör 1. rész százaléka.
         */
        round1FirstP: {
                type: Number,
                required: [true, 'Test 1 percentage required!'],
        },
        /**
         * 1. kör 2. rész százaléka.
         */
        round1SecondP: {
                type: Number,
                required: [true, 'Test 2  percentage required!'],
        },
        /**
         * 2. kör százaléka.
         */
        round2FirstP: {
                type: Number,
                required: [true, 'Final percentage required!'],
        }
},{ timestamps: true });

/**
 * Calculation template mongoose modell exportálása.
 */
export default mongoose.model('calculationtemplates', calcSchema);

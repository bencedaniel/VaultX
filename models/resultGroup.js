import mongoose from 'mongoose';


/**
 * Eredménycsoport (resultGroup) mongoose séma.
 * Egy esemény, kategória és számítási sablon összerendelése, valamint a körök időbeosztásai.
 *
 * @property {ObjectId} event - Esemény azonosító (events kollekció, kötelező).
 * @property {ObjectId} category - Kategória azonosító (categorys kollekció, kötelező).
 * @property {ObjectId} calcTemplate - Számítási sablon azonosító (calculationtemplates kollekció, kötelező).
 * @property {ObjectId} round1First - 1. kör első időbeosztásának azonosítója (timetableparts kollekció).
 * @property {ObjectId} round1Second - 1. kör második időbeosztásának azonosítója (timetableparts kollekció).
 * @property {ObjectId} round2First - 2. kör első időbeosztásának azonosítója (timetableparts kollekció).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const ResultGSchema = new mongoose.Schema({
    /**
     * Esemény azonosító (kötelező).
     */
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: [true, 'Event required!'],
    },
    /**
     * Kategória azonosító (kötelező).
     */
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorys',
        required: [true, 'Category required!'],
    },
    /**
     * Számítási sablon azonosító (kötelező).
     */
    calcTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calculationtemplates',
        required: [true, 'Calculation template required!'],
    },
    /**
     * 1. kör első időbeosztásának azonosítója.
     */
    round1First: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'timetableparts',
    },
    /**
     * 1. kör második időbeosztásának azonosítója.
     */
    round1Second: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'timetableparts',
    },
    /**
     * 2. kör első időbeosztásának azonosítója.
     */
    round2First: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'timetableparts',
    }
},{ timestamps: true });

/**
 * resultGroup mongoose modell exportálása.
 */
export default mongoose.model('resultgroup', ResultGSchema);

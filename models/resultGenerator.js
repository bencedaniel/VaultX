import mongoose from 'mongoose';


/**
 * Eredménygenerátor (resultGenerator) mongoose séma.
 * Egy adott kategóriához tartozó eredménygenerátor beállításait tárolja.
 *
 * @property {ObjectId} category - Kategória azonosító (categorys kollekció, egyedi, kötelező).
 * @property {ObjectId} calcSchemaTemplate - Számítási séma sablon azonosító (calculationtemplates kollekció, kötelező).
 * @property {Boolean} active - Aktív-e az eredménygenerátor (alapértelmezetten true, kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const resultGeneratorSchema = new mongoose.Schema({
    /**
     * Kategória azonosító (egyedi, kötelező).
     */
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categorys',
        required: [true, 'Category required!'],
        unique: [true, 'A result generator for this category already exists!'],
    },
    /**
     * Számítási séma sablon azonosító (kötelező).
     */
    calcSchemaTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'calculationtemplates',
        required: [true, 'Calculation template required!'],
    },
    /**
     * Aktív-e az eredménygenerátor.
     */
    active: {
        type: Boolean,
        default: true,
        required: [true, 'Active status required!'],
    }
},{ timestamps: true });

/**
 * resultGenerator mongoose modell exportálása.
 */
export default mongoose.model('resultgenerator', resultGeneratorSchema);

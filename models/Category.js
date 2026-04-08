import mongoose from 'mongoose';


/**
 * Kategória (Category) mongoose séma.
 * Egy versenykategória minden szükséges paraméterével, százalékaival, típusaival.
 *
 * @property {String} CategoryDispName - Kategória megjelenítendő neve (egyedi, kötelező).
 * @property {String} Type - Kategória típusa ('Individual', 'Squad', 'PDD').
 * @property {String} Sex - Nem (férfi, női, vegyes).
 * @property {Boolean} ReqComp - Kötelező-e a Compulsory teszt.
 * @property {Boolean} ReqFreeTest - Kötelező-e a Free teszt.
 * @property {Boolean} ReqTechnicalTest - Kötelező-e a Technical teszt.
 * @property {String} Agegroup - Korosztály.
 * @property {Number} Star - Csillag szint (1-4).
 * @property {Object} Horse - Ló pontszámítási százalékok (A1, A2, A3).
 * @property {Object} Free - Szabadgyakorlat százalékok (R, D, M, E, NumberOfMaxExercises).
 * @property {Object} Artistic - Művészi pontszámítási százalékok (CH, C1, C2, C3, C4).
 * @property {Object} TechArtistic - Technikai-művészi százalékok (CH, T1, T2, T3, TechDivider).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const CategorySchema = new mongoose.Schema({
    /**
     * Kategória megjelenítendő neve (pl. "Junior Fiú Squad").
     */
    CategoryDispName: {
        type: String,
        required: [true, 'Category name required!'],
        unique: true,
    },
    /**
     * Kategória típusa ('Individual', 'Squad', 'PDD').
     */
    Type: {
        type: String,
        enum: ['Individual', 'Squad','PDD'],
        required: [true, 'Category type required!'],
    },
    /**
     * Nem (férfi, női, vegyes).
     */
    Sex: {
        type: String,
        enum: ['Male', 'Female', 'Mixed'],
    },
    /**
     * Kötelező-e a Compulsory teszt.
     */
    ReqComp: { type: Boolean, required: true, default: false },
    /**
     * Kötelező-e a Free teszt.
     */
    ReqFreeTest: { type: Boolean, required: true, default: false },
    /**
     * Kötelező-e a Technical teszt.
     */
    ReqTechnicalTest: { type: Boolean, required: true, default: false },
    /**
     * Korosztály.
     */
    Agegroup: {
        type: String,
        enum: ['Children', 'Junior', 'Senior', 'Young Vaulter'],
        required: [true, 'Age group required!'],
    },
    /**
     * Csillag szint (1-4).
     */
    Star: {
        type: Number,
        required: [true, 'Star level required!'],
        default: 0,
        max: 4,
        min: 1,
    },
    /**
     * Ló pontszámítási százalékok (A1, A2, A3).
     */
    Horse: { 
        type: { 
            A1 : { type: Number, min: 0.0, max: 1.0, required: true },
            A2 : { type: Number, min: 0.0, max: 1.0, required: true },
            A3 : { type: Number, min: 0.0, max: 1.0, required: true },
        },
        _id: false
    },
    /**
     * Szabadgyakorlat százalékok (R, D, M, E, NumberOfMaxExercises).
     */
    Free: { 
        type: { 
            R : { type: Number, min: 0.0, max: 5.0, required: true },
            D : { type: Number, min: 0.0, max: 5.0, required: true },
            M : { type: Number, min: 0.0, max: 5.0, required: true },
            E : { type: Number, min: 0.0, max: 5.0, required: true },
            NumberOfMaxExercises : { type: Number, min: 1, required: true }
        },
        _id: false
    },
    /**
     * Művészi pontszámítási százalékok (CH, C1, C2, C3, C4).
     */
    Artistic: { 
        type: { 
            CH : { type: Number, min: 0.0, max: 1.0, required: true },
            C1 : { type: Number, min: 0.0, max: 1.0, required: true },
            C2 : { type: Number, min: 0.0, max: 1.0, required: true },
            C3 : { type: Number, min: 0.0, max: 1.0, required: true },
            C4 : { type: Number, min: 0.0, max: 1.0, required: true }
        },
        _id: false
    },
    /**
     * Technikai-művészi százalékok (CH, T1, T2, T3, TechDivider).
     */
    TechArtistic: { 
        type: { 
            CH : { type: Number, min: 0.0, max: 1.0, required: true },
            T1 : { type: Number, min: 0.0, max: 1.0, required: true },
            T2 : { type: Number, min: 0.0, max: 1.0, required: true },
            T3 : { type: Number, min: 0.0, max: 1.0, required: true },
            TechDivider : { type: Number, min: 1, max: 10, required: true }
        },
        _id: false
    },
}, { timestamps: true });

/**
 * Category mongoose modell exportálása.
 */
export default mongoose.model('categorys', CategorySchema);

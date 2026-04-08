import mongoose from "mongoose";


/**
 * Riasztás (Alert) mongoose séma.
 * Egy riasztás üzenet, amely jogosultsághoz kötött, megjeleníthető, újra megjeleníthető, stb.
 *
 * @property {String} title - A riasztás címe (kötelező).
 * @property {String} description - A riasztás leírása (kötelező).
 * @property {String} permission - Jogosultság, amelyhez a riasztás tartozik (kötelező).
 * @property {Boolean} active - Aktív-e a riasztás (alapértelmezett: true).
 * @property {Number} reappear - Hányszor jelenjen meg újra (alapértelmezett: 0).
 * @property {String} style - Megjelenítési stílus (pl. 'danger', alapértelmezett: 'danger').
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const AlertSchema = new mongoose.Schema(
    {
        /**
         * A riasztás címe (pl. "Figyelem!").
         */
        title: {
            type: String,
            required: [true, 'Alert title required!']
        },
        /**
         * A riasztás részletes leírása.
         */
        description: {
            type: String,
            required: [true, 'Alert description required!'],
        },
        /**
         * Jogosultság, amelyhez a riasztás tartozik.
         */
        permission: {
           type: String,
           required: [true, 'Permission required!'],
        },
        /**
         * Aktív-e a riasztás (megjelenjen-e).
         */
        active: {
            type: Boolean,
            default: true,
            required: [true, 'Active status required']
        },
        /**
         * Hányszor jelenjen meg újra a riasztás.
         */
        reappear: {
            type: Number,
            default: 0,
            required: [true, 'Reappear status required']
        },
        /**
         * Megjelenítési stílus (pl. veszély, info, stb.).
         */
        style: {
            type: String,
            default: 'danger',
        }
    },
    { timestamps: true }
);

/**
 * Alert mongoose modell exportálása.
 */
export default mongoose.model('alerts', AlertSchema);

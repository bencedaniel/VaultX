import mongoose from "mongoose";


/**
 * Súgóüzenet (HelpMessage) mongoose séma.
 * Egy adott oldalhoz vagy funkcióhoz tartozó súgóüzenet tárolása.
 *
 * @property {String} url - Az oldal vagy funkció URL-je, amelyhez a súgó tartozik (kötelező).
 * @property {String} HelpMessage - A súgóüzenet szövege (kötelező).
 * @property {Boolean} active - Aktív-e a súgóüzenet (alapértelmezetten true, kötelező).
 * @property {String} style - A súgóüzenet stílusa (pl. veszély, info, alapértelmezetten 'danger').
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const HelpMessage = new mongoose.Schema(
    {
        /**
         * Az oldal vagy funkció URL-je, amelyhez a súgó tartozik.
         */
        url: {
            type: String,
            required: [true, 'URL required!'],
        },
        /**
         * A súgóüzenet szövege.
         */
        HelpMessage: {
            type: String,
            required: [true, 'Help message description required!'],
        }, 
        /**
         * Aktív-e a súgóüzenet.
         */
        active: {
            type: Boolean,
            default: true,
            required: [true, 'Active status required']
        },
        /**
         * A súgóüzenet stílusa (pl. veszély, info, stb.).
         */
        style:{
            type: String,
            default: 'danger',
        }
    },
    { timestamps: true }
);

/**
 * HelpMessage mongoose modell exportálása.
 */
export default mongoose.model('helpmessages', HelpMessage);

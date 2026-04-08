import mongoose from 'mongoose';



/**
 * Jogosultság (Permission) mongoose séma.
 * Egy jogosultság nevét, megjelenítendő nevét és a hozzá tartozó URL-eket tárolja.
 *
 * @property {String} name - Jogosultság belső neve (egyedi, kötelező).
 * @property {String} displayName - Jogosultság megjelenítendő neve (kötelező).
 * @property {Array} attachedURL - Jogosultsághoz tartozó URL-ek tömbje (url, parent mezőkkel, kötelező).
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const PermissionSchema = new mongoose.Schema({
    /**
     * Jogosultság belső neve (egyedi).
     */
    name: { type: String, required: true, unique: true },
    /**
     * Jogosultság megjelenítendő neve.
     */
    displayName: { type: String, required: true },
    /**
     * Jogosultsághoz tartozó URL-ek tömbje.
     * Minden elem: url (URL string), parent (szülő jogosultság vagy menü neve).
     */
    attachedURL: { type: [{url: { type: String, required: true }, parent: { type: String, required: true }}], required: true },
},{ timestamps: true });

/**
 * Permission mongoose modell exportálása.
 */
export default mongoose.model('permission', PermissionSchema);

import mongoose from 'mongoose';

/**
 * Esemény (Incident) mongoose séma.
 * Verseny vagy esemény során történt baleset, felszerelés hiba, kizárás vagy egyéb incidens rögzítése.
 *
 * @property {String} incidentType - Az incidens típusa ('Injury', 'Equipment Failure', 'Disqualification', 'Other').
 * @property {String} description - Az incidens részletes leírása.
 * @property {Date} date - Az incidens időpontja.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const IncidentSchema = new mongoose.Schema({
        /**
         * Az incidens típusa ('Injury', 'Equipment Failure', 'Disqualification', 'Other').
         */
        incidentType: {
            type: String,
            required: [true, 'Incident type required!'],
            enum: ['Injury', 'Equipment Failure', 'Disqualification', 'Other'],
        },
        /**
         * Az incidens részletes leírása.
         */
        description: {
            type: String,
            required: [true, 'Incident description required!'],
        },
        /**
         * Az incidens időpontja.
         */
        date: {
            type: Date,
            required: [true, 'Incident date required!'],
        },

}, { timestamps: true });
/**
 * Incident mongoose modell exportálása.
 */
export default mongoose.model('incidents', IncidentSchema);

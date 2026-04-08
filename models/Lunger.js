import mongoose from 'mongoose';
import Horse from './Horse.js';



/**
 * Lóvezető (Lunger) mongoose séma.
 * Egy lóvezető (lungeur) főbb adatai, incidensei.
 *
 * @property {String} Name - Lóvezető neve (kötelező).
 * @property {String} feiid - FEI-azonosító (8 karakter, egyedi, kötelező).
 * @property {String} Gender - Lóvezető neme.
 * @property {String} Nationality - Lóvezető nemzetisége (kötelező).
 * @property {Array} LungerIncident - Lóvezetőhöz kapcsolódó incidensek tömbje.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const LungerSchema = new mongoose.Schema({
        /**
         * Lóvezető neve.
         */
        Name:{
            type: String,
            required: [true, 'Lunger name required!'],
        },
        /**
         * FEI-azonosító (8 karakter, egyedi).
         */
        feiid:{
            type: String,
            required: [true, 'FEI-ID required!'],
            minlength: [8, 'FEI ID must be at 8 characters!'],
            maxlength: [8, 'FEI ID must be at 8 characters!'],
            unique: true,
        },  
        /**
         * Lóvezető neme.
         */
        Gender:{
            type: String,
        },
        /**
         * Lóvezető nemzetisége.
         */
        Nationality:{
            type: String,
            required: [true,'Nationality required!'],
        },
        /**
         * Lóvezetőhöz kapcsolódó incidensek tömbje.
         * Minden elem: incidentType (típus), description (leírás), User (felvivő), date (időpont), eventID (esemény).
         */
        LungerIncident:{
                    type: [{
                        incidentType: { type: String, required: true, enum :['Injury', 'Withdrawal', 'Yellow card','Warning', 'Elimination', 'Disqualification', 'Other'] },
                        description: { type: String, required: true },
                        User: { type: mongoose.Schema.Types.ObjectId, ref:'users' ,required: true }, // User who reported the incident
                        date: { type: Date, default: Date.now },
                        eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // Event where the note was made
                        
                    }],
                    
                },
        
},{ timestamps: true });

/**
 * Lunger mongoose modell exportálása.
 */
export default mongoose.model('lungers', LungerSchema);

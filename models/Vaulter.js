import mongoose from 'mongoose';



/**
 * Voltizsáló (Vaulter) mongoose séma.
 * Egy versenyző főbb adatai, incidensei, kar-/rajtszámai eseményenként.
 *
 * @property {String} Name - Voltizsáló neve (kötelező).
 * @property {String} feiid - FEI-azonosító (8 karakter, egyedi, kötelező).
 * @property {String} gender - Nem ('Male', 'Female', 'Other').
 * @property {Date} Bdate - Születési dátum (kötelező).
 * @property {String} Nationality - Nemzetiség (kötelező).
 * @property {String} Status - Aktív/inaktív státusz (alapértelmezetten aktív).
 * @property {Array} ArmNr - Kar-/rajtszámok eseményenként (eventID, armNumber párok).
 * @property {Array} VaulterIncident - Incidensek tömbje.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const VaulterSchema = new mongoose.Schema({
    /**
     * Voltizsáló neve.
     */
    Name:{
      type: String,
      required: [true, 'Vaulter name required!'],
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
     * Nem.
     */
    gender:{
      type: String,
      enum:['Male','Female', 'Other']
    },
    /**
     * Születési dátum.
     */
    Bdate:{
      type: Date,
      required: [true, 'Birthdate required!'],
    },
    /**
     * Nemzetiség.
     */
    Nationality:{
      type: String,
      required: [true,  'Nationality required!'],
    },
    /**
     * Aktív/inaktív státusz.
     */
    Status:{
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },  
    /**
     * Kar-/rajtszámok eseményenként.
     * Minden elem: eventID (esemény azonosító), armNumber (kar-/rajtszám).
     */
    ArmNr:{
      type: [{      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true },
      armNumber: { type: String, required: true }}]
    },  
    /**
     * Incidensek tömbje.
     * Minden elem: incidentType, description, User, date, eventID.
     */
    VaulterIncident:{
      type: [{
        incidentType: { type: String, required: true, enum :['Injury', 'Withdrawal', 'Yellow card','Warning', 'Elimination', 'Disqualification', 'Other'] },
        description: { type: String, required: true },
        User: { type: mongoose.Schema.Types.ObjectId, ref:'users' ,required: true },
        date: { type: Date, default: Date.now },
        eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true },
      }],
    },
},{ timestamps: true });


// Kompozit index: egy adott vaulter (_id) ArmNr tömbjén belül az eventID csak egyszer szerepelhet.
VaulterSchema.index(
  { _id: 1, 'ArmNr.eventID': 1 },
  { unique: true, partialFilterExpression: { 'ArmNr.eventID': { $exists: true } } }
);

/**
 * Mentés előtti validáció: egy eventID csak egyszer szerepelhet az ArmNr tömbben.
 * Barátságosabb hibajelzés, mint az indexhiba.
 */
VaulterSchema.pre('validate', function(next) {
  if (!Array.isArray(this.ArmNr) || this.ArmNr.length === 0) return next();
  const seen = new Set();
  for (const a of this.ArmNr) {
    if (!a || !a.eventID) continue;
    const id = String(a.eventID);
    if (seen.has(id)) {
      const err = new mongoose.Error.ValidationError(this);
      err.addError('ArmNr', new mongoose.Error.ValidatorError({
        message: 'Minden eventID-hez csak egy ArmNr adható meg az ArmNr tömbben.'
      }));
      return next(err);
    }
    seen.add(id);
  }
  next();
});








/**
 * Vaulter mongoose modell exportálása.
 */
export default mongoose.model('vaulters', VaulterSchema);

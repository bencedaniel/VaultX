import mongoose from 'mongoose';


/**
 * Ló (Horse) mongoose séma.
 * Egy ló minden fontos adatát tartalmazza: név, FEI-azonosító, nem, születési dátum, állapotok, box/head számok, megjegyzések, felelős személy.
 *
 * @property {String} Horsename - Ló neve (egyedi, kötelező).
 * @property {String} feiid - FEI-azonosító (egyedi, kötelező, pontosan 7 karakter).
 * @property {String} sex - Ló neme ('Mare', 'Gelding', 'Stallion').
 * @property {Date} Bdate - Születési dátum.
 * @property {String} Nationality - Ló nemzetisége.
 * @property {Array} VetCheckStatus - Állatorvosi vizsgálatok státuszai eseményenként.
 * @property {String} HorseStatus - Ló státusza ('active', 'inactive').
 * @property {Array} BoxNr - Box számok eseményenként.
 * @property {Array} HeadNr - Head számok eseményenként.
 * @property {Array} Notes - Megjegyzések eseményenként.
 * @property {String} ResponsiblePersonName - Felelős személy neve.
 * @property {String} ResponsiblePersonContact - Felelős személy elérhetősége.
 * @property {Date} createdAt - Létrehozás időpontja (automatikus).
 * @property {Date} updatedAt - Utolsó módosítás időpontja (automatikus).
 */
const HorseSchema = new mongoose.Schema({
  /**
   * Ló neve (egyedi).
   */
  Horsename: {
    type: String,
    required: [true, 'Horsename required!'],
    unique: true,
  },
  /**
   * FEI-azonosító (7 karakter, egyedi).
   */
  feiid: {
    type: String,
    required: [true, 'FEI-ID required!'],
    unique: true,
    match: [/^[A-Za-z0-9]{7}$/, 'FEI-ID must be exactly 7 characters!'],
  },
  /**
   * Ló neme ('Mare', 'Gelding', 'Stallion').
   */
  sex: {
    type: String,
    enum: ['Mare','Gelding','Stallion'],
    required: [ true, 'Sex required!'],
  },
  /**
   * Születési dátum.
   */
  Bdate: {
    type: Date,
    required: [true, 'Birthdate required!'],
  },
  /**
   * Ló nemzetisége.
   */
  Nationality: {
    type: String,
    required: [true, 'Nationality required!'],
  },
  /**
   * Állatorvosi vizsgálatok státuszai eseményenként.
   * Minden elem: status (állapot), eventID (esemény azonosító), date (időpont), user (felvivő).
   */
  VetCheckStatus: {
    type: [{
      status: { type: String, required: true, enum: [ 'passed', 'failed', 'pending', 'holding', 'reinspection', 'withdrawn', 'ToBeFollowed'], },
      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true }, // Esemény azonosító
      date: { type: Date, default: Date.now},
      user: { type: mongoose.Schema.Types.ObjectId, ref:'users' ,required: true }, // Felvivő felhasználó
    }],
  },
  /**
   * Ló státusza ('active', 'inactive').
   */
  HorseStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  /**
   * Box számok eseményenként.
   * Minden elem: eventID (esemény), boxNumber (box száma).
   */
  BoxNr: {
    type: [{
      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true },
      boxNumber: { type: String, required: true }
    }]
  },
  /**
   * Head számok eseményenként.
   * Minden elem: eventID (esemény), headNumber (head száma).
   */
  HeadNr: {
    type: [{
      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true },
      headNumber: { type: String, required: true }
    }]
  },
  /**
   * Megjegyzések eseményenként.
   * Minden elem: note (szöveg), timestamp (időpont), user (felvivő), eventID (esemény).
   */
  Notes: {
    type: [{
      note: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
      eventID: { type: mongoose.Schema.Types.ObjectId, ref:'events' ,required: true },
    }],
    default: [],
  },
  /**
   * Felelős személy neve.
   */
  ResponsiblePersonName: {
    type: String,
    required: [true, 'Responsible person name required!'],
  },
  /**
   * Felelős személy elérhetősége.
   */
  ResponsiblePersonContact: {
    type: String,
    required: [true, 'Responsible person contact required!'],
  },
}, { timestamps: true });

/**
 * Horse mongoose modell exportálása.
 */
export default mongoose.model('horses', HorseSchema);

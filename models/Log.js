import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  // A metaField: Ez alapján fogja a Mongo a háttérben csoportosítani és tömöríteni a logokat.
  // FONTOS: Time Series kollekciónál ezt a mezőt utólag már nem módosíthatod (de logoknál amúgy sem szoktunk update-elni).
  level: {
    type: String,
    required: true,
    enum: ['operation', 'auth', 'validation', 'error', 'warn', 'db', 'info', 'debug']
  },
  
  message: {
    type: String,
    required: true
  },
  
  // A timeField: Kötelező Date típusnak lennie a Time Series-hez.
  timestamp: {
    type: Date,
    required: true,
  }
}, {
  versionKey: false,

  timeseries: {
    timeField: 'timestamp', // Melyik mező jelzi az időt (kötelező)
    metaField: 'level',     // Melyik mező alapján csoportosítson (opcionális, de teljesítménynövelő)
    granularity: 'seconds'  // 'seconds', 'minutes' vagy 'hours' - Milyen sűrűn jönnek az adatok
  },
  expireAfterSeconds: 864000 // 10 nap után automatikusan törlődik a log (opcionális)
});

export const Log = mongoose.model('Log', logSchema);
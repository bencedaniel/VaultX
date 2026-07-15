import Transport from 'winston-transport';
// FONTOS: Cseréld ki a saját modelled útvonalára!
import { Log } from '../models/Log.js'; 

export default class MongoBatchTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.buffer = [];
    this.BATCH_SIZE = opts.batchSize || 100;
    this.FLUSH_INTERVAL_MS = opts.flushInterval || 5000;
    
    // Időzítő az automatikus ürítéshez
    this.intervalId = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
  }

  log(info, callback) {
    this.buffer.push(info);

    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }

    callback();
  }

async flush() {
    if (this.buffer.length === 0) return;

    // Azonnal kimentjük és ürítjük a buffert
    const rawLogs = [...this.buffer];
    this.buffer = [];

    // Formázzuk a logokat a Mongoose számára
    const logsToSend = rawLogs.map(log => {
      // Készítünk egy másolatot, hogy ne módosítsuk a Winston eredeti objektumát
      const formattedLog = { ...log }; 
      
      if (formattedLog.timestamp) {
        formattedLog.timestamp = new Date(formattedLog.timestamp);
      }
      
      return formattedLog;
    });

    try {
      await Log.insertMany(logsToSend, { ordered: false });
    } catch (error) {
      console.error('Winston MongoBatchTransport Hiba:', error);
    }
  }
}
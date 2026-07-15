// models/IpTracker.js
import mongoose from 'mongoose';

const ipTrackerSchema = new mongoose.Schema({
    ip: { 
        type: String, 
        required: true, 
        unique: true 
    },
    attempts: { 
        type: Number, 
        default: 0 
    },
    bannedUntil: { 
        type: Date, 
        default: null 
    },
    // TTL index: a MongoDB automatikusan törli a dokumentumot 
    // 345600 másodperccel (4 nap) a lastAttempt értéke után.
    lastAttempt: { 
        type: Date, 
        default: Date.now, 
        expires: 345600
    }
});

export default mongoose.model('IpTracker', ipTrackerSchema);
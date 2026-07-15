// Felhasználó modell importálása
// Token feketelista modell importálása
// Jelszó hash-eléshez szükséges könyvtár
// Naplózó és autentikációs naplózó függvények importálása
import { logDb, logAuth } from '../logger.js';
import { FAILED_LOGINS_PER_IP, BAN_TIME } from '../config/env.js';
import IpTracker from '../models/IpTracker.js';

export async function checkIPandCreateNew(ipAddress) {
    const existingIp = await IpTracker.findOne({ ip: ipAddress });
    if (!existingIp) {
        const newIp = new IpTracker({ ip: ipAddress });
        newIp.lastAttempt = new Date();
        newIp.attempts = 1;
        newIp.bannedUntil = null;
        logDb('CREATE', 'IpTracker', `${ipAddress}`);
        
        await newIp.save();
        return newIp;
    }
    existingIp.lastAttempt = new Date();
    existingIp.attempts += 1;
    logAuth('UPDATE', 'IpTracker +1', `${ipAddress}`);
    if (existingIp.attempts >= FAILED_LOGINS_PER_IP) {
        existingIp.bannedUntil = new Date(Date.now() + BAN_TIME * 60 * 1000);
        logDb('UPDATE', 'IpTracker', `${ipAddress}`);
    }
    await existingIp.save();
    return existingIp;
}
export async function checkIPandCreateNewHard(ipAddress, attempts) {
    const existingIp = await IpTracker.findOne({ ip: ipAddress });
    if (!existingIp) {
        const newIp = new IpTracker({ ip: ipAddress });
        newIp.lastAttempt = new Date();
        newIp.attempts = attempts;
        newIp.bannedUntil = null;
        logDb('CREATE', 'IpTracker', `${ipAddress}`);
        
        await newIp.save();
        return newIp;
    }
    existingIp.lastAttempt = new Date();
    existingIp.attempts += attempts;
    logAuth('UPDATE', 'IpTracker +1', `${ipAddress}`);
    if (existingIp.attempts >= FAILED_LOGINS_PER_IP) {
        existingIp.bannedUntil = new Date(Date.now() + BAN_TIME * 60 * 1000);
        logDb('UPDATE', 'IpTracker', `${ipAddress}`);
    }
    await existingIp.save();
    return existingIp;
}

export async function checkIPbanStatus(ipAddress) {
    const ipRecord = await IpTracker.findOne({ ip: ipAddress });
    if (!ipRecord) {
        return false;
    }
    if (ipRecord.bannedUntil && new Date() < ipRecord.bannedUntil) {
        return true;
    }
    return false;
}


export async function listIPRecords() {
    const ipRecords = await IpTracker.find({});
    return ipRecords;
}
export async function deleteIPRecord(id) {
    const ipRecord = await IpTracker.findById(id);
    if (ipRecord) {
        await IpTracker.deleteOne({ _id: id });
        logDb('DELETE', 'IpTracker', `${ipRecord.ip}`);
        logAuth('DELETE', 'IpTracker', `${ipRecord.ip}`);
    
        return true;
    }

    return false;
}

export async function deleteIPRecordbyIP(ipAddress) {
    const ipRecord = await IpTracker.findOne({ ip: ipAddress });
    if (ipRecord) {
        await IpTracker.deleteOne({ ip: ipAddress });
            logDb('DELETE', 'IpTracker', `${ipRecord.ip}`);
         logAuth('DELETE', 'IpTracker', `${ipRecord.ip}`);
            return true;


    }
    
    return false;
}
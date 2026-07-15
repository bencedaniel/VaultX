// middleware/speedlimit.js (vagy ahová a mappaszerkezetedben kerül)
import rateLimit from 'express-rate-limit';
import { checkIPandCreateNewHard } from '../DataServices/IpTrackerData.js';
import { FAILED_LOGINS_PER_IP, BAN_TIME } from '../config/env.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';

export const speedTracker = rateLimit({
    windowMs: 5 * 1000, // 5 másodperc
    max: 100,           // Maximum 100 kérés 5 másodperc alatt
    message: MESSAGES.ERROR.TOO_MANY_REQUESTS,

    // Ez fut le, ha valaki túllépi a 100 kérést
    handler: async (req, res, next, options) => {
        const clientIp = req.ip;
        
        try {
            // Meghívjuk a saját segédfüggvényedet, egyből a maximum próbálkozással,
            // így azonnal megkapja az adatbázisban a kitiltást (bannedUntil).
            await checkIPandCreateNewHard(clientIp, Number(FAILED_LOGINS_PER_IP));
            
            console.warn(`[VÉDELEM - FLOOD] IP kitiltva: ${clientIp}`);

        } catch (error) {
            logError(MESSAGES.ERROR.TOO_MANY_REQUESTS, error);
        // Visszaküldjük a kliensnek a 429 (Too Many Requests) státuszkódot és az üzenetet
        res.status(HTTP_STATUS.TOO_MANY_REQUESTS).send(options.message);
    }
}
    })
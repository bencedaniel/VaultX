import { checkIPbanStatus } from '../DataServices/IpTrackerData.js';
export const IpCheck = async (req, res, next) => {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const ipRecord = await checkIPbanStatus(ipAddress);
    if (ipRecord) {
        return res.status(403).send(`Your IP is banned Please try again later.`);
    
    }
    next();
};


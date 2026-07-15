import { Log } from '../models/Log.js';
import { logDb, logError } from '../logger.js';

export async function listLogs() {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }) // Limit to the last 100 logs
        
        return logs;
    } catch (error) {
        logError('LIST_LOGS', `Error listing logs: ${error}`);
        throw error;
    }
}
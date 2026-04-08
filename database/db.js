// Mongoose (MongoDB ODM) importálása
import mongoose from 'mongoose';
// Node.js path modul importálása
import path from 'path';
// fileURLToPath segédfüggvény importálása (ESM modulokhoz)
import { fileURLToPath } from 'url';
// Környezeti változók betöltése
import dotenv from 'dotenv';
// Logger és naplózó függvények importálása
import {logger, logError, logInfo, logDb, logWarn} from "../logger.js";
// MongoDB URI importálása a környezeti konfigurációból
import { MONGODB_URI } from '../config/env.js';

/**
 * Adatbázis kapcsolódás inicializálása
 * Sikeres kapcsolódás esetén logol, hibánál kilép a folyamattal
 * SIGINT (Ctrl+C) eseményre lecsatlakozik az adatbázisról
 */
async function connectDB() {
    try {
        // Adatbázis kapcsolódás indítása
        await mongoose.connect(MONGODB_URI);
        logDb('CONNECT','Successfully connected to MongoDB', '');

        // Kapcsolat lezárása (graceful shutdown) kilépéskor (Ctrl+C)
        process.on('SIGINT', async () => {
            try {
                await mongoose.disconnect();
                logDb('DISCONNECT','Connection to MongoDB closed.', '');
                process.exit(0);
            } catch (err) {
                logError('DB_DISCONNECT', 'Failed to disconnect from MongoDB', err.toString());
                process.exit(1);
            }
        });
    } catch (err) {
        // Hibakezelés: sikertelen kapcsolódás esetén logol és kilép
        logError('DB_CONNECTION', 'Connection error', err.toString());
        process.exit(1);
    }
}

// Adatbázis kapcsolódás exportálása
export default connectDB;
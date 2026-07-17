/**
 * Környezeti változók betöltése és exportálása.
 *
 * Ez a modul egyszer tölti be a .env fájlt a projekt gyökeréből, majd minden fontosabb környezeti változót
 * név szerint exportál, hogy a többi modul típusbiztosan és egységesen férjen hozzájuk.
 */

import dotenv from 'dotenv';
import path from 'path';

// .env betöltése a projekt gyökeréből, csendes módban (quiet: true)
dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

/**
 * MongoDB kapcsolati URI (pl. adatbázis eléréshez)
 */
export const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Az alkalmazás által használt port (pl. 3000)
 */
export const PORT = process.env.PORT;

/**
 * JWT titkos kulcs (hozzáférési tokenekhez)
 */
export const SECRET_ACCESS_TOKEN = process.env.SECRET_ACCESS_TOKEN;

/**
 * HTTPS/secure cookie mód engedélyezése ('true' vagy 'false')
 */
export const SECURE_MODE = process.env.SECURE_MODE;

/**
 * Külső API-khoz használt titkos kulcs
 */
export const SECRET_API_KEY = process.env.SECRET_API_KEY;

/**
 * Tesztadatbázis URI (teszteléshez)
 */
export const TESTDB = process.env.TESTDB;

/**
 * Proxy megbízhatóságának beállítása (pl. '1' vagy 'true')
 */
export const TRUST_PROXY = process.env.TRUST_PROXY;

/**
 * Az alkalmazás publikus domain neve
 */
export const DOMAIN = process.env.DOMAIN;

/**
 * Alapértelmezett időtúllépés (ms)
 */
export let TIMEOUT = process.env.TIMEOUT;

/**
 * Biztonsági mentésekhez használt konténer neve
 */
export let BACKUP_CONTAINER = process.env.BACKUP_CONTAINER;

/**
 * Felhasználónkénti sikertelen bejelentkezési kísérletek maximális száma
 */
export let FAILED_LOGINS_PER_USER = process.env.FAILED_LOGINS_PER_USER;
/**
 * IP-címekre vonatkozó sikertelen bejelentkezési kísérletek maximális száma
 */
export let FAILED_LOGINS_PER_IP = process.env.FAILED_LOGINS_PER_IP;
/**
 * Kitiltás ideje másodpercben
 */
export let BAN_TIME = process.env.BAN_TIME;

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;


export function modifyEnvVariables(NEW_FAILED_LOGINS_PER_USER, NEW_FAILED_LOGINS_PER_IP, NEW_BAN_TIME, NEW_BACKUP_CONTAINER, NEW_TIMEOUT) {
    FAILED_LOGINS_PER_USER = NEW_FAILED_LOGINS_PER_USER;
    FAILED_LOGINS_PER_IP = NEW_FAILED_LOGINS_PER_IP;
    BAN_TIME = NEW_BAN_TIME;
    BACKUP_CONTAINER = NEW_BACKUP_CONTAINER;
    TIMEOUT = NEW_TIMEOUT;
    console.log(`Environment variables modified: FAILED_LOGINS_PER_USER=${FAILED_LOGINS_PER_USER}, FAILED_LOGINS_PER_IP=${FAILED_LOGINS_PER_IP}, BAN_TIME=${BAN_TIME}, BACKUP_CONTAINER=${BACKUP_CONTAINER}, TIMEOUT=${TIMEOUT}`);
}
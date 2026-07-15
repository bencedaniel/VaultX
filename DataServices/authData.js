// Felhasználó modell importálása
import User from '../models/User.js';
// Token feketelista modell importálása
import Blacklist from '../models/Blacklist.js';
// Jelszó hash-eléshez szükséges könyvtár
import bcrypt from 'bcrypt';
// Naplózó és autentikációs naplózó függvények importálása
import { logDb, logAuth } from '../logger.js';
import { FAILED_LOGINS_PER_USER, BAN_TIME } from '../config/env.js';

/**
 * Felhasználó keresése felhasználónév alapján
 * @param {string} username - A keresett felhasználónév
 * @returns {Promise<Object|null>} - A megtalált felhasználó vagy null
 */
export async function findUserByUsername(username) {
    return await User.findOne({ username });
}

/**
 * Felhasználó keresése felhasználónév alapján, jelszóval együtt
 * @param {string} username - A keresett felhasználónév
 * @returns {Promise<Object|null>} - A megtalált felhasználó (jelszóval) vagy null
 */
export async function findUserByUsernameWithPassword(username) {
    return await User.findOne({ username }).select("+password");
}

/**
 * Új felhasználó létrehozása
 * @param {Object} userData - Az új felhasználó adatai (username, fullname, password, feiid, role)
 * @returns {Promise<Object>} - A létrehozott felhasználó
 * @throws {Error} - Ha a felhasználónév már létezik
 */
export async function createUser(userData) {
    const { username, fullname, password, feiid, role } = userData;
    // Ellenőrizzük, hogy létezik-e már ilyen felhasználónév
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw new Error('User already exists');
    }
    // Új felhasználó példány létrehozása
    const newUser = new User({
        username,
        fullname,
        password,
        feiid,
        role
    });
    // Felhasználó mentése és naplózás
    await newUser.save();
    logAuth('CREATE', 'User', `${username}`);
    logDb(`CREATE`, 'User', `${username}`);
    return newUser;
}

/**
 * Felhasználó jelszavának ellenőrzése
 * @param {string} plainPassword - A megadott (nyers) jelszó
 * @param {string} hashedPassword - Az adatbázisban tárolt hash-elt jelszó
 * @returns {Promise<boolean>} - Igaz, ha a jelszó egyezik
 */
export async function validateUserPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Ellenőrzi, hogy a token feketelistán van-e
 * @param {string} token - Az ellenőrizendő token
 * @returns {Promise<boolean>} - Igaz, ha a token feketelistán van
 */
export async function isTokenBlacklisted(token) {
    const blacklistedToken = await Blacklist.findOne({ token });
    return !!blacklistedToken;
}

/**
 * Token feketelistára helyezése
 * @param {string} token - A feketelistára helyezendő token
 * @returns {Promise<Object>} - A létrehozott Blacklist rekord
 */
export async function blacklistToken(token) {
    const newBlacklist = new Blacklist({ token });
    await newBlacklist.save();
    logAuth('CREATE', 'Blacklist', `${token.substring(0, 10)}...`);
    logDb(`CREATE`, 'Blacklist', `${token.substring(0, 10)}...`);
    return newBlacklist;
}

export async function addFailedLoginAttempt(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.failedLoginAttempts += 1;

    // Ellenőrizzük, hogy elérte-e a sikertelen bejelentkezési kísérletek számát
    if (user.failedLoginAttempts >= FAILED_LOGINS_PER_USER) {
        user.bannedUntil = new Date(Date.now() + BAN_TIME * 60 * 1000); // Kitiltás idejének beállítása
        logAuth('LOGIN', user.username, false, `USER_BANNED for ${BAN_TIME} minutes due to ${user.failedLoginAttempts} failed login attempts.`);
    }

    await user.save();
}

export async function resetFailedLoginAttempts(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    user.failedLoginAttempts = 0;
    user.bannedUntil = null; // Kitiltás feloldása
    await user.save();
}

export async function isUserBanned(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const isBanned = user.bannedUntil && user.bannedUntil > new Date();
    
    logAuth('CHECK', user.username, false, `USER_BANNED check: ${isBanned ? 'BANNED' : 'NOT BANNED'}`);
    return isBanned;
    
}

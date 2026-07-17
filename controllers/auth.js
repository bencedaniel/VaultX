// Biztonságos mód beállításának importálása (cookie secure flag)
import { SECURE_MODE } from "../config/env.js";

// Logger és naplózó függvények importálása
import { logger, logAuth, logError, logValidation, logDebug } from "../logger.js";

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// JWT, cookie, státuszkód és üzenet konstansok importálása
import { JWT_CONFIG, COOKIE_CONFIG, HTTP_STATUS, MESSAGES } from '../config/index.js';

import { checkIPandCreateNew, deleteIPRecordbyIP } from '../DataServices/IpTrackerData.js';
import { addTokenTo2FAunauth } from '../DataServices/adminUserData.js';

// Authentikációval kapcsolatos adatkezelő függvények importálása
import {
    findUserByUsername,                // Felhasználó keresése felhasználónév alapján
    findUserByUsernameWithPassword,    // Felhasználó keresése jelszóval együtt
    createUser,                        // Új felhasználó létrehozása
    validateUserPassword,              // Jelszó validálása
    isTokenBlacklisted,                // Token feketelistán van-e
    blacklistToken,                    // Token feketelistára helyezése
    addFailedLoginAttempt,
    resetFailedLoginAttempts,
    isUserBanned
} from '../DataServices/authData.js';

/**
 * Felhasználó regisztrációja POST kérésre.
 * @route POST v1/auth/register
 * @desc Registers a user
 * @access Public
 *
 * - Új felhasználó létrehozása a kapott adatok alapján.
 * - Sikeres regisztráció esetén naplózás, üzenet beállítása és átirányítás.
 * - Hibánál naplózás és hiba továbbdobása.
 */
const Register = asyncHandler(async (req, res) => {
    // Regisztrációhoz szükséges adatok kinyerése a kérésből
    const { username, fullname, password, feiid, role } = req.body;
    
    try {
        // Új felhasználó létrehozása
        await createUser({ username, fullname, password, feiid, role });
        // Sikeres regisztráció naplózása
        logAuth('REGISTER', username, true);
        // Sikeres üzenet beállítása és átirányítás
        req.session.successMessage = MESSAGES.SUCCESS.USER_CREATED;
        res.redirect("/admin/dashboard/users");
    } catch (error) {
        // Sikertelen regisztráció naplózása és hiba továbbdobása
        logAuth('REGISTER', username, false, `Error: ${error.message}`);
        throw error;
    }
});


/**
 * Felhasználó bejelentkeztetése POST kérésre.
 * @route POST v1/auth/login
 * @desc logs in a user
 * @access Public
 *
 * - Felhasználó keresése felhasználónév alapján.
 * - Jelszó validálása.
 * - Sikeres bejelentkezés esetén JWT generálás, cookie beállítás, naplózás és átirányítás.
 * - Hibánál naplózás, üzenet beállítása és visszairányítás.
 */
const Login = asyncHandler(async (req, res) => {
    // Bejelentkezéshez szükséges adatok kinyerése a kérésből
    const { username, password } = req.body;
    
    // Felhasználó keresése jelszóval együtt
    const user = await findUserByUsernameWithPassword(username);
    if (!user) {
        await checkIPandCreateNew(req.ip || req.connection.remoteAddress);
        // Sikertelen bejelentkezés naplózása, üzenet beállítása és visszairányítás
        logAuth('LOGIN', username, false, 'INVALID_CREDENTIALS');
        req.session.failMessage = MESSAGES.AUTH.USER_NOT_FOUND;
        return res.redirect("/login");
    }

    if (await isUserBanned(user._id)) {
        // Sikertelen bejelentkezés naplózása, üzenet beállítása és visszairányítás
        logAuth('LOGIN', username, false, `USER_BANNED until ${user.bannedUntil}`);
        req.session.failMessage = MESSAGES.AUTH.USER_BANNED;
        return res.redirect("/login");
    }
    // Jelszó validálása
    const isPasswordValid = await validateUserPassword(password, user.password);
    if (!isPasswordValid) {
        // Sikertelen bejelentkezés naplózása, üzenet beállítása és visszairányítás
        logAuth('LOGIN', username, false, 'INVALID_CREDENTIALS');
        req.session.failMessage = MESSAGES.AUTH.INVALID_CREDENTIALS;
        await addFailedLoginAttempt(user._id);
        await user.save(); // Mentjük a felhasználót az adatbázisba
        return res.redirect("/login");
    }

    // Cookie beállítási opciók összeállítása
    let options = {
        ...COOKIE_CONFIG.OPTIONS,
        maxAge: JWT_CONFIG.COOKIE_MAX_AGE || JWT_CONFIG.SESSION_MAX_AGE,
        secure: SECURE_MODE === 'true',
        sameSite: "None"
    };

    // JWT generálása és cookie beállítása
    const token = user.generateAccessJWT();
    res.cookie(COOKIE_CONFIG.TOKEN_NAME, token, options);
    await deleteIPRecordbyIP(req.ip || req.connection.remoteAddress); // Delete IP record on successful login
    await resetFailedLoginAttempts(user._id); // Reset failed login attempts
    if (user.twoFactorEnabled) {
        await addTokenTo2FAunauth(user._id, token); // Add token to 2FA unauth list
        // Ha a felhasználó engedélyezte a kétlépcsős hitelesítést, átirányítjuk a 2FA ellenőrzésre
        return res.redirect("/2fa/verify");
    }

    // Sikeres bejelentkezés naplózása és átirányítás
    logAuth('LOGIN', username, true);
    return res.redirect("/dashboard");

});


/**
 * Felhasználó kijelentkeztetése POST kérésre.
 * @route POST /auth/logout
 * @desc Logout user
 * @access Public
 *
 * - Token kinyerése a cookie-ból.
 * - Token feketelistára helyezése, ha még nincs ott.
 * - Session törlése.
 * - Sikeres kijelentkezés naplózása és átirányítás.
 */
const Logout = asyncHandler(async (req, res) => {
    // Cookie fejléc kinyerése
    const authHeader = req.headers['cookie'];
    if (!authHeader) return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    // Token kinyerése a cookie-ból
    const cookie = authHeader.split('=')[1];
    const accessToken = cookie.split(';')[0];
    // Felhasználónév kinyerése (ha van)
    const username = req.user?.username || 'unknown';
    
    // Token feketelistán van-e
    const checkIfBlacklisted = await isTokenBlacklisted(accessToken);
    if (checkIfBlacklisted) return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    
    // Token feketelistára helyezése
    await blacklistToken(accessToken);
    // Sikeres kijelentkezés naplózása
    logAuth('LOGOUT', username, true);
    
    // Session törlése
    req.session.destroy((err) => {
        if (err) {
            // Sikertelen session törlés naplózása
            logError('SESSION_DESTROY', `Failed to destroy session for user ${username}: ${err.toString()}`);
        } else {
            // Sikeres session törlés naplózása
            logAuth('SESSION_DESTROY', username, true);
        }
    });
    
    // Cookie-k törlésének jelzése a böngésző felé
    res.setHeader('Clear-Site-Data', '"cookies"');
    return res.redirect('/login');
});






// A vezérlő által exportált handler függvények
export default { 
    Register, // Felhasználó regisztráció
    Login,    // Felhasználó bejelentkezés
    Logout    // Felhasználó kijelentkezés
};
import jwt from "jsonwebtoken";
import { SECRET_ACCESS_TOKEN, SECURE_MODE, TIMEOUT } from "../config/env.js";
import { logAuth, logError, logWarn, logDebug } from "../logger.js";
import { asyncHandler } from "./asyncHandler.js";
import { COOKIE_CONFIG, HTTP_STATUS, MESSAGES } from "../config/index.js";
import { 
  isTokenBlacklisted, 
  blacklistToken, 
  findUserByIdWithRole,
  getRoleWithPermissions 
} from "../DataServices/authMiddlewareData.js";
import { get } from "mongoose";
import { getHelpMessagebyUri } from "../DataServices/helpMessageData.js";
import { deleteIPRecordbyIP } from "../DataServices/IpTrackerData.js";
import { resetFailedLoginAttempts } from "../DataServices/authData.js";
import { checkTokenIn2FAunauth } from "../DataServices/adminUserData.js";


/**
 * Segédfüggvény: eldönti, hogy a kliens HTML választ vár-e (böngésző) vagy JSON-t (API).
 * Ha az Accept fejléc tartalmazza a 'text/html'-t, akkor HTML-t vár (pl. böngésző),
 * egyébként API hívásnak tekintjük.
 * @param {Request} req - Express kérés objektum.
 * @returns {boolean} Igaz, ha HTML választ vár.
 */
function wantsHtml(req) {
  const acceptHeader = req.headers['accept'] || '';
  return acceptHeader.includes('text/html');
}


/**
 * 401-es (Nincs jogosultság) válasz küldése böngészőnek vagy API-nak.
 * Ha böngészőből jön a kérés, akkor hibaoldalt renderel, egyébként JSON hibát ad vissza.
 * @param {Request} req - Express kérés objektum.
 * @param {Response} res - Express válasz objektum.
 * @param {string} [message] - Hibaüzenet.
 * @returns {Response}
 */
function unauthorized(req, res, message = MESSAGES.AUTH.SESSION_EXPIRED) {
  if (wantsHtml(req)) {
    // Böngésző kérés - hibaoldal renderelése
    return res.status(HTTP_STATUS.UNAUTHORIZED).render('errorpage', { errorCode: 401, message });
  } else {
    // API kérés - JSON válasz
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: 'Unauthorized', 
      message 
    });
  }
}


/**
 * 403-as (Tiltott) válasz küldése böngészőnek vagy API-nak.
 * Ha böngészőből jön a kérés, akkor hibaoldalt renderel, egyébként JSON hibát ad vissza.
 * @param {Request} req - Express kérés objektum.
 * @param {Response} res - Express válasz objektum.
 * @param {string} [message] - Hibaüzenet.
 * @param {string|null} [redirectPath] - Átirányítási útvonal (opcionális).
 * @returns {Response}
 */
function forbidden(req, res, message = MESSAGES.AUTH.PERMISSION_DENIED, redirectPath = null) {
  if (wantsHtml(req)) {
    // Böngésző kérés - hibaoldal renderelése
    return res.status(HTTP_STATUS.FORBIDDEN).render('errorpage', { errorCode: 403, message, redirectPath });
  } else {
    // API kérés - JSON válasz
    return res.status(HTTP_STATUS.FORBIDDEN).json({ 
      error: 'Forbidden', 
      message 
    });
  }
}


/**
 * Hitelesítési middleware: JWT token ellenőrzés, blacklist, user lekérés, session frissítés.
 * Sikeres ellenőrzés után a felhasználó adatai a req.user-ben lesznek.
 *
 * Lépések:
 * 1. Token lekérése cookie-ból vagy Authorization headerből
 * 2. Token blacklist ellenőrzése (kijelentkezett vagy visszavont token)
 * 3. Token validálás (aláírás, lejárat)
 * 4. Felhasználó lekérése az adatbázisból (és aktív-e)
 * 5. Ha inaktív, session törlés, token blacklistelés, hiba
 * 6. Rolling JWT generálása (lejárat frissítése)
 * 7. Cookie-ba írás
 * 8. User adatok a requesthez
 * 9. Segítség üzenet az oldalhoz (ha van)
 * 10. Ha a felhasználó engedélyezte a kétlépcsős hitelesítést, és a token még nincs ellenőrizve, átirányít a 2FA ellenőrzésre.
 * 11. Ha a felhasználónak kötelező a kétlépcsős hitelesítés, de nincs engedélyezve, átirányít a profil oldalra.
 *
 * @type {import('express').RequestHandler}
 */
export const Verify = asyncHandler(async (req, res, next) => {
  // 1 Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    // Nincs token: logolás, 401-es válasz
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_MISSING');
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_EXPIRED);
  }
  // 2 Blacklist ellenőrzés: ha a token vissza lett vonva, nem engedjük tovább
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_BLACKLISTED');
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_LOGGED_OUT);
  }
  // 3 Token validálás: aláírás, lejárat, stb.
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    logError('TOKEN_VERIFICATION_FAILED', err.message, 'Token validation');
    return unauthorized(req, res, MESSAGES.AUTH.INVALID_TOKEN);
  }
  // 4 Felhasználó lekérése az adatbázisból
  const user = await findUserByIdWithRole(decoded.id);
  if (!user) {
    logAuth('VERIFY_TOKEN', decoded.id, false, 'USER_NOT_FOUND');
    return unauthorized(req, res, MESSAGES.AUTH.USER_NOT_FOUND);
  }
  // 4.1 Ha a felhasználó inaktív, session-t töröl, tokent blacklistel
  if (!user.active) {
    logAuth('VERIFY_TOKEN', user.username, false, 'ACCOUNT_DEACTIVATED');
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    // Cookie headerből token kinyerése
    const authHeader = req.headers['cookie'];
    if (!authHeader) {
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }
    const cookie = authHeader.split('=')[1];
    const accessToken = cookie.split(';')[0];
    const checkIfBlacklisted = await isTokenBlacklisted(accessToken);
    if (checkIfBlacklisted) {
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }
    await blacklistToken(accessToken);
    res.clearCookie(COOKIE_CONFIG.TOKEN_NAME, {
      ...COOKIE_CONFIG.OPTIONS,
      secure: process.env.SECURE_MODE === 'true'
    });
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    return unauthorized(req, res, MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
  }




  await deleteIPRecordbyIP(req.ip || req.connection.remoteAddress); // Delete IP record on successful login
  await resetFailedLoginAttempts(user._id); // Reset failed login attempts
  // 5 Rolling JWT generálása (lejárat frissítése): minden kérésnél új token, hogy ne járjon le a session
  const timeoutMinutes = parseInt(TIMEOUT, 10) || 90;
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: `${timeoutMinutes}m` });
  // 6 Cookie-ba írás: új token beállítása
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true',
    maxAge: parseInt(TIMEOUT, 10) * 60 * 1000
  });
  // 7 User adatok a requesthez (jelszó nélkül)
  const { password, ...data } = user._doc;
  req.user = data;
  // 8 Segítség üzenet az oldalhoz (ha van)
  res.locals.helpMessage = await getHelpMessagebyUri(req.originalUrl);

  if(user.twoFactorNeeded && !user.twoFactorEnabled) {
    logAuth('VERIFY_TOKEN', user.username, false, '2FA_REQUIRED');
    req.session.failMessage = MESSAGES.ERROR.MANDATORY_TWO_FACTOR
    return res.redirect('/profile/'+user._id);
  }
  if(user.twoFactorEnabled) {
  const tokenStatus = await checkTokenIn2FAunauth(user._id);
  if( tokenStatus) {
    return res.redirect('/2fa/verify');
  }
}
    

  next();
});




/**
 * Hitelesítési middleware: JWT token ellenőrzés, blacklist, user lekérés, session frissítés.
 * Sikeres ellenőrzés után a felhasználó adatai a req.user-ben lesznek.
 *
 * Lépések:
 * 1. Token lekérése cookie-ból vagy Authorization headerből
 * 2. Token blacklist ellenőrzése (kijelentkezett vagy visszavont token)
 * 3. Token validálás (aláírás, lejárat)
 * 4. Felhasználó lekérése az adatbázisból (és aktív-e)
 * 5. Ha inaktív, session törlés, token blacklistelés, hiba
 * 6. Rolling JWT generálása (lejárat frissítése)
 * 7. Cookie-ba írás
 * 8. User adatok a requesthez
 * 9. Segítség üzenet az oldalhoz (ha van)
 * 10. Ha a felhasználó engedélyezte a kétlépcsős hitelesítést, és a token még nincs ellenőrizve, átirányít a 2FA ellenőrzésre.
 *
 * @type {import('express').RequestHandler}
 */
export const VerifyWithoutTwoFA = asyncHandler(async (req, res, next) => {
  // 1 Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    // Nincs token: logolás, 401-es válasz
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_MISSING');
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_EXPIRED);
  }
  // 2 Blacklist ellenőrzés: ha a token vissza lett vonva, nem engedjük tovább
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_BLACKLISTED');
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_LOGGED_OUT);
  }
  // 3 Token validálás: aláírás, lejárat, stb.
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    logError('TOKEN_VERIFICATION_FAILED', err.message, 'Token validation');
    return unauthorized(req, res, MESSAGES.AUTH.INVALID_TOKEN);
  }
  // 4 Felhasználó lekérése az adatbázisból
  const user = await findUserByIdWithRole(decoded.id);
  if (!user) {
    logAuth('VERIFY_TOKEN', decoded.id, false, 'USER_NOT_FOUND');
    return unauthorized(req, res, MESSAGES.AUTH.USER_NOT_FOUND);
  }
  // 4.1 Ha a felhasználó inaktív, session-t töröl, tokent blacklistel
  if (!user.active) {
    logAuth('VERIFY_TOKEN', user.username, false, 'ACCOUNT_DEACTIVATED');
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    // Cookie headerből token kinyerése
    const authHeader = req.headers['cookie'];
    if (!authHeader) {
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }
    const cookie = authHeader.split('=')[1];
    const accessToken = cookie.split(';')[0];
    const checkIfBlacklisted = await isTokenBlacklisted(accessToken);
    if (checkIfBlacklisted) {
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }
    await blacklistToken(accessToken);
    res.clearCookie(COOKIE_CONFIG.TOKEN_NAME, {
      ...COOKIE_CONFIG.OPTIONS,
      secure: process.env.SECURE_MODE === 'true'
    });
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    return unauthorized(req, res, MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
  }




  await deleteIPRecordbyIP(req.ip || req.connection.remoteAddress); // Delete IP record on successful login
  await resetFailedLoginAttempts(user._id); // Reset failed login attempts
  // 5 Rolling JWT generálása (lejárat frissítése): minden kérésnél új token, hogy ne járjon le a session
  
  const timeoutMinutes = parseInt(TIMEOUT, 10) || 90;
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: `${timeoutMinutes}m` });
  // 6 Cookie-ba írás: új token beállítása
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true',
    maxAge: parseInt(TIMEOUT, 10) * 60 * 1000
  });
  // 7 User adatok a requesthez (jelszó nélkül)
  const { password, ...data } = user._doc;
  req.user = data;
  // 8 Segítség üzenet az oldalhoz (ha van)
  res.locals.helpMessage = await getHelpMessagebyUri(req.originalUrl);


  if(user.twoFactorEnabled) {
  const tokenStatus = await checkTokenIn2FAunauth(user._id);
  if( tokenStatus) {
    return res.redirect('/2fa/verify');
  }
}
    

  next();
});

/**
 * Hitelesítési middleware, amely csak ellenőrzi a token meglétét, de nem dob hibát, ha nincs.
 * @type {import('express').RequestHandler}
 */
export const VerifyNoerror = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_EXPIRED);
  }
  next();
});

/**
 * Segédfüggvény: ellenőrzi, hogy két URL minta egyezik-e (pl. jogosultságokhoz).
 * @param {string} pattern - Jogosultság URL minta (pl. /admin/:id).
 * @param {string} actual - Aktuális URL.
 * @returns {boolean} Igaz, ha egyeznek.
 */
function urlsMatch(pattern, actual) {
  const patternParts = pattern.split('/').filter(Boolean);
  const actualParts = actual.split('/').filter(Boolean);
  if (patternParts.length !== actualParts.length) return false;
  return patternParts.every((part, i) => {
    return part.startsWith(':') || part === actualParts[i];
  });
}

/**
 * Jogosultság ellenőrző middleware: csak akkor enged tovább, ha a felhasználó szerepköre engedélyezi az adott URL-t.
 * @returns {import('express').RequestHandler}
 */
export function VerifyRole() {
    return asyncHandler(async (req, res, next) => {
        const user = req.user;
        const { role } = user;
        if (!role) {
            return unauthorized(req, res, MESSAGES.AUTH.USER_ROLE_NOT_FOUND);
        }
        const roleData = await getRoleWithPermissions(role);
        if (!roleData) {
            return unauthorized(req, res, MESSAGES.AUTH.ROLE_NOT_FOUND);
        }
        const { role: roleFromDB, permissions: permissionsDocs } = roleData;
        // Minden permission dokumentum elérhető a permissionsDocs tömbben
        const allAttachedURLs = permissionsDocs.flatMap(p => p.attachedURL);
        let hasPermission = false;
        const perm = allAttachedURLs.find(pattern => urlsMatch(pattern.url, req.originalUrl));
        if (!perm) {
          hasPermission = false;
        } else {
          req.session.parent = perm.parent;
          hasPermission = true;
          res.locals.parent = (typeof req.session?.parent === 'string' && req.session.parent.trim() !== '')
            ? req.session.parent
            : '/dashboard';
        }
        if (!roleFromDB || !hasPermission)  {
            logWarn('PERMISSION_DENIED', `User ${user.username} with role ${roleFromDB ? roleFromDB.roleName : 'unknown'} tried to access ${req.originalUrl} without permission.`);
            return forbidden(req, res, MESSAGES.AUTH.PERMISSION_DENIED, '/dashboard');
        }
        next();
    });
}
/**
 * Middleware: csak akkor enged tovább, ha a felhasználó saját ID-ját használja (pl. saját profil szerkesztése).
 * @type {import('express').RequestHandler}
 */
export const UserIDValidator = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;
  if (!userId) {
    return unauthorized(req, res, MESSAGES.AUTH.USER_ID_REQUIRED);
  }
  if (userId !== req.user._id.toString()) {
    return forbidden(req, res, MESSAGES.AUTH.PERMISSION_DENIED);
  }
  next();
});

/**
 * Middleware: ha van érvényes token, beállítja a req.user-t, de nem dob hibát, ha nincs vagy hibás.
 * @type {import('express').RequestHandler}
 */
export const StoreUserWithoutValidation = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next();
  }
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    return next();
  }
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    return next();
  }
  const user = await findUserByIdWithRole(decoded.id);
  if (!user) {
    return next();
  }
  const timeoutMinutes = parseInt(TIMEOUT, 10) * 3 || 90;
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: `${timeoutMinutes}m` });
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true',
    maxAge: parseInt(TIMEOUT, 10) * 60 * 1000
  });
  const { password, ...data } = user._doc;
  req.user = data;
  next();
});



/**
 * Middleware: ha a felhasználó már be van jelentkezve, átirányítja a dashboardra.
 * @type {import('express').RequestHandler}
 */
export const CheckLoggedIn = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next();
  }
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    return next();
  }
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    return next();
  }
  const user = await findUserByIdWithRole(decoded.id);
  if (!user) {
    return next();
  }
  console.info("User already logged in:", user.username);
  return res.redirect("/dashboard");
});

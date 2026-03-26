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

/**
 * Helper to detect if client wants HTML response (browser) vs JSON (API)
 */
function wantsHtml(req) {
  const acceptHeader = req.headers['accept'] || '';
  return acceptHeader.includes('text/html');
}

/**
 * Send 401 Unauthorized response
 */
function unauthorized(req, res, message = MESSAGES.AUTH.SESSION_EXPIRED) {
  
  if (wantsHtml(req)) {
    // Browser request - render 401 error page
    return res.status(HTTP_STATUS.UNAUTHORIZED).render('errorpage', { errorCode: 401, message });
  } else {
    // API request - send JSON
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
      error: 'Unauthorized', 
      message 
    });
  }
}

/**
 * Send 403 Forbidden response
 */
function forbidden(req, res, message = MESSAGES.AUTH.PERMISSION_DENIED, redirectPath = null) {
  
  if (wantsHtml(req)) {
    // Render the 403 error page from views/errors/403.ejs
    return res.status(HTTP_STATUS.FORBIDDEN).render('errorpage', { errorCode: 403, message, redirectPath });
  } else {
    // API request - send JSON
    return res.status(HTTP_STATUS.FORBIDDEN).json({ 
      error: 'Forbidden', 
      message 
    });
  }
}

export const Verify = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_MISSING');
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_EXPIRED);
  }
  
  // 2️⃣ Blacklist ellenőrzés
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    logAuth('VERIFY_TOKEN', 'unknown', false, 'TOKEN_BLACKLISTED');
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_LOGGED_OUT);
  }

  // 3️⃣ Token validálás
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    logError('TOKEN_VERIFICATION_FAILED', err.message, 'Token validation');
    return unauthorized(req, res, MESSAGES.AUTH.INVALID_TOKEN);
  }

  // 4️⃣ Felhasználó lekérése az adatbázisból
  const user = await findUserByIdWithRole(decoded.id);

  if (!user) {
    logAuth('VERIFY_TOKEN', decoded.id, false, 'USER_NOT_FOUND');
    return unauthorized(req, res, MESSAGES.AUTH.USER_NOT_FOUND);
  }
  
  if(!user.active){
    logAuth('VERIFY_TOKEN', user.username, false, 'ACCOUNT_DEACTIVATED');
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    const authHeader = req.headers['cookie']; // get the session cookie from request header
    if (!authHeader) {
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    } 
    const cookie = authHeader.split('=')[1]; // If there is, split the cookie string to get the actual jwt token
    const accessToken = cookie.split(';')[0];
    const checkIfBlacklisted = await isTokenBlacklisted(accessToken); // Check if that token is blacklisted
    // if true, send a no content response.
    if (checkIfBlacklisted){
      req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    } 
    // otherwise blacklist token
    await blacklistToken(accessToken);
    res.clearCookie(COOKIE_CONFIG.TOKEN_NAME, {
      ...COOKIE_CONFIG.OPTIONS,
      secure: process.env.SECURE_MODE === 'true'
    });
    req.session.failMessage = MESSAGES.AUTH.ACCOUNT_DEACTIVATED;
    return unauthorized(req, res, MESSAGES.AUTH.ACCOUNT_DEACTIVATED);
  }

  // 5️⃣ Rolling JWT generálása
  const timeoutMinutes = parseInt(TIMEOUT, 10)*3 || 90;
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: `${timeoutMinutes}m` });

  // 6️⃣ Cookie-ba írás
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true', // élesben: true
    maxAge: parseInt(TIMEOUT, 10) * 60 * 1000 // maxAge beállítása a TIMEOUT alapján
  });

  // 7️⃣ User adatok a requesthez
  const { password, ...data } = user._doc;
  req.user = data;

  // Get help message for this URL and attach to res.locals only if exists
  res.locals.helpMessage = await getHelpMessagebyUri(req.originalUrl);
 



  next();
});
export const VerifyNoerror = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return unauthorized(req, res, MESSAGES.AUTH.SESSION_EXPIRED);
  }

  next();
});

function urlsMatch(pattern, actual) {
    const patternParts = pattern.split('/').filter(Boolean);
    const actualParts = actual.split('/').filter(Boolean);

    if (patternParts.length !== actualParts.length) return false;

    return patternParts.every((part, i) => {
        return part.startsWith(':') || part === actualParts[i];
    });
}

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

        // Most minden permission dokumentum elérhető a permissionsDocs tömbben
        const allAttachedURLs = permissionsDocs.flatMap(p => p.attachedURL);

        let hasPermission = false
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

export const StoreUserWithoutValidation = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next();
  }

  // 2️⃣ Blacklist ellenőrzés
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    return next();
  }

  // 3️⃣ Token validálás
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    return next();
  }

  // 4️⃣ Felhasználó lekérése az adatbázisból
  const user = await findUserByIdWithRole(decoded.id);

  if (!user) {
    return next();
  }

  // 5️⃣ Rolling JWT generálása
    const timeoutMinutes = parseInt(TIMEOUT, 10)*3 || 90;
  const newToken = jwt.sign({ id: user._id }, SECRET_ACCESS_TOKEN, { expiresIn: `${timeoutMinutes}m`  });

  // 6️⃣ Cookie-ba írás
  res.cookie(COOKIE_CONFIG.TOKEN_NAME, newToken, {
    ...COOKIE_CONFIG.OPTIONS,
    secure: SECURE_MODE === 'true', // élesben: true
    maxAge: parseInt(TIMEOUT, 10) * 60 * 1000 // maxAge beállítása a TIMEOUT alapján
  });

  // 7️⃣ User adatok a requesthez
  const { password, ...data } = user._doc;
  req.user = data;

  next();
});



export const CheckLoggedIn = asyncHandler(async (req, res, next) => {
  // 1️⃣ Token lekérése cookie-ból vagy Authorization headerből
  const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return next();
  }

  // 2️⃣ Blacklist ellenőrzés
  const blacklisted = await isTokenBlacklisted(token);

  if (blacklisted) {
    return next();
  }

  // 3️⃣ Token validálás
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET_ACCESS_TOKEN);
  } catch (err) {
    return next(); // invalid token → tovább
  }

  // 4️⃣ Felhasználó lekérése
  const user = await findUserByIdWithRole(decoded.id);
  if (!user) {
    return next(); // nincs felhasználó → tovább
  }

  console.info("User already logged in:", user.username);
  return res.redirect("/dashboard");
});

import { generateSecret, generateURI, verify } from 'otplib';
import qrcode from 'qrcode';
import {getUserById, updateUserSecret, enableTwoFactorForUser, disableTwoFactorForUser, checkTokenIn2FAunauth, removeTokenFrom2FAunauth} from '../DataServices/adminUserData.js';
import { HTTP_STATUS} from '../config/constants.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { encrypt,decrypt } from '../LogicServices/crypto.js';
import { logAuth } from '../logger.js';
import { MESSAGES } from '../config/messages.js';


const generate2FACode = asyncHandler(async (req, res) => {
    // Feltételezve, hogy a usert a JWT token alapján már azonosítottad (req.user)
    const user = await getUserById(req.user._id);

    // Generálunk egy egyedi titkos kulcsot
    const secret = generateSecret();
    
    // Ezt elmentjük a userhez (de még nem aktiváljuk a 2FA-t!)
    await updateUserSecret(req.user._id, encrypt(secret));

    // Generálunk egy URI-t, amit az authenticator appok megértenek
    // Formátum: generateURI({ issuer, label, secret })
    const otpauthUrl = generateURI({
        issuer: 'VaultX',
        label: user.username,
        secret
    });

    res.type('image/png');
    // Generálunk egy QR kódot az 
    //URI-ból és visszaküldjük a kliensnek
    qrcode.toFileStream(res, otpauthUrl);
});


const check2FACode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const user = await getUserById(req.user._id);

    if (!user || !user.twoFactorSecret) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: MESSAGES.ERROR.TWO_FA_NOT_SET_UP });
    }

    const decryptedSecret = decrypt(user.twoFactorSecret);
    const isValid = verify({ token: code, secret: decryptedSecret });
    if (isValid) {
        // Ha a kód érvényes, beállítjuk a felhasználó 2FA státuszát
        await updateUserSecret(req.user._id, decryptedSecret, true); // true jelzi, hogy a 2FA aktiválva van
        logAuth('2FA_VERIFY', req.user.username, true, `2FA code verified successfully.`);
        req.session.successMessage = MESSAGES.SUCCESS.TWO_FA_VERIFIED;
        await enableTwoFactorForUser(req.user._id); // Aktiváljuk a 2FA-t a felhasználónál
        res.status(HTTP_STATUS.OK).json({ valid: true, message: '2FA code is valid.' });
    }else {
        // Ha a kód érvénytelen, naplózhatjuk a sikertelen próbálkozást
        logAuth('2FA_VERIFY', req.user.username, false, `Invalid 2FA code attempt: ${code}`);
        res.status(HTTP_STATUS.UNAUTHORIZED).json({ valid: false, message: MESSAGES.ERROR.TWO_FA_BAD_REQUEST });
    }
});



const disable2FAForUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await getUserById(userId);

    if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.AUTH.USER_NOT_FOUND });
    }

    // Reseteljük a 2FA-t a felhasználónál
    await disableTwoFactorForUser(userId);
    req.session.successMessage = MESSAGES.SUCCESS.TWO_FA_RESET;
    res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.SUCCESS.TWO_FA_RESET });
});

const getverify2FACode = asyncHandler(async (req, res) => {
    res.render('2fapage', {
        user: req.user,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        
    });
    // Session üzenetek törlése a válasz után
    req.session.failMessage = null;
    req.session.successMessage = null;
});

const verify2FACode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const user = await getUserById(req.user._id);
    //Check the login identifier status in DB
    const token = req.cookies.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        req.session.failMessage = MESSAGES.ERROR.TOKEN_NOT_FOUND;
        return res.redirect('/login');
    }
    if (!user) {
        req.session.failMessage = MESSAGES.ERROR.USER_NOT_FOUND;
        return res.redirect('/login');
    }
    if (!user.twoFactorEnabled) {
        req.session.failMessage = MESSAGES.ERROR.TWO_FA_NOT_ENABLED;
        return res.redirect('/login');
    }
    if (!user.twoFactorSecret) {
        req.session.failMessage = MESSAGES.ERROR.TWO_FA_NOT_SET_UP;
        return res.redirect('/login');
    }
    const tokenStatus = await checkTokenIn2FAunauth(user._id);
    if( !tokenStatus) {
        req.session.failMessage = MESSAGES.ERROR.TWO_FA_TOKEN_NOT_FOUND;
        return res.redirect('/login');
    }
    console.log('User fetched for 2FA verification:', user);
    const decryptedSecret = decrypt(user.twoFactorSecret);
    const isValid = verify({ token: code, secret: decryptedSecret });
    if (!isValid) {
        req.session.failMessage = MESSAGES.ERROR.TWO_FA_BAD_REQUEST;
        logAuth('2FA_VERIFY', user.username, false, `Invalid 2FA code attempt: ${code}`);
        return res.redirect('/2fa/verify');
    }else {
        // Ha a kód érvényes, eltávolítjuk a token-t a 2FA unauth listából
        await removeTokenFrom2FAunauth(user._id);
    }
    logAuth('2FA_VERIFY', user.username, true, `2FA code verified successfully.`);
    
    
    // Ha a kód érvényes, beállítjuk a felhasználó 2FA státuszát
    req.session.successMessage = MESSAGES.SUCCESS.TWO_FA_VERIFIED;
    console.log('2FA code verified successfully for user:', user.username); 
    res.redirect('/dashboard');
});



export default {
    generate2FACode,
    check2FACode,
    disable2FAForUser,
    getverify2FACode,
    verify2FACode
};
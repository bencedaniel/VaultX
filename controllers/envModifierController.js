// Logger és naplózó függvények importálása
import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';

// Aszinkron hibakezelő middleware importálása
import { asyncHandler } from '../middleware/asyncHandler.js';

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import { FAILED_LOGINS_PER_USER, FAILED_LOGINS_PER_IP, BAN_TIME, BACKUP_CONTAINER, TIMEOUT,modifyEnvVariables} from '../config/env.js';


// Felhasználó modell
//  importálása (ha szükséges)
import User from "../models/User.js";

const getenvironmentVariableModifiers = asyncHandler(async (req, res) => {
    // A környezeti változók módosítási felülete
    const envVars = {
        FAILED_LOGINS_PER_USER,
        FAILED_LOGINS_PER_IP,
        BAN_TIME,
        BACKUP_CONTAINER,
        TIMEOUT
    };
    res.render("admin/envModifier", {
        failMessage: req.session.failMessage,
        formData: envVars,
        successMessage: req.session.successMessage,
        rolePermissons: req.user?.role?.permissions,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

const modifyEnvironmentVariables = asyncHandler(async (req, res) => {
    const { NEW_BACKUP_CONTAINER, NEW_FAILED_LOGINS_PER_USER, NEW_FAILED_LOGINS_PER_IP, NEW_BAN_TIME, NEW_TIMEOUT } = req.body;
    if(NEW_BACKUP_CONTAINER !== "true" && NEW_BACKUP_CONTAINER !== "false") {
            req.session.failMessage = MESSAGES.ERROR.ENVERR.BACKUP_CONTAINER_ERROR;
            logger.warn(`Validation error: BACKUP_CONTAINER must be 'true' or 'false'. User: ${req.user.username}`);
            return res.redirect("/admin/envModifier");
        }
        // Validáció: Ellenőrizzük, hogy a bemeneti értékek számok-e
        if (isNaN(NEW_FAILED_LOGINS_PER_USER) || isNaN(NEW_FAILED_LOGINS_PER_IP) || isNaN(NEW_BAN_TIME) || isNaN(NEW_TIMEOUT)) {
            req.session.failMessage = MESSAGES.ERROR.ENVERR.VALIDATION_ERROR;
            console.log(req.session.failMessage)
            logger.warn(`Validation error: One or more input values are not valid numbers. User: ${req.user.username}`);
            return res.redirect("/admin/envModifier");
        }
    modifyEnvVariables(NEW_FAILED_LOGINS_PER_USER, NEW_FAILED_LOGINS_PER_IP, NEW_BAN_TIME, NEW_BACKUP_CONTAINER, NEW_TIMEOUT);
    logger.info(`Environment variables modified by user ${req.user.username}`);
    req.session.successMessage = MESSAGES.SUCCESS.ENV_MODIFY_RESPONSE;
     return res.redirect("/admin/envModifier");
});

// A vezérlő által exportált handler függvények
export default {
    getenvironmentVariableModifiers,
    modifyEnvironmentVariables
};

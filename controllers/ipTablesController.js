// Logger és naplózó függvények importálása

// Aszinkron hibakezelő middleware importálása

// HTTP státuszkódok és üzenetek konstansainak importálása
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listIPRecords, deleteIPRecord } from '../DataServices/IpTrackerData.js';


// Felhasználó modell
//  importálása (ha szükséges)
import User from "../models/User.js";

const getIpTrackerDashboard = asyncHandler(async (req, res) => {
    // Az összes IP rekord lekérése
    const ipRecords = await listIPRecords();
    res.render("admin/ipTrackerdash", {
        rolePermissons: req.user?.role?.permissions,
        ipRecords: ipRecords,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

const deleteIpRecordHandler = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletionSuccess = await deleteIPRecord(id);

    if (deletionSuccess) {
        req.session.successMessage = MESSAGES.SUCCESS.IP_RECORD_DELETED;
        res.status(HTTP_STATUS.OK).send(MESSAGES.SUCCESS.IP_RECORD_DELETED);

    } else {
        req.session.failMessage = MESSAGES.ERROR.IP_RECORD_NOT_FOUND;
        res.status(HTTP_STATUS.NOT_FOUND).send(MESSAGES.ERROR.IP_RECORD_NOT_FOUND);
    }

});

// A vezérlő által exportált handler függvények
export default {
    getIpTrackerDashboard,
    deleteIpRecordHandler
};

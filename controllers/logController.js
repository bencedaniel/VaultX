import { listLogs } from '../DataServices/logsData.js';
import { asyncHandler } from '../middleware/asyncHandler.js';


const getLogs = asyncHandler(async (req, res) => {
        const logs = await listLogs();
    
    res.render('admin/logViewer', {
        logs: logs,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});


export default {
    getLogs
};
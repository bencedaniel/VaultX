import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * @route GET /login
 * @desc Show login page
 */
const getLoginPage = asyncHandler(async (req, res) => {
    const failMessage = req.session.failMessage;
    res.render("login", { 
        failMessage, 
        rolePermissons: req.user?.role.permissions, 
        successMessage: req.session.successMessage,
        noindex: true // Prevent search engine indexing
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

export default {
    getLoginPage
};

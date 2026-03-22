import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * @route GET /creators
 * @desc Show creators page
 */
const getCreatorsPage = asyncHandler(async (req, res) => {
    res.render('creators', {
        successMessage: req.session?.successMessage, 
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session?.failMessage,
        formData: req.session?.formData,
        user: req?.user
    });
});

export default {
    getCreatorsPage
};

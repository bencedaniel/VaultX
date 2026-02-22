import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import auth from '../controllers/auth.js';
import dashboardController from '../controllers/dashboardController.js';
import profileController from '../controllers/profileController.js';
import loginController from '../controllers/loginController.js';
import creatorsController from '../controllers/creatorsController.js';
import Validate from "../middleware/Validate.js";
import { check } from "express-validator";
import { CheckLoggedIn, UserIDValidator, Verify, VerifyRole, StoreUserWithoutValidation, VerifyNoerror } from "../middleware/Verify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve robots.txt from root
router.get("/robots.txt", (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '../static/robots.txt'));
});

router.get("/", async (req, res) => {
    res.redirect("/dashboard");

});
router.dashboard = router.get("/dashboard", VerifyNoerror, Verify, dashboardController.getDashboard);


router.post(
    "/login",
    check("username")
        .not()
        .isEmpty(),
    check("password").not().isEmpty(),
    Validate, 
    auth.Login
);
router.get("/login", CheckLoggedIn, loginController.getLoginPage);

router.get("/profile/:id", Verify, UserIDValidator, profileController.getProfileEditForm);

router.post("/profile/:id", Verify, UserIDValidator, profileController.updateProfile);
router.get('/creators', StoreUserWithoutValidation, creatorsController.getCreatorsPage);
router.get('/logout', Verify, auth.Logout);



export default router;
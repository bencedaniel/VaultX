import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import helpMessageController from '../controllers/helpmessageController.js';
const helpMessageRouter = express.Router();


helpMessageRouter.get('/new', Verify, VerifyRole(), helpMessageController.renderNew);
helpMessageRouter.post('/new', Verify, VerifyRole(), helpMessageController.createNew);
helpMessageRouter.get('/dashboard', Verify, VerifyRole(), helpMessageController.dashboard);
helpMessageRouter.get('/edit/:id', Verify, VerifyRole(), helpMessageController.editGet);
helpMessageRouter.post('/edit/:id', Verify, VerifyRole(), Validate, helpMessageController.editPost);
helpMessageRouter.delete('/delete/:id', Verify, VerifyRole(), helpMessageController.delete);




export default helpMessageRouter;
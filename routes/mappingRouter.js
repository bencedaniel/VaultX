import express from 'express';

import {logger} from '../logger.js';
import Validate from "../middleware/Validate.js";
import { Verify, VerifyRole } from "../middleware/Verify.js";
import mappingController from '../controllers/mappingController.js';

const mappingRouter = express.Router();


mappingRouter.get('/new', Verify, VerifyRole(), mappingController.renderNew);
mappingRouter.post('/new', Verify, VerifyRole(), mappingController.createNew);
mappingRouter.get('/dashboard', Verify, VerifyRole(), mappingController.dashboard);
mappingRouter.get('/edit/:id', Verify, VerifyRole(), mappingController.editGet);
mappingRouter.post('/edit/:id', Verify, VerifyRole(), Validate, mappingController.editPost);
mappingRouter.delete('/delete/:id', Verify, VerifyRole(), mappingController.delete);





export default mappingRouter;
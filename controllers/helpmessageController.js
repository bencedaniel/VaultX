import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllHelpMessages,
    getHelpMessageById,
    createHelpMessage,
    updateHelpMessage,
    deleteHelpMessage,

} from '../DataServices/helpMessageData.js';


const renderNew = (req, res) => {
  res.render('helpmessages/newHelpMessage', {
    formData: req.session.formData,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
};

const createNew = asyncHandler(async (req, res) => {
  const newHelpMessage = await createHelpMessage(req.body);
  logOperation('HELP_MESSAGE_CREATE', `Help message created: ${newHelpMessage._id}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.HELP_MESSAGE_CREATED;
  res.redirect('/helpmessages/dashboard');
});

const dashboard = asyncHandler(async (req, res) => {
  const helpMessages = await getAllHelpMessages();
  res.render('helpmessages/helpMessageDashboard', {
    helpMessages,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const editGet = asyncHandler(async (req, res) => {
  const helpMessage = await getHelpMessageById(req.params.id);
  res.render('helpmessages/editHelpMessage', {
    formData: helpMessage,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const editPost = asyncHandler(async (req, res) => {
  const helpMessage = await updateHelpMessage(req.params.id, req.body);
  logOperation('HELP_MESSAGE_UPDATE', `Help message updated: ${helpMessage?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.HELP_MESSAGE_UPDATED;
  res.redirect('/helpmessages/dashboard');
});

const delete_ = asyncHandler(async (req, res) => {
  const helpMessage = await deleteHelpMessage(req.params.id);
  logOperation('HELP_MESSAGE_DELETE', `Help message deleted: ${helpMessage?._id || req.params.id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.HELP_MESSAGE_DELETED;
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.HELP_MESSAGE_DELETED });
});

export default {
  renderNew,
  createNew,
  dashboard,
  editGet,
  editPost,
  delete: delete_
};

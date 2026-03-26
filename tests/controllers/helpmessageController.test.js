import helpmessageController from '../../controllers/helpmessageController.js';
import * as helpMessageData from '../../DataServices/helpMessageData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

jest.mock('../../DataServices/helpMessageData.js');

const mockRes = () => {
  const res = {};
  res.render = jest.fn();
  res.redirect = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('helpmessageController', () => {
  let req, res;
  beforeEach(() => {
    req = {
      session: {},
      params: { id: '1' },
      body: { foo: 'bar' },
      user: { username: 'test', role: { permissions: ['perm'] } }
    };
    res = mockRes();
    jest.clearAllMocks();
  });

  it('renderNew renders newHelpMessage', () => {
    helpmessageController.renderNew(req, res);
    expect(res.render).toHaveBeenCalledWith('helpmessages/newHelpMessage', expect.objectContaining({ formData: req.session.formData }));
    expect(req.session.failMessage).toBeNull();
    expect(req.session.successMessage).toBeNull();
  });

  it('createNew creates and redirects', async () => {
    helpMessageData.createHelpMessage.mockResolvedValueOnce({ _id: '1' });
    await helpmessageController.createNew(req, res);
    expect(helpMessageData.createHelpMessage).toHaveBeenCalledWith(req.body);
    expect(res.redirect).toHaveBeenCalledWith('/helpmessages/dashboard');
    expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.HELP_MESSAGE_CREATED);
  });

  it('dashboard renders dashboard with helpMessages', async () => {
    helpMessageData.getAllHelpMessages.mockResolvedValueOnce(['msg']);
    await helpmessageController.dashboard(req, res);
    expect(res.render).toHaveBeenCalledWith('helpmessages/helpMessageDashboard', expect.objectContaining({ helpMessages: ['msg'] }));
    expect(req.session.failMessage).toBeNull();
    expect(req.session.successMessage).toBeNull();
  });

  it('editGet renders editHelpMessage', async () => {
    helpMessageData.getHelpMessageById.mockResolvedValueOnce({ _id: '1' });
    await helpmessageController.editGet(req, res);
    expect(res.render).toHaveBeenCalledWith('helpmessages/editHelpMessage', expect.objectContaining({ formData: { _id: '1' } }));
    expect(req.session.failMessage).toBeNull();
    expect(req.session.successMessage).toBeNull();
  });

  it('editPost updates and redirects', async () => {
    helpMessageData.updateHelpMessage.mockResolvedValueOnce({ _id: '1' });
    await helpmessageController.editPost(req, res);
    expect(helpMessageData.updateHelpMessage).toHaveBeenCalledWith('1', req.body);
    expect(res.redirect).toHaveBeenCalledWith('/helpmessages/dashboard');
    expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.HELP_MESSAGE_UPDATED);
  });

  it('delete deletes and returns json', async () => {
    helpMessageData.deleteHelpMessage.mockResolvedValueOnce({ _id: '1' });
    await helpmessageController.delete(req, res);
    expect(helpMessageData.deleteHelpMessage).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    expect(res.json).toHaveBeenCalledWith({ message: MESSAGES.SUCCESS.HELP_MESSAGE_DELETED });
    expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.HELP_MESSAGE_DELETED);
  });
});

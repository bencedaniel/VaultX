import { getHelpMessagebyUri } from '../../DataServices/helpMessageData.js';
import * as helpMessageData from '../../DataServices/helpMessageData.js';
import Helpmessage from '../../models/helpmessage.js';

jest.mock('../../models/helpmessage.js');
jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logDebug: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logAuth: jest.fn(),
}));

describe('getHelpMessagebyUri (ObjectId ending logic)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should replace ObjectId at the end of the URI with :id and find the help message', async () => {
    const uri = '/foo/bar/69c440e1c4230306467d6026';
    const patternUri = '/foo/bar/:id';
    const mockHelp = { url: patternUri, active: true, HelpMessage: 'Test', style: 'info' };
    Helpmessage.findOne.mockResolvedValueOnce(mockHelp);

    const result = await getHelpMessagebyUri(uri);
    expect(Helpmessage.findOne).toHaveBeenCalledWith({ url: patternUri, active: true });
    expect(result).toBe(mockHelp);
  });

  it('should not replace if the last segment is not 24 chars, and find the help message', async () => {
    const uri = '/foo/bar/sluggy';
    const patternUri = uri;
    const mockHelp = { url: patternUri, active: true, HelpMessage: 'Slug', style: 'info' };
    Helpmessage.findOne.mockResolvedValueOnce(mockHelp);

    const result = await getHelpMessagebyUri(uri);
    expect(Helpmessage.findOne).toHaveBeenCalledWith({ url: patternUri, active: true });
    expect(result).toBe(mockHelp);
  });

  it('should return default help message if no match is found', async () => {
    const uri = '/foo/bar/69c440e1c4230306467d6026';
    Helpmessage.findOne.mockResolvedValueOnce(null);

    const result = await getHelpMessagebyUri(uri);
    expect(result).toMatchObject({
      style: 'primary',
      url: uri
    });
    expect(result.HelpMessage).toBeDefined();
  });

  it('should handle root path with ObjectId', async () => {
    const uri = '/69c440e1c4230306467d6026';
    const patternUri = '/:id';
    const mockHelp = { url: patternUri, active: true, HelpMessage: 'Root', style: 'info' };
    Helpmessage.findOne.mockResolvedValueOnce(mockHelp);

    const result = await getHelpMessagebyUri(uri);
    expect(Helpmessage.findOne).toHaveBeenCalledWith({ url: patternUri, active: true });
    expect(result).toBe(mockHelp);
  });
});

describe('getHelpMessagebyUri', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should replace ObjectId at the end of the URI with :id and find the help message', async () => {
    const uri = '/dailytimetable/editTTelement/69c440e1c4230306467d6026';
    const patternUri = '/dailytimetable/editTTelement/:id';
    const mockHelp = { url: patternUri, active: true, HelpMessage: 'Test', style: 'info' };
    Helpmessage.findOne.mockResolvedValueOnce(mockHelp);

    const result = await getHelpMessagebyUri(uri);
    expect(Helpmessage.findOne).toHaveBeenCalledWith({ url: patternUri, active: true });
    expect(result).toBe(mockHelp);
  });

  it('should not replace if the last segment is not 24 chars, and find the help message', async () => {
    const uri = '/dailytimetable/editTTelement/sluggy';
    const patternUri = uri;
    const mockHelp = { url: patternUri, active: true, HelpMessage: 'Slug', style: 'info' };
    Helpmessage.findOne.mockResolvedValueOnce(mockHelp);

    const result = await getHelpMessagebyUri(uri);
    expect(Helpmessage.findOne).toHaveBeenCalledWith({ url: patternUri, active: true });
    expect(result).toBe(mockHelp);
  });

  it('should return default help message if no match is found', async () => {
    const uri = '/dailytimetable/editTTelement/69c440e1c4230306467d6026';
    Helpmessage.findOne.mockResolvedValueOnce(null);

    const result = await getHelpMessagebyUri(uri);
    expect(result).toMatchObject({
      style: 'primary',
      url: uri
    });
    expect(result.HelpMessage).toBeDefined();
  });

  it('should handle root path with ObjectId', async () => {
    const uri = '/69c440e1c4230306467d6026';
    const patternUri = '/:id';
    const mockHelp = { url: patternUri, active: true, HelpMessage: 'Root', style: 'info' };
    Helpmessage.findOne.mockResolvedValueOnce(mockHelp);

    const result = await getHelpMessagebyUri(uri);
    expect(Helpmessage.findOne).toHaveBeenCalledWith({ url: patternUri, active: true });
    expect(result).toBe(mockHelp);
  });
});

describe('helpMessageData CRUD', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAllHelpMessages returns sorted list', async () => {
    const mockList = [
      { description: 'b' },
      { description: 'a' },
      { description: 'c' }
    ];
    Helpmessage.find.mockReturnValueOnce({ sort: jest.fn().mockResolvedValueOnce(mockList) });
    const result = await helpMessageData.getAllHelpMessages();
    expect(result).toBe(mockList);
    expect(Helpmessage.find).toHaveBeenCalled();
  });

  it('getHelpMessageById returns doc if found', async () => {
    const doc = { _id: '1' };
    Helpmessage.findById.mockResolvedValueOnce(doc);
    const result = await helpMessageData.getHelpMessageById('1');
    expect(result).toBe(doc);
  });

  it('getHelpMessageById throws if not found', async () => {
    Helpmessage.findById.mockResolvedValueOnce(null);
    await expect(helpMessageData.getHelpMessageById('x')).rejects.toThrow('Help message not found');
  });

  it('createHelpMessage saves and logs', async () => {
    const save = jest.fn().mockResolvedValue();
    const doc = { save, _id: '1' };
    Helpmessage.mockImplementationOnce(() => doc);
    const result = await helpMessageData.createHelpMessage({ foo: 'bar' });
    expect(save).toHaveBeenCalled();
    expect(result).toBe(doc);
  });

  it('updateHelpMessage updates and logs', async () => {
    const doc = { _id: '1' };
    Helpmessage.findByIdAndUpdate.mockResolvedValueOnce(doc);
    const result = await helpMessageData.updateHelpMessage('1', { foo: 'bar' });
    expect(result).toBe(doc);
  });

  it('updateHelpMessage throws if not found', async () => {
    Helpmessage.findByIdAndUpdate.mockResolvedValueOnce(null);
    await expect(helpMessageData.updateHelpMessage('x', {})).rejects.toThrow('Help message not found');
  });

  it('deleteHelpMessage deletes and logs', async () => {
    const doc = { _id: '1' };
    Helpmessage.findByIdAndDelete.mockResolvedValueOnce(doc);
    const result = await helpMessageData.deleteHelpMessage('1');
    expect(result).toBe(doc);
  });

  it('deleteHelpMessage throws if not found', async () => {
    Helpmessage.findByIdAndDelete.mockResolvedValueOnce(null);
    await expect(helpMessageData.deleteHelpMessage('x')).rejects.toThrow('Help message not found');
  });
});

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import connectDB from '../../database/db.js';
import { logDb, logError } from '../../logger.js';

const mockOn = jest.fn();

jest.mock('mongoose', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
}));

jest.mock('../../logger.js', () => ({
  logger: {},
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDb: jest.fn(),
  logWarn: jest.fn(),
}));

jest.mock('../../config/env.js', () => ({
  MONGODB_URI: 'mongodb://localhost:27017/testdb',
}));

describe('database/db connectDB', () => {
  let processExitSpy;
  let processOnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
    processOnSpy = jest.spyOn(process, 'on').mockImplementation(mockOn);
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    processOnSpy.mockRestore();
  });

  test('connects to MongoDB and registers SIGINT cleanup handler', async () => {
    mongoose.connect.mockResolvedValue(undefined);
    mongoose.disconnect.mockResolvedValue(undefined);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb');
    expect(logDb).toHaveBeenCalledWith('CONNECT', 'Successfully connected to MongoDB', '');
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));

    const sigIntHandler = process.on.mock.calls.find(([signal]) => signal === 'SIGINT')[1];
    await sigIntHandler();

    expect(mongoose.disconnect).toHaveBeenCalledTimes(1);
    expect(logDb).toHaveBeenCalledWith('DISCONNECT', 'Connection to MongoDB closed.', '');
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  test('logs and exits when initial connection fails', async () => {
    mongoose.connect.mockRejectedValue(new Error('connect failed'));

    await connectDB();

    expect(logError).toHaveBeenCalledWith('DB_CONNECTION', 'Connection error', 'Error: connect failed');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

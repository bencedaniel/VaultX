import {
  getAdminDashboardData,
  getAllUsers,
  getAllPermissions
} from '../../DataServices/adminDashboardData.js';
import DashCards from '../../models/DashCards.js';
import User from '../../models/User.js';
import Permissions from '../../models/Permissions.js';
import Role from '../../models/Role.js';

jest.mock('../../models/DashCards.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.mock('../../models/Role.js', () => ({
  __esModule: true,
  default: {
    countDocuments: jest.fn()
  }
}));

describe('adminDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminDashboardData', () => {
    test('returns cards and statistics for admin dashboard', async () => {
      const cards = [{ _id: 'c1', dashtype: 'admin', priority: 1 }];
      const sortMock = jest.fn().mockResolvedValue(cards);

      DashCards.find.mockReturnValue({ sort: sortMock });
      User.countDocuments.mockResolvedValue(12);
      Permissions.countDocuments.mockResolvedValue(34);
      Role.countDocuments.mockResolvedValue(5);

      const result = await getAdminDashboardData();

      expect(DashCards.find).toHaveBeenCalledWith({ dashtype: 'admin' });
      expect(sortMock).toHaveBeenCalledWith({ priority: 1 });
      expect(User.countDocuments).toHaveBeenCalledTimes(1);
      expect(Permissions.countDocuments).toHaveBeenCalledTimes(1);
      expect(Role.countDocuments).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        cards,
        userCount: 12,
        permissionCount: 34,
        roleCount: 5
      });
    });

    test('propagates errors from data loading', async () => {
      const sortMock = jest.fn().mockRejectedValue(new Error('cards failed'));
      DashCards.find.mockReturnValue({ sort: sortMock });
      User.countDocuments.mockResolvedValue(1);
      Permissions.countDocuments.mockResolvedValue(1);
      Role.countDocuments.mockResolvedValue(1);

      await expect(getAdminDashboardData()).rejects.toThrow('cards failed');
    });
  });

  describe('getAllUsers', () => {
    test('returns all users', async () => {
      const users = [{ _id: 'u1', username: 'admin' }];
      User.find.mockResolvedValue(users);

      const result = await getAllUsers();

      expect(User.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(users);
    });

    test('propagates user query errors', async () => {
      User.find.mockRejectedValue(new Error('users failed'));

      await expect(getAllUsers()).rejects.toThrow('users failed');
    });
  });

  describe('getAllPermissions', () => {
    test('returns all permissions', async () => {
      const permissions = [{ _id: 'p1', name: 'users.read' }];
      Permissions.find.mockResolvedValue(permissions);

      const result = await getAllPermissions();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(permissions);
    });

    test('propagates permissions query errors', async () => {
      Permissions.find.mockRejectedValue(new Error('permissions failed'));

      await expect(getAllPermissions()).rejects.toThrow('permissions failed');
    });
  });
});

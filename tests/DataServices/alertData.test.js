import {
  getAllAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertFormData
} from '../../DataServices/alertData.js';
import Alert from '../../models/Alert.js';
import Permissions from '../../models/Permissions.js';
import { logDb } from '../../logger.js';

jest.mock('../../models/Alert.js', () => {
  const AlertMock = jest.fn();
  AlertMock.find = jest.fn();
  AlertMock.findById = jest.fn();
  AlertMock.findByIdAndUpdate = jest.fn();
  AlertMock.findByIdAndDelete = jest.fn();

  return {
    __esModule: true,
    default: AlertMock
  };
});

jest.mock('../../models/Permissions.js', () => ({
  __esModule: true,
  default: {
    find: jest.fn()
  }
}));

jest.mock('../../logger.js', () => ({
  logDb: jest.fn(),
  logger: {
    debug: jest.fn()
  }
}));

describe('alertData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlerts', () => {
    test('returns alerts sorted by name and populated with permission', async () => {
      const alerts = [{ _id: 'a1', title: 'Low score warning' }];
      const populateMock = jest.fn().mockResolvedValue(alerts);
      const sortMock = jest.fn().mockReturnValue({ populate: populateMock });

      Alert.find.mockReturnValue({ sort: sortMock });

      const result = await getAllAlerts();

      expect(Alert.find).toHaveBeenCalledTimes(1);
      expect(sortMock).toHaveBeenCalledWith({ name: 1 });
      expect(populateMock).toHaveBeenCalledWith('permission');
      expect(result).toEqual(alerts);
    });

    test('propagates query chain errors', async () => {
      const populateMock = jest.fn().mockRejectedValue(new Error('query failed'));
      const sortMock = jest.fn().mockReturnValue({ populate: populateMock });
      Alert.find.mockReturnValue({ sort: sortMock });

      await expect(getAllAlerts()).rejects.toThrow('query failed');
    });
  });

  describe('getAlertById', () => {
    test('returns alert by id when it exists', async () => {
      const alert = { _id: 'a1', title: 'Alert A' };
      Alert.findById.mockResolvedValue(alert);

      const result = await getAlertById('a1');

      expect(Alert.findById).toHaveBeenCalledWith('a1');
      expect(result).toEqual(alert);
    });

    test('throws when alert is not found', async () => {
      Alert.findById.mockResolvedValue(null);

      await expect(getAlertById('missing')).rejects.toThrow('Alert not found');
    });
  });

  describe('createAlert', () => {
    test('creates, saves, and logs new alert', async () => {
      const input = {
        title: 'New Alert',
        message: 'Something happened',
        permission: 'perm1'
      };
      const created = {
        ...input,
        save: jest.fn().mockResolvedValue(undefined)
      };
      Alert.mockImplementation(() => created);

      const result = await createAlert(input);

      expect(Alert).toHaveBeenCalledWith(input);
      expect(created.save).toHaveBeenCalledTimes(1);
      expect(logDb).toHaveBeenCalledWith('CREATE', 'Alert', 'New Alert');
      expect(result).toBe(created);
    });

    test('propagates save errors and does not log create', async () => {
      const input = {
        title: 'Broken Alert',
        message: 'broken',
        permission: 'perm1'
      };
      const created = {
        ...input,
        save: jest.fn().mockRejectedValue(new Error('save failed'))
      };
      Alert.mockImplementation(() => created);

      await expect(createAlert(input)).rejects.toThrow('save failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('updateAlert', () => {
    test('updates and logs alert when found', async () => {
      const updatedAlert = { _id: 'a1', title: 'Updated Alert' };
      const payload = { title: 'Updated Alert' };
      Alert.findByIdAndUpdate.mockResolvedValue(updatedAlert);

      const result = await updateAlert('a1', payload);

      expect(Alert.findByIdAndUpdate).toHaveBeenCalledWith(
        'a1',
        payload,
        { runValidators: true }
      );
      expect(logDb).toHaveBeenCalledWith('UPDATE', 'Alert', 'Updated Alert');
      expect(result).toEqual(updatedAlert);
    });

    test('throws when updating non-existing alert', async () => {
      Alert.findByIdAndUpdate.mockResolvedValue(null);

      await expect(updateAlert('missing', { title: 'X' })).rejects.toThrow('Alert not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates update errors', async () => {
      Alert.findByIdAndUpdate.mockRejectedValue(new Error('update failed'));

      await expect(updateAlert('a1', { title: 'X' })).rejects.toThrow('update failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('deleteAlert', () => {
    test('deletes and logs alert when found', async () => {
      const deletedAlert = { _id: 'a1', title: 'Delete Me' };
      Alert.findByIdAndDelete.mockResolvedValue(deletedAlert);

      const result = await deleteAlert('a1');

      expect(Alert.findByIdAndDelete).toHaveBeenCalledWith('a1');
      expect(logDb).toHaveBeenCalledWith('DELETE', 'Alert', 'Delete Me');
      expect(result).toEqual(deletedAlert);
    });

    test('throws when deleting non-existing alert', async () => {
      Alert.findByIdAndDelete.mockResolvedValue(null);

      await expect(deleteAlert('missing')).rejects.toThrow('Alert not found');
      expect(logDb).not.toHaveBeenCalled();
    });

    test('propagates delete errors', async () => {
      Alert.findByIdAndDelete.mockRejectedValue(new Error('delete failed'));

      await expect(deleteAlert('a1')).rejects.toThrow('delete failed');
      expect(logDb).not.toHaveBeenCalled();
    });
  });

  describe('getAlertFormData', () => {
    test('returns permission list', async () => {
      const permissionList = [{ _id: 'p1', name: 'alert.read' }];
      Permissions.find.mockResolvedValue(permissionList);

      const result = await getAlertFormData();

      expect(Permissions.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ permissionList });
    });

    test('propagates permission query errors', async () => {
      Permissions.find.mockRejectedValue(new Error('permissions failed'));

      await expect(getAlertFormData()).rejects.toThrow('permissions failed');
    });
  });
});

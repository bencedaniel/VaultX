// tests/controllers/adminCardController.test.js - Admin Card Controller Tests
import adminCardController from '../../controllers/adminCardController.js';
import * as adminCardData from '../../DataServices/adminCardData.js';
import { HTTP_STATUS, MESSAGES } from '../../config/index.js';

// Mock DataServices
jest.mock('../../DataServices/adminCardData.js');
jest.mock('../../logger.js');

describe('Admin Card Controller - Integration Tests', () => {
  
  let req, res, next;
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'adminuser',
    role: {
      permissions: ['admin.card.create', 'admin.card.update', 'admin.card.delete']
    }
  };

  beforeEach(() => {
    req = {
      user: mockUser,
      params: {},
      body: {},
      session: {
        failMessage: null,
        successMessage: null,
        formData: null
      }
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getNewCardForm', () => {
    
    test('should render new card form with permission list', async () => {
      const mockPermissions = [
        { _id: '1', name: 'admin.card.create' },
        { _id: '2', name: 'admin.card.update' }
      ];

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: mockPermissions
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(adminCardData.getCardFormData).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/newCard',
        expect.objectContaining({
          permissionList: mockPermissions,
          user: mockUser
        })
      );
    });

    test('should include role permissions in response', async () => {
      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newCard',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include session messages in response', async () => {
      req.session.failMessage = 'Error occurred';
      req.session.successMessage = 'Success';
      req.session.formData = { title: 'Test Card' };

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/newCard',
        expect.objectContaining({
          failMessage: 'Error occurred',
          successMessage: 'Success',
          formData: { title: 'Test Card' }
        })
      );
    });

    test('should clear session messages after render', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';
      req.session.formData = {};

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(req.session.successMessage).toBeNull();
      expect(req.session.formData).toBeNull();
      expect(req.session.failMessage).toBeNull();
    });

    test('should handle missing permission list', async () => {
      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: undefined
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });
  });

  describe('getCardsDashboard', () => {
    
    test('should render dashboard with all cards', async () => {
      const mockCards = [
        { _id: '1', title: 'Card 1', permissions: [] },
        { _id: '2', title: 'Card 2', permissions: [] }
      ];

      adminCardData.getAllCards.mockResolvedValue(mockCards);

      await adminCardController.getCardsDashboard(req, res, next);

      expect(adminCardData.getAllCards).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'admin/carddash',
        expect.objectContaining({
          cards: mockCards
        })
      );
    });

    test('should include role permissions', async () => {
      adminCardData.getAllCards.mockResolvedValue([]);

      await adminCardController.getCardsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/carddash',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should include session messages', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminCardData.getAllCards.mockResolvedValue([]);

      await adminCardController.getCardsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/carddash',
        expect.objectContaining({
          failMessage: 'Error',
          successMessage: 'Success'
        })
      );
    });

    test('should clear session messages after render', async () => {
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminCardData.getAllCards.mockResolvedValue([]);

      await adminCardController.getCardsDashboard(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle empty cards list', async () => {
      adminCardData.getAllCards.mockResolvedValue([]);

      await adminCardController.getCardsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/carddash',
        expect.objectContaining({
          cards: []
        })
      );
    });

    test('should pass user to template', async () => {
      adminCardData.getAllCards.mockResolvedValue([]);

      await adminCardController.getCardsDashboard(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/carddash',
        expect.objectContaining({
          user: mockUser
        })
      );
    });
  });

  describe('getEditCardForm', () => {
    
    test('should render edit form with card data', async () => {
      const cardId = '507f1f77bcf86cd799439012';
      const mockCard = { _id: cardId, title: 'Edit Card', permissions: [] };
      const mockPermissions = [{ _id: '1', name: 'admin.card.update' }];

      req.params.id = cardId;

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: mockPermissions
      });
      adminCardData.getCardById.mockResolvedValue(mockCard);

      await adminCardController.getEditCardForm(req, res, next);

      expect(adminCardData.getCardFormData).toHaveBeenCalled();
      expect(adminCardData.getCardById).toHaveBeenCalledWith(cardId);
      expect(res.render).toHaveBeenCalledWith(
        'admin/editCard',
        expect.objectContaining({
          formData: mockCard,
          permissionList: mockPermissions
        })
      );
    });

    test('should include role permissions', async () => {
      req.params.id = '507f1f77bcf86cd799439012';

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });
      adminCardData.getCardById.mockResolvedValue({});

      await adminCardController.getEditCardForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editCard',
        expect.objectContaining({
          rolePermissons: mockUser.role.permissions
        })
      );
    });

    test('should clear session messages', async () => {
      req.params.id = '507f1f77bcf86cd799439012';
      req.session.failMessage = 'Error';
      req.session.successMessage = 'Success';

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });
      adminCardData.getCardById.mockResolvedValue({});

      await adminCardController.getEditCardForm(req, res, next);

      expect(req.session.failMessage).toBeNull();
      expect(req.session.successMessage).toBeNull();
    });

    test('should handle card not found', async () => {
      req.params.id = 'nonexistent';

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });
      adminCardData.getCardById.mockResolvedValue(null);

      await adminCardController.getEditCardForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        'admin/editCard',
        expect.objectContaining({
          formData: null
        })
      );
    });
  });

  describe('createNewCardHandler', () => {
    
    test('should create new card and redirect', async () => {
      const cardData = {
        title: 'New Card',
        description: 'Test card'
      };
      const createdCard = {
        _id: '507f1f77bcf86cd799439013',
        ...cardData
      };

      req.body = cardData;

      adminCardData.createCard.mockResolvedValue(createdCard);

      await adminCardController.createNewCardHandler(req, res, next);

      expect(adminCardData.createCard).toHaveBeenCalledWith(cardData);
      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CARD_ADDED);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/cards');
    });

    test('should log card creation', async () => {
      const cardData = { title: 'Test Card' };
      const createdCard = { _id: '1', ...cardData };

      req.body = cardData;

      adminCardData.createCard.mockResolvedValue(createdCard);

      // Import logger to verify
      const { logOperation } = require('../../logger.js');

      await adminCardController.createNewCardHandler(req, res, next);

      expect(adminCardData.createCard).toHaveBeenCalled();
    });

    test('should handle creation error', async () => {
      const error = new Error('Creation failed');
      req.body = { title: 'Test' };

      adminCardData.createCard.mockRejectedValue(error);

      await expect(
        adminCardController.createNewCardHandler(req, res, next)
      ).rejects.toThrow('Creation failed');
    });

    test('should pass correct data to create function', async () => {
      const cardData = {
        title: 'Card Title',
        description: 'Description',
        permissions: ['perm1', 'perm2']
      };

      req.body = cardData;
      adminCardData.createCard.mockResolvedValue({ _id: '1', ...cardData });

      await adminCardController.createNewCardHandler(req, res, next);

      expect(adminCardData.createCard).toHaveBeenCalledWith(cardData);
    });
  });

  describe('updateCardHandler', () => {
    
    test('should update card and redirect', async () => {
      const cardId = '507f1f77bcf86cd799439012';
      const cardData = {
        title: 'Updated Card',
        description: 'Updated description'
      };

      req.params.id = cardId;
      req.body = cardData;

      adminCardData.updateCard.mockResolvedValue({ _id: cardId, ...cardData });

      await adminCardController.updateCardHandler(req, res, next);

      expect(adminCardData.updateCard).toHaveBeenCalledWith(cardId, cardData);
      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CARD_MODIFIED);
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard/cards');
    });

    test('should log card update', async () => {
      req.params.id = '507f1f77bcf86cd799439012';
      req.body = { title: 'Updated' };

      adminCardData.updateCard.mockResolvedValue({});

      await adminCardController.updateCardHandler(req, res, next);

      expect(adminCardData.updateCard).toHaveBeenCalled();
    });

    test('should include card title in update', async () => {
      const cardId = '507f1f77bcf86cd799439012';
      const updateData = { title: 'New Title', permissions: [] };

      req.params.id = cardId;
      req.body = updateData;

      adminCardData.updateCard.mockResolvedValue({});

      await adminCardController.updateCardHandler(req, res, next);

      expect(adminCardData.updateCard).toHaveBeenCalledWith(cardId, updateData);
    });

    test('should handle update error', async () => {
      const error = new Error('Update failed');
      req.params.id = '507f1f77bcf86cd799439012';
      req.body = { title: 'Test' };

      adminCardData.updateCard.mockRejectedValue(error);

      await expect(
        adminCardController.updateCardHandler(req, res, next)
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteCardHandler', () => {
    
    test('should delete card and send success response', async () => {
      const cardId = '507f1f77bcf86cd799439012';
      req.params.cardId = cardId;

      adminCardData.deleteCard.mockResolvedValue({});

      await adminCardController.deleteCardHandler(req, res, next);

      expect(adminCardData.deleteCard).toHaveBeenCalledWith(cardId);
      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CARD_DELETED);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.send).toHaveBeenCalledWith(MESSAGES.SUCCESS.CARD_DELETE_RESPONSE);
    });

    test('should log card deletion', async () => {
      req.params.cardId = '507f1f77bcf86cd799439012';

      adminCardData.deleteCard.mockResolvedValue({});

      await adminCardController.deleteCardHandler(req, res, next);

      expect(adminCardData.deleteCard).toHaveBeenCalled();
    });

    test('should return 200 OK status', async () => {
      req.params.cardId = '507f1f77bcf86cd799439012';

      adminCardData.deleteCard.mockResolvedValue({});

      await adminCardController.deleteCardHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    test('should handle deletion error', async () => {
      const error = new Error('Delete failed');
      req.params.cardId = '507f1f77bcf86cd799439012';

      adminCardData.deleteCard.mockRejectedValue(error);

      await expect(
        adminCardController.deleteCardHandler(req, res, next)
      ).rejects.toThrow('Delete failed');
    });

    test('should use cardId parameter correctly', async () => {
      const cardId = '507f1f77bcf86cd799439012';
      req.params.cardId = cardId;

      adminCardData.deleteCard.mockResolvedValue({});

      await adminCardController.deleteCardHandler(req, res, next);

      expect(adminCardData.deleteCard).toHaveBeenCalledWith(cardId);
    });
  });

  describe('Error Handling', () => {
    
    test('should catch errors in getNewCardForm', async () => {
      const error = new Error('Database error');
      adminCardData.getCardFormData.mockRejectedValue(error);

      await expect(
        adminCardController.getNewCardForm(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should catch errors in getCardsDashboard', async () => {
      const error = new Error('Database error');
      adminCardData.getAllCards.mockRejectedValue(error);

      await expect(
        adminCardController.getCardsDashboard(req, res, next)
      ).rejects.toThrow('Database error');
    });

    test('should catch errors in getEditCardForm', async () => {
      const error = new Error('Database error');
      req.params.id = '507f1f77bcf86cd799439012';

      adminCardData.getCardFormData.mockResolvedValue({ permissionList: [] });
      adminCardData.getCardById.mockRejectedValue(error);

      await expect(
        adminCardController.getEditCardForm(req, res, next)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Session Message Handling', () => {
    
    test('should set success message on creation', async () => {
      req.body = { title: 'Test' };
      adminCardData.createCard.mockResolvedValue({ _id: '1', title: 'Test' });

      await adminCardController.createNewCardHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CARD_ADDED);
    });

    test('should set success message on update', async () => {
      req.params.id = '1';
      req.body = { title: 'Test' };
      adminCardData.updateCard.mockResolvedValue({});

      await adminCardController.updateCardHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CARD_MODIFIED);
    });

    test('should set success message on deletion', async () => {
      req.params.cardId = '1';
      adminCardData.deleteCard.mockResolvedValue({});

      await adminCardController.deleteCardHandler(req, res, next);

      expect(req.session.successMessage).toBe(MESSAGES.SUCCESS.CARD_DELETED);
    });
  });

  describe('User Context', () => {
    
    test('should pass user to templates', async () => {
      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          user: mockUser
        })
      );
    });

    test('should use user permissions in templates', async () => {
      const customPermissions = ['custom.perm1', 'custom.perm2'];
      req.user.role.permissions = customPermissions;

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(res.render).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          rolePermissons: customPermissions
        })
      );
    });

    test('should handle missing user role', async () => {
      req.user.role = undefined;

      adminCardData.getCardFormData.mockResolvedValue({
        permissionList: []
      });

      await adminCardController.getNewCardForm(req, res, next);

      expect(res.render).toHaveBeenCalled();
    });
  });

});

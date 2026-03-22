import DashCards from '../../models/DashCards.js';

describe('DashCards Model - Unit Tests', () => {
  const validCardData = {
    dashtype: 'admin',
    priority: 1,
    style: 'primary',
    perm: 'VIEW_DASHBOARD',
    title: 'Admin Dashboard',
    text: 'Open admin tools',
    label: ['Users', 'Roles'],
    href: ['/admin/users', '/admin/roles']
  };

  describe('DashCards Schema Validation', () => {
    test('creates a valid dashboard card with required fields', () => {
      const doc = new DashCards(validCardData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.dashtype).toBe('admin');
      expect(doc.priority).toBe(1);
      expect(doc.style).toBe('primary');
      expect(doc.perm).toBe('VIEW_DASHBOARD');
      expect(doc.title).toBe('Admin Dashboard');
    });

    test('fails validation when dashtype is missing', () => {
      const { dashtype, ...payload } = validCardData;
      const doc = new DashCards(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.dashtype).toBeDefined();
      expect(validationError.errors.dashtype.message).toBe('Dashboard type is required');
    });

    test('fails validation when dashtype is outside enum', () => {
      const doc = new DashCards({ ...validCardData, dashtype: 'guest' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.dashtype).toBeDefined();
      expect(validationError.errors.dashtype.kind).toBe('enum');
    });

    test('fails validation when style is missing', () => {
      const { style, ...payload } = validCardData;
      const doc = new DashCards(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.style).toBeDefined();
      expect(validationError.errors.style.message).toBe('Style is required');
    });

    test('fails validation when perm is missing', () => {
      const { perm, ...payload } = validCardData;
      const doc = new DashCards(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.perm).toBeDefined();
      expect(validationError.errors.perm.message).toBe('Permission is required');
    });

    test('fails validation when title is missing', () => {
      const { title, ...payload } = validCardData;
      const doc = new DashCards(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
      expect(validationError.errors.title.message).toBe('Title is required');
    });
  });

  describe('DashCards Schema Defaults and Properties', () => {
    test('applies default values when optional fields are omitted', () => {
      const doc = new DashCards({
        dashtype: 'user',
        style: 'info',
        perm: 'VIEW_PROFILE',
        title: 'Profile'
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.priority).toBe(99);
      expect(doc.text).toBe('');
      expect(doc.label).toEqual(['']);
      expect(doc.href).toEqual(['']);
    });

    test('schema has timestamps enabled', () => {
      expect(DashCards.schema.options.timestamps).toBe(true);
      expect(DashCards.schema.paths.createdAt).toBeDefined();
      expect(DashCards.schema.paths.updatedAt).toBeDefined();
    });

    test('model is registered with dashboarcards name', () => {
      expect(DashCards.modelName).toBe('dashboarcards');
    });
  });
});

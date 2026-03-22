import Category from '../../models/Category.js';

describe('Category Model - Unit Tests', () => {
  const validCategoryData = {
    CategoryDispName: 'Senior Individual Male',
    Type: 'Individual',
    Sex: 'Male',
    ReqComp: true,
    ReqFreeTest: true,
    ReqTechnicalTest: false,
    Agegroup: 'Senior',
    Star: 2,
    Horse: {
      A1: 0.5,
      A2: 0.6,
      A3: 0.7
    },
    Free: {
      R: 3,
      D: 3,
      M: 3,
      E: 3,
      NumberOfMaxExercises: 5
    },
    Artistic: {
      CH: 0.4,
      C1: 0.5,
      C2: 0.6,
      C3: 0.7,
      C4: 0.8
    },
    TechArtistic: {
      CH: 0.4,
      T1: 0.5,
      T2: 0.6,
      T3: 0.7,
      TechDivider: 4
    }
  };

  describe('Category Schema Validation', () => {
    test('creates a valid category with all required fields', () => {
      const doc = new Category(validCategoryData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.CategoryDispName).toBe('Senior Individual Male');
      expect(doc.Type).toBe('Individual');
      expect(doc.Agegroup).toBe('Senior');
      expect(doc.Star).toBe(2);
    });

    test('fails validation when CategoryDispName is missing', () => {
      const { CategoryDispName, ...payload } = validCategoryData;
      const doc = new Category(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.CategoryDispName).toBeDefined();
      expect(validationError.errors.CategoryDispName.message).toBe('Category name required!');
    });

    test('fails validation when Type is outside enum', () => {
      const doc = new Category({ ...validCategoryData, Type: 'Pair' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Type).toBeDefined();
      expect(validationError.errors.Type.kind).toBe('enum');
    });

    test('fails validation when Agegroup is outside enum', () => {
      const doc = new Category({ ...validCategoryData, Agegroup: 'Adult' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Agegroup).toBeDefined();
      expect(validationError.errors.Agegroup.kind).toBe('enum');
    });

    test('fails validation when Star is below min', () => {
      const doc = new Category({ ...validCategoryData, Star: 0 });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Star).toBeDefined();
      expect(validationError.errors.Star.kind).toBe('min');
    });

    test('fails validation when Star is above max', () => {
      const doc = new Category({ ...validCategoryData, Star: 5 });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.Star).toBeDefined();
      expect(validationError.errors.Star.kind).toBe('max');
    });

    test('fails validation when Horse nested value is out of range', () => {
      const doc = new Category({
        ...validCategoryData,
        Horse: { ...validCategoryData.Horse, A1: 1.1 }
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['Horse.A1']).toBeDefined();
      expect(validationError.errors['Horse.A1'].kind).toBe('max');
    });

    test('fails validation when Free.NumberOfMaxExercises is below min', () => {
      const doc = new Category({
        ...validCategoryData,
        Free: { ...validCategoryData.Free, NumberOfMaxExercises: 0 }
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['Free.NumberOfMaxExercises']).toBeDefined();
      expect(validationError.errors['Free.NumberOfMaxExercises'].kind).toBe('min');
    });

    test('fails validation when TechArtistic.TechDivider exceeds max', () => {
      const doc = new Category({
        ...validCategoryData,
        TechArtistic: { ...validCategoryData.TechArtistic, TechDivider: 11 }
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['TechArtistic.TechDivider']).toBeDefined();
      expect(validationError.errors['TechArtistic.TechDivider'].kind).toBe('max');
    });
  });

  describe('Category Schema Properties', () => {
    test('has default boolean flags set to false', () => {
      expect(Category.schema.paths.ReqComp.defaultValue).toBe(false);
      expect(Category.schema.paths.ReqFreeTest.defaultValue).toBe(false);
      expect(Category.schema.paths.ReqTechnicalTest.defaultValue).toBe(false);
    });

    test('has timestamps enabled and model registered as categorys', () => {
      expect(Category.schema.options.timestamps).toBe(true);
      expect(Category.schema.paths.createdAt).toBeDefined();
      expect(Category.schema.paths.updatedAt).toBeDefined();
      expect(Category.modelName).toBe('categorys');
    });
  });
});

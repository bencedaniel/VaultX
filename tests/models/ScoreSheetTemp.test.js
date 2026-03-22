import mongoose from 'mongoose';
import ScoreSheetTemp from '../../models/ScoreSheetTemp.js';

describe('ScoreSheetTemp Model - Unit Tests', () => {
  const categoryId = new mongoose.Types.ObjectId();

  const validData = {
    TestType: ['compulsory', 'free test'],
    CategoryId: [categoryId],
    numberOfJudges: 5,
    typeOfScores: 'horse',
    outputFieldList: [
      {
        name: 'Total FE',
        contentid: 'total_fe',
        position: { x: 10, y: 20, w: 200 }
      }
    ],
    inputFieldList: [
      {
        name: 'Judge Input',
        id: 'judge_input_1',
        preDefValue: '0.0',
        position: { x: 5, y: 15, w: 180 }
      }
    ],
    bgImage: '/static/img/template.png'
  };

  describe('ScoreSheetTemp Schema Validation', () => {
    test('creates valid template with required fields', () => {
      const doc = new ScoreSheetTemp(validData);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.TestType).toEqual(['compulsory', 'free test']);
      expect(doc.CategoryId).toHaveLength(1);
      expect(doc.numberOfJudges).toBe(5);
      expect(doc.typeOfScores).toBe('horse');
      expect(doc.bgImage).toBe('/static/img/template.png');
    });

    test('when CategoryId is omitted, mongoose initializes it as empty array', () => {
      const { CategoryId, ...payload } = validData;
      const doc = new ScoreSheetTemp(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.CategoryId).toEqual([]);
    });

    test('fails validation when typeOfScores is missing', () => {
      const { typeOfScores, ...payload } = validData;
      const doc = new ScoreSheetTemp(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.typeOfScores).toBeDefined();
      expect(validationError.errors.typeOfScores.message).toBe('Type of scores required!');
    });

    test('fails validation when bgImage is missing', () => {
      const { bgImage, ...payload } = validData;
      const doc = new ScoreSheetTemp(payload);
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.bgImage).toBeDefined();
      expect(validationError.errors.bgImage.message).toBe('Background image required!');
    });

    test('fails validation when TestType contains invalid enum value', () => {
      const doc = new ScoreSheetTemp({ ...validData, TestType: ['invalid-test-type'] });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['TestType.0']).toBeDefined();
      expect(validationError.errors['TestType.0'].kind).toBe('enum');
    });

    test('fails validation when typeOfScores is outside enum', () => {
      const doc = new ScoreSheetTemp({ ...validData, typeOfScores: 'music' });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors.typeOfScores).toBeDefined();
      expect(validationError.errors.typeOfScores.kind).toBe('enum');
    });

    test('fails validation when outputFieldList item misses required fields', () => {
      const doc = new ScoreSheetTemp({
        ...validData,
        outputFieldList: [{ name: 'Only name' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['outputFieldList.0.contentid']).toBeDefined();
    });

    test('fails validation when inputFieldList item misses required fields', () => {
      const doc = new ScoreSheetTemp({
        ...validData,
        inputFieldList: [{ name: 'Only name' }]
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError.errors['inputFieldList.0.id']).toBeDefined();
    });
  });

  describe('ScoreSheetTemp Schema Defaults and Properties', () => {
    test('applies default numberOfJudges when omitted', () => {
      const doc = new ScoreSheetTemp({
        TestType: ['technical test'],
        CategoryId: [categoryId],
        typeOfScores: 'technical',
        bgImage: '/img/bg.png'
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.numberOfJudges).toBe(4);
    });

    test('applies default arrays and nested position values', () => {
      const doc = new ScoreSheetTemp({
        TestType: ['compulsory'],
        CategoryId: [categoryId],
        typeOfScores: 'compulsory',
        outputFieldList: [{ name: 'Out', contentid: 'out1' }],
        inputFieldList: [{ name: 'In', id: 'in1' }],
        bgImage: '/img/bg.png'
      });
      const validationError = doc.validateSync();

      expect(validationError).toBeUndefined();
      expect(doc.outputFieldList[0].position.x).toBe(0);
      expect(doc.outputFieldList[0].position.y).toBe(0);
      expect(doc.outputFieldList[0].position.w).toBe(100);
      expect(doc.inputFieldList[0].position.x).toBe(0);
      expect(doc.inputFieldList[0].position.y).toBe(0);
      expect(doc.inputFieldList[0].position.w).toBe(100);
      expect(doc.inputFieldList[0].preDefValue).toBe('');
    });

    test('CategoryId references categorys model', () => {
      expect(ScoreSheetTemp.schema.paths.CategoryId.options.ref).toBe('categorys');
    });

    test('schema has timestamps enabled and model name is scoresheets_temp', () => {
      expect(ScoreSheetTemp.schema.options.timestamps).toBe(true);
      expect(ScoreSheetTemp.schema.paths.createdAt).toBeDefined();
      expect(ScoreSheetTemp.schema.paths.updatedAt).toBeDefined();
      expect(ScoreSheetTemp.modelName).toBe('scoresheets_temp');
    });
  });
});

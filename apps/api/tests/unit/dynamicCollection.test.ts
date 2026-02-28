import mongoose from 'mongoose';
import { generateCollectionName, createDynamicModel } from '../../src/utils/dynamicCollection';
import { FieldType } from '@formai/shared';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('dynamicCollection', () => {
  describe('generateCollectionName', () => {
    it('should generate a collection name with the form ID', () => {
      const name = generateCollectionName('abc123');
      expect(name).toBe('form_abc123_submissions');
    });
  });

  describe('createDynamicModel', () => {
    afterEach(() => {
      // Clean up registered models
      const modelNames = Object.keys(mongoose.models);
      for (const name of modelNames) {
        if (name.startsWith('form_')) {
          delete mongoose.models[name];
        }
      }
    });

    it('should create a mongoose model with the correct collection name', () => {
      const fields = [
        {
          id: '1',
          type: FieldType.TEXT,
          label: 'Nom',
          name: 'nom',
          required: true,
        },
        {
          id: '2',
          type: FieldType.EMAIL,
          label: 'Email',
          name: 'email',
          required: true,
        },
      ];

      const model = createDynamicModel('test123', fields);

      expect(model.modelName).toBe('form_test123_submissions');
      expect(model.collection.collectionName).toBe('form_test123_submissions');
    });

    it('should replace an existing model with the same name', () => {
      const fields = [
        { id: '1', type: FieldType.TEXT, label: 'Nom', name: 'nom', required: true },
      ];

      const model1 = createDynamicModel('test456', fields);
      const model2 = createDynamicModel('test456', fields);

      // Should not throw and should return a valid model
      expect(model2.modelName).toBe('form_test456_submissions');
    });
  });
});

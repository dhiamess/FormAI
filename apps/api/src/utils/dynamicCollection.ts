import mongoose from 'mongoose';
import { FormField, FieldType } from '@formai/shared';
import { logger } from './logger';

/**
 * Génère un nom de collection unique pour un formulaire
 */
export function generateCollectionName(formId: string): string {
  return `form_${formId}_submissions`;
}

/**
 * Crée ou met à jour un modèle Mongoose dynamique pour un formulaire
 */
export function createDynamicModel(formId: string, fields: FormField[]) {
  const collectionName = generateCollectionName(formId);

  // Supprimer le modèle existant s'il existe (pour les mises à jour)
  if (mongoose.models[collectionName]) {
    delete mongoose.models[collectionName];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemaDefinition: any = {
    formId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    formVersion: { type: Number, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    metadata: {
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      submittedAt: { type: Date, default: Date.now },
      ip: String,
      userAgent: String,
      completionTime: Number,
      source: { type: String, enum: ['web', 'api', 'mobile'], default: 'web' },
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'approved', 'rejected'],
      default: 'submitted',
    },
    files: [{
      fieldId: String,
      fileName: String,
      url: String,
      size: Number,
    }],
    isTestSubmission: { type: Boolean, default: false },
  };

  const schema = new mongoose.Schema(schemaDefinition, {
    timestamps: true,
    collection: collectionName,
  });

  schema.index({ 'metadata.submittedAt': -1 });
  schema.index({ status: 1 });

  logger.info(`Dynamic model created for collection: ${collectionName}`);

  return mongoose.model(collectionName, schema);
}

/**
 * Récupère un modèle dynamique existant ou en crée un nouveau
 */
export function getDynamicModel(formId: string, fields: FormField[]) {
  const collectionName = generateCollectionName(formId);
  return mongoose.models[collectionName] || createDynamicModel(formId, fields);
}

/**
 * Supprime les soumissions de test d'un formulaire
 */
export async function purgeTestSubmissions(formId: string): Promise<number> {
  const collectionName = generateCollectionName(formId);
  const model = mongoose.models[collectionName];
  if (!model) return 0;

  const result = await model.deleteMany({ isTestSubmission: true });
  return result.deletedCount;
}

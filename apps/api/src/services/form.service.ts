import { Form, IFormDocument } from '../models/Form';
import { FormStatus } from '@formai/shared';
import { createDynamicModel, generateCollectionName, purgeTestSubmissions } from '../utils/dynamicCollection';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export class FormService {
  /**
   * Crée un nouveau formulaire
   */
  async create(data: {
    name: string;
    description: string;
    schema: Record<string, unknown>;
    organization: string;
    createdBy: string;
    isPublic?: boolean;
  }): Promise<IFormDocument> {
    const slug = data.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const formId = new mongoose.Types.ObjectId();
    const collectionName = generateCollectionName(formId.toString());

    const form = await Form.create({
      _id: formId,
      name: data.name,
      slug: `${slug}-${formId.toString().slice(-6)}`,
      description: data.description,
      schema: data.schema,
      organization: data.organization,
      createdBy: data.createdBy,
      collectionName,
      status: FormStatus.DRAFT,
      version: 1,
      versions: [{
        version: 1,
        schema: data.schema,
        createdAt: new Date(),
        createdBy: data.createdBy,
      }],
      accessControl: {
        viewGroups: [],
        submitGroups: [],
        manageGroups: [],
        isPublic: data.isPublic ?? false,
      },
    });

    // Créer la collection dynamique
    createDynamicModel(formId.toString(), (data.schema as { fields: [] }).fields || []);

    logger.info('Form created', { formId: form._id, name: form.name });

    return form;
  }

  /**
   * Liste les formulaires d'une organisation
   */
  async list(organizationId: string, options: {
    page?: number;
    limit?: number;
    status?: FormStatus;
    createdBy?: string;
    search?: string;
  } = {}): Promise<{ forms: IFormDocument[]; total: number }> {
    const { page = 1, limit = 20, status, createdBy, search } = options;

    const filter: Record<string, unknown> = { organization: organizationId };
    if (status) filter.status = status;
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [forms, total] = await Promise.all([
      Form.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email'),
      Form.countDocuments(filter),
    ]);

    return { forms, total };
  }

  /**
   * Récupère un formulaire par ID
   */
  async getById(formId: string): Promise<IFormDocument> {
    const form = await Form.findById(formId)
      .populate('createdBy', 'firstName lastName email');

    if (!form) {
      throw new NotFoundError('Formulaire');
    }

    return form;
  }

  /**
   * Récupère un formulaire par slug (pour les formulaires publics)
   */
  async getBySlug(slug: string): Promise<IFormDocument> {
    const form = await Form.findOne({ slug });

    if (!form) {
      throw new NotFoundError('Formulaire');
    }

    return form;
  }

  /**
   * Met à jour un formulaire et crée une nouvelle version
   */
  async update(formId: string, data: {
    name?: string;
    description?: string;
    schema?: Record<string, unknown>;
    updatedBy: string;
  }): Promise<IFormDocument> {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    if (data.name) form.name = data.name;
    if (data.description) form.description = data.description;

    if (data.schema) {
      form.version += 1;
      form.schema = data.schema as IFormDocument['schema'];
      form.versions.push({
        version: form.version,
        schema: data.schema as IFormDocument['schema'],
        createdAt: new Date(),
        createdBy: new mongoose.Types.ObjectId(data.updatedBy),
      });

      // Recréer le modèle dynamique
      createDynamicModel(formId, (data.schema as { fields: [] }).fields || []);
    }

    await form.save();
    logger.info('Form updated', { formId, version: form.version });

    return form;
  }

  /**
   * Publie un formulaire
   */
  async publish(formId: string): Promise<IFormDocument> {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    if (form.status === FormStatus.PUBLISHED) {
      throw new ValidationError('Le formulaire est déjà publié');
    }

    // Purger les soumissions de test
    const purgedCount = await purgeTestSubmissions(formId);
    logger.info(`Purged ${purgedCount} test submissions for form ${formId}`);

    form.status = FormStatus.PUBLISHED;
    form.publishedAt = new Date();
    await form.save();

    logger.info('Form published', { formId, slug: form.slug });

    return form;
  }

  /**
   * Archive un formulaire
   */
  async archive(formId: string): Promise<IFormDocument> {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    form.status = FormStatus.ARCHIVED;
    await form.save();

    return form;
  }

  /**
   * Duplique un formulaire
   */
  async duplicate(formId: string, userId: string): Promise<IFormDocument> {
    const original = await Form.findById(formId);
    if (!original) throw new NotFoundError('Formulaire');

    return this.create({
      name: `${original.name} (copie)`,
      description: original.description,
      schema: original.schema.toObject(),
      organization: original.organization.toString(),
      createdBy: userId,
    });
  }

  /**
   * Supprime un formulaire
   */
  async delete(formId: string): Promise<void> {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    await Form.findByIdAndDelete(formId);
    logger.info('Form deleted', { formId });
  }
}

export const formService = new FormService();

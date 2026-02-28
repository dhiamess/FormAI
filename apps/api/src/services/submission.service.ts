import { Form } from '../models/Form';
import { FormStatus, FormField, FieldType } from '@formai/shared';
import { getDynamicModel } from '../utils/dynamicCollection';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { z } from 'zod';

export class SubmissionService {
  /**
   * Crée une soumission pour un formulaire
   */
  async create(formId: string, data: {
    values: Record<string, unknown>;
    submittedBy?: string;
    ip?: string;
    userAgent?: string;
    isTest?: boolean;
  }) {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    if (form.status !== FormStatus.PUBLISHED && form.status !== FormStatus.TESTING) {
      throw new ValidationError('Ce formulaire n\'accepte pas de soumissions');
    }

    // Valider les données contre le schéma du formulaire
    this.validateSubmissionData(form.schema.fields, data.values);

    const Model = getDynamicModel(formId, form.schema.fields);

    const submission = await Model.create({
      formId: form._id,
      formVersion: form.version,
      data: data.values,
      metadata: {
        submittedBy: data.submittedBy || null,
        submittedAt: new Date(),
        ip: data.ip,
        userAgent: data.userAgent,
        source: 'web',
      },
      status: 'submitted',
      isTestSubmission: data.isTest || form.status === FormStatus.TESTING,
    });

    // Mettre à jour les analytics du formulaire
    form.analytics.totalSubmissions += 1;
    form.analytics.lastSubmission = new Date();
    await form.save();

    logger.info('Submission created', { formId, submissionId: submission._id });

    return submission;
  }

  /**
   * Liste les soumissions d'un formulaire
   */
  async list(formId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    includeTest?: boolean;
  } = {}) {
    const { page = 1, limit = 20, status, includeTest = false } = options;

    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    const Model = getDynamicModel(formId, form.schema.fields);

    const filter: Record<string, unknown> = { formId: form._id };
    if (status) filter.status = status;
    if (!includeTest) filter.isTestSubmission = false;

    const [submissions, total] = await Promise.all([
      Model.find(filter)
        .sort({ 'metadata.submittedAt': -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Model.countDocuments(filter),
    ]);

    return { submissions, total };
  }

  /**
   * Récupère une soumission par ID
   */
  async getById(formId: string, submissionId: string) {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    const Model = getDynamicModel(formId, form.schema.fields);
    const submission = await Model.findById(submissionId);

    if (!submission) throw new NotFoundError('Soumission');

    return submission;
  }

  /**
   * Met à jour le statut d'une soumission
   */
  async updateStatus(formId: string, submissionId: string, status: string) {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    const Model = getDynamicModel(formId, form.schema.fields);
    const submission = await Model.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true },
    );

    if (!submission) throw new NotFoundError('Soumission');

    return submission;
  }

  /**
   * Supprime une soumission
   */
  async delete(formId: string, submissionId: string) {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    const Model = getDynamicModel(formId, form.schema.fields);
    const result = await Model.findByIdAndDelete(submissionId);

    if (!result) throw new NotFoundError('Soumission');

    form.analytics.totalSubmissions = Math.max(0, form.analytics.totalSubmissions - 1);
    await form.save();
  }

  /**
   * Exporte les soumissions en CSV
   */
  async exportCSV(formId: string): Promise<string> {
    const form = await Form.findById(formId);
    if (!form) throw new NotFoundError('Formulaire');

    const Model = getDynamicModel(formId, form.schema.fields);
    const submissions = await Model.find({
      formId: form._id,
      isTestSubmission: false,
    }).sort({ 'metadata.submittedAt': -1 });

    // Construire le CSV
    const dataFields = form.schema.fields.filter(
      (f) => !['section', 'heading', 'paragraph'].includes(f.type),
    );

    const headers = [
      'ID',
      ...dataFields.map((f) => f.label),
      'Statut',
      'Date de soumission',
    ];

    const rows = submissions.map((sub: Record<string, unknown>) => {
      const data = sub.data as Record<string, unknown>;
      const metadata = sub.metadata as Record<string, unknown>;
      return [
        (sub._id as string).toString(),
        ...dataFields.map((f) => String(data[f.name] ?? '')),
        sub.status as string,
        metadata.submittedAt ? new Date(metadata.submittedAt as string).toISOString() : '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Valide les données soumises contre le schéma du formulaire
   */
  private validateSubmissionData(fields: FormField[], data: Record<string, unknown>) {
    for (const field of fields) {
      if (['section', 'heading', 'paragraph'].includes(field.type)) continue;

      const value = data[field.name];

      if (field.required && (value === undefined || value === null || value === '')) {
        throw new ValidationError(`Le champ "${field.label}" est obligatoire`);
      }

      if (value === undefined || value === null || value === '') continue;

      // Validation par type
      switch (field.type) {
        case FieldType.EMAIL:
          if (typeof value === 'string' && !z.string().email().safeParse(value).success) {
            throw new ValidationError(`Le champ "${field.label}" doit être un email valide`);
          }
          break;
        case FieldType.NUMBER:
          if (typeof value !== 'number' && isNaN(Number(value))) {
            throw new ValidationError(`Le champ "${field.label}" doit être un nombre`);
          }
          if (field.validation?.min !== undefined && Number(value) < field.validation.min) {
            throw new ValidationError(`Le champ "${field.label}" doit être supérieur ou égal à ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined && Number(value) > field.validation.max) {
            throw new ValidationError(`Le champ "${field.label}" doit être inférieur ou égal à ${field.validation.max}`);
          }
          break;
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
          if (typeof value === 'string') {
            if (field.validation?.minLength && value.length < field.validation.minLength) {
              throw new ValidationError(`Le champ "${field.label}" doit contenir au moins ${field.validation.minLength} caractères`);
            }
            if (field.validation?.maxLength && value.length > field.validation.maxLength) {
              throw new ValidationError(`Le champ "${field.label}" doit contenir au maximum ${field.validation.maxLength} caractères`);
            }
          }
          break;
      }
    }
  }
}

export const submissionService = new SubmissionService();

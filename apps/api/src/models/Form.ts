import mongoose, { Schema, Document } from 'mongoose';
import { FormStatus, FormSchema as IFormSchema } from '@formai/shared';

export interface IFormDocument extends Document {
  name: string;
  slug: string;
  description: string;
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: FormStatus;
  version: number;
  versions: Array<{
    version: number;
    formSchema: IFormSchema;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
  }>;
  formSchema: IFormSchema;
  collectionName: string;
  accessControl: {
    viewGroups: mongoose.Types.ObjectId[];
    submitGroups: mongoose.Types.ObjectId[];
    manageGroups: mongoose.Types.ObjectId[];
    isPublic: boolean;
  };
  integrations: Array<{
    type: 'webhook' | 'email' | 'sqlserver' | 'mongodb' | 'api';
    config: Record<string, unknown>;
    enabled: boolean;
  }>;
  analytics: {
    totalSubmissions: number;
    lastSubmission?: Date;
    avgCompletionTime: number;
  };
  aiPromptHistory: Array<{
    prompt: string;
    response: Record<string, unknown>;
    model: string;
    createdAt: Date;
  }>;
  publishedAt?: Date;
}

const FormFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    label: { type: String, required: true },
    name: { type: String, required: true },
    placeholder: String,
    helpText: String,
    required: { type: Boolean, default: false },
    validation: {
      min: Number,
      max: Number,
      minLength: Number,
      maxLength: Number,
      pattern: String,
      customMessage: String,
    },
    options: [{ label: String, value: String }],
    conditional: {
      field: String,
      operator: { type: String, enum: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan'] },
      value: Schema.Types.Mixed,
    },
    layout: {
      column: Number,
      row: Number,
      width: Number,
    },
    defaultValue: Schema.Types.Mixed,
    readOnly: Boolean,
    computed: String,
  },
  { _id: false },
);

const FormSchemaDefinition = new Schema(
  {
    fields: [FormFieldSchema],
    layout: {
      type: { type: String, enum: ['single', 'multi-step', 'tabs'], default: 'single' },
      steps: [{ title: String, fields: [String] }],
    },
    settings: {
      submitButtonText: { type: String, default: 'Soumettre' },
      successMessage: { type: String, default: 'Formulaire soumis avec succès !' },
      redirectUrl: String,
      allowMultipleSubmissions: { type: Boolean, default: false },
      requireAuth: { type: Boolean, default: false },
      notifyOnSubmission: [String],
      autoSave: { type: Boolean, default: true },
      theme: {
        primaryColor: { type: String, default: '#2563eb' },
        fontFamily: { type: String, default: 'Inter' },
        borderRadius: { type: String, default: '8px' },
      },
    },
  },
  { _id: false },
);

const FormMongooseSchema = new Schema<IFormDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, default: '' },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(FormStatus), default: FormStatus.DRAFT },
    version: { type: Number, default: 1 },
    versions: [{
      version: Number,
      formSchema: FormSchemaDefinition,
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    }],
    formSchema: FormSchemaDefinition,
    collectionName: { type: String, required: true },
    accessControl: {
      viewGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
      submitGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
      manageGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
      isPublic: { type: Boolean, default: false },
    },
    integrations: [{
      type: { type: String, enum: ['webhook', 'email', 'sqlserver', 'mongodb', 'api'] },
      config: Schema.Types.Mixed,
      enabled: { type: Boolean, default: false },
    }],
    analytics: {
      totalSubmissions: { type: Number, default: 0 },
      lastSubmission: Date,
      avgCompletionTime: { type: Number, default: 0 },
    },
    aiPromptHistory: [{
      prompt: String,
      response: Schema.Types.Mixed,
      model: String,
      createdAt: { type: Date, default: Date.now },
    }],
    publishedAt: Date,
  },
  { timestamps: true },
);

FormMongooseSchema.index({ organization: 1, slug: 1 }, { unique: true });
FormMongooseSchema.index({ status: 1 });
FormMongooseSchema.index({ createdBy: 1 });

export const Form = mongoose.model<IFormDocument>('Form', FormMongooseSchema);

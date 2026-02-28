// ============================================
// TYPES PARTAGÉS ENTRE FRONTEND ET BACKEND
// ============================================

// --- Enums ---
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

export enum FormStatus {
  DRAFT = 'draft',
  TESTING = 'testing',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  DATETIME = 'datetime',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  SECTION = 'section',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  HIDDEN = 'hidden',
  CALCULATED = 'calculated',
  LOOKUP = 'lookup',
  TABLE = 'table'
}

export enum ConnectionType {
  SQLSERVER = 'sqlserver',
  MONGODB = 'mongodb',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  REST_API = 'rest_api',
  GRAPHQL = 'graphql'
}

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// --- Interfaces ---
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
  };
  options?: Array<{ label: string; value: string }>;
  conditional?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: unknown;
  };
  layout?: {
    column: number;
    row: number;
    width: number;
  };
  defaultValue?: unknown;
  readOnly?: boolean;
  computed?: string;
}

export interface FormSchema {
  fields: FormField[];
  layout: {
    type: 'single' | 'multi-step' | 'tabs';
    steps?: Array<{ title: string; fields: string[] }>;
  };
  settings: {
    submitButtonText: string;
    successMessage: string;
    redirectUrl?: string;
    allowMultipleSubmissions: boolean;
    requireAuth: boolean;
    notifyOnSubmission: string[];
    autoSave: boolean;
    theme?: {
      primaryColor: string;
      fontFamily: string;
      borderRadius: string;
    };
  };
}

export interface IForm {
  _id: string;
  name: string;
  slug: string;
  description: string;
  organization: string;
  createdBy: string;
  status: FormStatus;
  version: number;
  schema: FormSchema;
  collectionName: string;
  accessControl: {
    viewGroups: string[];
    submitGroups: string[];
    manageGroups: string[];
    isPublic: boolean;
  };
  integrations: Array<{
    type: 'webhook' | 'email' | 'sqlserver' | 'mongodb' | 'api';
    config: Record<string, unknown>;
    enabled: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  groups: string[];
  organization: string;
  isActive: boolean;
  preferences: {
    language: 'fr' | 'en';
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface IGroup {
  _id: string;
  name: string;
  description: string;
  organization: string;
  permissions: {
    forms: { create: boolean; read: boolean; update: boolean; delete: boolean; publish: boolean };
    submissions: { read: boolean; export: boolean; delete: boolean };
    users: { manage: boolean };
    settings: { manage: boolean };
  };
  members: string[];
}

export interface IApiConnection {
  _id: string;
  name: string;
  organization: string;
  type: ConnectionType;
  config: Record<string, unknown>;
  status: 'active' | 'inactive' | 'error';
  lastTestedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

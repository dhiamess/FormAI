import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizationDocument extends Document {
  name: string;
  slug: string;
  logo?: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: {
    maxForms: number;
    maxUsers: number;
    maxSubmissions: number;
    defaultAIProvider: string;
    customDomain?: string;
  };
}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: { type: String },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    settings: {
      maxForms: { type: Number, default: 10 },
      maxUsers: { type: Number, default: 5 },
      maxSubmissions: { type: Number, default: 1000 },
      defaultAIProvider: { type: String, default: 'claude' },
      customDomain: { type: String },
    },
  },
  { timestamps: true },
);

export const Organization = mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);

import mongoose, { Schema, Document } from 'mongoose';
import { ConnectionType } from '@formai/shared';

export interface IApiConnectionDocument extends Document {
  name: string;
  organization: mongoose.Types.ObjectId;
  type: ConnectionType;
  config: Record<string, unknown>;
  status: 'active' | 'inactive' | 'error';
  lastTestedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const ApiConnectionSchema = new Schema<IApiConnectionDocument>(
  {
    name: { type: String, required: true, trim: true },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    type: { type: String, enum: Object.values(ConnectionType), required: true },
    config: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['active', 'inactive', 'error'], default: 'inactive' },
    lastTestedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

ApiConnectionSchema.index({ organization: 1 });

export const ApiConnection = mongoose.model<IApiConnectionDocument>('ApiConnection', ApiConnectionSchema);

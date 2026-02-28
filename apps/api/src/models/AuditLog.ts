import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLogDocument extends Document {
  organization: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: string;
  resource: { type: string; id: mongoose.Types.ObjectId };
  details: Record<string, unknown>;
  ip: string;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: {
      type: { type: String, required: true },
      id: { type: Schema.Types.ObjectId, required: true },
    },
    details: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
  },
  { timestamps: true },
);

AuditLogSchema.index({ organization: 1, createdAt: -1 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

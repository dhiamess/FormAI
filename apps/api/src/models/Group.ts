import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupDocument extends Document {
  name: string;
  description: string;
  organization: mongoose.Types.ObjectId;
  permissions: {
    forms: { create: boolean; read: boolean; update: boolean; delete: boolean; publish: boolean };
    submissions: { read: boolean; export: boolean; delete: boolean };
    users: { manage: boolean };
    settings: { manage: boolean };
  };
  members: mongoose.Types.ObjectId[];
}

const GroupSchema = new Schema<IGroupDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    permissions: {
      forms: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        publish: { type: Boolean, default: false },
      },
      submissions: {
        read: { type: Boolean, default: false },
        export: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      users: {
        manage: { type: Boolean, default: false },
      },
      settings: {
        manage: { type: Boolean, default: false },
      },
    },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

GroupSchema.index({ organization: 1 });

export const Group = mongoose.model<IGroupDocument>('Group', GroupSchema);

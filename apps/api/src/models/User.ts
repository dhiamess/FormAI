import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@formai/shared';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  groups: mongoose.Types.ObjectId[];
  organization: mongoose.Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  preferences: {
    language: 'fr' | 'en';
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    preferences: {
      language: { type: String, enum: ['fr', 'en'], default: 'fr' },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 });
UserSchema.index({ organization: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);

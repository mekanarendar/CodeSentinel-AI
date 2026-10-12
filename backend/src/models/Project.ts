import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProject extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  repositoryUrl?: string;
  primaryLanguage: string;
  latestScore: number;
  totalReviews: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    repositoryUrl: { type: String, trim: true },
    primaryLanguage: { type: String, default: 'typescript' },
    latestScore: { type: Number, default: 100, min: 0, max: 100 },
    totalReviews: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ userId: 1, name: 1 }, { unique: true });

export const ProjectModel = mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);

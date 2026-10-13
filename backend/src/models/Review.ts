import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IFinding {
  id: string;
  title: string;
  category: 'security' | 'bug' | 'performance' | 'maintainability' | 'complexity' | 'best_practice';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  confidence: 'high' | 'medium' | 'low';
  filePath?: string;
  lineNumber?: number;
  evidence: string;
  description: string;
  impact: string;
  recommendation: string;
  suggestedFix?: string;
  verificationStatus: 'unverified' | 'confirmed' | 'false_positive';
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  type: 'single-file' | 'project';
  title: string;
  language: string;
  codeSnippetPreview?: string;
  codeHash: string;
  overallScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clean';
  summary: string;
  findings: IFinding[];
  positiveObservations: string[];
  recommendedPriorities: string[];
  limitations: string[];
  stats: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    linesOfCodeAnalyzed: number;
    executionTimeMs: number;
  };
  createdAt: Date;
}

const findingSchema = new Schema<IFinding>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['security', 'bug', 'performance', 'maintainability', 'complexity', 'best_practice'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    filePath: { type: String },
    lineNumber: { type: Number },
    evidence: { type: String, default: '' },
    description: { type: String, required: true },
    impact: { type: String, default: '' },
    recommendation: { type: String, required: true },
    suggestedFix: { type: String },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'confirmed', 'false_positive'],
      default: 'unverified',
    },
  },
  { _id: false }
);

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    type: { type: String, enum: ['single-file', 'project'], default: 'single-file' },
    title: { type: String, required: true },
    language: { type: String, default: 'typescript' },
    codeSnippetPreview: { type: String, maxlength: 500 },
    codeHash: { type: String, required: true },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'clean'],
      default: 'low',
    },
    summary: { type: String, required: true },
    findings: [findingSchema],
    positiveObservations: [{ type: String }],
    recommendedPriorities: [{ type: String }],
    limitations: [{ type: String }],
    stats: {
      totalFindings: { type: Number, default: 0 },
      criticalCount: { type: Number, default: 0 },
      highCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      lowCount: { type: Number, default: 0 },
      infoCount: { type: Number, default: 0 },
      linesOfCodeAnalyzed: { type: Number, default: 0 },
      executionTimeMs: { type: Number, default: 0 },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

reviewSchema.index({ userId: 1, createdAt: -1 });

export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);

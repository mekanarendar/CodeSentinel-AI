import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditEvent extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

const auditEventSchema = new Schema<IAuditEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const AuditEventModel = mongoose.models.AuditEvent || mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema);

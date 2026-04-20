import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISystemLog extends Document {
  level: 'info' | 'warn' | 'error' | 'fatal';
  source: 'site' | 'admin' | 'api' | 'system';
  message: string;
  details?: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  userId?: mongoose.Types.ObjectId;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'fatal'],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['site', 'admin', 'api', 'system'],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    details: { type: String },
    stack: { type: String },
    path: { type: String },
    method: { type: String },
    statusCode: { type: Number },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ level: 1, source: 1, createdAt: -1 });

const SystemLog: Model<ISystemLog> =
  mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', systemLogSchema);

export default SystemLog;

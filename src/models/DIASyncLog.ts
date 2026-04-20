import mongoose, { Schema, Model } from 'mongoose';
import { IDIASyncLog } from '../types';

const diaSyncLogSchema = new Schema<IDIASyncLog>(
  {
    syncType: { type: String, enum: ['full', 'incremental', 'manual'], required: true },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    stats: {
      totalProducts: { type: Number, default: 0 },
      newProducts: { type: Number, default: 0 },
      updatedProducts: { type: Number, default: 0 },
      failedProducts: { type: Number, default: 0 },
      stockUpdates: { type: Number, default: 0 },
    },
    errors: [{ diaProductId: String, error: String }],
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    duration: Number,
    triggeredBy: { type: String, enum: ['cron', 'webhook', 'admin'], required: true },
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

diaSyncLogSchema.index({ createdAt: -1 });
diaSyncLogSchema.index({ status: 1 });

const DIASyncLog: Model<IDIASyncLog> = mongoose.models.DIASyncLog || mongoose.model<IDIASyncLog>('DIASyncLog', diaSyncLogSchema);
export default DIASyncLog;

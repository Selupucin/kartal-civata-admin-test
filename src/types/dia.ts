import { Types } from 'mongoose';

export type SyncType = 'full' | 'incremental' | 'manual';
export type SyncStatus = 'running' | 'completed' | 'failed';
export type SyncTrigger = 'cron' | 'webhook' | 'admin';

export interface IDIASyncLog {
  _id: Types.ObjectId;
  syncType: SyncType;
  status: SyncStatus;
  stats: {
    totalProducts: number;
    newProducts: number;
    updatedProducts: number;
    failedProducts: number;
    stockUpdates: number;
  };
  errors?: Array<{ diaProductId: string; error: string }>;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  triggeredBy: SyncTrigger;
  adminUserId?: Types.ObjectId;
}

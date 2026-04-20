import { Types } from 'mongoose';

export type NotificationType = 'order_status' | 'wholesale_approved' | 'wholesale_rejected' | 'low_stock' | 'new_wholesale_application' | 'system';

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

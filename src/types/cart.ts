import { Types } from 'mongoose';

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

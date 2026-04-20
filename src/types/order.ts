import { Types } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrderAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  postalCode: string;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
}

export interface IOrderItem {
  productId: Types.ObjectId;
  productSnapshot: {
    name: string;
    sku: string;
    slug: string;
    image: string;
    categoryName: string;
    weight: number;
    attributes: Record<string, string | number>;
  };
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
  pricingType: 'retail' | 'wholesale' | 'tiered';
  appliedTier?: { minQuantity: number; maxQuantity?: number; price: number };
}

export interface IStatusChange {
  from: string;
  to: string;
  changedBy: Types.ObjectId;
  changedAt: Date;
  note?: string;
}

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  userId?: Types.ObjectId;
  userSnapshot: { email: string; fullName: string; phone: string; role: string };
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  summary: {
    subtotal: number;
    taxTotal: number;
    shippingCost: number;
    discount: number;
    grandTotal: number;
    currency: string;
  };
  status: OrderStatus;
  statusHistory: IStatusChange[];
  shipping?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt?: Date;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: Date;
  };
  customerNote?: string;
  adminNote?: string;
  cancellation?: {
    reason: string;
    cancelledBy: 'customer' | 'admin';
    cancelledAt: Date;
    refundAmount?: number;
    refundStatus?: 'pending' | 'completed';
  };
  createdAt: Date;
  updatedAt: Date;
}

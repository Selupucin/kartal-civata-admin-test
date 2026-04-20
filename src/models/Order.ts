import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, IOrderItem, IOrderAddress, IStatusChange } from '../types';

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSnapshot: {
      name: { type: String, required: true },
      sku: { type: String, required: true },
      slug: { type: String, required: true },
      image: String,
      categoryName: String,
      weight: Number,
      attributes: { type: Map, of: Schema.Types.Mixed },
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    pricingType: { type: String, enum: ['retail', 'wholesale', 'tiered'], required: true },
    appliedTier: { minQuantity: Number, maxQuantity: Number, price: Number },
  },
  { _id: false }
);

const statusChangeSchema = new Schema<IStatusChange>(
  {
    from: String,
    to: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
  { _id: false }
);

const orderAddressSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    neighborhood: String,
    addressLine: { type: String, required: true },
    postalCode: String,
    companyName: String,
    taxNumber: String,
    taxOffice: String,
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userSnapshot: {
      email: { type: String, required: true },
      fullName: { type: String, required: true },
      phone: String,
      role: String,
    },
    items: [orderItemSchema],
    shippingAddress: { type: orderAddressSchema, required: true },
    billingAddress: { type: orderAddressSchema, required: true },
    summary: {
      subtotal: { type: Number, required: true },
      taxTotal: { type: Number, required: true },
      shippingCost: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
      currency: { type: String, default: 'TRY' },
    },
    status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending', index: true },
    statusHistory: [statusChangeSchema],
    shipping: {
      carrier: String,
      trackingNumber: String,
      trackingUrl: String,
      shippedAt: Date,
      estimatedDelivery: Date,
      deliveredAt: Date,
    },
    payment: {
      method: { type: String, enum: ['credit_card', 'bank_transfer', 'cash_on_delivery'], required: true },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      transactionId: String,
      paidAt: Date,
    },
    customerNote: String,
    adminNote: { type: String, select: false },
    cancellation: {
      reason: String,
      cancelledBy: { type: String, enum: ['customer', 'admin'] },
      cancelledAt: Date,
      refundAmount: Number,
      refundStatus: { type: String, enum: ['pending', 'completed'] },
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.productId': 1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export default Order;

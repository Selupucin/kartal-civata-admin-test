import mongoose, { Schema, Model } from 'mongoose';
import { IWholesaleApplication } from '../types';

const wholesaleApplicationSchema = new Schema<IWholesaleApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyName: { type: String, required: true, trim: true },
    taxNumber: { type: String, required: true, trim: true, validate: { validator: (v: string) => /^\d{10,11}$/.test(v), message: 'Geçersiz vergi numarası' } },
    taxOffice: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    notes: { type: String, default: '' },
    documents: { taxCertificate: String, tradeRegistry: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

wholesaleApplicationSchema.index({ status: 1, createdAt: -1 });
wholesaleApplicationSchema.index({ userId: 1, status: 1 });

const WholesaleApplication: Model<IWholesaleApplication> = mongoose.models.WholesaleApplication || mongoose.model<IWholesaleApplication>('WholesaleApplication', wholesaleApplicationSchema);
export default WholesaleApplication;

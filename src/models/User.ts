import mongoose, { Schema, Model } from 'mongoose';
import { IUser, IAddress, ISavedCard } from '../types';

const addressSchema = new Schema<IAddress>(
  {
    title: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    addressLine: { type: String, required: true },
    postalCode: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const savedCardSchema = new Schema<ISavedCard>(
  {
    alias: { type: String, required: true, trim: true, maxlength: 50 },
    cardHolderName: { type: String, required: true, trim: true },
    lastFourDigits: { type: String, required: true, match: /^\d{4}$/ },
    brand: { type: String, enum: ['visa', 'mastercard', 'amex', 'troy'], required: true },
    expiryMonth: { type: String, required: true, match: /^(0[1-9]|1[0-2])$/ },
    expiryYear: { type: String, required: true, match: /^\d{4}$/ },
    cardToken: { type: String, required: true, select: false },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'wholesale', 'admin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    addresses: [addressSchema],
    defaultAddressId: { type: Schema.Types.ObjectId },
    savedCards: { type: [savedCardSchema], default: [] },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      language: { type: String, enum: ['tr', 'en'], default: 'tr' },
      adminNotifications: {
        newOrder: { type: Boolean, default: true },
        wholesaleApp: { type: Boolean, default: true },
        lowStock: { type: Boolean, default: true },
        system: { type: Boolean, default: false },
      },
    },
    wholesaleInfo: {
      companyName: String,
      taxNumber: String,
      taxOffice: String,
      approvedAt: Date,
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;

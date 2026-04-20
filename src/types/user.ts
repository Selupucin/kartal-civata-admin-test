import { Types } from 'mongoose';

export type UserRole = 'user' | 'wholesale' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface IAddress {
  _id: Types.ObjectId;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
}

export interface ISavedCard {
  _id: Types.ObjectId;
  alias: string;
  cardHolderName: string;
  lastFourDigits: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'troy';
  expiryMonth: string;
  expiryYear: string;
  cardToken: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  addresses: IAddress[];
  defaultAddressId?: Types.ObjectId;
  savedCards: ISavedCard[];
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    language: 'tr' | 'en';
  };
  wholesaleInfo?: {
    companyName: string;
    taxNumber: string;
    taxOffice: string;
    approvedAt: Date;
    approvedBy: Types.ObjectId;
  };
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string; // virtual
}

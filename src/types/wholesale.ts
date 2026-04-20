import { Types } from 'mongoose';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface IWholesaleApplication {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  notes?: string;
  documents?: { taxCertificate?: string; tradeRegistry?: string };
  status: ApplicationStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

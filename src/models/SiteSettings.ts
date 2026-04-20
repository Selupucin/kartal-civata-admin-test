import mongoose, { Schema, Model } from 'mongoose';

export interface ISiteSettings {
  _id: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    city: string;
    district: string;
    workingHours: string;
    workingHoursData?: {
      days: Record<string, boolean>;
      openTime: string;
      closeTime: string;
    };
    googleMapsUrl: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      linkedin: string;
    };
  };
  branches: {
    _id: string;
    name: string;
    address: string;
    phone: string;
    workingHours: string;
    googleMapsUrl: string;
    isHeadquarter: boolean;
  }[];
  logo: {
    url: string;
    uploadedAt: Date | null;
  };
  footerLogo: {
    url: string;
    uploadedAt: Date | null;
  };
  favicon: {
    url: string;
    uploadedAt: Date | null;
  };
  wholesaleMinQuantity: number;
  wholesaleDiscountPercent: number;
  defaultLowStockThreshold: number;
}

const branchSchema = new Schema(
  {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    googleMapsUrl: { type: String, default: '' },
    isHeadquarter: { type: Boolean, default: false },
  },
  { _id: true }
);

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    contactInfo: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: '' },
      workingHours: { type: String, default: '' },
      workingHoursData: {
        days: {
          pazartesi: { type: Boolean, default: true },
          sali: { type: Boolean, default: true },
          carsamba: { type: Boolean, default: true },
          persembe: { type: Boolean, default: true },
          cuma: { type: Boolean, default: true },
          cumartesi: { type: Boolean, default: true },
          pazar: { type: Boolean, default: false },
        },
        openTime: { type: String, default: '08:30' },
        closeTime: { type: String, default: '18:30' },
      },
      googleMapsUrl: { type: String, default: '' },
      socialMedia: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        twitter: { type: String, default: '' },
        linkedin: { type: String, default: '' },
      },
    },
    branches: { type: [branchSchema], default: [] },
    logo: {
      url: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
    },
    footerLogo: {
      url: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
    },
    favicon: {
      url: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
    },
    wholesaleMinQuantity: { type: Number, default: 100 },
    wholesaleDiscountPercent: { type: Number, default: 0 },
    defaultLowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
export default SiteSettings;

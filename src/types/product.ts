import { Types } from 'mongoose';

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface IProductImage {
  url: string;
  alt: string;
  order: number;
  isPrimary: boolean;
}

export interface IPriceTier {
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
}

export interface IProductPricing {
  retailPrice: number;
  wholesalePrice: number;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  retailTiers: IPriceTier[];
  wholesaleTiers: IPriceTier[];
  taxRate: number;
  currency: string;
}

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  categoryId: Types.ObjectId;
  categoryPath: Types.ObjectId[];
  images: IProductImage[];
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  attributes: Record<string, string | number>;
  pricing: IProductPricing;
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  status: ProductStatus;
  isFeatured: boolean;
  diaProductId?: string;
  diaSyncedAt?: Date;
  seo?: { title?: string; description?: string; keywords?: string[] };
  stats: { totalSold: number; viewCount: number; reviewCount: number; averageRating: number };
  createdAt: Date;
  updatedAt: Date;
}

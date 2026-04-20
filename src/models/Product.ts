import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, IProductImage, IPriceTier, IProductPricing } from '../types';

const productImageSchema = new Schema<IProductImage>(
  { url: { type: String, required: true }, alt: { type: String, default: '' }, order: { type: Number, default: 0 }, isPrimary: { type: Boolean, default: false } },
  { _id: false }
);

const priceTierSchema = new Schema<IPriceTier>(
  { minQuantity: { type: Number, required: true, min: 1 }, maxQuantity: { type: Number, default: null }, price: { type: Number, required: true, min: 0 } },
  { _id: false }
);

const productPricingSchema = new Schema<IProductPricing>(
  {
    retailPrice: { type: Number, required: true, min: 0 },
    wholesalePrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    saleStartDate: Date,
    saleEndDate: Date,
    retailTiers: [priceTierSchema],
    wholesaleTiers: [priceTierSchema],
    taxRate: { type: Number, default: 20 },
    currency: { type: String, default: 'TRY' },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    categoryPath: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    images: [productImageSchema],
    weight: { type: Number, default: 0 },
    dimensions: { length: Number, width: Number, height: Number },
    attributes: { type: Map, of: Schema.Types.Mixed, default: {} },
    pricing: { type: productPricingSchema, required: true },
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    trackStock: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'active', 'inactive', 'archived'], default: 'draft', index: true },
    isFeatured: { type: Boolean, default: false },
    diaProductId: { type: String, sparse: true, index: true },
    diaSyncedAt: Date,
    seo: { title: String, description: String, keywords: [String] },
    stats: { totalSold: { type: Number, default: 0 }, viewCount: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 }, averageRating: { type: Number, default: 0 } },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ 'pricing.retailPrice': 1 });
productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ stock: 1, lowStockThreshold: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export default Product;

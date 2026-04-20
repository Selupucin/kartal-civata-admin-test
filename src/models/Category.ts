import mongoose, { Schema, Model } from 'mongoose';
import { ICategory, ICategoryFilter } from '../types';

const categoryFilterSchema = new Schema<ICategoryFilter>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['select', 'multi-select', 'range'], required: true },
    options: [String],
    unit: String,
  },
  { _id: false }
);

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    level: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    seo: { title: String, description: String, keywords: [String] },
    filters: [categoryFilterSchema],
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1, order: 1 });

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
export default Category;

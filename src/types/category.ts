import { Types } from 'mongoose';

export type FilterType = 'select' | 'multi-select' | 'range';

export interface ICategoryFilter {
  key: string;
  label: string;
  type: FilterType;
  options?: string[];
  unit?: string;
}

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: Types.ObjectId | null;
  level: number;
  order: number;
  isActive: boolean;
  isSystem: boolean;
  seo?: { title?: string; description?: string; keywords?: string[] };
  filters?: ICategoryFilter[];
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

import { z } from 'zod';

export const productFilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(24),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular', 'name_asc']).default('newest'),
  inStock: z.coerce.boolean().optional(),
});

export type ProductFilterInput = z.infer<typeof productFilterSchema>;

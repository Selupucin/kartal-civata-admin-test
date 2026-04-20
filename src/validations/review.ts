import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Yorum en az 10 karakter olmalıdır').max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

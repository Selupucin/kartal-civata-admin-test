import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Ürün ID gereklidir'),
  quantity: z.number().int().min(1, 'Miktar en az 1 olmalıdır').max(1000),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Miktar en az 1 olmalıdır').max(1000),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

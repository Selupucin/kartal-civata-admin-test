import { z } from 'zod';

const addressValidation = z.object({
  fullName: z.string().min(3, 'Ad soyad gereklidir'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  city: z.string().min(2, 'Şehir gereklidir'),
  district: z.string().min(2, 'İlçe gereklidir'),
  neighborhood: z.string().optional(),
  addressLine: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),
  postalCode: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
});

const orderItemValidation = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
});

export const createOrderSchema = z.object({
  shippingAddress: addressValidation,
  billingAddress: addressValidation.optional(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash_on_delivery']),
  customerNote: z.string().max(500).optional(),
  useSameAddress: z.boolean().optional(),
  items: z.array(orderItemValidation).min(1, 'Sepetinizde en az bir ürün olmalıdır'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

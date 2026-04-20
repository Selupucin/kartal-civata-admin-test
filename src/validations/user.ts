import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır').max(50).optional(),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır').max(50).optional(),
  phone: z.string().regex(/^0[2-5]\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional().or(z.literal('')),
  avatar: z.string().url().optional().or(z.literal('')),
  preferences: z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    language: z.enum(['tr', 'en']).optional(),
  }).optional(),
});

export const addressSchema = z.object({
  title: z.string().min(1, 'Adres başlığı gereklidir').max(50),
  fullName: z.string().min(3, 'Ad soyad gereklidir'),
  phone: z.string().regex(/^0[2-5]\d{9}$/, 'Geçerli bir telefon numarası giriniz'),
  city: z.string().min(2, 'Şehir gereklidir'),
  district: z.string().min(2, 'İlçe gereklidir'),
  neighborhood: z.string().optional(),
  addressLine: z.string().min(10, 'Adres en az 10 karakter olmalıdır'),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;

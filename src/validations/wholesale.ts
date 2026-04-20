import { z } from 'zod';

export const wholesaleApplicationSchema = z.object({
  companyName: z.string().min(3, 'Firma adı en az 3 karakter olmalıdır').max(200),
  taxNumber: z.string().regex(/^\d{10,11}$/, 'Geçerli bir vergi numarası giriniz (10 veya 11 haneli)'),
  taxOffice: z.string().min(2, 'Vergi dairesi gereklidir').max(100),
  phone: z.string().regex(/^0[2-5]\d{9}$/, 'Geçerli bir telefon numarası giriniz'),
  address: z.string().min(10, 'Adres en az 10 karakter olmalıdır').max(500),
  city: z.string().min(2, 'Şehir gereklidir'),
  district: z.string().min(2, 'İlçe gereklidir'),
  notes: z.string().max(1000).optional(),
});

export type WholesaleApplicationInput = z.infer<typeof wholesaleApplicationSchema>;

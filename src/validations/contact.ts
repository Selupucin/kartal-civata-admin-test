import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().regex(/^0[2-5]\d{9}$/, 'Geçerli bir telefon numarası giriniz').optional().or(z.literal('')),
  subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır').max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

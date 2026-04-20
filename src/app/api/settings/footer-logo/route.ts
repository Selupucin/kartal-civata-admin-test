import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@/lib/db/mongoose';
import SiteSettings from '@/models/SiteSettings';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('footerLogo') as File | null;

    if (!file) {
      return errorResponse('VALIDATION', 'Footer logo dosyası gerekli', 400);
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('VALIDATION', 'Sadece PNG, JPEG, SVG ve WebP dosyaları kabul edilir', 400);
    }

    if (file.size > 2 * 1024 * 1024) {
      return errorResponse('VALIDATION', 'Dosya boyutu 2MB\'dan küçük olmalıdır', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const fileName = `footer-logo-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), '..', 'site', 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    const logoUrl = `/uploads/${fileName}`;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }

    settings.footerLogo = {
      url: logoUrl,
      uploadedAt: new Date(),
    };

    await settings.save();

    return successResponse({ url: logoUrl });
  })
);

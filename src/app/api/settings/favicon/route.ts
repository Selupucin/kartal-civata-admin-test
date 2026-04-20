import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@shared/lib/db/mongoose';
import SiteSettings from '@shared/models/SiteSettings';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    const formData = await req.formData();
    const file = formData.get('favicon') as File;

    if (!file) {
      return errorResponse('VALIDATION', 'Dosya seçilmedi', 400);
    }

    const allowedTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('VALIDATION', 'Sadece ICO, PNG ve SVG dosyaları kabul edilir', 400);
    }

    if (file.size > 512 * 1024) {
      return errorResponse('VALIDATION', 'Dosya boyutu 512KB\'dan küçük olmalıdır', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'ico';
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `favicon.${sanitizedExt}`;
    // Save to main site's public/uploads so the favicon is served from the main site
    const mainSiteRoot = path.resolve(process.cwd(), '..');
    const uploadDir = path.join(mainSiteRoot, 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    await dbConnect();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }
    settings.favicon = {
      url: `/uploads/${fileName}`,
      uploadedAt: new Date(),
    };
    await settings.save();

    return successResponse({ url: `/uploads/${fileName}` });
  })
);

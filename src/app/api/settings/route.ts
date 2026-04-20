import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@shared/lib/db/mongoose';
import SiteSettings from '@shared/models/SiteSettings';
import Product from '@shared/models/Product';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest) => {
    await dbConnect();
    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      settings = await SiteSettings.create({});
      settings = (settings as any).toObject();
    }
    return successResponse(settings);
  })
);

export const PUT = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();
    const body = await req.json();

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings({});
    }

    if (body.contactInfo) {
      const existing = (settings.contactInfo as any)?.toObject?.() || settings.contactInfo || {};
      const merged = { ...existing, ...body.contactInfo };
      if (body.contactInfo.socialMedia) {
        merged.socialMedia = {
          ...(existing.socialMedia || {}),
          ...body.contactInfo.socialMedia,
        };
      }
      if (body.contactInfo.workingHoursData) {
        const existingWH = existing.workingHoursData || {};
        merged.workingHoursData = {
          ...existingWH,
          ...body.contactInfo.workingHoursData,
          days: {
            ...(existingWH.days || {}),
            ...(body.contactInfo.workingHoursData.days || {}),
          },
        };
      }
      settings.contactInfo = merged;
    }

    if (body.wholesaleMinQuantity !== undefined) {
      settings.wholesaleMinQuantity = Math.max(10, Math.min(10000, Number(body.wholesaleMinQuantity)));
    }

    if (body.wholesaleDiscountPercent !== undefined) {
      settings.wholesaleDiscountPercent = Math.max(0, Math.min(100, Number(body.wholesaleDiscountPercent)));
    }

    if (body.defaultLowStockThreshold !== undefined) {
      const newThreshold = Math.max(1, Math.min(1000, Number(body.defaultLowStockThreshold)));
      settings.defaultLowStockThreshold = newThreshold;
      // Update all products' lowStockThreshold to match the global setting
      await Product.updateMany({}, { $set: { lowStockThreshold: newThreshold } });
    }

    if (body.branches !== undefined) {
      settings.branches = body.branches.map((b: any) => ({
        name: b.name || '',
        address: b.address || '',
        phone: b.phone || '',
        workingHours: b.workingHours || '',
        googleMapsUrl: b.googleMapsUrl || '',
        isHeadquarter: Boolean(b.isHeadquarter),
        ...(b._id ? { _id: b._id } : {}),
      }));
      settings.markModified('branches');
    }

    if (body.logo !== undefined) {
      settings.logo = { ...settings.logo, ...body.logo };
    }

    if (body.footerLogo !== undefined) {
      settings.footerLogo = { ...settings.footerLogo, ...body.footerLogo };
    }

    await settings.save();
    return successResponse(settings);
  })
);

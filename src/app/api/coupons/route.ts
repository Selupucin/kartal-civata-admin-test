import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@shared/lib/db/mongoose';
import Coupon from '@shared/models/Coupon';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest) => {
    await dbConnect();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return successResponse(coupons);
  })
);

export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();
    const body = await req.json();

    if (!body.code || !body.discountType || body.discountValue === undefined) {
      return errorResponse('VALIDATION', 'Kupon kodu, indirim tipi ve değeri zorunludur', 400);
    }

    const existing = await Coupon.findOne({ code: body.code.toUpperCase().trim() });
    if (existing) {
      return errorResponse('CONFLICT', 'Bu kupon kodu zaten mevcut', 409);
    }

    const coupon = await Coupon.create({
      code: body.code.toUpperCase().trim(),
      description: body.description || '',
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      minOrderAmount: Number(body.minOrderAmount || 0),
      maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      perUserLimit: Number(body.perUserLimit || 1),
      isActive: body.isActive !== false,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return successResponse(coupon, 201);
  })
);

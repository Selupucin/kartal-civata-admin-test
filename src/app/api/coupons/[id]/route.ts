import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@/lib/db/mongoose';
import Coupon from '@/models/Coupon';

export const PUT = apiHandler(
  withAdmin(async (req: NextRequest, { params }: any) => {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const coupon = await Coupon.findById(id);
    if (!coupon) return errorResponse('NOT_FOUND', 'Kupon bulunamadı', 404);

    if (body.description !== undefined) coupon.description = body.description;
    if (body.discountType) coupon.discountType = body.discountType;
    if (body.discountValue !== undefined) coupon.discountValue = Number(body.discountValue);
    if (body.minOrderAmount !== undefined) coupon.minOrderAmount = Number(body.minOrderAmount);
    if (body.maxDiscountAmount !== undefined) coupon.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    if (body.usageLimit !== undefined) coupon.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    if (body.perUserLimit !== undefined) coupon.perUserLimit = Number(body.perUserLimit);
    if (body.isActive !== undefined) coupon.isActive = body.isActive;
    if (body.startDate) coupon.startDate = new Date(body.startDate);
    if (body.endDate) coupon.endDate = new Date(body.endDate);

    await coupon.save();
    return successResponse(coupon);
  })
);

export const DELETE = apiHandler(
  withAdmin(async (_req: NextRequest, { params }: any) => {
    await dbConnect();
    const { id } = await params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return errorResponse('NOT_FOUND', 'Kupon bulunamadı', 404);
    return successResponse({ message: 'Kupon silindi' });
  })
);

import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import dbConnect from '@shared/lib/db/mongoose';
import Category from '@shared/models/Category';
import mongoose from 'mongoose';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const category = isObjectId
      ? await Category.findById(id).lean()
      : await Category.findOne({ slug: id }).lean();

    if (!category) throw new NotFoundError('Kategori bulunamadı');

    return successResponse(category);
  })
);

export const PUT = apiHandler(
  withAdmin(async (req: NextRequest, context) => {
    const { id } = await context!.params;
    const body = await req.json();
    await dbConnect();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.parentId !== undefined) updateData.parentId = body.parentId || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.order !== undefined) updateData.order = body.order;

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!category) throw new NotFoundError('Kategori bulunamadı');

    return successResponse(category);
  })
);

export const DELETE = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const category = await Category.findById(id);
    if (!category) throw new NotFoundError('Kategori bulunamadı');

    if (category.isSystem) {
      return errorResponse('FORBIDDEN', 'Sistem kategorileri silinemez', 403);
    }

    await category.deleteOne();
    return successResponse({ message: 'Kategori silindi' });
  })
);

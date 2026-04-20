import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import dbConnect from '@/lib/db/mongoose';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { logSystemError } from '@/lib/logger/systemLog';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const product = isObjectId
      ? await Product.findById(id).lean()
      : await Product.findOne({ slug: id }).lean();

    if (!product) throw new NotFoundError('Ürün bulunamadı');

    return successResponse(product);
  })
);

export const PUT = apiHandler(
  withAdmin(async (req: NextRequest, context) => {
    const { id } = await context!.params;
    const body = await req.json();
    await dbConnect();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.stock !== undefined) updateData.stock = Number(body.stock);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;

    // Handle pricing updates
    if (body.retailPrice !== undefined || body.wholesalePrice !== undefined || body.salePrice !== undefined) {
      if (body.retailPrice !== undefined) updateData['pricing.retailPrice'] = Number(body.retailPrice);
      if (body.wholesalePrice !== undefined) updateData['pricing.wholesalePrice'] = Number(body.wholesalePrice);
      if (body.salePrice !== undefined) updateData['pricing.salePrice'] = body.salePrice ? Number(body.salePrice) : undefined;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!product) throw new NotFoundError('Ürün bulunamadı');

    logSystemError({
      level: 'info',
      source: 'admin',
      message: `Ürün güncellendi: ${product.name} (${product.sku})`,
      path: `/api/products/${id}`,
      method: 'PUT',
      metadata: { action: 'product_update', productId: id, changes: Object.keys(updateData) },
    });

    return successResponse(product);
  })
);

export const DELETE = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const product = await Product.findByIdAndDelete(id);
    if (!product) throw new NotFoundError('Ürün bulunamadı');

    logSystemError({
      level: 'warn',
      source: 'admin',
      message: `Ürün silindi: ${product.name} (${product.sku})`,
      path: `/api/products/${id}`,
      method: 'DELETE',
      metadata: { action: 'product_delete', productId: id, productName: product.name, sku: product.sku },
    });

    return successResponse({ message: 'Ürün silindi' });
  })
);

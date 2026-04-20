import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, createdResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { slugify } from '@shared/lib/utils/slug';
import { ValidationError } from '@/lib/errors';
import dbConnect from '@shared/lib/db/mongoose';
import Category from '@shared/models/Category';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest) => {
    await dbConnect();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return successResponse(categories);
  })
);

export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    const body = await req.json();
    await dbConnect();

    if (!body.name?.trim()) {
      throw new ValidationError('Kategori adı zorunludur');
    }

    const slug = slugify(body.name);

    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new ValidationError('Bu isimde bir kategori zaten mevcut');
    }

    let level = 0;
    if (body.parentId) {
      const parent = await Category.findById(body.parentId);
      if (parent) level = parent.level + 1;
    }

    const category = await Category.create({
      name: body.name.trim(),
      slug,
      description: body.description || '',
      parentId: body.parentId || null,
      level,
      isActive: body.isActive !== false,
    });

    return createdResponse(category);
  })
);

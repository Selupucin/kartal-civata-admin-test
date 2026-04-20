import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, createdResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { slugify } from '@shared/lib/utils/slug';
import dbConnect from '@shared/lib/db/mongoose';
import Product from '@shared/models/Product';
import Category from '@shared/models/Category';
import SiteSettings from '@shared/models/SiteSettings';
import mongoose from 'mongoose';
import { logSystemError } from '@/lib/logger/systemLog';

export const GET = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const skip = (page - 1) * limit;

    const lowStock = searchParams.get('lowStock') === 'true';

    const filter: any = {};
    if (status) filter.status = status;
    if (lowStock) {
      const settings = await SiteSettings.findOne().lean();
      const globalThreshold = settings?.defaultLowStockThreshold || 10;
      filter.stock = { $lte: globalThreshold };
      if (!status) filter.status = 'active';
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.categoryId = category;
      } else {
        const cat = await Category.findOne({ slug: category });
        if (cat) filter.categoryId = cat._id;
      }
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return successResponse(products, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    });
  })
);

export const POST = apiHandler(
  withAdmin(async (req: NextRequest) => {
    const body = await req.json();
    await dbConnect();

    const slug = slugify(body.name);

    // Get global low stock threshold
    const siteSettings = await SiteSettings.findOne().lean();
    const globalThreshold = siteSettings?.defaultLowStockThreshold || 10;

    const product = await Product.create({
      name: body.name,
      slug,
      sku: body.sku,
      description: body.description || '',
      categoryId: body.categoryId || undefined,
      pricing: {
        retailPrice: Number(body.retailPrice),
        wholesalePrice: Number(body.wholesalePrice || body.retailPrice),
        salePrice: body.salePrice ? Number(body.salePrice) : undefined,
        taxRate: body.taxRate || 20,
        currency: 'TRY',
      },
      stock: Number(body.stock || 0),
      lowStockThreshold: globalThreshold,
      status: body.status || 'draft',
    });

    // Log product creation
    logSystemError({
      level: 'info',
      source: 'admin',
      message: `Yeni ürün eklendi: ${product.name} (${product.sku})`,
      path: '/api/products',
      method: 'POST',
      metadata: { action: 'product_create', productId: product._id.toString(), sku: product.sku },
    });

    return createdResponse(product);
  })
);

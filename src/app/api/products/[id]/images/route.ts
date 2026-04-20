import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import dbConnect from '@/lib/db/mongoose';
import Product from '@/models/Product';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const POST = apiHandler(
  withAdmin(async (req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Ürün bulunamadı');

    const currentCount = product.images?.length || 0;

    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files.length) {
      return errorResponse('VALIDATION', 'En az bir resim dosyası gerekli', 400);
    }

    if (currentCount + files.length > MAX_IMAGES) {
      return errorResponse('VALIDATION', `En fazla ${MAX_IMAGES} resim eklenebilir. Mevcut: ${currentCount}`, 400);
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return errorResponse('VALIDATION', `Geçersiz dosya tipi: ${file.name}. Sadece PNG, JPEG ve WebP kabul edilir`, 400);
      }
      if (file.size > MAX_FILE_SIZE) {
        return errorResponse('VALIDATION', `${file.name} dosyası 3MB'dan büyük`, 400);
      }
    }

    const uploadDir = path.join(process.cwd(), '..', 'site', 'public', 'uploads', 'products');
    await mkdir(uploadDir, { recursive: true });

    const newImages = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = file.name.split('.').pop() || 'jpg';
      const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
      const fileName = `${id}-${Date.now()}-${i}.${sanitizedExt}`;
      await writeFile(path.join(uploadDir, fileName), buffer);

      newImages.push({
        url: `/uploads/products/${fileName}`,
        alt: product.name,
        order: currentCount + i,
        isPrimary: currentCount === 0 && i === 0,
      });
    }

    product.images.push(...newImages);
    await product.save();

    return successResponse(product.images);
  })
);

export const DELETE = apiHandler(
  withAdmin(async (req: NextRequest, context) => {
    const { id } = await context!.params;
    const { searchParams } = new URL(req.url);
    const imageIndex = searchParams.get('index');

    if (imageIndex === null) {
      return errorResponse('VALIDATION', 'Silinecek resim index\'i gerekli', 400);
    }

    await dbConnect();
    const product = await Product.findById(id);
    if (!product) throw new NotFoundError('Ürün bulunamadı');

    const idx = Number(imageIndex);
    if (idx < 0 || idx >= product.images.length) {
      return errorResponse('VALIDATION', 'Geçersiz resim index\'i', 400);
    }

    const removed = product.images[idx];

    // Try to delete the file
    try {
      const filePath = path.join(process.cwd(), '..', 'site', 'public', removed.url);
      await unlink(filePath);
    } catch {
      // File might not exist, continue
    }

    product.images.splice(idx, 1);
    // Re-assign order and primary
    product.images.forEach((img: any, i: number) => {
      img.order = i;
      img.isPrimary = i === 0;
    });

    await product.save();
    return successResponse(product.images);
  })
);

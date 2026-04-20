import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, createdResponse } from '@shared/lib/api/response';
import { withAdmin, AuthenticatedRequest } from '@/lib/api/middleware';
import { slugify } from '@shared/lib/utils/slug';
import { ValidationError } from '@/lib/errors';
import dbConnect from '@shared/lib/db/mongoose';
import BlogPost from '@shared/models/BlogPost';
import User from '@shared/models/User';

export const GET = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(filter),
    ]);

    return successResponse(posts, 200, {
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
  withAdmin(async (req: AuthenticatedRequest) => {
    const body = await req.json();
    await dbConnect();

    if (!body.title?.trim()) {
      throw new ValidationError('Başlık zorunludur');
    }
    if (!body.content?.trim()) {
      throw new ValidationError('İçerik zorunludur');
    }

    const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.title);

    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      throw new ValidationError('Bu slug ile bir yazı zaten mevcut');
    }

    const admin = await User.findById(req.user!.id).select('firstName lastName email');

    const post = await BlogPost.create({
      title: body.title.trim(),
      slug,
      excerpt: body.excerpt?.trim() || '',
      content: body.content,
      coverImage: body.coverImage || '',
      author: req.user!.id,
      authorSnapshot: {
        name: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin',
        email: admin?.email || req.user!.email,
      },
      tags: body.tags || [],
      status: body.status || 'draft',
      publishedAt: body.status === 'published' ? new Date() : null,
    });

    return createdResponse(post);
  })
);

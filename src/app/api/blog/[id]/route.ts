import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse, errorResponse } from '@shared/lib/api/response';
import { withAdmin, AuthenticatedRequest } from '@/lib/api/middleware';
import { slugify } from '@shared/lib/utils/slug';
import dbConnect from '@shared/lib/db/mongoose';
import BlogPost from '@shared/models/BlogPost';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest, context: any) => {
    await dbConnect();
    const { id } = await context.params;
    const post = await BlogPost.findById(id).lean();
    if (!post) return errorResponse('NOT_FOUND', 'Blog yazısı bulunamadı', 404);
    return successResponse(post);
  })
);

export const PUT = apiHandler(
  withAdmin(async (req: AuthenticatedRequest, context: any) => {
    const { id } = await context.params;
    const body = await req.json();
    await dbConnect();

    const post = await BlogPost.findById(id);
    if (!post) return errorResponse('NOT_FOUND', 'Blog yazısı bulunamadı', 404);

    if (body.title !== undefined) post.title = body.title.trim();
    if (body.slug !== undefined) post.slug = slugify(body.slug);
    if (body.excerpt !== undefined) post.excerpt = body.excerpt.trim();
    if (body.content !== undefined) post.content = body.content;
    if (body.coverImage !== undefined) post.coverImage = body.coverImage;
    if (body.tags !== undefined) post.tags = body.tags;

    if (body.status !== undefined) {
      if (body.status === 'published' && post.status !== 'published') {
        post.publishedAt = new Date();
      }
      post.status = body.status;
    }

    await post.save();
    return successResponse(post);
  })
);

export const DELETE = apiHandler(
  withAdmin(async (_req: NextRequest, context: any) => {
    await dbConnect();
    const { id } = await context.params;
    const post = await BlogPost.findByIdAndDelete(id);
    if (!post) return errorResponse('NOT_FOUND', 'Blog yazısı bulunamadı', 404);
    return successResponse({ message: 'Blog yazısı silindi' });
  })
);

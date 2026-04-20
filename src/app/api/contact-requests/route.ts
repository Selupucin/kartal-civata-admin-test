import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@/lib/db/mongoose';
import ContactRequest from '@/models/ContactRequest';

export const GET = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));

    const filter: any = {};
    if (status) filter.status = status;

    const requests = await ContactRequest.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    const total = await ContactRequest.countDocuments(filter);
    const newCount = await ContactRequest.countDocuments({ status: 'new' });

    return successResponse({ requests, total, newCount });
  })
);

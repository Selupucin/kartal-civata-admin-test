import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@shared/lib/db/mongoose';
import WholesaleApplication from '@shared/models/WholesaleApplication';

export const GET = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    const filter: any = {};
    if (status) filter.status = status;

    const applications = await WholesaleApplication.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'email firstName lastName')
      .lean();

    return successResponse(applications);
  })
);

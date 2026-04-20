import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import dbConnect from '@shared/lib/db/mongoose';
import User from '@shared/models/User';
import { logSystemError } from '@/lib/logger/systemLog';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const user = await User.findById(id).lean();
    if (!user) throw new NotFoundError('Kullanıcı bulunamadı');

    return successResponse(user);
  })
);

export const PUT = apiHandler(
  withAdmin(async (req: NextRequest, context) => {
    const { id } = await context!.params;
    const body = await req.json();
    await dbConnect();

    const updateData: any = {};
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.wholesaleInfo !== undefined) updateData.wholesaleInfo = body.wholesaleInfo;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!user) throw new NotFoundError('Kullanıcı bulunamadı');

    return successResponse(user);
  })
);

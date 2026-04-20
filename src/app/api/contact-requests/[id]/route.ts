import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import dbConnect from '@/lib/db/mongoose';
import ContactRequest from '@/models/ContactRequest';

export const PUT = apiHandler(
  withAdmin(async (req: NextRequest, context) => {
    const { id } = await context!.params;
    const body = await req.json();
    await dbConnect();

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.adminNote !== undefined) updateData.adminNote = body.adminNote;

    const request = await ContactRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!request) throw new NotFoundError('Talep bulunamadı');

    return successResponse(request);
  })
);

export const DELETE = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const request = await ContactRequest.findByIdAndDelete(id);
    if (!request) throw new NotFoundError('Talep bulunamadı');

    return successResponse({ message: 'Talep silindi' });
  })
);

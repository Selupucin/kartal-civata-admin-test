import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { withAdmin, AuthenticatedRequest } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import dbConnect from '@/lib/db/mongoose';
import WholesaleApplication from '@/models/WholesaleApplication';
import User from '@/models/User';
import { logSystemError } from '@/lib/logger/systemLog';

export const PUT = apiHandler(
  withAdmin(async (req: AuthenticatedRequest, context) => {
    const { id } = await context!.params;
    const body = await req.json();
    await dbConnect();

    const application = await WholesaleApplication.findById(id);
    if (!application) throw new NotFoundError('Başvuru bulunamadı');

    if (body.status === 'approved') {
      application.status = 'approved';
      application.reviewedBy = req.user!.id as any;
      application.reviewedAt = new Date();
      application.adminNotes = body.adminNotes || '';

      // Upgrade user role to wholesale
      await User.findByIdAndUpdate(application.userId, {
        $set: {
          role: 'wholesale',
          wholesaleInfo: {
            companyName: application.companyName,
            taxNumber: application.taxNumber,
            taxOffice: application.taxOffice,
            approvedAt: new Date(),
            approvedBy: req.user!.id,
          },
        },
      });
    } else if (body.status === 'rejected') {
      application.status = 'rejected';
      application.reviewedBy = req.user!.id as any;
      application.reviewedAt = new Date();
      application.rejectionReason = body.rejectionReason || '';
      application.adminNotes = body.adminNotes || '';
    }

    await application.save();

    // Log wholesale application decision
    logSystemError({
      level: 'info',
      source: 'admin',
      message: `Toptan başvuru ${application.status === 'approved' ? 'onaylandı' : 'reddedildi'}: ${application.companyName}`,
      path: `/api/wholesale/${id}`,
      method: 'PUT',
      userId: req.user!.id,
      metadata: { action: 'wholesale_review', applicationId: id, status: application.status, companyName: application.companyName },
    });

    return successResponse(application);
  })
);

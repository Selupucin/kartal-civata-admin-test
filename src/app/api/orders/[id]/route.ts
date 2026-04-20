import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { withAdmin, AuthenticatedRequest } from '@/lib/api/middleware';
import { NotFoundError } from '@/lib/errors';
import { ORDER_STATUS_FLOW } from '@/constants/orderStatus';
import { OrderStatus } from '@/types';
import dbConnect from '@/lib/db/mongoose';
import Order from '@/models/Order';
import { logSystemError } from '@/lib/logger/systemLog';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest, context) => {
    const { id } = await context!.params;
    await dbConnect();

    const order = await Order.findById(id).select('+adminNote').lean();
    if (!order) throw new NotFoundError('Sipariş bulunamadı');

    return successResponse(order);
  })
);

export const PUT = apiHandler(
  withAdmin(async (req: AuthenticatedRequest, context) => {
    const { id } = await context!.params;
    const body = await req.json();
    await dbConnect();

    const order = await Order.findById(id);
    if (!order) throw new NotFoundError('Sipariş bulunamadı');

    // Status update
    if (body.status) {
      const currentStatus = order.status as OrderStatus;
      const allowedNextStatuses = ORDER_STATUS_FLOW[currentStatus] || [];

      if (!allowedNextStatuses.includes(body.status as OrderStatus)) {
        throw new NotFoundError(`Bu sipariş "${body.status}" durumuna geçirilemez`);
      }

      order.statusHistory.push({
        from: order.status,
        to: body.status,
        changedBy: req.user!.id as any,
        changedAt: new Date(),
        note: body.note || '',
      });
      order.status = body.status;

      // Handle shipping info
      if (body.status === 'shipped') {
        order.shipping = {
          ...order.shipping,
          carrier: body.carrier || order.shipping?.carrier,
          trackingNumber: body.trackingNumber || order.shipping?.trackingNumber,
          trackingUrl: body.trackingUrl || order.shipping?.trackingUrl,
          shippedAt: new Date(),
        } as any;
      }

      if (body.status === 'delivered') {
        if (order.shipping) {
          order.shipping.deliveredAt = new Date();
        }
      }
    }

    // Admin note
    if (body.adminNote !== undefined) {
      order.adminNote = body.adminNote;
    }

    await order.save();

    return successResponse(order);
  })
);

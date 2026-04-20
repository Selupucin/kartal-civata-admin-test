import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@shared/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@shared/lib/db/mongoose';
import Order from '@shared/models/Order';

export const GET = apiHandler(
  withAdmin(async (req: NextRequest) => {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'monthly'; // daily, weekly, monthly, yearly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter: any = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      switch (range) {
        case 'daily':
          dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30) } };
          break;
        case 'weekly':
          dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()) } };
          break;
        case 'monthly':
          dateFilter = { createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } };
          break;
        case 'yearly':
          dateFilter = { createdAt: { $gte: new Date(now.getFullYear() - 5, 0, 1) } };
          break;
      }
    }

    let groupFormat: any;
    switch (range) {
      case 'daily':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        break;
      case 'monthly':
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      case 'yearly':
        groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const [revenueData, orderStatusData, orderCountData] = await Promise.all([
      // Revenue over time
      Order.aggregate([
        { $match: { ...dateFilter, 'payment.status': 'paid' } },
        {
          $group: {
            _id: groupFormat,
            revenue: { $sum: '$summary.grandTotal' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Order status distribution
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Total orders over time
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: groupFormat,
            count: { $sum: 1 },
            revenue: { $sum: '$summary.grandTotal' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return successResponse({
      revenueData: revenueData.map((d: any) => ({ date: d._id, revenue: d.revenue, orders: d.count })),
      orderStatusData: orderStatusData.map((d: any) => ({ status: d._id, count: d.count })),
      orderCountData: orderCountData.map((d: any) => ({ date: d._id, count: d.count, revenue: d.revenue })),
    });
  })
);

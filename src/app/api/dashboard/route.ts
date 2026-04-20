import { NextRequest } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { successResponse } from '@/lib/api/response';
import { withAdmin } from '@/lib/api/middleware';
import dbConnect from '@/lib/db/mongoose';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import WholesaleApplication from '@/models/WholesaleApplication';
import SiteSettings from '@/models/SiteSettings';

export const GET = apiHandler(
  withAdmin(async (_req: NextRequest) => {
    await dbConnect();

    const settings = await SiteSettings.findOne().lean();
    const globalThreshold = settings?.defaultLowStockThreshold || 10;

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      pendingWholesale,
      lowStockProducts,
      recentOrders,
      recentUsers,
      revenue,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      WholesaleApplication.countDocuments({ status: 'pending' }),
      Product.countDocuments({ stock: { $lte: globalThreshold }, status: 'active' }),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).select('email firstName lastName role createdAt').lean(),
      Order.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$summary.grandTotal' } } },
      ]),
    ]);

    return successResponse({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        pendingWholesale,
        lowStockProducts,
        totalRevenue: revenue[0]?.total || 0,
      },
      recentOrders,
      recentUsers,
    });
  })
);

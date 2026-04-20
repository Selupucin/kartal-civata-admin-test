'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/utils/format';
import { Users, Package, ShoppingCart, TrendingUp, AlertTriangle, Clock, ArrowUpRight, BarChart3, Calendar, Minimize2, Maximize2, TrendingUp as TrendingIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ORDER_STATUS_MAP } from '@/constants/orderStatus';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#6366f1',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
  refunded: '#6b7280',
};

export default function DashboardPage() {
  const router = useRouter();
  const [revenueRange, setRevenueRange] = useState('monthly');
  const [revenueCustomStart, setRevenueCustomStart] = useState('');
  const [revenueCustomEnd, setRevenueCustomEnd] = useState('');
  const [revenueExpanded, setRevenueExpanded] = useState(true);

  const [orderRange, setOrderRange] = useState('monthly');
  const [orderCustomStart, setOrderCustomStart] = useState('');
  const [orderCustomEnd, setOrderCustomEnd] = useState('');
  const [orderExpanded, setOrderExpanded] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Dashboard verisi yüklenemedi');
      return res.json();
    },
  });

  const revenueParams = new URLSearchParams({ range: revenueRange });
  if (revenueRange === 'custom' && revenueCustomStart && revenueCustomEnd) {
    revenueParams.set('startDate', revenueCustomStart);
    revenueParams.set('endDate', revenueCustomEnd);
  }

  const { data: revenueChartData } = useQuery({
    queryKey: ['dashboard-revenue-chart', revenueRange, revenueCustomStart, revenueCustomEnd],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/charts?${revenueParams}`);
      if (!res.ok) throw new Error('Gelir grafik verisi yüklenemedi');
      return res.json();
    },
  });

  const orderParams = new URLSearchParams({ range: orderRange });
  if (orderRange === 'custom' && orderCustomStart && orderCustomEnd) {
    orderParams.set('startDate', orderCustomStart);
    orderParams.set('endDate', orderCustomEnd);
  }

  const { data: orderChartData } = useQuery({
    queryKey: ['dashboard-order-chart', orderRange, orderCustomStart, orderCustomEnd],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/charts?${orderParams}`);
      if (!res.ok) throw new Error('Sipariş grafik verisi yüklenemedi');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = data?.data?.stats || {};
  const recentOrders = data?.data?.recentOrders || [];
  const recentUsers = data?.data?.recentUsers || [];

  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats.totalUsers || 0, icon: Users, gradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-600' },
    { label: 'Toplam Ürün', value: stats.totalProducts || 0, icon: Package, gradient: 'from-emerald-500 to-emerald-600', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
    { label: 'Toplam Sipariş', value: stats.totalOrders || 0, icon: ShoppingCart, gradient: 'from-violet-500 to-violet-600', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-600' },
    { label: 'Toplam Gelir', value: formatPrice(stats.totalRevenue || 0), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-600' },
  ];

  const alertCards = [
    { label: 'Bekleyen Siparişler', value: stats.pendingOrders || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-gradient-to-br from-orange-50 to-amber-50', border: 'border-orange-100', href: '/siparisler?status=pending' },
    { label: 'Şirket Başvuruları', value: stats.pendingWholesale || 0, icon: Clock, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-blue-100', href: '/toptan-basvurular' },
    { label: 'Düşük Stok', value: stats.lowStockProducts || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-gradient-to-br from-red-50 to-rose-50', border: 'border-red-100', href: '/urunler?lowStock=true' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, gradient, iconBg, iconColor }, i) => (
          <div
            key={label}
            className={`group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60 transition-all duration-300 hover:shadow-md hover:ring-slate-300/60 animate-fade-in stagger-${i + 1}`}
            style={{ opacity: 0 }}
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] transition-transform duration-500 group-hover:scale-150`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-800">{value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts - Clickable */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alertCards.map(({ label, value, icon: Icon, color, bg, border, href }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={`flex items-center gap-4 rounded-2xl ${bg} ${border} border p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] text-left`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
            <ArrowUpRight className={`h-4 w-4 ${color} opacity-50`} />
          </button>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Gelir Grafiği
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { value: 'daily', label: 'Günlük' },
                { value: 'weekly', label: 'Haftalık' },
                { value: 'monthly', label: 'Aylık' },
                { value: 'yearly', label: 'Yıllık' },
                { value: 'custom', label: 'Özel' },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRevenueRange(r.value)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    revenueRange === r.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRevenueExpanded(!revenueExpanded)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title={revenueExpanded ? 'Küçült' : 'Büyüt'}
            >
              {revenueExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {revenueExpanded && (
          <>
            {revenueRange === 'custom' && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={revenueCustomStart}
                    onChange={(e) => setRevenueCustomStart(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-400">—</span>
                <input
                  type="date"
                  value={revenueCustomEnd}
                  onChange={(e) => setRevenueCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenueChartData?.data?.revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR')}`, 'Gelir']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium text-slate-500">Sipariş Durumları</p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={(revenueChartData?.data?.orderStatusData || []).map((d: any) => ({
                        ...d,
                        name: ORDER_STATUS_MAP[d.status as keyof typeof ORDER_STATUS_MAP]?.label || d.status,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {(revenueChartData?.data?.orderStatusData || []).map((d: any, i: number) => (
                        <Cell key={i} fill={STATUS_COLORS[d.status] || '#6b7280'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [value, name]}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={40}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Order Count Chart */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ShoppingCart className="h-4 w-4 text-violet-500" />
            Sipariş Sayısı Trendi
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { value: 'daily', label: 'Günlük' },
                { value: 'weekly', label: 'Haftalık' },
                { value: 'monthly', label: 'Aylık' },
                { value: 'yearly', label: 'Yıllık' },
                { value: 'custom', label: 'Özel' },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setOrderRange(r.value)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    orderRange === r.value
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setOrderExpanded(!orderExpanded)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title={orderExpanded ? 'Küçült' : 'Büyüt'}
            >
              {orderExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {orderExpanded && (
          <>
            {orderRange === 'custom' && (
              <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={orderCustomStart}
                    onChange={(e) => setOrderCustomStart(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-400">—</span>
                <input
                  type="date"
                  value={orderCustomEnd}
                  onChange={(e) => setOrderCustomEnd(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={orderChartData?.data?.orderCountData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Sipariş" />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Recent Data */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Son Siparişler</h2>
            <button onClick={() => router.push('/siparisler')} className="flex items-center gap-1 text-xs font-medium text-blue-600 cursor-pointer transition-colors hover:text-blue-700">
              Tümünü Gör <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ShoppingCart className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">Henüz sipariş bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((order: any) => (
                <div key={order._id} className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3.5 transition-colors hover:bg-slate-100/80">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{order.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{order.userSnapshot?.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{formatPrice(order.summary?.grandTotal || 0)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Son Kayıtlar</h2>
            <button onClick={() => router.push('/kullanicilar')} className="flex items-center gap-1 text-xs font-medium text-blue-600 cursor-pointer transition-colors hover:text-blue-700">
              Tümünü Gör <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          {recentUsers.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Users className="mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm text-slate-400">Henüz yeni kayıt bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentUsers.map((user: any) => (
                <div key={user._id} className="flex items-center justify-between rounded-xl bg-slate-50/80 p-3.5 transition-colors hover:bg-slate-100/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{user.firstName} {user.lastName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                      {user.role}
                    </span>
                    <p className="mt-1.5 text-xs text-slate-400">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

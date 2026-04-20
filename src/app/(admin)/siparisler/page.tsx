'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Badge, Spinner } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/utils/format';
import { ORDER_STATUS_MAP, ORDER_STATUS_FLOW } from '@/constants/orderStatus';
import { OrderStatus } from '@/types';
import { ShoppingCart, Eye, Search, MapPin, Phone, Mail, Truck, Clock, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

const statusBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'default',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default',
};

// Forward flow order for determining direction
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function AdminOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [shippingForm, setShippingForm] = useState<{ carrier: string; trackingNumber: string; trackingUrl: string } | null>(null);
  const [shippingFormError, setShippingFormError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error('Siparişler yüklenemedi');
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note, carrier, trackingNumber, trackingUrl }: { id: string; status: string; note?: string; carrier?: string; trackingNumber?: string; trackingUrl?: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note, carrier, trackingNumber, trackingUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Durum güncelleme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);
      setShippingForm(null);
      setShippingFormError('');
    },
  });

  const handleStatusChange = (nextStatus: string) => {
    if (!selectedOrder) return;
    if (nextStatus === 'shipped') {
      setShippingForm({ carrier: '', trackingNumber: '', trackingUrl: '' });
      setShippingFormError('');
      return;
    }
    updateStatusMutation.mutate({ id: selectedOrder._id, status: nextStatus });
  };

  const handleShippingSubmit = () => {
    if (!selectedOrder || !shippingForm) return;
    if (!shippingForm.carrier.trim()) return setShippingFormError('Kargo firması zorunludur');
    if (!shippingForm.trackingNumber.trim()) return setShippingFormError('Takip numarası zorunludur');
    setShippingFormError('');
    updateStatusMutation.mutate({
      id: selectedOrder._id,
      status: 'shipped',
      carrier: shippingForm.carrier.trim(),
      trackingNumber: shippingForm.trackingNumber.trim(),
      trackingUrl: shippingForm.trackingUrl.trim() || undefined,
    });
  };

  const orders = data?.data || [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri adı veya sipariş no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat pl-4 pr-10 py-2.5 text-sm text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(ORDER_STATUS_MAP).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Sipariş No</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Müşteri</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Tutar</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ödeme</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Tarih</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center"><Spinner size="lg" /></td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Sipariş bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              orders
              .filter((order: any) => {
                if (!search) return true;
                const s = search.toLowerCase();
                const name = `${order.userId?.firstName || ''} ${order.userId?.lastName || ''}`.toLowerCase();
                const orderNo = (order.orderNumber || order._id || '').toLowerCase();
                return name.includes(s) || orderNo.includes(s);
              })
              .map((order: any) => (
                <tr key={order._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{order.orderNumber}</td>
                  <td className="px-5 py-3.5 text-slate-600">{order.userSnapshot?.fullName || '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{formatPrice(order.summary?.grandTotal || 0)}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={order.payment?.status === 'paid' ? 'success' : 'warning'}>
                      {order.payment?.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusBadgeVariant[order.status] || 'default'}>
                      {ORDER_STATUS_MAP[order.status as OrderStatus]?.label || order.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setSelectedOrder(order)} className="rounded-lg p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600" title="Detay">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => { setSelectedOrder(null); setShippingForm(null); setShippingFormError(''); }}
        title={`Sipariş: ${selectedOrder?.orderNumber || ''}`}
        size="xl"
        footer={
          selectedOrder && (ORDER_STATUS_FLOW[selectedOrder.status as OrderStatus] || []).length > 0 ? (
            <div className="flex w-full flex-col gap-3">
              {/* Shipping Form */}
              {shippingForm && (
                <div className="w-full space-y-3 rounded-xl bg-blue-50 p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                    <Truck className="h-3.5 w-3.5" /> Kargo Bilgileri
                  </p>
                  {shippingFormError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{shippingFormError}</div>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Kargo Firması <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={shippingForm.carrier}
                        onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value })}
                        placeholder="Yurtiçi Kargo, Aras..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Takip Numarası <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={shippingForm.trackingNumber}
                        onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                        placeholder="Kargo takip no"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Takip URL</label>
                      <input
                        type="text"
                        value={shippingForm.trackingUrl}
                        onChange={(e) => setShippingForm({ ...shippingForm, trackingUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setShippingForm(null); setShippingFormError(''); }}>İptal</Button>
                    <Button size="sm" isLoading={updateStatusMutation.isPending} onClick={handleShippingSubmit}>Kargoya Ver</Button>
                  </div>
                </div>
              )}
              {/* Status Buttons */}
              {!shippingForm && (
                <div className="flex w-full items-center gap-2">
                  <span className="mr-auto text-sm font-medium text-slate-500">Durum Güncelle:</span>
                  {(ORDER_STATUS_FLOW[selectedOrder.status as OrderStatus] || []).map((nextStatus) => {
                    const currentIdx = STATUS_ORDER.indexOf(selectedOrder.status);
                    const nextIdx = STATUS_ORDER.indexOf(nextStatus);
                    const isReverse = nextIdx >= 0 && currentIdx >= 0 && nextIdx < currentIdx;
                    const isCancelled = nextStatus === 'cancelled';
                    return (
                      <Button
                        key={nextStatus}
                        size="sm"
                        variant={isCancelled ? 'danger' : isReverse ? 'outline' : 'primary'}
                        isLoading={updateStatusMutation.isPending}
                        onClick={() => handleStatusChange(nextStatus)}
                      >
                        {isReverse && <ArrowLeft className="mr-1 h-3.5 w-3.5" />}
                        {ORDER_STATUS_MAP[nextStatus]?.label || nextStatus}
                        {!isReverse && !isCancelled && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge variant={statusBadgeVariant[selectedOrder.status] || 'default'}>
                {ORDER_STATUS_MAP[selectedOrder.status as OrderStatus]?.label || selectedOrder.status}
              </Badge>
              <span className="text-xs text-slate-400">{formatDate(selectedOrder.createdAt)}</span>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> Müşteri Bilgileri
                </p>
                <p className="text-sm font-medium text-slate-700">{selectedOrder.userSnapshot?.fullName}</p>
                <p className="text-xs text-slate-500">{selectedOrder.userSnapshot?.email}</p>
                {selectedOrder.userSnapshot?.phone && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" /> {selectedOrder.userSnapshot.phone}
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ödeme Özeti</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Ara Toplam</span>
                    <span>{formatPrice(selectedOrder.summary?.subtotal || 0)}</span>
                  </div>
                  {(selectedOrder.summary?.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>İndirim</span>
                      <span>-{formatPrice(selectedOrder.summary.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>KDV</span>
                    <span>{formatPrice(selectedOrder.summary?.taxTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Kargo</span>
                    <span>{formatPrice(selectedOrder.summary?.shippingCost || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-800">
                    <span>Toplam</span>
                    <span>{formatPrice(selectedOrder.summary?.grandTotal || 0)}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={selectedOrder.payment?.status === 'paid' ? 'success' : 'warning'}>
                    {selectedOrder.payment?.status === 'paid' ? 'Ödendi' : 'Ödeme Bekliyor'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {selectedOrder.shipping?.address && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Teslimat Adresi
                </p>
                <p className="text-sm text-slate-700">
                  {selectedOrder.shipping.address.fullName}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedOrder.shipping.address.addressLine1}
                  {selectedOrder.shipping.address.addressLine2 && `, ${selectedOrder.shipping.address.addressLine2}`}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedOrder.shipping.address.district && `${selectedOrder.shipping.address.district}, `}
                  {selectedOrder.shipping.address.city} {selectedOrder.shipping.address.postalCode}
                </p>
              </div>
            )}

            {/* Cargo Info */}
            {selectedOrder.shipping?.carrier && (
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
                  <Truck className="h-3.5 w-3.5" /> Kargo Bilgileri
                </p>
                <div className="text-sm text-slate-700">
                  <p><span className="font-medium">Kargo Firması:</span> {selectedOrder.shipping.carrier}</p>
                  {selectedOrder.shipping.trackingNumber && (
                    <p><span className="font-medium">Takip No:</span> {selectedOrder.shipping.trackingNumber}</p>
                  )}
                  {selectedOrder.shipping.shippedAt && (
                    <p className="text-xs text-slate-500 mt-1">Gönderim: {formatDate(selectedOrder.shipping.shippedAt)}</p>
                  )}
                  {selectedOrder.shipping.deliveredAt && (
                    <p className="text-xs text-slate-500">Teslim: {formatDate(selectedOrder.shipping.deliveredAt)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="h-3.5 w-3.5" /> Ürünler ({selectedOrder.items?.length || 0})
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.productSnapshot?.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} adet x {formatPrice(item.unitPrice)}
                        {item.productSnapshot?.sku && <span className="ml-2 text-slate-400">SKU: {item.productSnapshot.sku}</span>}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> Durum Geçmişi
                </p>
                <div className="space-y-2">
                  {selectedOrder.statusHistory.map((history: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">{ORDER_STATUS_MAP[history.from as OrderStatus]?.label || history.from}</span>
                          {' → '}
                          <span className="font-medium">{ORDER_STATUS_MAP[history.to as OrderStatus]?.label || history.to}</span>
                        </p>
                        {history.note && <p className="text-xs text-slate-400 mt-0.5">{history.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDate(history.changedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Badge, Spinner } from '@shared/components/ui';
import { formatDate } from '@shared/lib/utils/format';
import { Ticket, Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface CouponForm {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '0',
  maxDiscountAmount: '',
  usageLimit: '',
  perUserLimit: '1',
  isActive: true,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
};

export default function AdminCouponsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await fetch('/api/coupons');
      if (!res.ok) throw new Error('Kuponlar yüklenemedi');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: CouponForm) => {
      const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minOrderAmount: formData.minOrderAmount || 0,
          maxDiscountAmount: formData.maxDiscountAmount || null,
          usageLimit: formData.usageLimit || null,
          perUserLimit: formData.perUserLimit || 1,
          isActive: formData.isActive,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'İşlem başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      closeModal();
      toast.success(editingId ? 'Kupon güncellendi' : 'Kupon oluşturuldu');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setDeleteConfirm(null);
      toast.success('Kupon silindi');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (coupon: any) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount || 0),
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      perUserLimit: String(coupon.perUserLimit || 1),
      isActive: coupon.isActive,
      startDate: new Date(coupon.startDate).toISOString().slice(0, 16),
      endDate: new Date(coupon.endDate).toISOString().slice(0, 16),
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.code.trim()) return setError('Kupon kodu zorunludur');
    if (!form.discountValue || Number(form.discountValue) <= 0) return setError('Geçerli bir indirim değeri giriniz');
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) return setError('Yüzde 100\'den fazla indirim uygulanamaz');
    saveMutation.mutate(form);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kupon kodu kopyalandı');
  };

  const coupons = data?.data || [];
  const updateField = (field: keyof CouponForm, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const isExpired = (endDate: string) => new Date(endDate) < new Date();
  const isNotStarted = (startDate: string) => new Date(startDate) > new Date();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Kupon Yönetimi</h2>
          <p className="mt-1 text-sm text-slate-400">{coupons.length} kupon</p>
        </div>
        <Button
          size="sm"
          className="flex items-center gap-2 rounded-xl! shadow-sm!"
          onClick={() => { setForm(emptyForm); setEditingId(null); setError(''); setShowModal(true); }}
        >
          <Plus className="h-4 w-4" />
          Yeni Kupon
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Kupon Kodu</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">İndirim</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Kullanım</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Geçerlilik</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center"><Spinner size="lg" /></td></tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <Ticket className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Henüz kupon bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              coupons.map((coupon: any) => (
                <tr key={coupon._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700">{coupon.code}</span>
                      <button onClick={() => copyCode(coupon.code)} className="text-slate-300 cursor-pointer hover:text-slate-500" title="Kopyala">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {coupon.description && <p className="mt-1 text-xs text-slate-400">{coupon.description}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-slate-700">
                      {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : `${coupon.discountValue}₺`}
                    </span>
                    {coupon.minOrderAmount > 0 && (
                      <p className="text-xs text-slate-400">Min: {coupon.minOrderAmount}₺</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    <div>{formatDate(coupon.startDate)}</div>
                    <div>{formatDate(coupon.endDate)}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    {!coupon.isActive ? (
                      <Badge variant="error">Pasif</Badge>
                    ) : isExpired(coupon.endDate) ? (
                      <Badge variant="warning">Süresi Dolmuş</Badge>
                    ) : isNotStarted(coupon.startDate) ? (
                      <Badge variant="default">Başlamadı</Badge>
                    ) : (
                      <Badge variant="success">Aktif</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(coupon)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Düzenle">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(coupon._id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Sil">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Kuponu Düzenle' : 'Yeni Kupon Oluştur'}
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>İptal</Button>
            <Button type="submit" form="coupon-form" isLoading={saveMutation.isPending}>{editingId ? 'Güncelle' : 'Kupon Oluştur'}</Button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Kupon Kodu <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="Ör: YAZ2025"
                disabled={!!editingId}
                className="w-full rounded-lg border px-4 py-2.5 text-sm font-mono uppercase focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Açıklama</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Yaz kampanyası indirimi"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">İndirim Tipi <span className="text-red-500">*</span></label>
              <select
                value={form.discountType}
                onChange={(e) => updateField('discountType', e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit Tutar (₺)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                İndirim Değeri {form.discountType === 'percentage' ? '(%)' : '(₺)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={form.discountType === 'percentage' ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => updateField('discountValue', e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Min. Sipariş Tutarı (₺)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => updateField('minOrderAmount', e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Maks. İndirim Tutarı (₺)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.maxDiscountAmount}
                onChange={(e) => updateField('maxDiscountAmount', e.target.value)}
                placeholder="Sınırsız"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Toplam Kullanım Limiti</label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => updateField('usageLimit', e.target.value)}
                placeholder="Sınırsız"
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kişi Başı Limit</label>
              <input
                type="number"
                min="1"
                value={form.perUserLimit}
                onChange={(e) => updateField('perUserLimit', e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Başlangıç Tarihi</label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bitiş Tarihi</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-0.5 after:top-[20.5fter:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium text-slate-700">Kupon Aktif</span>
          </div>

        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Kuponu Sil"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>İptal</Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}>Sil</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Bu kuponu silmek istediğinize emin misiniz?</p>
      </Modal>
    </div>
  );
}

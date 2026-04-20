'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Modal, Badge, Spinner } from '@/components/ui';
import { formatPrice, formatDate } from '@/lib/utils/format';
import { Package, Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';

interface ProductForm {
  name: string;
  sku: string;
  description: string;
  retailPrice: string;
  wholesalePrice: string;
  salePrice: string;
  saleStartDate: string;
  saleEndDate: string;
  stock: string;
  status: string;
  categoryId: string;
}

const emptyForm: ProductForm = {
  name: '',
  sku: '',
  description: '',
  retailPrice: '',
  wholesalePrice: '',
  salePrice: '',
  saleStartDate: '',
  saleEndDate: '',
  stock: '0',
  status: 'active',
  categoryId: '',
};

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  draft: 'warning',
  inactive: 'error',
  archived: 'default',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  draft: 'Taslak',
  inactive: 'Pasif',
  archived: 'Arşiv',
};

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const lowStock = searchParams.get('lowStock') === 'true';
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, lowStock],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (lowStock) params.set('lowStock', 'true');
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('Ürünler yüklenemedi');
      return res.json();
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Kategoriler yüklenemedi');
      return res.json();
    },
  });
  const categories = categoriesData?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (formData: ProductForm) => {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          retailPrice: formData.retailPrice,
          wholesalePrice: formData.wholesalePrice || formData.retailPrice,
          salePrice: formData.salePrice || undefined,
          saleStartDate: formData.saleStartDate || undefined,
          saleEndDate: formData.saleEndDate || undefined,
          stock: formData.stock,
          status: formData.status,
          categoryId: formData.categoryId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'İşlem başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Silme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteConfirm(null);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (product: any) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      retailPrice: String(product.pricing?.retailPrice || ''),
      wholesalePrice: String(product.pricing?.wholesalePrice || ''),
      salePrice: product.pricing?.salePrice ? String(product.pricing.salePrice) : '',
      saleStartDate: product.pricing?.saleStartDate ? new Date(product.pricing.saleStartDate).toISOString().slice(0, 16) : '',
      saleEndDate: product.pricing?.saleEndDate ? new Date(product.pricing.saleEndDate).toISOString().slice(0, 16) : '',
      stock: String(product.stock || 0),
      status: product.status || 'active',
      categoryId: product.categoryId || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Ürün adı zorunludur');
    if (!form.sku.trim()) return setError('SKU zorunludur');
    if (!form.retailPrice || Number(form.retailPrice) <= 0) return setError('Geçerli bir fiyat giriniz');
    saveMutation.mutate(form);
  };

  const products = data?.data || [];

  const updateField = (field: keyof ProductForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün ara..."
              className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={() => {
              const newParams = new URLSearchParams(searchParams.toString());
              if (lowStock) {
                newParams.delete('lowStock');
              } else {
                newParams.set('lowStock', 'true');
              }
              router.push(`/urunler?${newParams.toString()}`);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
              lowStock
                ? 'bg-red-600 text-white shadow-sm hover:bg-red-700'
                : 'border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Düşük Stok
          </button>
        </div>
        <Button
          size="sm"
          className="flex items-center gap-2 rounded-xl! shadow-sm!"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setError('');
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün
        </Button>
      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ürün Adı</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Fiyat</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Stok</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Eklenme</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Spinner size="lg" />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <Package className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Henüz ürün bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              products.map((product: any) => (
                <tr key={product._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-medium text-slate-700">{product.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">{product.sku}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{formatPrice(product.pricing?.retailPrice || 0)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${product.stock <= 10 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusColors[product.status] || 'default'}>
                      {statusLabels[product.status] || product.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {product.createdAt ? formatDate(product.createdAt) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(product)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Düzenle">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(product._id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Sil">
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
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
        size="xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>İptal</Button>
            <Button type="submit" form="product-form" isLoading={saveMutation.isPending}>{editingId ? 'Güncelle' : 'Ürünü Kaydet'}</Button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Ürün Adı <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ör: M8x40 DIN 933 Cıvata" className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">SKU <span className="text-red-500">*</span></label>
                <input type="text" value={form.sku} onChange={(e) => updateField('sku', e.target.value.toUpperCase())} placeholder="Ör: CIV-M8X40" className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Durum</label>
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="active">Aktif</option>
                  <option value="draft">Taslak</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kategori</label>
              <select value={form.categoryId} onChange={(e) => updateField('categoryId', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option value="">Kategori seçiniz...</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.parentId ? `└ ${cat.name}` : cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Açıklama</label>
              <textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Fiyatlandırma</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Perakende Fiyat (₺) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" value={form.retailPrice} onChange={(e) => updateField('retailPrice', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Toptan Fiyat (₺)</label>
                <input type="number" step="0.01" min="0" value={form.wholesalePrice} onChange={(e) => updateField('wholesalePrice', e.target.value)} placeholder="Boşsa perakende" className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">İndirimli Fiyat (₺)</label>
                <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => updateField('salePrice', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            {form.salePrice && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">İndirim Başlangıç</label>
                  <input type="datetime-local" value={form.saleStartDate} onChange={(e) => updateField('saleStartDate', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">İndirim Bitiş</label>
                  <input type="datetime-local" value={form.saleEndDate} onChange={(e) => updateField('saleEndDate', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            )}
            {form.salePrice && form.retailPrice && Number(form.retailPrice) > 0 && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-700">İndirim Oranı</span>
                  <span className="font-bold text-orange-700">%{Math.round((1 - Number(form.salePrice) / Number(form.retailPrice)) * 100)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-200">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${Math.round((1 - Number(form.salePrice) / Number(form.retailPrice)) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Stok Adedi</label>
            <input type="number" min="0" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} className="w-full max-w-50 rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Ürünü Sil"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>İptal</Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}>Sil</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
      </Modal>
    </div>
  );
}

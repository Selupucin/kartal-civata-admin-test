'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderTree, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button, Modal, Badge, Spinner } from '@shared/components/ui';
import { formatDate } from '@shared/lib/utils/format';

interface CategoryForm {
  name: string;
  description: string;
  parentId: string;
  isActive: boolean;
}

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  parentId: '',
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Kategoriler yüklenemedi');
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: CategoryForm) => {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          parentId: formData.parentId || undefined,
          isActive: formData.isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'İşlem başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      closeModal();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Silme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteConfirm(null);
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (cat: any) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      parentId: cat.parentId || '',
      isActive: cat.isActive !== false,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Kategori adı zorunludur');
    saveMutation.mutate(form);
  };

  const categories = data?.data || [];

  const updateField = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kategori ara..."
              className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <Button
          size="sm"
          className="flex items-center gap-2 !rounded-xl !shadow-sm"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setError('');
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Yeni Kategori
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Kategori Adı</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Slug</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ürün Sayısı</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Eklenme</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center"><Spinner size="lg" /></td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <FolderTree className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Henüz kategori bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              (categories as any[])
              .filter((cat: any) => !search || cat.name.toLowerCase().includes(search.toLowerCase()) || cat.slug?.toLowerCase().includes(search.toLowerCase()))
              .map((cat: any) => (
                <tr key={cat._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-medium text-slate-700">
                    {cat.parentId && <span className="mr-2 text-slate-300">└</span>}
                    {cat.name}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">{cat.slug}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{cat.productCount || 0}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={cat.isActive ? 'success' : 'error'}>
                      {cat.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{cat.createdAt ? formatDate(cat.createdAt) : '—'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(cat)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600" title="Düzenle">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!cat.isSystem && (
                        <button onClick={() => setDeleteConfirm(cat._id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal}>İptal</Button>
            <Button type="submit" form="category-form" isLoading={saveMutation.isPending}>{editingId ? 'Güncelle' : 'Kategoriyi Kaydet'}</Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium">Kategori Adı <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ör: Cıvata" className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Açıklama</label>
            <textarea rows={3} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Üst Kategori</label>
            <select value={form.parentId} onChange={(e) => updateField('parentId', e.target.value)} className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">Ana Kategori (Üst kategori yok)</option>
              {categories.filter((c: any) => !c.parentId && c._id !== editingId).map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm font-medium">Aktif</label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Kategoriyi Sil"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>İptal</Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}>Sil</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
      </Modal>
    </div>
  );
}

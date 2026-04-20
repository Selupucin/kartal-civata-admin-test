'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Button, Modal, Badge, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils/format';
import { ShieldCheck, Plus, Trash2, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface AdminForm {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
}

const emptyForm: AdminForm = { email: '', firstName: '', lastName: '', password: '', phone: '' };

export default function AdminManagementPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSuperAdmin;
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await fetch('/api/admins');
      if (!res.ok) throw new Error('Admin listesi yüklenemedi');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: AdminForm) => {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Admin oluşturma başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setShowModal(false);
      setForm(emptyForm);
      toast.success('Yeni admin başarıyla oluşturuldu');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admins/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Silme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setDeleteConfirm(null);
      toast.success('Admin başarıyla silindi');
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setDeleteConfirm(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.firstName || !form.lastName || !form.password) {
      return setError('Tüm alanlar zorunludur');
    }
    if (form.password.length < 6) {
      return setError('Şifre en az 6 karakter olmalıdır');
    }
    createMutation.mutate(form);
  };

  const admins = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Admin Yönetimi</h2>
          <p className="mt-1 text-sm text-slate-400">Yönetim paneline erişimi olan admin hesapları</p>
        </div>
        {isSuperAdmin && (
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              setForm(emptyForm);
              setError('');
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Yeni Admin
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Admin ekleme ve silme işlemleri sadece süper admin tarafından yapılabilir.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ad Soyad</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">E-posta</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Telefon</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Son Giriş</th>
              {isSuperAdmin && (
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlem</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center"><Spinner size="lg" /></td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Henüz admin bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              admins.map((admin: any) => (
                <tr key={admin._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                        {admin.firstName?.[0]}{admin.lastName?.[0]}
                      </div>
                      <span className="font-medium text-slate-700">{admin.firstName} {admin.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{admin.email}</td>
                  <td className="px-5 py-3.5 text-slate-500">{admin.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    {admin.isSuperAdmin ? (
                      <Badge variant="warning">
                        <Crown className="mr-1 inline h-3 w-3" />
                        Süper Admin
                      </Badge>
                    ) : (
                      <Badge variant="info">Admin</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Hiç giriş yapmadı'}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      {!admin.isSuperAdmin && (
                        <button
                          onClick={() => setDeleteConfirm(admin._id)}
                          className="rounded-lg p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Yeni Admin Ekle"
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>İptal</Button>
            <Button type="submit" form="admin-form" isLoading={createMutation.isPending}>Admin Oluştur</Button>
          </>
        }
      >
        <form id="admin-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Ad <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Soyad <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">E-posta <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Telefon</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Şifre <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="En az 6 karakter"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Admin Sil"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>İptal</Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}>Sil</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Bu admin hesabını silmek istediğinize emin misiniz?</p>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Modal, Spinner } from '@shared/components/ui';
import { formatDate } from '@shared/lib/utils/format';
import { Users, Search, Eye, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';

const roleLabels: Record<string, string> = {
  user: 'Perakende',
  wholesale: 'Toptan',
};

const roleBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  user: 'default',
  wholesale: 'info',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  suspended: 'Askıda',
  banned: 'Yasaklı',
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [wholesaleCompany, setWholesaleCompany] = useState('');
  const [wholesaleTaxNumber, setWholesaleTaxNumber] = useState('');
  const [wholesaleTaxOffice, setWholesaleTaxOffice] = useState('');
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error('Kullanıcılar yüklenemedi');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; role?: string; status?: string; wholesaleInfo?: any }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (selectedUser) {
        const updated = data?.data || null;
        setSelectedUser(updated);
        if (updated) {
          setEditRole(updated.role);
          setEditStatus(updated.status);
        }
      }
      setFormError('');
    },
  });

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setWholesaleCompany(user.wholesaleInfo?.companyName || '');
    setWholesaleTaxNumber(user.wholesaleInfo?.taxNumber || '');
    setWholesaleTaxOffice(user.wholesaleInfo?.taxOffice || '');
    setFormError('');
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setEditRole('');
    setEditStatus('');
    setWholesaleCompany('');
    setWholesaleTaxNumber('');
    setWholesaleTaxOffice('');
    setFormError('');
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    setFormError('');

    // Validate wholesale fields
    if (editRole === 'wholesale') {
      if (!wholesaleCompany.trim()) return setFormError('Toptan rol için şirket adı zorunludur');
      if (!wholesaleTaxNumber.trim()) return setFormError('Toptan rol için vergi numarası zorunludur');
      if (!wholesaleTaxOffice.trim()) return setFormError('Toptan rol için vergi dairesi zorunludur');
    }

    const updates: any = { id: selectedUser._id };
    if (editRole !== selectedUser.role) updates.role = editRole;
    if (editStatus !== selectedUser.status) updates.status = editStatus;

    if (editRole === 'wholesale') {
      updates.wholesaleInfo = {
        companyName: wholesaleCompany.trim(),
        taxNumber: wholesaleTaxNumber.trim(),
        taxOffice: wholesaleTaxOffice.trim(),
      };
    }

    updateMutation.mutate(updates);
  };

  const hasChanges = selectedUser && (
    editRole !== selectedUser.role ||
    editStatus !== selectedUser.status ||
    (editRole === 'wholesale' && (
      wholesaleCompany !== (selectedUser.wholesaleInfo?.companyName || '') ||
      wholesaleTaxNumber !== (selectedUser.wholesaleInfo?.taxNumber || '') ||
      wholesaleTaxOffice !== (selectedUser.wholesaleInfo?.taxOffice || '')
    ))
  );

  const users = (data?.data || []).filter((u: any) => u.role !== 'admin');

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kullanıcı ara..."
            className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pl-4 pr-10 py-2.5 text-sm text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Tüm Roller</option>
          <option value="user">Perakende</option>
          <option value="wholesale">Toptan</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ad Soyad</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">E-posta</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Kayıt Tarihi</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center"><Spinner size="lg" /></td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Kullanıcı bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span className="font-medium text-slate-700">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={roleBadgeVariant[user.role] || 'default'}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={user.status === 'active' ? 'success' : 'error'}>
                      {statusLabels[user.status] || user.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openUserModal(user)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail/Edit Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={closeUserModal}
        title="Kullanıcı Detayları"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeUserModal}>Kapat</Button>
            {hasChanges && (
              <Button
                isLoading={updateMutation.isPending}
                onClick={handleSaveUser}
              >
                Kaydet
              </Button>
            )}
          </>
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
            )}

            {/* User Avatar & Name */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <p className="flex items-center gap-1 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> {selectedUser.email}
                </p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <Shield className="h-3.5 w-3.5" /> Hesap Bilgileri
                </p>
                <div className="space-y-2 text-sm">
                  {selectedUser.phone && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedUser.phone}
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Kayıt: {formatDate(selectedUser.createdAt)}
                  </p>
                  {selectedUser.lastLoginAt && (
                    <p className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Son Giriş: {formatDate(selectedUser.lastLoginAt)}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">E-posta Doğrulama:</span>
                    <Badge variant={selectedUser.emailVerified ? 'success' : 'warning'}>
                      {selectedUser.emailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Rol & Durum Yönetimi</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Rol</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="user">Perakende</option>
                      <option value="wholesale">Toptan</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Durum</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="active">Aktif</option>
                      <option value="suspended">Askıda</option>
                      <option value="banned">Yasaklı</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            {selectedUser.addresses && selectedUser.addresses.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Adresler ({selectedUser.addresses.length})
                </p>
                <div className="space-y-2">
                  {selectedUser.addresses.map((addr: any, i: number) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-700">
                        {addr.title || `Adres ${i + 1}`}
                        {addr.isDefault && <span className="ml-2 text-xs text-blue-600">(Varsayılan)</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {addr.district && `${addr.district}, `}{addr.city} {addr.postalCode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wholesale Info - editable when role=wholesale */}
            {editRole === 'wholesale' && (
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600">Toptan Müşteri Bilgileri</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Şirket Adı <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={wholesaleCompany}
                      onChange={(e) => setWholesaleCompany(e.target.value)}
                      placeholder="Şirket adı"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Vergi Numarası <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={wholesaleTaxNumber}
                        onChange={(e) => setWholesaleTaxNumber(e.target.value)}
                        placeholder="Vergi numarası"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Vergi Dairesi <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={wholesaleTaxOffice}
                        onChange={(e) => setWholesaleTaxOffice(e.target.value)}
                        placeholder="Vergi dairesi"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

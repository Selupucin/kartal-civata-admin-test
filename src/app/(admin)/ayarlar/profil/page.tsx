'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Button, Spinner } from '@shared/components/ui';
import { User, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Güncelleme başarısız');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (user && data?.data?.user) {
        setUser({ ...user, ...data.data.user });
      }
      toast.success('Profil bilgileri güncellendi');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Şifre değiştirme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Şifre başarıyla güncellendi');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Yeni şifreler eşleşmiyor');
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error('Yeni şifre en az 6 karakter olmalıdır');
    }
    passwordMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Profil</h2>
        <p className="mt-1 text-sm text-slate-400">Kişisel bilgilerinizi güncelleyin</p>
      </div>

      {/* Profile Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <User className="h-4 w-4 text-blue-500" />
          Kişisel Bilgiler
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Ad</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Soyad</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">E-posta</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Telefon</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="0555 XXX XX XX"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => profileMutation.mutate()} isLoading={profileMutation.isPending} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </div>

      {/* Password Change */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Lock className="h-4 w-4 text-amber-500" />
          Şifre Değiştir
        </h3>
        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Mevcut Şifre</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Yeni Şifre</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="En az 6 karakter"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={passwordMutation.isPending} className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Şifre Değiştir
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

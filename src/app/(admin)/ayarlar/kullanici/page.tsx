'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Bell, Save } from 'lucide-react';
import { toast } from 'sonner';

const defaultNotifications = [
  { key: 'newOrder', label: 'Yeni Sipariş Bildirimi', desc: 'Yeni bir sipariş geldiğinde bildirim alın', checked: true },
  { key: 'wholesaleApp', label: 'Toptan Başvuru Bildirimi', desc: 'Yeni toptan başvuru geldiğinde bildirim alın', checked: true },
  { key: 'lowStock', label: 'Düşük Stok Uyarısı', desc: 'Stok belirli bir seviyenin altına düştüğünde bildirim alın', checked: true },
  { key: 'system', label: 'Sistem Bildirimleri', desc: 'Sistem güncellemeleri ve bakım bildirimleri', checked: false },
];

export default function UserSettingsPage() {
  const [notifications, setNotifications] = useState(defaultNotifications);

  // Load current preferences from profile
  useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) return null;
      const json = await res.json();
      const user = json.data?.user;
      if (user?.preferences?.adminNotifications) {
        const prefs = user.preferences.adminNotifications;
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            checked: prefs[n.key] !== undefined ? prefs[n.key] : n.checked,
          }))
        );
      }
      return user;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const adminNotifications: Record<string, boolean> = {};
      notifications.forEach((n) => {
        adminNotifications[n.key] = n.checked;
      });

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { adminNotifications },
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Kaydetme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Ayarlar kaydedildi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Kullanıcı Ayarları</h2>
          <p className="mt-1 text-sm text-slate-400">Bildirim tercihleri</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Kaydet
        </Button>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Bell className="h-4 w-4 text-violet-500" />
          Bildirim Tercihleri
        </h3>
        <div className="space-y-4">
          {notifications.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50/80 p-4">
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => {
                    const updated = [...notifications];
                    updated[i] = { ...updated[i], checked: !updated[i].checked };
                    setNotifications(updated);
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

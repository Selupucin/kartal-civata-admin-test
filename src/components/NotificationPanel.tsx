'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, ShoppingCart, Users, AlertTriangle, Info } from 'lucide-react';

const typeIcons: Record<string, any> = {
  order_status: ShoppingCart,
  new_wholesale_application: Users,
  low_stock: AlertTriangle,
  system: Info,
  wholesale_approved: Check,
  wholesale_rejected: AlertTriangle,
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const queryClient = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Bildirimler yüklenemedi');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'PUT' });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 animate-fade-in rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Bildirimler</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tümünü Oku
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">Bildirim bulunmuyor</p>
          </div>
        ) : (
          notifications.map((n: any) => {
            const Icon = typeIcons[n.type] || Info;
            return (
              <div
                key={n._id}
                className={`flex gap-3 border-b border-slate-50 px-4 py-3 transition-colors hover:bg-slate-50 ${
                  !n.isRead ? 'bg-blue-50/40' : ''
                }`}
                onClick={() => !n.isRead && markReadMutation.mutate(n._id)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <Icon className="h-4 w-4 text-slate-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-300">
                    {new Date(n.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

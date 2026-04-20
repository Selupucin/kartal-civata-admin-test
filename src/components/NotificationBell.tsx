'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';

export default function NotificationBell() {
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) return { data: { unreadCount: 0 } };
      return res.json();
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.data?.unreadCount || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Lock, Shield } from 'lucide-react';
import { APP_CONFIG } from '@/constants/config';

export default function ScreenLock() {
  const { user, isLocked, setLocked, isAuthenticated } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isAuthenticated || isLocked) return;
    timerRef.current = setTimeout(() => {
      setLocked(true);
    }, APP_CONFIG.screenLockTimeout);
  }, [isAuthenticated, isLocked, setLocked]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handler = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, resetTimer]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsUnlocking(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, password }),
      });

      if (res.ok) {
        setLocked(false);
        setPassword('');
        setError('');
        resetTimer();
      } else {
        setError('Şifre hatalı');
      }
    } catch {
      setError('Bir hata oluştu');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!isLocked || !isAuthenticated) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-xl">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Ekran Kilitli</h2>
          <p className="mt-2 text-sm text-slate-400">
            Devam etmek için şifrenizi girin
          </p>
          {user && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
              {error}
            </div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifrenizi girin..."
            autoFocus
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-center text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {isUnlocking ? (
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Kilidi Aç'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

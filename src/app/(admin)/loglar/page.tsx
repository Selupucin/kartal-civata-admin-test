'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from '@/components/ui';
import {
  ScrollText,
  AlertTriangle,
  AlertCircle,
  Info,
  Flame,
  Search,
  Trash2,
  CheckCircle,
  RefreshCw,
  Filter,
  X,
  Globe,
  Shield,
  Server,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemLog {
  _id: string;
  level: 'info' | 'warn' | 'error' | 'fatal';
  source: 'site' | 'admin' | 'api' | 'system';
  message: string;
  details?: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  resolvedAt?: string;
  createdAt: string;
}

const levelConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', label: 'Bilgi' },
  warn: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Uyarı' },
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Hata' },
  fatal: { icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700', label: 'Kritik' },
};

const sourceConfig = {
  site: { icon: Globe, label: 'Site', color: 'text-emerald-600' },
  admin: { icon: Shield, label: 'Admin', color: 'text-violet-600' },
  api: { icon: Server, label: 'API', color: 'text-blue-600' },
  system: { icon: Monitor, label: 'Sistem', color: 'text-slate-600' },
};

export default function LogsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [level, setLevel] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [resolved, setResolved] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Redirect non-super-admins
  if (user && !user.isSuperAdmin) {
    router.push('/dashboard');
    return null;
  }

  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', '50');
  if (level) params.set('level', level);
  if (source) params.set('source', source);
  if (search) params.set('search', search);
  if (resolved) params.set('resolved', resolved);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['system-logs', page, level, source, search, resolved],
    queryFn: async () => {
      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Loglar yüklenemedi');
      return res.json();
    },
  });

  const logs: SystemLog[] = data?.data?.logs || [];
  const stats = data?.data?.stats || { info: 0, warn: 0, error: 0, fatal: 0 };
  const meta = data?.data?.meta || { page: 1, total: 0, totalPages: 1 };

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/logs/${id}`, { method: 'PUT' });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Log çözüldü olarak işaretlendi');
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
    },
    onError: () => toast.error('İşlem başarısız'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Log silindi');
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
    },
    onError: () => toast.error('Silme başarısız'),
  });

  const clearOldMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/logs?olderThan=30', { method: 'DELETE' });
      if (!res.ok) throw new Error('Temizleme başarısız');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || 'Eski loglar temizlendi');
      queryClient.invalidateQueries({ queryKey: ['system-logs'] });
    },
    onError: () => toast.error('Temizleme başarısız'),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setLevel('');
    setSource('');
    setSearch('');
    setSearchInput('');
    setResolved('');
    setPage(1);
  };

  const hasFilters = level || source || search || resolved;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-violet-500" />
            Sistem Logları
          </h2>
          <p className="mt-1 text-sm text-slate-400">Sistem hataları ve olayları</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => refetch()} className="flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" />
            Yenile
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('30 günden eski loglar silinecek. Emin misiniz?')) {
                clearOldMutation.mutate();
              }
            }}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
            isLoading={clearOldMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Eski Logları Temizle
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['info', 'warn', 'error', 'fatal'] as const).map((lvl) => {
          const config = levelConfig[lvl];
          const Icon = config.icon;
          return (
            <button
              key={lvl}
              onClick={() => { setLevel(level === lvl ? '' : lvl); setPage(1); }}
              className={`flex items-center gap-3 rounded-xl p-4 transition-all cursor-pointer ring-1 ${
                level === lvl
                  ? `${config.bg} ring-2 ring-current ${config.color}`
                  : 'bg-white ring-slate-200/60 hover:ring-slate-300'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-slate-800">{stats[lvl]}</p>
                <p className="text-xs text-slate-500">{config.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/60">
        <Filter className="h-4 w-4 text-slate-400" />

        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tüm Kaynaklar</option>
          <option value="site">Site</option>
          <option value="admin">Admin</option>
          <option value="api">API</option>
          <option value="system">Sistem</option>
        </select>

        <select
          value={resolved}
          onChange={(e) => { setResolved(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tüm Durumlar</option>
          <option value="false">Çözülmemiş</option>
          <option value="true">Çözülmüş</option>
        </select>

        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Mesaj, yol veya detay ara..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <Button onClick={handleSearch} className="text-sm px-4">
            Ara
          </Button>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X className="h-3 w-3" />
            Temizle
          </button>
        )}
      </div>

      {/* Log list */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <ScrollText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Henüz log kaydı yok</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const lc = levelConfig[log.level];
              const sc = sourceConfig[log.source];
              const LevelIcon = lc.icon;
              const SourceIcon = sc.icon;
              const isExpanded = expandedId === log._id;

              return (
                <div key={log._id} className={`${log.resolvedAt ? 'opacity-60' : ''}`}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 cursor-pointer"
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${lc.bg}`}>
                      <LevelIcon className={`h-4 w-4 ${lc.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${lc.badge}`}>
                          {lc.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${sc.color}`}>
                          <SourceIcon className="h-3 w-3" />
                          {sc.label}
                        </span>
                        {log.method && log.path && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.method} {log.path}
                          </span>
                        )}
                        {log.statusCode && (
                          <span className={`text-[10px] font-mono ${log.statusCode >= 500 ? 'text-red-500' : log.statusCode >= 400 ? 'text-amber-500' : 'text-slate-400'}`}>
                            {log.statusCode}
                          </span>
                        )}
                        {log.resolvedAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            Çözüldü
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-700 line-clamp-1">{log.message}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                        {log.ip && ` · ${log.ip}`}
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-3">
                      {log.details && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Detaylar</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{log.details}</p>
                        </div>
                      )}
                      {log.stack && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">Stack Trace</p>
                          <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300 overflow-x-auto max-h-64 overflow-y-auto">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                      {log.userAgent && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-1">User Agent</p>
                          <p className="text-xs text-slate-500 font-mono">{log.userAgent}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2">
                        {!log.resolvedAt && (
                          <Button
                            variant="ghost"
                            onClick={() => resolveMutation.mutate(log._id)}
                            isLoading={resolveMutation.isPending}
                            className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Çözüldü İşaretle
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Bu log silinecek. Emin misiniz?')) {
                              deleteMutation.mutate(log._id);
                            }
                          }}
                          isLoading={deleteMutation.isPending}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Toplam {meta.total} kayıt · Sayfa {meta.page}/{meta.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
                disabled={page >= meta.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

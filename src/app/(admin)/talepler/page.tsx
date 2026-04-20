'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Badge, Modal, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/utils/format';
import { MessageSquare, Search, Eye, Mail, Phone, Clock, User, Trash2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'Yeni',
  read: 'Okundu',
  replied: 'Yanıtlandı',
  closed: 'Kapatıldı',
};

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  new: 'warning',
  read: 'info',
  replied: 'success',
  closed: 'default',
};

export default function AdminContactRequestsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-contact-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/contact-requests?${params}`);
      if (!res.ok) throw new Error('Talepler yüklenemedi');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; adminNote?: string }) => {
      const res = await fetch(`/api/contact-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-requests'] });
      if (selectedRequest) setSelectedRequest(data?.data || null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contact-requests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme başarısız');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-requests'] });
      setSelectedRequest(null);
    },
  });

  const requests = (data?.data?.requests || []).filter((r: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(s) ||
      r.email?.toLowerCase().includes(s) ||
      r.subject?.toLowerCase().includes(s)
    );
  });
  const newCount = data?.data?.newCount || 0;

  const openRequest = (req: any) => {
    setSelectedRequest(req);
    // Mark as read if new
    if (req.status === 'new') {
      updateMutation.mutate({ id: req._id, status: 'read' });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Talep ara..."
              className="rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pl-4 pr-10 py-2.5 text-sm text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {newCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {newCount} yeni talep
            </span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <div className="overflow-x-auto">
        <table className="min-w-[650px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Gönderen</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Konu</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Tarih</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center"><Spinner size="lg" /></td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Talep bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req._id} className={`group transition-colors hover:bg-slate-50/80 ${req.status === 'new' ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-5 py-3.5">
                    <p className={`text-sm ${req.status === 'new' ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{req.name}</p>
                    <p className="text-xs text-slate-400">{req.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-sm ${req.status === 'new' ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{req.subject}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariant[req.status] || 'default'}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(req.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openRequest(req)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Bu talebi silmek istediğinize emin misiniz?')) deleteMutation.mutate(req._id); }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Sil"
                      >
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

      {/* Request Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Talep Detayı"
        size="lg"
        footer={
          selectedRequest ? (
            <div className="flex w-full items-center gap-2">
              <span className="mr-auto text-sm font-medium text-slate-500">Durumu:</span>
              {Object.entries(statusLabels).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedRequest.status === key ? 'primary' : 'outline'}
                  onClick={() => updateMutation.mutate({ id: selectedRequest._id, status: key })}
                  isLoading={updateMutation.isPending}
                >
                  {label}
                </Button>
              ))}
            </div>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            {/* Sender info */}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <User className="h-3.5 w-3.5" /> Gönderen Bilgileri
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-slate-800">{selectedRequest.name}</p>
                <p className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <a href={`mailto:${selectedRequest.email}`} className="text-blue-600 hover:underline">{selectedRequest.email}</a>
                </p>
                {selectedRequest.phone && (
                  <p className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedRequest.phone}
                  </p>
                )}
                <p className="flex items-center gap-2 text-slate-400 text-xs">
                  <Clock className="h-3.5 w-3.5" /> {new Date(selectedRequest.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>

            {/* Subject & Message */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Konu: {selectedRequest.subject}</h3>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedRequest.message}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Badge, Spinner } from '@shared/components/ui';
import { formatDate } from '@shared/lib/utils/format';
import { FileText, Eye, Building2, MapPin, User, FileCheck, MessageSquare } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

const statusBadge: Record<string, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

export default function AdminWholesalePage() {
  const [selected, setSelected] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wholesale'],
    queryFn: async () => {
      const res = await fetch('/api/wholesale');
      if (!res.ok) throw new Error('Başvurular yüklenemedi');
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) => {
      const res = await fetch(`/api/wholesale/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wholesale'] });
      setShowDetailModal(false);
      setSelected(null);
      setRejectionReason('');
    },
  });

  const openDetail = (app: any) => {
    setSelected(app);
    setRejectionReason('');
    setShowDetailModal(true);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelected(null);
    setRejectionReason('');
  };

  const applications = data?.data || [];

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Firma</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Başvuran</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Vergi No</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Telefon</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Tarih</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center"><Spinner size="lg" /></td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <FileText className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-400">Başvuru bulunmamaktadır.</p>
                </td>
              </tr>
            ) : (
              applications.map((app: any) => (
                <tr key={app._id} className="group transition-colors hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-medium text-slate-700">{app.companyName}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {app.userId?.firstName && app.userId?.lastName
                      ? `${app.userId.firstName} ${app.userId.lastName}`
                      : app.userId?.email || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">{app.taxNumber}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{app.phone}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusBadge[app.status] || 'default'}>
                      {statusLabels[app.status] || app.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(app.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(app)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      İncele
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={closeDetail}
        title="Başvuru Detayı"
        size="lg"
        footer={
          selected?.status === 'pending' ? (
            <>
              <Button variant="outline" onClick={closeDetail}>Kapat</Button>
              <Button
                variant="danger"
                isLoading={actionMutation.isPending}
                onClick={() => selected && actionMutation.mutate({ id: selected._id, status: 'rejected', rejectionReason })}
              >
                Reddet
              </Button>
              <Button
                isLoading={actionMutation.isPending}
                onClick={() => selected && actionMutation.mutate({ id: selected._id, status: 'approved' })}
              >
                Onayla
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={closeDetail}>Kapat</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Status Banner */}
            <div className={`flex items-center gap-3 rounded-xl p-3 ${
              selected.status === 'pending' ? 'bg-amber-50 ring-1 ring-amber-200/60' :
              selected.status === 'approved' ? 'bg-emerald-50 ring-1 ring-emerald-200/60' :
              'bg-red-50 ring-1 ring-red-200/60'
            }`}>
              <Badge variant={statusBadge[selected.status] || 'default'}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
              <span className="text-xs text-slate-500">
                Başvuru tarihi: {formatDate(selected.createdAt)}
              </span>
            </div>

            {/* Applicant User Info */}
            <div className="rounded-xl bg-blue-50/50 p-4 ring-1 ring-blue-200/40">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <User className="h-3.5 w-3.5" />
                Başvuran Kullanıcı
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Ad Soyad</span>
                  <p className="text-sm font-medium text-slate-700">
                    {selected.userId?.firstName && selected.userId?.lastName
                      ? `${selected.userId.firstName} ${selected.userId.lastName}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">E-posta</span>
                  <p className="text-sm font-medium text-slate-700">{selected.userId?.email || '—'}</p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Building2 className="h-3.5 w-3.5" />
                Firma Bilgileri
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Firma Adı</span>
                  <p className="text-sm font-medium text-slate-700">{selected.companyName}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Vergi Numarası</span>
                  <p className="text-sm font-mono font-medium text-slate-700">{selected.taxNumber}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Vergi Dairesi</span>
                  <p className="text-sm font-medium text-slate-700">{selected.taxOffice || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Telefon</span>
                  <p className="text-sm font-medium text-slate-700">{selected.phone}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                Adres Bilgileri
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">İl</span>
                  <p className="text-sm font-medium text-slate-700">{selected.city || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">İlçe</span>
                  <p className="text-sm font-medium text-slate-700">{selected.district || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] font-medium text-slate-400">Açık Adres</span>
                  <p className="text-sm font-medium text-slate-700">{selected.address || '—'}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selected.notes && (
              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Başvuran Notu
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}

            {/* Previous rejection reason */}
            {selected.status === 'rejected' && selected.rejectionReason && (
              <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200/60">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-600">
                  <FileCheck className="h-3.5 w-3.5" />
                  Red Sebebi
                </h4>
                <p className="text-sm text-red-700">{selected.rejectionReason}</p>
              </div>
            )}

            {/* Rejection reason input (only for pending) */}
            {selected.status === 'pending' && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Red Sebebi (opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reddetme durumunda sebep giriniz..."
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

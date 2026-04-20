'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Spinner } from '@/components/ui';
import { Phone, Mail, Clock, Globe, Save, Plus, Trash2, Store, MapPin, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

interface IBranch {
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  googleMapsUrl: string;
  isHeadquarter: boolean;
}

const DAY_LABELS: Record<string, string> = {
  pazartesi: 'Pzt',
  sali: 'Sal',
  carsamba: 'Çar',
  persembe: 'Per',
  cuma: 'Cum',
  cumartesi: 'Cmt',
  pazar: 'Paz',
};

const DAY_FULL_LABELS: Record<string, string> = {
  pazartesi: 'Pazartesi',
  sali: 'Salı',
  carsamba: 'Çarşamba',
  persembe: 'Perşembe',
  cuma: 'Cuma',
  cumartesi: 'Cumartesi',
  pazar: 'Pazar',
};

const DAY_ORDER = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

function generateWorkingHoursText(days: Record<string, boolean>, openTime: string, closeTime: string): string {
  const activeDays = DAY_ORDER.filter((d) => days[d]);
  if (activeDays.length === 0) return 'Kapalı';

  // Find consecutive ranges
  const ranges: string[] = [];
  let rangeStart = 0;
  for (let i = 0; i <= activeDays.length; i++) {
    const currentIdx = DAY_ORDER.indexOf(activeDays[i]);
    const prevIdx = i > 0 ? DAY_ORDER.indexOf(activeDays[i - 1]) : -2;

    if (i === activeDays.length || currentIdx !== prevIdx + 1) {
      if (i > 0) {
        const start = activeDays[rangeStart];
        const end = activeDays[i - 1];
        ranges.push(start === end ? DAY_LABELS[start] : `${DAY_LABELS[start]} - ${DAY_LABELS[end]}`);
      }
      rangeStart = i;
    }
  }

  return `${ranges.join(', ')}: ${openTime} - ${closeTime}`;
}

const defaultDays: Record<string, boolean> = {
  pazartesi: true, sali: true, carsamba: true, persembe: true, cuma: true, cumartesi: true, pazar: false,
};

export default function ContactSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    phone: '',
    email: '',
    workingHours: '',
    workingHoursData: {
      days: { ...defaultDays },
      openTime: '08:30',
      closeTime: '18:30',
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  });
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [branchModal, setBranchModal] = useState<{ open: boolean; editIndex: number | null }>({ open: false, editIndex: null });
  const [branchForm, setBranchForm] = useState<IBranch>({ name: '', address: '', phone: '', workingHours: '', googleMapsUrl: '', isHeadquarter: false });

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Ayarlar yüklenemedi');
      return res.json();
    },
  });

  useEffect(() => {
    if (data?.data?.contactInfo) {
      const ci = data.data.contactInfo;
      const whData = ci.workingHoursData || { days: { ...defaultDays }, openTime: '08:30', closeTime: '18:30' };
      setForm({
        phone: ci.phone || '',
        email: ci.email || '',
        workingHours: ci.workingHours || '',
        workingHoursData: {
          days: { ...defaultDays, ...whData.days },
          openTime: whData.openTime || '08:30',
          closeTime: whData.closeTime || '18:30',
        },
        socialMedia: {
          facebook: ci.socialMedia?.facebook || '',
          instagram: ci.socialMedia?.instagram || '',
          twitter: ci.socialMedia?.twitter || '',
          linkedin: ci.socialMedia?.linkedin || '',
        },
      });
    }
    if (data?.data?.branches) {
      setBranches(data.data.branches.map((b: any) => ({ ...b, isHeadquarter: b.isHeadquarter || false })));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { contactInfo: typeof form & { workingHours: string }; branches: IBranch[] }) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Kaydetme başarısız');
      return res.json();
    },
    onSuccess: (result) => {
      if (result?.data?.branches) {
        setBranches(result.data.branches.map((b: any) => ({ ...b, isHeadquarter: b.isHeadquarter || false })));
      }
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('İletişim bilgileri kaydedildi');
    },
    onError: () => {
      toast.error('Kaydetme sırasında bir hata oluştu');
    },
  });

  const handleSave = () => {
    const workingHoursText = generateWorkingHoursText(
      form.workingHoursData.days,
      form.workingHoursData.openTime,
      form.workingHoursData.closeTime,
    );
    saveMutation.mutate({
      contactInfo: {
        ...form,
        workingHours: workingHoursText,
      },
      branches: branches.map(b => ({ ...b })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const updateField = (field: string, value: string) => {
    if (field.startsWith('socialMedia.')) {
      const key = field.split('.')[1];
      setForm((prev) => ({
        ...prev,
        socialMedia: { ...prev.socialMedia, [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      workingHoursData: {
        ...prev.workingHoursData,
        days: { ...prev.workingHoursData.days, [day]: !prev.workingHoursData.days[day] },
      },
    }));
  };

  const updateTime = (field: 'openTime' | 'closeTime', value: string) => {
    setForm((prev) => ({
      ...prev,
      workingHoursData: { ...prev.workingHoursData, [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">İletişim Bilgileri</h2>
          <p className="mt-1 text-sm text-slate-400">Ana sitede görüntülenecek iletişim bilgileri</p>
        </div>
        <Button
          onClick={handleSave}
          isLoading={saveMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Kaydet
        </Button>
      </div>

      {/* Contact Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Phone className="h-4 w-4 text-blue-500" />
          Temel Bilgiler
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Telefon</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="0212 XXX XX XX"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="info@kartalcivata.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Clock className="h-4 w-4 text-emerald-500" />
          Çalışma Saatleri
        </h3>

        {/* Day checkboxes */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">Çalışma Günleri</label>
          <div className="flex flex-wrap gap-2">
            {DAY_ORDER.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`flex flex-col items-center rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer border ${
                  form.workingHoursData.days[day]
                    ? 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{DAY_LABELS[day]}</span>
                <span className="mt-0.5 text-[9px]">{DAY_FULL_LABELS[day]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time selectors */}
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Açılış Saati</label>
            <select
              value={form.workingHoursData.openTime}
              onChange={(e) => updateTime('openTime', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Kapanış Saati</label>
            <select
              value={form.workingHoursData.closeTime}
              onChange={(e) => updateTime('closeTime', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500 mb-1">Sitede görünecek metin:</p>
          <p className="text-sm font-medium text-slate-700">
            {generateWorkingHoursText(form.workingHoursData.days, form.workingHoursData.openTime, form.workingHoursData.closeTime)}
          </p>
        </div>
      </div>

      {/* Branches */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Store className="h-4 w-4 text-orange-500" />
            Mağaza / Şube Lokasyonları
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBranchForm({ name: '', address: '', phone: '', workingHours: '', googleMapsUrl: '', isHeadquarter: false });
              setBranchModal({ open: true, editIndex: null });
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Şube Ekle
          </Button>
        </div>
        {branches.length === 0 ? (
          <p className="text-sm text-slate-400">Henüz şube eklenmemiş. İletişim sayfasında varsayılan lokasyonlar gösterilecek.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {branches.map((branch, i) => (
              <div
                key={i}
                className={`group relative rounded-xl border p-4 transition-all ${
                  branch.isHeadquarter
                    ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                {branch.isHeadquarter && (
                  <span className="absolute -top-2.5 left-3 rounded-full bg-blue-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                    Merkez
                  </span>
                )}
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1 flex items-start gap-2.5">
                    {branch.isHeadquarter && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${branch.isHeadquarter ? 'text-blue-800' : 'text-slate-800'}`}>
                        {branch.name || 'İsimsiz Şube'}
                      </h4>
                    {branch.phone && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="h-3 w-3" />
                        {branch.phone}
                      </p>
                    )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {!branch.isHeadquarter && (
                      <button
                        type="button"
                        onClick={() => setBranches(prev => prev.map((b, idx) => ({ ...b, isHeadquarter: idx === i })))}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        title="Merkez yap"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBranchForm({ ...branch });
                        setBranchModal({ open: true, editIndex: i });
                      }}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 cursor-pointer"
                      title="Düzenle"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBranches(prev => prev.filter((_, idx) => idx !== i))}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {branch.address && (
                  <p className="flex items-start gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </p>
                )}
                {branch.googleMapsUrl && (
                  <p className="mt-1.5 text-[10px] text-emerald-600 font-medium">Google Maps bağlantısı mevcut</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branch Modal */}
      {branchModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBranchModal({ open: false, editIndex: null })}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                {branchModal.editIndex !== null ? 'Şubeyi Düzenle' : 'Yeni Şube Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setBranchModal({ open: false, editIndex: null })}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Şube Adı *</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Kartal Merkez Mağaza"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Telefon</label>
                <input
                  type="text"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0216 XXX XX XX"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Adres</label>
                <textarea
                  rows={2}
                  value={branchForm.address}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Tam adres..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Google Maps Embed URL</label>
                <input
                  type="url"
                  value={branchForm.googleMapsUrl}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, googleMapsUrl: e.target.value }))}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branchForm.isHeadquarter}
                  onChange={(e) => setBranchForm(prev => ({ ...prev, isHeadquarter: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Merkez şube olarak ayarla</span>
              </label>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setBranchModal({ open: false, editIndex: null })}
              >
                İptal
              </Button>
              <Button
                onClick={() => {
                  if (!branchForm.name.trim()) {
                    toast.error('Şube adı zorunludur');
                    return;
                  }
                  setBranches(prev => {
                    let updated: IBranch[];
                    if (branchModal.editIndex !== null) {
                      updated = [...prev];
                      updated[branchModal.editIndex] = { ...branchForm };
                    } else {
                      updated = [...prev, { ...branchForm }];
                    }
                    // If this branch is set as headquarter, unset others
                    if (branchForm.isHeadquarter) {
                      const targetIdx = branchModal.editIndex !== null ? branchModal.editIndex : updated.length - 1;
                      updated = updated.map((b, idx) => ({ ...b, isHeadquarter: idx === targetIdx }));
                    }
                    return updated;
                  });
                  setBranchModal({ open: false, editIndex: null });
                  toast.success(branchModal.editIndex !== null ? 'Şube güncellendi' : 'Şube eklendi');
                }}
              >
                {branchModal.editIndex !== null ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Social Media */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Globe className="h-4 w-4 text-violet-500" />
          Sosyal Medya
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Facebook</label>
            <input
              type="url"
              value={form.socialMedia.facebook}
              onChange={(e) => updateField('socialMedia.facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Instagram</label>
            <input
              type="url"
              value={form.socialMedia.instagram}
              onChange={(e) => updateField('socialMedia.instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Twitter / X</label>
            <input
              type="url"
              value={form.socialMedia.twitter}
              onChange={(e) => updateField('socialMedia.twitter', e.target.value)}
              placeholder="https://x.com/..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">LinkedIn</label>
            <input
              type="url"
              value={form.socialMedia.linkedin}
              onChange={(e) => updateField('socialMedia.linkedin', e.target.value)}
              placeholder="https://linkedin.com/..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

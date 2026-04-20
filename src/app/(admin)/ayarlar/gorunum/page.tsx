'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Spinner } from '@/components/ui';
import { Image as ImageIcon, Upload, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function siteAsset(url?: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SITE_URL}${url}`;
}

export default function AppearanceSettingsPage() {
  const queryClient = useQueryClient();

  // Header Logo state
  const headerLogoFileRef = useRef<HTMLInputElement>(null);
  const [headerLogoPreview, setHeaderLogoPreview] = useState<string | null>(null);
  const [headerLogoFile, setHeaderLogoFile] = useState<File | null>(null);

  // Footer Logo state
  const footerLogoFileRef = useRef<HTMLInputElement>(null);
  const [footerLogoPreview, setFooterLogoPreview] = useState<string | null>(null);
  const [footerLogoFile, setFooterLogoFile] = useState<File | null>(null);

  // Favicon state
  const [faviconUploading, setFaviconUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Ayarlar yüklenemedi');
      return res.json();
    },
  });

  const currentHeaderLogo = data?.data?.logo?.url;
  const currentFooterLogo = data?.data?.footerLogo?.url;
  const faviconUrl = data?.data?.favicon?.url;

  // --- Header Logo mutations ---
  const headerLogoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/settings/logo', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Yükleme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Header logosu başarıyla yüklendi');
      setHeaderLogoPreview(null);
      setHeaderLogoFile(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const headerLogoRemoveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: { url: '', uploadedAt: null } }),
      });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Header logosu kaldırıldı');
    },
    onError: () => toast.error('Logo kaldırılırken hata oluştu'),
  });

  // --- Footer Logo mutations ---
  const footerLogoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('footerLogo', file);
      const res = await fetch('/api/settings/footer-logo', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Yükleme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Footer logosu başarıyla yüklendi');
      setFooterLogoPreview(null);
      setFooterLogoFile(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const footerLogoRemoveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footerLogo: { url: '', uploadedAt: null } }),
      });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Footer logosu kaldırıldı');
    },
    onError: () => toast.error('Logo kaldırılırken hata oluştu'),
  });

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan küçük olmalıdır");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- Favicon handler ---
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconUploading(true);
    try {
      const formData = new FormData();
      formData.append('favicon', file);
      const res = await fetch('/api/settings/favicon', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Yükleme başarısız');
      }
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Favicon başarıyla yüklendi');
    } catch (err: any) {
      toast.error(err.message || 'Favicon yüklenirken hata oluştu');
    } finally {
      setFaviconUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const LogoSection = ({
    title,
    description,
    currentUrl,
    preview,
    file,
    fileRef,
    onFileChange,
    onUpload,
    uploading,
    onRemove,
    removing,
    onCancel,
    iconColor,
  }: {
    title: string;
    description: string;
    currentUrl?: string;
    preview: string | null;
    file: File | null;
    fileRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
    uploading: boolean;
    onRemove: () => void;
    removing: boolean;
    onCancel: () => void;
    iconColor: string;
  }) => (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <ImageIcon className={`h-4 w-4 ${iconColor}`} />
        {title}
      </h3>
      <p className="mb-5 text-xs text-slate-400">{description}</p>

      <div className="flex items-start gap-6">
        <div className="flex h-28 w-52 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-4">
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
          ) : currentUrl ? (
            <img src={siteAsset(currentUrl)} alt="Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-1 text-xs text-slate-400">Yüklenmemiş</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={onFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Logo Seç
          </Button>
          <p className="text-xs text-slate-400">PNG, JPEG, SVG veya WebP — Maks 2MB</p>

          {currentUrl && !file && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              isLoading={removing}
              className="flex items-center gap-2 text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Logoyu Kaldır
            </Button>
          )}
        </div>
      </div>

      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
          <p className="flex-1 text-sm text-slate-600">
            <strong>{file.name}</strong> seçildi ({(file.size / 1024).toFixed(0)} KB)
          </p>
          <Button
            size="sm"
            onClick={onUpload}
            isLoading={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Yükle
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            İptal
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Görünüm Ayarları</h2>
        <p className="mt-1 text-sm text-slate-400">Site logoları ve favicon ayarlarını buradan yönetin.</p>
      </div>

      {/* Header Logo */}
      <LogoSection
        title="Header Logosu"
        description="Ana sitede üst menüde (header) görüntülenecek logo."
        currentUrl={currentHeaderLogo}
        preview={headerLogoPreview}
        file={headerLogoFile}
        fileRef={headerLogoFileRef}
        onFileChange={(e) => handleFileSelect(e, setHeaderLogoFile, setHeaderLogoPreview)}
        onUpload={() => headerLogoFile && headerLogoUploadMutation.mutate(headerLogoFile)}
        uploading={headerLogoUploadMutation.isPending}
        onRemove={() => headerLogoRemoveMutation.mutate()}
        removing={headerLogoRemoveMutation.isPending}
        onCancel={() => { setHeaderLogoFile(null); setHeaderLogoPreview(null); }}
        iconColor="text-blue-500"
      />

      {/* Footer Logo */}
      <LogoSection
        title="Footer Logosu"
        description="Ana sitede alt kısımda (footer) görüntülenecek logo. Yüklenmezse header logosu kullanılır."
        currentUrl={currentFooterLogo}
        preview={footerLogoPreview}
        file={footerLogoFile}
        fileRef={footerLogoFileRef}
        onFileChange={(e) => handleFileSelect(e, setFooterLogoFile, setFooterLogoPreview)}
        onUpload={() => footerLogoFile && footerLogoUploadMutation.mutate(footerLogoFile)}
        uploading={footerLogoUploadMutation.isPending}
        onRemove={() => footerLogoRemoveMutation.mutate()}
        removing={footerLogoRemoveMutation.isPending}
        onCancel={() => { setFooterLogoFile(null); setFooterLogoPreview(null); }}
        iconColor="text-violet-500"
      />

      {/* Favicon Section */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Globe className="h-4 w-4 text-indigo-500" />
          Favicon
        </h3>
        <p className="mb-5 text-xs text-slate-400">Tarayıcı sekmesinde görünecek küçük ikon.</p>

        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80">
            {faviconUrl ? (
              <img src={siteAsset(faviconUrl)} alt="Favicon" className="h-12 w-12 object-contain" />
            ) : (
              <ImageIcon className="h-8 w-8 text-slate-300" />
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">{faviconUrl ? 'Mevcut Favicon' : 'Favicon yüklenmemiş'}</span>
              {data?.data?.favicon?.uploadedAt && (
                <span className="text-xs text-slate-400">
                  · {new Date(data.data.favicon.uploadedAt).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
            <label className="inline-flex cursor-pointer">
              <input
                type="file"
                accept=".ico,.png,.svg"
                onChange={handleFaviconUpload}
                className="hidden"
                disabled={faviconUploading}
              />
              <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                {faviconUploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {faviconUploading ? 'Yükleniyor...' : 'Favicon Yükle'}
              </span>
            </label>
            <p className="text-xs text-slate-400">ICO, PNG veya SVG — Maks 512KB</p>
          </div>
        </div>
      </div>
    </div>
  );
}

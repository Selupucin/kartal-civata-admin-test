'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Spinner, Badge, Modal } from '@/components/ui';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Send,
  Save,
  X,
  Search,
  Calendar,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: string | null;
  viewCount: number;
  authorSnapshot: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  status: 'draft' | 'published';
}

const emptyPost: BlogForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: [] as string[],
  status: 'draft',
};

export default function BlogPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<typeof emptyPost>(emptyPost);
  const [tagInput, setTagInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      params.set('limit', '50');
      const res = await fetch(`/api/blog?${params}`);
      if (!res.ok) throw new Error('Blog yazıları yüklenemedi');
      return res.json();
    },
  });

  const posts: BlogPost[] = data?.data || [];

  const saveMutation = useMutation({
    mutationFn: async (data: { form: typeof emptyPost; id?: string }) => {
      const url = data.id ? `/api/blog/${data.id}` : '/api/blog';
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Kaydetme başarısız');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success(editingPost ? 'Blog yazısı güncellendi' : 'Blog yazısı oluşturuldu');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Blog yazısı silindi');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Silme sırasında bir hata oluştu');
    },
  });

  const resetForm = () => {
    setShowEditor(false);
    setEditingPost(null);
    setForm(emptyPost);
    setTagInput('');
  };

  const openCreate = () => {
    setForm(emptyPost);
    setEditingPost(null);
    setShowEditor(true);
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      tags: post.tags,
      status: post.status,
    });
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleSave = (status: 'draft' | 'published') => {
    saveMutation.mutate({
      form: { ...form, status },
      id: editingPost?._id,
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Editor view
  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {editingPost ? 'Blog Yazısı Düzenle' : 'Yeni Blog Yazısı'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetForm} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              İptal
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              isLoading={saveMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Taslak Kaydet
            </Button>
            <Button
              onClick={() => handleSave('published')}
              isLoading={saveMutation.isPending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Yayınla
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Başlık *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Blog yazısı başlığı..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Slug (URL)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="otomatik-olusturulur"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="mt-1 text-xs text-slate-400">Boş bırakılırsa başlıktan otomatik oluşturulur</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Özet</label>
                  <textarea
                    rows={3}
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Yazı hakkında kısa özet (max 500 karakter)..."
                    maxLength={500}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">İçerik *</label>
                  <textarea
                    rows={16}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Blog yazısı içeriğini buraya yazın..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Kapak Görseli</h3>
              <input
                type="url"
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://... resim URL'si"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {form.coverImage && (
                <img
                  src={form.coverImage}
                  alt="Kapak"
                  className="mt-3 h-40 w-full rounded-xl object-cover"
                />
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Tag className="h-4 w-4 text-blue-500" />
                Etiketler
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Etiket ekle..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Button size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 cursor-pointer text-blue-400 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Blog Yönetimi</h2>
          <p className="mt-1 text-sm text-slate-400">{posts.length} blog yazısı</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Yazı
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {['', 'published', 'draft'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
              filter === f
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {f === '' ? 'Tümü' : f === 'published' ? 'Yayında' : 'Taslak'}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="rounded-2xl bg-white py-20 text-center shadow-sm ring-1 ring-slate-200/60">
          <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Henüz blog yazısı yok</p>
          <p className="mt-1 text-sm text-slate-400">İlk blog yazınızı oluşturmak için butona tıklayın</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post._id}
              className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all hover:shadow-md overflow-hidden"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-40 w-full object-cover"
                />
              )}
              <div className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={post.status === 'published' ? 'success' : 'info'}>
                    {post.status === 'published' ? 'Yayında' : 'Taslak'}
                  </Badge>
                  {post.viewCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Eye className="h-3 w-3" />
                      {post.viewCount}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-slate-800 line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mb-3 text-xs text-slate-500 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.createdAt)}
                  <span>·</span>
                  <span>{post.authorSnapshot.name}</span>
                </div>
                {post.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{post.tags.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(post)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Pencil className="h-3 w-3" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(post._id)}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="h-3 w-3" />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Blog Yazısını Sil"
      >
        <p className="mb-6 text-sm text-slate-600">
          Bu blog yazısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            İptal
          </Button>
          <Button
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            isLoading={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}

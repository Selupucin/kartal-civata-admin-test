'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Package, FolderTree, ShoppingCart, Users, ArrowRight } from 'lucide-react';

interface SearchResult {
  type: 'product' | 'category' | 'order' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const typeIcons = {
  product: Package,
  category: FolderTree,
  order: ShoppingCart,
  user: Users,
};

const typeLabels = {
  product: 'Ürün',
  category: 'Kategori',
  order: 'Sipariş',
  user: 'Kullanıcı',
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [productsRes, categoriesRes, ordersRes, usersRes] = await Promise.all([
        fetch(`/api/products?search=${encodeURIComponent(q)}&limit=5`).then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch(`/api/orders?limit=5`).then((r) => r.json()),
        fetch(`/api/users?search=${encodeURIComponent(q)}&limit=5`).then((r) => r.json()),
      ]);

      const searchResults: SearchResult[] = [];

      (productsRes.data || []).forEach((p: any) => {
        searchResults.push({
          type: 'product',
          id: p._id,
          title: p.name,
          subtitle: p.sku,
          href: '/urunler',
        });
      });

      (categoriesRes.data || [])
        .filter((c: any) => c.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 5)
        .forEach((c: any) => {
          searchResults.push({
            type: 'category',
            id: c._id,
            title: c.name,
            subtitle: c.slug,
            href: '/kategoriler',
          });
        });

      (ordersRes.data || [])
        .filter((o: any) =>
          o.orderNumber?.toLowerCase().includes(q.toLowerCase()) ||
          o.userSnapshot?.fullName?.toLowerCase().includes(q.toLowerCase())
        )
        .slice(0, 5)
        .forEach((o: any) => {
          searchResults.push({
            type: 'order',
            id: o._id,
            title: o.orderNumber,
            subtitle: o.userSnapshot?.fullName,
            href: '/siparisler',
          });
        });

      (usersRes.data || []).forEach((u: any) => {
        searchResults.push({
          type: 'user',
          id: u._id,
          title: `${u.firstName} ${u.lastName}`,
          subtitle: u.email,
          href: '/kullanicilar',
        });
      });

      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-xl animate-fade-in rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Ürün, kategori, sipariş veya kullanıcı ara..."
            className="flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-0.5">
              {results.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{result.title}</p>
                      {result.subtitle && (
                        <p className="truncate text-xs text-slate-400">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {typeLabels[result.type]}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                );
              })}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-400">Sonuç bulunamadı</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">Aramak için en az 2 karakter girin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

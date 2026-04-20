'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Spinner } from '@shared/components/ui';
import { ShoppingCart, Save, Percent, AlertTriangle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Ayarlar yüklenemedi');
      return res.json();
    },
  });

  const [wholesaleMinQty, setWholesaleMinQty] = useState(100);
  const [wholesaleDiscountPercent, setWholesaleDiscountPercent] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  useEffect(() => {
    if (data?.data) {
      if (data.data.wholesaleMinQuantity) setWholesaleMinQty(data.data.wholesaleMinQuantity);
      if (data.data.wholesaleDiscountPercent !== undefined) setWholesaleDiscountPercent(data.data.wholesaleDiscountPercent);
      if (data.data.defaultLowStockThreshold !== undefined) setLowStockThreshold(data.data.defaultLowStockThreshold);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wholesaleMinQuantity: wholesaleMinQty,
          wholesaleDiscountPercent: wholesaleDiscountPercent,
          defaultLowStockThreshold: lowStockThreshold,
        }),
      });
      if (!res.ok) throw new Error('Kaydetme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Ürün ayarları kaydedildi');
    },
    onError: () => {
      toast.error('Kaydetme sırasında bir hata oluştu');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Ürün Ayarları</h2>
          <p className="mt-1 text-sm text-slate-400">Stok, toptan satış ve fiyatlandırma ayarları</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Kaydet
        </Button>
      </div>

      {/* Low Stock Threshold */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Düşük Stok Uyarı Eşiği
        </h3>
        <div className="max-w-lg">
          <p className="mb-4 text-xs text-slate-400">
            Ürün stok miktarı bu değerin altına düştüğünde düşük stok uyarısı gösterilir.
            Bu değer yeni eklenen ürünler için varsayılan olarak kullanılır.
          </p>
          <div className="space-y-3">
            <input
              type="range"
              min={1}
              max={200}
              step={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-amber-500"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>1</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={lowStockThreshold}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(200, Number(e.target.value)));
                    setLowStockThreshold(v);
                  }}
                  className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-center text-sm font-semibold text-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-slate-600">adet</span>
              </div>
              <span>200</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              <strong>Örnek:</strong> Stok miktarı <strong>{lowStockThreshold}</strong> veya altına düşen ürünler
              &quot;düşük stok&quot; olarak işaretlenir ve uyarı gösterilir.
            </p>
          </div>
        </div>
      </div>

      {/* Wholesale Quantity Threshold */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <ShoppingCart className="h-4 w-4 text-green-500" />
          Toptan Minimum Sipariş Adedi
        </h3>
        <div className="max-w-lg">
          <p className="mb-4 text-xs text-slate-400">
            Toptan müşterilerin sipariş verebilmesi için sepette bulunması gereken minimum ürün adedi
          </p>
          <div className="space-y-3">
            <input
              type="range"
              min={10}
              max={10000}
              step={10}
              value={wholesaleMinQty}
              onChange={(e) => setWholesaleMinQty(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-green-600"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>10</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={10000}
                  value={wholesaleMinQty}
                  onChange={(e) => {
                    const v = Math.max(10, Math.min(10000, Number(e.target.value)));
                    setWholesaleMinQty(v);
                  }}
                  className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-center text-sm font-semibold text-slate-700 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-slate-600">adet</span>
              </div>
              <span>10.000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wholesale Discount Percent */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Percent className="h-4 w-4 text-orange-500" />
          Toptan İndirim Oranı
        </h3>
        <div className="max-w-lg">
          <p className="mb-4 text-xs text-slate-400">
            Toptan fiyatı tanımlanmamış ürünlerde perakende fiyat üzerinden uygulanacak indirim yüzdesi.
            Toptan fiyatı tanımlı ürünlerde bu oran uygulanmaz.
          </p>
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={wholesaleDiscountPercent}
              onChange={(e) => setWholesaleDiscountPercent(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-orange-600"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>%0</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">%</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={wholesaleDiscountPercent}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(100, Number(e.target.value)));
                    setWholesaleDiscountPercent(v);
                  }}
                  className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-center text-sm font-semibold text-slate-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <span>%100</span>
            </div>
          </div>

          {wholesaleDiscountPercent > 0 && (
            <div className="mt-4 rounded-xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">
                <strong>Örnek:</strong> 100₺ perakende fiyatlı bir ürün, toptan müşteriye{' '}
                <strong>{(100 - wholesaleDiscountPercent).toFixed(0)}₺</strong> olarak gösterilecek.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

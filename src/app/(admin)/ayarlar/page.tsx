'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@shared/components/ui';

export default function AdminSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/ayarlar/iletisim');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}

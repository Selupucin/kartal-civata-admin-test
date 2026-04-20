'use client';

import QueryProvider from './QueryProvider';
import ToastProvider from './ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <ToastProvider />
    </QueryProvider>
  );
}

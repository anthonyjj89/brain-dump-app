'use client';

import { useState, useEffect } from 'react';
import QueryProvider from '@/providers/QueryProvider';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <body className={`min-h-screen bg-gray-50 ${mounted ? 'vsc-initialized' : ''}`}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </body>
  );
}

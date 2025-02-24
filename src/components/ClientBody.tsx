'use client';

import { useEffect } from 'react';
import QueryProvider from '@/providers/QueryProvider';

interface ClientBodyProps {
  children: React.ReactNode;
}

export default function ClientBody({ children }: ClientBodyProps) {
  useEffect(() => {
    document.body.classList.add('vsc-initialized');
    return () => document.body.classList.remove('vsc-initialized');
  }, []);

  return <QueryProvider>{children}</QueryProvider>;
}

'use client';

import { useState, useEffect } from 'react';
import QueryProvider from '@/providers/QueryProvider';

interface DynamicClassHandlerProps {
  children: React.ReactNode;
}

export default function DynamicClassHandler({ children }: DynamicClassHandlerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={mounted ? 'vsc-initialized' : ''}>
      <QueryProvider>
        {children}
      </QueryProvider>
    </div>
  );
}

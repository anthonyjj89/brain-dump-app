'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QueryProvider from '@/providers/QueryProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface ClientBodyProps {
  children: React.ReactNode;
}

export default function ClientBody({ children }: ClientBodyProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    document.body.classList.add('vsc-initialized');
    return () => document.body.classList.remove('vsc-initialized');
  }, []);

  // Avoid hydration mismatch
  if (!mounted) return <QueryProvider>{children}</QueryProvider>;

  return (
    <QueryProvider>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold">Brain Dump</span>
              </Link>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="mr-6"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}

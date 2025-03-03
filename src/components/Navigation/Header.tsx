'use client';

import React from 'react';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isPanelCollapsed: boolean;
  togglePanel: () => void;
}

export default function Header({ isPanelCollapsed, togglePanel }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="w-full py-4 flex items-center justify-between bg-transparent">
      {/* Logo and Title Section */}
      <div className="flex-1 flex items-center gap-3">
        <Logo 
          size="small" 
          showVersion={false} 
          className="sm:ml-2"
        />
        <h1 className="text-xl font-semibold hidden md:block">Brain Dump</h1>
      </div>
      
      {/* Controls Section */}
      <div className="flex-1 flex items-center justify-end gap-2">
        {/* Panel Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePanel}
          aria-label={isPanelCollapsed ? "Show Thoughts" : "Hide Thoughts"}
        >
          {isPanelCollapsed ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}

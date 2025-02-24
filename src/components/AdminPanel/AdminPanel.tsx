'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import StatusTab from './StatusTab';
import BugTab from './BugTab';
import ModelTab from './ModelTab';

const AdminPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'bugs' | 'models'>('status');
  const [reportType, setReportType] = useState<'bug' | 'feature'>('bug');
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Sync feedback tracker when panel opens
  useEffect(() => {
    if (isOpen) {
      // Trigger sync when panel opens
      fetch('/api/sync/bugs?type=bug')
        .then(response => {
          if (!response.ok) throw new Error('Failed to sync bugs');
          return fetch('/api/sync/bugs?type=feature');
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to sync features');
        })
        .catch(error => {
          console.error('Error syncing feedback tracker:', error);
        });
    }
  }, [isOpen]);

  // Prefetch status data when component mounts
  useEffect(() => {
    // Start prefetching system status
    queryClient.prefetchQuery({
      queryKey: ['systemStatus'],
      queryFn: async () => {
        const response = await fetch('/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        return response.json();
      },
      staleTime: 60 * 1000, // Consider data fresh for 1 minute
    });

    // Start prefetching metrics
    queryClient.prefetchQuery({
      queryKey: ['metrics'],
      queryFn: async () => {
        const response = await fetch('/api/status/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }
        return response.json();
      },
      staleTime: 1000, // Consider data fresh for 1 second
    });

    // Set up background polling for metrics when panel is closed
    const intervalId = setInterval(() => {
      if (!isOpen) {
        queryClient.prefetchQuery({
          queryKey: ['metrics'],
          queryFn: async () => {
            const response = await fetch('/api/status/metrics');
            if (!response.ok) {
              throw new Error('Failed to fetch metrics');
            }
            return response.json();
          },
        });
      }
    }, 5000); // Poll every 5 seconds when panel is closed

    return () => clearInterval(intervalId);
  }, [queryClient, isOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Prevent screenshot interference
  useEffect(() => {
    if (isOpen) {
      const preventScreenshot = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || (e.metaKey && e.key === 'p')) {
          e.preventDefault();
        }
      };

      document.addEventListener('keydown', preventScreenshot);
      return () => {
        document.removeEventListener('keydown', preventScreenshot);
      };
    }
  }, [isOpen]);

  const handleHidePanel = () => {
    setIsOpen(false);
    // Re-open panel after screenshot is taken
    setTimeout(() => {
      setIsOpen(true);
    }, 2000); // Wait for screenshot to be taken
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-slate-700 transition-colors admin-panel"
      >
        Show Admin Panel
      </button>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="fixed bottom-4 right-4 bg-slate-900 p-6 rounded-lg shadow-xl border border-slate-700 w-[600px] max-h-[80vh] overflow-y-auto z-50 admin-panel"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2 border-b border-slate-700">
          {[
            { id: 'status', label: '📊 System Status' },
            { id: 'models', label: '🤖 AI Models', highlight: true },
            { id: 'bugs', label: '🐛 Bug Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'status' | 'bugs' | 'models')}
              className={`px-4 py-2 relative ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              } ${tab.highlight ? 'after:content-[""] after:absolute after:top-0 after:right-0 after:w-2 after:h-2 after:bg-blue-500 after:rounded-full' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'status' ? (
        <StatusTab onRefresh={() => {}} />
      ) : activeTab === 'bugs' ? (
        <BugTab 
          onReportSubmit={() => {}} 
          reportType={reportType}
          setReportType={setReportType}
          onHidePanel={handleHidePanel}
        />
      ) : (
        <ModelTab />
      )}
    </div>
  );
};

export default AdminPanel;

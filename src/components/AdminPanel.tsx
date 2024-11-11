'use client';

import React, { useState, useRef, useEffect } from 'react';
import StatusTab from './AdminPanel/StatusTab';
import BugTab from './AdminPanel/BugTab';

// Preload status data
async function preloadStatus() {
  try {
    // Start both requests in parallel
    const [statusPromise, metricsPromise] = [
      fetch('/api/status'),
      fetch('/api/status/metrics')
    ];
    
    // Wait for both to complete
    await Promise.all([statusPromise, metricsPromise]);
  } catch (error) {
    console.error('Failed to preload status:', error);
  }
}

const AdminPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'feedback'>('status');
  const [reportType, setReportType] = useState<'bug' | 'feature'>('bug');
  const panelRef = useRef<HTMLDivElement>(null);
  const [isPreloading, setIsPreloading] = useState(false);

  // Preload status data when admin button appears
  useEffect(() => {
    if (!isPreloading) {
      setIsPreloading(true);
      preloadStatus().finally(() => setIsPreloading(false));
    }
  }, []);

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

  const handleReportSubmit = () => {
    // Handle report submission logic here
    console.log('Report submitted');
  };

  if (!isOpen) {
    return (
      <button
        onClick={async () => {
          // Start preloading
          setIsPreloading(true);
          // Preload data and open panel when ready
          await preloadStatus();
          setIsPreloading(false);
          setIsOpen(true);
        }}
        disabled={isPreloading}
        className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg transition-colors ${
          isPreloading
            ? 'bg-gray-600 cursor-wait'
            : 'bg-gray-800 hover:bg-gray-700'
        } text-white`}
      >
        {isPreloading ? 'Loading...' : 'Show Admin Panel'}
      </button>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-xl border border-gray-200 w-[600px] max-h-[80vh] overflow-y-auto z-50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Admin Panel</h2>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 ${
              activeTab === 'status'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            System Status
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 ${
              activeTab === 'feedback'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Feedback
          </button>
        </div>
      </div>

      {activeTab === 'status' ? (
        <StatusTab onRefresh={() => {}} />
      ) : (
        <BugTab 
          onReportSubmit={handleReportSubmit}
          reportType={reportType}
          setReportType={setReportType}
          onHidePanel={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminPanel;

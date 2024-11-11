'use client';

import React, { useState, useRef, useEffect } from 'react';
import StatusTab from './StatusTab';
import BugTab from './BugTab';

const AdminPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'bugs'>('status');
  const [reportType, setReportType] = useState<'bug' | 'feature'>('bug');
  const panelRef = useRef<HTMLDivElement>(null);

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
    }, 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors admin-panel"
      >
        Show Admin Panel
      </button>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-xl border border-gray-200 w-[600px] max-h-[80vh] overflow-y-auto z-50 admin-panel"
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
            onClick={() => setActiveTab('bugs')}
            className={`px-4 py-2 ${
              activeTab === 'bugs'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            Bug Reports
          </button>
        </div>
      </div>

      {activeTab === 'status' ? (
        <StatusTab onRefresh={() => {}} />
      ) : (
        <BugTab 
          onReportSubmit={() => {}} 
          reportType={reportType}
          setReportType={setReportType}
          onHidePanel={handleHidePanel}
        />
      )}
    </div>
  );
};

export default AdminPanel;

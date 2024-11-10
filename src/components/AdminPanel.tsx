'use client';

import { useState, useEffect } from 'react';
import BugReportForm from './BugReportForm';

interface StatusData {
  database: {
    connected: boolean;
    name: string;
    version: string;
    region: string;
    error?: string;
  };
  ai: {
    service: string;
    status: string;
  };
  externalServices: {
    ticktick: string;
    googleCalendar: string;
    notion: string;
  };
  lastChecked: string;
}

interface Bug {
  id: string;
  title: string;
  status: 'Open' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  reportedBy: string;
  steps: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'bugs'>('status');

  async function checkStatus() {
    try {
      setLoading(true);
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setLoading(false);
    }
  }

  async function fetchBugs() {
    try {
      const response = await fetch('/api/sync/bugs');
      if (!response.ok) {
        throw new Error('Failed to fetch bugs');
      }
      const data = await response.json();
      setBugs(data.data || []);
    } catch (err) {
      console.error('Error fetching bugs:', err);
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      fetchBugs();
    }
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
      >
        Show Admin Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-xl border border-gray-200 w-[600px] max-h-[80vh] overflow-y-auto">
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
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          ) : status ? (
            <>
              {/* Database Status */}
              <div className="border-b pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">Database</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    status.database.connected
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {status.database.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{status.database.name} v{status.database.version}</p>
                  <p>Region: {status.database.region}</p>
                </div>
              </div>

              {/* AI Service Status */}
              <div className="border-b pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">AI Service</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    status.ai.status === 'configured'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {status.ai.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{status.ai.service}</p>
              </div>

              {/* External Services */}
              <div>
                <span className="font-medium">External Services</span>
                <div className="mt-2 space-y-2">
                  {Object.entries(status.externalServices).map(([service, status]) => (
                    <div key={service} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{service}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        status === 'configured'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Checked */}
              <div className="text-xs text-gray-500 mt-4">
                Last checked: {new Date(status.lastChecked).toLocaleString()}
              </div>
            </>
          ) : null}

          <button
            onClick={checkStatus}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Report a Bug</h3>
            <BugReportForm onSubmitSuccess={fetchBugs} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Recent Bug Reports</h3>
            <div className="space-y-4">
              {bugs.map((bug) => (
                <div key={bug.id} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{bug.title}</h4>
                      <p className="text-sm text-gray-500">
                        Reported by {bug.reportedBy} on {new Date(bug.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bug.status === 'Open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {bug.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bug.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : bug.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {bug.priority}
                      </span>
                    </div>
                  </div>
                  {bug.steps.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">Steps to Reproduce:</p>
                      <ol className="list-decimal list-inside">
                        {bug.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import BugReportForm from '../BugReportForm';
import { Bug, BUG_PRIORITIES } from '@/lib/schemas/bug';

interface BugTabProps {
  initialReports?: Bug[];
  onReportSubmit: () => void;
  reportType: 'bug' | 'feature';
  setReportType: React.Dispatch<React.SetStateAction<'bug' | 'feature'>>;
  onHidePanel: () => void;
}

export default function BugTab({ 
  initialReports = [], 
  onReportSubmit, 
  reportType, 
  setReportType,
  onHidePanel 
}: BugTabProps) {
  const [reports, setReports] = useState<Bug[]>(initialReports);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);

  async function fetchReports() {
    try {
      setIsLoading(true);
      setReports([]); // Clear reports while loading
      console.log(`Fetching ${reportType} reports...`);

      // Skip auth in development
      const headers: HeadersInit = {};
      if (process.env.NODE_ENV !== 'development') {
        headers['Authorization'] = `Bearer ${process.env.NEXT_PUBLIC_SYNC_TOKEN}`;
      }

      const response = await fetch(`/api/sync/bugs?type=${reportType}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      console.log(`Received ${data.data?.length || 0} ${reportType} reports`);
      setReports(data.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [reportType]); // Re-fetch when report type changes

  const sortedReports = [...reports].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return sortOrder === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      const priorityOrder = { Low: 0, Medium: 1, High: 2 };
      return sortOrder === 'asc'
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : priorityOrder[b.priority] - priorityOrder[a.priority];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => setReportType('bug')}
            className={`px-4 py-2 rounded-l-md ${
              reportType === 'bug' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Bugs
          </button>
          <button
            onClick={() => setReportType('feature')}
            className={`px-4 py-2 rounded-r-md ${
              reportType === 'feature' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Features
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Report a {reportType === 'bug' ? 'Bug' : 'Feature'}</h3>
        <BugReportForm 
          onSubmitSuccess={() => {
            fetchReports();
            onReportSubmit();
          }} 
          reportType={reportType}
          onScreenshotRequest={onHidePanel}
        />
      </div>

      {selectedScreenshot && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <img 
            src={selectedScreenshot} 
            alt="Report Screenshot" 
            className="max-w-[90%] max-h-[90%] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">All {reportType === 'bug' ? 'Bug' : 'Feature'} Reports ({sortedReports.length})</h3>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'priority')}
              className="p-2 border rounded"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-gray-200 rounded hover:bg-gray-300"
              title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReports.map((report) => (
              <div key={report.id} className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-grow pr-20"> {/* Add padding-right to make space for screenshot */}
                    <h4 className="font-medium">{report.title}</h4>
                    <p className="text-sm text-gray-500">
                      Reported by {report.reportedBy} on {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'Open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : report.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.priority}
                      </span>
                    </div>
                  </div>
                  {report.screenshot && (
                    <div 
                      className="cursor-pointer ml-4"
                      onClick={() => setSelectedScreenshot(report.screenshot?.path || null)}
                    >
                      <img 
                        src={report.screenshot.path}
                        alt="Screenshot thumbnail" 
                        className="w-16 h-16 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                {report.steps && report.steps.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p className="font-medium">Steps to Reproduce:</p>
                    <ol className="list-decimal list-inside">
                      {report.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

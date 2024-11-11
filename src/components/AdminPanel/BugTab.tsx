'use client';

import React, { useState, useEffect } from 'react';
import BugReportForm from '../BugReportForm';
import { Bug, BUG_PRIORITIES } from '@/lib/schemas/bug';
import { captureScreenshot } from '@/utils/screenshot';

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
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  async function fetchReports() {
    try {
      const response = await fetch('/api/sync/bugs');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const handleScreenshotRequest = async (): Promise<string> => {
    try {
      setIsCapturingScreenshot(true);
      onHidePanel();

      // Wait for panel to hide
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture screenshot
      const screenshotPath = await captureScreenshot();
      setSelectedScreenshot(screenshotPath);
      return screenshotPath;
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      throw error;
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

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

  const filteredReports = sortedReports.filter((report) => report.type === reportType);

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
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'priority')}
            className="mr-2 p-2 border rounded"
          >
            <option value="createdAt">Date</option>
            <option value="priority">Priority</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 bg-gray-200 rounded"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
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
          onScreenshotRequest={handleScreenshotRequest}
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
        <h3 className="text-lg font-medium mb-4">Recent {reportType === 'bug' ? 'Bug' : 'Feature'} Reports</h3>
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white border rounded-lg p-4 relative">
              {report.screenshot && (
                <div 
                  className="absolute top-2 right-2 cursor-pointer"
                  onClick={() => setSelectedScreenshot(report.screenshot?.path || null)}
                >
                  <img 
                    src={report.screenshot.path}
                    alt="Screenshot thumbnail" 
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{report.title}</h4>
                  <p className="text-sm text-gray-500">
                    Reported by {report.reportedBy} on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
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
              {report.steps && report.steps.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
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
      </div>
    </div>
  );
}

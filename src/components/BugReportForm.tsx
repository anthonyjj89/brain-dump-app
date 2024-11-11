'use client';

import React, { useState } from 'react';
import { BUG_PRIORITIES } from '@/lib/schemas/bug';

interface BugReportFormProps {
  onSubmitSuccess: () => void;
  reportType: 'bug' | 'feature';
  onScreenshotRequest: () => void;
}

export default function BugReportForm({ onSubmitSuccess, reportType, onScreenshotRequest }: BugReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [screenshotPath, setScreenshotPath] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScreenshot = async () => {
    try {
      setIsCapturingScreenshot(true);
      setErrorMessage(null);

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          displaySurface: 'browser',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Create canvas to draw the frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      // Stop screen capture
      stream.getTracks().forEach(track => track.stop());

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Create form data and send to API
      const formData = new FormData();
      formData.append('screenshot', blob, 'screenshot.png');

      const response = await fetch('/api/screenshots', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot');
      }

      const data = await response.json();
      setScreenshotPath(data.data.path);
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      setErrorMessage('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const reportData = {
        title,
        description,
        steps: steps.filter(step => step.trim() !== ''),
        priority,
        type: reportType,
        screenshot: screenshotPath ? {
          path: screenshotPath,
          timestamp: new Date()
        } : undefined
      };

      const response = await fetch('/api/sync/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      setTitle('');
      setDescription('');
      setSteps(['']);
      setPriority('Medium');
      setScreenshotPath('');
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting report:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>
      {reportType === 'bug' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Steps to Reproduce</label>
          {steps.map((step, index) => (
            <div key={index} className="flex mt-1">
              <input
                type="text"
                value={step}
                onChange={(e) => {
                  const newSteps = [...steps];
                  newSteps[index] = e.target.value;
                  setSteps(newSteps);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <button
                type="button"
                onClick={() => setSteps([...steps, ''])}
                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        >
          {BUG_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Screenshot
          </label>
          <button
            type="button"
            onClick={handleScreenshot}
            disabled={isCapturingScreenshot}
            className={`px-3 py-1 text-sm rounded-md ${
              isCapturingScreenshot
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isCapturingScreenshot ? 'Capturing...' : 'Capture Screenshot'}
          </button>
        </div>
        {screenshotPath && (
          <div className="mt-2 relative">
            <img
              src={screenshotPath}
              alt="Screenshot"
              className="max-w-full h-auto rounded border border-gray-300"
            />
            <button
              type="button"
              onClick={() => setScreenshotPath('')}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? 'Submitting...' : `Submit ${reportType === 'bug' ? 'Bug' : 'Feature'} Report`}
      </button>
    </form>
  );
}

'use client';

import { useState, FormEvent } from 'react';

interface BugReportFormProps {
  onSubmitSuccess?: () => void;
}

export default function BugReportForm({ onSubmitSuccess }: BugReportFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [steps, setSteps] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [screenshot, setScreenshot] = useState<{ path: string; timestamp: Date } | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  async function handleScreenshot() {
    try {
      setIsCapturingScreenshot(true);
      setError('');

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
      setScreenshot({
        path: data.data.path,
        timestamp: new Date(data.data.timestamp)
      });
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      setError('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturingScreenshot(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sync/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          priority,
          reportedBy: 'User', // TODO: Add user authentication
          steps: steps.filter(step => step.trim() !== ''),
          screenshot
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit bug report');
      }

      setTitle('');
      setSteps(['']);
      setPriority('Medium');
      setScreenshot(null);
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Bug Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the bug briefly"
          required
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Steps to Reproduce
        </label>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={step}
                onChange={(e) => updateStep(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Step ${index + 1}`}
                required
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            + Add Step
          </button>
        </div>
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
        {screenshot && (
          <div className="mt-2 relative">
            <img
              src={screenshot.path}
              alt="Bug screenshot"
              className="w-full rounded-md border border-gray-200"
            />
            <button
              type="button"
              onClick={() => setScreenshot(null)}
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
        className={`w-full py-2 px-4 rounded-md text-white transition-colors
          ${isSubmitting 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
      </button>
    </form>
  );
}

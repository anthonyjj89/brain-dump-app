'use client';

import { useState, FormEvent } from 'react';

interface ThoughtFormProps {
  onSubmitSuccess?: () => void;
}

export default function ThoughtForm({ onSubmitSuccess }: ThoughtFormProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit thought');
      }

      const data = await response.json();
      setContent('');
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
        <label htmlFor="content" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          What&apos;s on your mind?
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            bg-white dark:bg-gray-800
            text-gray-800 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Type your thought here..."
          required
        />
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
          Input Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            bg-white dark:bg-gray-800
            text-gray-800 dark:text-gray-100"
        >
          <option value="text">Text</option>
          <option value="voice">Voice</option>
        </select>
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
        {isSubmitting ? 'Submitting...' : 'Submit Thought'}
      </button>
    </form>
  );
}

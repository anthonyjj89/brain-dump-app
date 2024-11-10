'use client';

import { useState, useEffect } from 'react';

interface ProcessedContent {
  title?: string;
  dueDate?: string;
  priority?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  details?: string;
  tags?: string[];
}

interface Thought {
  _id: string;
  content: string;
  thoughtType: 'task' | 'event' | 'note';
  processedContent: ProcessedContent;
  status: string;
  createdAt: string;
}

export default function ReviewCards() {
  const [cards, setCards] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  async function fetchCards() {
    try {
      const response = await fetch('/api/review?status=pending');
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      const data = await response.json();
      setCards(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review cards');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(cardId: string, action: 'approve' | 'reject') {
    try {
      const response = await fetch(`/api/review?action=${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: cardId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} card`);
      }

      // Remove the card from the list
      setCards(cards.filter(card => card._id !== cardId));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} card`);
    }
  }

  function renderProcessedContent(type: string, content: ProcessedContent) {
    switch (type) {
      case 'task':
        return (
          <div className="space-y-1 text-sm text-gray-600">
            {content.title && <p className="font-medium">{content.title}</p>}
            {content.dueDate && <p>Due: {content.dueDate}</p>}
            {content.priority && <p>Priority: {content.priority}</p>}
          </div>
        );
      case 'event':
        return (
          <div className="space-y-1 text-sm text-gray-600">
            {content.title && <p className="font-medium">{content.title}</p>}
            {content.eventDate && <p>Date: {content.eventDate}</p>}
            {content.eventTime && <p>Time: {content.eventTime}</p>}
            {content.location && <p>Location: {content.location}</p>}
          </div>
        );
      case 'note':
        return (
          <div className="space-y-1 text-sm text-gray-600">
            {content.title && <p className="font-medium">{content.title}</p>}
            {content.details && <p>{content.details}</p>}
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cards to review at the moment.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {cards.map((card) => (
        <div key={card._id} className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                card.thoughtType === 'task' ? 'bg-blue-100 text-blue-800' :
                card.thoughtType === 'event' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {card.thoughtType.charAt(0).toUpperCase() + card.thoughtType.slice(1)}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(card.createdAt).toLocaleString()}
              </span>
            </div>
            
            <p className="text-gray-800 mb-2">{card.content}</p>
            
            {card.processedContent && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                {renderProcessedContent(card.thoughtType, card.processedContent)}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleAction(card._id, 'approve')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => handleAction(card._id, 'reject')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

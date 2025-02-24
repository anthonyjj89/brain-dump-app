'use client';

import { useState, useEffect } from 'react';
import ThoughtForm from '@/components/ThoughtForm';
import AllThoughtsView from '@/components/Views/AllThoughtsView';
import TasksView from '@/components/Views/TasksView';
import EventsView from '@/components/Views/EventsView';
import NotesView from '@/components/Views/NotesView';
import TabNav from '@/components/Navigation/TabNav';

type ViewType = 'all' | 'tasks' | 'events' | 'notes';
type StatusType = 'pending' | 'approved';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [currentStatus, setCurrentStatus] = useState<StatusType>('approved');
  const [newThoughtAdded, setNewThoughtAdded] = useState(false);

  // Switch to pending tab when new thoughts are added
  useEffect(() => {
    if (newThoughtAdded && currentStatus !== 'pending') {
      setCurrentStatus('pending');
      setNewThoughtAdded(false);
    }
  }, [newThoughtAdded, currentStatus]);

  // Subscribe to thought creation events
  useEffect(() => {
    const handleThoughtCreated = () => {
      setNewThoughtAdded(true);
    };

    window.addEventListener('thought-created', handleThoughtCreated);
    return () => window.removeEventListener('thought-created', handleThoughtCreated);
  }, []);

  const tabs = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'tasks', label: 'Tasks', icon: '✓' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'notes', label: 'Notes', icon: '📝' }
  ];

  const renderView = () => {
    switch (currentView) {
      case 'tasks':
        return <TasksView status={currentStatus} />;
      case 'events':
        return <EventsView status={currentStatus} />;
      case 'notes':
        return <NotesView status={currentStatus} />;
      default:
        return <AllThoughtsView status={currentStatus} />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Brain Dump</h1>
          <p className="text-gray-400">Capture, categorize, and sync your thoughts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">New Thought</h2>
            <ThoughtForm />
          </div>

          {/* Views Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            {/* Master Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setCurrentStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStatus === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setCurrentStatus('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStatus === 'approved'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                Approved
              </button>
            </div>

            {/* Sub Tabs */}
            <TabNav
              tabs={tabs}
              currentTab={currentView}
              onTabChange={(tab) => setCurrentView(tab as ViewType)}
            />

            {/* Content */}
            <div className="mt-6">
              {renderView()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

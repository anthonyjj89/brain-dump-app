'use client';

import { useState } from 'react';
import ThoughtForm from '@/components/ThoughtForm';
import AdminPanel from '@/components/AdminPanel';
import Logo from '@/components/shared/Logo';
import TabNav from '@/components/Navigation/TabNav';
import AllThoughtsView from '@/components/Views/AllThoughtsView';

type Tab = 'all' | 'tasks' | 'events' | 'notes';
type Status = 'pending' | 'approved' | 'rejected';

export default function Home() {
  const [activeTab, setActiveTab] = useState('all');
  const [status, setStatus] = useState<Status>('pending');

  return (
    <main className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto">
        <Logo className="mb-8 relative" />
        
        {/* Main Input Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-white">Dump Your Thoughts</h2>
          <div className="bg-slate-800 shadow-lg rounded-lg p-6 border border-slate-700">
            <ThoughtForm />
          </div>
        </section>

        {/* Status Filter */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'pending'
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatus('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'approved'
                ? 'bg-green-500 text-black'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'rejected'
                ? 'bg-red-500 text-black'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <TabNav
            activeTab={activeTab}
            onTabChange={(tab: string) => setActiveTab(tab as Tab)}
            tabs={[
              { id: 'all', label: '💩 All Dumps' },
              { id: 'tasks', label: '📝 Tasks' },
              { id: 'events', label: '📅 Events' },
              { id: 'notes', label: '📋 Notes' }
            ]}
          />
        </div>

        {/* Content */}
        <AllThoughtsView
          status={status}
          thoughtType={activeTab === 'all' ? undefined : activeTab === 'tasks' ? 'task' : activeTab === 'events' ? 'event' : 'note'}
        />

        {/* Admin Panel */}
        <AdminPanel />
      </div>
    </main>
  );
}

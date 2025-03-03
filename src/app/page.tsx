'use client';

import { useState, useEffect, useCallback } from 'react';
import ThoughtForm from '@/components/ThoughtForm';
import DaySummarizer from '@/components/DaySummarizer';
import AllThoughtsView from '@/components/Views/AllThoughtsView';
import TasksView from '@/components/Views/TasksView';
import EventsView from '@/components/Views/EventsView';
import NotesView from '@/components/Views/NotesView';
import TabNav from '@/components/Navigation/TabNav';
import ClientBody from '@/components/ClientBody';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type ViewType = 'all' | 'tasks' | 'events' | 'notes';
type StatusType = 'pending' | 'approved';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('all');
  const [currentStatus, setCurrentStatus] = useState<StatusType>('approved');
  const [newThoughtAdded, setNewThoughtAdded] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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

  // Remember panel collapse state
  useEffect(() => {
    const savedState = localStorage.getItem('thoughtsPanelCollapsed');
    if (savedState !== null) {
      setIsPanelCollapsed(savedState === 'true');
    }
  }, []);

  const togglePanel = useCallback(() => {
    const newState = !isPanelCollapsed;
    setIsPanelCollapsed(newState);
    localStorage.setItem('thoughtsPanelCollapsed', String(newState));
  }, [isPanelCollapsed]);

  const tabs = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'tasks', label: 'Tasks', icon: '✓' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'notes', label: 'Notes', icon: '📝' }
  ];

  return (
    <ClientBody
      isPanelCollapsed={isPanelCollapsed}
      togglePanel={togglePanel}
    >
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-2">
          {/* Main Content Grid - adaptive columns based on collapse state */}
          <div className={cn(
            "grid gap-4",
            isMobile 
              ? "grid-rows-[auto_1fr_auto] h-[calc(100vh-180px)]" 
              : isPanelCollapsed 
                ? "grid-cols-1 lg:grid-cols-2 h-[calc(100vh-120px)] min-h-[600px]" 
                : "grid-cols-1 lg:grid-cols-3 h-[calc(100vh-120px)] min-h-[600px]"
          )}>
            {/* Input Section - Direct ThoughtForm without Card wrapper */}
            <div className={cn(
              "flex flex-col overflow-auto scrollbar-thin rounded-lg shadow-md border bg-card",
              isMobile ? "h-full row-start-1" : "h-full"
            )}>
              <ThoughtForm />
            </div>

            {/* Day Summarizer - Bottom on mobile, side column on desktop */}
            <div className={cn(
              "flex flex-col",
              isMobile 
                ? "h-auto row-start-3 mt-4" 
                : "h-full order-3 lg:order-2"
            )}>
              <DaySummarizer />
            </div>

            {/* Views Section - conditionally shown based on collapse state */}
            {!isPanelCollapsed && (
              <Card className={cn(
                "flex flex-col overflow-hidden",
                isMobile ? "order-2 row-start-2" : "h-full order-2 lg:order-3"
              )}>
                <CardHeader className="pb-0 sticky top-0 z-10 backdrop-blur-sm bg-background/90">
                  {/* Status Tabs */}
                  <div className="flex gap-2 mb-6">
                    <Button
                      onClick={() => setCurrentStatus('pending')}
                      variant={currentStatus === 'pending' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Pending
                    </Button>
                    <Button
                      onClick={() => setCurrentStatus('approved')}
                      variant={currentStatus === 'approved' ? 'success' : 'outline'}
                      size="sm"
                    >
                      Approved
                    </Button>
                  </div>

                  {/* Category Tabs */}
                  <TabNav
                    tabs={tabs}
                    currentTab={currentView}
                    onTabChange={(tab) => setCurrentView(tab as ViewType)}
                  />
                </CardHeader>
                
                <CardContent className="pt-6 overflow-auto scrollbar-thin">
                  <Tabs value={currentView}>
                    <TabsContent value="all" className="m-0">
                      {currentView === 'all' && <AllThoughtsView status={currentStatus} />}
                    </TabsContent>
                    <TabsContent value="tasks" className="m-0">
                      {currentView === 'tasks' && <TasksView status={currentStatus} />}
                    </TabsContent>
                    <TabsContent value="events" className="m-0">
                      {currentView === 'events' && <EventsView status={currentStatus} />}
                    </TabsContent>
                    <TabsContent value="notes" className="m-0">
                      {currentView === 'notes' && <NotesView status={currentStatus} />}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </ClientBody>
  );
}

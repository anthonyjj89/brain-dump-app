'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  Calendar, 
  CheckSquare, 
  Edit, 
  Star, 
  Clock, 
  Trash2, 
  PenLine, 
  RotateCcw, 
  RotateCw,
  Bot,
  CheckCircle2
} from 'lucide-react';
import { EventEditDialog } from '@/components/dialogs/EventEditDialog';
import { TaskEditDialog } from '@/components/dialogs/TaskEditDialog';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  description?: string;
  isCompleted?: boolean;
}

interface Event {
  id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  person?: string;
}

interface SummaryItem {
  id: string;
  type: 'task' | 'event';
  title: string;
  priority?: string;
  time?: string;
  isCompleted?: boolean;
}

interface SummaryData {
  events: Event[];
  prioritizedTasks: Task[];
  date: string;
  generatedAt: string;
}

export default function DaySummarizer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [userFeedback, setUserFeedback] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [processingInput, setProcessingInput] = useState(false);
  const [updatedItems, setUpdatedItems] = useState<SummaryItem[]>([]);
  
  // Event edit dialog state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'reschedule'>('edit');
  
  // Task edit dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/summary/generate');
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      const data = await response.json();
      
      setSummaryData(data);
      setIsExpanded(true);
      setUserFeedback(null);
      setFeedbackText('');
      setFeedbackSent(false);
      setUpdatedItems([]);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  const handleRatingSelect = (rating: number) => {
    setUserFeedback(rating);
  };

  const handleSubmitFeedback = async () => {
    try {
      await fetch('/api/summary/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: userFeedback,
          feedback: feedbackText,
        }),
      });
      setFeedbackSent(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleStartRecording = () => {
    // In a real app, start voice recording here
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      // Simulate processing voice input
      setUserInput("Move the meeting with Stefan to tomorrow at 2 PM and mark the invoice task as complete");
      processVoiceInput("Move the meeting with Stefan to tomorrow at 2 PM and mark the invoice task as complete");
    }, 2000);
  };

  const handleSubmitInput = () => {
    if (!userInput.trim()) return;
    processVoiceInput(userInput);
  };

  const handleMarkTaskComplete = async (taskId: string) => {
    setProcessingInput(true);
    try {
      // This would be an actual API call in production
      await fetch('/api/summary/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: `Mark task as complete`,
          taskId,
          action: 'complete'
        }),
      });

      // In a real implementation, we'd get the updated task from the API
      // For now we'll simulate the change
      const task = summaryData?.prioritizedTasks.find(t => t.id === taskId);
      if (task) {
        setUpdatedItems([
          ...updatedItems.filter(item => !(item.type === 'task' && item.title === task.title)),
          {
            id: taskId,
            type: 'task' as const,
            title: task.title,
            priority: task.priority,
            isCompleted: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setProcessingInput(false);
    }
  };

  const handleEditTask = (taskId: string) => {
    // Find the task and open the edit dialog
    const task = summaryData?.prioritizedTasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setTaskDialogOpen(true);
    }
  };

  const handleSaveTask = (updatedTask: Task) => {
    // In a real implementation, we'd save to the API
    // For now we'll just update our local state
    if (summaryData) {
      const updatedTasks = summaryData.prioritizedTasks.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      );
      
      setSummaryData({
        ...summaryData,
        prioritizedTasks: updatedTasks
      });

      // Also add to updated items for UI highlighting
      setUpdatedItems([
        ...updatedItems.filter(item => !(item.type === 'task' && item.id === updatedTask.id)),
        {
          id: updatedTask.id,
          type: 'task',
          title: updatedTask.title,
          priority: updatedTask.priority,
          isCompleted: updatedTask.isCompleted
        }
      ]);
    }
  };

  const handleOpenRescheduleDialog = (event: Event) => {
    setEditingEvent(event);
    setEditMode('reschedule');
    setEventDialogOpen(true);
  };

  const handleOpenEditDialog = (event: Event) => {
    setEditingEvent(event);
    setEditMode('edit');
    setEventDialogOpen(true);
  };

  const handleSaveEvent = (updatedEvent: Event) => {
    // In a real implementation, we'd save to the API
    // For now we'll just update our local state
    if (summaryData) {
      const updatedEvents = summaryData.events.map(e => 
        e.id === updatedEvent.id ? updatedEvent : e
      );
      
      setSummaryData({
        ...summaryData,
        events: updatedEvents
      });

      // Also add to updated items for UI highlighting
      setUpdatedItems([
        ...updatedItems.filter(item => !(item.type === 'event' && item.id === updatedEvent.id)),
        {
          id: updatedEvent.id,
          type: 'event',
          title: updatedEvent.title,
          time: updatedEvent.time
        }
      ]);
    }
  };

  const processVoiceInput = async (input: string) => {
    setProcessingInput(true);
    try {
      // This would be an actual API call in production
      const response = await fetch('/api/summary/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          summaryId: summaryData?.generatedAt,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process input');
      }
      
      // In a real implementation, we'd get the updated items from the API
      // For now we'll simulate the changes
      const updatedTaskItems = [
        {
          id: "task-1",
          type: 'task' as const,
          title: "Send invoices to Romario",
          priority: "high",
          isCompleted: true // Marked as complete
        }
      ];
      
      const updatedEventItems = [
        {
          id: "event-1",
          type: 'event' as const,
          title: "Meeting with Stefan",
          time: "Tomorrow at 2:00 PM", // Changed from today to tomorrow
        }
      ];
      
      setUpdatedItems([...updatedTaskItems, ...updatedEventItems]);
      setUserInput('');
    } catch (error) {
      console.error('Error processing input:', error);
    } finally {
      setProcessingInput(false);
    }
  };

  const StarRating = () => (
    <div className="flex gap-2 items-center mt-4">
      <span className="text-sm text-muted-foreground">Rate this summary:</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            variant="ghost"
            size="sm"
            className={cn(
              "p-0 w-8 h-8",
              userFeedback && userFeedback >= rating ? "text-amber-400" : "text-muted"
            )}
            onClick={() => handleRatingSelect(rating)}
          >
            <Star className={cn(
              "h-4 w-4",
              userFeedback && userFeedback >= rating ? "fill-current" : ""
            )} />
          </Button>
        ))}
      </div>
    </div>
  );

  if (!isExpanded) {
    return (
      <Card className="h-full flex flex-col justify-center items-center bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-2 border-dashed border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <Bot className="h-16 w-16 text-primary/60 mb-4" />
          <h3 className="text-xl font-medium mb-2">Your Daily Assistant</h3>
          <p className="text-muted-foreground mb-6">Get a smart overview of your day with tasks prioritized and events organized</p>
          <Button 
            onClick={handleGenerateSummary} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 animate-spin" />
                Generating Summary...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Summarize My Day
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full border-2 border-primary/20 shadow-lg flex flex-col">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 flex-shrink-0">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-medium">
                Your Day at a Glance
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center mt-1">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{summaryData?.date || "Today"}</span>
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={handleCollapse}
          >
            ×
          </Button>
        </CardHeader>
        
        <CardContent className="p-5 space-y-6 overflow-auto scrollbar-thin">
          {/* Events section */}
          <div>
            <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Today&apos;s Schedule</span>
            </h3>
            
            <div className="space-y-3">
              {summaryData?.events.map((event) => {
                // Check if this event was updated through voice/text input
                const updatedEvent = updatedItems.find(
                  item => item.type === 'event' && item.title === event.title
                );
                
                return (
                  <div 
                    key={event.id} 
                    className={cn(
                      "p-3 border rounded-md flex justify-between items-center",
                      updatedEvent ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20" : "border-border"
                    )}
                  >
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        {(event.time || updatedEvent?.time) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className={updatedEvent?.time ? "line-through" : ""}>
                              {event.time}
                            </span>
                            {updatedEvent?.time && (
                              <span className="text-primary">
                                {updatedEvent.time}
                              </span>
                            )}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <span>📍</span> {event.location}
                          </div>
                        )}
                        {event.person && (
                          <div className="flex items-center gap-1">
                            <span>👤</span> {event.person}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenRescheduleDialog(event)}
                      >
                        <RotateCcw className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenEditDialog(event)}
                      >
                        <PenLine className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {summaryData?.events.length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  No events scheduled for today
                </div>
              )}
            </div>
          </div>
          
          {/* Tasks section */}
          <div>
            <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>Priority Tasks</span>
            </h3>
            
            <div className="space-y-3">
              {summaryData?.prioritizedTasks.map((task, index) => {
                // Check if this task was updated through voice/text input
                const updatedTask = updatedItems.find(
                  item => item.type === 'task' && item.title === task.title
                );
                
                return (
                  <div 
                    key={task.id} 
                    className={cn(
                      "p-3 border rounded-md flex justify-between items-center",
                      updatedTask ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20" : "border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="w-5 h-5 flex items-center justify-center bg-primary/10 text-primary font-bold rounded-full text-xs">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <div className={cn(
                          "font-medium",
                          updatedTask?.isCompleted ? "line-through text-muted-foreground" : ""
                        )}>
                          {task.title}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge 
                            variant={task.priority === 'high' ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {task.priority} priority
                          </Badge>
                          {task.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              Due: {task.dueDate}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons or completed badge */}
                    {updatedTask?.isCompleted ? (
                      <Badge variant="success" className="ml-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Done</span>
                      </Badge>
                    ) : (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleMarkTaskComplete(task.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-green-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditTask(task.id)}
                        >
                          <PenLine className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {summaryData?.prioritizedTasks.length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  No priority tasks for today
                </div>
              )}
            </div>
          </div>
          
          {/* Voice/Text input section */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Edit className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Make Changes</h3>
            </div>
            
            {/* Voice input button - full width */}
            <Button
              onClick={handleStartRecording}
              disabled={isRecording}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 mb-3"
            >
              <Mic className={cn(
                "h-4 w-4",
                isRecording ? "text-red-500 animate-pulse" : "text-primary"
              )} />
              {isRecording ? "Listening..." : "Voice Input"}
            </Button>
            
            {/* Text input - full width */}
            <div className="relative w-full mb-3">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type instructions like 'Move meeting with Stefan to 3 PM' or 'Mark invoice task as complete'"
                className="w-full h-20 px-3 py-2 text-sm rounded-md border resize-none"
                disabled={processingInput}
              />
              <Button
                className="absolute right-2 bottom-2 h-6 px-2"
                size="sm"
                disabled={!userInput.trim() || processingInput}
                onClick={handleSubmitInput}
              >
                Submit
              </Button>
            </div>
            
            {/* Feedback section */}
            {!feedbackSent ? (
              <div className="mt-5 pt-5 border-t">
                <StarRating />
                <div className="mt-2">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share your feedback about this summary (optional)"
                    className="w-full h-20 px-3 py-2 text-sm rounded-md border resize-none"
                  />
                  <Button
                    onClick={handleSubmitFeedback}
                    className="mt-2"
                    disabled={!userFeedback}
                  >
                    Submit Feedback
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 pt-5 border-t text-center text-green-600 dark:text-green-400">
                Thank you for your feedback! We&apos;ll use it to improve your summaries.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Edit Dialog */}
      <EventEditDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        event={editingEvent}
        onSave={handleSaveEvent}
        mode={editMode}
      />

      {/* Task Edit Dialog */}
      <TaskEditDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </>
  );
}

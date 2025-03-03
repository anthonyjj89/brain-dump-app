import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { CheckSquare, ListChecks, Calendar, AlignLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  description?: string;
  isCompleted?: boolean;
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (task: Task) => void;
}

export function TaskEditDialog({ open, onOpenChange, task, onSave }: TaskEditDialogProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('normal');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setPriority(task.priority || 'normal');
      
      // Set date if available
      if (task.dueDate) {
        try {
          const parsedDate = new Date(task.dueDate);
          if (!isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
          }
        } catch (e) {
          console.error("Error parsing date", e);
        }
      } else {
        setSelectedDate(undefined);
      }
      
      setDescription(task.description || '');
      setIsCompleted(task.isCompleted || false);
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    
    // Format date for saving
    const formattedDate = selectedDate ? selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }) : undefined;

    onSave({
      ...task,
      title,
      priority,
      dueDate: formattedDate,
      description,
      isCompleted
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <span>Edit Task</span>
          </DialogTitle>
          <DialogDescription>
            Make changes to the task details below
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right flex items-center justify-end">
              <ListChecks className="h-4 w-4 mr-2" />
              Priority
            </Label>
            <div className="col-span-3 grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={priority === 'low' ? 'default' : 'outline'}
                className={`${priority === 'low' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                onClick={() => setPriority('low')}
              >
                Low
              </Button>
              <Button
                type="button"
                variant={priority === 'normal' ? 'default' : 'outline'}
                className={`${priority === 'normal' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                onClick={() => setPriority('normal')}
              >
                Normal
              </Button>
              <Button
                type="button"
                variant={priority === 'high' ? 'default' : 'outline'}
                className={`${priority === 'high' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                onClick={() => setPriority('high')}
              >
                High
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right flex items-center justify-end">
              <Calendar className="h-4 w-4 mr-2" />
              Due Date
            </Label>
            <div className="col-span-3">
              <DatePicker 
                date={selectedDate}
                setDate={setSelectedDate}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="completed" className="text-right flex items-center justify-end">
              <CheckSquare className="h-4 w-4 mr-2" />
              Completed
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="completed"
                checked={isCompleted}
                onCheckedChange={setIsCompleted}
              />
              <span className="text-sm text-muted-foreground">
                {isCompleted ? 'Task completed' : 'Task not completed'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <Label htmlFor="description" className="text-right flex items-start mt-2 justify-end">
              <AlignLeft className="h-4 w-4 mr-2" />
              Description
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add more details about this task..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

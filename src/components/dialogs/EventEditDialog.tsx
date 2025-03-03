import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { MapPin, User, CalendarDays, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  person?: string;
}

interface EventEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onSave: (event: Event) => void;
  mode: 'edit' | 'reschedule';
}

export function EventEditDialog({ open, onOpenChange, event, onSave, mode }: EventEditDialogProps) {
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [timeString, setTimeString] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [person, setPerson] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      // Set date if available
      if (event.date) {
        // This is a simple conversion, you may need a more robust date parser
        try {
          const parsedDate = new Date(event.date);
          if (!isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
          }
        } catch (e) {
          console.error("Error parsing date", e);
        }
      }
      setTimeString(event.time);
      setLocation(event.location || '');
      setPerson(event.person || '');
    }
  }, [event]);

  const handleSave = () => {
    if (!event) return;
    
    // Format date for saving
    const formattedDate = selectedDate ? selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }) : event.date;

    onSave({
      ...event,
      title,
      date: formattedDate,
      time: timeString,
      location,
      person,
    });
    
    onOpenChange(false);
  };

  const isRescheduleMode = mode === 'reschedule';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isRescheduleMode ? 'Reschedule Event' : 'Edit Event'}
          </DialogTitle>
          <DialogDescription>
            {isRescheduleMode 
              ? "Update the date and time for this event" 
              : "Make changes to the event details below"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isRescheduleMode && (
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
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right flex items-center justify-end">
              <CalendarDays className="h-4 w-4 mr-2" />
              Date
            </Label>
            <div className="col-span-3">
              <DatePicker 
                date={selectedDate} 
                setDate={setSelectedDate}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right flex items-center justify-end">
              <Clock className="h-4 w-4 mr-2" />
              Time
            </Label>
            <div className="col-span-3">
              <TimePicker 
                time={timeString} 
                setTime={setTimeString}
              />
            </div>
          </div>
          
          {!isRescheduleMode && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right flex items-center justify-end">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  className="col-span-3"
                  placeholder="Where is this event?"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="person" className="text-right flex items-center justify-end">
                  <User className="h-4 w-4 mr-2" />
                  Person
                </Label>
                <Input
                  id="person"
                  value={person}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPerson(e.target.value)}
                  className="col-span-3"
                  placeholder="Who is involved?"
                />
              </div>
            </>
          )}
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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCw, 
  CheckSquare, 
  Calendar, 
  FileText, 
  HelpCircle, 
  AlertTriangle, 
  MapPin, 
  User, 
  Clock, 
  Tag 
} from 'lucide-react';
import 'react-swipeable-list/dist/styles.css';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  thought: {
    id: string;
    thoughtType: 'task' | 'event' | 'note' | 'uncertain';
    confidence?: 'high' | 'low';
    possibleTypes?: Array<'task' | 'event' | 'note'>;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    processedContent: {
      title?: string;
      dueDate?: string;
      priority?: string;
      eventDate?: string;
      eventTime?: string;
      date?: string;
      time?: string;
      location?: string;
      person?: string;
      details?: string;
      tags?: string[];
      suggestedDate?: string;
      suggestedAction?: string;
    };
  };
  onTypeChange?: (id: string, newType: 'task' | 'event' | 'note') => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onFix?: (id: string, method: 'voice' | 'text') => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function ContentCard({ thought, onTypeChange, onApprove, onReject, onFix, onDelete, showDelete }: ContentCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'uncertain': return <HelpCircle className="h-4 w-4" />;
      default: return <div className="h-4 w-4 rounded-full bg-current"></div>;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'task': return 'info';
      case 'event': return 'secondary';
      case 'note': return 'default';
      case 'uncertain': return 'warning';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    if (onDelete) {
      try {
        await onDelete(thought.id);
      } catch (error) {
        console.error("Error in onDelete:", error);
      } finally {
        setIsDeleting(false);
      }
    } else {
      setIsDeleting(false);
    }
    setIsConfirmingDelete(false);
  }

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        exit={{ 
          opacity: 0, 
          y: -20,
          transition: { duration: 0.3 }
        }}
      >
        <Card className="relative overflow-hidden">
          {/* Gradient line at bottom */}
          <div className="absolute inset-x-0 -bottom-px h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          {/* Header */}
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`bg-background border border-border w-6 h-6 rounded-full flex items-center justify-center text-${getTypeBadgeVariant(thought.thoughtType)}`}>
                  {getIcon(thought.thoughtType)}
                </span>
                <h3 className="font-medium">
                  {thought.processedContent.title || 'Untitled'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {thought.confidence === 'low' && (
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Low Confidence</span>
                  </div>
                )}
                <Badge variant={getStatusBadgeVariant(thought.status)}>
                  {getStatusText(thought.status)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="text-sm text-muted-foreground">
          {thought.thoughtType === 'task' && (
            <>
              {thought.processedContent.dueDate && (
                <div className="flex items-center gap-1 text-blue-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Due: {thought.processedContent.dueDate}</span>
                </div>
              )}
              {thought.processedContent.priority && (
                <div className="flex items-center gap-1 text-blue-400 mt-1">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Priority: {thought.processedContent.priority}</span>
                </div>
              )}
            </>
          )}

          {thought.thoughtType === 'event' && (
            <>
              {(thought.processedContent.eventDate || thought.processedContent.date) && (
                <div className="flex items-center gap-1 text-green-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date: {thought.processedContent.eventDate || thought.processedContent.date}</span>
                </div>
              )}
              {(thought.processedContent.eventTime || thought.processedContent.time) && (
                <div className="flex items-center gap-1 text-green-400 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Time: {thought.processedContent.eventTime || thought.processedContent.time}</span>
                </div>
              )}
              {thought.processedContent.location && (
                <div className="flex items-center gap-1 text-green-400 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Location: {thought.processedContent.location}</span>
                </div>
              )}
              {thought.processedContent.person && (
                <div className="flex items-center gap-1 text-green-400 mt-1">
                  <User className="h-3.5 w-3.5" />
                  <span>With: {thought.processedContent.person}</span>
                </div>
              )}
            </>
          )}

          {thought.thoughtType === 'note' && (
            <>
              <div>{thought.processedContent.details}</div>
              {thought.processedContent.tags && thought.processedContent.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {thought.processedContent.tags.map((tag, index) => (
                    <span key={index} className="bg-slate-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {thought.thoughtType === 'uncertain' && (
            <>
              <div>{thought.content}</div>
              {thought.processedContent.suggestedDate && (
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Date Mentioned: {thought.processedContent.suggestedDate}</span>
                </div>
              )}
              {thought.processedContent.suggestedAction && (
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Action Mentioned: {thought.processedContent.suggestedAction}</span>
                </div>
              )}
            </>
          )}
          </CardContent>

          {/* Actions */}
          <CardFooter className={cn(
            "flex gap-2",
            thought.thoughtType === 'uncertain' && "flex-wrap"
          )}>
          {/* Type Change Buttons */}
          {thought.thoughtType === 'uncertain' && onTypeChange && (
            <>
              {thought.possibleTypes?.includes('task') && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onTypeChange(thought.id, 'task')}
                  className="flex items-center gap-1"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Make Task</span>
                </Button>
              )}
              {thought.possibleTypes?.includes('event') && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onTypeChange(thought.id, 'event')}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Make Event</span>
                </Button>
              )}
              {thought.possibleTypes?.includes('note') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTypeChange(thought.id, 'note')}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Make Note</span>
                </Button>
              )}
            </>
          )}

          {/* Approve/Reject/Fix Buttons */}
          {thought.status === 'pending' && (
            <div className="flex gap-2 ml-auto">
              {onApprove && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onApprove(thought.id)}
                >
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(thought.id)}
                >
                  Reject
                </Button>
              )}
              {onFix && (
                <div className="relative inline-block">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onFix(thought.id, 'text')}
                  >
                    Fix
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Delete button and confirmation */}
          {showDelete && thought.status === 'approved' && (
            <div className="flex gap-2 ml-auto">
              {!isConfirmingDelete && !isDeleting && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                >
                  Delete
                </Button>
              )}
              {isDeleting && (
                <span className="px-3 py-1 text-destructive text-sm">
                  <RotateCw className="h-4 w-4 animate-spin" />
                </span>
              )}
              {isConfirmingDelete && !isDeleting && (
                <>
                  <Button
                    onClick={handleConfirmDelete}
                    variant="destructive"
                    size="sm"
                  >
                    Confirm
                  </Button>
                  <Button
                    onClick={handleCancelDelete}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
